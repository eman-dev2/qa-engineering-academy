import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb, schema as s } from "@/lib/db";
import type { Locale } from "@/i18n/config";

function title<T extends { locale: string; title: string }>(rows: T[], locale: Locale): string {
  return (rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === "en"))?.title ?? "";
}

/** Every path, module and lesson in any status, for the admin content list. */
export function contentTree(locale: Locale) {
  const db = getDb();
  const paths = db.select().from(s.learningPaths).orderBy(asc(s.learningPaths.position), asc(s.learningPaths.id)).all();
  const pathTr = db.select({ pathId: s.pathTranslations.pathId, locale: s.pathTranslations.locale, title: s.pathTranslations.title }).from(s.pathTranslations).all();
  const mods = db.select().from(s.modules).orderBy(asc(s.modules.position), asc(s.modules.id)).all();
  const modTr = db.select({ moduleId: s.moduleTranslations.moduleId, locale: s.moduleTranslations.locale, title: s.moduleTranslations.title }).from(s.moduleTranslations).all();
  const lessons = db.select().from(s.lessons).orderBy(asc(s.lessons.position), asc(s.lessons.id)).all();
  const lessonTr = db.select({ lessonId: s.lessonTranslations.lessonId, locale: s.lessonTranslations.locale, title: s.lessonTranslations.title }).from(s.lessonTranslations).all();
  return paths.map((p) => ({
    ...p,
    title: title(pathTr.filter((r) => r.pathId === p.id), locale),
    languages: pathTr.filter((r) => r.pathId === p.id).map((r) => r.locale),
    modules: mods
      .filter((m) => m.pathId === p.id)
      .map((m) => ({
        ...m,
        title: title(modTr.filter((r) => r.moduleId === m.id), locale),
        lessons: lessons
          .filter((l) => l.moduleId === m.id)
          .map((l) => {
            const tr = lessonTr.filter((r) => r.lessonId === l.id);
            return { ...l, title: title(tr, locale), languages: tr.map((r) => r.locale) };
          }),
      })),
  }));
}

export function moduleOptions(locale: Locale, pathId?: number) {
  return contentTree(locale)
    .filter((p) => pathId === undefined || p.id === pathId)
    .flatMap((p) => p.modules.map((m) => ({ value: m.id, label: `${p.title} › ${m.title}` })));
}

export function lessonForEdit(id: number) {
  const db = getDb();
  const lesson = db.select().from(s.lessons).where(eq(s.lessons.id, id)).get();
  if (!lesson) return null;
  const tr = db.select().from(s.lessonTranslations).where(eq(s.lessonTranslations.lessonId, id)).all();
  const path = db.select().from(s.learningPaths).where(eq(s.learningPaths.id, lesson.pathId)).get()!;
  return { lesson, path, en: tr.find((r) => r.locale === "en") ?? null, ar: tr.find((r) => r.locale === "ar") ?? null };
}

export function pathForEdit(id: number) {
  const db = getDb();
  const path = db.select().from(s.learningPaths).where(eq(s.learningPaths.id, id)).get();
  if (!path) return null;
  const tr = db.select().from(s.pathTranslations).where(eq(s.pathTranslations.pathId, id)).all();
  const mods = db.select().from(s.modules).where(eq(s.modules.pathId, id)).orderBy(asc(s.modules.position), asc(s.modules.id)).all();
  const modTr = mods.length ? db.select().from(s.moduleTranslations).all().filter((r) => mods.some((m) => m.id === r.moduleId)) : [];
  return {
    path,
    en: tr.find((r) => r.locale === "en") ?? null,
    ar: tr.find((r) => r.locale === "ar") ?? null,
    modules: mods.map((m) => ({ ...m, en: modTr.find((r) => r.moduleId === m.id && r.locale === "en") ?? null, ar: modTr.find((r) => r.moduleId === m.id && r.locale === "ar") ?? null })),
  };
}
