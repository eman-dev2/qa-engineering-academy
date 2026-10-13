import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, schema } from "@/lib/db";

export type LessonStatus = "not-started" | "started" | "completed";

export function getProgressMap(userId: string): Map<string, { status: "started" | "completed"; updatedAt: Date }> {
  const rows = getDb()
    .select()
    .from(schema.lessonProgress)
    .where(eq(schema.lessonProgress.userId, userId))
    .all();
  return new Map(rows.map((r) => [r.lessonKey, { status: r.status, updatedAt: r.updatedAt }]));
}

export function getLessonStatus(userId: string, lessonKey: string): LessonStatus {
  const row = getDb()
    .select({ status: schema.lessonProgress.status })
    .from(schema.lessonProgress)
    .where(and(eq(schema.lessonProgress.userId, userId), eq(schema.lessonProgress.lessonKey, lessonKey)))
    .get();
  return row?.status ?? "not-started";
}

/** Record that a learner opened a lesson. Never downgrades a completed lesson. */
export function markStarted(userId: string, lessonKey: string) {
  const now = new Date();
  getDb()
    .insert(schema.lessonProgress)
    .values({ userId, lessonKey, status: "started", startedAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: [schema.lessonProgress.userId, schema.lessonProgress.lessonKey],
      set: { updatedAt: now },
    })
    .run();
}

export function setCompleted(userId: string, lessonKey: string, completed: boolean) {
  const now = new Date();
  getDb()
    .insert(schema.lessonProgress)
    .values({
      userId,
      lessonKey,
      status: completed ? "completed" : "started",
      startedAt: now,
      completedAt: completed ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.lessonProgress.userId, schema.lessonProgress.lessonKey],
      set: { status: completed ? "completed" : "started", completedAt: completed ? now : null, updatedAt: now },
    })
    .run();
}

export function recordAttempt(
  userId: string,
  subjectKey: string,
  score: number,
  total: number,
  answers: Record<string, string | null>,
) {
  getDb()
    .insert(schema.quizAttempts)
    .values({
      id: randomUUID(),
      userId,
      subjectKey,
      score,
      total,
      answersJson: JSON.stringify(answers),
      createdAt: new Date(),
    })
    .run();
}

export function getAttempts(userId: string, limit = 20) {
  return getDb()
    .select()
    .from(schema.quizAttempts)
    .where(eq(schema.quizAttempts.userId, userId))
    .orderBy(desc(schema.quizAttempts.createdAt))
    .limit(limit)
    .all();
}

export function getBestAttempt(userId: string, subjectKey: string) {
  const rows = getDb()
    .select({ score: schema.quizAttempts.score, total: schema.quizAttempts.total })
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.userId, userId), eq(schema.quizAttempts.subjectKey, subjectKey)))
    .all();
  if (rows.length === 0) return null;
  return rows.reduce((best, r) => (r.score / r.total > best.score / best.total ? r : best));
}

export function isBookmarked(userId: string, lessonKey: string) {
  return !!getDb()
    .select({ k: schema.bookmarks.lessonKey })
    .from(schema.bookmarks)
    .where(and(eq(schema.bookmarks.userId, userId), eq(schema.bookmarks.lessonKey, lessonKey)))
    .get();
}

export function setBookmark(userId: string, lessonKey: string, on: boolean) {
  const db = getDb();
  if (on) {
    db.insert(schema.bookmarks)
      .values({ userId, lessonKey, createdAt: new Date() })
      .onConflictDoNothing()
      .run();
  } else {
    db.delete(schema.bookmarks)
      .where(and(eq(schema.bookmarks.userId, userId), eq(schema.bookmarks.lessonKey, lessonKey)))
      .run();
  }
}

export function getBookmarks(userId: string) {
  return getDb()
    .select()
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.userId, userId))
    .orderBy(desc(schema.bookmarks.createdAt))
    .all();
}
