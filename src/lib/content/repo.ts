import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import type { Locale } from "@/i18n/config";
import type { QuizQuestion } from "./schema";
import { extractHeadings } from "./headings";
import type {
  CertificationView,
  LessonDetail,
  LessonSummary,
  PathView,
  ProjectView,
  PublicQuestion,
  TemplateView,
  VideoView,
} from "./types";

/** Cache tag for all published content. Admin mutations call updateTag(CONTENT_TAG). */
export const CONTENT_TAG = "content";

/**
 * Content is cached and tagged: admin edits expire it immediately with updateTag(CONTENT_TAG).
 * The hourly revalidation is a safety net for deployments whose build reads a different database
 * file from the running server (for example Render, where the persistent disk isn't mounted at
 * build time), so prerendered pages catch up with the live database within an hour.
 */
export const CONTENT_CACHE = "hours";

export const parseJson = <T,>(v: string | null | undefined, fallback: T): T => {
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
};
const parse = parseJson;

/** Pick the requested locale's translation, falling back to English. */
function pick<T extends { locale: string }>(rows: T[], locale: Locale): { row: T; fallback: boolean } | null {
  const exact = rows.find((r) => r.locale === locale);
  if (exact) return { row: exact, fallback: false };
  const en = rows.find((r) => r.locale === "en");
  return en ? { row: en, fallback: locale !== "en" } : null;
}

function groupBy<T, K>(rows: T[], key: (r: T) => K): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = m.get(k);
    if (list) list.push(r);
    else m.set(k, [r]);
  }
  return m;
}

/* ------------------------------------------------------------------ */
/* Paths and lessons                                                   */
/* ------------------------------------------------------------------ */

function loadPaths(locale: Locale): PathView[] {
  const db = getDb();
  const paths = db
    .select()
    .from(s.learningPaths)
    .where(inArray(s.learningPaths.status, ["published", "planned"]))
    .orderBy(asc(s.learningPaths.position), asc(s.learningPaths.id))
    .all();
  if (paths.length === 0) return [];
  const pathIds = paths.map((p) => p.id);
  const pathTr = groupBy(db.select().from(s.pathTranslations).where(inArray(s.pathTranslations.pathId, pathIds)).all(), (r) => r.pathId);
  const mods = db
    .select()
    .from(s.modules)
    .where(inArray(s.modules.pathId, pathIds))
    .orderBy(asc(s.modules.position), asc(s.modules.id))
    .all();
  const modTr = groupBy(
    mods.length ? db.select().from(s.moduleTranslations).where(inArray(s.moduleTranslations.moduleId, mods.map((m) => m.id))).all() : [],
    (r) => r.moduleId,
  );
  const lessonRows = db
    .select()
    .from(s.lessons)
    .where(and(inArray(s.lessons.status, ["published", "planned"]), inArray(s.lessons.pathId, pathIds)))
    .orderBy(asc(s.lessons.position), asc(s.lessons.id))
    .all();
  const lessonTr = groupBy(
    lessonRows.length
      ? db
          .select({
            lessonId: s.lessonTranslations.lessonId,
            locale: s.lessonTranslations.locale,
            title: s.lessonTranslations.title,
            summary: s.lessonTranslations.summary,
            objectivesJson: s.lessonTranslations.objectivesJson,
          })
          .from(s.lessonTranslations)
          .where(inArray(s.lessonTranslations.lessonId, lessonRows.map((l) => l.id)))
          .all()
      : [],
    (r) => r.lessonId,
  );
  const modsByPath = groupBy(mods, (m) => m.pathId);
  const lessonsByModule = groupBy(lessonRows, (l) => l.moduleId);

  const result: PathView[] = [];
  for (const p of paths) {
    const t = pick(pathTr.get(p.id) ?? [], locale);
    if (!t) continue;
    let order = 0;
    let position = 0;
    let anyFallback = t.fallback;
    const modules = (modsByPath.get(p.id) ?? []).map((m) => {
      const mt = pick(modTr.get(m.id) ?? [], locale);
      if (mt?.fallback) anyFallback = true;
      const lessons: LessonSummary[] = [];
      for (const l of lessonsByModule.get(m.id) ?? []) {
        const lt = pick(lessonTr.get(l.id) ?? [], locale);
        if (!lt) continue;
        order += 1;
        const published = l.status === "published";
        if (published) position += 1;
        lessons.push({
          id: l.id,
          key: `${p.slug}/${l.slug}`,
          slug: l.slug,
          pathSlug: p.slug,
          moduleSlug: m.slug,
          order,
          position: published ? position : null,
          status: l.status,
          title: lt.row.title,
          summary: lt.row.summary,
          objectives: parse<string[]>(lt.row.objectivesJson, []),
          minutes: l.minutes,
          level: l.level,
          skills: parse(l.skillsJson, []),
          fallback: lt.fallback,
        });
      }
      return { slug: m.slug, title: mt?.row.title ?? m.slug, summary: mt?.row.summary ?? "", lessons };
    });
    const allLessons = modules.flatMap((m) => m.lessons);
    const published = allLessons.filter((l) => l.status === "published");
    result.push({
      id: p.id,
      slug: p.slug,
      status: p.status,
      startsAt: p.startsAt,
      leadsTo: p.leadsTo,
      skills: parse(p.skillsJson, []),
      title: t.row.title,
      summary: t.row.summary,
      goal: t.row.goal,
      prerequisites: parse(t.row.prerequisitesJson, []),
      outcomes: parse(t.row.outcomesJson, []),
      milestones: parse(t.row.milestonesJson, []),
      modules,
      lessons: published,
      plannedCount: allLessons.length - published.length,
      totalMinutes: published.reduce((n, l) => n + l.minutes, 0),
      fallback: anyFallback,
    });
  }
  return result;
}

/** Published and in-development paths with their lesson outlines. */
export async function getPaths(locale: Locale): Promise<PathView[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife(CONTENT_CACHE);
  return loadPaths(locale);
}

export async function getPath(locale: Locale, slug: string): Promise<PathView | null> {
  const paths = await getPaths(locale);
  return paths.find((p) => p.slug === slug) ?? null;
}

/** All published lessons, keyed for dashboards and search. */
export async function getPublishedLessons(locale: Locale): Promise<LessonSummary[]> {
  const paths = await getPaths(locale);
  return paths.flatMap((p) => p.lessons);
}

export async function getLesson(locale: Locale, pathSlug: string, lessonSlug: string): Promise<LessonDetail | null> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife(CONTENT_CACHE);
  const paths = loadPaths(locale);
  const path = paths.find((p) => p.slug === pathSlug);
  const summary = path?.lessons.find((l) => l.slug === lessonSlug);
  if (!path || !summary) return null;
  const db = getDb();
  const rows = db.select().from(s.lessonTranslations).where(eq(s.lessonTranslations.lessonId, summary.id)).all();
  const t = pick(rows, locale);
  const lessonRow = db.select({ reviewedOn: s.lessons.reviewedOn }).from(s.lessons).where(eq(s.lessons.id, summary.id)).get();
  if (!t || !t.row.exerciseJson) return null;
  return {
    ...summary,
    fallback: t.fallback,
    prerequisites: parse(t.row.prerequisitesJson, []),
    keyTerms: parse(t.row.keyTermsJson, []),
    mistakes: parse(t.row.mistakesJson, []),
    exercise: parse(t.row.exerciseJson, { title: "", brief: "", modelAnswer: "" }),
    quiz: parse(t.row.quizJson, []),
    references: parse(t.row.referencesJson, []),
    body: t.row.body,
    headings: extractHeadings(t.row.body),
    reviewedOn: lessonRow?.reviewedOn ?? "",
    publishedTotal: path.lessons.length,
  };
}

/* ------------------------------------------------------------------ */
/* Certifications                                                      */
/* ------------------------------------------------------------------ */

function loadCertifications(locale: Locale): CertificationView[] {
  const db = getDb();
  const certs = db.select().from(s.certifications).orderBy(asc(s.certifications.position), asc(s.certifications.id)).all();
  const tr = groupBy(db.select().from(s.certificationTranslations).all(), (r) => r.certificationId);
  return certs.map((c) => {
    const t = pick(tr.get(c.id) ?? [], locale);
    const row = t?.row;
    return {
      id: c.id,
      slug: c.slug,
      code: c.code,
      name: c.name,
      issuer: c.issuer,
      version: c.version,
      stream: c.stream,
      sourceUrl: c.sourceUrl,
      reviewedOn: c.reviewedOn,
      verified: c.verified,
      exam: parse(c.examJson, null),
      chapters: parse(c.chaptersJson, []),
      chaptersTranslated: locale === "en" ? null : parse<string[] | null>(row?.chaptersJson, null),
      officialLinks: parse(c.officialLinksJson, []),
      relatedPaths: parse(c.relatedPathsJson, []),
      summary: row?.summary ?? null,
      audience: parse(row?.audienceJson, []),
      prerequisites: parse(row?.prerequisitesJson, []),
      studyPlan: parse(row?.studyPlanJson, []),
      practice: parse(row?.practiceJson, []),
      fallback: t?.fallback ?? false,
    };
  });
}

export async function getCertifications(locale: Locale): Promise<CertificationView[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife(CONTENT_CACHE);
  return loadCertifications(locale);
}

export async function getCertification(locale: Locale, slug: string): Promise<CertificationView | null> {
  const all = await getCertifications(locale);
  return all.find((c) => c.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */

export async function getVideos(locale: Locale): Promise<VideoView[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife(CONTENT_CACHE);
  const db = getDb();
  const rows = db.select().from(s.videos).where(eq(s.videos.status, "published")).orderBy(asc(s.videos.id)).all();
  const tr = groupBy(db.select().from(s.videoTranslations).all(), (r) => r.videoId);
  return rows.map((v) => ({
    id: v.id,
    youtubeId: v.youtubeId,
    title: v.title,
    creator: v.creator,
    creatorUrl: v.creatorUrl,
    language: v.language,
    level: v.level,
    skills: parse(v.skillsJson, []),
    relatedLessons: parse(v.relatedLessonsJson, []),
    verifiedOn: v.verifiedOn,
    description: pick(tr.get(v.id) ?? [], locale)?.row.description ?? "",
  }));
}

export async function getTemplates(locale: Locale): Promise<TemplateView[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife(CONTENT_CACHE);
  const db = getDb();
  const rows = db.select().from(s.templates).where(eq(s.templates.status, "published")).orderBy(asc(s.templates.position)).all();
  const tr = groupBy(db.select().from(s.templateTranslations).all(), (r) => r.templateId);
  return rows.flatMap((t) => {
    const x = pick(tr.get(t.id) ?? [], locale);
    return x
      ? [
          {
            slug: t.slug,
            format: t.format,
            title: x.row.title,
            description: x.row.description,
            filePath: x.row.filePath,
            relatedLessons: parse<string[]>(t.relatedLessonsJson, []),
          },
        ]
      : [];
  });
}

export async function getProjects(locale: Locale): Promise<ProjectView[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife(CONTENT_CACHE);
  const db = getDb();
  const rows = db.select().from(s.projects).where(eq(s.projects.status, "published")).orderBy(asc(s.projects.position)).all();
  const tr = groupBy(db.select().from(s.projectTranslations).all(), (r) => r.projectId);
  return rows.flatMap((p) => {
    const x = pick(tr.get(p.id) ?? [], locale);
    if (!x) return [];
    return [
      {
        slug: p.slug,
        level: p.level,
        skills: parse(p.skillsJson, []),
        relatedPaths: parse<string[]>(p.relatedPathsJson, []),
        hours: p.hours,
        title: x.row.title,
        summary: x.row.summary,
        brief: x.row.brief,
        deliverables: parse(x.row.deliverablesJson, []),
        criteria: parse(x.row.criteriaJson, []),
      },
    ];
  });
}

/* ------------------------------------------------------------------ */
/* Quiz answer keys (server-only, uncached so edits apply immediately) */
/* ------------------------------------------------------------------ */

function findPublishedLessonId(key: string): number | null {
  const [pathSlug, lessonSlug] = key.split("/");
  if (!pathSlug || !lessonSlug) return null;
  const db = getDb();
  const path = db.select({ id: s.learningPaths.id }).from(s.learningPaths).where(eq(s.learningPaths.slug, pathSlug)).get();
  if (!path) return null;
  const lesson = db
    .select({ id: s.lessons.id, status: s.lessons.status })
    .from(s.lessons)
    .where(and(eq(s.lessons.pathId, path.id), eq(s.lessons.slug, lessonSlug)))
    .get();
  return lesson && lesson.status === "published" ? lesson.id : null;
}

/** Answer key for "lesson:<path>/<lesson>" or "cert:<slug>". Only published lessons can be scored. */
export function getQuizForSubject(subject: string, locale: Locale): QuizQuestion[] | null {
  const [kind, ...rest] = subject.split(":");
  const id = rest.join(":");
  const db = getDb();
  if (kind === "lesson") {
    const lessonId = findPublishedLessonId(id);
    if (!lessonId) return null;
    const rows = db
      .select({ locale: s.lessonTranslations.locale, quizJson: s.lessonTranslations.quizJson })
      .from(s.lessonTranslations)
      .where(eq(s.lessonTranslations.lessonId, lessonId))
      .all();
    const t = pick(rows, locale);
    const qs = t ? parse<QuizQuestion[]>(t.row.quizJson, []) : [];
    return qs.length ? qs : null;
  }
  if (kind === "cert") {
    const cert = db.select({ id: s.certifications.id }).from(s.certifications).where(eq(s.certifications.slug, id)).get();
    if (!cert) return null;
    const rows = db
      .select({ locale: s.certificationTranslations.locale, practiceJson: s.certificationTranslations.practiceJson })
      .from(s.certificationTranslations)
      .where(eq(s.certificationTranslations.certificationId, cert.id))
      .all();
    const withPractice = rows.filter((r) => parse<QuizQuestion[]>(r.practiceJson, []).length > 0);
    const t = pick(withPractice, locale);
    const qs = t ? parse<QuizQuestion[]>(t.row.practiceJson, []) : [];
    return qs.length ? qs : null;
  }
  return null;
}

/** Whether a lesson key refers to a published lesson (for progress and bookmarks). */
export function isPublishedLessonKey(key: string): boolean {
  return findPublishedLessonId(key) !== null;
}

/** Public helper: questions without answers or explanations, safe to send to the browser. */
export function publicQuestions(questions: QuizQuestion[]): PublicQuestion[] {
  return questions.map(({ id, prompt, options }) => ({ id, prompt, options }));
}
