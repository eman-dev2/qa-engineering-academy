"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { and, eq, isNotNull, max, ne } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth/dal";
import { adminCount } from "@/lib/auth/bootstrap";
import { adminUser, staffUser } from "@/lib/admin/guard";
import { parseLines, parsePairs, parseReferences, parseYouTubeId, slugPattern } from "@/lib/admin/parse";
import { nextStatus, requiresAdmin, isWorkflowAction } from "@/lib/admin/workflow";
import { publishProblems, type StoredLessonText } from "@/lib/admin/lesson-checks";
import { isoDate, quizKeysMatch, quizSchema, type QuizQuestion } from "@/lib/content/schema";
import { CONTENT_TAG } from "@/lib/content/repo";
import { skillIds } from "@/content/skills";
import { format, isLocale, localePath, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n";


export type AdminState = { ok?: boolean; message?: string; errors?: string[] };

const LOCALES = ["en", "ar"] as const;

function ctx(form: FormData) {
  const v = form.get("locale");
  const locale: Locale = isLocale(v) ? v : "en";
  return { locale, t: getDictionary(locale) };
}

const str = (form: FormData, name: string) => String(form.get(name) ?? "").trim();
const raw = (form: FormData, name: string) => String(form.get(name) ?? "").replace(/\r\n/g, "\n");
const int = (form: FormData, name: string): number | null => {
  const v = str(form, name);
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
};

function audit(user: CurrentUser, action: string, entityType: string, entityId: string | number, detail?: string) {
  getDb().insert(s.auditLog).values({ userId: user.id, action, entityType, entityId: String(entityId), detail: detail ?? null }).run();
}

function done(message: string): AdminState {
  updateTag(CONTENT_TAG);
  refresh();
  return { ok: true, message };
}

const forbidden = (t: Dictionary): AdminState => ({ message: t.admin.errors.forbidden });
const invalid = (t: Dictionary, errors: string[]): AdminState => ({ message: t.admin.errors.invalid, errors });

function langLabel(t: Dictionary, loc: (typeof LOCALES)[number]) {
  return loc === "en" ? t.admin.english : t.admin.arabic;
}

function skillsFrom(form: FormData): string[] {
  const allowed = new Set<string>(skillIds);
  return form.getAll("skills").map(String).filter((v) => allowed.has(v));
}

function levelFrom(form: FormData, name: string): s.Level | null {
  const v = str(form, name);
  return (s.levels as readonly string[]).includes(v) ? (v as s.Level) : null;
}

/* ------------------------------------------------------------------ */
/* Lessons                                                             */
/* ------------------------------------------------------------------ */

/** Read one language of the lesson form. Arabic is optional while drafting: all-blank means "no translation". */
function lessonTextFromForm(form: FormData, loc: (typeof LOCALES)[number], t: Dictionary): { value: StoredLessonText | null; errors: string[] } {
  const p = `${loc}.`;
  const label = langLabel(t, loc);
  const fields = ["title", "summary", "body", "objectives", "prerequisites", "keyTerms", "mistakes", "exerciseTitle", "exerciseBrief", "exerciseAnswer", "quiz", "references"];
  if (loc === "ar" && fields.every((f) => !str(form, p + f))) return { value: null, errors: [] };

  const errors: string[] = [];
  const title = str(form, p + "title");
  const summary = str(form, p + "summary");
  if (title.length < 3) errors.push(`${t.admin.titleField} (${label}): ${t.admin.errors.required}`);
  if (!summary) errors.push(`${t.admin.summaryField} (${label}): ${t.admin.errors.required}`);

  const lineError = (field: string, line: number) => `${field} (${label}): ${format(t.admin.errors.line, { n: line })}`;
  const keyTerms = parsePairs(raw(form, p + "keyTerms"));
  if (!keyTerms.ok) errors.push(lineError(t.admin.keyTermsField, keyTerms.line));
  const mistakes = parsePairs(raw(form, p + "mistakes"));
  if (!mistakes.ok) errors.push(lineError(t.admin.mistakesField, mistakes.line));
  const references = parseReferences(raw(form, p + "references"));
  if (!references.ok) errors.push(lineError(t.admin.referencesField, references.line));

  let quiz: QuizQuestion[] = [];
  const quizText = str(form, p + "quiz");
  if (quizText) {
    try {
      const parsed = quizSchema.safeParse(JSON.parse(quizText));
      if (parsed.success) quiz = parsed.data;
      else {
        const issue = parsed.error.issues[0];
        errors.push(`${label}: ${format(t.admin.errors.quizShape, { message: `${issue.path.join(".")} ${issue.message}`.trim() })}`);
      }
    } catch (e) {
      errors.push(`${label}: ${format(t.admin.errors.quizJson, { message: e instanceof Error ? e.message : String(e) })}`);
    }
  }

  const exTitle = str(form, p + "exerciseTitle");
  const exBrief = raw(form, p + "exerciseBrief").trim();
  const exAnswer = raw(form, p + "exerciseAnswer").trim();
  const exercise = exTitle || exBrief || exAnswer ? JSON.stringify({ title: exTitle, brief: exBrief, modelAnswer: exAnswer }) : null;

  if (errors.length) return { value: null, errors };
  return {
    value: {
      title,
      summary,
      body: raw(form, p + "body").trim(),
      objectivesJson: JSON.stringify(parseLines(raw(form, p + "objectives"))),
      prerequisitesJson: JSON.stringify(parseLines(raw(form, p + "prerequisites"))),
      keyTermsJson: JSON.stringify(keyTerms.ok ? keyTerms.value.map(([term, definition]) => ({ term, definition })) : []),
      mistakesJson: JSON.stringify(mistakes.ok ? mistakes.value.map(([mistake, fix]) => ({ mistake, fix })) : []),
      exerciseJson: exercise,
      quizJson: JSON.stringify(quiz),
      referencesJson: JSON.stringify(references.ok ? references.value : []),
    },
    errors: [],
  };
}

function publishMessage(t: Dictionary, problems: string[]): string {
  const e = t.admin.errors as Record<string, string>;
  return format(t.admin.errors.publishIncomplete, { missing: problems.map((p) => e[p] ?? p).join(t.meta.siteName === getDictionary("en").meta.siteName ? "; " : "، ") });
}

export async function createLesson(_prev: AdminState, form: FormData): Promise<AdminState> {
  const { locale, t } = ctx(form);
  const user = await staffUser();
  if (!user) return forbidden(t);
  const db = getDb();
  const moduleId = int(form, "moduleId");
  const mod = moduleId ? db.select().from(s.modules).where(eq(s.modules.id, moduleId)).get() : undefined;
  const slug = str(form, "slug");
  const minutes = int(form, "minutes");
  const level = levelFrom(form, "level");
  const title = str(form, "en.title");
  const summary = str(form, "en.summary");
  const errors: string[] = [];
  if (!mod) errors.push(`${t.admin.module}: ${t.admin.errors.required}`);
  if (!slugPattern.test(slug)) errors.push(`${t.admin.slug}: ${t.admin.slugHint}`);
  if (!minutes || Number.isNaN(minutes) || minutes > 600) errors.push(`${t.admin.minutes}: ${t.admin.errors.required}`);
  if (!level) errors.push(`${t.admin.level}: ${t.admin.errors.required}`);
  if (title.length < 3) errors.push(`${t.admin.titleField} (${t.admin.english}): ${t.admin.errors.required}`);
  if (!summary) errors.push(`${t.admin.summaryField} (${t.admin.english}): ${t.admin.errors.required}`);
  if (errors.length || !mod || !level || !minutes) return invalid(t, errors);
  if (db.select({ id: s.lessons.id }).from(s.lessons).where(and(eq(s.lessons.pathId, mod.pathId), eq(s.lessons.slug, slug))).get()) {
    return invalid(t, [t.admin.errors.slugTaken]);
  }
  const now = new Date();
  const position = (db.select({ m: max(s.lessons.position) }).from(s.lessons).where(eq(s.lessons.pathId, mod.pathId)).get()?.m ?? 0) + 1;
  const id = db.transaction((tx) => {
    const row = tx
      .insert(s.lessons)
      .values({ pathId: mod.pathId, moduleId: mod.id, slug, position, minutes, level, status: "draft", updatedBy: user.id, createdAt: now, updatedAt: now })
      .returning({ id: s.lessons.id })
      .get();
    tx.insert(s.lessonTranslations).values({ lessonId: row.id, locale: "en", title, summary }).run();
    return row.id;
  });
  audit(user, "lesson.create", "lesson", id, slug);
  updateTag(CONTENT_TAG);
  redirect(`${localePath(locale, `/admin/content/lessons/${id}`)}?created=1`);
}

export async function saveLesson(_prev: AdminState, form: FormData): Promise<AdminState> {
  const { t } = ctx(form);
  const user = await staffUser();
  if (!user) return forbidden(t);
  const db = getDb();
  const id = int(form, "id");
  const lesson = id ? db.select().from(s.lessons).where(eq(s.lessons.id, id)).get() : undefined;
  if (!lesson) return { message: t.admin.errors.notFound };
  const isAdmin = user.roles.includes("admin");
  if (lesson.status === "published" && !isAdmin) return { message: t.admin.errors.onlyAdminPublish };

  const errors: string[] = [];
  let slug = str(form, "slug");
  if (lesson.publishedAt) slug = lesson.slug; // locked: progress is stored against it
  if (!slugPattern.test(slug)) errors.push(`${t.admin.slug}: ${t.admin.slugHint}`);
  else if (slug !== lesson.slug && db.select({ id: s.lessons.id }).from(s.lessons).where(and(eq(s.lessons.pathId, lesson.pathId), eq(s.lessons.slug, slug), ne(s.lessons.id, lesson.id))).get()) {
    errors.push(t.admin.errors.slugTaken);
  }
  const moduleId = int(form, "moduleId");
  const mod = moduleId ? db.select().from(s.modules).where(and(eq(s.modules.id, moduleId), eq(s.modules.pathId, lesson.pathId))).get() : undefined;
  if (!mod) errors.push(`${t.admin.module}: ${t.admin.errors.required}`);
  const minutes = int(form, "minutes");
  if (!minutes || Number.isNaN(minutes) || minutes > 600) errors.push(`${t.admin.minutes}: ${t.admin.errors.required}`);
  const position = int(form, "position");
  if (position === null || Number.isNaN(position)) errors.push(`${t.admin.position}: ${t.admin.errors.required}`);
  const level = levelFrom(form, "level");
  if (!level) errors.push(`${t.admin.level}: ${t.admin.errors.required}`);
  const reviewedOn = str(form, "reviewedOn") || null;
  if (reviewedOn && !isoDate.safeParse(reviewedOn).success) errors.push(`${t.admin.reviewedOn}: ${t.admin.errors.date}`);
  const skills = skillsFrom(form);

  const en = lessonTextFromForm(form, "en", t);
  const ar = lessonTextFromForm(form, "ar", t);
  errors.push(...en.errors, ...ar.errors);
  if (errors.length || !en.value || !mod || !level || !minutes || position === null) return invalid(t, errors);

  const enQuiz = JSON.parse(en.value.quizJson) as QuizQuestion[];
  const arQuiz = ar.value ? (JSON.parse(ar.value.quizJson) as QuizQuestion[]) : [];
  if (enQuiz.length && arQuiz.length && !quizKeysMatch(enQuiz, arQuiz)) return invalid(t, [t.admin.errors.quizMismatch]);

  const shared = { minutes, level, skillsJson: JSON.stringify(skills), reviewedOn };
  if (lesson.status === "published") {
    const problems = publishProblems(shared, en.value, ar.value);
    if (problems.length) return { message: publishMessage(t, problems) };
  }

  const now = new Date();
  db.transaction((tx) => {
    tx.update(s.lessons)
      .set({ slug, moduleId: mod.id, position, ...shared, updatedBy: user.id, updatedAt: now })
      .where(eq(s.lessons.id, lesson.id))
      .run();
    for (const [loc, v] of [["en", en.value], ["ar", ar.value]] as const) {
      if (v) {
        tx.insert(s.lessonTranslations)
          .values({ lessonId: lesson.id, locale: loc, ...v })
          .onConflictDoUpdate({ target: [s.lessonTranslations.lessonId, s.lessonTranslations.locale], set: v })
          .run();
      } else if (loc === "ar") {
        tx.delete(s.lessonTranslations).where(and(eq(s.lessonTranslations.lessonId, lesson.id), eq(s.lessonTranslations.locale, "ar"))).run();
      }
    }
  });
  audit(user, "lesson.update", "lesson", lesson.id, slug);
  return done(t.admin.saveSuccess);
}

export async function changeLessonStatus(_prev: AdminState, form: FormData): Promise<AdminState> {
  const { t } = ctx(form);
  const user = await staffUser();
  if (!user) return forbidden(t);
  const intent = form.get("intent");
  if (!isWorkflowAction(intent)) return { message: t.admin.errors.invalid };
  if (requiresAdmin(intent) && !user.roles.includes("admin")) return { message: t.admin.errors.onlyAdminPublish };
  const db = getDb();
  const id = int(form, "id");
  const lesson = id ? db.select().from(s.lessons).where(eq(s.lessons.id, id)).get() : undefined;
  if (!lesson) return { message: t.admin.errors.notFound };
  const to = nextStatus(intent, lesson.status);
  if (!to) return { message: format(t.admin.errors.transition, { status: t.statuses[lesson.status] }) };

  if (to === "published") {
    const rows = db.select().from(s.lessonTranslations).where(eq(s.lessonTranslations.lessonId, lesson.id)).all();
    const problems = publishProblems(lesson, rows.find((r) => r.locale === "en") ?? null, rows.find((r) => r.locale === "ar") ?? null);
    if (problems.length) return { message: publishMessage(t, problems) };
  }
  const now = new Date();
  db.update(s.lessons)
    .set({ status: to, updatedBy: user.id, updatedAt: now, ...(to === "published" && !lesson.publishedAt ? { publishedAt: now } : {}) })
    .where(eq(s.lessons.id, lesson.id))
    .run();
  audit(user, "lesson.status", "lesson", lesson.id, `${lesson.status} → ${to}`);
  return done(format(t.admin.actionDone, { status: t.statuses[to] }));
}

/* ------------------------------------------------------------------ */
/* Paths and modules                                                   */
/* ------------------------------------------------------------------ */

export async function savePath(_prev: AdminState, form: FormData): Promise<AdminState> {
  const { t } = ctx(form);
  const user = await staffUser();
  if (!user) return forbidden(t);
  const isAdmin = user.roles.includes("admin");
  const db = getDb();
  const id = int(form, "id");
  const path = id ? db.select().from(s.learningPaths).where(eq(s.learningPaths.id, id)).get() : undefined;
  if (!path) return { message: t.admin.errors.notFound };
  if (path.status === "published" && !isAdmin) return { message: t.admin.errors.onlyAdminPublish };

  const errors: string[] = [];
  const hasPublished = !!db.select({ id: s.lessons.id }).from(s.lessons).where(and(eq(s.lessons.pathId, path.id), isNotNull(s.lessons.publishedAt))).get();
  let slug = str(form, "slug");
  if (hasPublished) slug = path.slug;
  if (!slugPattern.test(slug)) errors.push(`${t.admin.slug}: ${t.admin.slugHint}`);
  else if (slug !== path.slug && db.select({ id: s.learningPaths.id }).from(s.learningPaths).where(eq(s.learningPaths.slug, slug)).get()) {
    errors.push(t.admin.errors.pathSlugTaken);
  }
  const startsAt = levelFrom(form, "startsAt");
  const leadsTo = levelFrom(form, "leadsTo");
  if (!startsAt) errors.push(`${t.admin.startsAt}: ${t.admin.errors.required}`);
  if (!leadsTo) errors.push(`${t.admin.leadsTo}: ${t.admin.errors.required}`);
  const position = int(form, "position");
  if (position === null || Number.isNaN(position)) errors.push(`${t.admin.position}: ${t.admin.errors.required}`);
  const statusRaw = str(form, "status");
  const status = (s.contentStatuses as readonly string[]).includes(statusRaw) ? (statusRaw as s.ContentStatus) : path.status;
  if (status !== path.status && (["published", "archived"].includes(status) || ["published", "archived"].includes(path.status)) && !isAdmin) {
    errors.push(t.admin.errors.onlyAdminPublish);
  }

  const texts: Partial<Record<(typeof LOCALES)[number], { title: string; summary: string; goal: string; prerequisitesJson: string; outcomesJson: string; milestonesJson: string }>> = {};
  for (const loc of LOCALES) {
    const p = `${loc}.`;
    const title = str(form, p + "title");
    const summary = str(form, p + "summary");
    const goal = str(form, p + "goal");
    if (loc === "ar" && !title && !summary && !goal) continue;
    const label = langLabel(t, loc);
    if (title.length < 3) errors.push(`${t.admin.titleField} (${label}): ${t.admin.errors.required}`);
    if (!summary) errors.push(`${t.admin.summaryField} (${label}): ${t.admin.errors.required}`);
    if (!goal) errors.push(`${t.admin.goalField} (${label}): ${t.admin.errors.required}`);
    texts[loc] = {
      title,
      summary,
      goal,
      prerequisitesJson: JSON.stringify(parseLines(raw(form, p + "prerequisites"))),
      outcomesJson: JSON.stringify(parseLines(raw(form, p + "outcomes"))),
      milestonesJson: JSON.stringify(parseLines(raw(form, p + "milestones"))),
    };
  }

  const mods = db.select().from(s.modules).where(eq(s.modules.pathId, path.id)).all();
  const modUpdates = mods.map((m) => {
    const pos = int(form, `module.${m.id}.position`);
    const tr: Partial<Record<(typeof LOCALES)[number], { title: string; summary: string }>> = {};
    for (const loc of LOCALES) {
      const title = str(form, `module.${m.id}.${loc}.title`);
      const summary = str(form, `module.${m.id}.${loc}.summary`);
      if (!title && !summary && loc === "ar") continue;
      if (!title) errors.push(`${t.admin.pathForm.modules} (${m.slug}, ${langLabel(t, loc)}): ${t.admin.errors.required}`);
      tr[loc] = { title, summary };
    }
    return { id: m.id, position: pos === null || Number.isNaN(pos) ? m.position : pos, tr };
  });

  if (errors.length || !startsAt || !leadsTo || position === null || !texts.en) return invalid(t, errors);

  const now = new Date();
  db.transaction((tx) => {
    tx.update(s.learningPaths).set({ slug, startsAt, leadsTo, skillsJson: JSON.stringify(skillsFrom(form)), status, position, updatedAt: now }).where(eq(s.learningPaths.id, path.id)).run();
    for (const loc of LOCALES) {
      const v = texts[loc];
      if (!v) continue;
      tx.insert(s.pathTranslations)
        .values({ pathId: path.id, locale: loc, ...v })
        .onConflictDoUpdate({ target: [s.pathTranslations.pathId, s.pathTranslations.locale], set: v })
        .run();
    }
    for (const m of modUpdates) {
      tx.update(s.modules).set({ position: m.position }).where(eq(s.modules.id, m.id)).run();
      for (const loc of LOCALES) {
        const v = m.tr[loc];
        if (!v) continue;
        tx.insert(s.moduleTranslations)
          .values({ moduleId: m.id, locale: loc, ...v })
          .onConflictDoUpdate({ target: [s.moduleTranslations.moduleId, s.moduleTranslations.locale], set: v })
          .run();
      }
    }
  });
  audit(user, "path.update", "path", path.id, status !== path.status ? `${path.slug}: ${path.status} → ${status}` : path.slug);
  return done(t.admin.saveSuccess);
}

export async function addModule(_prev: AdminState, form: FormData): Promise<AdminState> {
  const { t } = ctx(form);
  const user = await staffUser();
  if (!user) return forbidden(t);
  const db = getDb();
  const pathId = int(form, "pathId");
  const path = pathId ? db.select().from(s.learningPaths).where(eq(s.learningPaths.id, pathId)).get() : undefined;
  if (!path) return { message: t.admin.errors.notFound };
  if (path.status === "published" && !user.roles.includes("admin")) return { message: t.admin.errors.onlyAdminPublish };
  const slug = str(form, "slug");
  const enTitle = str(form, "en.title");
  const arTitle = str(form, "ar.title");
  const errors: string[] = [];
  if (!slugPattern.test(slug)) errors.push(`${t.admin.pathForm.moduleSlug}: ${t.admin.slugHint}`);
  else if (db.select({ id: s.modules.id }).from(s.modules).where(and(eq(s.modules.pathId, path.id), eq(s.modules.slug, slug))).get()) errors.push(t.admin.errors.slugTaken);
  if (!enTitle) errors.push(`${t.admin.pathForm.moduleTitleEn}: ${t.admin.errors.required}`);
  if (errors.length) return invalid(t, errors);
  const position = (db.select({ m: max(s.modules.position) }).from(s.modules).where(eq(s.modules.pathId, path.id)).get()?.m ?? 0) + 1;
  db.transaction((tx) => {
    const mod = tx.insert(s.modules).values({ pathId: path.id, slug, position }).returning({ id: s.modules.id }).get();
    tx.insert(s.moduleTranslations).values({ moduleId: mod.id, locale: "en", title: enTitle, summary: str(form, "en.summary") }).run();
    if (arTitle) tx.insert(s.moduleTranslations).values({ moduleId: mod.id, locale: "ar", title: arTitle, summary: str(form, "ar.summary") }).run();
  });
  audit(user, "module.create", "path", path.id, slug);
  return done(t.admin.pathForm.moduleAdded);
}

/* ------------------------------------------------------------------ */
/* Certifications                                                      */
/* ------------------------------------------------------------------ */

export async function saveCertification(_prev: AdminState, form: FormData): Promise<AdminState> {
  const { t } = ctx(form);
  const user = await staffUser();
  if (!user) return forbidden(t);
  const isAdmin = user.roles.includes("admin");
  const db = getDb();
  const id = int(form, "id");
  const cert = id ? db.select().from(s.certifications).where(eq(s.certifications.id, id)).get() : undefined;
  if (!cert) return { message: t.admin.errors.notFound };
  const verified = form.get("verified") === "on";
  // Verified facts are what learners rely on: only administrators can change them or verify.
  if ((cert.verified || verified) && !isAdmin) return { message: t.admin.errors.forbidden };

  const errors: string[] = [];
  const sourceUrl = str(form, "sourceUrl");
  if (!/^https:\/\/\S+$/.test(sourceUrl)) errors.push(`${t.admin.certs.sourceUrl}: ${t.admin.errors.url}`);
  const reviewedOn = str(form, "reviewedOn") || null;
  if (reviewedOn && !isoDate.safeParse(reviewedOn).success) errors.push(`${t.admin.certs.reviewedOn}: ${t.admin.errors.date}`);
  const facts = {
    questions: int(form, "questions"),
    totalPoints: int(form, "totalPoints"),
    passingScore: int(form, "passingScore"),
    durationMinutes: int(form, "durationMinutes"),
  };
  const nonNativeExtension = str(form, "nonNativeExtension") || null;
  const anyNaN = Object.values(facts).some((v) => Number.isNaN(v));
  if (anyNaN || (facts.passingScore !== null && facts.totalPoints !== null && facts.passingScore > facts.totalPoints)) errors.push(t.admin.errors.examFacts);
  const hasFacts = Object.values(facts).some((v) => v !== null);
  if (verified && (facts.questions === null || facts.totalPoints === null || facts.passingScore === null || facts.durationMinutes === null || !reviewedOn)) {
    errors.push(t.admin.errors.verifyNeedsFacts);
  }
  if (errors.length) return invalid(t, errors);

  db.transaction((tx) => {
    tx.update(s.certifications)
      .set({
        version: str(form, "version") || null,
        sourceUrl,
        reviewedOn,
        verified,
        examJson: hasFacts || nonNativeExtension ? JSON.stringify({ ...facts, nonNativeExtension }) : null,
        updatedAt: new Date(),
      })
      .where(eq(s.certifications.id, cert.id))
      .run();
    for (const loc of LOCALES) {
      const summary = str(form, `${loc}.summary`);
      tx.insert(s.certificationTranslations)
        .values({ certificationId: cert.id, locale: loc, summary: summary || null })
        .onConflictDoUpdate({ target: [s.certificationTranslations.certificationId, s.certificationTranslations.locale], set: { summary: summary || null } })
        .run();
    }
  });
  audit(user, "certification.update", "certification", cert.slug, verified !== cert.verified ? (verified ? "verified" : "unverified") : undefined);
  return done(t.admin.saveSuccess);
}

/* ------------------------------------------------------------------ */
/* Videos                                                              */
/* ------------------------------------------------------------------ */

function today() {
  return new Date().toISOString().slice(0, 10);
}

function videoFields(form: FormData, t: Dictionary) {
  const errors: string[] = [];
  const title = str(form, "title");
  const creator = str(form, "creator");
  const creatorUrl = str(form, "creatorUrl");
  const language = str(form, "language").toLowerCase();
  const level = levelFrom(form, "level");
  const descEn = str(form, "en.description");
  const descAr = str(form, "ar.description");
  if (!title) errors.push(`${t.admin.videos.titleOriginal}: ${t.admin.errors.required}`);
  if (!creator) errors.push(`${t.admin.videos.creator}: ${t.admin.errors.required}`);
  if (!/^https:\/\/\S+$/.test(creatorUrl)) errors.push(`${t.admin.videos.creatorUrl}: ${t.admin.errors.url}`);
  if (!/^[a-z]{2,3}$/.test(language)) errors.push(`${t.admin.videos.language}: ${t.admin.errors.required}`);
  if (!level) errors.push(`${t.admin.level}: ${t.admin.errors.required}`);
  if (!descEn) errors.push(`${t.admin.videos.descriptionEn}: ${t.admin.errors.required}`);
  const related = parseLines(raw(form, "relatedLessons"));
  if (related.some((k) => !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(k))) errors.push(`${t.admin.videos.relatedLessons}: ${format(t.admin.errors.line, { n: related.findIndex((k) => !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(k)) + 1 })}`);
  return { errors, title, creator, creatorUrl, language, level, descEn, descAr, related, skills: skillsFrom(form), verifiedToday: form.get("verifiedToday") === "on" };
}

export async function addVideo(_prev: AdminState, form: FormData): Promise<AdminState> {
  const { locale, t } = ctx(form);
  const user = await staffUser();
  if (!user) return forbidden(t);
  const youtubeId = parseYouTubeId(str(form, "url"));
  const f = videoFields(form, t);
  if (!youtubeId) f.errors.unshift(t.admin.errors.youtube);
  if (f.errors.length || !youtubeId || !f.level) return invalid(t, f.errors);
  const db = getDb();
  if (db.select({ id: s.videos.id }).from(s.videos).where(eq(s.videos.youtubeId, youtubeId)).get()) return invalid(t, [t.admin.errors.videoExists]);
  const now = new Date();
  const id = db.transaction((tx) => {
    const v = tx
      .insert(s.videos)
      .values({
        youtubeId,
        title: f.title,
        creator: f.creator,
        creatorUrl: f.creatorUrl,
        language: f.language,
        level: f.level!,
        skillsJson: JSON.stringify(f.skills),
        relatedLessonsJson: JSON.stringify(f.related),
        status: "draft",
        verifiedOn: f.verifiedToday ? today() : null,
        addedBy: user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: s.videos.id })
      .get();
    tx.insert(s.videoTranslations).values({ videoId: v.id, locale: "en", description: f.descEn }).run();
    if (f.descAr) tx.insert(s.videoTranslations).values({ videoId: v.id, locale: "ar", description: f.descAr }).run();
    return v.id;
  });
  audit(user, "video.create", "video", youtubeId, f.title);
  updateTag(CONTENT_TAG);
  redirect(`${localePath(locale, `/admin/videos/${id}`)}?created=1`);
}

export async function saveVideo(_prev: AdminState, form: FormData): Promise<AdminState> {
  const { t } = ctx(form);
  const user = await staffUser();
  if (!user) return forbidden(t);
  const isAdmin = user.roles.includes("admin");
  const db = getDb();
  const id = int(form, "id");
  const video = id ? db.select().from(s.videos).where(eq(s.videos.id, id)).get() : undefined;
  if (!video) return { message: t.admin.errors.notFound };
  const statusRaw = str(form, "status");
  const status = (["draft", "published", "archived"] as const).find((x) => x === statusRaw) ?? video.status;
  if ((video.status === "published" || status !== video.status) && !isAdmin && (status === "published" || status === "archived" || video.status === "published")) {
    return { message: t.admin.errors.onlyAdminPublish };
  }
  const f = videoFields(form, t);
  if (f.errors.length || !f.level) return invalid(t, f.errors);
  db.transaction((tx) => {
    tx.update(s.videos)
      .set({
        title: f.title,
        creator: f.creator,
        creatorUrl: f.creatorUrl,
        language: f.language,
        level: f.level!,
        skillsJson: JSON.stringify(f.skills),
        relatedLessonsJson: JSON.stringify(f.related),
        status,
        verifiedOn: f.verifiedToday ? today() : video.verifiedOn,
        updatedAt: new Date(),
      })
      .where(eq(s.videos.id, video.id))
      .run();
    tx.insert(s.videoTranslations)
      .values({ videoId: video.id, locale: "en", description: f.descEn })
      .onConflictDoUpdate({ target: [s.videoTranslations.videoId, s.videoTranslations.locale], set: { description: f.descEn } })
      .run();
    if (f.descAr) {
      tx.insert(s.videoTranslations)
        .values({ videoId: video.id, locale: "ar", description: f.descAr })
        .onConflictDoUpdate({ target: [s.videoTranslations.videoId, s.videoTranslations.locale], set: { description: f.descAr } })
        .run();
    } else {
      tx.delete(s.videoTranslations).where(and(eq(s.videoTranslations.videoId, video.id), eq(s.videoTranslations.locale, "ar"))).run();
    }
  });
  audit(user, "video.update", "video", video.youtubeId, status !== video.status ? `${video.status} → ${status}` : undefined);
  return done(t.admin.saveSuccess);
}

/* ------------------------------------------------------------------ */
/* Users and roles (administrators only)                               */
/* ------------------------------------------------------------------ */

export async function updateUserRoles(_prev: AdminState, form: FormData): Promise<AdminState> {
  const { t } = ctx(form);
  const admin = await adminUser();
  if (!admin) return forbidden(t);
  const db = getDb();
  const userId = str(form, "userId");
  const target = db.select({ id: s.users.id, email: s.users.email }).from(s.users).where(eq(s.users.id, userId)).get();
  if (!target) return { message: t.admin.errors.notFound };
  const wanted = new Set(form.getAll("roles").map(String).filter((r): r is s.Role => (s.roles as readonly string[]).includes(r)));
  wanted.add("learner"); // every account keeps the learner role
  const current = new Set(db.select({ role: s.userRoles.role }).from(s.userRoles).where(eq(s.userRoles.userId, target.id)).all().map((r) => r.role));
  if (current.has("admin") && !wanted.has("admin")) {
    if (target.id === admin.id) return { message: t.admin.errors.ownAdmin };
    if (adminCount(db) <= 1) return { message: t.admin.errors.lastAdmin };
  }
  const added = [...wanted].filter((r) => !current.has(r));
  const removed = [...current].filter((r) => !wanted.has(r));
  db.transaction((tx) => {
    for (const role of added) tx.insert(s.userRoles).values({ userId: target.id, role }).onConflictDoNothing().run();
    for (const role of removed) tx.delete(s.userRoles).where(and(eq(s.userRoles.userId, target.id), eq(s.userRoles.role, role))).run();
  });
  if (added.length || removed.length) {
    audit(admin, "role.update", "user", target.email, [...added.map((r) => `+${r}`), ...removed.map((r) => `-${r}`)].join(" "));
  }
  refresh();
  return { ok: true, message: format(t.admin.users.rolesUpdated, { email: target.email }) };
}
