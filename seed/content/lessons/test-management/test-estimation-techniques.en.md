---
title: "Test estimation techniques"
summary: "Estimates are forecasts with uncertainty, not promises. Learn four established estimation techniques, how to combine them, and how to present a range that a project can plan around."
minutes: 26
level: Manager
skills: [test-management, leadership]
reviewedOn: "2026-10-12"
objectives:
  - "Apply ratio-based estimation, extrapolation, Wideband Delphi and three-point estimation."
  - "Build a work breakdown of test activities as the basis of a bottom-up estimate."
  - "Calculate a three-point estimate and its standard deviation, and present it as a range."
  - "Reconcile two independent estimates and state the assumptions behind them."
prerequisites:
  - "Experience planning test work for at least one team"
keyTerms:
  - term: Ratio-based estimation
    definition: "Estimating test effort from historical ratios, such as test effort as a share of development effort in similar projects."
  - term: Extrapolation
    definition: "Estimating from measurements taken early in the current project, such as the effort per test case in the first sprint."
  - term: Wideband Delphi
    definition: "An expert-based technique where estimators work independently, discuss differences, and re-estimate until estimates converge."
  - term: Three-point estimation
    definition: "Combining optimistic (a), most likely (m) and pessimistic (b) estimates: E = (a + 4m + b) / 6, with standard deviation SD = (b − a) / 6."
mistakes:
  - mistake: "Giving a single number as if it were certain."
    fix: "Present a range and the assumptions behind it. A single number becomes a commitment the moment it is said aloud."
  - mistake: "Estimating only test execution."
    fix: "Include analysis, design, environment and data setup, automation, defect retesting, regression and reporting. Execution is often less than half of the effort."
  - mistake: "Using ratios from a different kind of project."
    fix: "Ratios only transfer between similar contexts (domain, risk, team, technology). Adjust or don't use them."
  - mistake: "Never comparing estimates with actuals."
    fix: "Record actuals at the end of each project. Your ratios and your judgement only improve with feedback."
exercise:
  title: "Estimate the testing for a new feature"
  brief: |
    A team is adding "pay by instalments" to an online shop (synthetic data). Facts you have:

    - Development is estimated at 60 person-days.
    - In three similar past features, test effort was 40%, 45% and 50% of development effort.
    - Your bottom-up breakdown, as optimistic / most likely / pessimistic person-days:
      - Test analysis and design: 3 / 4 / 7
      - Environment and test data (payment provider sandbox): 2 / 3 / 8
      - Execution and exploratory testing: 6 / 8 / 12
      - Automation of key regression checks: 4 / 6 / 10
      - Retesting and regression: 2 / 3 / 6
      - Reporting and release support: 1 / 1 / 2

    1. Produce a ratio-based estimate.
    2. Produce a three-point estimate for each activity and the total, with a standard deviation.
    3. Reconcile the two and write a two-sentence estimate statement for the project manager.
  modelAnswer: |
    **1. Ratio-based:** 40–50% of 60 = **24 to 30 person-days** (midpoint 27).

    **2. Three-point** (E = (a + 4m + b) / 6, SD = (b − a) / 6):

    | Activity | a | m | b | E | SD |
    | --- | --- | --- | --- | --- | --- |
    | Analysis and design | 3 | 4 | 7 | 4.33 | 0.67 |
    | Environment and data | 2 | 3 | 8 | 3.67 | 1.00 |
    | Execution and exploratory | 6 | 8 | 12 | 8.33 | 1.00 |
    | Automation | 4 | 6 | 10 | 6.33 | 1.00 |
    | Retesting and regression | 2 | 3 | 6 | 3.33 | 0.67 |
    | Reporting and release | 1 | 1 | 2 | 1.17 | 0.17 |
    | **Total** | 18 | 25 | 45 | **27.17** | |

    Combined SD, treating activities as independent: √(0.67² + 1² + 1² + 1² + 0.67² + 0.17²) ≈ √3.92 ≈ **1.98**. So about **25 to 29 person-days** at one standard deviation.

    **3. Reconciliation:** both techniques point to about 27 person-days, which increases confidence. The ratio range (24–30) is wider because past features varied.

    **Statement:** "Testing for instalments needs about 27 person-days, most likely between 25 and 30. The biggest uncertainty is the payment provider's sandbox: if it's unavailable or unstable, environment work could add up to 5 days."
quiz:
  - id: q1
    prompt: "Optimistic 6 days, most likely 9 days, pessimistic 18 days. What is the three-point (PERT) estimate?"
    options:
      - { id: a, text: "9 days" }
      - { id: b, text: "10 days" }
      - { id: c, text: "11 days" }
      - { id: d, text: "12 days" }
    answer: b
    explanation: "E = (a + 4m + b) / 6 = (6 + 36 + 18) / 6 = 60 / 6 = 10 days. The pessimistic tail pulls the estimate above the most likely value."
  - id: q2
    prompt: "For the same numbers (6, 9, 18), what is the standard deviation?"
    options:
      - { id: a, text: "1 day" }
      - { id: b, text: "2 days" }
      - { id: c, text: "3 days" }
      - { id: d, text: "12 days" }
    answer: b
    explanation: "SD = (b − a) / 6 = (18 − 6) / 6 = 2 days, so a range of 8 to 12 days covers one standard deviation either side of the estimate."
  - id: q3
    prompt: "In Wideband Delphi, why do estimators work independently before discussing?"
    options:
      - { id: a, text: "To save meeting time" }
      - { id: b, text: "To avoid anchoring on the first or most senior person's number, and to surface different assumptions" }
      - { id: c, text: "Because the facilitator averages the numbers without discussion" }
      - { id: d, text: "Because discussion is not part of the technique" }
    answer: b
    explanation: "Independent estimates expose differences. Discussing why they differ reveals hidden assumptions and risks, and re-estimating then converges on a better-informed number."
  - id: q4
    prompt: "In sprint 1 the team executed 40 test cases in 5 days. 160 remain, of similar complexity. Which technique gives about 20 more days?"
    options:
      - { id: a, text: "Ratio-based estimation" }
      - { id: b, text: "Extrapolation" }
      - { id: c, text: "Wideband Delphi" }
      - { id: d, text: "Three-point estimation" }
    answer: b
    explanation: "Extrapolation uses measurements from the current project: 8 test cases per day, so 160 ÷ 8 = 20 days. It is only as good as the assumption that the remaining work is similar."
references:
  - title: "Certified Tester Foundation Level (CTFL) v4.0: section 5.1, Test Planning (estimation techniques)"
    url: "https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/"
    publisher: "ISTQB"
  - title: "Certified Tester Advanced Level Test Management (CTAL-TM) v3.0: Test Estimation"
    url: "https://istqb.org/certifications/certified-tester-advanced-level-test-management-ctal-tm-v3-0/"
    publisher: "ISTQB"
---

## An estimate is a forecast, not a promise

Every project asks the test manager the same question: "How long will testing take?" The honest answer is always a range, because at the time you're asked you don't know how many defects there will be, how stable the environment will be, or how much the requirements will change.

The craft of test estimation is to make that range **as narrow as the evidence allows, and no narrower**, and to make the assumptions behind it visible so the project can manage them.

## Start with a breakdown of the work

Whatever technique you use, list the work first. Test effort is far more than running tests:

| Activity | What drives the effort |
| --- | --- |
| Test analysis and design | Number and complexity of requirements, clarity of the test basis |
| Environment and test data | Integrations, sandboxes, data privacy rules, how often environments reset |
| Test execution and exploratory testing | Number of test conditions, platforms, devices and languages |
| Automation | New checks to build, existing checks to update |
| Defect retesting and regression | Expected defect volume, fix turnaround, size of the regression set |
| Reporting, triage and release support | Number of stakeholders and release events |

A breakdown also makes later conversations easier. When the project asks you to cut a week, you can show exactly which activity, and which risk, a week of cuts removes.

## Four established techniques

The ISTQB Foundation syllabus describes four commonly used techniques. Use at least two, independently, and compare them.

### Ratio-based estimation

Use historical ratios from similar work: "On our last three payments features, testing took 40–50% of development effort." It is fast and grounded in your own data. It only works when the past projects really are similar in domain, risk, team and technology.

### Extrapolation

Measure early in the current project and project forward: "In sprint 1 we designed and ran 40 test cases in 5 days; 160 remain." It reflects the actual team and product, and it improves as the project progresses. It assumes the remaining work resembles the measured work, which is often untrue for the hardest features, typically left until last.

### Wideband Delphi

Several experts estimate **independently**, then compare and discuss the differences, then re-estimate, repeating until the numbers converge. The discussion is the point: if one person estimated 5 days and another 20, they have different assumptions, and both assumptions need to be on the table. Planning poker, common in agile teams, is a variant of this technique.

### Three-point estimation

For each activity, estimate an **optimistic** value (a), a **most likely** value (m) and a **pessimistic** value (b), then combine them:

```text
E  = (a + 4m + b) / 6
SD = (b − a) / 6
```

For an activity with a = 6, m = 9, b = 18 days: E = (6 + 36 + 18) / 6 = **10 days**, SD = (18 − 6) / 6 = **2 days**. The result sits above the most likely value because the pessimistic tail is long, which matches experience: things rarely go much better than expected, but they can go much worse.

To combine activities, add the estimates. If you treat activities as independent, the overall standard deviation is the square root of the sum of their squared SDs, which is narrower than adding the SDs directly.

## Present a range, with assumptions and risks

An estimate statement has three parts:

1. **The range:** "about 27 person-days, most likely between 25 and 30".
2. **The assumptions:** stable requirements after sprint 2, the payment sandbox available from week 1, two testers full time.
3. **The biggest uncertainties and their effect:** "If the sandbox is unstable, environment work could add up to 5 days."

Then **re-estimate at milestones.** Uncertainty shrinks as the project progresses (the "cone of uncertainty"), and an updated estimate with a reason is far more credible than an original one defended at all costs.

## Close the loop

At the end of each project, record actual effort per activity next to the estimate. Over a few projects, this becomes your ratio data, shows which activities you consistently underestimate (environment and data setup is a common one), and turns estimation from a guess into a skill your organisation owns.

Next in this path: turning the estimate into a test strategy and a test plan that people actually read.
