---
title: "What quality means, and who owns it"
summary: "QA, QC, testing and quality engineering are often used as synonyms. They are different activities with different goals, and knowing the difference changes how you work."
minutes: 18
level: Beginner
skills: [fundamentals]
objectives:
  - "Explain the difference between quality assurance, quality control, testing and quality engineering with a concrete example of each."
  - "Describe why testing can show that defects are present but cannot prove their absence."
  - "Apply the seven testing principles to decide where to spend limited testing time."
  - "Distinguish an error, a defect and a failure in a real incident."
prerequisites:
  - "None. This is the first lesson in the path."
keyTerms:
  - term: Quality
    definition: "The degree to which a product satisfies the stated and implied needs of its stakeholders."
  - term: Error (mistake)
    definition: "A human action that produces an incorrect result, such as misreading a requirement."
  - term: Defect (bug, fault)
    definition: "An imperfection in a work product, such as code, a requirement or a design, that can cause a failure."
  - term: Failure
    definition: "An event in which the system does not do what it should when it runs."
  - term: Root cause
    definition: "The underlying reason a defect was introduced. Fixing it prevents similar defects."
mistakes:
  - mistake: "Calling the test team \"QA\" and treating quality as their responsibility alone."
    fix: "Quality is produced by everyone who shapes the product. Testers make quality visible and help the team build it in; they cannot add it at the end."
  - mistake: "Reporting \"all tests passed\" as if it means the product has no defects."
    fix: "Report what was tested, what was not, and the remaining risk. Passing tests reduce uncertainty; they do not remove it."
  - mistake: "Running the same regression suite unchanged for months and treating stable results as proof of quality."
    fix: "Review and refresh tests regularly. Suites that never fail have often stopped looking where the new defects are (the pesticide paradox)."
  - mistake: "Trying to test every combination before release."
    fix: "Exhaustive testing is impossible for any real product. Prioritise by risk: likelihood of failure multiplied by its impact."
exercise:
  title: "Map an incident to error, defect and failure"
  brief: |
    A food-delivery app charged some customers twice during a promotion. The investigation found the following:

    - The product manager wrote "apply the discount once per order."
    - A developer read it as "once per payment attempt" and implemented that.
    - When a card payment timed out and the app retried automatically, the discount logic ran again and a second charge was captured.
    - No test covered a payment retry during a promotion.

    Write down (1) the error, (2) the defect, (3) the failure, (4) the root cause, and (5) one QA activity and one QC activity that could each have stopped this reaching customers.
  modelAnswer: |
    1. **Error:** the developer misinterpreted "once per order" as "once per payment attempt."
    2. **Defect:** the discount and capture logic runs again on every retry instead of being tied to the order.
    3. **Failure:** customers were charged twice in production when a payment timed out and was retried.
    4. **Root cause:** an ambiguous requirement and no shared example of retry behaviour. The misreading is a symptom; the gap in how requirements are agreed is the cause.
    5. **QA (prevent):** a requirements review or "three amigos" session that writes concrete examples, such as "Given a payment times out and is retried, the customer is charged once." **QC (detect):** a test that forces a payment timeout and checks that exactly one capture happens per order.
quiz:
  - id: q1
    prompt: "Your team adds a peer review of every requirement before development starts, to catch ambiguity early. What is this best described as?"
    options:
      - { id: a, text: "Quality control, because it finds defects in a work product" }
      - { id: b, text: "Quality assurance, because it improves the process so fewer defects are introduced" }
      - { id: c, text: "Dynamic testing, because it evaluates the product" }
      - { id: d, text: "Debugging, because it removes defects" }
    answer: b
    explanation: "Adding a review step to the way the team works is a process improvement, which is quality assurance. The review itself is a form of static testing, but the decision to build it into the workflow is QA. Debugging is what developers do to locate and fix a defect after it is found."
  - id: q2
    prompt: "After 400 automated tests pass, a manager asks, \"So the release has no bugs?\" Which answer is most accurate?"
    options:
      - { id: a, text: "Yes. Every test passed, so no defects remain." }
      - { id: b, text: "No. Testing can show defects are present but can't prove they're absent. Here's what we covered and the risks that remain." }
      - { id: c, text: "Yes, as long as coverage is above 80%." }
      - { id: d, text: "No. Automated tests never find real defects." }
    answer: b
    explanation: "This is the first testing principle: testing shows the presence of defects, not their absence. A useful answer turns the question into a conversation about coverage and residual risk."
  - id: q3
    prompt: "A developer mistypes a currency conversion rate, and the system shows wrong prices. Which sequence is correct?"
    options:
      - { id: a, text: "Failure, then defect, then error" }
      - { id: b, text: "Defect, then error, then failure" }
      - { id: c, text: "Error, then defect, then failure" }
      - { id: d, text: "Error, then failure, then defect" }
    answer: c
    explanation: "A human error (the mistyping) introduces a defect (the wrong constant in the code), which causes a failure when the code runs (the wrong prices on screen)."
  - id: q4
    prompt: "Most of last quarter's production defects came from the checkout module. What does the defect-clustering principle suggest for the next release?"
    options:
      - { id: a, text: "Spread testing evenly across all modules to be fair" }
      - { id: b, text: "Focus extra testing on checkout and investigate why defects cluster there" }
      - { id: c, text: "Stop testing checkout, because its defects have already been found" }
      - { id: d, text: "Rewrite the checkout module before testing anything else" }
    answer: b
    explanation: "Defects tend to cluster in a small number of areas. Past defect data is good evidence for risk-based allocation, and finding out why they cluster turns detection into prevention."
references:
  - title: "Certified Tester Foundation Level (CTFL) v4.0: syllabus and overview"
    url: "https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/"
    publisher: "ISTQB"
  - title: "ISTQB Glossary"
    url: "https://glossary.istqb.org/"
    publisher: "ISTQB"
reviewedOn: "2026-10-11"
---

## Why the words matter

On most teams you will hear "QA" used to mean "the people who test." That shorthand causes real problems. If quality belongs to "QA," then a defect that reaches production is QA's fault, developers can hand over untested code, and testers get pulled in at the end with no time to do anything but check. Teams that ship reliably tend to use these words precisely, because each word describes a different lever.

Here is the same product, a mobile banking app, seen through each one.

| Term | Question it answers | Example on the banking app |
| --- | --- | --- |
| Quality assurance (QA) | Is our *process* likely to produce a good product? | Agreeing that every transfer rule needs written acceptance examples before development starts |
| Quality control (QC) | Does this *product* meet its requirements? | Checking a release candidate against the transfer acceptance criteria |
| Testing | What does this product actually do, and where does it fail? | Designing and running tests on transfer limits, including the boundaries |
| Quality engineering (QE) | How do we build quality into the system and the delivery pipeline? | Building contract tests, monitoring and quality gates so a transfer regression can't reach production unnoticed |

QA is preventive and process-focused. QC is detective and product-focused. Testing is the main activity used for QC, but it also supports QA: a tester who reviews a requirement early is testing a work product, not running code. Quality engineering is the newest term. It describes testers who design the *systems* that keep quality high, such as test architecture, pipelines, observability and tooling, rather than only executing tests.

You don't need to pick one identity. A good tester moves between all four in a single week.

## What testing is actually for

Testing has several objectives, and different contexts weight them differently:

- **Find defects** before users do.
- **Build confidence** that the product works for the scenarios that matter most.
- **Provide information** for decisions: can we release, what is the risk, what changed?
- **Prevent defects** by reviewing requirements and designs early.
- **Verify compliance** with contracts, regulations or standards, which is common in fintech and healthcare.

The third objective is the one beginners undervalue. A tester's output is not "bugs found." It is *information that helps someone make a better decision*. A release manager asking "can we ship?" needs to know what was covered, what was not, and what could go wrong. "142 tests passed" doesn't answer that.

## Error, defect, failure

These three terms separate *what someone did* from *what is wrong in the product* from *what users experience*.

1. A developer makes an **error**: they assume all amounts are in the same currency.
2. That error introduces a **defect** into the code: there is no currency conversion before the comparison.
3. When a customer with a USD account sends money to a EUR account, the system shows a **failure**: the transfer limit check passes when it should block.

Not every defect causes a failure. A defect in code that never runs, or that only runs for data nobody has, stays dormant. Failures can also have causes that are not defects, such as a full disk, a network partition or radiation flipping a bit. When you report a problem, describe the failure you observed. Leave the diagnosis of the defect to the investigation unless you are certain of it.

The **root cause** sits behind the error: *why* did the developer assume one currency? Perhaps the requirement never mentioned multi-currency accounts. Fixing root causes is how QA prevents the next ten defects, not just this one.

## The seven testing principles

These principles come from decades of industry experience and appear in the ISTQB Foundation syllabus. Treat them as tools for decisions, not facts to memorise.

**1. Testing shows the presence, not the absence, of defects.** Tests can prove that a failure exists. No number of passing tests proves that none exist. So your test report should describe coverage and risk, not claim correctness.

**2. Exhaustive testing is impossible.** A form with five fields that each accept 100 values has 10 billion combinations. You need test design techniques (the next module) and risk-based prioritisation to choose the tests that matter.

**3. Early testing saves time and money.** A defect found in a requirement review costs a conversation. The same defect found in production may cost a hotfix, customer support, refunds and reputation. This is the idea behind "shift left."

**4. Defects cluster together.** A small number of modules usually contains most of the defects. They tend to be complex, frequently changed or poorly understood areas. Use defect history to aim your effort.

**5. Tests wear out (the pesticide paradox).** If you repeat the same tests, they eventually stop finding new defects, just as insects become resistant to the same pesticide. Review suites, add tests for new risks, and vary your exploratory sessions.

**6. Testing is context dependent.** Testing a payments API, a children's game and a hospital infusion pump require different approaches, depths and documentation. Copying another team's process without its context is a common source of waste.

**7. Absence-of-defects fallacy.** A system can pass every test and still fail its users if it solves the wrong problem. Validation (are we building the right thing?) matters as much as verification (are we building it right?).

## Putting it together on a real team

Imagine you join a team that ships a ride-hailing app every two weeks. Here is how the ideas above shape your first month:

- You ask which areas generated the most incidents last quarter (**defect clustering**) and start there.
- You join backlog refinement and ask "what happens if…" questions about new stories (**early testing**, a **QA** activity).
- You design tests for fare calculation using partitions and boundaries rather than random values (**exhaustive testing is impossible**).
- Your release notes say "fare calculation tested for these six scenarios; surge pricing combined with promo codes not yet tested: medium risk" rather than "all green" (**presence, not absence**).

That is what "thinking like a tester" means in practice. The next lesson places these activities on the delivery timeline.
