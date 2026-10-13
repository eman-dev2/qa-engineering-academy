# 7. Knowledge-check (quiz) flow

**Implemented** for lesson knowledge checks and the CTFL practice set.

```mermaid
sequenceDiagram
  autonumber
  actor L as Learner
  participant P as Lesson page (server)
  participant B as Browser (QuizForm)
  participant A as submitQuiz() action
  participant DB as SQLite
  P->>B: questions and options only<br/>(no answer key, no explanations)
  L->>B: choose answers
  B->>A: subject "lesson:path/slug" or "cert:slug", locale, q:<id> fields
  A->>DB: load the answer key for that subject and language
  alt subject unknown or lesson not published
    A-->>B: "This question set could not be found"
  else some questions unanswered
    A-->>B: "Answer every question" (Arabic plural forms in Arabic)
  else all answered
    A->>A: score on the server (unknown option ids count as wrong)
    opt signed in
      A->>DB: insert quiz_attempts row (score, total, answers)
    end
    A-->>B: score, correct answer and explanation per question,<br/>"saved to your dashboard" or "not saved, log in"
  end
  L->>B: "Try again" → fresh form
```

## Rules

- Arabic and English versions of a knowledge check must have the same question ids, option ids and answers (`quizKeysMatch`). The seed loader, the admin editor and the unit tests all enforce this, so an attempt means the same thing in both languages.
- Anonymous attempts are scored but never stored.
- **Planned:** timed mock exams with a question pool, randomisation and per-chapter score breakdowns (see diagram 8).
