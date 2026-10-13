---
title: "Locators and auto-waiting in Playwright"
summary: "Most flaky UI tests come from two habits: brittle selectors and manual waits. Learn how Playwright's user-facing locators and built-in waiting remove both."
minutes: 26
level: Junior
skills: [ui-automation, programming]
reviewedOn: "2026-10-12"
objectives:
  - "Choose locators in order of resilience: role, label and text before test ids, and CSS or XPath only as a last resort."
  - "Explain strictness and lazy re-resolution of locators, and use filtering and chaining instead of nth()."
  - "Describe the actionability checks Playwright performs before an action."
  - "Replace fixed waits and value comparisons with web-first assertions."
prerequisites:
  - "Basic TypeScript: variables, functions and async/await"
  - "Playwright installed in a project (npm init playwright@latest)"
keyTerms:
  - term: Locator
    definition: "A description of how to find an element. It is evaluated each time it is used, not when it is created."
  - term: Strictness
    definition: "An action on a locator that matches more than one element throws an error instead of picking one."
  - term: Actionability checks
    definition: "Conditions Playwright waits for before acting, such as the element being visible, stable, enabled and receiving events."
  - term: Web-first assertion
    definition: "An assertion such as toBeVisible() that retries until the condition is met or the timeout expires."
mistakes:
  - mistake: "Copying long CSS or XPath selectors from the browser's dev tools."
    fix: "Use getByRole with an accessible name. It survives layout changes and fails when the page becomes inaccessible, which is a real defect."
  - mistake: "Adding page.waitForTimeout(2000) to make a test pass."
    fix: "Fixed waits are too long when the app is fast and too short when it's slow. Wait for a signal instead: a web-first assertion or a specific response."
  - mistake: "Reading text with textContent() and comparing it with expect(text).toBe(...)."
    fix: "Use await expect(locator).toHaveText(...). It retries until the text matches, so it doesn't race the page."
  - mistake: "Using locator.nth(2) to pick the third matching row."
    fix: "Filter by what makes the row unique, for example getByRole('row').filter({ hasText: 'INV-1042' }). Position changes when data changes."
exercise:
  title: "Rewrite a flaky test"
  brief: |
    This test passes locally and fails about one run in five on CI:

    ```ts
    test("customer can apply a voucher", async ({ page }) => {
      await page.goto("/basket");
      await page.locator("#app > div.main > div:nth-child(3) input").fill("SPRING-10");
      await page.locator("button.btn.btn-primary").click();
      await page.waitForTimeout(1500);
      const total = await page.locator(".summary .total span").textContent();
      expect(total).toBe("45.00 JOD");
    });
    ```

    The voucher field has the label "Voucher code", the button reads "Apply", and the total is in a row labelled "Total". Rewrite the test so it is resilient and doesn't wait for a fixed time. Explain each change.
  modelAnswer: |
    ```ts
    test("customer can apply a voucher", async ({ page }) => {
      await page.goto("/basket");
      await page.getByLabel("Voucher code").fill("SPRING-10");
      await page.getByRole("button", { name: "Apply" }).click();
      await expect(
        page.getByRole("row", { name: /Total/ }),
      ).toContainText("45.00 JOD");
    });
    ```

    - **getByLabel** replaces a positional CSS path that breaks whenever the layout changes. It also checks that the field has an accessible label.
    - **getByRole("button", { name: "Apply" })** replaces `button.btn.btn-primary`, which matched any primary button on the page. With several matches, Playwright's strictness would make the action fail.
    - **The fixed wait is gone.** The web-first assertion retries until the total updates (up to the expect timeout, 5 seconds by default), so it passes as soon as the page is ready and fails clearly if it never is.
    - **The value check moved into the assertion**, so it can't read the old total before the update arrives, which was the real cause of the CI failures.
quiz:
  - id: q1
    prompt: "Which locator does Playwright's documentation recommend first for a submit button labelled 'Pay now'?"
    options:
      - { id: a, text: "page.locator('#checkout > form > button:nth-child(4)')" }
      - { id: b, text: "page.getByRole('button', { name: 'Pay now' })" }
      - { id: c, text: "page.locator('//button[4]')" }
      - { id: d, text: "page.locator('.btn-primary')" }
    answer: b
    explanation: "Role locators reflect how users and assistive technology perceive the page. CSS and XPath tied to structure break when the DOM changes, which the docs call out as non-resilient."
  - id: q2
    prompt: "A locator matches three buttons and the test calls click() on it. What happens?"
    options:
      - { id: a, text: "Playwright clicks the first one" }
      - { id: b, text: "Playwright clicks all three" }
      - { id: c, text: "The action throws, because locators are strict" }
      - { id: d, text: "Playwright picks one at random" }
    answer: c
    explanation: "Actions on a locator that resolves to more than one element throw. That forces you to make the locator specific instead of silently acting on the wrong element."
  - id: q3
    prompt: "Before clicking, which of these does Playwright NOT check as part of actionability?"
    options:
      - { id: a, text: "The element is visible" }
      - { id: b, text: "The element is stable (not animating)" }
      - { id: c, text: "The element receives events (not covered by another element)" }
      - { id: d, text: "The element's text matches the test name" }
    answer: d
    explanation: "Before a click, Playwright waits for a single matching element that is visible, stable, receives events and is enabled. Text matching is something you assert, not an actionability check."
  - id: q4
    prompt: "Why is await expect(locator).toHaveText('Paid') better than reading the text and comparing it?"
    options:
      - { id: a, text: "It is shorter" }
      - { id: b, text: "It retries until the text matches or the timeout expires, so it doesn't race the page" }
      - { id: c, text: "It ignores case" }
      - { id: d, text: "It runs faster because it doesn't wait" }
    answer: b
    explanation: "Web-first assertions poll the page. Reading a value once captures whatever is there at that instant, which may be the state before an update."
references:
  - title: "Locators"
    url: "https://playwright.dev/docs/locators"
    publisher: "Playwright"
  - title: "Auto-waiting and actionability"
    url: "https://playwright.dev/docs/actionability"
    publisher: "Playwright"
  - title: "Assertions"
    url: "https://playwright.dev/docs/test-assertions"
    publisher: "Playwright"
---

## Why UI tests become flaky

A UI test races the application. The test sends a click; the app starts a request, waits for the server, re-renders and maybe animates. If the test looks for the result before it exists, the test fails even though the app is fine. Run it again and it passes. That is a flaky test, and it's the main reason teams stop trusting automation.

Two habits cause most of it: **selectors tied to page structure**, which break or match the wrong element when the layout changes, and **manual waits**, which guess how long the app needs. Playwright is designed to remove both, but only if you use its locators and assertions the way they were intended.

## Locators that describe what the user sees

A locator is a description of how to find an element, written from the user's point of view. Playwright's built-in locators, in the order its documentation recommends:

| Locator | Finds an element by | Example |
| --- | --- | --- |
| `getByRole` | Its accessibility role and accessible name | `getByRole('button', { name: 'Pay now' })` |
| `getByLabel` | The text of its form label | `getByLabel('Email')` |
| `getByPlaceholder` | Its placeholder text | `getByPlaceholder('Search orders')` |
| `getByText` | Visible text content | `getByText('Payment received')` |
| `getByAltText` | An image's text alternative | `getByAltText('Company logo')` |
| `getByTitle` | Its title attribute | `getByTitle('Close')` |
| `getByTestId` | A `data-testid` attribute | `getByTestId('order-total')` |

`getByRole` is the default choice. A role locator survives class renames, layout changes and component library upgrades. It also has a useful side effect: if a button loses its accessible name, the test fails, and that is a real accessibility defect, not test noise.

Test ids are a contract between testers and developers. They're the right choice when nothing user-facing is unique or stable, for example a chart with no text. CSS and XPath tied to the DOM structure are the last resort; Playwright's documentation says plainly that they lead to non-resilient tests.

## Strict and lazy: how locators behave

Two properties of locators explain most surprising failures.

**Locators are strict.** If an action's locator matches more than one element, the action throws instead of picking one. That's deliberate: clicking "the first Delete button" is how tests delete the wrong record. Narrow the locator instead:

```ts
// Too broad: there is a Delete button on every row.
await page.getByRole("button", { name: "Delete" }).click(); // throws

// Narrow it to the row that matters.
await page
  .getByRole("row")
  .filter({ hasText: "INV-1042" })
  .getByRole("button", { name: "Delete" })
  .click();
```

**Locators are lazy.** Creating a locator doesn't search the page. Every time you use it, Playwright looks for an up-to-date element. If the page re-renders between two steps, the locator finds the new element. That's why you can define locators once, for example in a page object, and reuse them safely.

Avoid `nth()` and `first()` unless position really is the requirement ("the newest message appears at the top"). Positions change when data changes; filters based on content don't.

## Auto-waiting: what happens before a click

When you call `click()`, Playwright doesn't click immediately. It waits until the target passes a set of **actionability checks**:

1. The locator resolves to exactly one element.
2. The element is **visible**.
3. The element is **stable**, meaning it is not animating.
4. The element **receives events**: it isn't covered by an overlay, spinner or cookie banner.
5. The element is **enabled**.

Other actions use the subset that makes sense; `fill()`, for example, also requires the field to be editable. If the checks don't pass within the action timeout, the action fails with a `TimeoutError` that says which check failed, for example "element is not enabled" or "element intercepts pointer events". That message is diagnostic gold: read it before you change anything.

This is why you don't need `waitForSelector` before actions, and why `page.waitForTimeout()` is the wrong fix. Playwright's own API documentation says it should only be used for debugging, because tests that wait for time are inherently flaky.

## Web-first assertions

Actions wait automatically; assertions need to wait too. Compare:

```ts
// Races the page: reads once, possibly before the update.
const status = await page.getByTestId("order-status").textContent();
expect(status).toBe("Paid");

// Retries until the text is "Paid" or the timeout expires.
await expect(page.getByTestId("order-status")).toHaveText("Paid");
```

The second form is a **web-first assertion**. It polls the page until the condition holds, up to the expect timeout (5 seconds by default, configurable in `playwright.config.ts`). The most useful ones:

| Assertion | Checks |
| --- | --- |
| `toBeVisible()` / `toBeHidden()` | Element shown or not shown |
| `toHaveText()` / `toContainText()` | Exact text, or text that includes a fragment |
| `toHaveValue()` | Current value of an input |
| `toBeEnabled()` / `toBeDisabled()` | Whether a control can be used |
| `toHaveCount()` | Number of matching elements, for example rows after filtering |
| `toHaveURL()` / `toHaveTitle()` | Page-level state after navigation |

A good rule: if a value comes from the page, assert on the locator, not on a value you've read out of it.

## Putting it together

A checkout test written this way reads like the user's journey and contains no timing guesses:

```ts
import { test, expect } from "@playwright/test";

test("signed-in customer can pay for a basket", async ({ page }) => {
  await page.goto("/basket");
  await expect(page.getByRole("heading", { name: "Your basket" })).toBeVisible();

  await page.getByLabel("Voucher code").fill("SPRING-10");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByRole("row", { name: /Discount/ })).toContainText("-5.00");

  await page.getByRole("button", { name: "Pay now" }).click();
  await expect(page).toHaveURL(/\/orders\/\w+/);
  await expect(page.getByRole("status")).toHaveText("Payment received");
});
```

When this test fails, it fails at the step that broke, with a message that names the element and the check. That is the difference between a suite people trust and a suite people re-run until it's green.

Next in this path: web-first assertions in more depth, including writing your own polling checks.
