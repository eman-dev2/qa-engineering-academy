/**
 * Seed logic, shared by the CLI (seed/index.ts), the reset script and the tests.
 *
 * Safety rules:
 * - Content is inserted only when its slug doesn't exist yet. Existing rows (including edits made in
 *   the admin studio) are kept unless `forceContent` is set explicitly.
 * - Demo accounts are development-only and refused when NODE_ENV=production.
 * - Nothing is ever deleted except demo accounts on an explicit `reset`.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { parseFrontmatter } from "./frontmatter";
import { and, eq } from "drizzle-orm";
import type { DB } from "../src/lib/db/connection";
import * as s from "../src/lib/db/schema";
import { hashPassword } from "../src/lib/auth/password";
import {
  lessonSharedSchema,
  lessonTextSchema,
  quizKeysMatch,
  MIN_BODY_WORDS,
  wordCount,
  type LessonShared,
  type LessonText,
} from "../src/lib/content/schema";
import { seedPaths, type SeedLessonRef } from "./content/paths";
import { seedCertifications } from "./content/certifications";
import { seedVideos } from "./content/videos";
import { seedTemplates, seedProjects } from "./content/library";

export type SeedOptions = { forceContent?: boolean };
export type SeedReport = Record<string, { inserted: number; updated: number; kept: number }>;

export const LESSON_DIR = path.join(process.cwd(), "seed", "content", "lessons");
const json = (v: unknown) => JSON.stringify(v ?? []);

export { MIN_BODY_WORDS, wordCount };

/* ------------------------------------------------------------------ */
/* Lesson files                                                        */
/* ------------------------------------------------------------------ */

export type LessonFileText = LessonText & { body: string };
export type LoadedLesson = { shared: LessonShared; en: LessonFileText; ar: LessonFileText | null };

function formatIssues(file: string, issues: { path: PropertyKey[]; message: string }[]) {
  return `Invalid frontmatter in ${path.relative(process.cwd(), file)}:\n${issues
    .map((i) => `  - ${i.path.map(String).join(".")}: ${i.message}`)
    .join("\n")}`;
}

/** Load and validate a published lesson's English (required) and Arabic (optional) files. */
export function loadLessonFiles(pathSlug: string, slug: string): LoadedLesson {
  const enFile = path.join(LESSON_DIR, pathSlug, `${slug}.en.md`);
  const arFile = path.join(LESSON_DIR, pathSlug, `${slug}.ar.md`);
  const en = parseFrontmatter(fs.readFileSync(enFile, "utf8"));
  const shared = lessonSharedSchema.safeParse(en.data);
  if (!shared.success) throw new Error(formatIssues(enFile, shared.error.issues));
  const enText = lessonTextSchema.safeParse(en.data);
  if (!enText.success) throw new Error(formatIssues(enFile, enText.error.issues));
  if (wordCount(en.content) < MIN_BODY_WORDS) throw new Error(`${enFile}: lesson body is too short to publish.`);

  let ar: LoadedLesson["ar"] = null;
  if (fs.existsSync(arFile)) {
    const parsed = parseFrontmatter(fs.readFileSync(arFile, "utf8"));
    const arText = lessonTextSchema.safeParse(parsed.data);
    if (!arText.success) throw new Error(formatIssues(arFile, arText.error.issues));
    if (!quizKeysMatch(enText.data.quiz, arText.data.quiz)) {
      throw new Error(`${arFile}: knowledge check ids, option ids and answers must match the English file.`);
    }
    if (wordCount(parsed.content) < MIN_BODY_WORDS) throw new Error(`${arFile}: lesson body is too short to publish.`);
    ar = { ...arText.data, body: parsed.content };
  }
  return { shared: shared.data, en: { ...enText.data, body: en.content }, ar };
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

function bump(report: SeedReport, key: string, field: "inserted" | "updated" | "kept") {
  report[key] ??= { inserted: 0, updated: 0, kept: 0 };
  report[key][field] += 1;
}

export function lessonTranslationValues(t: LessonFileText) {
  return {
    title: t.title,
    summary: t.summary,
    body: t.body,
    objectivesJson: json(t.objectives),
    prerequisitesJson: json(t.prerequisites),
    keyTermsJson: json(t.keyTerms),
    mistakesJson: json(t.mistakes),
    exerciseJson: JSON.stringify(t.exercise),
    quizJson: json(t.quiz),
    referencesJson: json(t.references),
  };
}

function upsertLessonTranslation(db: DB, lessonId: number, locale: s.Locale, values: ReturnType<typeof lessonTranslationValues>) {
  db.insert(s.lessonTranslations)
    .values({ lessonId, locale, ...values })
    .onConflictDoUpdate({ target: [s.lessonTranslations.lessonId, s.lessonTranslations.locale], set: values })
    .run();
}

/** Insert a translation only if that language doesn't exist yet. Returns 1 when inserted. */
function insertMissingTranslation(db: DB, lessonId: number, locale: s.Locale, values: ReturnType<typeof lessonTranslationValues>): number {
  const res = db.insert(s.lessonTranslations).values({ lessonId, locale, ...values }).onConflictDoNothing().run();
  return res.changes;
}

function seedLesson(
  db: DB,
  report: SeedReport,
  pathId: number,
  pathSlug: string,
  moduleId: number,
  position: number,
  ref: SeedLessonRef,
  force: boolean,
) {
  const now = new Date();
  const existing = db
    .select({ id: s.lessons.id })
    .from(s.lessons)
    .where(and(eq(s.lessons.pathId, pathId), eq(s.lessons.slug, ref.slug)))
    .get();
  if (existing && !force) {
    // Never overwrite an existing lesson, but add translations that didn't exist when it was
    // first seeded (for example a new Arabic file), so they reach existing databases.
    if (ref.published) {
      const loaded = loadLessonFiles(pathSlug, ref.slug);
      const added =
        insertMissingTranslation(db, existing.id, "en", lessonTranslationValues(loaded.en)) +
        (loaded.ar ? insertMissingTranslation(db, existing.id, "ar", lessonTranslationValues(loaded.ar)) : 0);
      if (added > 0) bump(report, "lesson translations", "inserted");
    }
    return bump(report, "lessons", "kept");
  }

  if (ref.published) {
    const loaded = loadLessonFiles(pathSlug, ref.slug);
    const row = {
      pathId,
      moduleId,
      slug: ref.slug,
      position,
      minutes: loaded.shared.minutes,
      level: loaded.shared.level,
      skillsJson: json(loaded.shared.skills),
      status: "published" as const,
      reviewedOn: loaded.shared.reviewedOn,
      publishedAt: now,
      updatedAt: now,
    };
    let id: number;
    if (existing) {
      db.update(s.lessons).set(row).where(eq(s.lessons.id, existing.id)).run();
      id = existing.id;
    } else {
      id = db.insert(s.lessons).values({ ...row, createdAt: now }).returning({ id: s.lessons.id }).get().id;
    }
    upsertLessonTranslation(db, id, "en", lessonTranslationValues(loaded.en));
    if (loaded.ar) upsertLessonTranslation(db, id, "ar", lessonTranslationValues(loaded.ar));
    bump(report, "lessons", existing ? "updated" : "inserted");
    return;
  }

  const row = {
    pathId,
    moduleId,
    slug: ref.slug,
    position,
    minutes: ref.minutes,
    level: ref.level,
    skillsJson: json(ref.skills),
    status: "planned" as const,
    reviewedOn: null,
    updatedAt: now,
  };
  let id: number;
  if (existing) {
    db.update(s.lessons).set(row).where(eq(s.lessons.id, existing.id)).run();
    id = existing.id;
  } else {
    id = db.insert(s.lessons).values({ ...row, createdAt: now }).returning({ id: s.lessons.id }).get().id;
  }
  for (const locale of s.locales) {
    const o = ref.outline[locale];
    const values = {
      title: o.title,
      summary: o.summary,
      body: "",
      objectivesJson: json(o.objectives),
      prerequisitesJson: "[]",
      keyTermsJson: "[]",
      mistakesJson: "[]",
      exerciseJson: null,
      quizJson: "[]",
      referencesJson: "[]",
    };
    db.insert(s.lessonTranslations)
      .values({ lessonId: id, locale, ...values })
      .onConflictDoUpdate({ target: [s.lessonTranslations.lessonId, s.lessonTranslations.locale], set: values })
      .run();
  }
  bump(report, "lessons", existing ? "updated" : "inserted");
}

export function seedContent(db: DB, opts: SeedOptions = {}): SeedReport {
  const force = !!opts.forceContent;
  const report: SeedReport = {};
  const now = new Date();

  db.transaction((tx) => {
    const t = tx as unknown as DB;

    // Paths, modules, lessons
    seedPaths.forEach((p, pi) => {
      const existing = t.select({ id: s.learningPaths.id }).from(s.learningPaths).where(eq(s.learningPaths.slug, p.slug)).get();
      let pathId: number;
      const row = {
        slug: p.slug,
        startsAt: p.startsAt,
        leadsTo: p.leadsTo,
        skillsJson: json(p.skills),
        status: p.status,
        position: pi + 1,
        updatedAt: now,
      };
      if (existing && !force) {
        pathId = existing.id;
        bump(report, "paths", "kept");
      } else {
        if (existing) {
          t.update(s.learningPaths).set(row).where(eq(s.learningPaths.id, existing.id)).run();
          pathId = existing.id;
        } else {
          pathId = t.insert(s.learningPaths).values({ ...row, createdAt: now }).returning({ id: s.learningPaths.id }).get().id;
        }
        for (const locale of s.locales) {
          const tr = p.text[locale];
          const values = {
            title: tr.title,
            summary: tr.summary,
            goal: tr.goal,
            prerequisitesJson: json(tr.prerequisites),
            outcomesJson: json(tr.outcomes),
            milestonesJson: json(tr.milestones),
          };
          t.insert(s.pathTranslations)
            .values({ pathId, locale, ...values })
            .onConflictDoUpdate({ target: [s.pathTranslations.pathId, s.pathTranslations.locale], set: values })
            .run();
        }
        bump(report, "paths", existing ? "updated" : "inserted");
      }

      let lessonPosition = 0;
      p.modules.forEach((m, mi) => {
        const existingModule = t
          .select({ id: s.modules.id })
          .from(s.modules)
          .where(and(eq(s.modules.pathId, pathId), eq(s.modules.slug, m.slug)))
          .get();
        let moduleId: number;
        if (existingModule && !force) {
          moduleId = existingModule.id;
          bump(report, "modules", "kept");
        } else {
          if (existingModule) {
            t.update(s.modules).set({ position: mi + 1 }).where(eq(s.modules.id, existingModule.id)).run();
            moduleId = existingModule.id;
          } else {
            moduleId = t.insert(s.modules).values({ pathId, slug: m.slug, position: mi + 1 }).returning({ id: s.modules.id }).get().id;
          }
          for (const locale of s.locales) {
            const values = { title: m.text[locale].title, summary: m.text[locale].summary };
            t.insert(s.moduleTranslations)
              .values({ moduleId, locale, ...values })
              .onConflictDoUpdate({ target: [s.moduleTranslations.moduleId, s.moduleTranslations.locale], set: values })
              .run();
          }
          bump(report, "modules", existingModule ? "updated" : "inserted");
        }
        for (const ref of m.lessons) {
          lessonPosition += 1;
          seedLesson(t, report, pathId, p.slug, moduleId, lessonPosition, ref, force);
        }
      });
    });

    // Certifications
    seedCertifications.forEach((c, ci) => {
      const existing = t.select({ id: s.certifications.id }).from(s.certifications).where(eq(s.certifications.slug, c.slug)).get();
      if (existing && !force) return bump(report, "certifications", "kept");
      const row = {
        slug: c.slug,
        code: c.code,
        name: c.name,
        issuer: c.issuer,
        version: c.version,
        stream: c.stream,
        sourceUrl: c.sourceUrl,
        reviewedOn: c.reviewedOn,
        verified: c.verified,
        examJson: c.exam ? JSON.stringify(c.exam) : null,
        chaptersJson: json(c.chapters),
        officialLinksJson: json(c.officialLinks),
        relatedPathsJson: json(c.relatedPaths),
        position: ci + 1,
        updatedAt: now,
      };
      let id: number;
      if (existing) {
        t.update(s.certifications).set(row).where(eq(s.certifications.id, existing.id)).run();
        id = existing.id;
      } else {
        id = t.insert(s.certifications).values(row).returning({ id: s.certifications.id }).get().id;
      }
      for (const locale of s.locales) {
        const tr = c.text[locale];
        const values = {
          summary: tr.summary ?? null,
          audienceJson: json(tr.audience),
          prerequisitesJson: json(tr.prerequisites),
          chaptersJson: tr.chapters ? JSON.stringify(tr.chapters) : null,
          studyPlanJson: json(tr.studyPlan),
          practiceJson: json(tr.practice),
        };
        t.insert(s.certificationTranslations)
          .values({ certificationId: id, locale, ...values })
          .onConflictDoUpdate({
            target: [s.certificationTranslations.certificationId, s.certificationTranslations.locale],
            set: values,
          })
          .run();
      }
      bump(report, "certifications", existing ? "updated" : "inserted");
    });

    // Videos
    for (const v of seedVideos) {
      const existing = t.select({ id: s.videos.id }).from(s.videos).where(eq(s.videos.youtubeId, v.youtubeId)).get();
      if (existing && !force) {
        bump(report, "videos", "kept");
        continue;
      }
      const row = {
        youtubeId: v.youtubeId,
        title: v.title,
        creator: v.creator,
        creatorUrl: v.creatorUrl,
        language: v.language,
        level: v.level,
        skillsJson: json(v.skills),
        relatedLessonsJson: json(v.relatedLessons),
        status: "published" as const,
        verifiedOn: v.verifiedOn,
        updatedAt: now,
      };
      let id: number;
      if (existing) {
        t.update(s.videos).set(row).where(eq(s.videos.id, existing.id)).run();
        id = existing.id;
      } else {
        id = t.insert(s.videos).values({ ...row, createdAt: now }).returning({ id: s.videos.id }).get().id;
      }
      for (const locale of s.locales) {
        t.insert(s.videoTranslations)
          .values({ videoId: id, locale, description: v.description[locale] })
          .onConflictDoUpdate({ target: [s.videoTranslations.videoId, s.videoTranslations.locale], set: { description: v.description[locale] } })
          .run();
      }
      bump(report, "videos", existing ? "updated" : "inserted");
    }

    // Templates
    seedTemplates.forEach((tp, ti) => {
      const existing = t.select({ id: s.templates.id }).from(s.templates).where(eq(s.templates.slug, tp.slug)).get();
      if (existing && !force) return bump(report, "templates", "kept");
      const row = {
        slug: tp.slug,
        format: tp.format,
        skillsJson: json(tp.skills),
        relatedLessonsJson: json(tp.relatedLessons),
        status: "published" as const,
        position: ti + 1,
        updatedAt: now,
      };
      let id: number;
      if (existing) {
        t.update(s.templates).set(row).where(eq(s.templates.id, existing.id)).run();
        id = existing.id;
      } else {
        id = t.insert(s.templates).values(row).returning({ id: s.templates.id }).get().id;
      }
      for (const locale of s.locales) {
        const values = { title: tp.text[locale].title, description: tp.text[locale].description, filePath: `/templates/${locale}/${tp.file}` };
        t.insert(s.templateTranslations)
          .values({ templateId: id, locale, ...values })
          .onConflictDoUpdate({ target: [s.templateTranslations.templateId, s.templateTranslations.locale], set: values })
          .run();
      }
      bump(report, "templates", existing ? "updated" : "inserted");
    });

    // Practice projects
    seedProjects.forEach((p, pi) => {
      const existing = t.select({ id: s.projects.id }).from(s.projects).where(eq(s.projects.slug, p.slug)).get();
      if (existing && !force) return bump(report, "projects", "kept");
      const row = {
        slug: p.slug,
        level: p.level,
        skillsJson: json(p.skills),
        relatedPathsJson: json(p.relatedPaths),
        hours: p.hours,
        status: "published" as const,
        position: pi + 1,
        updatedAt: now,
      };
      let id: number;
      if (existing) {
        t.update(s.projects).set(row).where(eq(s.projects.id, existing.id)).run();
        id = existing.id;
      } else {
        id = t.insert(s.projects).values(row).returning({ id: s.projects.id }).get().id;
      }
      for (const locale of s.locales) {
        const tr = p.text[locale];
        const values = {
          title: tr.title,
          summary: tr.summary,
          brief: tr.brief,
          deliverablesJson: json(tr.deliverables),
          criteriaJson: json(tr.criteria),
        };
        t.insert(s.projectTranslations)
          .values({ projectId: id, locale, ...values })
          .onConflictDoUpdate({ target: [s.projectTranslations.projectId, s.projectTranslations.locale], set: values })
          .run();
      }
      bump(report, "projects", existing ? "updated" : "inserted");
    });
  });

  return report;
}

/* ------------------------------------------------------------------ */
/* Demo accounts (development only)                                    */
/* ------------------------------------------------------------------ */

export const DEMO_DOMAIN = "demo.qa-academy.test";
export const DEFAULT_DEMO_PASSWORD = "Demo-Password-2026";

export const demoAccounts = [
  { email: `learner@${DEMO_DOMAIN}`, name: "Lina Haddad (demo learner)", roles: ["learner"] as s.Role[], locale: "en" as const, sample: true },
  { email: `mutaallim@${DEMO_DOMAIN}`, name: "سامي يوسف (متعلّم تجريبي)", roles: ["learner"] as s.Role[], locale: "ar" as const, sample: true },
  { email: `instructor@${DEMO_DOMAIN}`, name: "Omar Nasser (demo instructor)", roles: ["learner", "instructor"] as s.Role[], locale: "en" as const, sample: false },
  { email: `admin@${DEMO_DOMAIN}`, name: "Demo Administrator", roles: ["learner", "admin"] as s.Role[], locale: "en" as const, sample: false },
];

export function assertNotProduction(what: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${what} is development-only and is refused when NODE_ENV=production.`);
  }
}

export async function seedDemo(db: DB, opts: { reset?: boolean; password?: string; log?: (m: string) => void } = {}) {
  assertNotProduction("Creating demo accounts");
  const log = opts.log ?? (() => {});
  const password = opts.password ?? process.env.DEMO_PASSWORD ?? DEFAULT_DEMO_PASSWORD;

  if (opts.reset) {
    const removed = db.delete(s.users).where(eq(s.users.isDemo, true)).returning({ id: s.users.id }).all();
    log(`Removed ${removed.length} demo account(s) and their learning data.`);
  }

  const hash = await hashPassword(password);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  let created = 0;
  for (const a of demoAccounts) {
    const existing = db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, a.email)).get();
    if (existing) continue;
    const id = randomUUID();
    db.transaction((tx) => {
      tx.insert(s.users)
        .values({ id, email: a.email, name: a.name, passwordHash: hash, preferredLocale: a.locale, isDemo: true, createdAt: new Date(now - 10 * day) })
        .run();
      for (const role of a.roles) tx.insert(s.userRoles).values({ userId: id, role }).run();
    });
    created += 1;

    // Sample learning history for the learner accounts (synthetic).
    if (a.sample) {
      const completed = [
        "qa-foundations/what-quality-means",
        "qa-foundations/testing-across-the-lifecycle",
        "qa-foundations/equivalence-partitioning-and-boundaries",
      ];
      completed.forEach((key, i) => {
        const at = new Date(now - (6 - i * 2) * day);
        db.insert(s.lessonProgress)
          .values({ userId: id, lessonKey: key, status: "completed", startedAt: at, completedAt: at, updatedAt: at })
          .onConflictDoNothing()
          .run();
      });
      const startedAt = new Date(now - day);
      db.insert(s.lessonProgress)
        .values({ userId: id, lessonKey: "qa-foundations/decision-tables", status: "started", startedAt, updatedAt: startedAt })
        .onConflictDoNothing()
        .run();
      const attempts: [string, number, number, number][] = [
        ["lesson:qa-foundations/what-quality-means", 4, 4, 6],
        ["lesson:qa-foundations/equivalence-partitioning-and-boundaries", 3, 4, 2],
        ["cert:ctfl", 7, 10, 1],
      ];
      for (const [subject, score, total, daysAgo] of attempts) {
        db.insert(s.quizAttempts)
          .values({ id: randomUUID(), userId: id, subjectKey: subject, score, total, answersJson: "{}", createdAt: new Date(now - daysAgo * day) })
          .run();
      }
      db.insert(s.bookmarks)
        .values({ userId: id, lessonKey: "api-testing-essentials/authentication-vs-authorization", createdAt: new Date(now - day) })
        .onConflictDoNothing()
        .run();
    }
  }
  log(`Demo accounts: ${created} created, ${demoAccounts.length - created} already present.`);
  return { created, password };
}
