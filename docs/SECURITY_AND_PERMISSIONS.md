# Security and permissions

How accounts, sessions and roles are protected, and what each control defends against. Last reviewed: 13 October 2026.

See also: [diagram 3, authentication flows](diagrams/03-authentication-flows.md) · [diagram 4, roles and permissions](diagrams/04-roles-and-permissions.md) · [ADMIN_GUIDE.md](ADMIN_GUIDE.md)

## 1. Principles

1. **The server decides.** Every page and Server Action checks the session and role on the server. Hiding a button is a convenience, never the control.
2. **Least privilege by default.** Registration creates a learner and nothing else. Higher roles are granted only by an administrator or from the server's command line.
3. **No secrets in the browser.** Admin bootstrap values (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) are read only by the start-up script on the server. Variables prefixed `NEXT_PUBLIC_` contain nothing secret (only the public site URL).
4. **Say as little as possible to attackers.** Login and password recovery give the same answer whether or not an email is registered.
5. **Synthetic data only.** Seed and demo data are invented. There is no real customer, financial or identity data in the repository.

## 2. Authentication

| Control | Implementation | Code |
| --- | --- | --- |
| Password hashing | scrypt (N=2¹⁵, r=8, p=1, 64-byte key, 16-byte random salt), NFKC-normalised input, constant-time comparison. Parameters are stored with each hash so they can be raised later | `src/lib/auth/password.ts` |
| Password rules | 10–200 characters with at least one letter and one number (Unicode-aware, so Arabic letters and digits count) | `src/lib/auth/validation.ts` |
| Sessions | 32 random bytes, sent to the browser once in the `qa_session` cookie. The database stores only the SHA-256 hash, so a leaked database can't be used to sign in | `src/lib/auth/session.ts` |
| Cookie flags | `httpOnly`, `SameSite=Lax`, `Secure` in production, `Path=/`, 30-day expiry | same |
| Expiry | Checked against the request time on every request; expired sessions are rejected | `readSessionUserId()` |
| Login throttle | 8 failed attempts per email in a 15-minute window, then "Too many failed attempts" | `src/lib/auth/rate-limit.ts` |
| Account enumeration | Same message for an unknown email and a wrong password. A dummy scrypt hash is verified when the email is unknown, so response times match | `login()` in `src/app/actions/auth.ts` |
| Open redirects | `?next=` accepts only same-site paths: it must start with `/`, and `//` and `/\` are refused | `safeNext()` |
| Logout | Deletes the session row and the cookie | `destroySession()` |
| Several devices | Each login is its own session. The account page shows the count and can sign out all other devices | `logoutOtherSessions()` |
| Password change | Needs the current password; signs out every other session | `changePassword()` |
| Email change | Needs the current password | `updateProfile()` |
| Account deletion | Needs the password; deletes the user and, by cascade, roles, sessions, tokens, progress, attempts and bookmarks. The last administrator can't delete themselves | `deleteAccount()` |

## 3. Password recovery

| Control | Implementation |
| --- | --- |
| Token | 32 random bytes in the link; only its SHA-256 hash is stored |
| Lifetime | 30 minutes; single use (`used_at` is set); requesting a new link deletes older ones |
| On success | The password is updated, the token is marked used and **all** sessions are deleted, in one transaction |
| Enumeration | The same confirmation is shown whether or not the account exists. Requests are throttled per email, and throttled requests get the same answer |
| Link host | Built from `NEXT_PUBLIC_SITE_URL`, or Render's `RENDER_EXTERNAL_URL`, before the request's Host header, so a forged Host header can't point reset links at another site |
| Delivery | **Not yet a real email.** The message is stored in `email_outbox` and written to the server log. `/dev/outbox` exists only outside production. Anyone who can read the server logs can see live reset links, so restrict log access to administrators (see [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md)) |

## 4. Authorisation

### Permission matrix

| Capability | Anonymous | Learner | Instructor | Administrator |
| --- | :-: | :-: | :-: | :-: |
| Read published content, search, take knowledge checks | ✓ | ✓ | ✓ | ✓ |
| Save progress, bookmarks, attempts; dashboard; account | | ✓ | ✓ | ✓ |
| Open the admin studio, read the audit log | | | ✓ | ✓ |
| Create and edit draft lessons; submit for review | | | ✓ | ✓ |
| Edit draft and planned paths; add modules to them | | | ✓ | ✓ |
| Edit unverified certification records | | | ✓ | ✓ |
| Add videos as drafts | | | ✓ | ✓ |
| Publish, unpublish, archive; edit published content | | | | ✓ |
| Mark certification facts verified | | | | ✓ |
| Publish videos | | | | ✓ |
| Grant and revoke roles | | | | ✓ |

### Where it is enforced

| Layer | Check | Code |
| --- | --- | --- |
| Proxy | No session cookie on `/dashboard`, `/account`, `/admin` (either language) → redirect to login. An optimisation only | `src/proxy.ts` |
| Data access layer | The only code that turns a cookie into a user: session lookup, expiry, roles. Deduplicated per request | `src/lib/auth/dal.ts` |
| Pages | `requireUser()` redirects to login; `requireStaffPage()` and `requireAdminPage()` return nothing for the wrong role, and the page explains which role is needed | `src/lib/admin/guard.ts` |
| Server Actions | Every admin action calls `staffUser()` or `adminUser()` again, then checks the item's current status before writing | `src/app/actions/admin.ts` |
| Workflow | A table of allowed status changes and which need an administrator | `src/lib/admin/workflow.ts` |
| Role changes | Learner always kept; no removing your own admin role; never the last administrator; audited | `updateUserRoles()`, `scripts/set-role.ts` |

The `admin` role passes every role check (`hasRole()`).

## 5. Input handling and output safety

- **Validation:** every form is validated with Zod on the server. Errors are returned per field, in the page language. Admin text formats (key terms, mistakes, references, knowledge-check JSON) are parsed strictly and reported by line.
- **SQL:** all queries go through Drizzle's parameterised query builder. No SQL is built from strings.
- **HTML:** React escapes everything it renders. The only HTML injected directly is the lesson and project Markdown, rendered on the server by remark and rehype from content that only instructors and administrators can edit. Raw HTML in Markdown is not passed through (remark-rehype without `allowDangerousHtml`).
- **Knowledge checks:** the browser receives questions and options only. Answers and explanations are sent after the server has scored a submission, and unknown option ids are scored as wrong.
- **URLs:** references must be `https://`. Videos accept YouTube ids and links only. External links open with `rel="noopener noreferrer"`.
- **CSRF:** Server Actions accept POST only, and Next.js checks that the `Origin` header matches the host. Session cookies are `SameSite=Lax`.

## 6. Privacy

- Stored personal data: name, email, password hash, preferred language, learning activity, sessions.
- No analytics, advertising or tracking scripts.
- YouTube is loaded from `youtube-nocookie.com`, and only after the learner presses play.
- `robots.txt` excludes private, account and admin pages, and the not-found page is marked `noindex`.
- Users can delete their account and all their data themselves.

## 7. Data safety

- Seeding inserts missing rows only and never deletes or overwrites content unless `--force-content` is passed explicitly.
- Demo accounts and `npm run db:reset` are refused when `NODE_ENV=production`.
- The end-to-end test script refuses to reset any database whose path doesn't contain `e2e`.
- Deleting a user keeps the audit history (the actor becomes `NULL`) and content history (`updated_by`, `added_by`).

## 8. Dependencies

- `npm audit --omit=dev`: **0 vulnerabilities** (checked 13 October 2026).
- `npm audit` (including development tools) reports advisories in two tool chains:
  - `braces`, a denial of service through deeply nested glob patterns, reached through `eslint-config-next` → `fast-glob`;
  - an old `esbuild`, whose development server accepts cross-origin requests, reached through `drizzle-kit` → `@esbuild-kit`.
  
  Development dependencies are installed on the server, because start-up runs a TypeScript script with `tsx`. The running site never calls the linter's globbing or esbuild's development server, and no user input reaches them. The suggested `npm audit fix --force` would downgrade `eslint-config-next` to version 14, so it isn't applied. Recheck with `npm audit` after upgrading these tools.
- `.npmrc` sets `ignore-scripts=true`, so packages can't run install scripts. `better-sqlite3` ships prebuilt binaries, so it needs none.

## 9. Known gaps and planned controls

| Gap | Risk | Planned control |
| --- | --- | --- |
| No real email delivery | Reset links appear in server logs | Email provider transport in `src/lib/mailer.ts` |
| Login throttle is in memory | Resets on restart; not shared between instances | Database- or Redis-backed throttle |
| No email verification, 2FA or social login | Weaker account assurance | Planned (diagram 3) |
| No Content-Security-Policy header | Defence in depth against injected scripts | Add a CSP with nonces in `proxy.ts` |
| No automated off-site backups | Data loss if the disk fails | Scheduled backups (see [DATABASE.md](DATABASE.md#7-backups-and-restore)) |

## 10. Reporting a security problem

Please don't open a public issue. Contact the maintainer, Eman Abo-Oun, through [LinkedIn](https://www.linkedin.com/in/eman-abo-oun-28ba40207/) with the details, and allow time for a fix before disclosure.
