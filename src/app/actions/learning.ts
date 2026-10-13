"use server";

import { refresh } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { getQuizForSubject, isPublishedLessonKey } from "@/lib/content/repo";
import { scoreQuiz, answersFromFormData, type QuizResult } from "@/lib/quiz";
import { markStarted, recordAttempt, setBookmark, setCompleted } from "@/lib/progress";
import { isLocale, plural, format, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

export type QuizActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | ({ status: "scored"; saved: boolean } & QuizResult);

const localeOf = (v: unknown): Locale => (isLocale(v) ? v : "en");

/**
 * Score a lesson knowledge check or certification practice set on the server.
 * Works signed out (nothing is saved); when signed in the attempt is recorded.
 */
export async function submitQuiz(_prev: QuizActionState, form: FormData): Promise<QuizActionState> {
  const locale = localeOf(form.get("locale"));
  const t = getDictionary(locale);
  const subject = String(form.get("subject") ?? "");
  const questions = getQuizForSubject(subject, locale);
  if (!questions) return { status: "error", message: t.quiz.notFound };

  const answers = answersFromFormData(form);
  const unanswered = questions.filter((q) => !answers[q.id]).length;
  if (unanswered > 0) {
    return { status: "error", message: format(plural(locale, unanswered, t.quiz.unanswered), { count: unanswered }) };
  }

  const result = scoreQuiz(questions, answers);
  const user = await getCurrentUser();
  if (user) {
    recordAttempt(user.id, subject, result.score, result.total, Object.fromEntries(result.results.map((r) => [r.id, r.selected])));
    refresh();
  }
  return { status: "scored", saved: !!user, ...result };
}

export async function toggleLessonComplete(lessonKey: string, completed: boolean, locale: Locale = "en") {
  const t = getDictionary(localeOf(locale));
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: t.lesson.loginToSave };
  if (!isPublishedLessonKey(lessonKey)) return { ok: false as const, error: t.lesson.unknownLesson };
  setCompleted(user.id, lessonKey, completed);
  refresh();
  return { ok: true as const };
}

/** Called once when a signed-in learner opens a lesson, so the dashboard can offer "continue". */
export async function recordLessonVisit(lessonKey: string) {
  const user = await getCurrentUser();
  if (!user || !isPublishedLessonKey(lessonKey)) return;
  markStarted(user.id, lessonKey);
}

export async function toggleBookmark(lessonKey: string, on: boolean, locale: Locale = "en") {
  const t = getDictionary(localeOf(locale));
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: t.lesson.loginToBookmark };
  if (!isPublishedLessonKey(lessonKey)) return { ok: false as const, error: t.lesson.unknownLesson };
  setBookmark(user.id, lessonKey, on);
  refresh();
  return { ok: true as const };
}
