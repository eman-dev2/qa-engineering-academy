# 12. Entity-relationship diagram

All tables below are **implemented** (`src/lib/db/schema.ts`, migration `drizzle/0000_init.sql`). Planned tables are listed after the diagram.

```mermaid
erDiagram
  users ||--o{ user_roles : has
  users ||--o{ sessions : has
  users ||--o{ password_reset_tokens : has
  users ||--o{ lesson_progress : records
  users ||--o{ quiz_attempts : makes
  users ||--o{ bookmarks : saves
  users |o--o{ audit_log : "acted (nullable)"
  users |o--o{ videos : "added_by (nullable)"
  users |o--o{ lessons : "updated_by (nullable)"

  learning_paths ||--|{ path_translations : "en, ar"
  learning_paths ||--o{ modules : contains
  modules ||--|{ module_translations : "en, ar"
  modules ||--o{ lessons : contains
  learning_paths ||--o{ lessons : owns
  lessons ||--|{ lesson_translations : "en, ar"

  certifications ||--|{ certification_translations : "en, ar"
  videos ||--|{ video_translations : "en, ar"
  templates ||--|{ template_translations : "en, ar"
  projects ||--|{ project_translations : "en, ar"

  users {
    text id PK
    text email UK
    text name
    text password_hash "scrypt$N$r$p$salt$hash"
    text preferred_locale "en | ar"
    int is_demo
    int created_at
  }
  user_roles {
    text user_id PK,FK
    text role PK "learner|contributor|instructor|moderator|admin"
  }
  sessions {
    text id PK "SHA-256 of token"
    text user_id FK
    int expires_at
  }
  password_reset_tokens {
    text id PK "SHA-256 of token"
    text user_id FK
    int expires_at
    int used_at
  }
  lesson_progress {
    text user_id PK,FK
    text lesson_key PK "path/lesson"
    text status "started|completed"
  }
  quiz_attempts {
    text id PK
    text user_id FK
    text subject_key "lesson:... | cert:..."
    int score
    int total
  }
  learning_paths {
    int id PK
    text slug UK
    text starts_at
    text leads_to
    text status
  }
  lessons {
    int id PK
    int path_id FK
    int module_id FK
    text slug "unique per path"
    text status "planned|draft|in_review|published|archived"
    text reviewed_on
    int published_at
  }
  lesson_translations {
    int lesson_id PK,FK
    text locale PK
    text title
    text body "Markdown"
    text quiz_json
  }
  certifications {
    int id PK
    text slug UK
    text code
    int verified
    text exam_json "null unless verified"
    text source_url
  }
  audit_log {
    int id PK
    text user_id FK
    text action
    text entity_type
    text entity_id
  }
```

Also implemented: `email_outbox` (development mailer), `bookmarks`, and the translation tables' JSON columns for objectives, key terms, mistakes, exercise, references, study plans and practice questions. Full column list: [DATABASE.md](../DATABASE.md).

**Planned tables:** `video_submissions` and `moderation_actions` (diagram 11), `mock_exams` / `mock_exam_attempts` (diagram 8), `lesson_revisions` (diagram 9), `email_verifications`.
