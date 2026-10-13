# 4. Roles and permissions

**Legend:** green = enforced in code today; dashed grey = role exists in the schema but its features are planned.

```mermaid
flowchart LR
  classDef done fill:#e3f3ea,stroke:#17734a,color:#0f3d27
  classDef planned fill:#f4f4f6,stroke:#8a90a6,stroke-dasharray:5 5,color:#555
  classDef role fill:#e6eaf9,stroke:#1f3fae,color:#162f87

  Anon(("Anonymous")):::role
  Learner(("Learner<br/>every account")):::role
  Instructor(("Instructor")):::role
  Admin(("Administrator")):::role
  Contributor(("Contributor")):::role
  Moderator(("Moderator")):::role

  Read["Read published lessons, paths,<br/>certifications, library; search;<br/>take knowledge checks (not saved)"]:::done
  Learn["Save progress, bookmarks, attempts;<br/>dashboard; account settings"]:::done
  Draft["Create and edit draft lessons,<br/>draft and planned paths, modules;<br/>submit for review; add draft videos;<br/>edit unverified certifications"]:::done
  Publish["Publish, unpublish, archive;<br/>edit published content;<br/>verify certification facts;<br/>publish videos"]:::done
  Users["Grant and revoke roles<br/>(never the last admin, never own admin role)"]:::done
  Audit["Read the audit log"]:::done
  Submit["Submit videos, links, Q&A"]:::planned
  Moderate["Moderation queue"]:::planned

  Anon --> Read
  Learner --> Read
  Learner --> Learn
  Instructor --> Learn
  Instructor --> Draft
  Instructor --> Audit
  Admin --> Learn
  Admin --> Draft
  Admin --> Publish
  Admin --> Users
  Admin --> Audit
  Contributor -.-> Submit
  Moderator -.-> Moderate
```

## Enforcement points

| Layer | What it checks | Code |
| --- | --- | --- |
| Proxy | No session cookie on `/dashboard`, `/account`, `/admin` → redirect to login (optimistic only) | `src/proxy.ts` |
| Pages | Session lookup + expiry; staff role for `/admin/*`; administrator for `/admin/users` | `src/lib/auth/dal.ts`, `src/lib/admin/guard.ts` |
| Server actions | Every admin action re-checks the role and the content status before writing | `src/app/actions/admin.ts` |
| Workflow | Which status changes each role may make | `src/lib/admin/workflow.ts` |
| CLI | First administrator and role changes from the server's command line | `scripts/create-admin.ts`, `scripts/set-role.ts` |

New registrations always receive only the `learner` role. The `admin` role passes every role check. No admin credential or bootstrap secret is ever sent to the browser.
