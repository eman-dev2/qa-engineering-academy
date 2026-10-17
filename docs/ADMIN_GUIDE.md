# Admin guide

Running the admin studio: roles, the first administrator, editing content, the editorial workflow, certifications, videos and the audit log. [النسخة العربية](ar/ADMIN_GUIDE.md)

Last reviewed: 13 October 2026. See also [SECURITY_AND_PERMISSIONS.md](SECURITY_AND_PERMISSIONS.md) and diagrams [4](diagrams/04-roles-and-permissions.md), [9](diagrams/09-admin-content-workflow.md) and [10](diagrams/10-youtube-video-curation.md).

## 1. Roles

| Role | Who gets it | Can do |
| --- | --- | --- |
| **Learner** | Every account, automatically, and it can't be removed | Learn: progress, bookmarks, knowledge checks, dashboard, account settings |
| **Instructor** | Granted by an administrator | Open the admin studio. Create and edit draft lessons. Edit draft and planned paths and add modules to them. Submit lessons for review. Add videos as drafts. Edit unverified certification records. Read the audit log |
| **Administrator** | Created at setup, or granted by another administrator | Everything an instructor can do, plus: publish, unpublish and archive; edit published content; mark certification facts verified; publish videos; grant and revoke roles |
| Contributor, Moderator | Exist in the data model | Nothing yet. Their features (submissions, moderation) are planned |

The rules are enforced on the server in every admin page and action, not only by hiding buttons.

## 2. The first administrator

New registrations are always learners, so the first administrator is created outside the website, by someone with access to the server. Choose one of these methods.

**A. Environment variables (best for hosting such as Render).** Set these on the server:

```
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=a-strong-password-2026   # 10+ characters, at least one letter and one number
ADMIN_NAME=Your Name                    # optional
```

On the next start, if the database has no administrator yet, the account is created with the learner and administrator roles, and the server log says `administrator created: you@example.com`. If an account with that email already exists, it is promoted to administrator; its password is not changed. Once any administrator exists, these variables are ignored, so you can remove `ADMIN_PASSWORD` afterwards. The values stay on the server and are never sent to the browser.

**B. Command line (local, Render Shell or a container shell):**

```bash
npm run admin:create -- --email you@example.com --name "Your Name"
# asks for the password with hidden input, or reads ADMIN_PASSWORD if set
```

It refuses when an administrator already exists. Pass `--additional` to create another one deliberately.

**C. Development only:** `npm run dev` creates the demo administrator `admin@demo.qa-academy.test` (password `Demo-Password-2026`). Demo accounts are never created when `NODE_ENV=production`.

## 3. Granting and revoking roles

In the website (administrators): **Admin → Users and roles**.

1. Search by name or email.
2. Tick or untick roles on the user's card.
3. Select **Update roles**.

From the command line:

```bash
npm run user:role -- grant  someone@example.com instructor
npm run user:role -- revoke someone@example.com instructor
npm run user:role -- list   someone@example.com
```

Safety rules (website and command line):

- Every account keeps the learner role.
- An administrator can't remove their own administrator role.
- The last administrator can't be removed, and the last administrator can't delete their own account.
- Every change is written to the audit log (for example `role.update +instructor`).

## 4. Opening the studio

Sign in with an instructor or administrator account, open the menu with your first name in the header and choose **Admin**. The overview shows counts (paths, lessons, published lessons, lessons waiting for review, users, videos), the lessons waiting for review and the most recent changes.

The studio works in both languages: `/admin` in English, `/ar/admin` in Arabic, with the same features.

## 5. Editing lessons

**Admin → Paths and lessons** lists every path, module and lesson with its status and the languages it has.

**Create a lesson:** choose **New lesson**. Pick the module, then enter a URL slug (lowercase letters, numbers and hyphens), a title and a summary. The lesson is created as a **draft**.

**Edit a lesson:** choose **Edit lesson**. The editor has shared fields (reading time, level, skills, position, review date) and one section per language.

| Field | Format |
| --- | --- |
| Lesson body | Markdown. Use `##` and `###` headings (they become the "On this page" links) and fenced code blocks with a language (` ```ts `) |
| Objectives, prerequisites | One per line |
| Key terms | One per line: `term :: definition` |
| Common mistakes | One per line: `mistake :: fix` |
| Exercise | Title, brief (Markdown) and model answer (Markdown) |
| Knowledge check | JSON (see below) |
| References | One per line: `title \| https://url \| publisher` (https only) |

Knowledge-check JSON:

```json
[
  {
    "id": "q1",
    "prompt": "A field accepts ages 18 to 65. Which set covers both boundaries?",
    "options": [
      { "id": "a", "text": "17, 18, 65, 66" },
      { "id": "b", "text": "18, 40, 65" },
      { "id": "c", "text": "0, 100" }
    ],
    "answer": "a",
    "explanation": "Two-value boundary analysis tests each boundary and its nearest invalid neighbour."
  }
]
```

The Arabic knowledge check must use **the same question ids, option ids and answers**. Only the text is translated. This keeps scoring and saved attempts identical in both languages.

If something is wrong (invalid JSON, a badly formatted line, a slug already used in the path), the editor names the problem and keeps everything you typed.

**Slugs** can be changed until the lesson is first published. After that they are locked, because learners' progress and bookmarks are stored against `path/lesson`.

## 6. Editorial workflow

```
planned ──► draft ──► in review ──► published ──► archived
              ▲  ◄──────┘  ◄─────────────┘            │
              └──────────── restore as draft ◄────────┘
```

| Action | From | To | Who |
| --- | --- | --- | --- |
| Submit for review | draft | in review | Instructor, administrator |
| Publish | draft, in review | published | Administrator |
| Move back to draft | in review, published | draft | Administrator |
| Archive | planned, draft, in review, published | archived | Administrator |
| Restore as draft | archived, planned | draft | Instructor, administrator |
| Mark as planned outline | draft | planned | Instructor, administrator |

The workflow panel on the edit page shows only the actions you're allowed to take from the current status.

**Publishing checklist.** Publish is refused, with the reasons listed, unless the lesson has:

- English **and** Arabic content;
- a body of at least 300 words in each language;
- at least two objectives and two common mistakes;
- a complete exercise;
- at least three knowledge-check questions, with matching answer keys in both languages;
- at least one reference;
- at least one skill;
- a review date.

Published content changes are visible on the site right away. Planned lessons appear on the path page as outlines; draft, in-review and archived lessons are hidden from the public.

## 7. Paths and modules

On **Edit path** you can change the path's slug (locked once it has published lessons), level range, skills, status, position and both translations (title, summary, goal, prerequisites, outcomes, milestones), and add modules (slug plus English and Arabic title and summary).

- Instructors can edit draft and planned paths. Only administrators can edit a published path or move a path to or from published or archived.
- A published path with published lessons appears in the catalog. A planned path appears as "In development".
- New paths, templates and practice projects are added through the seed files (`seed/content/`) and a deploy. The studio doesn't create them yet ([KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)).

## 8. Certifications

**Admin → Certifications** lists every record with its verification status.

- Anyone with studio access can edit the summary, audience, prerequisites, study plan and practice questions of an **unverified** record.
- Only an administrator can mark a record **verified** or edit one that is already verified.
- Verifying needs the exam facts (questions, total points, pass mark, duration, and the non-native extension if there is one), the official source URL and the review date. You also tick "I checked these facts on the official page on the review date above".
- Unverified records never show exam facts on the public site. They link to the official page instead.

Editorial policy: check every fact on the ISTQB® page itself. Never show fees (they vary by exam provider and country). Never copy official sample exam questions; write original practice questions and link to the official samples.

## 9. Videos

**Admin → Videos → Add video.**

1. Paste a YouTube link (`youtube.com/watch?v=…`, `youtu.be/…`) or the 11-character video id. Other sites are refused, and there's no file upload.
2. Enter the title exactly as published on YouTube, the creator or channel name and the channel URL.
3. Write a short note in English and Arabic on why the video is useful.
4. Add related lessons, one lesson key per line (for example `qa-foundations/decision-tables`). The video then appears on those lessons.
5. The video is saved as a **draft**. An administrator publishes it after checking the link, title and creator on YouTube and ticking "I checked the link, title and creator on YouTube today", which records the verification date.

Videos are only linked and embedded in privacy-enhanced mode, loaded when the learner presses play. Never download or re-host them.

**Uploaded content:** the platform has no file uploads. Media is limited to YouTube links (above) and the template files shipped in `public/templates/`. User uploads with moderation are planned ([diagram 11](diagrams/11-user-video-uploads.md)).

## 10. Audit log

**Admin → Audit log** lists every change: when, who, the action (`lesson.create`, `lesson.update`, `lesson.status`, `path.update`, `module.create`, `certification.update`, `video.create`, `video.update`, `role.update`, `admin.bootstrap`, `account.delete`) and the item, with details such as `in_review → published`. Entries are kept if the user is later deleted; the "who" column then shows "System".

## 11. Seed data and admin edits

When the server starts, it adds seed content that is missing. It **never overwrites** something you've edited in the studio. The only way to overwrite content from the seed files is the explicit command `npm run db:seed -- --force-content`, which discards studio edits. Use it only on a copy or when you mean it. See [DATABASE.md](DATABASE.md#5-seeding-rules).

## 12. Password resets for learners

The site doesn't send email yet. When a learner asks for a reset, the reset link is written to the server log (`[mail:outbox] to=…`) and stays valid for 30 minutes. On Render, open the service's **Logs** tab, find the line for the learner's email, and send them the link through a trusted channel. Locally, open `/dev/outbox`.
