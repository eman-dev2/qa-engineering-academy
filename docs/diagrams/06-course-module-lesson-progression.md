# 6. Path, module and lesson progression

All states below are **implemented** unless marked planned.

## Content structure

```mermaid
flowchart LR
  classDef done fill:#e3f3ea,stroke:#17734a,color:#0f3d27
  classDef planned fill:#f4f4f6,stroke:#8a90a6,stroke-dasharray:5 5,color:#555
  P["Learning path"]:::done --> M1["Module 1"]:::done --> L1["Lesson (published)"]:::done
  M1 --> L2["Lesson (planned outline)"]:::done
  P --> M2["Module 2"]:::done --> L3["Lesson (published)"]:::done
  L1 --> Parts["Objectives + prerequisites → body → key terms →<br/>common mistakes → exercise + model answer →<br/>knowledge check → videos/templates → references"]:::done
  P -.-> Cap["Capstone project and path certificate"]:::planned
```

## A learner's progress on one lesson

```mermaid
stateDiagram-v2
  [*] --> NotStarted
  NotStarted --> Started: signed-in learner opens the lesson (recorded once)
  Started --> Completed: "Mark lesson as complete"
  Completed --> Started: select again to mark incomplete
  Started --> Started: knowledge-check attempts saved (best score shown)
  Completed --> Completed: attempts still saved
```

## Rules

- Progress is stored per lesson key `"<path-slug>/<lesson-slug>"` (`lesson_progress`), so editing a lesson's text never loses progress. The slug is locked once a lesson has been published.
- Completing a lesson does not require passing its knowledge check; the dashboard shows both.
- The dashboard "continue" card picks the most recently opened unfinished lesson, otherwise the first unfinished lesson overall.
- The skill map counts completed lessons per skill, out of the lessons published for that skill.
- Only published lessons accept progress, bookmarks and attempts (`isPublishedLessonKey`).
