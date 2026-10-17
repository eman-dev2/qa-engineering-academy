# Known limitations

What isn't done, what behaves differently from what you might expect, and why. Last reviewed: 13 October 2026.

Nothing on this list is presented as available anywhere in the app. Planned features are marked as planned on the in-app roadmap (`/roadmap`) and in the [diagrams](diagrams/README.md).

## 1. Features not built yet

| Feature | Status | Notes |
| --- | --- | --- |
| Sending real email | Next | Password-reset messages are stored in the `email_outbox` table and written to the server log. Locally they are readable at `/dev/outbox`; on a public deployment an administrator reads the link from the logs. Adding a provider (Resend, Postmark or SMTP) is a contained change in `src/lib/mailer.ts` |
| 25 planned lessons | Next | Shown as outlines (title, summary, objectives) and clearly labelled. The 14 complete lessons are fully bilingual |
| Payments and Fintech QA path | Planned | Listed as "In development" with its outline |
| Timed mock exams, question pools, verified facts for more certifications | Planned | 4 of 27 certifications have verified facts; the others link to the official page ([diagram 8](diagrams/08-certification-prep-and-mock-exams.md)) |
| Interview preparation, interactive labs, community Q&A, project showcases | Planned | Roadmap phases 2–4 |
| User video uploads and moderation | Planned | Design only ([diagram 11](diagrams/11-user-video-uploads.md)). Videos are added by YouTube link by staff; there is no upload anywhere |
| Contributor and moderator roles | Planned | The roles exist in the data model but have no features yet |
| Email verification, two-factor authentication, social login | Planned | |
| Creating paths, certifications, templates and projects in the admin studio | Planned | The studio edits existing paths (and adds modules), lessons, certification records and videos. New paths, templates and projects are added through the seed files and a deploy |
| Lesson revision history | Planned | The audit log records who changed what and when, but not the previous text |
| Completion certificates | Planned | |

## 2. Technical limitations

**Single instance.**

- The SQLite database is a file on one server, and the login throttle is kept in memory. Run exactly one instance.
- The throttle resets when the server restarts.
- Moving to several instances needs PostgreSQL (the Drizzle schema ports) and a shared throttle store.

**Persistent disk required for real use.**

- The Render Blueprint starts on the free plan, which has no disk.
- There, every restart, wake-up or deploy starts from a fresh database. Content is reseeded and the administrator is recreated from environment variables, but accounts, progress and admin edits are lost.
- The free service also sleeps after about 15 minutes without visits and takes about a minute to wake.
- For real learners, switch to a Starter instance with a disk. See [DEPLOYMENT.md](DEPLOYMENT.md#5-render).

**Up to an hour of stale pages after a redeploy on Render with a disk (Option B).**

- On Render the disk isn't mounted during the build, so pages are prerendered from a separate build database that contains the seed content. (On the free plan the build database is the live one, so this doesn't apply.)
- Right after a redeploy, a page whose content was edited in the studio can show the seed version until the hourly revalidation, or until the next studio edit (which refreshes the cache immediately).
- Accounts, progress and other personal data are always live.
- Hosts where the build can read the live database (a plain server or Docker with the volume mounted at build) don't have this delay.

**Soft 404 for unknown slugs.**

- A URL that matches no route (for example `/no-such-page/at/all`) returns a real HTTP 404.
- An unknown slug under a known route (for example `/paths/no-such-path`) shows the not-found page with `noindex`, but with HTTP status 200. Once a streamed response has started, Next.js can no longer change the status code.
- Search engines respect the `noindex`, and visitors see the normal not-found page.

**Reset links in server logs.** Until real email is added, anyone who can read the server logs can see live password-reset links (valid 30 minutes, single use). Keep log access limited to administrators.

**No Content-Security-Policy header yet.** Other protections apply: React escaping, no raw HTML in Markdown, `httpOnly` cookies. A nonce-based CSP is planned.

**Development tool advisories.** `npm audit --omit=dev` is clean. The full `npm audit` reports advisories in `eslint-config-next` (through `braces`) and `drizzle-kit` (through an old `esbuild`). These are build and lint tools that the running site doesn't call. See [SECURITY_AND_PERMISSIONS.md](SECURITY_AND_PERMISSIONS.md#8-dependencies).

**Docker image not built here.** The Dockerfile mirrors the tested build and start steps, but this project's environment has no Docker daemon, so the image itself hasn't been built and run yet.

**Previous page kept in memory.** For faster back and forward navigation, Next.js 16 keeps the previous page mounted but hidden (React Activity). This is invisible to visitors and screen readers. It matters for test authors, because locators must target visible elements, which role- and label-based locators already do.

## 3. Content limitations

- **Certification facts** are shown only where verified on the official ISTQB® page; the review date is on each page. Facts can change when ISTQB publishes new syllabus versions, so the records need a review at least quarterly.
- **Exam fees are never shown.** They depend on the exam provider and country.
- **Videos** are third-party content. Links are checked when added (the verification date is stored), but there is no automatic re-check yet, so a creator could remove a video later.
- **Arabic terminology.** Arabic lessons use the established Arabic term and keep the English term in brackets where testers commonly use the English word (for example, "القيمة الحدّية (Boundary value)"). Some teams use different Arabic terms.

## 4. Testing gaps

No automated accessibility scan, visual regression or load tests yet, and end-to-end tests run on Chromium only. See [TESTING.md](TESTING.md#8-not-covered-yet).
