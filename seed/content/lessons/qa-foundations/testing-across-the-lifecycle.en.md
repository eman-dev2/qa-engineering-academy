---
title: "Testing across the delivery lifecycle"
summary: "Where testing happens from idea to production: SDLC models, the test process, test levels, test types, and what shift-left and shift-right mean in practice."
minutes: 22
level: Beginner
skills: [fundamentals, test-management]
objectives:
  - "Describe the test process activities (planning, analysis, design, implementation, execution, completion) and the work product each produces."
  - "Choose an appropriate test level (component, integration, system, acceptance) for a given risk."
  - "Distinguish functional, non-functional, white-box, confirmation and regression testing."
  - "Explain how testing changes between sequential and iterative delivery models."
prerequisites:
  - "What quality means, and who owns it"
keyTerms:
  - term: SDLC
    definition: "Software development lifecycle: the stages a product moves through from idea to retirement."
  - term: Test level
    definition: "A group of test activities organised around a scope, such as a single component or the whole system."
  - term: Test type
    definition: "A group of test activities aimed at a specific quality characteristic, such as functionality or performance."
  - term: Confirmation testing
    definition: "Re-running the test that found a defect, to check the fix works. Also called re-testing."
  - term: Regression testing
    definition: "Testing that a change has not broken behaviour that previously worked."
  - term: Test basis
    definition: "Everything you derive tests from: requirements, user stories, designs, API specs, even an existing system's behaviour."
mistakes:
  - mistake: "Treating \"system testing\" as the only real testing and skipping lower levels."
    fix: "Most logic defects are cheapest to catch at component or integration level. Push each test to the lowest level that can detect the risk."
  - mistake: "Calling re-testing a bug fix \"regression testing.\""
    fix: "Re-running the failing test is confirmation testing. Regression testing checks the areas around the change that should not have changed."
  - mistake: "Assuming Agile means no test planning or documentation."
    fix: "Agile teams still plan, analyse and report. They do it continuously and in lighter-weight artefacts, such as acceptance criteria, a test charter or a definition of done."
  - mistake: "Thinking shift-left means testers stop testing near release."
    fix: "Shift-left adds earlier activities. Shift-right adds production monitoring and safe experiments. Neither removes the need to check a release candidate."
exercise:
  title: "Assign tests to the right level"
  brief: |
    Your team is building a "split the bill" feature for a restaurant app. It has:

    - a `splitAmount(total, people)` function that rounds to the cent,
    - a call to the payments service to create one payment request per person,
    - a screen where diners pick who pays what,
    - a requirement from the restaurant chain: "Each diner must receive their own receipt by email within one minute."

    For each risk below, choose a test level and a test type, and give a one-line reason.

    1. 100.00 split three ways loses or gains a cent.
    2. The payments service rejects the request because a field was renamed.
    3. A diner can't complete the flow on a small Android screen.
    4. Receipts take five minutes to arrive at lunchtime peak.
    5. The restaurant chain's finance team can't reconcile split payments with their daily report.
  modelAnswer: |
    1. **Component level, functional (white-box friendly).** Pure calculation, so a unit test with 100.00/3, 0.01/2 and 0/1 is fast and precise. Decide and document which diner absorbs the remainder.
    2. **Integration level, functional (contract).** The defect is in the agreement between two components. A contract or API test catches it before any UI exists.
    3. **System level, non-functional (usability/compatibility).** Needs the assembled app on representative devices.
    4. **System level, non-functional (performance).** Needs realistic load on an integrated environment with real email infrastructure or a faithful stub.
    5. **Acceptance level, functional (business process).** Only the customer's finance team can confirm the output fits their reconciliation process. This is user acceptance testing with real stakeholders.
quiz:
  - id: q1
    prompt: "A developer fixes a defect in the login form. Which pair of activities should follow?"
    options:
      - { id: a, text: "Confirmation testing of the original failure, plus regression testing of related areas" }
      - { id: b, text: "Only regression testing, because the developer already checked the fix" }
      - { id: c, text: "Only acceptance testing" }
      - { id: d, text: "Static testing of the login requirement" }
    answer: a
    explanation: "First confirm the fix resolves the reported failure (confirmation testing). Then check that the change didn't break anything nearby, such as password reset or session handling (regression testing)."
  - id: q2
    prompt: "Which test level is the cheapest place to detect a wrong rounding rule in a tax calculation function?"
    options:
      - { id: a, text: "Acceptance testing" }
      - { id: b, text: "System testing" }
      - { id: c, text: "Component (unit) testing" }
      - { id: d, text: "Production monitoring" }
    answer: c
    explanation: "The rule lives in one function. A component test exercises it directly, runs in milliseconds and points straight at the defect. Higher levels can detect it too, but more slowly and with harder diagnosis."
  - id: q3
    prompt: "Which statement about testing in iterative and Agile delivery is most accurate?"
    options:
      - { id: a, text: "Testing happens in a separate phase after all development is complete." }
      - { id: b, text: "Test activities happen in every iteration, and regression testing becomes more important as the product grows." }
      - { id: c, text: "Testers are no longer needed because developers write unit tests." }
      - { id: d, text: "There is no test planning in Agile." }
    answer: b
    explanation: "In iterative models every increment is tested, and each one changes existing code. The regression risk grows with each iteration, which is why automation and good regression selection matter so much there."
  - id: q4
    prompt: "Checking that a search results page loads in under two seconds for 500 concurrent users is an example of which test type?"
    options:
      - { id: a, text: "Functional testing" }
      - { id: b, text: "Non-functional (performance) testing" }
      - { id: c, text: "Confirmation testing" }
      - { id: d, text: "White-box testing" }
    answer: b
    explanation: "The test evaluates *how well* the system performs (time behaviour under load), not *what* it does. That makes it non-functional, specifically performance efficiency."
references:
  - title: "Certified Tester Foundation Level (CTFL) v4.0: chapter 2, Testing Throughout the SDLC"
    url: "https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/"
    publisher: "ISTQB"
  - title: "ISTQB Glossary: test level, test type, regression testing"
    url: "https://glossary.istqb.org/"
    publisher: "ISTQB"
reviewedOn: "2026-10-11"
---

## The lifecycle is the context

Every team follows some software development lifecycle (SDLC), whether or not it has a name for it. The lifecycle decides *when* you get information and *when* your findings can still change the product cheaply. So before you design a single test, find out how your team actually delivers.

Two broad families matter for testers:

- **Sequential models** (waterfall, V-model) complete each phase before the next starts. Requirements are fixed early, testing is heavily planned, and the main test execution happens after development. The V-model pairs every development phase with a test level. For example, the system test is designed from the system requirements while those requirements are being written.
- **Iterative and incremental models** (Scrum, Kanban, continuous delivery) deliver small working slices often. Requirements evolve, every slice is tested, and the product grows, so the regression risk grows with it.

Most real teams are hybrids. A bank might run two-week sprints but still have a formal acceptance phase before a regulator-facing release. Your test approach has to fit the real process, not the textbook one.

## The test process

Whatever the lifecycle, testing involves the same groups of activities. In a sequential project they may be weeks long and heavily documented. In a sprint they may take an afternoon and live in a ticket. They are not strictly ordered: you will loop back as you learn.

| Activity | The question it answers | Typical output |
| --- | --- | --- |
| Test planning | What are we testing, why, how, and when are we done? | Test plan, or a test section in the sprint plan |
| Test monitoring and control | Are we on track, and what do we change if not? | Progress reports, re-prioritised scope |
| Test analysis | *What* should be tested? | Test conditions, plus a list of defects found in the test basis |
| Test design | *How* will we test it? | Test cases, test data needs, coverage items |
| Test implementation | Is everything ready to run? | Test procedures, automated scripts, environments, data |
| Test execution | What actually happens? | Results, logs, defect reports |
| Test completion | What did we learn, and what do we keep? | Completion report, lessons learned, archived testware |

Notice that **test analysis finds defects before any code runs**. When you write test conditions from a story and discover that the story never says what happens to an expired voucher, you have found a defect in the test basis. Raising it in refinement is one of the most valuable things a tester does.

## Test levels: choosing the scope

A test level is about *scope*: how much of the system a test exercises.

**Component (unit) testing** checks individual functions, classes or modules in isolation, usually written by developers and run on every commit. It is fast and precise, but it can't find problems in how components work together.

**Component integration testing** checks the interfaces between components inside one system: does the controller pass the right object to the service?

**System integration testing** checks the interfaces with *other* systems: payment gateways, identity providers, partner APIs. Many expensive production incidents start here.

**System testing** checks the whole assembled product against its requirements, end to end, functional and non-functional, usually in a production-like environment.

**Acceptance testing** checks whether the product is fit for its users and business. It includes user acceptance testing (UAT), operational acceptance (can ops run it, back it up and monitor it?), contractual and regulatory acceptance, and alpha/beta testing.

A practical rule: **push each test to the lowest level that can detect the risk.** If a rounding rule can be checked in a unit test, an end-to-end UI test for it is slower, flakier and harder to diagnose. Keep higher-level tests for risks that only appear when things are assembled.

## Test types: choosing the quality characteristic

A test type is about *what aspect of quality* you are evaluating. Any type can be applied at any level.

- **Functional testing:** what the system does. Does a refund return the correct amount to the original card?
- **Non-functional testing:** how well it does it: performance, security, usability, compatibility, reliability, accessibility and so on. The ISO/IEC 25010 model is a useful checklist for these characteristics.
- **Black-box testing:** tests derived from the specification without looking at the code.
- **White-box testing:** tests derived from the internal structure, such as making sure each branch of a decision is exercised.

Two types are defined by *why* you are testing after a change:

- **Confirmation testing** re-runs the test that failed, to check the fix.
- **Regression testing** checks that the change didn't break anything that used to work. Because every release changes something, regression suites are the main candidates for automation.

## Shift-left and shift-right

**Shift-left** means moving test activities earlier: reviewing requirements, writing acceptance examples before coding, developer-written tests, static analysis in the pipeline. It makes defects cheaper because they are found closer to where they were introduced.

**Shift-right** means learning from production safely: monitoring, alerting on error rates, feature flags, canary releases, A/B experiments. Some risks, like real user behaviour and real traffic patterns, only appear in production.

These are additions, not replacements. A mature team does both and still checks release candidates against the risks that matter.

## What this looks like in a two-week sprint

- **Refinement:** you analyse upcoming stories, ask boundary and error questions, and help write acceptance criteria (analysis and early testing).
- **Planning:** the team agrees which risks each story carries and which levels will cover them (planning).
- **During the sprint:** developers write component tests; you design and run system-level tests and exploratory sessions, and automate stable regression checks (design, implementation, execution).
- **Review and retro:** you share what was covered, what remains risky, and what the team could change (monitoring, completion, QA).

Next, you'll learn systematic techniques for the "design" step, starting with equivalence partitioning and boundary values.
