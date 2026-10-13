---
title: "Authentication vs authorization: testing who can do what"
summary: "Broken authorization tops the OWASP API Security Top 10. Learn the difference between 401 and 403, how object-level and function-level authorization fail, and a systematic way to test them."
minutes: 24
level: Mid-level
skills: [api, security]
objectives:
  - "Distinguish authentication from authorization and the status codes associated with each."
  - "Explain broken object level authorization (BOLA) and broken function level authorization with examples."
  - "Build an access-control matrix and derive tests from it."
  - "Run authorization tests safely and only within authorized scope."
prerequisites:
  - "Designing tests for a REST endpoint"
keyTerms:
  - term: Authentication
    definition: "Establishing who the caller is, for example with a password, token or certificate."
  - term: Authorization
    definition: "Deciding what an authenticated caller is allowed to do with which resources."
  - term: BOLA / IDOR
    definition: "Broken object level authorization (also called insecure direct object reference): accessing another user's object by changing its identifier."
  - term: Access-control matrix
    definition: "A table of roles (or users) against operations, stating which combinations must be allowed or denied."
mistakes:
  - mistake: "Testing authorization only through the UI, where forbidden buttons are hidden."
    fix: "Hiding a button isn't access control. Call the API directly with each role's token and check that the server refuses."
  - mistake: "Using a single test account for everything."
    fix: "Authorization defects only appear across identities. You need at least two users of the same role, plus each other role."
  - mistake: "Accepting 200 with an empty body as \"access denied\"."
    fix: "Denials should be explicit (403, or 404 if the API hides existence). A 200 that leaks partial data, or claims success, is a defect."
  - mistake: "Running security tests against systems you aren't authorized to test."
    fix: "Only test environments and accounts you have written permission to use. Probing other systems can be illegal even with good intentions."
exercise:
  title: "Build an access-control matrix for an expenses API"
  brief: |
    An expenses app has these roles: **Employee**, **Manager** (approves their own team's expenses) and **Finance admin** (pays approved expenses for everyone).

    Endpoints:

    - `GET /expenses/{id}`
    - `POST /expenses`
    - `POST /expenses/{id}/approve`
    - `POST /expenses/{id}/pay`
    - `DELETE /expenses/{id}` (only while in draft)

    1. Build an access-control matrix of roles × operations. Include ownership ("own" / "own team" / "any") wherever it matters.
    2. List the eight highest-value negative tests, with the identity, the request and the expected result.
  modelAnswer: |
    **Matrix**

    | Operation | Employee | Manager | Finance admin |
    | --- | --- | --- | --- |
    | GET expense | Own | Own + own team | Any |
    | POST expense | Yes (as self) | Yes (as self) | Yes (as self) |
    | Approve | No | Own team only, not own expense | No (or per policy) |
    | Pay | No | No | Approved only |
    | DELETE | Own, draft only | Own, draft only | Per policy |

    **High-value negative tests**

    1. Employee A GETs employee B's expense by ID: 403/404, with no data in the body (**BOLA**).
    2. Employee calls approve on their own expense: 403 (**function-level**).
    3. Manager approves an expense from *another* team: 403 (BOLA across team scope).
    4. Manager approves *their own* expense: 403 (separation of duties).
    5. Employee calls pay: 403.
    6. Finance admin pays an expense that is still pending approval: 409 (state rule, not role).
    7. Employee A deletes employee B's draft: 403/404, and B's draft still exists.
    8. POST expense with `"employeeId": "<someone else>"` in the body: the server ignores it or rejects it, and never creates an expense on someone else's behalf (**mass assignment**).

    Also: each endpoint with no token (401) and with an expired token (401).
quiz:
  - id: q1
    prompt: "A request with a valid token for a regular user calls an admin-only endpoint. What status code is most appropriate?"
    options:
      - { id: a, text: "401 Unauthorized" }
      - { id: b, text: "403 Forbidden" }
      - { id: c, text: "400 Bad Request" }
      - { id: d, text: "500 Internal Server Error" }
    answer: b
    explanation: "The caller is authenticated (the token is valid) but not permitted. That is 403. A 401 means the server couldn't establish who the caller is, such as a missing, invalid or expired credential."
  - id: q2
    prompt: "Logged in as customer A, you change `/orders/1001` to `/orders/1002` and see customer B's order. What is this?"
    options:
      - { id: a, text: "Broken object level authorization (BOLA / IDOR)" }
      - { id: b, text: "A performance defect" }
      - { id: c, text: "Expected behaviour, because the IDs are sequential" }
      - { id: d, text: "An authentication defect" }
    answer: a
    explanation: "Authentication worked (you're customer A). Authorization failed: the server didn't check that order 1002 belongs to the caller. Sequential IDs make it easier to exploit but aren't the root cause."
  - id: q3
    prompt: "Why is hiding the \"Delete\" button for non-admins not enough?"
    options:
      - { id: a, text: "Because buttons can be styled differently" }
      - { id: b, text: "Because anyone can send the DELETE request directly to the API, so the server must enforce the rule" }
      - { id: c, text: "Because admins might not see it" }
      - { id: d, text: "It is enough if the UI is well tested" }
    answer: b
    explanation: "The client is under the user's control. Every authorization decision must be made, and tested, on the server."
  - id: q4
    prompt: "What is the minimum set of accounts you need to test object-level authorization for a single role?"
    options:
      - { id: a, text: "One account of that role" }
      - { id: b, text: "Two accounts of that role, each owning their own data" }
      - { id: c, text: "One admin account" }
      - { id: d, text: "No accounts: use an anonymous request" }
    answer: b
    explanation: "BOLA means user A reaching user B's objects. You need two identities of the same role, with separate data, to try it."
references:
  - title: "OWASP API Security Top 10 (2023): API1 Broken Object Level Authorization"
    url: "https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/"
    publisher: "OWASP"
  - title: "OWASP API Security Top 10 (2023): API5 Broken Function Level Authorization"
    url: "https://api-security.owasp.org/editions/2023/en/0xa5-broken-function-level-authorization/"
    publisher: "OWASP"
  - title: "RFC 9110: HTTP Semantics, 401 and 403 status codes"
    url: "https://www.rfc-editor.org/rfc/rfc9110#name-401-unauthorized"
    publisher: "IETF"
reviewedOn: "2026-10-11"
---

## Two different questions

**Authentication** asks: *who are you?* The caller proves an identity with a password, a token, a certificate or a signed request.

**Authorization** asks: *are you allowed to do this, to this resource?* It runs on every request, after authentication, and depends on the caller's role, their relationship to the resource and often the resource's state.

The HTTP status codes follow this split, despite the unfortunate name of 401:

| Situation | Code |
| --- | --- |
| No credentials, malformed, invalid or expired token | **401 Unauthorized** (really "unauthenticated") |
| Valid identity, but not permitted to do this | **403 Forbidden** |
| Valid identity, resource exists but the API hides that it exists | **404 Not Found** (a deliberate choice, used to avoid revealing which IDs exist) |

Whichever of 403 and 404 your API uses for "someone else's resource," it should be **consistent** and documented. Inconsistency can itself leak information. For example, if a real ID returns 403 and a fake one returns 404, an attacker can enumerate which IDs exist.

## Why authorization fails so often

Authentication is usually handled once, centrally, by a framework or identity provider. Authorization is scattered. Every endpoint has to check "does *this* user have access to *this* object?" and one forgotten check is enough. That is why the OWASP API Security Top 10 (2023 edition) lists **Broken Object Level Authorization** as risk number one and **Broken Function Level Authorization** as number five.

**Object level (BOLA):** the endpoint checks that you're logged in, but not that the object belongs to you.

```bash
# Logged in as customer A (token A). Order 5521 belongs to customer B.
curl -s https://api.shop.example/v1/orders/5521 \
  -H "Authorization: Bearer $TOKEN_A"
# Defect: 200 OK with B's address and items.
# Expected: 403 (or 404, per the API's convention), with no order data in the body.
```

**Function level:** the endpoint checks that you're logged in, but not that your role may perform this *operation*.

```bash
# Token for a regular customer calling an admin operation.
curl -s -X POST https://api.shop.example/v1/admin/refunds \
  -H "Authorization: Bearer $TOKEN_CUSTOMER" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"5521","amount":"30.000"}'
# Expected: 403. Anything that creates a refund is a critical defect.
```

**Mass assignment** is a close relative: the API accepts fields the caller should not be able to set, such as `"role": "admin"` or `"ownerId": "someone-else"`, because it binds the whole request body to the database object.

## A systematic approach: the access-control matrix

Ad-hoc poking finds some issues. A matrix finds them systematically and gives you a coverage figure.

1. **List the roles**, including anonymous, plus ownership relationships (own, same team, same tenant, any).
2. **List the operations**: every endpoint × method that reads or changes data.
3. **Fill each cell** with "allow," "deny" or a condition. Get the product owner or security lead to confirm it. Gaps and disagreements here are defects in the requirements.
4. **Derive tests:** at least one per "deny" cell, plus ownership crossings for every "own only" cell.

| Operation | Anonymous | Customer (own) | Customer (other's) | Support agent | Admin |
| --- | --- | --- | --- | --- | --- |
| GET /orders/{id} | 401 | 200 | 403/404 | 200 | 200 |
| PATCH /orders/{id}/address | 401 | 200 if not shipped | 403/404 | 403 | 200 |
| POST /admin/refunds | 401 | 403 | 403 | 200 ≤ 50 JOD | 200 |

A useful automation pattern is a **table-driven test**: one test function that loops over the matrix rows and sends each request with the right token. Adding a new endpoint then means adding a row, not writing new test code.

## Checks for every authorization test

- The **status code** matches the matrix.
- The **body leaks nothing**: no partial object, no "user B's email" inside an error message.
- **Nothing changed:** for denied writes, read the resource back as its owner.
- **Identifiers in every location** are covered: path, query, body *and* headers. A check on the path parameter alone is often bypassed by putting an ID in the body.
- **Token edge cases:** expired, tampered signature, a token for another environment, and a token for a user who has since been deactivated or downgraded.

## Test safely and with permission

Authorization testing is security testing. Do it only:

- on environments you are explicitly authorized to test, usually staging or a dedicated test tenant;
- with test accounts created for the purpose, never real customer accounts;
- within the scope your team or security lead has agreed in writing.

Report authorization defects through your team's security process, not a public channel. They are often treated as confidential until fixed.

Next: making sure responses keep their promises, with schema validation in automated tests.
