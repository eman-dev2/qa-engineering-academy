/**
 * Administrator bootstrap, shared by the CLI (scripts/create-admin.ts) and the startup script
 * (scripts/prepare.ts). It runs only on the server's command line or at server start, from
 * environment variables: no bootstrap secret or admin credential ever reaches the web app.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { DB } from "../db/connection";
import * as s from "../db/schema";
import { hashPassword } from "./password";
import { signupSchema } from "./validation";

export function adminCount(db: DB): number {
  return db.select({ id: s.userRoles.userId }).from(s.userRoles).where(eq(s.userRoles.role, "admin")).all().length;
}

export type BootstrapResult = { status: "created" | "promoted"; email: string };

/** Create an administrator (or promote an existing account). Throws on invalid input. */
export async function createAdministrator(db: DB, input: { email: string; name: string; password: string }): Promise<BootstrapResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    const errs = parsed.error.flatten().fieldErrors;
    throw new Error("Invalid input: " + Object.entries(errs).map(([k, v]) => `${k}: ${v?.join(" ")}`).join("; "));
  }
  const { email, name, password } = parsed.data;
  const existing = db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, email)).get();
  if (existing) {
    db.insert(s.userRoles).values({ userId: existing.id, role: "admin" }).onConflictDoNothing().run();
    db.insert(s.auditLog).values({ action: "admin.bootstrap", entityType: "user", entityId: email, detail: "promoted" }).run();
    return { status: "promoted", email };
  }
  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  db.transaction((tx) => {
    tx.insert(s.users).values({ id, email, name, passwordHash, createdAt: new Date() }).run();
    tx.insert(s.userRoles).values({ userId: id, role: "learner" }).run();
    tx.insert(s.userRoles).values({ userId: id, role: "admin" }).run();
    tx.insert(s.auditLog).values({ action: "admin.bootstrap", entityType: "user", entityId: email, detail: "created" }).run();
  });
  return { status: "created", email };
}
