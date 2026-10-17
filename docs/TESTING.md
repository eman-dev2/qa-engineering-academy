# Testing

Test strategy, the suites, how to run them, and what they cover. Last reviewed: 13 October 2026.

See also: [diagram 13, testing, CI/CD and deployment](diagrams/13-testing-ci-cd-deployment.md)

## 1. Strategy

A learning platform for testers should be tested the way it teaches. The approach is risk-based: the most effort goes where a defect would hurt learners or leak data.

| Risk | Why it matters | How it's covered |
| --- | --- | --- |
| Someone gains a role they shouldn't have | Privilege escalation, content tampering | E2E role tests (instructor blocked from users; new account is learner only; forged cookie refused); unit tests for the workflow table and last-admin rules |
| Account takeover or enumeration | Personal data, trust | E2E: same login error for unknown email and wrong password, no open redirect, reset link single-use; unit: hashing, throttle, `safeNext` |
| Answer keys leak to the browser | Knowledge checks become meaningless | E2E asserts the explanation isn't in the page HTML before submitting; unit tests for scoring |
| Arabic is incomplete or broken | Half the audience | Unit: same dictionary keys and placeholders, Arabic script present, every published lesson has Arabic text and matching quiz keys. E2E: RTL pages, Arabic validation, Arabic search, Arabic scoring |
| Seeding damages live data | Lost admin edits | Unit: repeatable seeding, no overwrite unless forced, no demo accounts in production |
| Content quality slips | Thin or broken lessons | Unit: every published lesson has all required parts in both languages, https references, unique anchors, review dates; the admin publish check enforces the same bar |
| Layout breaks on phones | Most learners read on phones | E2E on a Pixel 7 viewport: menu, no horizontal scroll, lesson list panel |

Test levels:

- **Unit (Vitest):** pure logic and data rules. Fast, run on every change.
- **End to end (Playwright):** real browser against a **production build** with a fresh seeded database, in both languages, on desktop and mobile.
- **Static checks:** TypeScript strict mode (after generating Next.js route types) and ESLint (Next.js rules).

## 2. Running the tests

```bash
npm run check          # typecheck + lint + unit tests (about 30 seconds)
npm test               # unit tests only
npx playwright install chromium   # once, before the first end-to-end run
npm run test:e2e       # builds the app, starts it on port 3200 with data/e2e.db, runs all end-to-end tests
npx playwright show-report        # open the HTML report after a run
```

End-to-end runs never touch your development database. `scripts/e2e-db.ts` deletes and reseeds `data/e2e.db`, and refuses to run if `DATABASE_PATH` doesn't contain `e2e`. Use `E2E_PORT=4000 npm run test:e2e` if port 3200 is busy. Outside CI, an already-running server on that port is reused, so stop old servers first if you changed the code.

## 3. Results

Last full run on 18 October 2026 (the clean-clone run was on 13 October 2026):

| Check | Result |
| --- | --- |
| TypeScript (`next typegen && tsc --noEmit`) | Pass |
| ESLint | Pass, no warnings |
| Unit tests | **82 passed**, 6 files |
| End-to-end tests | **50 passed** (43 desktop Chrome, 7 Pixel 7); also passed twice in a row with 3 parallel workers |
| GitHub Actions CI | Pass (same commands on Ubuntu, Node 22, 2 workers) |
| `npm audit --omit=dev` | 0 vulnerabilities |

## 4. Unit tests (`tests/unit/`)

| File | Covers |
| --- | --- |
| `auth.test.ts` | Password hashing (correct and wrong password, unique salts, malformed hashes); signup validation, including the 9/10-character password boundary; login requires a password; `safeNext` open-redirect protection; throttle after 8 failures and reset after the window |
| `quiz-and-search.test.ts` | Scoring (unknown and missing answers count as wrong; only `q:` fields are read); search tokenising, AND semantics, title ranking, prefix matching, empty queries, page clamping |
| `content.test.ts` | Seed content rules: at least 14 published lessons with English and Arabic; every required lesson part in both languages; matching Arabic quiz keys and references; unique anchors; https references and no placeholder text; review dates; path coverage of career levels; unique slugs; bilingual paths, modules and outlines; certification verification rules (no exam facts unless verified); practice questions; videos linked by id with attribution; a real file for every template in both languages; bilingual projects; owner LinkedIn kept in one place |
| `i18n.test.ts` | Arabic and English dictionaries have the same keys and placeholders, no empty strings, real Arabic text; locale path helpers; text direction; placeholders; Arabic plural categories; Arabic duration agreement; deterministic dates; Arabic search normalisation (article, hamza, diacritics, stop words) |
| `admin.test.ts` | Admin text formats (lines, `::` pairs, references, YouTube ids, slugs); workflow transitions and administrator-only actions; publish checks (complete lesson passes; missing Arabic, review date, body, quiz, matching keys or skills are refused) |
| `database.test.ts` | Seeding an empty database; repeatable seeding; admin edits kept unless forced; both languages stored; demo accounts with learner roles and synthetic progress; demo accounts refused in production; administrator bootstrap (create, promote, weak password rejected); deleting a user cascades to their data |

## 5. End-to-end tests (`tests/e2e/`)

| File | Scenarios |
| --- | --- |
| `public.spec.ts` | Boundary probe on the home page; LinkedIn links in the footer and on About (`target=_blank`, `noopener`); every main navigation link works; path page order and planned labels; path filter; search results, pagination and empty state; certification filters; template downloads, project briefs and attributed videos; unknown URLs show the not-found page with `noindex`; skip link; dark theme remembered. **Arabic:** RTL under `/ar`; language switch keeps the page; `/en/...` redirect; fully translated lessons with left-to-right code; Arabic scoring with the same key; Arabic search; Arabic footer and LinkedIn |
| `auth.spec.ts` | Dashboard redirect and return after login; Arabic private pages go to the Arabic login; field errors with values kept; Arabic validation messages; duplicate email; new accounts are learners and can't open the admin studio; same error for unknown email and wrong password; off-site `next` ignored; forged session cookie refused; two accounts in two browsers stay separate. **Recovery:** link works once, changes the password and signs out other sessions; no enumeration; made-up token refused. **Account:** profile, preferred language (login then opens the Arabic dashboard), email change needs the password, password change signs out the other device; account deletion with password |
| `learning.spec.ts` | Server-scored knowledge check (answers not in the HTML beforehand), unanswered count, explanations, retry, bookmark, completion, persistence after reload, dashboard history, saved list and progress bars; un-completing persists; "continue where you left off"; anonymous attempts aren't saved |
| `admin.spec.ts` | Instructor can open the studio but not users and roles; instructor creates a draft (hidden from the public), can't publish, submits; administrator sees it in the review queue, publish is refused with the missing Arabic content listed, archives it; audit log entries. Administrator edits a published lesson, invalid knowledge-check JSON is refused without losing edits, slug is read-only. Administrator grants a role (the learner then sees Admin); can't remove their own admin role. Videos by YouTube link only (no file input; other sites refused). Admin pages require sign-in |
| `responsive.spec.ts` (Pixel 7) | Mobile menu opens, navigates and closes with Escape; no horizontal scroll on home, a lesson, a certification, dashboard (login) and search; lesson list panel |

Conventions:

- Locators use roles, labels and visible text, the way a person finds things, so the tests also check accessible names.
- Each test creates its own account (`uniqueEmail()`), so tests are independent and can run in parallel.
- Development demo accounts are used only to sign in as instructor or administrator, never modified.
- Password-reset tests read the reset link from the e2e database's outbox table, because production builds have no outbox page.

## 6. Continuous integration

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests:

1. `npm ci`
2. `npm run typecheck`
3. `npm run lint`
4. `npm test`
5. `npx playwright install --with-deps chromium`
6. `npm run test:e2e` (production build, 2 workers, one retry)
7. On failure: the end of the Playwright output is shown as an annotation, and the HTML report is uploaded as an artifact for 14 days.

## 7. Manual checks done for this release

- Visual review of the main pages in both languages, in light and dark themes, at desktop and phone widths. The screenshots in [`docs/screenshots/`](screenshots/) come from this review.
- A clean clone on Node 22: `npm ci`, `npm run dev`, `npm run build`, `npm start`. The Render-style build used a separate build database, and the administrator bootstrap was tested from environment variables.

## 8. Not covered yet

- Automated accessibility scanning (axe) and visual regression snapshots.
- Load testing. The design targets a single instance; see [ARCHITECTURE.md](ARCHITECTURE.md#9-scaling-path).
- Cross-browser runs beyond Chromium (Firefox and WebKit projects can be added to `playwright.config.ts`).
- The Docker image hasn't been built in this environment (no Docker daemon); its steps mirror the tested build.
