# 11. User video uploads

**Status: planned. Nothing in this diagram is implemented.** The site has no upload field, no storage bucket and no processing pipeline. This diagram is the agreed design for a later phase (roadmap phase 3), so that the database and permissions can be extended without surprises.

```mermaid
flowchart TD
  classDef planned fill:#f4f4f6,stroke:#8a90a6,stroke-dasharray:5 5,color:#555

  Contributor["Contributor role (granted by an admin)"]:::planned
  Contributor --> Terms["Accept upload terms:<br/>own work, no copyrighted material, no personal data"]:::planned
  Terms --> Upload["Direct upload to object storage<br/>(signed URL, size and type limits)"]:::planned
  Upload --> Scan["Malware scan + transcode<br/>(captions required)"]:::planned
  Scan --> Queue["Moderation queue"]:::planned
  Queue --> Mod{"Moderator decision"}:::planned
  Mod -->|Reject with reason| Notify["Notify contributor"]:::planned
  Mod -->|Approve| Publish["Publish, attributed to the contributor"]:::planned
  Publish --> Report["Report / takedown request"]:::planned
  Report --> Queue
```

## Why it is planned, not built

- Hosting user video needs storage, transcoding, captioning, malware scanning, a moderation team and a copyright takedown process. None of these exist yet, and faking any of them would be dishonest and unsafe.
- The `contributor` and `moderator` roles already exist in the schema so that the permission model doesn't need a migration later. They currently grant nothing beyond the learner role.
