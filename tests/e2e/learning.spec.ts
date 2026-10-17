import { test, expect } from "@playwright/test";
import { signUp } from "./helpers";

const LESSON = "/paths/qa-foundations/equivalence-partitioning-and-boundaries";

test.describe("learning flow", () => {
  test("knowledge check is scored on the server and progress persists to the dashboard", async ({ page }) => {
    await signUp(page, { next: LESSON });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Equivalence partitioning and boundary value analysis");

    // Answer explanations (and therefore the answer key) are not sent to the browser before submission.
    const html = await page.content();
    expect(html).not.toContain("Only the boundary value itself reveals the off-by-one comparison");

    const check = page.locator("#knowledge-check").locator("..");
    await check.getByRole("button", { name: "Check answers" }).click();
    await expect(check.getByRole("alert")).toContainText("Answer every question before checking. 4 questions are unanswered.");

    // Answer: q1 correct, q2 correct, q3 correct, q4 wrong.
    await check.getByLabel("0, 1, 12, 13").check();
    await check.getByLabel("67%").check();
    await check.getByLabel(/first validation failure can mask/).check();
    await check.getByLabel("total = 49.99").check();
    await expect(check.getByText("4 of 4 answered")).toBeVisible();
    await check.getByRole("button", { name: "Check answers" }).click();

    await expect(check.getByText("You scored 3 out of 4.")).toBeVisible();
    await expect(check.getByText("This attempt is saved to your")).toBeVisible();
    await expect(check.getByText(/off-by-one comparison/)).toBeVisible();

    // Retry gives a fresh form.
    await check.getByRole("button", { name: "Try again" }).click();
    await expect(check.getByText("0 of 4 answered")).toBeVisible();

    // Bookmark and complete.
    // The buttons update optimistically and stay disabled until the server confirms the change.
    await page.getByRole("button", { name: "Save for later" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Saved" })).toBeEnabled();
    await page.getByRole("button", { name: "Mark lesson as complete" }).click();
    await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Completed" })).toBeEnabled();
    await expect(page.getByText("Your best knowledge-check score is 3 of 4.")).toBeVisible();

    // Persisted after reload.
    await page.reload();
    await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText(/^1 of \d+ published lessons completed$/)).toBeVisible();
    const history = page.getByRole("table");
    await expect(history.getByRole("row", { name: /Equivalence partitioning.*3\/4/ })).toBeVisible();
    await expect(page.locator("#saved").locator("..").getByRole("link", { name: "Equivalence partitioning and boundary value analysis" })).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "QA Foundations progress" })).toHaveAttribute("aria-valuenow", "1");
    await expect(page.getByRole("progressbar", { name: "Manual testing and test design skill progress" })).toHaveAttribute("aria-valuenow", "1");
  });

  test("marking a lesson incomplete again is persisted", async ({ page }) => {
    await signUp(page, { next: LESSON });
    await page.getByRole("button", { name: "Mark lesson as complete" }).click();
    await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
    await page.getByRole("button", { name: "Completed" }).click();
    await expect(page.getByRole("button", { name: "Mark lesson as complete" })).toBeEnabled();
    await page.reload();
    await expect(page.getByRole("button", { name: "Mark lesson as complete" })).toBeVisible();
  });

  test("dashboard suggests continuing the lesson most recently opened", async ({ page }) => {
    const lesson = "/paths/api-testing-essentials/authentication-vs-authorization";
    // The visit is recorded by a server action the lesson page calls after it loads; wait for its response.
    const visitRecorded = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === lesson);
    await signUp(page, { next: lesson });
    await visitRecorded;
    await page.goto("/dashboard");
    const cont = page.locator("#continue").locator("..");
    await expect(cont).toContainText("Continue where you left off");
    await expect(cont).toContainText("Authentication vs authorization");
  });

  test("anonymous learners can take a check, but nothing is saved", async ({ page }) => {
    await page.goto("/certifications/ctfl#practice");
    const practice = page.locator("#practice");
    const groups = practice.getByRole("group");
    const count = await groups.count();
    expect(count).toBe(10);
    for (let i = 0; i < count; i++) {
      await groups.nth(i).getByRole("radio").first().check();
    }
    await practice.getByRole("button", { name: "Check answers" }).click();
    await expect(practice.getByText(/You scored \d+ out of 10/)).toBeVisible();
    await expect(practice.getByText("This attempt was not saved.")).toBeVisible();
  });
});
