---
title: "Equivalence partitioning and boundary value analysis"
summary: "The two techniques that turn \"test some values\" into a small, defensible set of tests. Most input-handling defects live at the edges, and this lesson shows you how to find them."
minutes: 25
level: Junior
skills: [manual, fundamentals]
objectives:
  - "Identify valid and invalid equivalence partitions for an input or output, including partitions that are not numeric."
  - "Derive boundary values using both the 2-value and 3-value approaches."
  - "Calculate the coverage a set of tests achieves for partitions and for boundaries."
  - "Combine partitions across several inputs without creating an explosion of test cases."
prerequisites:
  - "Testing across the delivery lifecycle"
keyTerms:
  - term: Equivalence partition
    definition: "A set of values the system is expected to handle in the same way, so one representative tests the whole set."
  - term: Boundary value
    definition: "The minimum or maximum value of an ordered partition."
  - term: 2-value BVA
    definition: "For each boundary, test the boundary value and its closest neighbour in the adjacent partition."
  - term: 3-value BVA
    definition: "For each boundary, test the boundary value and both of its neighbours."
  - term: Coverage
    definition: "The proportion of coverage items, such as partitions or boundary values, exercised by at least one test."
mistakes:
  - mistake: "Only creating partitions for valid input."
    fix: "Invalid partitions are where error handling lives, and error handling is under-tested on most products. List the invalid partitions explicitly."
  - mistake: "Combining several invalid values in one test case."
    fix: "If two invalid values are in one test, the first validation error can hide the second. Test each invalid partition on its own, with all other inputs valid."
  - mistake: "Assuming the boundary is where the requirement says it is."
    fix: "Requirements say \"between 18 and 65\". Code says `age > 18`. The whole point is to test whether they agree, so test both sides of every boundary."
  - mistake: "Forgetting non-numeric partitions such as empty input, wrong type, wrong format or too long."
    fix: "Ask how the input arrives (form field, JSON, CSV) and partition by what can arrive, not only by what the business rule says."
exercise:
  title: "Design tests for a transfer limit"
  brief: |
    A wallet app has this rule: "A single transfer must be at least 1.00 and at most 5,000.00 JOD. Amounts have at most two decimal places. Verified customers may transfer up to 20,000.00 JOD."

    1. List the equivalence partitions for the amount, for both unverified and verified customers.
    2. List the boundary values using 2-value BVA.
    3. Write the minimum set of test cases that achieves 100% partition coverage and 100% 2-value boundary coverage. For each one, state the customer type, the amount and the expected result.
  modelAnswer: |
    **Partitions for the amount (unverified):**

    - Invalid: below minimum (< 1.00)
    - Valid: 1.00 to 5,000.00
    - Invalid: above maximum (> 5,000.00)
    - Invalid: more than two decimal places (e.g. 10.005)
    - Invalid: not a number or empty (e.g. "ten", "")

    For **verified** customers the valid partition becomes 1.00 to 20,000.00, and the upper invalid partition becomes > 20,000.00.

    **2-value boundaries (smallest step 0.01):**

    - Unverified: 0.99 | 1.00 and 5,000.00 | 5,000.01
    - Verified: 0.99 | 1.00 and 20,000.00 | 20,000.01

    **Test cases:**

    | # | Customer | Amount | Expected |
    | --- | --- | --- | --- |
    | 1 | Unverified | 0.99 | Rejected: below minimum |
    | 2 | Unverified | 1.00 | Accepted |
    | 3 | Unverified | 5,000.00 | Accepted |
    | 4 | Unverified | 5,000.01 | Rejected: above limit, with a message that mentions verification |
    | 5 | Verified | 20,000.00 | Accepted |
    | 6 | Verified | 20,000.01 | Rejected: above limit |
    | 7 | Verified | 0.99 | Rejected: below minimum |
    | 8 | Either | 10.005 | Rejected: too many decimals |
    | 9 | Either | "" (empty) | Rejected: amount required |

    Tests 2 and 3 also cover the valid unverified partition. Test 5 covers the valid verified partition. Test 7 can be argued away if the minimum is shared code, but it is cheap and confirms the assumption. A strong extra test: verified customer, 5,000.01, which should be **accepted**. It proves the higher limit really applies.
quiz:
  - id: q1
    prompt: "A field accepts whole numbers of guests from 1 to 12. Using 2-value BVA, which set covers all boundary values?"
    options:
      - { id: a, text: "1, 12" }
      - { id: b, text: "0, 1, 12, 13" }
      - { id: c, text: "0, 1, 2, 11, 12, 13" }
      - { id: d, text: "1, 6, 12" }
    answer: b
    explanation: "Each boundary contributes the boundary value plus its closest neighbour in the adjacent partition: 0 and 1 at the lower edge, 12 and 13 at the upper. Option C is the 3-value set."
  - id: q2
    prompt: "A password must be 8 to 64 characters. Your tests use lengths 10 and 70. What partition coverage do you have, assuming three partitions (too short, valid, too long)?"
    options:
      - { id: a, text: "33%" }
      - { id: b, text: "67%" }
      - { id: c, text: "100%" }
      - { id: d, text: "50%" }
    answer: b
    explanation: "Length 10 covers the valid partition and 70 covers too long. The too-short partition is untested, so coverage is 2 of 3 partitions, about 67%."
  - id: q3
    prompt: "Why should a test case contain only one invalid input value?"
    options:
      - { id: a, text: "Because test management tools don't allow more" }
      - { id: b, text: "Because the first validation failure can mask a defect in how the second invalid value is handled" }
      - { id: c, text: "Because invalid values are never combined in real use" }
      - { id: d, text: "Because it halves the number of test cases" }
    answer: b
    explanation: "Many systems stop at the first validation error. If the second invalid value is never evaluated, a defect in its handling stays hidden. This is called defect masking."
  - id: q4
    prompt: "A shipping rule says: orders of 50.00 or more ship free. The developer wrote `if (total > 50)`. Which test detects the defect?"
    options:
      - { id: a, text: "total = 49.99" }
      - { id: b, text: "total = 50.00" }
      - { id: c, text: "total = 75.00" }
      - { id: d, text: "total = 0.00" }
    answer: b
    explanation: "At exactly 50.00 the rule says free shipping, but `50 > 50` is false, so the code charges shipping. Only the boundary value itself reveals the off-by-one comparison."
references:
  - title: "Certified Tester Foundation Level (CTFL) v4.0: chapter 4, Test Analysis and Design"
    url: "https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/"
    publisher: "ISTQB"
  - title: "ISTQB Glossary: equivalence partitioning, boundary value analysis"
    url: "https://glossary.istqb.org/"
    publisher: "ISTQB"
reviewedOn: "2026-10-11"
---

## The problem these techniques solve

A delivery app asks for the number of items in a bulk order: "1 to 99 units." You could test 1, 2, 3 … 99. That's 99 tests that mostly tell you the same thing. Or you could test "a few values that feel right," which is how most untrained testers work and why they miss the defects that matter.

Equivalence partitioning (EP) and boundary value analysis (BVA) give you a *reasoned* small set. You can explain to anyone why each test exists and what it covers. That defensibility is what separates test design from guessing.

## Equivalence partitioning

The idea: divide every possible input (or output) into groups, called **partitions**, that the system should treat the same way. If it treats one member of the group correctly, it very likely treats all of them correctly. One representative per partition is enough.

For "1 to 99 units":

| Partition | Example values | Valid? |
| --- | --- | --- |
| Fewer than 1 | 0, -5 | Invalid |
| 1 to 99 | 1, 40, 99 | Valid |
| More than 99 | 100, 5000 | Invalid |

That's the obvious part. The skill is in finding the partitions that aren't in the requirement. Ask: *how does this value reach the system, and what else could arrive?*

| Partition | Example | Why it matters |
| --- | --- | --- |
| Not a number | `"ten"`, `"5a"` | Parsing errors, sometimes a 500 instead of a validation message |
| Decimal | `2.5` | Is it rounded, truncated or rejected? |
| Empty / missing | `""`, field absent from JSON | Is it "0" or "required"? |
| Very large | `99999999999999999999` | Integer overflow in some languages |
| Leading zeros, spaces | `" 007 "` | Trimming and parsing inconsistencies |

Partitions apply to outputs too. If a loyalty program says "0–999 points: Bronze, 1000–4999: Silver, 5000+: Gold," the output tiers are partitions, and you need inputs that land in each one.

**Coverage** is the share of partitions exercised by at least one test. Aim for 100% of identified partitions. Then the interesting question is whether you identified the right partitions, which is why reviewing your partitions with a developer is valuable.

## Boundary value analysis

Partitions with an order (numbers, dates, lengths) have edges, and edges are where developers make mistakes. They write `<` instead of `<=`, count from 0 instead of 1, or get the inclusive/exclusive end of a range wrong. BVA tests exactly those edges.

For each boundary between two partitions, there are two common approaches:

**2-value BVA** tests the boundary value and its nearest neighbour in the adjacent partition.

```text
          invalid │ valid ... valid │ invalid
units:       0    │  1    ...   99  │  100
BVA tests:   ●       ●          ●      ●
```

That gives 0, 1, 99 and 100.

**3-value BVA** tests the boundary value and *both* of its neighbours: 0, 1, 2 and 98, 99, 100. It is more thorough. The extra values catch defects where a condition is wrong in a way that only shows on the "inside" neighbour, for example a mistyped constant (`== 2` written where `>= 1` was meant) or a range defined by its length.

The "neighbour" depends on precision. For whole numbers the step is 1. For currency in two decimals it is 0.01. For dates it is one day, or one second if time matters. **Always ask what the smallest step is**, because the requirement rarely says.

## Why boundaries catch real defects

Here is a rule and a plausible implementation:

> "Customers aged 18 to 65 inclusive can apply for the credit card."

```ts
function canApply(age: number): boolean {
  return age > 18 && age <= 65;
}
```

Test with ages 30 and 70 and everything looks right. Test with **18**, the boundary value, and the function returns `false`. An 18-year-old who meets the rule is refused. Only a test at the boundary finds this.

## Combining several inputs

Real forms have several fields. If a transfer has an amount (3 partitions), a currency (4 partitions) and a customer type (2 partitions), testing every combination would mean 3 × 4 × 2 = 24 tests, and that grows fast.

A practical approach for this level:

1. **Valid partitions:** combine them so that each valid partition appears in at least one test. Several valid partitions can share a test, so with these numbers four tests can cover all valid partitions.
2. **Invalid partitions:** one test per invalid partition, with every *other* input valid. This prevents defect masking.
3. **Add combinations the business cares about.** If verified customers have a different limit, test the boundary for each customer type. That is a known interaction, not a random combination.

For larger interaction spaces, pairwise testing (covered in a later path) gives systematic coverage of every pair of values with far fewer tests.

## Checklist before you call it done

- Did I list partitions for **inputs and outputs**?
- Did I include **invalid** partitions for type, format, empty and size, not just range?
- Do I know the **step size** for every ordered value?
- Does each invalid test contain **only one** invalid value?
- Can I state my **coverage** in one sentence ("all 7 partitions, all 8 two-value boundaries")?

Next: when the *combination* of conditions decides the outcome, partitions alone aren't enough. That is what decision tables are for.
