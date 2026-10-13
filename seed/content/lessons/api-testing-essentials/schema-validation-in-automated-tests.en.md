---
title: "Schema validation in automated API tests"
summary: "Write an automated API test in Playwright and TypeScript that checks status, headers, business values and the full response shape against a JSON Schema."
minutes: 28
level: Mid-level
skills: [api, programming, ui-automation]
objectives:
  - "Write a JSON Schema that captures a response contract, including required fields, types, formats and enums."
  - "Use Playwright's request fixture to send API requests and assert on responses."
  - "Validate a response against a schema with Ajv and report readable errors."
  - "Decide which assertions belong in a schema and which belong in explicit business checks."
prerequisites:
  - "Designing tests for a REST endpoint"
  - "Basic JavaScript or TypeScript: variables, functions, objects, async/await"
keyTerms:
  - term: JSON Schema
    definition: "A vocabulary for describing the structure of JSON documents, used to validate them."
  - term: Contract drift
    definition: "When an API's real responses gradually diverge from what clients and documentation expect."
  - term: additionalProperties
    definition: "A JSON Schema keyword controlling whether properties not listed in the schema are allowed."
  - term: Fixture
    definition: "In Playwright, a reusable piece of test setup injected into tests, such as `request` for API calls."
mistakes:
  - mistake: "Generating a schema from one sample response and treating it as the contract."
    fix: "Generated schemas encode accidents of that one sample (a nullable field that happened to have a value). Review every field against the specification."
  - mistake: "Using schema validation instead of business assertions."
    fix: "A schema proves \"total is a string matching a decimal pattern\". It cannot prove \"total equals price × quantity\". Use both."
  - mistake: "Setting `additionalProperties: false` everywhere without discussing it."
    fix: "It catches accidental data leaks, but makes harmless additive changes break tests. Agree a policy with the API team (often strict for sensitive objects, open elsewhere)."
  - mistake: "Printing only \"schema validation failed\"."
    fix: "Include Ajv's error path and message in the assertion, so the report says which field broke and how."
exercise:
  title: "Add a schema-checked test for a list endpoint"
  brief: |
    Extend the example in this lesson to cover `GET /v1/orders?status=paid&limit=2`, which returns:

    ```json
    {
      "data": [ /* order objects */ ],
      "page": { "limit": 2, "nextCursor": "string or null" }
    }
    ```

    1. Write a schema for the list response that reuses the order schema for each element.
    2. Write a test that checks the status, schema validity, that every returned order has status `paid`, and that no more than `limit` items are returned.
    3. Name one extra test this endpoint needs that a schema could never express.
  modelAnswer: |
    ```ts
    const orderListSchema = {
      type: "object",
      required: ["data", "page"],
      properties: {
        data: { type: "array", items: orderSchema },
        page: {
          type: "object",
          required: ["limit", "nextCursor"],
          properties: {
            limit: { type: "integer", minimum: 1 },
            nextCursor: { type: ["string", "null"] },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    } as const;

    test("lists paid orders, respecting limit", async ({ request }) => {
      const res = await request.get("/v1/orders", {
        params: { status: "paid", limit: 2 },
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expectValid(orderListSchema, body);
      expect(body.data.length).toBeLessThanOrEqual(2);
      for (const order of body.data) expect(order.status).toBe("paid");
    });
    ```

    An extra test a schema can't express: **pagination correctness**. Follow `nextCursor` until it is `null` and check there are no duplicates or gaps compared with the full filtered set. Another option: an order that changes status while you page through doesn't appear twice.
quiz:
  - id: q1
    prompt: "Which defect can a JSON Schema check catch on its own?"
    options:
      - { id: a, text: "The order total is calculated with the wrong tax rate" }
      - { id: b, text: "The `status` field returns \"Paid\" when the allowed values are lowercase" }
      - { id: c, text: "A customer can see another customer's order" }
      - { id: d, text: "The endpoint takes 4 seconds to respond" }
    answer: b
    explanation: "An `enum` in the schema restricts `status` to the documented values, so \"Paid\" fails. Calculations, authorization and performance need separate assertions."
  - id: q2
    prompt: "Why might a team set `additionalProperties: false` on a customer object schema?"
    options:
      - { id: a, text: "To make the tests run faster" }
      - { id: b, text: "To detect fields that appear unexpectedly, such as an internal `passwordHash` leaking into responses" }
      - { id: c, text: "Because JSON Schema requires it" }
      - { id: d, text: "To allow clients to send any fields" }
    answer: b
    explanation: "Strict schemas fail when unexpected properties appear. On sensitive objects, that turns an accidental data leak into a failing test."
  - id: q3
    prompt: "In Playwright, what does the `request` fixture provide?"
    options:
      - { id: a, text: "A browser page for UI tests" }
      - { id: b, text: "An API request context for sending HTTP requests without a browser" }
      - { id: c, text: "A mock server" }
      - { id: d, text: "A database connection" }
    answer: b
    explanation: "`request` is an APIRequestContext. It sends HTTP requests directly, shares `baseURL` and headers from the config, and can reuse authentication state."
references:
  - title: "Playwright: API testing"
    url: "https://playwright.dev/docs/api-testing"
    publisher: "Playwright"
  - title: "Understanding JSON Schema"
    url: "https://json-schema.org/understanding-json-schema"
    publisher: "JSON Schema"
  - title: "Ajv JSON schema validator: getting started"
    url: "https://ajv.js.org/guide/getting-started.html"
    publisher: "Ajv"
reviewedOn: "2026-10-11"
---

## Why check the whole shape?

Most API test suites check a handful of fields: the status code, maybe `id` and `status`. Meanwhile the response has thirty fields, and the mobile app relies on all of them. When a backend change renames `deliveryEta` to `eta`, makes `discount` nullable, or starts returning amounts as numbers instead of strings, those tests stay green while the app crashes.

This gradual divergence is called **contract drift**. Schema validation catches it by checking every response against a machine-readable description of the contract.

## JSON Schema in five minutes

A JSON Schema is itself JSON. It describes what valid data looks like:

```json
{
  "type": "object",
  "required": ["id", "status", "total", "createdAt"],
  "properties": {
    "id": { "type": "string", "pattern": "^ord_[A-Za-z0-9]+$" },
    "status": {
      "enum": ["pending_payment", "paid", "partially_refunded", "refunded", "cancelled"]
    },
    "total": {
      "type": "object",
      "required": ["amount", "currency"],
      "properties": {
        "amount": { "type": "string", "pattern": "^\\d+\\.\\d{3}$" },
        "currency": { "const": "JOD" }
      },
      "additionalProperties": false
    },
    "createdAt": { "type": "string", "format": "date-time" },
    "note": { "type": ["string", "null"], "maxLength": 500 }
  },
  "additionalProperties": false
}
```

The keywords that do most of the work:

| Keyword | Catches |
| --- | --- |
| `required` | Missing fields |
| `type` (including `"null"`) | Wrong types; unexpected nulls |
| `enum` / `const` | Values outside the documented set |
| `pattern`, `format` | Malformed IDs, amounts, dates, emails |
| `minimum`, `maxLength`, … | Out-of-range values |
| `additionalProperties: false` | Unexpected fields, including accidental data leaks |

If the API team publishes an OpenAPI document, its `components.schemas` section already contains these schemas. Reuse them rather than retyping them, so the tests check the published contract itself.

## The test, step by step

The example uses Playwright with TypeScript, which handles both UI and API tests in one runner, and **Ajv**, a widely used JSON Schema validator.

```bash
npm init playwright@latest
npm install --save-dev ajv ajv-formats
```

Configure the API base URL once:

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  use: {
    baseURL: process.env.API_BASE_URL ?? "https://api.staging.shop.example",
    extraHTTPHeaders: {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.API_TOKEN}`,
    },
  },
});
```

A small helper turns Ajv errors into readable assertion messages:

```ts
// tests/support/schema.ts
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { expect } from "@playwright/test";

// allowUnionTypes lets schemas use ["string", "null"] style types
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });
addFormats(ajv);

export function expectValid(schema: object, data: unknown) {
  const validate = ajv.compile(schema);
  const ok = validate(data);
  const details = (validate.errors ?? [])
    .map((e) => `${e.instancePath || "(root)"} ${e.message}`)
    .join("\n");
  expect(ok, `Response does not match schema:\n${details}`).toBe(true);
}
```

And the test itself:

```ts
// tests/orders.api.spec.ts
import { test, expect } from "@playwright/test";
import { expectValid } from "./support/schema";
import { orderSchema } from "./schemas/order";

test("creating an order returns a contract-valid, correctly priced order", async ({ request }) => {
  const res = await request.post("/v1/orders", {
    headers: { "Idempotency-Key": crypto.randomUUID() },
    data: {
      customerId: "c_test_1042",
      items: [{ sku: "TEA-250", quantity: 2 }], // unit price 2.700 JOD in test data
      currency: "JOD",
    },
  });

  // 1. Protocol-level expectations
  expect(res.status()).toBe(201);
  expect(res.headers()["content-type"]).toContain("application/json");
  expect(res.headers()["location"]).toMatch(/^\/v1\/orders\/ord_/);

  // 2. Contract: the full shape
  const order = await res.json();
  expectValid(orderSchema, order);

  // 3. Business rules the schema cannot express
  expect(order.status).toBe("pending_payment");
  expect(order.total).toEqual({ amount: "5.400", currency: "JOD" });

  // 4. Persisted state matches what we were told
  const readBack = await request.get(`/v1/orders/${order.id}`);
  expect(readBack.status()).toBe(200);
  expect(await readBack.json()).toMatchObject({ id: order.id, status: "pending_payment" });
});
```

Notice the four layers. Each one catches a different class of defect, and the failure message tells you which layer broke.

## What schemas can't do

A schema answers "is this shaped correctly?" It can't answer:

- **Is it correct?** `"amount": "5.400"` passes the schema even if the right total is 8.100.
- **Is it allowed?** A perfectly shaped response containing someone else's order is still a critical defect (see the previous lesson).
- **Is it consistent?** Pagination, sorting, totals across a list, and state after a write all need explicit assertions.

So schema validation is a *safety net under* your business assertions, not a replacement for them.

## Keeping schemas alive

- **Store schemas next to the tests**, or better, generate them from the API's OpenAPI document in the pipeline.
- **Agree the strictness policy.** Strict on sensitive objects (users, payments). On objects where additive fields are expected, use `additionalProperties: true` with a reviewed `required` list.
- **When a schema test fails, ask whether the contract changed on purpose.** If it did, update the schema *and* notify consumers. If it didn't, you've caught a breaking change before your users did.

For APIs consumed by several independent teams, the next step is **consumer-driven contract testing** (for example, with Pact), where each consumer publishes the parts of the contract it relies on. It is planned for the Senior Quality Engineering path.
