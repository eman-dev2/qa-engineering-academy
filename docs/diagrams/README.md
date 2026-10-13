# Diagrams

Fourteen Mermaid diagrams. GitHub renders them inline; PNG copies are in [`rendered/`](rendered/) for offline reading. Every diagram uses the same legend: **solid green = implemented**, **dashed grey = planned (not implemented)**, blue = configured in the repository but only runs once connected to GitHub or Render.

| # | Diagram | Status |
| --- | --- | --- |
| 1 | [System architecture](01-system-architecture.md) | Implemented; email provider, uploads storage and PostgreSQL planned |
| 2 | [Sitemap](02-sitemap.md) | Implemented; mock exams, community, interview prep and labs planned |
| 3 | [Registration, login, logout, password recovery](03-authentication-flows.md) | Implemented; real email delivery and 2FA planned |
| 4 | [Roles and permissions](04-roles-and-permissions.md) | Learner, instructor, admin implemented; contributor and moderator features planned |
| 5 | [Onboarding and learning paths](05-onboarding-and-learning-paths.md) | Implemented; placement quiz planned |
| 6 | [Path, module and lesson progression](06-course-module-lesson-progression.md) | Implemented; capstone certificates planned |
| 7 | [Knowledge-check flow](07-quiz-flow.md) | Implemented |
| 8 | [Certification preparation and mock exams](08-certification-prep-and-mock-exams.md) | Hub, verified facts, study plan, practice set implemented; mock exams planned |
| 9 | [Admin content workflow](09-admin-content-workflow.md) | Implemented; revision history planned |
| 10 | [YouTube video curation](10-youtube-video-curation.md) | Implemented; automated discovery and re-checks planned |
| 11 | [User video uploads](11-user-video-uploads.md) | **Planned only** |
| 12 | [Entity-relationship diagram](12-entity-relationships.md) | Implemented; future tables listed |
| 13 | [Testing, CI/CD and deployment](13-testing-ci-cd-deployment.md) | Tests implemented and passing; CI and Render configured |
| 14 | [Error handling](14-error-handling.md) | Implemented; error tracking service planned |

All diagrams were rendered with `@mermaid-js/mermaid-cli` 11 to check that they parse.
