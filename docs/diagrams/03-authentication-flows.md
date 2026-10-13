# 3. Registration, login, logout and password recovery

All four flows are **implemented**. Planned additions are listed at the end.

## Registration

```mermaid
sequenceDiagram
  autonumber
  actor U as Visitor
  participant F as /signup form
  participant A as signup() action
  participant DB as SQLite
  U->>F: name, email, password
  F->>A: POST (locale, next)
  A->>A: validate (zod): name 2-80, valid email, password 10-200 with a letter and a number
  alt invalid
    A-->>F: field errors in the page language, values kept
  else email already registered
    A-->>F: "An account with this email already exists"
  else valid
    A->>A: scrypt hash (random salt)
    A->>DB: insert user + role "learner" (one transaction)
    A->>DB: insert session (SHA-256 of a random token)
    A-->>U: httpOnly cookie qa_session, redirect to safe next or /dashboard
  end
```

## Login and logout

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant A as login() action
  participant T as Throttle (in memory)
  participant DB as SQLite
  U->>A: email, password
  A->>T: throttled? (8 failures / 15 min per email)
  alt throttled
    A-->>U: "Too many failed attempts"
  else
    A->>DB: find user by email
    A->>A: verify scrypt hash (dummy hash when the email is unknown)
    alt wrong email or password
      A->>T: record failure
      A-->>U: same message for both cases
    else correct
      A->>DB: create session (30 days)
      A-->>U: cookie + redirect (only same-site paths accepted)
    end
  end
  U->>A: logout()
  A->>DB: delete session row
  A-->>U: delete cookie, redirect home (same language)
```

## Password recovery

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant F as /forgot-password
  participant A as requestPasswordReset()
  participant DB as SQLite
  participant M as Mailer (outbox)
  participant R as /reset-password
  U->>F: email
  F->>A: POST
  A->>A: validate, then per-email throttle
  opt account exists
    A->>DB: delete older tokens, store SHA-256 of a new token (expires in 30 min)
    A->>M: email with link (page language)
  end
  A-->>U: the same confirmation whether or not the account exists
  U->>R: open link ?token=...
  R->>DB: token unused and not expired?
  alt invalid
    R-->>U: "This reset link is invalid or has expired"
  else valid
    U->>R: new password twice
    R->>DB: update hash, mark token used, delete ALL sessions (one transaction)
    R-->>U: redirect to /login?reset=1
  end
```

## Implemented versus planned

| Item | Status |
| --- | --- |
| Registration, validation, learner role by default | Implemented (`src/app/actions/auth.ts`) |
| Login, logout, safe redirects, throttle, generic errors | Implemented |
| Multiple accounts and multiple sessions per account | Implemented (account page lists the session count and can log out other devices) |
| Password reset with single-use, expiring, hashed tokens | Implemented |
| Sending real email | **Planned.** Messages go to the `email_outbox` table and the server log; `/dev/outbox` shows them in development only |
| Email verification, two-factor authentication, social login | **Planned** |
| Shared (database or Redis) login throttle | **Planned.** The current throttle is per process and resets on restart |
