# User guide

How to learn with QA Engineering Academy. [النسخة العربية](ar/USER_GUIDE.md)

Everything works the same in English (`/`) and Arabic (`/ar`). Use the **العربية / English** link in the header to switch language on the page you are reading.

## 1. Start without an account

You can read every published lesson, path, certification page and library item, search the site, and take any knowledge check without signing up. Your score is shown, but nothing is saved.

**Where to begin**

| You are… | Start with |
| --- | --- |
| New to testing | **QA Foundations** → "What quality means, and who owns it" |
| A tester who wants stronger test design | QA Foundations → "Equivalence partitioning and boundary value analysis" and "Decision tables for business rules" |
| Moving into API testing | **API Testing Essentials** → "Anatomy of an HTTP exchange" |
| Starting automation | **Web Automation with Playwright and TypeScript** → "Locators and auto-waiting in Playwright" |
| Preparing for ISTQB® Foundation | **Certifications** → CTFL: study plan and practice questions |
| A lead or manager | **QA Leadership** → "Release readiness and go/no-go decisions"; **Test Management** → "Test estimation techniques" |

On the **Learning paths** page you can filter paths by the level they start at.

## 2. Create an account

1. Choose **Create account** in the header.
2. Enter your name, email and a password: at least 10 characters, with at least one letter and one number.
3. You are signed in and taken to your dashboard (or back to the page you came from).

Every new account is a **learner** account. Instructor and administrator access is granted by an administrator; you can't request it from the sign-up form.

With an account, the site saves your lesson progress, bookmarks and knowledge-check attempts, and remembers your preferred language.

## 3. Reading a lesson

Each complete lesson contains:

1. **Objectives**: what you'll be able to do afterwards.
2. **Prerequisites and key terms.**
3. **The lesson**, built around a realistic product scenario, with code where it helps. Code is always shown left to right, even on Arabic pages.
4. **Common mistakes** reviewers catch in real work.
5. **Exercise.** Try it first, then open the model answer.
6. **Knowledge check** (see below).
7. **References** to official sources.
8. **Related videos and templates**, when there are any.

Use **On this page** to jump between sections, and **Previous / Next** at the bottom to move through the path. On a phone, the full list of lessons in the path is in the collapsible panel near the top.

Lessons marked **planned** are outlines (title, summary and objectives). They are listed so you can see where a path is heading, but they can't be opened yet.

If a lesson hasn't been translated into Arabic yet, the Arabic page shows the English text with a notice at the top. All 14 complete lessons are available in both languages today.

## 4. Knowledge checks

- Choose one answer for every question, then select **Check answers**. If any are unanswered, the form tells you how many.
- Answers are checked on the server. The correct answers are not in the page until you submit.
- You'll see your score, the correct answer and an explanation for every question.
- Signed in, each attempt is saved and your best score appears on the lesson and on your dashboard. Signed out, the result says the attempt was not saved.
- **Try again** gives you a fresh form.

## 5. Tracking your progress

On a lesson page (signed in):

- **Mark lesson as complete** records the lesson as done. Select **Completed** to undo it.
- **Save for later** adds the lesson to your saved list. Select **Saved** to remove it.

Opening a lesson records it as started, so the dashboard knows where you left off.

## 6. Your dashboard

**Dashboard** in the header (signed in) shows:

- **Continue where you left off**: the lesson you opened most recently;
- **Progress by path**: completed lessons out of published lessons for each path;
- **Skill map**: completed lessons per skill (test design, API testing, automation, and so on);
- **Recent knowledge checks**: score and date for each attempt;
- **Saved lessons**.

## 7. Certifications

The **Certifications** hub lists the 27 current ISTQB® certifications by stream. Filter by stream, or show only certifications whose exam facts have been verified.

On a certification page:

- **Verified facts** (number of questions, pass mark, duration, extra time for non-native speakers) appear only when they have been checked on the official ISTQB® page. The source link and review date are shown next to them.
- When facts haven't been verified yet, the page says so and links to the official page instead of guessing.
- Exam fees are never shown, because they depend on the exam provider and country. Use the official links to register.
- **CTFL** has a four-week study plan and 10 original practice questions, mapped to the syllabus chapters, in both languages.

Practice questions are written for this site. They are not real exam questions.

## 8. Library

- **Templates**: test plan, test case sheet, defect report, traceability matrix, risk register, exploratory testing charter and release readiness checklist. Each one downloads in English or Arabic.
- **Practice projects**: five portfolio projects, from checkout test design (junior) to estimating and planning a test effort (manager). Each has a brief, deliverables and assessment criteria.
- **Videos**: curated talks and tutorials from the tools' own channels. A video loads from YouTube (privacy-enhanced mode) only when you press play; until then, no YouTube content is requested. Titles stay exactly as the creator published them, and the channel is credited.

## 9. Search

Search covers lessons, paths and certifications in both languages. All the words you type must match. Arabic search ignores diacritics, accepts different hamza and alef spellings, and matches words with or without "ال".

## 10. Your account

Open the menu with your first name in the header, then choose **Account**.

| Task | How |
| --- | --- |
| Change your name, email or preferred language | **Profile**, then **Save profile**. Changing your email needs your current password. When you log in, your dashboard opens in your preferred language |
| Change your password | Enter the current password and the new one twice. Other devices are signed out; this one stays signed in |
| Sign out other devices | **Sessions** shows how many devices are signed in. **Log out other devices** ends every session except this one |
| Delete your account | Enter your password and confirm. Your progress, attempts, bookmarks and sessions are deleted permanently |
| Log out | The menu with your first name → **Log out** |

## 11. Forgotten password

1. On the login page choose **Forgot your password?** and enter your email.
2. The page shows the same confirmation whether or not that email has an account, so nobody can use the form to find out who is registered.
3. Open the link from the email within **30 minutes**. It works once.
4. Choose a new password. All your sessions are signed out, and you sign in again with the new password.

> **Current limitation:** this site doesn't send real email yet. On a local copy, reset links appear in the development outbox (`/dev/outbox`) and in the server log. On the public site, ask the administrator, who can see the link in the server log. See [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md).

## 12. Accessibility and display

- **Skip to content** is the first item when you press Tab.
- Every control works with the keyboard. Menus close with Escape.
- The theme button switches between light and dark, and your choice is remembered on this device.
- Pages fit phone screens without sideways scrolling.

## 13. Privacy

- The site stores what you enter (name, email, a scrypt hash of your password) and your learning activity. Nothing is sold or shared.
- Session cookies are `httpOnly` and can't be read by scripts on the page.
- No analytics or advertising trackers are used. YouTube is contacted only when you press play on a video.
- Deleting your account removes your data permanently.

## Need help?

The project is maintained by Eman Abo-Oun. The About page links to [her LinkedIn profile](https://www.linkedin.com/in/eman-abo-oun-28ba40207/).
