# Implementation report

QA Engineering Academy, version 0.1.0. Report date: 18 October 2026.

Repository: <https://github.com/eman-dev2/qa-engineering-academy> · Owner: Eman Abo-Oun ([LinkedIn](https://www.linkedin.com/in/eman-abo-oun-28ba40207/))

## 1. Summary

A working, bilingual (English and Arabic, right-to-left) learning platform for software testers:

- real lessons, server-scored knowledge checks and a certification hub;
- learner accounts and a dashboard;
- an admin studio with an editorial workflow and role-based permissions.

It runs locally with one command on Windows, macOS or Linux, needs no external services, and is ready to deploy to Render from the included Blueprint.

Every feature listed as completed below was verified in the running application, by automated tests and by hand. Features that exist only as designs are listed as outstanding.

## 2. Completed features

| Area | What works | Verified by |
| --- | --- | --- |
| Bilingual site | Every page at `/` (English) and `/ar` (Arabic, RTL); the language switch keeps the page; `/en/...` redirects; `hreflang` alternates; Arabic fonts, plurals, dates and number agreement | E2E (Arabic suite), unit (dictionary parity, locale helpers) |
| Learning paths | 8 paths from Beginner to Test manager, 18 modules, level filter, progress per path | E2E, unit (seed rules) |
| Lessons | 14 complete lessons in both languages, each with objectives, prerequisites, key terms, body with highlighted code, common mistakes, exercise and model answer, knowledge check, references and review date; 25 outlines clearly marked as planned | Unit (every required part in both languages), E2E |
| Knowledge checks | Scored on the server; answer key not sent before submission; explanations; attempts saved for signed-in learners; same answer key in Arabic | E2E, unit (scoring) |
| Certification hub | 27 ISTQB® certifications; 4 with verified facts (source and review date shown); stream and verified filters; CTFL four-week study plan and 10 original practice questions in both languages; no fees shown | E2E, unit (no facts unless verified) |
| Library | 7 templates downloadable in both languages, 5 practice projects, 8 attributed YouTube videos loaded only on play | E2E, unit (files exist, videos by id) |
| Search | Lessons, paths, certifications; AND matching, ranking, pagination; Arabic normalisation | E2E, unit |
| Accounts | Signup (learner role only), login, logout, multiple sessions, throttle, generic errors, safe redirects, password recovery (30-minute single-use hashed tokens), profile, preferred language (opens the dashboard in that language after login), email change with password, password change (signs out other devices), sign out other devices, account deletion | E2E (auth suite), unit (hashing, validation, throttle, `safeNext`) |
| Dashboard | Continue where you left off, path progress, skill map, attempt history, saved lessons | E2E |
| Admin studio | Bilingual lesson, path and module editor; workflow (planned, draft, in review, published, archived) with a publish checklist; certification records with administrator-only verification; video curation by YouTube link; users and roles with last-admin and own-role protection; audit log | E2E (admin suite), unit (workflow, publish checks, parsers) |
| Permissions | Server-side checks in the proxy, pages, every Server Action and the workflow table; new registrations are learners; no admin credentials in the frontend | E2E (instructor blocked from users; learner blocked from admin; forged cookie refused) |
| Account bootstrap | First administrator from `ADMIN_EMAIL`/`ADMIN_PASSWORD` at start-up (server-only) or `npm run admin:create`; role changes with `npm run user:role`; demo accounts in development only | Unit (bootstrap, production refusal), manual Render-style start |
| Accessibility and layout | Skip link, landmarks, labelled fields with linked errors, keyboard menus, visible focus, light and dark themes, no horizontal scroll on phones | E2E (skip link, theme, mobile suite) |
| Error handling | Bilingual 404 (`noindex`), error boundary with a reference code, inline validation that keeps input, specific conflict messages | E2E |

## 3. Documentation

All linked from the [README](../README.md) and the [Arabic README](../README.ar.md):

| Document | Arabic version |
| --- | --- |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | |
| [ARCHITECTURE.md](ARCHITECTURE.md) | |
| [INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) | |
| [DATABASE.md](DATABASE.md) | |
| [USER_GUIDE.md](USER_GUIDE.md) | [ar/USER_GUIDE.md](ar/USER_GUIDE.md) |
| [ADMIN_GUIDE.md](ADMIN_GUIDE.md) | [ar/ADMIN_GUIDE.md](ar/ADMIN_GUIDE.md) |
| [SECURITY_AND_PERMISSIONS.md](SECURITY_AND_PERMISSIONS.md) | |
| [TESTING.md](TESTING.md) | |
| [DEPLOYMENT.md](DEPLOYMENT.md) | [ar/DEPLOYMENT.md](ar/DEPLOYMENT.md) |
| [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) | |

The documents were checked against the code. Counts, labels, commands, limits and permissions match the implementation, and every relative link and anchor resolves (checked with a script).

## 4. Diagrams

The 14 Mermaid diagrams are in [`docs/diagrams/`](diagrams/README.md). Each was rendered with mermaid-cli to confirm it parses, and PNG copies are in `rendered/`. Every diagram marks implemented parts (solid green) separately from planned ones (dashed grey).

| # | Diagram | Implemented | Planned parts |
| --- | --- | --- | --- |
| 1 | System architecture | Yes | Email provider, upload storage, PostgreSQL |
| 2 | Sitemap | Yes | Mock exams, community, interview prep, labs |
| 3 | Registration, login, logout, recovery | Yes | Real email, 2FA, shared throttle |
| 4 | Roles and permissions | Learner, instructor, admin | Contributor and moderator features |
| 5 | Onboarding and paths | Yes | Placement quiz, next-path suggestion |
| 6 | Path, module, lesson progression | Yes | Completion certificates |
| 7 | Quiz flow | Yes | Timed mock exams |
| 8 | Certification prep and mock exams | Hub, facts, study plan, practice | Mock exams |
| 9 | Admin content workflow | Yes | Revision history |
| 10 | YouTube curation | Yes | Automated discovery and re-checks |
| 11 | User video uploads | No | Whole flow (design only) |
| 12 | Entity relationships | Yes | Future tables listed |
| 13 | Testing, CI/CD, deployment | Tests and GitHub Actions running; Render configured | Branch protection, backups, monitoring |
| 14 | Error handling | Yes | Error-tracking service |

## 5. Seed data

- **Reproducible and safe.** Seeding runs at every start and only inserts what's missing; a second run changes nothing. It never deletes or overwrites data unless you pass `--force-content` explicitly. Demo accounts and `db:reset` are refused in production.
- **Content:** 8 paths, 18 modules, 39 lessons (14 complete in both languages), original quiz questions with explanations, 27 certifications with official source URLs and review dates, 8 curated videos, 7 templates (14 files), 5 practice projects and a skills taxonomy.
- **Demo accounts** (development only, marked `is_demo`): an English learner and an Arabic learner with synthetic progress, an instructor and an administrator.
- **Synthetic data only.** No real customer, financial, credential or KYC data.
- Commands are in the [README](../README.md#useful-commands) and [DATABASE.md](DATABASE.md#5-seeding-rules).

## 6. Verification results (18 October 2026)

| Check | Result |
| --- | --- |
| `npm ci` on a clean clone | Pass, no build tools needed |
| Seed scripts on an empty database | Pass (unit test and every e2e run start from an empty database) |
| TypeScript and ESLint | Pass |
| Unit tests (Vitest) | 82 / 82 passed |
| End-to-end tests (Playwright, production build) | 50 / 50 passed, twice in a row with 3 parallel workers |
| GitHub Actions CI | Passing on `main` |
| New user can register and log in | Pass (E2E) |
| Ordinary users can't reach admin functions | Pass (E2E: learner and instructor checks, forged cookie) |
| Administrator can manage content | Pass (E2E: create, review, publish checks, archive, edit, roles, videos) |
| `npm audit --omit=dev` | 0 vulnerabilities |

Problems found and fixed during final verification:

- On a fresh clone, the typecheck failed because Next.js route types hadn't been generated. Typecheck now runs `next typegen` first.
- Three end-to-end tests were timing-sensitive with parallel workers:
  - two reloaded the page before the server confirmed an optimistic update;
  - one waited for "network idle".
  
  They now wait for the server's confirmation, and the buttons expose `aria-busy` while saving.
- The preferred language was stored but had no effect. It now decides the language of the dashboard after login, and the settings page explains this.
- Password-reset links could take their host from the request header. They now use the configured site URL (or Render's own URL) first.

## 7. Outstanding tasks

In priority order (details in [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)):

1. **Public deployment.** Connect the repository to Render with the **Deploy to Render** button. This needs the owner's Render account. The Blueprint starts on the free plan, with no persistent data; move to a Starter instance with a disk for real learners.
2. **Real email delivery** for password resets (add a provider transport in `src/lib/mailer.ts`).
3. **Write the 25 planned lessons**, and verify exam facts for more certifications.
4. Admin studio: create new paths, templates and projects; lesson revision history.
5. Security hardening: a nonce-based Content-Security-Policy, and a shared login throttle before running more than one instance.
6. Testing: automated accessibility scans (axe), Firefox and WebKit runs, visual regression.
7. Planned products: timed mock exams, interview preparation, interactive labs, community Q&A, moderated user uploads.
8. Operations: scheduled off-site backups and uptime and error monitoring.
