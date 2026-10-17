# Database

SQLite through `better-sqlite3`, with Drizzle ORM for queries and SQL migrations. Last reviewed: 13 October 2026.

See also: [diagram 12, entity relationships](diagrams/12-entity-relationships.md) · schema source `src/lib/db/schema.ts` · migration `drizzle/0000_init.sql`

## 1. Where the data lives

| Environment | File | Set by |
| --- | --- | --- |
| Local development | `data/academy.db` | default |
| End-to-end tests | `data/e2e.db` (deleted and rebuilt on every run) | `playwright.config.ts` |
| Render, free plan (Blueprint default) | `data/academy.db` in the service directory, recreated on every restart | default |
| Render with a disk (Option B) | `/var/data/academy.db` on the persistent disk | `DATABASE_PATH` |
| Docker | `/data/academy.db` on a volume | `Dockerfile` |

The `data/` folder is in `.gitignore`. Each connection enables:

- `journal_mode = WAL`, so reads don't block writes;
- `foreign_keys = ON`, so deletes cascade as declared;
- `busy_timeout = 5000`.

Migrations run every time a connection opens (`openDatabase()` in `src/lib/db/connection.ts`). They are idempotent, so setup is a single command. The app keeps one connection per server process (`src/lib/db/index.ts`).

## 2. Conventions

- Timestamps are stored as integers in milliseconds (`timestamp_ms`).
- Lists and structured values (objectives, quiz questions, references, skills) are JSON text columns ending in `_json`. They are validated with Zod when they are written (seed loader, admin actions) and parsed defensively when they are read.
- Every content entity has a base table (language-neutral fields such as slug, status, level, position) and a `*_translations` table with one row per language (`en`, `ar`), keyed by `(id, locale)`.
- Learner data refers to lessons by a stable key, `"<path-slug>/<lesson-slug>"`, not by numeric id. A lesson's slug is locked once it has been published, so progress survives content edits.
- Content status is one of `planned`, `draft`, `in_review`, `published`, `archived`. Only `published` content is visible to the public.

## 3. Tables

### Accounts

| Table | Purpose | Key columns |
| --- | --- | --- |
| `users` | Accounts | `id` (random), `email` (unique, lowercased), `name`, `password_hash` (scrypt, with its parameters), `preferred_locale`, `is_demo` |
| `user_roles` | Roles per user, primary key `(user_id, role)` | `role` ∈ learner, contributor, instructor, moderator, admin |
| `sessions` | Signed-in sessions | `id` = SHA-256 of the cookie token (the raw token is never stored), `expires_at` (30 days) |
| `password_reset_tokens` | Recovery links | `id` = SHA-256 of the emailed token, `expires_at` (30 minutes), `used_at` |
| `email_outbox` | Messages the mailer would send | `to`, `subject`, `text` |

### Learning records

| Table | Purpose | Key columns |
| --- | --- | --- |
| `lesson_progress` | Started and completed lessons, primary key `(user_id, lesson_key)` | `status` (started, completed), `started_at`, `completed_at`, `updated_at` |
| `quiz_attempts` | Saved knowledge-check attempts | `subject_key` (`lesson:<path>/<lesson>` or `cert:<slug>`), `score`, `total`, `answers_json` |
| `bookmarks` | Saved lessons, primary key `(user_id, lesson_key)` | `created_at` |

### Content

| Table | Purpose | Translation table |
| --- | --- | --- |
| `learning_paths` | Slug, starting level, target level, skills, status, position | `path_translations`: title, summary, goal, prerequisites, outcomes, milestones |
| `modules` | Belongs to a path; slug unique within the path | `module_translations`: title, summary |
| `lessons` | Path, module, slug (unique within the path), minutes, level, skills, status, `reviewed_on`, `published_at`, `updated_by` | `lesson_translations`: title, summary, Markdown body, objectives, prerequisites, key terms, common mistakes, exercise, quiz, references |
| `certifications` | Code, official name, issuer, version, stream, `source_url`, `reviewed_on`, `verified`, exam facts (`exam_json`, only when verified), official chapters and links, related paths | `certification_translations`: summary, audience, prerequisites, translated chapters, study plan, practice questions |
| `videos` | `youtube_id` (unique), original title, creator and channel URL, language, level, skills, related lessons, status, `verified_on`, `added_by` | `video_translations`: our description of why the video is useful |
| `templates` | Slug, format, skills, related lessons, status | `template_translations`: title, description, file path under `public/templates/` |
| `projects` | Slug, level, skills, related paths, hours, status | `project_translations`: title, summary, Markdown brief, deliverables, criteria |

### Audit

| Table | Purpose | Key columns |
| --- | --- | --- |
| `audit_log` | Every admin change and account deletion | `user_id` (nullable; set to null if the user is deleted), `action` (for example `lesson.status`, `role.update`), `entity_type`, `entity_id`, `detail`, `created_at` |

### Constraints and indexes

| Table | Constraint or index | Why |
| --- | --- | --- |
| `users` | `email` unique | One account per email |
| `user_roles` | primary key `(user_id, role)`; index on `role` | No duplicate roles; fast "list administrators" |
| `sessions` | index on `user_id` | Count and remove a user's sessions |
| `password_reset_tokens` | index on `user_id` | Remove older links when a new one is requested |
| `lesson_progress` | primary key `(user_id, lesson_key)`; index `(user_id, updated_at)` | One row per lesson per user; "continue where you left off" |
| `quiz_attempts` | index `(user_id, created_at)` | Attempt history on the dashboard |
| `bookmarks` | primary key `(user_id, lesson_key)` | A lesson is saved once |
| `learning_paths` | `slug` unique; index `(status, position)` | Catalog order |
| `modules` | unique `(path_id, slug)` | Module slugs unique within a path |
| `lessons` | unique `(path_id, slug)`; index `(module_id, position)`; index on `status` | Lesson URLs; ordered lists; public filtering |
| `certifications` | `slug` unique; index `(stream, position)` | Hub grouping |
| `videos` | `youtube_id` unique; index on `status` | A video is added once |
| `templates`, `projects` | `slug` unique | Stable download and project URLs |
| `*_translations` | primary key `(parent_id, locale)` | One translation per language |
| `audit_log` | index `(entity_type, entity_id)`; index on `created_at` | History per item; newest first |

Foreign keys are declared on every relationship, with `ON DELETE CASCADE` for data that belongs to its parent (roles, sessions, translations, modules, lessons) and `ON DELETE SET NULL` for history (`updated_by`, `added_by`, `audit_log.user_id`). Enumerated values (roles, locales, statuses, levels) are checked by Drizzle and Zod before writing.

### Deletion behaviour

Deleting a user cascades to their roles, sessions, reset tokens, progress, attempts and bookmarks. This is covered by the unit test "deleting a user removes their roles, sessions and learning data". Content rows keep their history: `lessons.updated_by`, `videos.added_by` and `audit_log.user_id` become `NULL`.

## 4. Current content (seed data)

| Entity | Count |
| --- | --- |
| Learning paths | 8 (7 published, Payments and Fintech QA planned) |
| Modules | 18 |
| Lessons | 39: 14 published in English and Arabic, 25 planned outlines |
| Certifications | 27 across 6 ISTQB® streams; 4 verified (CTFL v4.0, CTAL-TA, CTAL-TAE v2.0, CTAL-TM v3.0) |
| Videos | 8, all published |
| Templates | 7, each with an English and an Arabic file |
| Practice projects | 5 |

Seed sources: `seed/content/paths.ts`, `seed/content/lessons/<path>/<lesson>.{en,ar}.md`, `seed/content/certifications.ts`, `seed/content/library.ts`, `seed/content/videos.ts`.

## 5. Seeding rules

Seeding is designed to be safe to run again and again, including in production.

| Command | What it does | Production |
| --- | --- | --- |
| `npm run dev` / `build` / `start` | Migrate, then insert missing content | Yes (content only) |
| `npm run db:seed` | Insert missing content; create demo accounts | Content only; demo accounts refused |
| `npm run db:seed -- --content-only` | Insert missing content | Yes |
| `npm run db:seed -- --demo-only` | Create demo accounts that don't exist | Refused |
| `npm run db:seed -- --reset-demo` | Delete the demo accounts (and their data) and recreate them | Refused |
| `npm run db:seed -- --force-content` | Overwrite content rows from the seed files, **discarding admin edits** | Possible, but only when typed explicitly |
| `npm run db:reset -- --yes` | Delete the database file and rebuild it | Refused when `NODE_ENV=production` |

What "insert missing" means:

- A path, module, lesson, certification, video, template or project is matched by its slug (videos by YouTube id). If it exists, it is left alone.
- A missing translation is added to an existing lesson. For example, if an Arabic file is added to the seed folder later, the next start inserts it without touching the English row.
- Demo accounts are matched by email and marked `is_demo`. Their synthetic progress only uses lessons from the seed.

These rules are covered by unit tests: "is repeatable: a second run inserts nothing and changes nothing", "never overwrites an admin's edit unless forced" and "refuses to create demo accounts in production".

## 6. Migrations

The schema is defined in TypeScript (`src/lib/db/schema.ts`). To change it:

```bash
# 1. edit src/lib/db/schema.ts
npm run db:generate        # drizzle-kit writes a new SQL file in drizzle/
npm run dev                # applies it on the next connection
```

Commit the generated SQL and the `drizzle/meta` snapshot together. Never edit a migration that has already been deployed. Write a new one instead.

## 7. Backups and restore

SQLite is a single file, so a consistent copy is easy to take even while the server is running. Use SQLite's online backup rather than copying a file that's being written to:

```bash
# on the server (Render Shell, or inside the container)
node -e "require('better-sqlite3')(process.env.DATABASE_PATH).backup('/var/data/backup-' + Date.now() + '.db').then(() => console.log('done'))"
```

To restore, stop the service, replace the database file with the backup (delete any `-wal` and `-shm` files next to it), and start the service again.

Render also takes daily snapshots of persistent disks. Scheduled off-site backups are planned (see [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)).

## 8. Inspecting the data locally

```bash
npx drizzle-kit studio     # browser UI for the local database
```

Or open `data/academy.db` with any SQLite tool, such as DB Browser for SQLite. Stop the dev server first if you intend to write to it.
