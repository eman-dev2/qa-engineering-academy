"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, currentSessionId, destroyOtherSessions, destroySession, hashToken } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/dal";
import { adminCount } from "@/lib/auth/bootstrap";
import {
  changePasswordSchemaFor,
  emailOnlySchemaFor,
  loginSchemaFor,
  profileSchemaFor,
  resetSchemaFor,
  safeNext,
  signupSchemaFor,
  type FormState,
} from "@/lib/auth/validation";
import { clearFailures, isThrottled, recordFailure } from "@/lib/auth/rate-limit";
import { sendMail } from "@/lib/mailer";
import { format, isLocale, localePath, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n";

const RESET_TTL_MS = 30 * 60 * 1000;

// A real hash, used to keep timing similar when the email is unknown.
let dummyHash: Promise<string> | null = null;

function localeOf(form: FormData): Locale {
  const v = form.get("locale");
  return isLocale(v) ? v : "en";
}

/** Absolute origin for links in emails: NEXT_PUBLIC_SITE_URL when set, otherwise the request's host. */
async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signup(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const values = { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? "") };
  const parsed = signupSchemaFor(t.auth.errors).safeParse({ ...values, password: form.get("password") });
  if (!parsed.success) {
    return { message: t.auth.checkFields, fieldErrors: parsed.error.flatten().fieldErrors, values };
  }
  const { name, email, password } = parsed.data;
  const db = getDb();
  const existing = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).get();
  if (existing) {
    return { message: t.auth.emailTakenShort, fieldErrors: { email: [t.auth.emailTaken] }, values };
  }
  const id = randomUUID();
  const passwordHash = await hashPassword(password);
  db.transaction((tx) => {
    tx.insert(schema.users).values({ id, email, name, passwordHash, preferredLocale: locale, createdAt: new Date() }).run();
    // Every public registration is a learner. Other roles are granted by an administrator.
    tx.insert(schema.userRoles).values({ userId: id, role: "learner" }).run();
  });
  await createSession(id);
  redirect(safeNext(form.get("next"), localePath(locale, "/dashboard")));
}

export async function login(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const values = { email: String(form.get("email") ?? "") };
  const parsed = loginSchemaFor(t.auth.errors).safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) {
    return { message: t.auth.checkFields, fieldErrors: parsed.error.flatten().fieldErrors, values };
  }
  const { email, password } = parsed.data;
  if (isThrottled(email)) return { message: t.auth.throttled, values };

  const user = getDb()
    .select({ id: schema.users.id, passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .get();

  dummyHash ??= hashPassword("not-a-real-password-0");
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !ok) {
    recordFailure(email);
    // Same message for unknown email and wrong password: don't reveal which accounts exist.
    return { message: t.auth.badCredentials, values };
  }
  clearFailures(email);
  await createSession(user.id);
  redirect(safeNext(form.get("next"), localePath(locale, "/dashboard")));
}

export async function logout(form: FormData) {
  const locale = localeOf(form);
  await destroySession();
  redirect(localePath(locale, "/"));
}

/* ------------------------------------------------------------------ */
/* Password recovery                                                   */
/* ------------------------------------------------------------------ */

export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const values = { email: String(form.get("email") ?? "") };
  const parsed = emailOnlySchemaFor(t.auth.errors).safeParse(values);
  if (!parsed.success) {
    return { message: t.auth.checkFields, fieldErrors: parsed.error.flatten().fieldErrors, values };
  }
  const { email } = parsed.data;
  const throttleKey = `reset:${email}`;
  // Throttled requests get the same answer as everything else, so the response reveals nothing.
  if (!isThrottled(throttleKey)) {
    recordFailure(throttleKey);
    const db = getDb();
    const user = db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(eq(schema.users.email, email)).get();
    if (user) {
      const token = randomBytes(32).toString("base64url");
      const now = Date.now();
      db.transaction((tx) => {
        // Only the newest link works.
        tx.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.userId, user.id)).run();
        tx.insert(schema.passwordResetTokens)
          .values({ id: hashToken(token), userId: user.id, expiresAt: new Date(now + RESET_TTL_MS), createdAt: new Date(now) })
          .run();
      });
      const link = `${await siteOrigin()}${localePath(locale, "/reset-password")}?token=${token}`;
      await sendMail({
        to: email,
        subject: t.auth.resetEmailSubject,
        text: format(t.auth.resetEmailBody, { name: user.name, link }),
      });
    }
  }
  return { ok: true, message: t.auth.forgotDone };
}

export async function resetPassword(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const parsed = resetSchemaFor(t.auth.errors).safeParse({
    token: form.get("token"),
    password: form.get("password"),
    confirm: form.get("confirm"),
  });
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    if (fieldErrors.token) return { message: t.auth.resetInvalid };
    return { message: t.auth.checkFields, fieldErrors };
  }
  const { token, password } = parsed.data;
  const db = getDb();
  const row = db
    .select({ id: schema.passwordResetTokens.id, userId: schema.passwordResetTokens.userId })
    .from(schema.passwordResetTokens)
    .where(
      and(
        eq(schema.passwordResetTokens.id, hashToken(token)),
        isNull(schema.passwordResetTokens.usedAt),
        gt(schema.passwordResetTokens.expiresAt, new Date()),
      ),
    )
    .get();
  if (!row) return { message: t.auth.resetInvalid };

  const passwordHash = await hashPassword(password);
  const now = new Date();
  db.transaction((tx) => {
    tx.update(schema.users).set({ passwordHash, updatedAt: now }).where(eq(schema.users.id, row.userId)).run();
    tx.update(schema.passwordResetTokens).set({ usedAt: now }).where(eq(schema.passwordResetTokens.id, row.id)).run();
    // A password reset logs out every session, including any an attacker may hold.
    tx.delete(schema.sessions).where(eq(schema.sessions.userId, row.userId)).run();
  });
  redirect(`${localePath(locale, "/login")}?reset=1`);
}

/* ------------------------------------------------------------------ */
/* Account settings (signed in)                                        */
/* ------------------------------------------------------------------ */

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) redirect(localePath(locale, "/login"));
  const values = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    preferredLocale: String(form.get("preferredLocale") ?? locale),
  };
  const parsed = profileSchemaFor(t.auth.errors).safeParse(values);
  if (!parsed.success) return { message: t.auth.checkFields, fieldErrors: parsed.error.flatten().fieldErrors, values };
  const { name, email, preferredLocale } = parsed.data;
  const db = getDb();

  if (email !== user.email) {
    const current = String(form.get("current") ?? "");
    const row = db.select({ passwordHash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, user.id)).get();
    if (!current) return { message: t.auth.checkFields, fieldErrors: { current: [t.account.emailNeedsPassword] }, values };
    if (!row || !(await verifyPassword(current, row.passwordHash))) {
      return { message: t.auth.checkFields, fieldErrors: { current: [t.account.wrongCurrent] }, values };
    }
    const taken = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).get();
    if (taken && taken.id !== user.id) return { message: t.auth.checkFields, fieldErrors: { email: [t.auth.emailTakenShort] }, values };
  }

  db.update(schema.users).set({ name, email, preferredLocale, updatedAt: new Date() }).where(eq(schema.users.id, user.id)).run();
  refresh();
  return { ok: true, message: t.account.profileSaved, values: { name, email, preferredLocale } };
}

export async function changePassword(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) redirect(localePath(locale, "/login"));
  const parsed = changePasswordSchemaFor(t.auth.errors).safeParse({
    current: form.get("current"),
    password: form.get("password"),
    confirm: form.get("confirm"),
  });
  if (!parsed.success) return { message: t.auth.checkFields, fieldErrors: parsed.error.flatten().fieldErrors };
  const db = getDb();
  const row = db.select({ passwordHash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, user.id)).get();
  if (!row || !(await verifyPassword(parsed.data.current, row.passwordHash))) {
    return { message: t.auth.checkFields, fieldErrors: { current: [t.account.wrongCurrent] } };
  }
  db.update(schema.users)
    .set({ passwordHash: await hashPassword(parsed.data.password), updatedAt: new Date() })
    .where(eq(schema.users.id, user.id))
    .run();
  destroyOtherSessions(user.id, await currentSessionId());
  refresh();
  return { ok: true, message: t.account.passwordChanged };
}

export async function logoutOtherSessions(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) redirect(localePath(locale, "/login"));
  destroyOtherSessions(user.id, await currentSessionId());
  refresh();
  return { ok: true, message: t.account.othersLoggedOut };
}

export async function deleteAccount(_prev: FormState, form: FormData): Promise<FormState> {
  const locale = localeOf(form);
  const t = getDictionary(locale);
  const user = await getCurrentUser();
  if (!user) redirect(localePath(locale, "/login"));
  const db = getDb();
  const row = db.select({ passwordHash: schema.users.passwordHash }).from(schema.users).where(eq(schema.users.id, user.id)).get();
  const password = String(form.get("password") ?? "");
  if (!row || !password || !(await verifyPassword(password, row.passwordHash))) {
    return { message: t.auth.checkFields, fieldErrors: { password: [t.account.wrongCurrent] } };
  }
  if (user.roles.includes("admin") && adminCount(db) <= 1) return { message: t.account.lastAdminDelete };

  db.transaction((tx) => {
    tx.insert(schema.auditLog).values({ action: "account.delete", entityType: "user", entityId: user.email, detail: "self-service" }).run();
    // Roles, sessions, progress, attempts, bookmarks and reset tokens cascade.
    tx.delete(schema.users).where(eq(schema.users.id, user.id)).run();
  });
  await destroySession();
  redirect(localePath(locale, "/"));
}
