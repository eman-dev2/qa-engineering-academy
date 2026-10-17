import { test, expect } from "@playwright/test";
import { PASSWORD, latestEmailTo, linkFrom, logIn, openAccountMenu, signUp, uniqueEmail } from "./helpers";

test.describe("authentication and protected routes", () => {
  test("dashboard redirects anonymous visitors to login and returns them after signing in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard/);

    const email = uniqueEmail();
    await signUp(page, { email });
    await openAccountMenu(page);
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Test Learner");
  });

  test("Arabic private pages redirect to the Arabic login", async ({ page }) => {
    await page.goto("/ar/dashboard");
    await expect(page).toHaveURL(/\/ar\/login\?next=%2Far%2Fdashboard/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("signup shows field-level errors and keeps entered values", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Name").fill("Sami");
    await page.getByLabel("Email", { exact: true }).fill("not-an-email");
    await page.getByLabel("Password", { exact: true }).fill("short1");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText("Check the highlighted fields.");
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Use at least 10 characters.")).toBeVisible();
    await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Name")).toHaveValue("Sami");
    await expect(page).toHaveURL("/signup");
  });

  test("Arabic signup shows Arabic validation messages", async ({ page }) => {
    await page.goto("/ar/signup");
    await page.getByRole("button", { name: "إنشاء الحساب" }).click();
    await expect(page.locator("form").getByRole("alert")).toBeVisible();
    await expect(page.locator("form").getByRole("alert")).toHaveText(/[؀-ۿ]/);
  });

  test("signup rejects an email that is already registered", async ({ page, browser }) => {
    const email = uniqueEmail();
    await signUp(page, { email });

    const other = await browser.newPage();
    await other.goto("/signup");
    await other.getByLabel("Name").fill("Someone Else");
    await other.getByLabel("Email", { exact: true }).fill(email.toUpperCase());
    await other.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await other.getByRole("button", { name: "Create account" }).click();
    await expect(other.getByText("An account with this email already exists. Log in instead.")).toBeVisible();
    await other.close();
  });

  test("new accounts get the learner role only, and cannot open the admin studio", async ({ page }) => {
    await signUp(page);
    await openAccountMenu(page);
    await expect(page.getByRole("banner").getByRole("link", { name: "Account" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("link", { name: "Admin" })).toHaveCount(0);
    await page.goto("/account");
    await expect(page.getByText("Learner", { exact: true })).toBeVisible();
    await page.goto("/admin");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("You don't have access to the admin studio");
  });

  test("login gives the same message for an unknown email and a wrong password", async ({ page }) => {
    const email = uniqueEmail();
    await signUp(page, { email });
    await page.context().clearCookies();

    const message = "That email and password combination is not recognised.";
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password-1");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText(message);

    await page.getByLabel("Email", { exact: true }).fill(uniqueEmail("nobody"));
    await page.getByLabel("Password", { exact: true }).fill("wrong-password-1");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText(message);
  });

  test("login ignores off-site next parameters (no open redirect)", async ({ page }) => {
    const email = uniqueEmail();
    await signUp(page, { email });
    await page.context().clearCookies();
    await page.goto("/login?next=//evil.example/steal");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("a forged session cookie does not grant access", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "qa_session", value: "forged-token", url: baseURL! }]);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("two accounts in two browsers stay separate", async ({ page, browser }) => {
    await signUp(page, { name: "First Learner" });
    const second = await browser.newPage();
    await signUp(second, { name: "Second Learner" });
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("First Learner");
    await expect(second.getByRole("heading", { level: 1 })).toContainText("Second Learner");
    await second.close();
  });
});

test.describe("password recovery", () => {
  test("reset link works once, changes the password and logs out other sessions", async ({ page, browser }) => {
    const email = uniqueEmail("reset");
    await signUp(page, { email });

    // A second, already signed-in device.
    const other = await browser.newPage();
    await logIn(other, email, PASSWORD);

    const anon = await browser.newPage();
    await anon.goto("/login");
    await anon.getByRole("link", { name: "Forgot your password?" }).click();
    await expect(anon.getByRole("heading", { level: 1, name: "Reset your password" })).toBeVisible();
    // Role queries skip the previous page, which the router keeps hidden for back navigation.
    await anon.getByRole("textbox", { name: "Email" }).fill(email);
    await anon.getByRole("button", { name: "Send reset link" }).click();
    await expect(anon.getByRole("main").getByRole("status")).toContainText("If an account exists for that email");

    const mail = latestEmailTo(email);
    expect(mail?.subject).toBe("Reset your QA Engineering Academy password");
    const link = linkFrom(mail!.text);
    expect(link).toMatch(/^\/reset-password\?token=/);

    await anon.goto(link);
    await anon.getByLabel("New password", { exact: true }).fill("new-password-2026");
    await anon.getByLabel("Confirm new password").fill("new-password-2026");
    await anon.getByRole("button", { name: "Save new password" }).click();
    await expect(anon).toHaveURL("/login?reset=1");
    await expect(anon.getByRole("main").getByRole("status")).toContainText("Your password has been changed");

    // Old sessions are gone, the old password no longer works, the new one does.
    await other.goto("/dashboard");
    await expect(other).toHaveURL(/\/login/);
    await anon.getByLabel("Email", { exact: true }).fill(email);
    await anon.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await anon.getByRole("button", { name: "Log in" }).click();
    await expect(anon.locator("form").getByRole("alert")).toBeVisible();
    await logIn(anon, email, "new-password-2026");

    // The link can't be used twice.
    await anon.goto(link);
    await expect(anon.getByRole("main").getByRole("alert")).toContainText("This reset link is invalid or has expired");
    await other.close();
    await anon.close();
  });

  test("asking for a reset does not reveal whether an account exists", async ({ page }) => {
    const nobody = uniqueEmail("nobody");
    await page.goto("/forgot-password");
    await page.getByLabel("Email", { exact: true }).fill(nobody);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("main").getByRole("status")).toContainText("If an account exists for that email");
    expect(latestEmailTo(nobody)).toBeUndefined();
  });

  test("a made-up token is refused", async ({ page }) => {
    await page.goto("/reset-password?token=this-token-was-never-issued-by-the-server");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("This reset link is invalid or has expired");
  });
});

test.describe("account settings", () => {
  test("profile, language preference, password and sessions can be managed", async ({ page, browser }) => {
    const email = uniqueEmail("settings");
    await signUp(page, { email });
    const other = await browser.newPage();
    await logIn(other, email, PASSWORD);

    await page.goto("/account");
    await expect(page.getByText("You're signed in on 2 devices")).toBeVisible();

    // Profile: name change needs no password; email change does.
    await page.getByLabel("Name").fill("Renamed Learner");
    await page.getByLabel("Preferred language").selectOption("ar");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByRole("main").getByRole("status").first()).toHaveText("Profile saved.");

    const newEmail = uniqueEmail("moved");
    await page.getByLabel("Email", { exact: true }).fill(newEmail);
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Enter your current password to change your email.")).toBeVisible();
    await page.getByLabel("Current password (only needed to change your email)").fill(PASSWORD);
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByRole("main").getByRole("status").first()).toHaveText("Profile saved.");

    // Password change logs out the other device.
    const pw = page.locator("form").filter({ has: page.getByRole("button", { name: "Change password" }) });
    await pw.getByLabel("Current password").fill(PASSWORD);
    await pw.getByLabel("New password", { exact: true }).fill("changed-password-9");
    await pw.getByLabel("Confirm new password").fill("changed-password-9");
    await pw.getByRole("button", { name: "Change password" }).click();
    await expect(pw.getByRole("status")).toContainText("Password changed");
    await other.goto("/dashboard");
    await expect(other).toHaveURL(/\/login/);

    // Logging in without a specific destination opens the dashboard in the preferred language (Arabic).
    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(newEmail);
    await page.getByLabel("Password", { exact: true }).fill("changed-password-9");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL("/ar/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("سجلّ تعلّم Renamed Learner");
    await other.close();
  });

  test("an account can be deleted with its password, and then can't log in", async ({ page }) => {
    const email = uniqueEmail("delete");
    await signUp(page, { email });
    await page.goto("/account");
    const form = page.locator("form").filter({ has: page.getByRole("button", { name: "Delete my account" }) });
    await form.getByLabel("Type your password to confirm").fill("not-my-password-1");
    await form.getByRole("button", { name: "Delete my account" }).click();
    await expect(form.getByText("Your current password is not correct.")).toBeVisible();
    await form.getByLabel("Type your password to confirm").fill(PASSWORD);
    await form.getByRole("button", { name: "Delete my account" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/login");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText("That email and password combination is not recognised.");
  });
});
