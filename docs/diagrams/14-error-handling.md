# 14. Error handling

All paths below are **implemented** unless marked planned.

```mermaid
flowchart TD
  classDef done fill:#e3f3ea,stroke:#17734a,color:#0f3d27
  classDef planned fill:#f4f4f6,stroke:#8a90a6,stroke-dasharray:5 5,color:#555

  Req["Request"]:::done --> Route{"Route matches?"}:::done
  Route -->|No| G404["global-not-found: bilingual 404,<br/>HTTP 404, noindex"]:::done
  Route -->|Yes| Lang{"Locale valid?"}:::done
  Lang -->|No| NF["notFound()"]:::done
  Lang -->|Yes| Data{"Content exists and is published?"}:::done
  Data -->|No| NF
  NF --> L404["[lang]/not-found: 404 page in the page language,<br/>links to paths, search, roadmap; noindex"]:::done
  Data -->|Yes| Render["Render"]:::done
  Render -->|Unexpected exception| EB["[lang]/error: 'Something went wrong on our side',<br/>reference digest, Try again (retry)"]:::done
  Render --> Form["Form submission"]:::done
  Form --> V{"Validation"}:::done
  V -->|Invalid| FE["Inline field errors + alert summary,<br/>input kept, page language"]:::done
  V -->|Forbidden| FB["Explicit 'You don't have permission' message;<br/>admin pages explain the missing role"]:::done
  V -->|Conflict| CF["Specific message: slug taken, status change not allowed,<br/>last administrator, quiz keys don't match"]:::done
  V -->|OK| OK["Success status message (aria-live)"]:::done
  EB -.-> Track["Error tracking service (Sentry or similar)"]:::planned
```

## Rules

- Users never see stack traces. The error boundary shows a short message and a reference (`digest`) that matches the server log.
- Validation errors are written for the person reading them, in their language, and say how to fix the problem.
- Failed admin saves keep everything the editor typed (the form doesn't reset).
- Authentication errors never reveal whether an email has an account.
- Unknown slugs under streamed routes return the not-found page with `noindex` but HTTP 200 (a documented Next.js behaviour once streaming has started); unmatched URLs return a real 404. See [KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md).
