import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";

export function uniqueEmail(prefix = "learner") {
  return `${prefix}-${randomUUID().slice(0, 8)}@test.example`;
}

export const PASSWORD = "boundary-2026";

/** Development demo accounts created by scripts/e2e-db.ts (see seed/lib.ts). */
export const DEMO_PASSWORD = "Demo-Password-2026";
export const DEMO = {
  learner: "learner@demo.qa-academy.test",
  arabicLearner: "mutaallim@demo.qa-academy.test",
  instructor: "instructor@demo.qa-academy.test",
  admin: "admin@demo.qa-academy.test",
};

export async function signUp(page: Page, opts: { name?: string; email?: string; next?: string } = {}) {
  const email = opts.email ?? uniqueEmail();
  await page.goto(opts.next ? `/signup?next=${encodeURIComponent(opts.next)}` : "/signup");
  await page.getByLabel("Name").fill(opts.name ?? "Test Learner");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(opts.next ?? "/dashboard");
  return email;
}

/** Open the signed-in account menu in the header (Admin, Account, Log out). */
export async function openAccountMenu(page: Page) {
  await page.getByRole("banner").locator("details > summary").click();
}

export async function logIn(page: Page, email: string, password: string, next?: string) {
  await page.goto(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(next ?? "/dashboard");
}

/**
 * The production server has no development outbox page, so tests read the outbox table directly
 * from the e2e database (the same file the server uses).
 */
export function latestEmailTo(email: string): { subject: string; text: string } | undefined {
  const db = new Database(process.env.DATABASE_PATH ?? "./data/e2e.db", { readonly: true, fileMustExist: true });
  try {
    return db.prepare("select subject, text from email_outbox where \"to\" = ? order by id desc limit 1").get(email.toLowerCase()) as
      | { subject: string; text: string }
      | undefined;
  } finally {
    db.close();
  }
}

export function linkFrom(text: string): string {
  const match = text.match(/https?:\/\/\S+/);
  if (!match) throw new Error(`No link in email:\n${text}`);
  const url = new URL(match[0]);
  return url.pathname + url.search;
}
