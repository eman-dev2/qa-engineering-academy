# 13. Testing, CI/CD and deployment

**Legend:** green = implemented and run, blue = configured in the repository (runs once the repository is on GitHub / Render), dashed grey = planned.

```mermaid
flowchart LR
  classDef done fill:#e3f3ea,stroke:#17734a,color:#0f3d27
  classDef config fill:#e6eaf9,stroke:#1f3fae,color:#162f87
  classDef planned fill:#f4f4f6,stroke:#8a90a6,stroke-dasharray:5 5,color:#555

  Dev["Developer: npm run dev<br/>(migrate, seed, demo accounts)"]:::done
  Check["npm run check<br/>tsc + eslint + vitest (82 unit tests)"]:::done
  E2E["npm run test:e2e<br/>Playwright, 50 tests, production build,<br/>fresh seeded e2e.db, desktop + Pixel 7"]:::done
  Push["git push"]:::config
  CI["GitHub Actions CI<br/>.github/workflows/ci.yml<br/>typecheck, lint, unit, e2e, report artifact"]:::config
  Render["Render Blueprint (render.yaml)<br/>build: npm ci + npm run build<br/>start: npm start (migrate, seed missing, admin bootstrap)"]:::config
  Disk[("Persistent disk<br/>/var/data/academy.db")]:::config
  Docker["Dockerfile for any container host"]:::config
  Gate["Branch protection: CI must pass before merge"]:::planned
  Backup["Scheduled database backups"]:::planned
  Monitor["Uptime and error monitoring"]:::planned

  Dev --> Check --> E2E --> Push --> CI
  Push --> Render --> Disk
  CI -.-> Gate
  Disk -.-> Backup
  Render -.-> Monitor
  Push -.-> Docker
```

## Notes

- Unit and end-to-end suites were run in this environment and pass (see [TESTING.md](../TESTING.md)).
- The CI workflow and Render Blueprint are committed and ready, but they only run once the repository is pushed to GitHub and connected to Render. The production build and start sequence they use was reproduced locally from a clean clone.
- The Dockerfile follows the same steps but was not built here (no Docker daemon in this environment).
