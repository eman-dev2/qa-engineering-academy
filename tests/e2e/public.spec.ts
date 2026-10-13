import { test, expect } from "@playwright/test";

const LINKEDIN = "https://www.linkedin.com/in/eman-abo-oun-28ba40207/";

test.describe("public pages", () => {
  test("the boundary probe on the landing page exposes the defect only at the boundary", async ({ page }) => {
    await page.goto("/");
    const probe = page.getByRole("region", { name: "Try it: test the free-shipping rule" });
    await probe.getByRole("button", { name: "49.99" }).click();
    await probe.getByRole("button", { name: "50.01" }).click();
    await expect(probe.getByText("Fail")).toHaveCount(0);
    await probe.getByLabel("Basket total (JOD)").fill("50");
    await probe.getByRole("button", { name: "Run test" }).click();
    await expect(probe.getByRole("row", { name: /50\.00.*Fail/ })).toBeVisible();
    await expect(probe.getByText("You found it.")).toBeVisible();

    await probe.getByLabel("Basket total (JOD)").fill("fifty");
    await probe.getByRole("button", { name: "Run test" }).click();
    await expect(probe.getByText("Enter an amount such as 49.99")).toBeVisible();
  });

  test("footer and About page link to the owner's LinkedIn profile safely", async ({ page }) => {
    await page.goto("/");
    const footerLink = page.getByRole("contentinfo").getByRole("link", { name: /Eman Abo-Oun on LinkedIn/ });
    await expect(footerLink).toHaveAttribute("href", LINKEDIN);
    await expect(footerLink).toHaveAttribute("target", "_blank");
    await expect(footerLink).toHaveAttribute("rel", "noopener noreferrer");

    await page.goto("/about");
    const aboutLink = page.getByRole("main").getByRole("link", { name: /View LinkedIn profile/ });
    await expect(aboutLink).toHaveAttribute("href", LINKEDIN);
    await expect(aboutLink).toHaveAttribute("rel", "noopener noreferrer");
    await expect(page.getByText("doesn't sign in with LinkedIn or share data with it")).toBeVisible();
  });

  test("every primary navigation link leads to a working page", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const [name, heading] of [
      ["Learning paths", "Learning paths"],
      ["Certifications", "Certification hub"],
      ["Library", "Library"],
      ["Roadmap", "Roadmap and status"],
      ["About", "About the project"],
    ]) {
      await nav.getByRole("link", { name }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    }
  });

  test("path page lists modules in order, marks planned lessons and links to lessons", async ({ page }) => {
    await page.goto("/paths/api-testing-essentials");
    await expect(page.getByRole("heading", { name: "Module 1: HTTP for testers" })).toBeVisible();
    await expect(page.getByText("Planned", { exact: true }).first()).toBeVisible();
    await page.getByRole("link", { name: /Anatomy of an HTTP exchange/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Anatomy of an HTTP exchange");
    await page.getByRole("link", { name: /Next lesson/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Designing tests for a REST endpoint");
  });

  test("the path catalog filters by starting level", async ({ page }) => {
    await page.goto("/paths");
    await page.getByRole("navigation", { name: "Filter by level" }).getByRole("link", { name: "QA lead" }).click();
    await expect(page).toHaveURL(/level=Lead/);
    await expect(page.getByRole("heading", { name: "Test Management" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "QA Foundations" })).toHaveCount(0);
  });

  test("search finds lessons, paginates and explains empty results", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText("Popular topics")).toBeVisible(); // results area has streamed in
    await page.getByRole("searchbox").fill("boundary");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/search\?q=boundary/);
    await expect(page.getByRole("link", { name: "Equivalence partitioning and boundary value analysis" })).toBeVisible();

    await page.goto("/search?q=test");
    await expect(page.getByText(/results for “test”, page 1 of \d+/)).toBeVisible();
    await page.getByRole("navigation", { name: "Search results pages" }).getByRole("link", { name: "Next" }).click();
    await expect(page.getByText(/page 2 of/)).toBeVisible();

    await page.goto("/search?q=kubernetes");
    await expect(page.getByText("No results for “kubernetes”.")).toBeVisible();
  });

  test("certification directory filters by verification status and stream", async ({ page }) => {
    await page.goto("/certifications");
    await page.getByRole("link", { name: "Verified facts only" }).click();
    await expect(page.getByText("Showing 4 of")).toBeVisible();
    await page.getByRole("group", { name: "Stream" }).getByRole("link", { name: "Expert Level" }).click();
    await expect(page.getByText("No verified certifications in this stream yet.")).toBeVisible();

    await page.goto("/certifications/ctfl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Certified Tester Foundation Level");
    await expect(page.getByText("26 points (65%)")).toBeVisible();
  });

  test("the library offers real template downloads, project briefs and attributed videos", async ({ page, request }) => {
    await page.goto("/library");
    const download = page.getByRole("link", { name: /Download/ }).first();
    const href = await download.getAttribute("href");
    expect(href).toMatch(/^\/templates\/en\//);
    expect((await request.get(href!)).status()).toBe(200);

    await page.getByRole("link", { name: "Open the project brief" }).first().click();
    await expect(page.getByRole("heading", { name: "Deliverables" })).toBeVisible();

    await page.goto("/library#videos");
    const videos = page.locator("#videos").locator("..");
    await expect(videos.getByRole("link", { name: /Playwright/ }).first()).toHaveAttribute("rel", "noopener noreferrer");
    // Nothing is loaded from YouTube until the learner presses play.
    await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
    await videos.getByRole("button", { name: /Play video/ }).first().click();
    await expect(page.locator('iframe[src^="https://www.youtube-nocookie.com/embed/"]')).toHaveCount(1);
  });

  test("unknown URLs show the not-found page and are excluded from search engines", async ({ page, request }) => {
    expect((await request.get("/no-such-section/deeper/still")).status()).toBe(404);
    // Unknown slugs under a streamed route are soft 404s: Next.js keeps 200 once streaming starts,
    // but renders the not-found UI and injects robots noindex (documented in KNOWN_LIMITATIONS.md).
    for (const url of ["/paths/nope", "/paths/qa-foundations/nope", "/certifications/nope", "/certifications/ct-pt"]) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1 }), url).toHaveText("This page doesn't exist");
      await expect(page.locator('meta[name="robots"][content*="noindex"]'), url).toHaveCount(1);
    }
  });

  test("keyboard users can skip to content", async ({ page }) => {
    await page.goto("/paths");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("theme toggle switches to dark and remembers it", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("Arabic site", () => {
  test("serves Arabic, right-to-left pages under /ar", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("navigation", { name: "التنقل الرئيسي" }).getByRole("link", { name: "مسارات التعلّم" })).toBeVisible();
  });

  test("the language switch keeps the same page in the other language", async ({ page }) => {
    await page.goto("/paths/qa-foundations/decision-tables");
    await page.getByRole("link", { name: "View this page in Arabic" }).click();
    await expect(page).toHaveURL("/ar/paths/qa-foundations/decision-tables");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("جداول القرار لقواعد العمل");
    await page.getByRole("link", { name: "اعرض هذه الصفحة بالإنجليزية" }).click();
    await expect(page).toHaveURL("/paths/qa-foundations/decision-tables");
  });

  test("redirects /en/... to the canonical unprefixed URL", async ({ page }) => {
    await page.goto("/en/paths");
    await expect(page).toHaveURL("/paths");
  });

  test("Arabic lessons are fully translated, with code kept left-to-right", async ({ page }) => {
    await page.goto("/ar/paths/api-testing-essentials/anatomy-of-an-http-exchange");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("تشريح تبادل HTTP");
    await expect(page.getByRole("heading", { name: "أخطاء شائعة" })).toBeVisible();
    await expect(page.getByText("هذا المحتوى غير متاح بالعربية بعد")).toHaveCount(0);
    const pre = page.locator(".prose-lesson pre").first();
    await expect(pre).toHaveCSS("direction", "ltr");
  });

  test("Arabic knowledge checks are scored with the same answer key", async ({ page }) => {
    await page.goto("/ar/paths/qa-foundations/decision-tables");
    const check = page.locator("#knowledge-check").locator("..");
    await check.getByRole("button", { name: "تحقّق من الإجابات" }).click();
    await expect(check.getByRole("alert")).toContainText("بقيت 3 أسئلة بلا إجابة");
    await check.getByLabel("16").check();
    await check.getByLabel("أن قيمة الشرط لا تغيّر النتيجة لتلك القاعدة").check();
    await check.getByLabel(/طرحها على مالك المنتج/).check();
    await check.getByRole("button", { name: "تحقّق من الإجابات" }).click();
    await expect(check.getByText("نتيجتك 3 من 3.")).toBeVisible();
    await expect(check.getByText("لم تُحفظ هذه المحاولة.")).toBeVisible();
  });

  test("Arabic search understands Arabic words", async ({ page }) => {
    await page.goto(`/ar/search?q=${encodeURIComponent("الحدود")}`);
    await expect(page.getByRole("link", { name: "تقسيم التكافؤ وتحليل القيم الحدّية" })).toBeVisible();
  });

  test("Arabic footer names the owner and links to LinkedIn", async ({ page }) => {
    await page.goto("/ar/about");
    const link = page.getByRole("contentinfo").getByRole("link", { name: /إيمان أبو عون/ }).last();
    await expect(link).toHaveAttribute("href", LINKEDIN);
  });
});
