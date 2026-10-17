# Project overview

**QA Engineering Academy** is a bilingual (English and Arabic) learning platform for software testers. It covers the whole career, from writing a first test case to leading a quality function. It was created by **Eman Abo-Oun**, QA Specialist ([LinkedIn](https://www.linkedin.com/in/eman-abo-oun-28ba40207/)).

Last reviewed: 13 October 2026.

## Why it exists

Most testing courses are organised around tools: learn Postman, learn Selenium, learn Jira. Testers who finish them can drive a tool but still struggle with the judgement calls that make up the job:

- choosing where the boundaries are and which values to test;
- spotting an ambiguous requirement before it turns into a defect;
- checking who is allowed to do what, not only whether a feature works;
- deciding whether a release is ready, and saying so in a way a team can act on.

This platform teaches that judgement first and treats tools as the means. Every lesson follows the shape of real QA work (**requirement → technique → evidence → report**) and uses realistic product scenarios from banking, payments, delivery and e-commerce.

There is very little in-depth QA material written in Arabic. Every lesson, knowledge check, certification page and admin screen here exists in both languages, with a proper right-to-left layout, so Arabic-speaking testers can learn in their own language without losing technical precision.

## Who it is for

| Learner | What they get |
| --- | --- |
| Career switchers and graduates | QA Foundations: what quality means, the lifecycle, core test design techniques, defect reports |
| Junior testers | Practical Manual Testing and API Testing Essentials: state transitions, HTTP, REST endpoint design, authentication versus authorization |
| Automation engineers | Web Automation with Playwright and TypeScript: locators, auto-waiting, stable tests |
| Senior engineers | Senior Quality Engineering: flaky test diagnosis, quality strategy |
| Leads and managers | QA Leadership and Test Management: release readiness, go/no-go decisions, estimation |
| Anyone preparing for ISTQB® | Certification hub with verified exam facts, a CTFL study plan and original practice questions |

## Principles

1. **Real content or nothing.** A lesson is either complete (an explanation with worked examples, common mistakes, an exercise, a knowledge check, references and a review date; roughly 1,700–2,300 words in English) or shown as a clearly labelled outline. The app never shows filler text.
2. **Honest status.** Planned features are listed on the roadmap page and in [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md). Nothing is presented as available when it isn't.
3. **Verified facts only.** Certification exam facts appear only after they have been checked on the official ISTQB® page, with the source link and review date shown. Fees are never shown because they vary by provider and country.
4. **Original work.** Lessons, exercises and practice questions are written for this site. Official sample exams are linked, never copied. Videos are embedded from their creators' channels, never downloaded or re-hosted.
5. **Equal languages.** Arabic is not a partial translation. Both languages pass the same tests, and an Arabic knowledge check uses the same answer key as the English one.
6. **Security by default.** New accounts are learners only. Every privileged action is authorised on the server, and no administrator credential ever reaches the browser.

## Scope today

| Area | Status |
| --- | --- |
| 8 learning paths, 18 modules, 39 lesson entries | Implemented. 14 lessons are complete in both languages; 25 are published as outlines (title, summary, objectives) and marked "planned" |
| Lesson reader | Implemented: objectives, prerequisites, key terms, body with highlighted code, common mistakes, exercise with model answer, knowledge check, references, review date, progress actions, bookmarks |
| Knowledge checks | Implemented: scored on the server; attempts saved for signed-in learners |
| Certification hub | Implemented: 27 current ISTQB® certifications in 6 streams, 4 with verified exam facts; CTFL study plan and 10 practice questions in both languages |
| Library | Implemented: 7 downloadable templates in both languages, 5 practice projects, 8 curated YouTube videos |
| Search | Implemented: lessons, paths and certifications in both languages, with Arabic normalisation |
| Accounts | Implemented: signup, login, logout, password recovery, profile and language preference, password change, sessions, account deletion |
| Learner dashboard | Implemented: continue learning, progress by path, skill map, attempt history, saved lessons |
| Admin studio | Implemented: bilingual editor for paths, modules, lessons; editorial workflow; certifications; videos; users and roles; audit log |
| Real email delivery | **Planned.** Reset links go to a database outbox and the server log |
| Timed mock exams, community Q&A, interview preparation, interactive labs, user video uploads | **Planned** (see the in-app roadmap and [diagrams](diagrams/README.md)) |

## Roadmap

| Phase | Focus | Status |
| --- | --- | --- |
| 1. Core learning experience | Paths, lesson reader, bilingual site, accounts, dashboard, search, certification hub, admin studio, library | Available. Real email delivery is next |
| 2. Practical learning | Write the 25 planned lessons; mock exams; verified facts for more certifications; interview preparation | Next and planned |
| 3. Community and contributions | Submitted video links, then moderated uploads; Q&A; contributor profiles; project showcases | Planned |
| 4. Advanced platform | Interactive labs (simulated APIs, SQL, automation challenges); personalised recommendations; team learning; carefully scoped AI-assisted features | Planned |

The same roadmap is published in the app at `/roadmap`.

## How the pieces fit

```
Visitor ──► Next.js app (server-rendered pages, English at /, Arabic at /ar)
               │
               ├── Content (paths, lessons, certifications, library) ── SQLite, cached for an hour
               ├── Accounts, sessions, progress, attempts, bookmarks ─ SQLite, per request
               └── Admin studio (instructors and administrators) ───── writes content, audit log
```

The full picture is in [ARCHITECTURE.md](ARCHITECTURE.md) and [diagram 1](diagrams/01-system-architecture.md).

## Where to go next

- Run it: [README](../README.md#run-it-locally)
- Learn with it: [USER_GUIDE.md](USER_GUIDE.md) · [دليل المستخدم](ar/USER_GUIDE.md)
- Run the admin studio: [ADMIN_GUIDE.md](ADMIN_GUIDE.md) · [دليل الإدارة](ar/ADMIN_GUIDE.md)
- Deploy it: [DEPLOYMENT.md](DEPLOYMENT.md) · [النشر والتشغيل](ar/DEPLOYMENT.md)
- See what isn't done yet: [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)
