# QA Engineering Academy

**A bilingual (English / العربية) learning platform for software testers, from first test case to test management.**

[العربية](README.ar.md) · [Documentation](#documentation) · [Run it locally](#run-it-locally) · [Demo accounts](#demo-accounts)

Created and maintained by **Eman Abo-Oun**, QA Specialist · [LinkedIn](https://www.linkedin.com/in/eman-abo-oun-28ba40207/)

| English | العربية (right to left) |
| --- | --- |
| ![Home page in English](docs/screenshots/en-home.png) | ![Home page in Arabic](docs/screenshots/ar-home.png) |
| ![A lesson in English](docs/screenshots/en-lesson.png) | ![A lesson in Arabic](docs/screenshots/ar-lesson.png) |

## What it is

Most testing courses are organised around tools. QA Engineering Academy teaches the judgement behind them: choosing the right boundary, questioning an ambiguous requirement, checking who is allowed to do what, and reporting risk in a way a team can act on. Every lesson follows the shape of real QA work (requirement → technique → evidence → report) with realistic product examples from banking, payments, delivery and e-commerce.

The whole site, including every lesson, knowledge check, certification page and the admin studio, is available in English at `/` and in Arabic at `/ar`, with a proper right-to-left layout.

## What's in it today

All of the following is implemented, tested and working. Planned items are listed separately so nothing is presented as available when it isn't.

**Learning**

- **8 learning paths** covering every career stage: QA Foundations, Practical Manual Testing, API Testing Essentials, Web Automation with Playwright and TypeScript, Senior Quality Engineering, QA Leadership, Test Management, and Payments and Fintech QA (in development).
- **14 complete lessons in English and Arabic** (roughly 1,700–2,300 words each in English, counting the exercise and knowledge check), each with objectives, prerequisites, key terms, common mistakes, an exercise with a model answer, a knowledge check scored on the server, references and a review date. **25 further lessons** are published as clearly marked outlines.
- **Certification hub** with the 27 current ISTQB® certifications. Exam facts appear only after checking the official page, with the source and review date: 4 are verified (CTFL v4.0, CTAL-TA, CTAL-TAE v2.0, CTAL-TM v3.0). CTFL has a four-week study plan and 10 original practice questions in both languages.
- **Library**: 7 downloadable templates (test plan, test case, defect report, traceability matrix, risk register, exploratory charter, release readiness checklist) in both languages, 5 portfolio practice projects, and 8 curated YouTube videos from the tools' own channels (linked and embedded with attribution, loaded only when you press play).
- **Search** across lessons, paths and certifications in both languages, with Arabic normalisation (definite article, hamza forms, diacritics).

**Accounts**

- Registration (every new account is a **learner**), login, logout, multiple sessions, password recovery with single-use expiring links, profile and language preference, password change (logs out other devices), log out other devices, and account deletion.
- **Dashboard**: continue where you left off, progress per path, a skill map, knowledge-check history and saved lessons.

**Admin studio** (instructors and administrators)

- Bilingual editor for paths, modules and lessons, with an editorial workflow (draft → in review → published → archived). Publishing requires complete English **and** Arabic content with matching knowledge-check answer keys.
- Certification records (only administrators can mark facts verified), video curation by YouTube link, users and roles (administrators only, with last-admin protection), and an audit log of every change.

**Quality**

- 82 unit tests (Vitest) and 50 end-to-end tests (Playwright) against a production build, in both languages, on desktop and a Pixel 7 viewport. Typecheck and lint are clean. `npm audit --omit=dev` reports 0 vulnerabilities.
- Accessible by design: skip link, landmarks, labelled forms with linked errors, keyboard-friendly menus, visible focus, light and dark themes, no horizontal scrolling on phones.

**Not built yet (planned):** sending real email (reset links go to the server log and a development outbox), timed mock exams, user video uploads with moderation, community Q&A, interview preparation, interactive labs. See [docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md) and the in-app roadmap.

## Run it locally

You need **Node.js 22 or newer** ([nodejs.org](https://nodejs.org/), LTS). Nothing else: the database is a file, and no C++ build tools are needed on Windows, macOS or Linux.

```bash
git clone https://github.com/eman-dev2/qa-engineering-academy.git
cd qa-engineering-academy
npm ci
npm run dev
```

Open <http://localhost:3000> (English) or <http://localhost:3000/ar> (Arabic).

The first `npm run dev` creates `data/academy.db`, loads all the content and creates the [demo accounts](#demo-accounts). It never deletes anything: later runs only add content that's missing.

<details>
<summary><b>Windows step by step (PowerShell)</b></summary>

1. Install Node.js 22 LTS from <https://nodejs.org/> (keep the default options), then open a **new** PowerShell window and check: `node --version` should print `v22…` or higher.
2. Install Git from <https://git-scm.com/download/win>, or download the repository as a ZIP from GitHub (**Code → Download ZIP**) and extract it.
3. In PowerShell:

   ```powershell
   cd C:\path\to\qa-engineering-academy
   npm ci
   npm run dev
   ```

4. Open <http://localhost:3000>. Stop the server with **Ctrl + C**.

If PowerShell says running scripts is disabled for `npm`, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or use the Command Prompt instead.

</details>

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with demo accounts |
| `npm run build` then `npm start` | Production build and server (port 3000) |
| `npm run check` | Typecheck, lint and unit tests |
| `npm run test:e2e` | End-to-end tests (first run `npx playwright install chromium`) |
| `npm run db:seed` | Add missing content and demo accounts (safe to repeat) |
| `npm run db:seed -- --reset-demo` | Recreate the demo accounts and their sample progress |
| `npm run db:reset -- --yes` | Delete the local database and rebuild it (development only) |
| `npm run admin:create -- --email you@example.com --name "Your Name"` | Create the first administrator (password is prompted) |
| `npm run user:role -- grant someone@example.com instructor` | Grant or revoke a role from the command line |

### Configuration

No external accounts, API keys or authentication provider are needed. Authentication is built in, and the database is a local file. In development every setting is optional; copy `.env.example` to `.env.local` to override one.

| Variable | Use |
| --- | --- |
| `DATABASE_PATH` | Where the SQLite file lives (default `./data/academy.db`) |
| `NEXT_PUBLIC_SITE_URL` | Public address for reset links and the sitemap (production) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | First administrator, created at start-up when none exists (server-side only) |
| `DEMO_PASSWORD` | Password for the development demo accounts |

All variables are described in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#3-environment-variables).

### Database, migrations and seed data

- Migrations live in `drizzle/` and are applied automatically by `npm run dev`, `npm run build` and `npm start`. After changing `src/lib/db/schema.ts`, run `npm run db:generate` and commit the new SQL file.
- Seeding only **adds what's missing**: 8 paths, 18 modules, 39 lessons (14 complete in both languages), 27 certifications, 8 videos, 7 templates and 5 practice projects. It never deletes or overwrites data unless you pass `--force-content` explicitly.
- Details and every seed command: [docs/DATABASE.md](docs/DATABASE.md#5-seeding-rules).

### Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/eman-dev2/qa-engineering-academy)

The button opens Render with this repository's Blueprint (`render.yaml`). It starts on Render's **free plan**, which suits a demo: the service sleeps when idle, and accounts created on it are lost whenever it restarts, because there's no persistent disk. The content and the administrator are recreated automatically. Render asks for two values: `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

The repository also includes a `Dockerfile`, and a GitHub Actions workflow that runs every test on each push. Step-by-step instructions are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [in Arabic as well](docs/ar/DEPLOYMENT.md). They cover the free plan, the persistent paid setup, Docker and a plain Linux server.

## Demo accounts

Created automatically in development only (refused when `NODE_ENV=production`). Password for all: **`Demo-Password-2026`**.

| Email | Roles | Notes |
| --- | --- | --- |
| `learner@demo.qa-academy.test` | learner | English, with sample progress |
| `mutaallim@demo.qa-academy.test` | learner | Arabic, with sample progress |
| `instructor@demo.qa-academy.test` | learner, instructor | Can draft and submit lessons |
| `admin@demo.qa-academy.test` | learner, admin | Full admin studio |

On a public deployment, create the real administrator with `ADMIN_EMAIL` / `ADMIN_PASSWORD` or `npm run admin:create`. See [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md).

## Documentation

| Document | Contents |
| --- | --- |
| [Project overview](docs/PROJECT_OVERVIEW.md) | Purpose, audience, scope, what's done and what's next |
| [Architecture](docs/ARCHITECTURE.md) | Stack, structure, rendering and caching, i18n, decisions |
| [Information architecture](docs/INFORMATION_ARCHITECTURE.md) | Pages, navigation, URL scheme, content model |
| [Database](docs/DATABASE.md) | Every table, migrations, seeding, backups |
| [User guide](docs/USER_GUIDE.md) · [دليل المستخدم](docs/ar/USER_GUIDE.md) | Using the site as a learner |
| [Admin guide](docs/ADMIN_GUIDE.md) · [دليل الإدارة](docs/ar/ADMIN_GUIDE.md) | Running the admin studio, roles, first administrator |
| [Security and permissions](docs/SECURITY_AND_PERMISSIONS.md) | Authentication, sessions, roles, threats and controls |
| [Testing](docs/TESTING.md) | Test strategy, suites, how to run, coverage |
| [Deployment](docs/DEPLOYMENT.md) · [النشر والتشغيل](docs/ar/DEPLOYMENT.md) | Local, Render, Docker, environment variables |
| [Known limitations](docs/KNOWN_LIMITATIONS.md) | What isn't done, and why |
| [Diagrams](docs/diagrams/README.md) | 14 Mermaid diagrams, implemented vs planned marked |
| [Implementation report](docs/IMPLEMENTATION_REPORT.md) | What was built, verification results, next steps |

## Tech stack

Next.js 16 (App Router, Cache Components, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · SQLite with better-sqlite3 and Drizzle ORM · Zod · unified/remark/Shiki for lessons · Vitest · Playwright.

## Content and trademarks

Lessons, exercises and practice questions are original work written for this site. ISTQB® is a registered trademark of the International Software Testing Qualifications Board; this project is independent and not affiliated with ISTQB or any certification body. Videos belong to their creators and are linked and embedded, never re-hosted.

© 2026 Eman Abo-Oun. All rights reserved.
