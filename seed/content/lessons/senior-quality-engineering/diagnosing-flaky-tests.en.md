---
title: "Diagnosing flaky tests"
summary: "A flaky test is a symptom, not a verdict. Learn to measure flakiness, reproduce it on demand, classify its root cause and fix the cause, including the cases where the product, not the test, is at fault."
minutes: 28
level: Senior
skills: [advanced-qe, ui-automation, cicd]
reviewedOn: "2026-10-12"
objectives:
  - "Measure flakiness per test and decide when a test must be quarantined."
  - "Reproduce an intermittent failure deliberately using repetition, load and controlled timing."
  - "Classify a flaky failure into one of the common root-cause families."
  - "Distinguish a flaky test from an intermittent product defect, and report each correctly."
prerequisites:
  - "Experience maintaining an automated test suite that runs in CI"
  - "Locators and auto-waiting in Playwright (or equivalent knowledge of your framework's waiting model)"
keyTerms:
  - term: Flaky test
    definition: "A test that both passes and fails against the same code and environment."
  - term: Flake rate
    definition: "The share of a test's runs, on unchanged code, that fail. Usually tracked over a rolling window."
  - term: Quarantine
    definition: "Moving a known-flaky test out of the blocking pipeline into a tracked, non-blocking run until it is fixed."
  - term: Test pollution
    definition: "One test leaving behind state (data, cookies, files, global settings) that changes the outcome of another."
mistakes:
  - mistake: "Turning on retries and calling the problem solved."
    fix: "Retries hide the signal. Keep them only if flaky results are reported and tracked, so every retry-pass creates work to fix the cause."
  - mistake: "Assuming every intermittent failure is a test problem."
    fix: "Some are race conditions in the product that real users hit. Check whether the failure could happen to a customer before you change the test."
  - mistake: "Debugging from the CI log alone."
    fix: "Capture traces, screenshots, videos and server logs on failure, and reproduce locally with repetition before changing code."
  - mistake: "Deleting or skipping a flaky test without a record."
    fix: "Quarantine with an owner and a deadline. A silently deleted test is lost coverage nobody decided to give up."
exercise:
  title: "Triage a flaky test report"
  brief: |
    Your nightly report shows these results for the last 50 runs on unchanged code:

    | Test | Runs | Failed | Typical error |
    | --- | --- | --- | --- |
    | `orders › list shows newest first` | 50 | 9 | Expected "ORD-311" at row 1, found "ORD-310" |
    | `profile › change avatar` | 50 | 2 | Timeout waiting for upload response |
    | `refunds › partial refund updates balance` | 50 | 4 | Balance shows 20.000, expected 15.000 |
    | `search › results paginate` | 50 | 1 | net::ERR_CONNECTION_RESET |

    Tests run in parallel on four workers against a shared staging database.

    1. Rank the tests by urgency and explain your order.
    2. For each test, state the most likely root-cause family and the first diagnostic step you'd take.
    3. Which one might be a product defect rather than a test defect, and how would you find out?
  modelAnswer: |
    **Ranking:** refunds first, then orders, then avatar, then search.

    1. **Refunds (8% flake, money).** Likely family: **concurrency or test pollution.** With four workers on a shared database, another test may refund the same order or reuse its data. First step: check whether the test creates its own order; run it with `--repeat-each=50` alone, then alongside the other refund tests. **This could be a product defect:** if two refund requests at once can both apply, customers could be refunded twice. Reproduce by sending two partial refunds in parallel at the API level. If the balance is wrong, report it as a product defect, with high severity.
    2. **Orders (18% flake).** Family: **non-deterministic data ordering.** Several orders are probably created within the same timestamp, so "newest first" is ambiguous, or parallel tests insert orders into the same list. First step: check the sort key and whether the test filters the list to its own data. Fix by giving the test its own customer, or by asserting on a filtered list.
    3. **Avatar upload (4%).** Family: **environment and timing.** Large file uploads to a slow shared environment. First step: look at the trace for the request duration. Fix with a smaller fixture file, or by waiting for the specific upload response rather than a fixed timeout.
    4. **Search (2%, network reset).** Family: **infrastructure.** First step: correlate with environment logs for that time. Likely not the test; track it, but don't spend a day on one failure.
quiz:
  - id: q1
    prompt: "With retries enabled, a Playwright test fails on the first attempt and passes on the retry. How does Playwright report it?"
    options:
      - { id: a, text: "Passed, with no indication of the failure" }
      - { id: b, text: "Flaky" }
      - { id: c, text: "Failed" }
      - { id: d, text: "Skipped" }
    answer: b
    explanation: "Playwright marks a test that fails and then passes on retry as flaky. Treat that label as a work item, and consider failing the build on flaky results in CI."
  - id: q2
    prompt: "A test passes when run alone but fails about a third of the time when the full suite runs in parallel. What is the most likely family of causes?"
    options:
      - { id: a, text: "A wrong locator" }
      - { id: b, text: "Shared state or data between tests (test pollution or collisions)" }
      - { id: c, text: "A syntax error" }
      - { id: d, text: "The test is too short" }
    answer: b
    explanation: "Order or parallelism sensitivity points to shared state: the same records, accounts or global settings used by more than one test. Give each test its own data."
  - id: q3
    prompt: "What is the best first step after a test fails intermittently in CI?"
    options:
      - { id: a, text: "Add a 3-second wait before the failing step" }
      - { id: b, text: "Delete the test" }
      - { id: c, text: "Collect the trace and logs from the failure, then reproduce it locally by repeating the test many times" }
      - { id: d, text: "Increase every timeout to 60 seconds" }
    answer: c
    explanation: "You can't fix what you can't see or reproduce. Evidence from the failed run plus deliberate repetition (for example --repeat-each) turns a mystery into a reproducible defect."
  - id: q4
    prompt: "Which flaky failure most deserves to be reported as a product defect?"
    options:
      - { id: a, text: "A test that fails when the CI runner runs out of disk space" }
      - { id: b, text: "A test that fails because two tests use the same user account" }
      - { id: c, text: "A test that shows two simultaneous transfers can overdraw an account" }
      - { id: d, text: "A test that fails because of a fixed 500 ms wait" }
    answer: c
    explanation: "A race condition that lets an account be overdrawn is a real product risk that customers could hit. The others are infrastructure or test-design problems."
references:
  - title: "Test retries"
    url: "https://playwright.dev/docs/test-retries"
    publisher: "Playwright"
  - title: "Trace viewer"
    url: "https://playwright.dev/docs/trace-viewer"
    publisher: "Playwright"
  - title: "Command line: --repeat-each and --fail-on-flaky-tests"
    url: "https://playwright.dev/docs/test-cli"
    publisher: "Playwright"
---

## What flakiness costs

A flaky test passes and fails against the same code. One flaky test is an annoyance. Twenty of them change how a team behaves: people re-run pipelines until they turn green, stop reading failures, and eventually merge on red. At that point the suite has stopped providing information, which was its only job.

Senior quality engineers treat flakiness as a defect with a root cause, not as background noise. This lesson gives you a repeatable loop: **measure, reproduce, classify, fix, verify.**

## Measure before you argue

Opinions about which tests are flaky are unreliable; data isn't. Track, for every test:

- **runs** and **failures on unchanged code** over a rolling window (for example the last 50 runs on the main branch),
- the **flake rate** (failures ÷ runs),
- the **first-seen date** and the **error signature** (the assertion or timeout that failed).

Most CI systems and test reporters can export results; even a simple table built from JUnit XML is enough to start. Playwright already labels a test **flaky** when it fails and then passes on a retry. You can make CI fail on that label with `--fail-on-flaky-tests`, which keeps flakiness visible instead of absorbed.

Agree a **quarantine policy** with the team. For example: any test above a 2% flake rate on main moves to a non-blocking job, gets an owner and a ticket, and must be fixed or deliberately deleted within two sprints. Quarantine protects the pipeline; the deadline protects coverage.

## Reproduce on demand

An intermittent failure becomes easy once you can make it happen whenever you want. Increase the odds:

```bash
# Run one test 100 times, in parallel, and stop at the first failure.
npx playwright test tests/refunds.spec.ts -g "partial refund" \
  --repeat-each=100 --workers=4 --max-failures=1
```

Other levers that shake out timing problems:

- **Run with the same parallelism as CI.** Many failures appear only when tests share a database or an account.
- **Slow things down or speed them up.** Throttle the network or CPU in the browser, or run on a smaller machine.
- **Change the order.** Run the suspect test after the suite that usually precedes it in CI.

Capture evidence from the failing run itself. In Playwright, `trace: 'on-first-retry'` records a full trace (DOM snapshots, network, console, actions) when a test retries, which is exactly the run you need. Collect server logs for the same time window and use a request or correlation ID to connect them.

## Classify the root cause

Almost every flaky test belongs to one of these families. Naming the family tells you where to look.

| Family | Typical signature | Usual fix |
| --- | --- | --- |
| **Timing and waiting** | Element not found, value not updated yet, works with a sleep | Web-first assertions; wait for the specific response or event |
| **Test pollution and shared data** | Passes alone, fails in the suite or in parallel | Each test creates its own data; reset global state; avoid shared accounts |
| **Non-deterministic data** | Ordering, timestamps, random values, time zones, end of month | Control the clock and seeds; sort by unique keys; assert on filtered data |
| **Environment and infrastructure** | Connection resets, slow shared services, resource limits | Retry at the infrastructure layer, isolate environments, track rather than chase single events |
| **Product concurrency** | Wrong balances, duplicates, lost updates under parallel load | A real defect: report it, then keep the test as a regression check |
| **Test design** | Brittle locators, assertions on incidental details | Assert on intent; use resilient locators |

## When the product is the flaky one

The most valuable flaky tests are the ones that are telling the truth. If two refund requests running at the same moment sometimes produce a wrong balance, the test isn't flaky. It has found a race condition that customers will hit at scale.

Before you "fix" a test, ask: **could this failure happen to a real user?** If yes:

1. Reproduce it below the UI, for example by firing two API requests in parallel.
2. Report it as a product defect with the evidence, the reproduction rate and the business impact.
3. Keep the test, tagged to the defect, so the fix can be verified and stays verified.

Stabilising the test by removing the parallelism that exposed the bug would remove your only evidence.

## Fix the cause, then verify

Good fixes remove the source of non-determinism rather than widening tolerances:

- Replace a fixed wait with an assertion on the state you actually need.
- Give each test unique data (a generated customer, a unique order reference) so parallel tests can't collide.
- Freeze time in tests that depend on dates; use fixed random seeds.
- Wait for a specific network response when the UI gives no visible signal.

Then **prove** the fix: run the test with high repetition (the same `--repeat-each` command) and compare the failure rate with your baseline. "It passed once on my machine" isn't verification. Record the before-and-after flake rate in the ticket, so the team can see the suite getting healthier over time.

Next in this path: designing a test strategy for microservices, so fewer of these problems reach the end-to-end layer at all.
