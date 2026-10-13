import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { and, eq, gt, ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export const SESSION_COOKIE = "qa_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Secure cookies need HTTPS; production runs behind HTTPS, local `npm start` testing may not. */
function secureCookies() {
  return process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1";
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_TTL_MS);
  getDb()
    .insert(schema.sessions)
    .values({ id: hashToken(token), userId, expiresAt, createdAt: new Date(now) })
    .run();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    expires: expiresAt,
  });
}

export async function currentSessionId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? hashToken(token) : null;
}

export async function readSessionUserId(): Promise<string | null> {
  const id = await currentSessionId();
  if (!id) return null;
  // Session expiry depends on the current time, which only exists at request time.
  await connection();
  const row = getDb()
    .select({ userId: schema.sessions.userId })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.id, id), gt(schema.sessions.expiresAt, new Date())))
    .get();
  return row?.userId ?? null;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) getDb().delete(schema.sessions).where(eq(schema.sessions.id, hashToken(token))).run();
  store.delete(SESSION_COOKIE);
}

/** Remove every session for a user except (optionally) the current one. */
export function destroyOtherSessions(userId: string, keepSessionId: string | null) {
  const db = getDb();
  if (keepSessionId) {
    db.delete(schema.sessions).where(and(eq(schema.sessions.userId, userId), ne(schema.sessions.id, keepSessionId))).run();
  } else {
    db.delete(schema.sessions).where(eq(schema.sessions.userId, userId)).run();
  }
}

/** Call from request-time code only (it compares against the current time). */
export function countSessions(userId: string): number {
  return getDb()
    .select({ id: schema.sessions.id })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.userId, userId), gt(schema.sessions.expiresAt, new Date())))
    .all().length;
}
