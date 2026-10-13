---
title: "State transition testing"
summary: "When a feature's response depends on what happened before, model it as states and transitions. You'll find the invalid transitions that most test sets never try."
minutes: 24
level: Junior
skills: [manual, fundamentals]
reviewedOn: "2026-10-12"
objectives:
  - "Model a feature as a state transition diagram and as a state table, including guard conditions."
  - "Derive test cases for all-states, valid-transitions and all-transitions coverage."
  - "Identify invalid transitions and decide the expected behaviour for each."
  - "Spot hidden state, such as counters and timers, that a simple diagram leaves out."
prerequisites:
  - "Equivalence partitioning and boundary value analysis"
  - "Decision tables for business rules"
keyTerms:
  - term: State
    definition: "A condition the system can be in, which changes how it responds to events."
  - term: Event
    definition: "Something that happens to the system (a user action, a message, a timer) and may cause a transition."
  - term: Transition
    definition: "A change from one state to another, triggered by an event and optionally restricted by a guard condition."
  - term: Guard condition
    definition: "A condition that must be true for a transition to happen, such as 'fewer than 3 failed attempts'."
  - term: Invalid transition
    definition: "An event that the current state must not accept. The system should reject it and stay in the same state."
mistakes:
  - mistake: "Testing only the happy path through the diagram."
    fix: "Valid-transitions coverage is the minimum. Add tests for invalid transitions: they model what confused users, retries and attackers will do."
  - mistake: "Ignoring hidden state like failed-attempt counters or expiry timers."
    fix: "Make hidden state explicit, either as separate states (Active, 1 failure, 2 failures) or as guard conditions, and test its boundaries."
  - mistake: "Checking the response but not the resulting state."
    fix: "After every event, check where the system is now: try the next event and confirm it behaves as the expected state should."
  - mistake: "Drawing the diagram from the UI alone."
    fix: "Ask developers for the real state model (often an enum or a status column). Differences between their model and the requirement are defects."
exercise:
  title: "Model a subscription"
  brief: |
    A streaming app's subscription works like this:

    - A new subscriber starts a **14-day trial**. Cancelling during the trial ends access immediately, at no charge.
    - When the trial ends, the card is charged and the subscription becomes **active**.
    - If a renewal payment fails, the subscription becomes **past due**. The app retries the card daily for 3 days. A successful retry makes it active again; after the third failure it is **suspended**.
    - An active subscriber can **cancel**. Access continues until the end of the paid period, then the subscription **expires**.
    - A suspended or expired subscriber can **resubscribe**, which charges the card immediately.

    1. Draw the states and transitions, with guard conditions.
    2. Write a state table and mark at least four invalid transitions.
    3. List the tests for valid-transitions coverage, plus your four most important invalid-transition tests.
  modelAnswer: |
    **States:** Trial, Active, Past due, Cancelled (still in paid period), Suspended, Expired, Ended (trial cancelled).

    **Transitions:**

    | From | Event | Guard | To |
    | --- | --- | --- | --- |
    | (start) | subscribe | | Trial |
    | Trial | cancel | | Ended |
    | Trial | trial ends + charge succeeds | | Active |
    | Trial | trial ends + charge fails | | Past due |
    | Active | renewal succeeds | | Active |
    | Active | renewal fails | | Past due |
    | Active | cancel | | Cancelled |
    | Past due | retry succeeds | | Active |
    | Past due | retry fails | failures < 3 | Past due |
    | Past due | retry fails | failures = 3 | Suspended |
    | Cancelled | paid period ends | | Expired |
    | Suspended | resubscribe + charge succeeds | | Active |
    | Expired | resubscribe + charge succeeds | | Active |

    **Valid-transitions coverage:** one test per row (13 tests; several can be chained in one long scenario if the environment lets you control time).

    **Important invalid transitions:**

    1. Ended + resubscribe → is a second free trial allowed? The requirement doesn't say. Raise it as a question before testing.
    2. Cancelled + cancel again → no change, no error page, no refund.
    3. Suspended + cancel → no charge, state stays Suspended (or moves to Expired: confirm which).
    4. Trial + "renewal fails" event arriving late from the payment provider → must not move the subscriber to Past due.

    **Hidden state:** the retry counter. Test 1, 2 and 3 failures (boundary), and check that a success resets the counter.
quiz:
  - id: q1
    prompt: "A diagram has 5 states and 7 valid transitions. What is the minimum number of tests that could achieve valid-transitions coverage?"
    options:
      - { id: a, text: "It depends on the diagram: each test must exercise transitions in sequence, so it could be one long test or several" }
      - { id: b, text: "Always exactly 5" }
      - { id: c, text: "Always exactly 7" }
      - { id: d, text: "Always 35 (5 × 7)" }
    answer: a
    explanation: "Coverage counts transitions exercised, not test cases. If the diagram allows one path through all 7 transitions, a single test could cover them. In practice shorter, independent tests are easier to diagnose."
  - id: q2
    prompt: "A wallet card locks after 3 consecutive wrong PINs. Which set of tests best covers this guard condition?"
    options:
      - { id: a, text: "1 wrong PIN only" }
      - { id: b, text: "2 wrong PINs then a correct one (stays active and resets the count), and 3 wrong PINs (locks)" }
      - { id: c, text: "10 wrong PINs" }
      - { id: d, text: "A correct PIN only" }
    answer: b
    explanation: "The counter is hidden state with a boundary at 3. Testing 2 and 3 failures covers both sides of the boundary, and the correct PIN after 2 failures checks that the counter resets."
  - id: q3
    prompt: "In a state table, what should a test check for an invalid transition?"
    options:
      - { id: a, text: "That the application crashes" }
      - { id: b, text: "That the event is rejected in the documented way and the system stays in the same state" }
      - { id: c, text: "Nothing: invalid transitions can't happen" }
      - { id: d, text: "That the system moves to the start state" }
    answer: b
    explanation: "An invalid transition should be refused cleanly (an error message, a disabled action, a 409 from an API) without changing the state. Follow-up events confirm the state didn't change."
  - id: q4
    prompt: "Which coverage criterion is the strongest of these three?"
    options:
      - { id: a, text: "All-states coverage" }
      - { id: b, text: "Valid-transitions coverage" }
      - { id: c, text: "All-transitions coverage (valid transitions plus attempts at invalid ones)" }
    answer: c
    explanation: "All-transitions coverage includes every valid transition and tries the invalid ones too, so it subsumes valid-transitions coverage, which in turn usually covers all states."
references:
  - title: "Certified Tester Foundation Level (CTFL) v4.0: section 4.2, Black-Box Test Techniques"
    url: "https://istqb.org/certifications/certified-tester-foundation-level-ctfl-v4-0/"
    publisher: "ISTQB"
  - title: "ISTQB Glossary: state transition testing"
    url: "https://glossary.istqb.org/"
    publisher: "ISTQB"
---

## When input alone doesn't decide the output

Type the correct PIN into a wallet app and you get in. Type the same correct PIN after three wrong attempts and you're refused. The input is identical, but the response differs because the system is in a different **state**.

Equivalence partitioning and decision tables treat each request on its own. They can't express "it depends on what happened before". State transition testing can. It is the right technique whenever a feature has a lifecycle: orders, payments, subscriptions, tickets, accounts, devices, approvals and anything with a status column in the database.

## Building the model

Take a wallet card in a mobile banking app:

- A new card is **Inactive** until the customer activates it.
- An **Active** card can be **Frozen** and unfrozen by the customer at any time.
- Three consecutive wrong PINs move an active card to **Locked**. The customer can unlock it in the app with a one-time password (OTP).
- Any card can be **Closed** permanently.

Drawn as a diagram:

```text
            activate
 Inactive ───────────▶ Active ◀──────────────┐
    │                  │  ▲  │               │ reset with OTP
    │            freeze│  │  │3rd wrong PIN  │
    │                  ▼  │  ▼               │
    │               Frozen  Locked ──────────┘
    │                  │      │
    └──── close ───────┴──────┴──────▶ Closed
```

The same model as a **state table** makes gaps visible. Each row is a state, each column an event, and each cell says what should happen:

| State \ Event | activate | correct PIN | wrong PIN | freeze | unfreeze | reset (OTP) | close |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Inactive | Active | ✗ | ✗ | ✗ | ✗ | ✗ | Closed |
| Active | ✗ | Active (count = 0) | Active, or Locked on the 3rd | Frozen | ✗ | ✗ | Closed |
| Frozen | ✗ | ✗ | ✗ | ✗ | Active | ✗ | Closed |
| Locked | ✗ | ✗ | ✗ | ✗ | ✗ | Active | Closed |
| Closed | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

Every ✗ is an **invalid transition**: an event the state must refuse. A diagram hides these; a table forces you to decide each one. While filling the table, questions appear that the requirement didn't answer. Can a frozen card be locked by wrong PINs, or are PIN attempts blocked while frozen? Does unfreezing reset the counter? Each question is a requirement defect found before any testing.

## Hidden state and guard conditions

"Three consecutive wrong PINs" hides a counter. You can model it in two ways:

- **As states:** Active (0 failures), Active (1), Active (2). Clear, but the diagram grows quickly.
- **As a guard condition** on the transition: wrong PIN [failures < 2] → stays Active; wrong PIN [failures = 2] → Locked.

Either way, the counter has a boundary, so apply boundary value analysis: test 2 failures (still active) and 3 failures (locked). Then test the reset: 2 failures, a correct PIN, then 2 more failures. If the card locks, the counter wasn't reset, which is a defect that only a sequence-aware test can find.

Timers are hidden state too: OTPs that expire, sessions that time out, reservations held for 15 minutes. When you see a duration in a requirement, add the expiry as an event in your model.

## Coverage criteria

Three common levels, from weakest to strongest:

1. **All-states coverage:** every state is visited at least once. Easy to achieve and weak: you can visit every state while skipping most transitions.
2. **Valid-transitions coverage (0-switch coverage):** every valid transition is exercised at least once. This is the usual minimum.
3. **All-transitions coverage:** every valid transition is exercised, and every invalid transition is attempted. This is what you want for anything involving money, security or safety.

Report coverage as a fraction, for example "all 5 states, 9 of 9 valid transitions, 14 of 26 invalid transitions attempted". Saying which invalid transitions were skipped, and why, is what makes the figure honest.

## From model to test cases

A test case for a transition has four parts: the **starting state** (and how to get there), the **event**, the **expected output** and the **expected resulting state**.

| # | Start | Event | Expected output | End state |
| --- | --- | --- | --- | --- |
| 1 | Inactive | activate | "Card ready to use" | Active |
| 2 | Active (2 failures) | wrong PIN | "Card locked. Unlock in the app." | Locked |
| 3 | Locked | correct PIN | "Card locked" (refused) | Locked |
| 4 | Locked | reset with valid OTP | "Card unlocked" | Active (0 failures) |
| 5 | Frozen | wrong PIN | Refused without counting (to be confirmed) | Frozen |
| 6 | Closed | unfreeze | Refused | Closed |

Two practical tips:

- **Confirm the resulting state with the next event.** After test 4, enter a wrong PIN twice more and confirm the card doesn't lock. That proves the counter really reset.
- **Reach starting states efficiently.** Through the UI, getting to "Locked" takes several steps. Ask developers for a test API or seed data that puts a card directly into a given state. This makes tests faster and isolates them from each other.

## Where state defects hide

- **Invalid transitions that succeed:** cancelling a delivered order, refunding a refunded payment, approving your own request.
- **Missing transitions:** no way out of a state, such as a locked account with no reset path.
- **Race conditions:** two events arrive together (the user cancels while a payment confirmation is in flight). Model which one wins, then try to make both happen at once.
- **Late or duplicate events from other systems:** a provider resends a "payment succeeded" webhook after the order was cancelled. The state model must ignore it safely.

Next in this path, pairwise testing tackles a different explosion: not sequences of events, but combinations of settings.
