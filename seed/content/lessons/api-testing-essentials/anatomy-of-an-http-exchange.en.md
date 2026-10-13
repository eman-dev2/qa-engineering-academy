---
title: "Anatomy of an HTTP exchange"
summary: "Every API test is a conversation in HTTP. Learn to read and build requests and responses (methods, URLs, headers, bodies and status codes) and what each part means for your tests."
minutes: 24
level: Junior
skills: [api]
objectives:
  - "Identify every part of an HTTP request and response and explain its purpose."
  - "Choose and justify the correct method for an operation, using safety and idempotency."
  - "Interpret status code classes and the specific codes testers meet most often."
  - "Send and inspect requests from the command line with curl."
prerequisites:
  - "QA Foundations, or equivalent test design experience"
  - "A terminal with curl installed (included on macOS, Linux and Windows 10+)"
keyTerms:
  - term: Resource
    definition: "The thing an API exposes, such as an order or a user, identified by a URL."
  - term: Safe method
    definition: "A method that doesn't change server state, such as GET or HEAD."
  - term: Idempotent method
    definition: "A method where sending the same request many times has the same effect as sending it once, such as PUT or DELETE."
  - term: Header
    definition: "Metadata about the request or response, such as content type, authentication or caching rules."
  - term: Status code
    definition: "A three-digit number in the response that summarises the outcome."
mistakes:
  - mistake: "Asserting only on the status code."
    fix: "A 200 with the wrong body is still a defect. Check the status, the important headers (like Content-Type) and the body content."
  - mistake: "Treating every 4xx as \"the test passed\" in negative testing."
    fix: "Check for the *specific* expected code and error message. A 404 where a 400 is expected may mean your request never reached the logic you meant to test."
  - mistake: "Assuming POST is never safe to retry and PUT always is."
    fix: "Idempotency is a property of the specified behaviour, not just the method name. Test it: send the same request twice and compare the results."
  - mistake: "Ignoring response headers."
    fix: "Headers carry caching, security (CORS, HSTS), rate-limit and pagination information. Each one can have defects of its own."
exercise:
  title: "Explore an HTTP exchange from the command line"
  brief: |
    Use the public testing service httpbin.org, which echoes back what you send.

    1. Run `curl -i https://httpbin.org/get?course=api` and identify the status line, three response headers and where your query parameter appears in the body.
    2. Send a JSON body with POST: `curl -i -X POST https://httpbin.org/post -H "Content-Type: application/json" -d '{"amount": 10.5}'`. Find where the service shows the parsed JSON.
    3. Request `https://httpbin.org/status/404` and `https://httpbin.org/status/503`. Which status class does each belong to, and who is "at fault" in each case?
    4. Write two assertions you would add to an automated test for step 2.
  modelAnswer: |
    1. The **status line** is `HTTP/2 200`. Typical headers are `content-type: application/json`, `content-length` and `access-control-allow-origin`. The query parameter appears under `"args": {"course": "api"}`.
    2. The parsed body appears under `"json": {"amount": 10.5}`. The raw text is under `"data"`.
    3. **404** is a 4xx, a client error: the client asked for something that doesn't exist. **503** is a 5xx, a server error: the server can't handle the request right now, often temporarily. A client may retry later, sometimes guided by a `Retry-After` header.
    4. Good assertions: the status is 200; the `content-type` header contains `application/json`; `body.json.amount` equals `10.5` (a number, not the string "10.5"). The type check matters: many defects are a number silently becoming a string.
quiz:
  - id: q1
    prompt: "Which method is idempotent but not safe?"
    options:
      - { id: a, text: "GET" }
      - { id: b, text: "PUT" }
      - { id: c, text: "POST" }
      - { id: d, text: "HEAD" }
    answer: b
    explanation: "PUT changes state, so it isn't safe. Sending the same PUT twice leaves the resource in the same final state, so it is idempotent. GET and HEAD are both safe and idempotent. POST is neither by default."
  - id: q2
    prompt: "A request with a missing required field returns 500 Internal Server Error. What does this suggest?"
    options:
      - { id: a, text: "Correct behaviour: the request was invalid" }
      - { id: b, text: "A defect: the server failed to validate input and should return a 4xx such as 400 or 422" }
      - { id: c, text: "A network problem" }
      - { id: d, text: "The client must retry" }
    answer: b
    explanation: "Invalid client input should produce a 4xx with a clear message. A 500 means the server hit an unhandled condition, usually a missing validation or an exception. That is a defect, and sometimes a security concern too, if stack traces leak."
  - id: q3
    prompt: "Where does `?status=shipped&page=2` belong in an HTTP request?"
    options:
      - { id: a, text: "In the request body" }
      - { id: b, text: "In a header" }
      - { id: c, text: "In the query string of the URL" }
      - { id: d, text: "In the status line" }
    answer: c
    explanation: "Query parameters are part of the URL after the `?`, typically used for filtering, sorting and pagination of a collection."
  - id: q4
    prompt: "Creating an order returns 200 with the new order in the body. The API guidelines say creation returns 201 with a Location header. What should you do?"
    options:
      - { id: a, text: "Nothing: 200 means success" }
      - { id: b, text: "Report it as a defect against the API's documented contract" }
      - { id: c, text: "Change your test to expect 200" }
      - { id: d, text: "Report it as a server outage" }
    answer: b
    explanation: "Clients may rely on 201 and the Location header. Behaviour that contradicts the documented contract is a defect, even if the order is created. Don't update tests to match the bug."
references:
  - title: "RFC 9110: HTTP Semantics"
    url: "https://www.rfc-editor.org/rfc/rfc9110"
    publisher: "IETF"
  - title: "HTTP response status codes"
    url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status"
    publisher: "MDN Web Docs"
  - title: "httpbin: HTTP request and response service"
    url: "https://httpbin.org/"
    publisher: "httpbin.org"
reviewedOn: "2026-10-11"
---

## Why testers need to read HTTP

Most of a product's business rules don't live in the user interface. They live behind an API: pricing, limits, permissions, state changes. The web app, the mobile app and partner integrations all talk to that API over HTTP. If you can read and write HTTP directly, you can:

- test business rules before any UI exists,
- separate "the server is wrong" from "the screen is wrong" in seconds,
- reach states the UI won't let you reach, such as invalid payloads, other users' IDs or duplicate submissions, which is exactly where defects hide.

## The request

Here is a request to create an order, written the way it travels on the wire:

```http
POST /v1/orders?dryRun=false HTTP/1.1
Host: api.shop.example
Authorization: Bearer eyJhbGciOi...
Content-Type: application/json
Accept: application/json
Idempotency-Key: 6f1d2c1e-8b0a-4c1e-9a55-0d7a2e4b9f10

{
  "customerId": "c_1042",
  "items": [{ "sku": "TEA-250", "quantity": 2 }],
  "currency": "JOD"
}
```

| Part | Example | What to test |
| --- | --- | --- |
| Method | `POST` | Is the right method used? What happens with the wrong one (expect 405)? |
| Path | `/v1/orders` | Resource naming, versioning, trailing slashes, case sensitivity |
| Query string | `?dryRun=false` | Missing, duplicated, unknown and malformed parameters |
| Headers | `Authorization`, `Content-Type` | Missing or invalid auth; wrong content type (expect 415); missing `Accept` |
| Body | JSON payload | Required fields, types, boundaries, extra fields, empty arrays, huge payloads |

## Methods, safety and idempotency

The method tells the server what kind of operation you intend. Two properties from the HTTP specification matter for testing:

- **Safe**: the request doesn't change server state. Clients, crawlers and caches may send safe requests freely.
- **Idempotent**: sending the request *N* times has the same effect as sending it once. Clients and proxies may retry idempotent requests after a timeout.

| Method | Typical use | Safe | Idempotent |
| --- | --- | --- | --- |
| GET | Read a resource or collection | Yes | Yes |
| HEAD | Like GET, headers only | Yes | Yes |
| POST | Create, or trigger an action | No | No* |
| PUT | Replace a resource completely | No | Yes |
| PATCH | Partially update a resource | No | Not guaranteed |
| DELETE | Remove a resource | No | Yes |

\* Many payment and order APIs make POST safe to retry with an **idempotency key** header. The server remembers the key and returns the original result for duplicates. If your API offers this, test it: send the same request twice with the same key, and check that only one order exists and both responses match.

Why this matters: mobile networks drop connections. If a client retries a non-idempotent request after a timeout, the customer may be charged twice. Idempotency defects are among the most expensive in fintech.

## The response

```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /v1/orders/ord_88213
X-Request-Id: req_9b2e71

{
  "id": "ord_88213",
  "status": "pending_payment",
  "total": { "amount": "5.400", "currency": "JOD" },
  "createdAt": "2026-10-11T09:14:03Z"
}
```

A complete check covers all three parts:

1. **Status code:** 201, because something was created.
2. **Headers:** `Content-Type` is JSON; `Location` points at the new resource; a request ID is present for support.
3. **Body:** the shape is right (next lessons), and the *values* are right: the total is 2 × the unit price, the currency is echoed, and the status is the documented initial state.

Note `"amount": "5.400"` as a string. Many money APIs use strings to avoid floating-point errors, and JOD has three decimal places. A test that compares it to the number `5.4` would be wrong in two ways.

## Status codes testers meet every day

The first digit gives the class:

- **2xx Success:** 200 OK, 201 Created, 202 Accepted (processing continues asynchronously), 204 No Content.
- **3xx Redirection:** 301/308 moved permanently, 304 Not Modified (caching).
- **4xx Client error**, where the request is the problem:
  - 400 Bad Request: malformed or invalid input.
  - 401 Unauthorized: not authenticated (missing or invalid credentials).
  - 403 Forbidden: authenticated but not allowed.
  - 404 Not Found.
  - 405 Method Not Allowed.
  - 409 Conflict: state conflict, such as a duplicate or a version mismatch.
  - 415 Unsupported Media Type.
  - 422 Unprocessable Content: well-formed but semantically invalid.
  - 429 Too Many Requests: rate limited, often with `Retry-After`.
- **5xx Server error**, where the server is the problem: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout.

A rule of thumb: **invalid input must never produce a 5xx.** If you can make the server return 500 by sending bad data, that's a defect, and it often comes with a leaked stack trace.

## Your first requests with curl

curl is installed almost everywhere and shows you exactly what goes over the wire.

```bash
# -i includes response headers; -s hides the progress bar
curl -is "https://httpbin.org/get?course=api"

# Send JSON with POST
curl -is -X POST "https://httpbin.org/post" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10.5, "currency": "JOD"}'

# See the full request and response, including TLS details
curl -v "https://httpbin.org/status/418"
```

Graphical clients like Postman or Bruno do the same thing with more convenience. Learn curl anyway: it is what you'll paste into a defect report so a developer can reproduce your exact request in one line.

Next, you'll turn this understanding into a structured set of tests for a single REST endpoint.
