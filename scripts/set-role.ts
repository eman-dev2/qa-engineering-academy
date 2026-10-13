/**
 * Grant, revoke or list roles from the server's command line (the admin area does the same).
 *
 *   npm run user:role -- grant  someone@example.com instructor
 *   npm run user:role -- revoke someone@example.com instructor
 *   npm run user:role -- list   someone@example.com
 *
 * Every account keeps the learner role, and the last administrator can't be removed.
 */
import { and, eq } from "drizzle-orm";
import { openDatabase } from "../src/lib/db/connection";
import * as s from "../src/lib/db/schema";
import { adminCount } from "../src/lib/auth/bootstrap";

const [action, emailArg, roleArg] = process.argv.slice(2);

function fail(msg: string): never {
  console.error(msg);
  process.exit(1);
}

const { db, sqlite } = openDatabase();
try {
  if (!action || !emailArg || !["grant", "revoke", "list"].includes(action)) {
    fail("Usage: npm run user:role -- <grant|revoke|list> <email> [role]\nRoles: " + s.roles.join(", "));
  }
  const email = emailArg.trim().toLowerCase();
  const user = db.select({ id: s.users.id }).from(s.users).where(eq(s.users.email, email)).get();
  if (!user) fail(`No account with email ${email}.`);

  const current = () =>
    db.select({ role: s.userRoles.role }).from(s.userRoles).where(eq(s.userRoles.userId, user.id)).all().map((r) => r.role);

  if (action === "list") {
    console.log(`${email}: ${current().join(", ")}`);
  } else {
    const role = roleArg as s.Role;
    if (!s.roles.includes(role)) fail(`Unknown role "${roleArg}". Roles: ${s.roles.join(", ")}`);
    if (action === "grant") {
      db.insert(s.userRoles).values({ userId: user.id, role }).onConflictDoNothing().run();
    } else {
      if (role === "learner") fail("Every account keeps the learner role.");
      if (role === "admin" && current().includes("admin") && adminCount(db) <= 1) fail("This is the last administrator; grant the role to someone else first.");
      db.delete(s.userRoles).where(and(eq(s.userRoles.userId, user.id), eq(s.userRoles.role, role))).run();
    }
    db.insert(s.auditLog).values({ action: `role.${action}`, entityType: "user", entityId: email, detail: `${role} (command line)` }).run();
    console.log(`${email}: ${current().join(", ")}`);
  }
} finally {
  sqlite.close();
}
