import { test, expect } from "@playwright/test";

test.describe("mobile layout", () => {
  test("menu opens, navigates and closes with Escape", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await toggle.click();
    const menu = page.getByRole("navigation", { name: "Mobile" });
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();

    await page.getByRole("button", { name: "Open menu" }).click();
    await menu.getByRole("link", { name: "Certifications" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Certification hub");
    await expect(menu).toBeHidden();
  });

  for (const url of ["/", "/paths/qa-foundations/decision-tables", "/certifications/ctfl", "/dashboard", "/search?q=api"]) {
    test(`no horizontal page scroll on ${url}`, async ({ page }) => {
      await page.goto(url);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("lesson list is available from a collapsible panel", async ({ page }) => {
    await page.goto("/paths/qa-foundations/decision-tables");
    await page.getByText("All lessons in QA Foundations").click();
    await page.getByRole("link", { name: /Writing defect reports/ }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Writing defect reports that get fixed");
  });
});
