---
title: "Release readiness and go/no-go decisions"
summary: "QA rarely owns the release decision, but it should own the evidence behind it. Learn to turn test results into a clear recommendation with residual risk, options and conditions that a product owner can act on."
minutes: 24
level: Lead
skills: [leadership, test-management]
reviewedOn: "2026-10-12"
objectives:
  - "Separate the release decision (owned by the business) from the quality recommendation (owned by QA)."
  - "Assemble release evidence: coverage of high risks, open defects, untested areas and operational readiness."
  - "Express residual risk in business terms: who is affected, how likely, and what it costs."
  - "Offer options beyond go and no-go, such as conditional release, feature flags and staged rollout."
prerequisites:
  - "Experience reporting test results to a team"
  - "Writing defect reports that get fixed (severity and priority)"
keyTerms:
  - term: Exit criteria
    definition: "Conditions agreed in advance that must be met before testing can be considered complete for a release."
  - term: Residual risk
    definition: "The risk that remains after testing, because some areas were not tested or known defects remain open."
  - term: Go with conditions
    definition: "A release recommendation that depends on named actions, owners and deadlines, such as a feature flag or a hotfix plan."
  - term: Staged rollout
    definition: "Releasing to a small share of users first, watching signals, then widening the release."
mistakes:
  - mistake: "Acting as the gatekeeper who \"signs off\" or blocks the release alone."
    fix: "Make a recommendation with evidence. The product owner or release owner decides, with the risk stated in writing."
  - mistake: "Reporting pass percentages as if they were readiness."
    fix: "97% passed says nothing about which 3% failed. Lead with high-risk coverage, open critical defects and what wasn't tested."
  - mistake: "Treating untested areas as passed."
    fix: "Untested is unknown. List untested areas explicitly, with the risk they carry and what it would take to test them."
  - mistake: "Changing exit criteria in the release meeting."
    fix: "Agree exit criteria at the start. If they must change, record the decision, who made it and why."
exercise:
  title: "Recommend for a real-looking release"
  brief: |
    A food-delivery app is scheduled to release version 8.4 tomorrow morning. Status at 4 pm today (synthetic):

    - All 38 high-risk scenarios passed except one: **tipping the rider after delivery fails for Apple Pay users** (about 30% of orders use Apple Pay). The order itself is paid correctly.
    - 6 medium and 11 low defects are open. None affect payments or ordering.
    - The new **live order tracking map** couldn't be tested on Android 11 devices because the device lab was down.
    - The tipping feature is behind a feature flag that can be turned off per payment method.
    - Marketing is launching a "tip your rider" campaign in one week.

    Write a recommendation of no more than 150 words: the decision you recommend, residual risks in business terms, and conditions with owners.
  modelAnswer: |
    **Recommendation: go with conditions.**

    Ordering and payment are fully tested and passing, so 8.4 can ship tomorrow if tipping is switched off for Apple Pay.

    **Residual risks**

    - Riders don't receive tips from Apple Pay customers (about 30% of orders) while the flag is off. That's a rider-earnings and goodwill issue, not a payment error.
    - Live tracking hasn't been tested on Android 11. If it fails, affected customers fall back to status text. Likelihood is unknown.

    **Conditions**

    1. Turn the tipping flag off for Apple Pay before release. Owner: release manager.
    2. Test Android 11 tracking on two physical devices tomorrow; disable the map for Android 11 if it fails. Owner: QA lead.
    3. Fix Apple Pay tipping before the campaign starts next week. Owner: payments team; verification: QA.

    Decision owner: product director.
quiz:
  - id: q1
    prompt: "Who should normally make the final release decision?"
    options:
      - { id: a, text: "The QA lead, by signing off the test report" }
      - { id: b, text: "The product owner or release owner, informed by QA's evidence and recommendation" }
      - { id: c, text: "The developer who wrote most of the code" }
      - { id: d, text: "Whoever is on call that night" }
    answer: b
    explanation: "Release decisions balance quality against business factors QA doesn't own: deadlines, commitments, revenue and reputation. QA owns the evidence and the recommendation."
  - id: q2
    prompt: "Which statement is the most useful opening line of a release recommendation?"
    options:
      - { id: a, text: "We executed 1,240 test cases this cycle." }
      - { id: b, text: "QA approves the release." }
      - { id: c, text: "Go with one condition: disable tipping for Apple Pay; ordering and payment are fully tested." }
      - { id: d, text: "There are 17 open defects." }
    answer: c
    explanation: "Lead with the decision and the reason. Counts of tests and defects belong in the supporting evidence, not the headline."
  - id: q3
    prompt: "An area of the release could not be tested because an environment was down. How should it appear in the recommendation?"
    options:
      - { id: a, text: "It shouldn't be mentioned, because nothing failed" }
      - { id: b, text: "As passed, since no defects were found" }
      - { id: c, text: "As untested residual risk, with its likely impact and what it would take to test it" }
      - { id: d, text: "As a blocker that automatically stops the release" }
    answer: c
    explanation: "Untested means unknown. Stating it, with impact and options, lets the decision owner choose: accept the risk, test it now, or disable the feature."
  - id: q4
    prompt: "Which option reduces risk without blocking the whole release?"
    options:
      - { id: a, text: "Releasing to all users at once and watching social media" }
      - { id: b, text: "A feature flag or staged rollout for the risky change" }
      - { id: c, text: "Deleting the failing tests" }
      - { id: d, text: "Lowering the severity of open defects" }
    answer: b
    explanation: "Flags and staged rollouts limit how many users a defect can reach and allow a fast switch-off, which turns a binary decision into a managed one."
references:
  - title: "Certified Tester Foundation Level (CTFL) v4.0: chapter 5, Managing the Test Activities"
    url: "https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/"
    publisher: "ISTQB"
  - title: "Certified Tester Advanced Level Test Management (CTAL-TM) v3.0"
    url: "https://istqb.org/certifications/certified-tester-advanced-level-test-management-ctal-tm-v3-0/"
    publisher: "ISTQB"
---

## Who decides, and what QA owns

In many teams the release meeting ends with someone asking, "Has QA signed off?" That question puts testers in an impossible position. QA can't know everything about the business trade-offs: a contract deadline, a campaign, a regulator's date, the cost of a delay. And a sign-off implies a guarantee no test can give.

A healthier split:

- **The product owner or release owner decides** whether to release.
- **QA owns the evidence and a recommendation:** what was tested, what wasn't, what is broken, what that means for customers, and what options exist.

This isn't QA stepping back. It's QA doing the part only QA can do, well enough that the decision becomes obvious.

## Assemble the evidence

Build the evidence around risk, not volume. For each release, you need answers to five questions:

1. **Are the high-risk scenarios covered and passing?** List them; they should come from the risk analysis made at planning time, not be invented on release day.
2. **Which defects are open, and what do they do to customers?** Group them by impact, not just by severity label.
3. **What wasn't tested, and why?** Environment outages, late changes, devices you couldn't get. Untested is unknown, never passed.
4. **Is the release operable?** Monitoring for the changed areas, a rollback or feature-flag plan, support briefed, data migrations rehearsed.
5. **Were the exit criteria met?** If not, which ones, and does anyone want to change them? That change must be a recorded decision, not a quiet one.

The release readiness checklist in the Library turns these into a page you can fill in.

## Say risk in the language of the business

"Defect ABC-1234, severity high, open" means little to a product director. Residual risk becomes actionable when it answers three questions:

| Question | Weak | Strong |
| --- | --- | --- |
| Who is affected? | "Some users" | "Apple Pay customers, about 30% of orders" |
| What happens to them? | "Tipping bug" | "They can't tip the rider; their order and payment are unaffected" |
| How likely, and how bad? | "Medium" | "Every Apple Pay order that tries to tip; affects rider earnings, not revenue" |

Notice what's missing from the strong column: test case counts, defect IDs and internal jargon. Those belong in an appendix for people who want to check your work.

## More options than go and no-go

A binary choice forces people to choose between shipping a known problem and missing a date. Most releases have middle paths, and finding them is one of the most valuable things a QA lead does:

- **Go with conditions:** release, with named actions, owners and deadlines (switch off a flag, add monitoring, ship a hotfix by Friday).
- **Feature flags:** release the code, but keep the risky feature off for everyone or for the affected group.
- **Staged rollout:** release to 5% of users, watch error rates and support tickets, then widen.
- **Partial release:** ship the parts that are ready and hold back the ones that aren't, when the architecture allows.
- **No-go with a date:** delay, with a specific plan and a new date, rather than an open-ended "not ready".

Each option has a cost; state it. A flag-off feature might conflict with a marketing campaign; a staged rollout delays full availability. The decision owner weighs those costs, not you.

## A recommendation in one page

Structure that works in practice:

1. **The recommendation, in one sentence**, with the main reason.
2. **Residual risks**, three to five, in business terms.
3. **Conditions**, each with an owner and a deadline, if you recommend going with conditions.
4. **Evidence summary**: high-risk coverage, open defects by impact, untested areas, operational readiness.
5. **The decision owner's name**, and space to record the decision.

Send it before the meeting, so the meeting is about the decision and not about reading results aloud. Afterwards, record the decision and who made it next to your recommendation. When a risk you named turns into an incident, that record is what lets the team learn from it rather than blame testing.

Next in this path: running defect triage, the weekly habit that keeps release day calm.
