# 13. Testing, CI/CD and deployment

**Legend:** green = implemented and running, blue = configured in the repository and ready to connect, dashed grey = planned.

```mermaid
flowchart LR
  classDef done fill:#e3f3ea,stroke:#17734a,color:#0f3d27
  classDef config fill:#e6eaf9,stroke:#1f3fae,color:#162f87
  classDef planned fill:#f4f4f6,stroke:#8a90a6,stroke-dasharray:5 5,color:#555

  Dev["Developer: npm run dev<br/>(migrate, seed, demo accounts)"]:::done
  Check["npm run check<br/>tsc + eslint + vitest (82 unit tests)"]:::done
  E2E["npm run test:e2e<br/>Playwright, 50 tests, production build,<br/>fresh seeded e2e.db, desktop + Pixel 7"]:::done
  Push["git push to GitHub<br/>eman-dev2/qa-engineering-academy"]:::done
  CI["GitHub Actions CI<br/>.github/workflows/ci.yml<br/>typecheck, lint, unit, e2e, report artifact"]:::done
  Render["Render Blueprint (render.yaml), free plan<br/>build: npm ci + npm run build<br/>start: npm start (migrate, seed missing, admin bootstrap)"]:::config
  Disk[("Optional persistent disk (paid plan)<br/>/var/data/academy.db")]:::config
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

- Unit and end-to-end suites pass locally and in GitHub Actions on every push to `main` (see [TESTING.md](../TESTING.md)).
- The Render Blueprint is committed and ready; it runs once the repository is connected to a Render account ([DEPLOYMENT.md](../DEPLOYMENT.md#5-render)). The production build and start sequence it uses was reproduced locally from a clean clone.
- The Dockerfile follows the same steps but was not built here (no Docker daemon in this environment).
