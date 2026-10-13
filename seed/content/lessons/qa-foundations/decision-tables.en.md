---
title: "Decision tables for business rules"
summary: "When an outcome depends on a combination of conditions, decision tables make every combination visible, expose gaps in the requirement, and give you one test per rule."
minutes: 20
level: Junior
skills: [manual]
objectives:
  - "Build a full decision table from a business rule with several conditions."
  - "Collapse a full table using \"don't care\" entries without losing coverage of distinct outcomes."
  - "Use a decision table to find missing or contradictory requirements before testing starts."
  - "Derive one test case per column and state the resulting coverage."
prerequisites:
  - "Equivalence partitioning and boundary value analysis"
keyTerms:
  - term: Condition
    definition: "An input or state that influences the outcome, usually true/false."
  - term: Action
    definition: "An outcome the system produces when a combination of conditions holds."
  - term: Rule (column)
    definition: "One combination of condition values and the actions that should result."
  - term: Don't care (–)
    definition: "A condition whose value does not affect the outcome for a given rule."
mistakes:
  - mistake: "Writing only the combinations mentioned in the requirement."
    fix: "Start from the full table (2ⁿ columns for n Boolean conditions). The combinations nobody mentioned are where the questions are."
  - mistake: "Collapsing columns because the outcome \"is probably the same.\""
    fix: "Only merge columns when the requirement, or the product owner, confirms the condition truly doesn't matter. Record who confirmed it."
  - mistake: "Leaving impossible combinations in the table and trying to test them."
    fix: "Mark infeasible columns (for example \"guest user\" and \"has saved card\") explicitly and remove them, with a note on why."
exercise:
  title: "Model a delivery fee rule"
  brief: |
    A grocery app says:

    > "Delivery is free for Plus members. Non-members pay 1.50 JOD delivery, but delivery is free if the basket is 30 JOD or more. Express delivery always costs an extra 2.00 JOD, except for Plus members on orders of 30 JOD or more."

    1. Identify the conditions and the actions.
    2. Build the full decision table.
    3. Collapse it where the rule allows, and note any question you'd raise with the product owner.
    4. List the test cases, with concrete basket values.
  modelAnswer: |
    **Conditions:** C1 Plus member? C2 Basket ≥ 30 JOD? C3 Express?
    **Actions:** standard delivery fee (0 or 1.50), express surcharge (0 or 2.00).

    **Full table (8 rules):**

    | | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 |
    | --- | --- | --- | --- | --- | --- | --- | --- | --- |
    | Plus member | Y | Y | Y | Y | N | N | N | N |
    | Basket ≥ 30 | Y | Y | N | N | Y | Y | N | N |
    | Express | Y | N | Y | N | Y | N | Y | N |
    | Delivery fee | 0 | 0 | 0 | 0 | 0 | 0 | 1.50 | 1.50 |
    | Express surcharge | 0 | – | 2.00 | – | 2.00 | – | 2.00 | – |

    **Collapsed:** R2 and R4 have the same outcome (free, no express), so they merge into "Plus, not express, basket: don't care." That gives 7 rules.

    **Question for the product owner:** for R5 (non-member, ≥ 30, express), is the total 2.00? The wording "always costs extra" says yes, but customers might expect free delivery to include express. Confirm before testing.

    **Test cases (one per collapsed rule, using boundary values where they help):**

    1. Plus, 30.00, express: fee 0, surcharge 0
    2. Plus, 12.00, standard: fee 0
    3. Plus, 29.99, express: fee 0, surcharge 2.00
    4. Non-member, 30.00, express: fee 0, surcharge 2.00 (pending confirmation)
    5. Non-member, 45.00, standard: fee 0
    6. Non-member, 29.99, express: fee 1.50, surcharge 2.00
    7. Non-member, 10.00, standard: fee 1.50

    The boundary values 30.00 and 29.99 sit in the columns that depend on C2, which combines this technique with BVA.
quiz:
  - id: q1
    prompt: "A rule has four independent true/false conditions. How many columns does the full decision table have?"
    options:
      - { id: a, text: "4" }
      - { id: b, text: "8" }
      - { id: c, text: "16" }
      - { id: d, text: "24" }
    answer: c
    explanation: "Each Boolean condition doubles the combinations: 2⁴ = 16 columns before any collapsing or removal of infeasible combinations."
  - id: q2
    prompt: "What does a \"–\" (don't care) entry in a collapsed decision table mean?"
    options:
      - { id: a, text: "The condition was not tested" }
      - { id: b, text: "The condition's value does not change the outcome for that rule" }
      - { id: c, text: "The requirement is missing for that condition" }
      - { id: d, text: "The combination is impossible" }
    answer: b
    explanation: "Don't care means either value gives the same actions, so the two columns can be merged into one. Impossible combinations are a different thing and should be removed with a note."
  - id: q3
    prompt: "While building a decision table, you find a combination of conditions the requirement does not mention. What is the best next step?"
    options:
      - { id: a, text: "Assume the most likely outcome and test for it" }
      - { id: b, text: "Skip that combination, because it is out of scope" }
      - { id: c, text: "Raise it with the product owner as a gap in the requirement before finalising tests" }
      - { id: d, text: "Log it as a defect in the code" }
    answer: c
    explanation: "A missing combination is a defect in the test basis, not the code. Raising it early is static testing at its most valuable: the answer may change the implementation."
references:
  - title: "Certified Tester Foundation Level (CTFL) v4.0: chapter 4, Test Analysis and Design"
    url: "https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/"
    publisher: "ISTQB"
reviewedOn: "2026-10-11"
---

## When partitions are not enough

Equivalence partitioning treats inputs one at a time. But many business rules depend on **combinations**: a discount applies if the customer is a member *and* the basket is over a threshold *unless* the item is already on sale. Testing each condition on its own won't show what happens when they meet.

A decision table lists every combination of conditions and the outcome each should produce. It is a test design technique, and it is also one of the fastest ways to find holes in a requirement.

## Anatomy of a decision table

Take a real-world rule from a ride-hailing app:

> "Cancellation is free within 2 minutes of booking. After that, a 1 JOD fee applies, unless the driver is more than 5 minutes late."

**Conditions** (the inputs that matter):

- C1: cancelled within 2 minutes?
- C2: driver more than 5 minutes late?

**Actions** (what the system does):

- A1: charge cancellation fee

With two Boolean conditions there are 2² = 4 combinations, one per **rule** (column):

| | R1 | R2 | R3 | R4 |
| --- | --- | --- | --- | --- |
| Within 2 min | Y | Y | N | N |
| Driver > 5 min late | Y | N | Y | N |
| **Charge fee** | No | No | No | Yes |

Each column becomes a test case. Four tests, each with a clear reason to exist.

## Collapsing with "don't care"

R1 and R2 have the same outcome: if you cancel within 2 minutes, the driver's lateness doesn't matter. Those columns merge into one, with "–" for the condition that doesn't influence the result:

| | R1' | R3 | R4 |
| --- | --- | --- | --- |
| Within 2 min | Y | N | N |
| Driver > 5 min late | – | Y | N |
| **Charge fee** | No | No | Yes |

Collapsing reduces tests, but only collapse when the requirement makes the "don't care" explicit. If you're inferring it, ask. There's a real chance the developer inferred something different.

## Using the table to question the requirement

The most valuable moment is often *building* the table, before any test runs. While writing the columns for the cancellation rule, a careful tester asks:

- Is "within 2 minutes" inclusive? What happens at exactly 120 seconds? (A boundary, so add BVA here.)
- "More than 5 minutes late" compared to what: the estimate at booking, or the latest estimate?
- What if the *driver* cancels? The table only models customer cancellations.
- Is there a case where the fee is charged but then refunded?

Each of these is a defect in the requirement, found at the cost of a conversation. This is static testing in practice.

## Handling impossible combinations

Some combinations can't happen. For example, "guest checkout" combined with "uses saved card" is infeasible if guests can't save cards. Mark these columns as infeasible, note why, and remove them. Don't try to force the system into an impossible state just to fill a column. But do confirm it really is impossible: the gap between "can't happen" and "shouldn't happen" is where some severe defects live.

## Scaling up

Four Boolean conditions give 16 columns; six give 64. When tables get large:

- **Collapse** aggressively using confirmed "don't cares."
- **Split** the rule into independent sub-rules if some conditions only affect some actions.
- **Use non-Boolean conditions** where it is clearer, for example "Membership: Basic / Plus / Gold" rather than two Boolean flags.
- **Combine with BVA** for conditions that come from ordered values like "basket ≥ 30."

## Coverage

Decision table coverage is the proportion of feasible columns exercised by at least one test. Report it as "6 of 6 feasible rules (2 infeasible removed: …)". Stating which columns were removed, and why, is what makes the coverage figure honest.

Next, you'll learn how to report the defects these tests find in a way that gets them fixed quickly.
