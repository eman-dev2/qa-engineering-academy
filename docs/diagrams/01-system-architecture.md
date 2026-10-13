# 1. System architecture

**Legend:** solid green boxes are implemented in this repository; dashed grey boxes are planned and **not** implemented.

```mermaid
flowchart LR
  classDef done fill:#e3f3ea,stroke:#17734a,color:#0f3d27
  classDef planned fill:#f4f4f6,stroke:#8a90a6,stroke-dasharray:5 5,color:#555

  Browser["Browser<br/>(English at /, Arabic at /ar, RTL)"]:::done

  subgraph Server["Next.js 16 server (Node.js 22)"]
    Proxy["proxy.ts<br/>locale rewrite, /en redirect,<br/>private-route gate"]:::done
    RSC["Server Components<br/>pages and layouts"]:::done
    Cache["'use cache' content cache<br/>tag: content, revalidate hourly"]:::done
    Actions["Server Actions<br/>auth, learning, admin"]:::done
    DAL["Data access layer<br/>sessions, roles, guards"]:::done
    Repo["Content repository<br/>per-locale with English fallback"]:::done
    Mailer["Mailer boundary<br/>(outbox transport)"]:::done
  end

  DB[("SQLite (better-sqlite3)<br/>Drizzle ORM, WAL")]:::done
  Seed["Seed files<br/>Markdown lessons EN/AR,<br/>paths, certifications, library"]:::done
  CLI["CLI scripts<br/>prepare, db:reset, admin:create, user:role"]:::done
  YouTube["YouTube (privacy-enhanced embed,<br/>loaded only on click)"]:::done
  Email["Email provider<br/>(Resend / Postmark)"]:::planned
  Uploads["Object storage for user uploads"]:::planned
  Postgres[("PostgreSQL for multi-instance scale")]:::planned

  Browser -->|HTTPS| Proxy --> RSC
  RSC --> Cache --> Repo --> DB
  Browser -->|form posts| Actions
  Actions --> DAL --> DB
  Actions -->|updateTag content| Cache
  Actions --> Mailer --> DB
  Mailer -.-> Email
  Seed --> CLI --> DB
  Browser -.->|iframe after click| YouTube
  Actions -.-> Uploads
  DB -.-> Postgres
```

## Notes

- **Implemented:** everything in the server box, SQLite, seed files and CLI scripts. Code: `src/proxy.ts`, `src/app`, `src/app/actions`, `src/lib/auth`, `src/lib/content/repo.ts`, `src/lib/mailer.ts`, `scripts/`, `seed/`.
- **Planned:** a real email provider (password-reset emails are stored in the outbox table and written to the server log today), object storage for user uploads, and PostgreSQL if the site ever needs more than one server instance.
- Content is read through cached functions tagged `content`. Admin changes call `updateTag("content")`, so edits show immediately. The hourly revalidation covers deployments where the build reads a different database file from the running server.
