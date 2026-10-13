---
title: "Writing defect reports that get fixed"
summary: "A defect report is a small piece of technical writing with one job: let someone who wasn't there reproduce, understand and prioritise the problem. Here's how to write one, and how to set severity and priority."
minutes: 20
level: Junior
skills: [manual, test-management]
objectives:
  - "Write a defect report with a precise title, minimal reproduction steps, expected and actual results, and supporting evidence."
  - "Distinguish severity from priority and set each one with a justification."
  - "Describe a typical defect lifecycle and what each state transition means for the tester."
  - "Reduce a long, noisy reproduction to the minimal steps that still trigger the failure."
prerequisites:
  - "What quality means, and who owns it"
keyTerms:
  - term: Severity
    definition: "How much damage the failure does to the product or its users. Usually set by the tester."
  - term: Priority
    definition: "How urgently the fix is needed relative to other work. Usually set by the product owner or triage group."
  - term: Reproduction steps
    definition: "The minimum sequence of actions, from a defined starting state, that makes the failure occur."
  - term: Triage
    definition: "The regular review where new defects are assessed, prioritised and assigned."
mistakes:
  - mistake: "Titles like \"Checkout broken\" or \"Error on page\"."
    fix: "A title should state what fails, where, and under what condition: \"Checkout returns 500 when the voucher code contains lowercase letters\"."
  - mistake: "Describing your interpretation instead of what you observed: \"the API doesn't validate vouchers\"."
    fix: "Report the observed behaviour and evidence. Put any hypothesis in a separate, clearly labelled note."
  - mistake: "Treating severity and priority as the same field."
    fix: "A typo in the company name on the home page is low severity and high priority. A crash in a rarely used admin export may be high severity and medium priority. Set them independently."
  - mistake: "Including twenty steps because that is how you found it."
    fix: "Strip steps away one at a time and retest. Report only the steps the failure needs, plus the starting state."
  - mistake: "Reopening a ticket with \"still broken\" and no new information."
    fix: "Say which build you retested on, the exact steps, and what is different from the original report, if anything."
exercise:
  title: "Rewrite a weak defect report"
  brief: |
    Rewrite this report so a developer could act on it without asking you anything:

    > **Title:** Transfer not working!!
    >
    > I was testing transfers and it failed. I tried a few times and sometimes it works. Please fix ASAP, this is critical. Screenshot attached.

    What you know from your notes: Android app 4.12.0 (build 912) on the staging environment. User has a JOD account with a 250.000 balance. You sent 100.500 JOD to a saved beneficiary. The confirmation screen showed "Something went wrong" (code TX-409). Your balance didn't change. It happens every time the amount has three decimal places, and never with two. The iOS app on the same build handles 100.500 correctly.

    Write the title, environment, preconditions, steps, expected result, actual result, evidence, severity, a suggested priority, and a note.
  modelAnswer: |
    **Title:** Android: transfer of JOD amount with 3 decimal places fails with TX-409 (2 decimals succeed)

    **Environment:** staging · Android app 4.12.0 (build 912) · Pixel 7, Android 14

    **Preconditions:** logged in as a user with a JOD account balance of 250.000 and at least one saved beneficiary.

    **Steps:**
    1. Open Transfers > Send to beneficiary and pick any saved beneficiary.
    2. Enter amount `100.500` and continue.
    3. Confirm the transfer.

    **Expected:** the transfer succeeds and the balance becomes 150.000. JOD uses three decimal places (fils), so 100.500 is a valid amount.

    **Actual:** an error screen reads "Something went wrong (TX-409)". The balance is unchanged and the transfer doesn't appear in history.

    **Reproducibility:** 5/5 with three decimals (100.500, 1.001, 20.125); 0/5 with two decimals (100.50).

    **Evidence:** screen recording; request ID from the app log `req_7f3c…`; the iOS 4.12.0 transfer of 100.500 succeeds (for comparison).

    **Severity:** High. A core money movement fails for valid amounts. No money is lost, and the user sees an error.

    **Suggested priority:** High. JOD customers routinely use fils, and there is no workaround other than changing the amount.

    **Note (hypothesis):** looks like the Android client formats or validates the amount to two decimal places before sending. iOS behaves correctly, which points at the client rather than the API.
quiz:
  - id: q1
    prompt: "The company's name is misspelled in the header of every page, a day before a public launch. How would you most likely classify it?"
    options:
      - { id: a, text: "High severity, low priority" }
      - { id: b, text: "Low severity, high priority" }
      - { id: c, text: "High severity, high priority" }
      - { id: d, text: "Low severity, low priority" }
    answer: b
    explanation: "Functionally nothing breaks, so severity is low. But the business impact and visibility at launch make it urgent, so priority is high. The two dimensions are independent."
  - id: q2
    prompt: "Which title is the most useful?"
    options:
      - { id: a, text: "Search is broken" }
      - { id: b, text: "Bug in search API" }
      - { id: c, text: "Search returns no results when the query contains an apostrophe (e.g. O'Neil)" }
      - { id: d, text: "URGENT: search issue reported by customer" }
    answer: c
    explanation: "It states what fails, under which condition, with a concrete example. A developer can often guess the cause, here probably escaping, from the title alone."
  - id: q3
    prompt: "A developer marks your defect \"Cannot reproduce.\" What should you do first?"
    options:
      - { id: a, text: "Reopen it with \"It definitely happens\"" }
      - { id: b, text: "Close it, since the developer has checked" }
      - { id: c, text: "Compare environments, data and build versions, try to reproduce again, and add whatever differs to the report" }
      - { id: d, text: "Escalate to the team lead" }
    answer: c
    explanation: "\"Cannot reproduce\" usually means a hidden precondition: data, configuration, build, device or timing. Finding that difference is often what reveals the root cause."
  - id: q4
    prompt: "Why separate observed facts from your hypothesis about the cause?"
    options:
      - { id: a, text: "Hypotheses are not allowed in defect reports" }
      - { id: b, text: "So a wrong guess doesn't send the investigation in the wrong direction, while a useful guess is still available" }
      - { id: c, text: "Because developers dislike suggestions" }
      - { id: d, text: "To make the report longer and more detailed" }
    answer: b
    explanation: "Facts are reliable and hypotheses might not be. Labelling each one lets the developer trust the facts and weigh the hypothesis appropriately."
references:
  - title: "Certified Tester Foundation Level (CTFL) v4.0: section 5.5, Defect Management"
    url: "https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/"
    publisher: "ISTQB"
  - title: "ISTQB Glossary: defect report, severity, priority"
    url: "https://glossary.istqb.org/"
    publisher: "ISTQB"
reviewedOn: "2026-10-11"
---

## The report is the product of your testing

For most of the people around you, the defect report *is* your testing. The developer never saw your screen, the product owner never saw your test data, and the person triaging next week has forgotten the context. If the report is vague, the defect waits in the backlog, gets closed as "cannot reproduce," or gets fixed in a way that misses the real problem.

A good report answers four questions for a reader who wasn't there:

1. **What happened?** The observed failure, precisely.
2. **How do I make it happen?** Starting state plus minimal steps.
3. **What should have happened?** With a reference to the requirement or a sound reason.
4. **How bad is it?** Severity, plus the facts that justify it.

## Anatomy of a strong report

| Field | What goes in it | Example |
| --- | --- | --- |
| Title | What fails + where + under what condition | "Voucher field rejects valid codes that contain a hyphen" |
| Environment | App/build version, environment, device, browser, account type | "Web 3.8.1 · staging · Chrome 141 · Basic member" |
| Preconditions | State needed before step 1 | "Basket contains 1 item; voucher `SPRING-10` is active" |
| Steps | Numbered, minimal, one action per step | "1. Open basket. 2. Enter `SPRING-10`. 3. Select Apply." |
| Expected | The correct behaviour and the source of truth | "10% discount applied (story SHOP-412, AC3)" |
| Actual | What you observed, verbatim where possible | "Message: 'Invalid code format'. No discount applied." |
| Evidence | Screenshot, recording, logs, request/response, correlation ID | Request payload and response body attached |
| Reproducibility | How often, and under which variations | "5/5. Codes without hyphen work." |
| Severity | Impact on product or user, with justification | "Medium: promotion unusable; checkout still works" |

Two habits make the biggest difference.

**Minimise the steps.** You may have found the defect after twenty minutes of exploring. Before you report it, remove steps one at a time and check whether it still happens. The result is usually three to five steps, and the removed steps tell you something about the cause.

**Capture the evidence a developer actually uses.** For web and API defects, this is often the request and response (from browser DevTools or an API client) and a request or correlation ID, which lets the developer find the exact server log line. A screenshot of an error banner is helpful; the response body behind it is better.

## Severity and priority are different questions

**Severity** asks how bad the failure is for the product or the user. Testers usually set it, based on impact: data loss, money movement, security exposure, blocked workflows, cosmetic issues.

**Priority** asks how soon this should be fixed compared with everything else. The product owner or a triage group usually sets it, based on business context: release dates, customer commitments, how many users are affected, workarounds.

They often align, but the cases where they don't are the ones you'll be asked about:

| Example | Severity | Priority |
| --- | --- | --- |
| Payments double-charge on retry | Critical | Immediate |
| Company name misspelled on landing page before launch | Low | High |
| Crash in an admin report used once a year | High | Medium |
| Slightly misaligned icon in settings | Low | Low |

Many teams use a scale like Critical / High / Medium / Low with written definitions. If your team doesn't have one, propose one. Arguments about severity are much shorter when the definitions are written down.

## A typical defect lifecycle

Tools and teams name states differently, but most lifecycles look like this:

```text
New → Triaged → In progress → Fixed (ready for test) → Verified → Closed
              ↘ Rejected / Duplicate / Won't fix / Deferred
Verified fails → Reopened → In progress …
```

As the tester you own two transitions in particular:

- **Fixed → Verified:** run confirmation testing on the specified build, then run a focused regression check around the change. Record the build you verified on.
- **Fixed → Reopened:** only reopen with new information, such as the build, the steps and what is still wrong. If the original failure is fixed but you found a *different* problem, open a new defect and link it.

## Tone and collaboration

A defect report criticises the product, not the person. Avoid "obviously," "again" and "this should never have passed review." Neutral, precise language gets faster fixes. It also builds the trust that gets you invited to refinement meetings, which is where you can prevent the next defect.

That completes the QA Foundations path. Your next step is to apply partitions, boundaries, decision tables and clear reporting to API testing.
