# Architecture

How QA Engineering Academy is built, and why. Last reviewed: 13 October 2026.

See also: [diagram 1, system architecture](diagrams/01-system-architecture.md) · [DATABASE.md](DATABASE.md) · [SECURITY_AND_PERMISSIONS.md](SECURITY_AND_PERMISSIONS.md)

## 1. Summary

A single Next.js 16 application, rendered on the server, with a SQLite database file. There are no external services to configure: `npm ci && npm run dev` gives you the full site, content, accounts and admin studio on any machine with Node.js 22.

```
Browser ──HTTPS──► proxy.ts ──► Server Components (pages) ──► content cache ('use cache', tag "content")
   │                                                               │
   └──form posts──► Server Actions ──► data access layer ──────────┴──► SQLite (better-sqlite3 + Drizzle)
                        │                                                   ▲
                        └──► mailer (outbox)                 seed files ──► CLI scripts
```

## 2. Technology choices

| Layer | Choice | Why | Trade-off |
| --- | --- | --- | --- |
| Framework | Next.js 16.4 App Router, React 19, TypeScript (strict) | Server rendering for fast, indexable lessons; Server Actions for every form, so validation and permission checks always run on the server; Cache Components for static shells with streamed personal data | Newer conventions (`proxy.ts`, `"use cache"`, Activity) that some developers won't know yet |
| Styling | Tailwind CSS 4 with design tokens in `src/app/globals.css` | One set of tokens drives light and dark themes; logical properties (`ms-`, `pe-`, `text-start`) make right-to-left layout automatic | Long class lists in markup |
| Database | SQLite through `better-sqlite3` 13, Drizzle ORM, SQL migrations | Zero setup; real relational data with foreign keys and transactions; prebuilt binaries so Windows needs no C++ tools | One server instance with a persistent disk. Drizzle keeps a later move to PostgreSQL contained |
| Content | Stored in the database with one translation row per language; loaded from Markdown and TypeScript seed files | Editable in the admin studio without a deploy, yet version-controlled as seed files | Two sources (seed and live database). Seeding only inserts what's missing, so admin edits are never overwritten |
| Markdown | unified, remark-gfm, remark-rehype, Shiki | Accurate code highlighting with no client JavaScript; rendered once and cached | Build time |
| Validation | Zod 4 | One schema per form, with messages from the page's language dictionary | — |
| Authentication | Built in: scrypt, random session tokens stored as SHA-256 hashes, httpOnly cookies | No third-party keys needed; every rule is visible and tested | No social login, email verification or 2FA yet (planned) |
| Tests | Vitest (unit), Playwright (end to end against a production build) | Fast logic tests plus real browser flows in both languages | Two runners |

## 3. Source layout

```
src/
  proxy.ts                    locale routing and the optimistic private-route gate
  app/
    [lang]/                   every page, once per language ("en" served at /, "ar" at /ar)
      layout.tsx              <html lang dir>, fonts, header, footer, metadata with hreflang
      page.tsx                home
      paths/ certifications/ library/ search/ roadmap/ about/
      login/ signup/ forgot-password/ reset-password/
      dashboard/ account/     private pages
      admin/                  admin studio (instructor and administrator)
      dev/outbox/             development-only email outbox (404 in production)
      error.tsx not-found.tsx error boundary and 404 in the page language
    actions/                  Server Actions: auth.ts, learning.ts, admin.ts
    global-not-found.tsx      bilingual 404 for URLs that match no route
    robots.ts sitemap.ts      SEO, both languages with alternates
  components/                 UI components (ui.tsx is the design system), lesson/, admin/
  content/                    site settings (owner, LinkedIn), skills taxonomy, certification streams
  i18n/                       config (locales, paths, plurals, dates), dictionaries/en.ts and ar.ts
  lib/
    auth/                     password, session, dal (current user), validation, rate-limit, reset, bootstrap
    admin/                    guard, workflow, lesson-checks, parse, queries
    content/                  repo (cached reads), schema (seed validation), types, headings
    db/                       schema, connection (open + migrate), index (one connection per process)
    markdown.ts quiz.ts search.ts search-index.ts progress.ts mailer.ts
seed/                         seed loader, frontmatter parser, content/ (lessons as Markdown, paths, certifications, library, videos)
scripts/                      prepare, db-reset, create-admin, set-role, e2e-db
drizzle/                      SQL migrations
public/templates/{en,ar}/     downloadable templates
tests/unit, tests/e2e         Vitest and Playwright
docs/                         this documentation, diagrams, screenshots
```

## 4. Request lifecycle

1. **Proxy** (`src/proxy.ts`) runs first.
   - `/en/...` is permanently redirected (308) to the unprefixed URL, so each page has one address.
   - Requests for `/dashboard`, `/account` or `/admin` (in either language) without a `qa_session` cookie are redirected to the login page in the same language, with `?next=` set. This is only an optimisation; the real check happens on the server.
   - Any non-Arabic path is rewritten internally to `/en/...`. Arabic paths (`/ar/...`) pass through.
2. **Layout** `src/app/[lang]/layout.tsx` validates the locale, sets `<html lang dir>`, loads the dictionary and renders the header and footer.
3. **Page** reads content through the cached repository and, inside `<Suspense>`, reads the current user through the data access layer.
4. **Form posts** call Server Actions. Each action validates its input, checks the user and role again on the server, writes inside a transaction where needed, adds an audit entry for admin changes, and refreshes the affected cache.

## 5. Rendering and caching

`next.config.ts` turns on `cacheComponents` and `partialPrefetching`.

- **Static shells.** Pages are prerendered at build time for both languages (`generateStaticParams`). Anything that depends on the request (cookies, the search query, the current time) sits inside `<Suspense>` and streams in.
- **Content cache.** Every content read in `src/lib/content/repo.ts` and `src/lib/search-index.ts` is a `"use cache"` function tagged `content` with `cacheLife("hours")`.
  - Admin actions call `updateTag("content")`, so an edit is visible on the next request.
  - The hourly revalidation is a safety net for hosts where the build reads a different database file from the running server. On Render, for example, the persistent disk is not mounted during the build.
- **Markdown** is rendered once per body text (`renderMarkdown`, `cacheLife("max")`), keyed by its input.
- **Personal data** (session, progress, attempts, bookmarks) is never cached. `readSessionUserId` calls `connection()` first so expiry is always checked against the request time.
- **Dynamic content routes** (`paths/[path]`, `paths/[path]/[lesson]`, `certifications/[slug]`, `library/projects/[slug]`) set `export const instant = false` so slugs created in the admin studio after the build are served on demand.

## 6. Internationalisation

| Concern | How it works | Code |
| --- | --- | --- |
| URLs | English at `/…`, Arabic at `/ar/…`; `localePath()` and `stripLocale()` build and parse them | `src/i18n/config.ts` |
| Interface text | One dictionary per language with identical keys, checked by unit tests (same keys, same placeholders, no empty strings) | `src/i18n/dictionaries/` |
| Plurals | `Intl.PluralRules`, so Arabic gets its zero, one, two, few, many and other forms | `plural()` |
| Dates and durations | Deterministic formatting with Arabic month names and correct number agreement ("ساعتان و5 دقائق") | `formatIsoDate()`, `formatMinutes()` |
| Direction | `dir="rtl"` on `<html>` for Arabic; Tailwind logical properties everywhere; code blocks forced left-to-right | layout, `globals.css` |
| Fonts | IBM Plex Sans Arabic and Noto Naskh Arabic for Arabic; Schibsted Grotesk, Literata and JetBrains Mono for Latin text | layout |
| Content | One translation row per language for paths, modules, lessons, certifications, videos, templates and projects. If an Arabic row is missing, the English text is shown with a visible notice | `pick()` in `repo.ts`, `FallbackNotice` |
| Knowledge checks | Arabic and English must share question ids, option ids and answers (`quizKeysMatch`), so scoring and saved attempts mean the same thing in both languages | `src/lib/content/schema.ts` |
| Search | Arabic normalisation: diacritics removed, hamza and alef forms unified, definite article and common stop words dropped | `src/lib/search.ts` |
| Language switch | Keeps the current page and query string | `language-switch.tsx` |
| SEO | `hreflang` alternates in metadata and in `sitemap.xml` | layout, `sitemap.ts` |

## 7. Data and content flow

- **Seeding.** `scripts/prepare.ts` runs before `dev`, `build` and `start`. It applies migrations, then calls `seedContent()`, which inserts missing rows only (paths, modules, lessons, translations, certifications, library). It never deletes or overwrites anything unless you pass `--force-content` explicitly. In development (`--demo`, never in production) it also creates the demo accounts. If no administrator exists and `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set, it creates the first administrator.
- **Validation.** Seed lessons are parsed from Markdown with YAML front matter (`seed/frontmatter.ts`) and validated with Zod before insertion. Unit tests check every published lesson for the required parts in both languages.
- **Editing.** The admin studio writes to the same tables. Publishing runs `publishProblems()` (`src/lib/admin/lesson-checks.ts`), which refuses a lesson that lacks either language, a body of at least 300 words, a knowledge check, an exercise, references, objectives, common mistakes, a review date, skills, or matching answer keys.

## 8. Key design decisions

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| SQLite file database | PostgreSQL or Supabase | Runs anywhere with no account or keys, which matters for a portfolio project that reviewers clone. All access goes through Drizzle and `src/lib/db`, so moving to PostgreSQL is a contained change |
| Built-in authentication | Auth.js, Clerk, Supabase Auth | No external keys; complete control over generic error messages, throttling and role checks; fully covered by tests |
| Content in the database, seeded from files | Markdown files only | Instructors can edit and publish without a deploy, and the editorial workflow and audit log need database rows |
| English unprefixed, Arabic under `/ar` | `/en` and `/ar` prefixes | Short canonical English URLs; `/en/...` still works and redirects |
| Server-scored knowledge checks | Scoring in the browser | Answer keys never reach the browser before submission |
| YouTube by link, privacy-enhanced embed loaded on click | Uploading or re-hosting | Respects creators' rights; no third-party requests until the learner presses play |
| One process, in-memory login throttle | Redis | Fits a single instance. Documented in [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) with the change needed for several instances |

## 9. Scaling path

The current design targets one server instance with a persistent disk. In order of need:

1. **Real email** (password-reset delivery): add a transport in `src/lib/mailer.ts` (Resend, Postmark or SMTP), chosen by an environment variable.
2. **Several instances:** move the login throttle to a database table or Redis and the database to PostgreSQL (Drizzle schema port and new migrations).
3. **User uploads:** object storage with signed URLs and a moderation queue ([diagram 11](diagrams/11-user-video-uploads.md), planned).
4. **Observability:** an error-tracking service connected to the error boundary's digest ([diagram 14](diagrams/14-error-handling.md)).
