# 5. Onboarding and learning paths

**Legend:** green = implemented, dashed grey = planned.

```mermaid
flowchart TD
  classDef done fill:#e3f3ea,stroke:#17734a,color:#0f3d27
  classDef planned fill:#f4f4f6,stroke:#8a90a6,stroke-dasharray:5 5,color:#555

  Land["Landing page<br/>boundary-value probe, paths overview"]:::done
  Lang{"Language?"}:::done
  Land --> Lang
  Lang -->|English| Catalog["/paths catalog"]:::done
  Lang -->|العربية| CatalogAr["/ar/paths catalog"]:::done
  Catalog --> Filter["Filter by starting level<br/>Beginner … QA lead"]:::done
  CatalogAr --> Filter
  Quiz["Placement quiz recommends a path"]:::planned
  Land -.-> Quiz -.-> Filter
  Filter --> Pick["Pick a path: goal, prerequisites,<br/>outcomes, milestones, effort"]:::done
  Pick --> Anon{"Signed in?"}:::done
  Anon -->|No| ReadFree["Read every lesson free;<br/>prompt to create an account to save progress"]:::done
  Anon -->|Yes| Track["Progress bar, 'continue with lesson n'"]:::done
  ReadFree --> Signup["Create account (learner role)"]:::done --> Track
  Track --> Dashboard["Dashboard: continue, path progress,<br/>skill map, attempts, saved lessons"]:::done
  Dashboard --> Next["Next path suggested by level"]:::planned
```

## The paths in the seed data

| Path | Levels | Published lessons | Planned lessons |
| --- | --- | --- | --- |
| QA Foundations | Beginner → Junior | 5 | 0 |
| Practical Manual Testing | Junior → Mid-level | 1 | 5 |
| Web Automation with Playwright and TypeScript | Junior → Automation engineer | 1 | 4 |
| API Testing Essentials | Mid-level → Senior | 4 | 2 |
| Senior Quality Engineering | Senior → Head of QE | 1 | 3 |
| QA Leadership | Senior → QA lead | 1 | 3 |
| Test Management | QA lead → Test manager | 1 | 3 |
| Payments and Fintech QA (in development) | Mid-level → Senior | 0 | 5 |

Planned lessons appear as outlines (title, summary, objectives) marked **Planned**; they have no body and cannot be opened. Exact level ranges are in `seed/content/paths.ts`.
