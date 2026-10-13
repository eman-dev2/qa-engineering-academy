import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { DEMO, DEMO_PASSWORD, logIn, openAccountMenu, signUp, uniqueEmail } from "./helpers";

test.describe("admin studio", () => {
  test("instructors can work on content but not on users and roles", async ({ page }) => {
    await logIn(page, DEMO.instructor, DEMO_PASSWORD);
    await openAccountMenu(page);
    await page.getByRole("banner").getByRole("link", { name: "Admin" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Admin studio");
    await page.getByRole("navigation", { name: "Admin sections" }).getByRole("link", { name: "Users and roles" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Administrators only");
  });

  test("an instructor creates a draft lesson, submits it, and only an administrator can publish", async ({ page, browser }) => {
    const slug = `e2e-draft-${randomUUID().slice(0, 6)}`;
    await logIn(page, DEMO.instructor, DEMO_PASSWORD);
    await page.goto("/admin/content/lessons/new");
    await page.getByLabel("Module").selectOption({ label: "Practical Manual Testing › Modelling behaviour" });
    await page.getByLabel("URL slug").fill(slug);
    await page.getByLabel("Title").fill("An end-to-end draft lesson");
    await page.getByLabel("Summary").fill("Created by the automated test suite to check the editorial workflow.");
    await page.getByRole("button", { name: "New lesson" }).click();
    await expect(page.getByRole("main").getByRole("status")).toHaveText("Created as a draft.");
    const editUrl = page.url();

    // Drafts are not public.
    const anon = await browser.newPage();
    await anon.goto(`/paths/practical-manual-testing/${slug}`);
    await expect(anon.getByRole("heading", { level: 1 })).toHaveText("This page doesn't exist");

    // The workflow panel lists what is missing, and instructors have no Publish button.
    await expect(page.getByText("Arabic content is missing")).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(0);
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByRole("main").getByRole("status").filter({ hasText: "Status changed" })).toHaveText("Status changed to In review.");

    // The administrator sees it in the review queue but can't publish an incomplete lesson.
    const admin = await browser.newPage();
    await logIn(admin, DEMO.admin, DEMO_PASSWORD);
    await admin.goto("/admin");
    await expect(admin.getByRole("link", { name: "An end-to-end draft lesson" })).toBeVisible();
    await admin.goto(editUrl.replace(/^https?:\/\/[^/]+/, ""));
    await admin.getByRole("button", { name: "Publish" }).click();
    await expect(admin.getByRole("main").getByRole("alert")).toContainText(/Can't publish yet: .*Arabic content is missing/);
    await admin.getByRole("button", { name: "Archive" }).click();
    await expect(admin.getByRole("main").getByRole("status").filter({ hasText: "Status changed" })).toHaveText("Status changed to Archived.");

    // Every change is in the audit log.
    await admin.goto("/admin/audit");
    await expect(admin.getByText("lesson.create").first()).toBeVisible();
    await expect(admin.getByText(/in_review → archived/).first()).toBeVisible();
    await anon.close();
    await admin.close();
  });

  test("an administrator edits a published lesson; invalid knowledge-check JSON is refused without losing edits", async ({ page }) => {
    await logIn(page, DEMO.admin, DEMO_PASSWORD);
    await page.goto("/admin/content");
    const row = page.getByRole("row", { name: /Decision tables for business rules/ });
    await row.getByRole("link", { name: "Edit lesson" }).click();
    await expect(page.getByLabel("URL slug")).toHaveAttribute("readonly", "");

    const quiz = page.getByLabel("Knowledge check (JSON)").first();
    const original = await quiz.inputValue();
    await quiz.fill("[ this is not json");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("isn't valid JSON");
    await expect(quiz).toHaveValue("[ this is not json");

    await quiz.fill(original);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("main").getByRole("status").first()).toHaveText("Changes saved.");
  });

  test("an administrator grants and removes a role; the last administrator is protected", async ({ page, browser }) => {
    const email = uniqueEmail("promote");
    const learner = await browser.newPage();
    await signUp(learner, { email, name: "Future Instructor" });

    await logIn(page, DEMO.admin, DEMO_PASSWORD);
    await page.goto(`/admin/users?q=${encodeURIComponent(email)}`);
    const card = page.getByRole("listitem").filter({ hasText: email });
    await card.getByLabel("Instructor").check();
    await card.getByRole("button", { name: "Update roles" }).click();
    await expect(card.getByRole("status")).toHaveText(`Roles updated for ${email}.`);

    await learner.reload();
    await openAccountMenu(learner);
    await expect(learner.getByRole("banner").getByRole("link", { name: "Admin" })).toBeVisible();

    // An administrator can't remove their own admin role.
    await page.goto(`/admin/users?q=${encodeURIComponent(DEMO.admin)}`);
    const self = page.getByRole("listitem").filter({ hasText: DEMO.admin });
    await self.getByLabel("Administrator").uncheck();
    await self.getByRole("button", { name: "Update roles" }).click();
    await expect(self.getByRole("alert")).toContainText("You can't remove your own administrator role.");
    await learner.close();
  });

  test("videos can only be added by YouTube link, never uploaded", async ({ page }) => {
    await logIn(page, DEMO.admin, DEMO_PASSWORD);
    await page.goto("/admin/videos");
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    await page.getByLabel("YouTube link or video id").fill("https://vimeo.com/12345");
    await page.getByLabel("Title exactly as on YouTube").fill("Some talk");
    await page.getByRole("button", { name: "Add video" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Enter a YouTube link");
  });

  test("admin pages are not reachable without signing in", async ({ page }) => {
    for (const url of ["/admin", "/admin/users", "/ar/admin/content"]) {
      await page.goto(url);
      await expect(page, url).toHaveURL(/\/login\?next=/);
    }
  });
});
