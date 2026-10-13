---
title: "Designing tests for a REST endpoint"
summary: "A repeatable checklist for turning an endpoint specification into a focused test set: happy paths, validation, state, idempotency, pagination and error handling."
minutes: 26
level: Mid-level
skills: [api, manual]
objectives:
  - "Derive API test conditions from an endpoint specification using partitions, boundaries and decision tables."
  - "Design tests for state transitions and conflicting operations on a resource."
  - "Test idempotency and duplicate submission behaviour."
  - "Organise an API test set so each test has a single, clear reason to fail."
prerequisites:
  - "Anatomy of an HTTP exchange"
  - "Equivalence partitioning and boundary value analysis"
keyTerms:
  - term: Contract
    definition: "The agreed shape and behaviour of an API: paths, methods, payloads, status codes and error formats."
  - term: State transition
    definition: "A change in a resource's lifecycle state, such as pending to paid, triggered by an operation."
  - term: Test isolation
    definition: "Each test sets up its own data and doesn't depend on other tests having run first."
mistakes:
  - mistake: "Chaining tests so test 2 uses the order created by test 1."
    fix: "Create the data each test needs inside that test (or in a fixture). Chained tests fail in confusing cascades and can't run in parallel."
  - mistake: "Testing only through the happy path because \"the UI prevents bad input\"."
    fix: "The API is a public surface. Anyone can call it without your UI. Validation must be tested at the API."
  - mistake: "Checking the response but not the resulting state."
    fix: "After a write, read the resource back (or query the database) and confirm the change persisted exactly as reported."
  - mistake: "Hard-coding IDs and timestamps from one environment."
    fix: "Generate unique test data per run and assert on rules (\"createdAt is within the last minute\") rather than fixed values."
exercise:
  title: "Design a test set for a refund endpoint"
  brief: |
    Here is the endpoint specification:

    ```text
    POST /v1/orders/{orderId}/refunds
    Body: { "amount": "string decimal, > 0", "reason": "string, 1-200 chars" }
    Rules:
      - Only orders in status "paid" or "partially_refunded" can be refunded.
      - The sum of all refunds must not exceed the order total.
      - A refund that brings the total refunded to the order total sets order status to "refunded";
        otherwise "partially_refunded".
      - Supports an Idempotency-Key header.
    Responses: 201 refund created; 400 invalid body; 404 order not found;
               409 order not refundable or amount exceeds remaining; 401/403 auth errors.
    ```

    Using an order with total 30.000 JOD, design at least 10 test cases. Group them as validation, business rules and state, idempotency, and errors. For each case give the setup, the request, and the expected status and resulting order state.
  modelAnswer: |
    **Validation (order status paid, total 30.000)**

    1. amount "0": 400, and the order is unchanged.
    2. amount "-5.000": 400.
    3. amount "abc" or missing: 400 with a field-level message.
    4. reason "" (0 chars): 400. Reason of 200 chars: 201. Reason of 201 chars: 400 (boundaries).

    **Business rules and state**

    5. Paid order, amount "10.000": 201; order becomes `partially_refunded`; remaining refundable is 20.000.
    6. Then amount "20.000": 201; order becomes `refunded` (exact boundary of the remaining amount).
    7. Fresh paid order, amount "30.001": 409 (just over the total), and the order stays `paid`.
    8. Order in `pending_payment`: 409, not refundable.
    9. Order already `refunded`, amount "0.001": 409.

    **Idempotency**

    10. Send the same refund twice with the same Idempotency-Key: both return 201 with the **same** refund id, and only one refund exists.
    11. Same key, *different* body: the API should reject it (commonly 409 or 422; check the documentation) rather than silently returning the first result.

    **Errors**

    12. Unknown orderId: 404. No auth: 401. Another customer's order: 403 or 404 (see the next lesson).

    Every write test also reads the order back to confirm the status and refunded total.
quiz:
  - id: q1
    prompt: "A test creates an order, and three later tests use that order's ID. What is the main risk?"
    options:
      - { id: a, text: "The tests run too fast" }
      - { id: b, text: "If the first test fails or runs in a different order, the dependent tests fail for unrelated reasons, and the tests can't run in parallel" }
      - { id: c, text: "IDs are confidential" }
      - { id: d, text: "There is no risk if the environment is stable" }
    answer: b
    explanation: "Chained tests make one failure look like four and block parallel execution. Each test should create, or receive from a fixture, the data it needs."
  - id: q2
    prompt: "An order total is 30.000. Which refund amounts best test the \"must not exceed total\" boundary on a fresh paid order?"
    options:
      - { id: a, text: "15.000 and 60.000" }
      - { id: b, text: "30.000 and 30.001" }
      - { id: c, text: "1.000 and 2.000" }
      - { id: d, text: "0 and 30.000" }
    answer: b
    explanation: "With three-decimal JOD amounts, the step is 0.001. Using 2-value BVA, 30.000 is the largest valid amount and 30.001 the smallest invalid one."
  - id: q3
    prompt: "A refund request returns 201 with the correct body. What else should the test verify?"
    options:
      - { id: a, text: "Nothing: 201 and the body are enough" }
      - { id: b, text: "That the order's status and refunded total changed as expected when read back" }
      - { id: c, text: "That the response arrived in under 10 ms" }
      - { id: d, text: "That the server's CPU usage stayed low" }
    answer: b
    explanation: "A response can claim success while the state change fails or is partial. Reading the resource back confirms the side effect actually happened."
references:
  - title: "RFC 9110: HTTP Semantics, section 9.2.2 Idempotent Methods"
    url: "https://www.rfc-editor.org/rfc/rfc9110#name-idempotent-methods"
    publisher: "IETF"
  - title: "OpenAPI Specification"
    url: "https://spec.openapis.org/oas/latest.html"
    publisher: "OpenAPI Initiative"
reviewedOn: "2026-10-11"
---

## Start from the specification, not the tool

The most common beginner pattern is to open an API client, send a request that works, save it, and call that "API testing." It finds very little. Most API defects are in validation, state rules, permissions and error handling, and none of those show up on the happy path.

Start where all test design starts: the test basis. For APIs that is usually an OpenAPI document, a story with acceptance criteria, or the team's API guidelines. If none of these exist, writing down what you *believe* the contract is, then confirming it with a developer, is valuable QA work in itself.

## A checklist for one endpoint

Work through these categories for every endpoint. Not every category applies everywhere, but asking each question takes seconds and catches gaps.

**1. Happy paths.** Minimum valid request (required fields only). Fully populated request. A typical realistic request. Check the status, headers, body *and* the persisted state.

**2. Input validation** (EP and BVA from QA Foundations):

- Each required field missing, one at a time.
- Each field with a wrong type (`"2"` vs `2`, `null`, array instead of object).
- Boundaries for lengths, numbers and dates.
- Format rules: email, currency code, decimals, enum values.
- Unknown extra fields: are they ignored or rejected? Either can be correct, but it must be consistent and documented.
- Empty body, malformed JSON, wrong `Content-Type`.

**3. Business rules.** Build a decision table when rules combine, for example customer type × amount × order status.

**4. State.** Which states allow this operation? Try it from each state. After the call, is the new state correct?

**5. Idempotency and duplicates.** Send the same request twice. Send two conflicting requests close together, such as two refunds that each fit the remaining amount alone but not together.

**6. Auth.** No credentials, invalid credentials, an expired token, a valid user without permission, a valid user accessing *someone else's* resource. The next lesson is dedicated to this.

**7. Collections.** For list endpoints: empty results, one result, exactly one page, pagination boundaries (last page, page beyond the end), sorting stability, filters combined.

**8. Errors.** Is the error format consistent across endpoints? Are messages useful without leaking internals such as stack traces, SQL or internal hostnames?

## State transitions in practice

Resources with a lifecycle (orders, payments, tickets, subscriptions) are where APIs break most interestingly. Draw the states first:

```text
pending_payment ──pay──▶ paid ──refund (partial)──▶ partially_refunded
       │                  │                               │
     cancel          refund (full)                  refund (rest)
       ▼                  ▼                               ▼
   cancelled          refunded ◀──────────────────────────┘
```

Then design two kinds of tests:

- **Valid transitions:** each arrow, at least once.
- **Invalid transitions:** each operation from a state that doesn't allow it, such as a refund from `pending_payment`, a payment on `cancelled`, or a cancellation on `refunded`. Expect a clear 409 (or the documented code), and confirm the state didn't change.

Invalid transitions are routinely untested, and they're exactly what a confused client, a retry or an attacker will send.

## Idempotency and race conditions

Two related but distinct risks:

- **Duplicates over time:** the client retries after a timeout. If the API supports an `Idempotency-Key`, the second request must return the original result without repeating the side effect. Also test the same key with a *different* body. A well-designed API rejects that rather than returning the first result.
- **Concurrent conflicting requests:** two requests arrive at almost the same moment. If each one checks "remaining refundable ≥ amount" before either writes, both pass and the customer is refunded more than they paid. To test this, fire both requests in parallel (most test frameworks can run `Promise.all` or similar). Check the final state, not just the two responses.

## Keep each test focused and isolated

A good API test:

- **sets up its own data**, through the API, a fixture or a seed script, so it can run alone and in parallel;
- **has one reason to fail**, such as "refund above remaining amount is rejected," not twelve unrelated assertions;
- **checks the response and the resulting state**;
- **uses unique data** for each run, such as a generated email or idempotency key, to avoid collisions;
- **cleans up**, or runs in an environment that is reset regularly.

Names matter too. `refund_exceeding_remaining_amount_returns_409_and_keeps_order_paid` tells a reader what broke from the test report alone.

Next: the single most damaging class of API defect, broken authorization.
