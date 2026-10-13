# 8. Certification preparation and mock exams

**Legend:** green = implemented, dashed grey = planned.

```mermaid
flowchart TD
  classDef done fill:#e3f3ea,stroke:#17734a,color:#0f3d27
  classDef planned fill:#f4f4f6,stroke:#8a90a6,stroke-dasharray:5 5,color:#555

  Hub["Certification hub<br/>27 ISTQB certifications, filters"]:::done
  Hub --> Verified{"Facts verified on the<br/>official page?"}:::done
  Verified -->|No| Listed["Name, code, stream,<br/>link to the official page only"]:::done
  Verified -->|Yes, 4 so far| Detail["Detail page: exam format, pass mark,<br/>duration, source + review date,<br/>syllabus chapters (EN/AR), audience"]:::done
  Detail --> Plan["Four-week study plan (CTFL)"]:::done
  Detail --> Practice["10 original practice questions (CTFL)<br/>scored on the server, EN/AR"]:::done
  Detail --> Paths["Related learning paths"]:::done
  Practice --> Dash["Attempts on the dashboard"]:::done
  Detail -.-> Mock["Timed full-length mock exam<br/>(question pool, randomised)"]:::planned
  Mock -.-> Report["Score by syllabus chapter,<br/>weak-area lesson suggestions"]:::planned
  Admin["Admin: edit facts; only administrators<br/>can mark a record verified"]:::done --> Verified
```

## Rules

- Exam facts (questions, points, pass mark, duration, non-native extension) are shown **only** for records marked verified, each with its source URL and review date. Unverified records store no facts at all (unit-tested).
- Fees are never listed: they vary by exam provider and country.
- Practice questions are written for this site. Official sample exams are linked, never copied. No leaked or "real" exam questions are used.
- Verified so far (reviewed 2026-10-11/12): CTFL v4.0, CTAL-TA, CTAL-TAE v2.0, CTAL-TM v3.0. Details in `seed/content/certifications.ts`.
