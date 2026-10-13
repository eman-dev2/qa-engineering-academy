# QA Engineering Academy: architecture and product plan

Status: Phase 1, increment 1. Last updated 2026-10-11.

This document covers the product strategy, information architecture, data
model, technical decisions and roadmap. It is the working companion to the
Project Master Brief. Where the brief and this document disagree, the brief
wins and this document should be updated.

---

## 1. Product strategy

**Who it is for.** People learning software quality, from career switchers
through to Head of Quality Engineering, who want practical depth rather than
tool tutorials alone.

**Unique value proposition.** *Learn testing the way testers work.* Every
lesson is built like a piece of QA work: it has objectives (acceptance
criteria), an explanation grounded in a real product context, worked examples,
the mistakes reviewers actually catch, an exercise with a model answer, and a
knowledge check that is scored on the server and saved to the learner's record.

**Differentiation from QAcart and generic LMS products.**

| Common pattern | What this platform does instead |
| --- | --- |
| Course cards with a video and a "buy" button | Paths are ordered sequences with prerequisites, effort and measurable outcomes shown before you start |
| Tool-first curriculum (learn Postman, learn Selenium) | Technique-first: test design, risk and evidence first, tools as the means |
| Certification pages that copy syllabus text | Verified facts only, each with its official source URL and the date it was reviewed; original practice questions |
| Progress is a percentage bar | Progress is evidence: completed lessons, knowledge-check attempts and a skill map derived from them |
| Visual identity borrowed from SaaS templates | An identity taken from QA work itself: interval brackets (boundary values), highlighter marks on requirements, pass/fail status used only for real status |

## 2. Information architecture

```
/                         Landing: what you learn, how a lesson works, paths, certifications
/paths                    Catalog of learning paths (filter by level)
/paths/[path]             Path overview: goal, prerequisites, outcomes, modules, lessons
/paths/[path]/[lesson]    Lesson reader with knowledge check and progress actions
/search?q=&page=          Full-text search over lessons and certifications (paginated)
/certifications           Certification directory (ISTQB portfolio, verified facts flagged)
/certifications/[slug]    Certification detail, study plan, original practice questions
/dashboard                Learner dashboard (auth required)
/login, /signup           Authentication
/about                    Project and project owner (LinkedIn)
/roadmap                  What exists, what is planned, and when (honest status)
```

Planned areas from the brief that are **not built yet** are listed on
`/roadmap`. They are not linked from the main navigation: video library,
uploads, labs, community, admin studio, and the career and interview center.

## 3. Curriculum taxonomy and skill progression

The 15 domains from the brief are modelled as **skills** (`src/content/skills.ts`).
Lessons declare the skills they build. The dashboard skill map shows, for each
skill, how many of its lessons the learner has completed.

Career levels form the progression axis: Beginner, Junior, Mid-level, Senior,
Automation, Lead/Manager, Head of QE. Each path declares the level it starts
at and the level it leads to.

Content published in this increment:

- **QA Foundations** (Beginner to Junior): 2 modules, 5 lessons
- **API Testing Essentials** (Junior to Mid-level): 2 modules, 4 lessons

Every other domain is on the roadmap. The catalog only shows paths that exist.

## 4. Certification source-verification plan

1. Each certification record holds `sourceUrl` and `reviewedOn`.
2. Exam facts (questions, points, passing score, duration) are stored only if
   they were read on the issuing body's own page. If they were not, the field is
   left empty and the UI says "Not yet verified" and links to the official page.
3. Fees vary by exam provider and country, so they are never shown. Learners
   are sent to the registration route instead.
4. Practice questions are written from scratch for this platform and mapped to
   syllabus chapters. Official sample exams are linked, never copied.
5. Re-review cadence: at least quarterly, or whenever ISTQB publishes a new
   syllabus version. The planned admin studio will make this editable without a
   deploy. Until then, records live in `src/content/certifications.ts`.

## 5. Technical architecture

### Stack

| Layer | Choice | Why | Trade-off |
| --- | --- | --- | --- |
| Framework | Next.js 16 (App Router, Cache Components) + React 19 + TypeScript | Server rendering for SEO, Server Actions for mutations, static shells for fast lessons | Newer conventions (Cache Components, `proxy.ts`), so the team needs to read the bundled docs |
| Styling | Tailwind CSS 4 with custom design tokens | Tokens in one CSS file, so themes are consistent | Utility classes are verbose in markup |
| Content | Markdown + YAML frontmatter in `src/content/`, validated with Zod at load time | Version-controlled, reviewable in pull requests; a bad lesson fails the build | Non-developers can't edit until the admin studio exists |
| Database | SQLite via `better-sqlite3` + Drizzle ORM and migrations | Runs with zero external services or credentials; real persistence | Needs a persistent disk (VPS, Fly.io, Render). Not suitable for serverless hosts. Drizzle schema ports to Postgres when the platform needs to scale |
| Auth | Own implementation: scrypt password hashing, random session tokens stored as SHA-256 hashes, httpOnly cookies, server-side role checks | No third-party credentials needed; full control; passes the "never trust the client" rule | No OAuth or email verification yet, and no password reset (email delivery needs a provider) |
| Highlighting | Shiki, run at render time inside `use cache` | Accurate highlighting with no client JS | Adds build time |
| Tests | Vitest (unit) + Playwright (end-to-end) | Fast logic tests plus real browser flows | Two runners to maintain |

**Why not Supabase right now?** Supabase is still a good target for Phase 2+
(managed Postgres, storage for video uploads, row-level security). It needs a
project and keys that only the owner can create. Our data access goes through
`src/lib/db` and `src/lib/auth`, so swapping in Postgres/Supabase is a contained
change and doesn't touch the pages.

### Source layout

```
src/
  app/                    routes (see IA above), server actions in app/actions/
  components/             design-system components (ui/) and feature components
  content/                paths, lessons (markdown), skills, certifications, site settings
  lib/
    auth/                 password hashing, sessions, data-access layer (requireUser, requireRole)
    db/                   Drizzle schema, connection, migrations runner
    content/              loaders + Zod validation
    markdown.ts           markdown -> HTML (cached)
    quiz.ts               server-side scoring
    search.ts             search index and ranking
drizzle/                  generated SQL migrations
tests/unit, tests/e2e     Vitest and Playwright
```

### Data model (implemented)

```
users            id, email (unique), name, password_hash, created_at
user_roles       user_id, role  (learner | contributor | instructor | moderator | admin)
sessions         id (sha256 of token), user_id, expires_at, created_at
lesson_progress  user_id, lesson_key, status (started|completed), started_at, completed_at
quiz_attempts    id, user_id, subject_key (lesson or certification), score, total, answers_json, created_at
bookmarks        user_id, lesson_key, created_at
```

Content entities (LearningPath, Module, Lesson, Skill, Certification,
PracticeQuestion) live in version-controlled content files for this increment.
`lesson_key` = `"<path-slug>/<lesson-slug>"`, which keeps user data stable when
lesson content is edited.

### Data model (planned, from the brief)

Achievement, Project, ProjectSubmission, VideoResource, VideoUpload,
Discussion, Comment, Report, ModerationAction, CertificationVersion (DB-backed,
admin-editable), SiteSettings (DB-backed).

### Security rules

- Every Server Action re-reads the session and checks the role on the server.
- Quiz answers are scored on the server, so correct answers are never sent to the
  browser before submission.
- All form input is validated with Zod and errors are returned per field.
- Session cookie: `httpOnly`, `sameSite=lax`, `secure` in production, with a 30-day expiry.
- Login attempts are throttled per email (in-memory; see limitations).
- Secrets come only from environment variables. None are needed in this increment.

## 6. Roadmap

| Phase | Scope | Status |
| --- | --- | --- |
| 1a (this increment) | Design system, landing, About, catalog, 2 paths / 9 lessons, lesson reader, knowledge checks, search, auth, progress, bookmarks, dashboard with skill map, ISTQB directory with 4 verified certifications and CTFL practice set, tests | Built |
| 1b | Admin content studio (certification facts, site settings, users/roles), curated video library with attributed YouTube embeds, more paths (Manual Testing deep-dive, SQL for testers, Playwright with TypeScript) | Next |
| 2 | Mock exams, templates, projects, interview prep, expanded certification pathways | Planned |
| 3 | User video links and uploads with moderation, discussions, contributor profiles | Planned |
| 4 | Labs, automation challenges, recommendations, analytics, team learning | Planned |

## 7. External services, costs and decisions needing approval

| Item | Needed for | Cost | Decision |
| --- | --- | --- | --- |
| Hosting with persistent disk (e.g. Fly.io, Render, a small VPS) | Deploying with SQLite | Free tier to ~US$5–7/month | Owner chooses host |
| Postgres/Supabase project | Scaling beyond one server; storage for uploads | Free tier available | Owner creates the project and keys when Phase 3 starts |
| Email provider (Resend, Postmark) | Password reset, email verification | Free tiers | Needed before public launch |
| Video infrastructure (Mux, Cloudflare Stream) | Original uploads (Phase 3) | Usage-based | Deferred, as the brief requires |
| Domain name | Public launch | ~US$10–15/year | Owner |
