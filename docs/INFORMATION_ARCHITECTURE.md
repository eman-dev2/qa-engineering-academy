# Information architecture

Pages, navigation, URLs and the content model. Last reviewed: 13 October 2026.

See also: [diagram 2, sitemap](diagrams/02-sitemap.md) · [diagram 5, onboarding and paths](diagrams/05-onboarding-and-learning-paths.md) · [diagram 6, progression](diagrams/06-course-module-lesson-progression.md)

## 1. URL scheme

| Language | Pattern | Example |
| --- | --- | --- |
| English | `/<page>` | `/paths/qa-foundations/decision-tables` |
| Arabic | `/ar/<page>` | `/ar/paths/qa-foundations/decision-tables` |
| English with prefix | `/en/<page>` redirects (308) to `/<page>` | `/en/library` → `/library` |

Slugs are the same in both languages, so the language switch keeps you on the same page, and a shared link works for everyone. Every page declares its alternate in the other language (`hreflang`), and `sitemap.xml` lists both.

## 2. Pages

### Public

| Page | URL | Purpose |
| --- | --- | --- |
| Home | `/` | What the academy teaches, how a lesson works, an interactive boundary-value probe, path and certification highlights |
| Learning paths | `/paths` | Catalog of 8 paths with starting and target level; filter by starting level |
| Path | `/paths/:path` | Goal, prerequisites, outcomes, milestones, modules in order; complete lessons are links and planned lessons are labelled outlines; your progress when signed in |
| Lesson | `/paths/:path/:lesson` | Lesson reader (see section 4) |
| Certification hub | `/certifications` | 27 ISTQB® certifications grouped by stream; filter by stream and by verified facts |
| Certification | `/certifications/:slug` | Official facts with source and review date (when verified), chapters, audience, prerequisites, study plan, practice questions, official links, related paths |
| Library | `/library` | Templates (download in English or Arabic), practice projects, curated videos |
| Practice project | `/library/projects/:slug` | Brief, deliverables, assessment criteria |
| Search | `/search?q=&page=` | Results across lessons, paths and certifications, paginated |
| Roadmap | `/roadmap` | What exists, what's in progress, what's planned |
| About | `/about` | The project, its principles and its owner, with a link to her LinkedIn profile |

### Accounts

| Page | URL | Notes |
| --- | --- | --- |
| Log in | `/login?next=` | `next` accepts same-site paths only |
| Create account | `/signup` | Every new account is a learner |
| Forgot password | `/forgot-password` | Same confirmation whether or not the email has an account |
| Reset password | `/reset-password?token=` | Single-use link, valid for 30 minutes |
| Dashboard 🔒 | `/dashboard` | Continue learning, progress by path, skill map, recent knowledge checks, saved lessons |
| Account 🔒 | `/account` | Profile and language, password, sessions, delete account |

### Admin studio 🔒 (instructors and administrators)

| Page | URL | Who |
| --- | --- | --- |
| Overview | `/admin` | Counts (paths, lessons, published, in review, users, videos), lessons waiting for review, recent changes |
| Content | `/admin/content` | Tree of paths, modules and lessons with status |
| New lesson | `/admin/content/lessons/new` | Instructor, administrator |
| Edit lesson | `/admin/content/lessons/:id` | Instructor (drafts); administrator (all, including publishing) |
| Edit path | `/admin/content/paths/:id` | Instructor (draft and planned paths); administrator |
| Certifications | `/admin/certifications`, `/admin/certifications/:id` | Instructor (unverified records); administrator (verify) |
| Videos | `/admin/videos`, `/admin/videos/:id` | Instructor (drafts); administrator (publish) |
| Users and roles | `/admin/users` | Administrator only |
| Audit log | `/admin/audit` | Instructor, administrator |

### System

| Page | Behaviour |
| --- | --- |
| Not found | Shown in the page language with links to paths, search and roadmap; `noindex` |
| Error | "Something went wrong on our side" with a reference code and a retry button; no stack traces |
| `/dev/outbox` | Development only: shows emails the mailer stored (reset links). Returns 404 in production |
| `robots.txt` | Allows public pages; disallows private, admin and account pages |
| `sitemap.xml` | Public pages and published content in both languages |

## 3. Navigation

**Header (desktop):**

- logo (home);
- Learning paths, Certifications, Library, Roadmap, About;
- search;
- language switch (English ⇄ العربية);
- theme toggle (light and dark);
- account area.
  - Signed out: Log in and Create account.
  - Signed in: a Dashboard button and a menu with your first name, containing Admin (instructors and administrators only), Account and Log out.

**Header (narrow screens):** a menu button opens the same links, search and account options. It closes when you follow a link, or on Escape (focus returns to the menu button).

**Footer:** owner credit (links to About) and her LinkedIn profile; Learn (paths, certifications, library, search, dashboard); Project (about, roadmap); trademark notice.

**Inside a lesson:**

- breadcrumbs (Paths › Path › Lesson);
- a collapsible list of all lessons in the path;
- an "on this page" table of contents;
- previous and next lesson links that skip planned outlines.

**Skip link:** "Skip to content" is the first focusable element on every page.

## 4. Anatomy of a lesson

Every complete lesson has the same parts, in both languages. This is enforced by unit tests for seed lessons and by the publish check in the admin studio.

1. Title, summary, level, estimated minutes, skills, review date
2. Learning objectives
3. Prerequisites and key terms
4. The lesson body (Markdown with highlighted code), written around a realistic product scenario
5. Common mistakes
6. Exercise, with a model answer behind a disclosure
7. Knowledge check, scored on the server, with an explanation for every answer
8. References (official sources and standards, https only)
9. Actions: mark complete, save (bookmark), related videos and templates

A **planned** lesson shows only its title, summary and objectives, clearly labelled, and isn't linked as a readable lesson.

## 5. Content model

```
Learning path (level → level, skills, status)
 └── Module (ordered)
      └── Lesson (ordered, level, minutes, skills, status, review date)
           ├── translation: en  (title, summary, body, objectives, prerequisites, key terms,
           └── translation: ar   mistakes, exercise, quiz, references)

Certification (stream, code, version, source URL, review date, verified, exam facts if verified)
 └── translation: en | ar (summary, audience, prerequisites, chapters, study plan, practice questions)

Video (YouTube id, creator, channel, level, skills, related lessons) ─ translation: our description
Template (format, file per language, related lessons)
Practice project (level, hours, related paths) ─ translation: brief, deliverables, criteria
```

**Career levels** (the progression axis): Beginner, Junior, Mid-level, Senior, Automation engineer, QA lead, Test manager, Head of QE. Each path declares where it starts and where it leads.

**Skills taxonomy** (`src/content/skills.ts`): lessons declare the skills they build. The dashboard skill map counts completed lessons per skill.

## 6. Learning paths

| Path | From → to | Modules | Lessons (complete / total) |
| --- | --- | --- | --- |
| QA Foundations | Beginner → Junior | 2 | 5 / 5 |
| Practical Manual Testing | Junior → Mid-level | 3 | 1 / 6 |
| API Testing Essentials | Mid-level → Senior | 3 | 4 / 6 |
| Web Automation with Playwright and TypeScript | Junior → Automation engineer | 2 | 1 / 5 |
| Senior Quality Engineering | Senior → Head of QE | 2 | 1 / 4 |
| QA Leadership | Senior → QA lead | 2 | 1 / 4 |
| Test Management | QA lead → Test manager | 2 | 1 / 4 |
| Payments and Fintech QA (planned) | Mid-level → Senior | 2 | 0 / 5 |

## 7. User journeys

**New learner, no account**

1. Lands on Home and tries the boundary probe.
2. Opens Learning paths and filters by "Beginner".
3. Opens QA Foundations, then the first lesson.
4. Takes the knowledge check: scored, "not saved".
5. Chooses **Create account** from the prompt, which returns them to the lesson.
6. Marks the lesson complete; it appears on the dashboard.

**Returning learner**

1. Logs in and lands on the dashboard, in their preferred language.
2. Uses **Continue where you left off** to reopen the last lesson.
3. Finishes it; the path progress and skill map update.

**Certification candidate**

1. Opens Certifications and filters "Verified facts only".
2. Opens CTFL and reads the facts with their source and review date.
3. Follows the four-week study plan.
4. Takes the 10 practice questions; signed in, the attempt is saved to the dashboard history.
5. Uses the official links to register.

**Arabic-speaking learner**

1. Selects العربية in the header; the same page opens under `/ar`, right to left.
2. Lessons, checks, search and account pages are all in Arabic.
3. Code and URLs stay left to right.

**Instructor**

1. Opens Admin → Paths and lessons → New lesson.
2. Writes the English and Arabic content.
3. Fixes whatever the publish checklist lists.
4. Submits the lesson for review.

**Administrator**

1. Opens the review queue on the Admin overview and checks the lesson.
2. Publishes it; it is live immediately.
3. Grants the instructor role to a new team member in Users and roles.
4. Reviews the audit log.

These journeys are covered by the end-to-end tests ([TESTING.md](TESTING.md#5-end-to-end-tests-testse2e)).

## 8. Content states and visibility

| Status | Public | Admin studio |
| --- | --- | --- |
| `planned` | Outline only (title, summary, objectives), labelled "planned" | Editable |
| `draft` | Hidden | Editable |
| `in_review` | Hidden | Editable; waiting for an administrator |
| `published` | Visible | Editable by administrators only |
| `archived` | Hidden | Restorable as a draft |
