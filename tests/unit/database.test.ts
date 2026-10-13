import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { openDatabase, type DB } from "@/lib/db/connection";
import * as s from "@/lib/db/schema";
import { adminCount, createAdministrator } from "@/lib/auth/bootstrap";
import { verifyPassword } from "@/lib/auth/password";
import { demoAccounts, seedContent, seedDemo } from "../../seed/lib";

let dir: string;
let db: DB;
let close: () => void;

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "qa-academy-test-"));
  const opened = openDatabase(path.join(dir, "test.db"));
  db = opened.db;
  close = () => opened.sqlite.close();
});

afterAll(() => {
  close();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("seeding", () => {
  it("creates all content on an empty database", () => {
    const report = seedContent(db);
    expect(report.paths.inserted).toBeGreaterThanOrEqual(8);
    expect(report.lessons.inserted).toBeGreaterThanOrEqual(39);
    expect(report.certifications.inserted).toBeGreaterThanOrEqual(27);
    expect(report.videos.inserted).toBeGreaterThanOrEqual(8);
    expect(report.templates.inserted).toBeGreaterThanOrEqual(7);
    expect(report.projects.inserted).toBeGreaterThanOrEqual(5);
  });

  it("is repeatable: a second run inserts nothing and changes nothing", () => {
    const report = seedContent(db);
    for (const [table, r] of Object.entries(report)) {
      expect(r.inserted, table).toBe(0);
      expect(r.updated, table).toBe(0);
    }
  });

  it("never overwrites an admin's edit unless forced", () => {
    const lesson = db.select().from(s.lessons).where(eq(s.lessons.slug, "decision-tables")).get()!;
    db.update(s.lessonTranslations).set({ title: "Edited by an admin" }).where(eq(s.lessonTranslations.lessonId, lesson.id)).run();
    seedContent(db);
    const kept = db.select().from(s.lessonTranslations).where(eq(s.lessonTranslations.lessonId, lesson.id)).all();
    expect(kept.every((t) => t.title === "Edited by an admin")).toBe(true);
    seedContent(db, { forceContent: true });
    const restored = db.select().from(s.lessonTranslations).where(eq(s.lessonTranslations.lessonId, lesson.id)).all();
    expect(restored.find((t) => t.locale === "en")!.title).toBe("Decision tables for business rules");
  });

  it("stores both languages for every published lesson", () => {
    const published = db.select().from(s.lessons).where(eq(s.lessons.status, "published")).all();
    expect(published.length).toBeGreaterThanOrEqual(14);
    for (const l of published) {
      const locales = db.select({ locale: s.lessonTranslations.locale }).from(s.lessonTranslations).where(eq(s.lessonTranslations.lessonId, l.id)).all().map((r) => r.locale).sort();
      expect(locales, l.slug).toEqual(["ar", "en"]);
    }
  });

  it("creates development demo accounts with learner roles and synthetic progress", async () => {
    const { created } = await seedDemo(db, { password: "Test-Password-1" });
    expect(created).toBe(demoAccounts.length);
    const learner = db.select().from(s.users).where(eq(s.users.email, demoAccounts[0].email)).get()!;
    expect(learner.isDemo).toBe(true);
    const roles = db.select({ role: s.userRoles.role }).from(s.userRoles).where(eq(s.userRoles.userId, learner.id)).all().map((r) => r.role);
    expect(roles).toEqual(["learner"]);
    expect(db.select().from(s.lessonProgress).where(eq(s.lessonProgress.userId, learner.id)).all().length).toBeGreaterThan(0);
    expect((await seedDemo(db, { password: "Test-Password-1" })).created).toBe(0);
  });

  it("refuses to create demo accounts in production", async () => {
    const before = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = "production";
    try {
      await expect(seedDemo(db)).rejects.toThrow(/development-only/);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = before;
    }
  });
});

describe("administrator bootstrap", () => {
  it("creates an administrator who is also a learner, and writes an audit entry", async () => {
    const before = adminCount(db);
    const result = await createAdministrator(db, { email: "Owner@Example.com", name: "Owner", password: "Strong-Password-42" });
    expect(result).toEqual({ status: "created", email: "owner@example.com" });
    expect(adminCount(db)).toBe(before + 1);
    const user = db.select().from(s.users).where(eq(s.users.email, "owner@example.com")).get()!;
    expect(await verifyPassword("Strong-Password-42", user.passwordHash)).toBe(true);
    const roles = db.select({ role: s.userRoles.role }).from(s.userRoles).where(eq(s.userRoles.userId, user.id)).all().map((r) => r.role).sort();
    expect(roles).toEqual(["admin", "learner"]);
    expect(db.select().from(s.auditLog).where(eq(s.auditLog.action, "admin.bootstrap")).all().length).toBeGreaterThan(0);
  });

  it("promotes an existing account instead of creating a duplicate", async () => {
    const result = await createAdministrator(db, { email: demoAccounts[0].email, name: "Promoted Learner", password: "Another-Password-7" });
    expect(result.status).toBe("promoted");
  });

  it("rejects weak passwords", async () => {
    await expect(createAdministrator(db, { email: "weak@example.com", name: "Weak", password: "short" })).rejects.toThrow(/password/i);
  });
});

describe("referential integrity", () => {
  it("deleting a user removes their roles, sessions and learning data", () => {
    const learner = db.select().from(s.users).where(eq(s.users.email, demoAccounts[1].email)).get()!;
    db.delete(s.users).where(eq(s.users.id, learner.id)).run();
    expect(db.select().from(s.userRoles).where(eq(s.userRoles.userId, learner.id)).all()).toEqual([]);
    expect(db.select().from(s.lessonProgress).where(eq(s.lessonProgress.userId, learner.id)).all()).toEqual([]);
    expect(db.select().from(s.quizAttempts).where(eq(s.quizAttempts.userId, learner.id)).all()).toEqual([]);
  });
});
