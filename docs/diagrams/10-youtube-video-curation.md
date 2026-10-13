# 10. YouTube video discovery, attribution and embedding

**Legend:** green = implemented, dashed grey = planned.

```mermaid
flowchart TD
  classDef done fill:#e3f3ea,stroke:#17734a,color:#0f3d27
  classDef planned fill:#f4f4f6,stroke:#8a90a6,stroke-dasharray:5 5,color:#555

  Find["Editor finds a video on the creator's own channel"]:::done
  Auto["Automated discovery via YouTube Data API"]:::planned
  Find --> Add["/admin/videos: paste link or 11-character id"]:::done
  Auto -.-> Add
  Add --> Validate{"Valid YouTube link?<br/>title, creator, https channel URL,<br/>level, EN description"}:::done
  Validate -->|No| Err["Error list, input kept"]:::done
  Validate -->|Yes| Draft["Saved as draft<br/>(+ verified-on date if ticked)"]:::done
  Draft --> Review["Admin checks title and creator on YouTube"]:::done
  Review --> Pub["Publish (admin only)"]:::done
  Pub --> Library["Library card + related lessons:<br/>original title, creator link, our description (EN/AR),<br/>'Watch on YouTube' link"]:::done
  Library --> Click{"Learner presses play?"}:::done
  Click -->|No| Nothing["Nothing is loaded from YouTube"]:::done
  Click -->|Yes| Embed["youtube-nocookie.com iframe"]:::done
  Pub -.-> Recheck["Scheduled link and title re-check"]:::planned
```

## Rules

- Videos are only linked and embedded. They are never downloaded or re-hosted, and there is no upload field (e2e-tested).
- The original title is kept as published by the creator; our own description explains why it's useful, in both languages.
- The 8 seeded videos (7 from the official Playwright channel, 1 from Visual Studio Code) were checked on 2026-10-12.
