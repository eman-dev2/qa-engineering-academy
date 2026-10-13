import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { Role } from "@/lib/db/schema";
import { readSessionUserId } from "./session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  preferredLocale: "en" | "ar" | null;
};

/** Data access layer: the only place that turns a session cookie into a user. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await readSessionUserId();
  if (!userId) return null;
  const db = getDb();
  const user = db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, preferredLocale: schema.users.preferredLocale })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get();
  if (!user) return null;
  const roles = db
    .select({ role: schema.userRoles.role })
    .from(schema.userRoles)
    .where(eq(schema.userRoles.userId, userId))
    .all()
    .map((r) => r.role);
  return { ...user, roles };
});

/**
 * For pages: redirect to login (preserving the destination) when there is no session.
 * `next` is the page's own public path, e.g. "/dashboard" or "/ar/dashboard".
 */
export async function requireUser(next = "/dashboard"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const login = next === "/ar" || next.startsWith("/ar/") ? "/ar/login" : "/login";
    redirect(`${login}?next=${encodeURIComponent(next)}`);
  }
  return user;
}

export function hasRole(user: Pick<CurrentUser, "roles">, ...allowed: Role[]) {
  return user.roles.some((r) => r === "admin" || allowed.includes(r));
}

/** For server actions and route handlers: throw instead of redirecting. */
export async function requireRole(...allowed: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (!hasRole(user, ...allowed)) throw new Error("FORBIDDEN");
  return user;
}
