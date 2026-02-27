---
skill: game-logic-reviewer
last_analyzed: 2026-02-18T18:10:00
analyzed_by: game-logic-reviewer
total_lessons: 4
domains_covered:
  - combat
  - healing
---

# Lessons: Game Logic Reviewer

## Summary
Four lessons from refactoring review cycles. Lesson 1: condition taxonomy audit gaps. Lesson 2: pre-existing issues found during review must always produce a ticket. Lesson 3: never dismiss a mechanic as "acceptable limitation" without verifying the rulebook first. Lesson 4: file tickets inline during the review — never defer to a separate step.

---

## Lesson 1: Audit condition taxonomies against enumerated rulebook lists, not narrative descriptions

- **Category:** process-gap
- **Severity:** high
- **Domain:** combat
- **Frequency:** recurring
- **First observed:** 2026-02-16 (refactoring-006 review cycle)
- **Status:** active

### Pattern
The Game Logic Reviewer verified 7 mechanics in refactoring-006 and approved all as correct. Two pre-existing classification errors in the reviewed code were missed:

1. **Sleep/Asleep is classified as Persistent** in `statusConditions.ts`, but PTU 1.05 p.247 enumerates it under "Volatile Afflictions." The Persistent section mentions sleeping Pokemon (describing waking mechanics), which likely caused the original misclassification — the narrative description was read instead of the enumerated list. This misclassification causes three incorrect behaviors: Take a Breather won't cure Sleep (it should), capture rate gives +10 instead of +5, Poke Ball recall won't clear Sleep (it should).

2. **Encored, Taunted, Tormented are listed as conditions** but don't exist in PTU 1.05. The actual moves (Encore, Taunt, Torment) inflict existing conditions (Confused, Suppressed, Enraged respectively). These phantom conditions appear in the type system, UI picker, and capture rate calculations.

Both errors were caught by the user reviewing the rules-review-005 output, leading to refactoring-008 and refactoring-009 being filed.

### Evidence
- `artifacts/reviews/rules-review-005.md`: APPROVED with 7/7 CORRECT, then user identified both errors post-approval
- `artifacts/refactoring/refactoring-008.md`: Sleep misclassification (PTU-INCORRECT)
- `artifacts/refactoring/refactoring-009.md`: Phantom conditions (PTU-INCORRECT)
- Conversation transcripts (session c5a32736): User stated "Sleep/Asleep is classified as Persistent in the code but is actually Volatile per p.247"
- PTU 1.05 p.247: Volatile Afflictions enumerated list includes Bad Sleep, Good Sleep

### Recommendation
When reviewing code that contains PTU condition taxonomies (persistent vs volatile vs other), do not rely on the rulebook's narrative descriptions to verify correctness. Instead, enumerate all conditions from the canonical lists on PTU p.246-247 and cross-reference against the code's arrays. Specifically:
1. Read the enumerated Persistent Afflictions list (Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned) — anything else classified as Persistent is an error
2. Read the enumerated Volatile Afflictions list (Bad Sleep, Good Sleep, Confused, Cursed, Disabled, Enraged, Flinched, Infatuated, Rage, Suppressed, Tripped, Vulnerable) — verify all are present in the code's volatile array
3. Check for conditions in the code that don't appear in either PTU list — these are either app-specific extensions (document them) or phantom data (remove them)

---

## Lesson 2: Always file a ticket for pre-existing issues — never leave them as "observations"

- **Category:** process-gap
- **Severity:** high
- **Domain:** all
- **Frequency:** first occurrence
- **First observed:** 2026-02-16 (refactoring-003 review cycle, rules-review-009)
- **Status:** active

### Pattern
During rules-review-009 (refactoring-003), the Game Logic Reviewer identified that all three combatant creation sites compute initial evasion without the PTU-mandated +6 cap (`Math.min(6, ...)`). The initial review artifact labeled this as a "Pre-Existing Observation" and said "Track separately. Not a regression from this refactoring." No ticket was created. The user had to intervene and instruct the reviewer to file refactoring-012.

The reasoning that led to the omission: "This is pre-existing, not introduced by these commits, so it's outside the review scope." This is wrong. Finding an issue and not creating a ticket means the issue gets lost. A review artifact's "observations" section is not tracked — it's not in the pipeline state, not in the open tickets list, not assigned to anyone. It will never be acted on unless someone re-reads the review.

### Evidence
- `artifacts/reviews/rules-review-009.md`: Initially contained "Pre-Existing Observation" section with no associated ticket
- User instruction: "you shouldn't ignore stuff like this. always make a ticket"
- `artifacts/refactoring/refactoring-012.md`: Ticket created after user intervention (PTU-INCORRECT, P2, evasion cap missing at 3 sites)

### Recommendation
When a rules review finds ANY PTU incorrectness — whether introduced by the reviewed commits or pre-existing in the touched code — always create a refactoring ticket immediately. The review verdict can still be APPROVED (the refactoring itself didn't introduce the issue), but the ticket ensures the issue enters the tracked pipeline.

Specifically:
1. If the issue is **introduced by the reviewed commits** → verdict CHANGES_REQUIRED, file ticket
2. If the issue is **pre-existing but in code touched by the review** → verdict APPROVED, file ticket as PTU-INCORRECT
3. If the issue is **pre-existing in untouched code discovered incidentally** → verdict APPROVED, file ticket as PTU-INCORRECT
4. **Never** use language like "noted for separate tracking" or "track separately" without actually creating the ticket in the same review session

---

## Lesson 3: Never dismiss a mechanic as "acceptable limitation" without verifying the rulebook

- **Category:** process-gap
- **Severity:** high
- **Domain:** combat
- **Frequency:** first occurrence
- **First observed:** 2026-02-17 (refactoring-017 review, rules-review-015)
- **Status:** active

### Pattern
During rules-review-015 (refactoring-017, critical hit damage), the Game Logic Reviewer encountered the `.some()` multi-target crit sharing behavior. The code review (code-review-017) had framed this as an "acknowledged limitation" that was "better than the previous behavior (crit for none, ever)." The Game Logic Reviewer accepted this framing without looking up the PTU rules on multi-target accuracy, writing in the initial review: "not PTU-incorrect — the rules don't specify multi-target crit mechanics for this edge case."

This was wrong. The PTU rules DO specify multi-target accuracy mechanics:
- 07-combat.md:735-738: "make **an** Accuracy Roll" (singular per attack)
- 07-combat.md:2211-2218: Gameplay example shows one accuracy roll and one damage roll for an AoE move (Acid, Cone 2) hitting two targets

The app rolls one d20 per target instead of one per move use, causing crit probability to scale with target count (14.3% for 3 targets vs. correct 5%). The user had to prompt the reviewer to investigate before the issue was found and refactoring-018 was filed.

### Root cause
The reviewer deferred to another skill's judgment on a PTU mechanics question. The Senior Reviewer's "acknowledged limitation" framing was taken as authoritative, but PTU rule correctness is exclusively the Game Logic Reviewer's scope. The phrase "the rules don't specify" was written without actually searching the rulebook.

### Evidence
- `artifacts/reviews/rules-review-015.md`: Initial version contained "not PTU-incorrect" for multi-target crit sharing
- User prompt: "Multi-target crit sharing via .some() Is this accurate to PTU? If not, it should obviously be a ticket"
- PTU 07-combat.md:735-738 and 2211-2218: Clear single-roll-per-attack model
- `artifacts/refactoring/refactoring-018.md`: Ticket filed after user intervention

### Recommendation
When a review encounters ANY behavioral note about PTU mechanics — whether framed as a "limitation," "tradeoff," "edge case," or "out of scope" — the Game Logic Reviewer MUST:

1. **Search the rulebook** for the relevant mechanic before accepting or dismissing it
2. **Never write "the rules don't specify"** without having actually searched — absence of evidence is not evidence of absence
3. **Never defer to other skills** (Senior Reviewer, code review, ticket description) on PTU correctness questions — that is exclusively this skill's domain
4. **Treat "acknowledged limitation" as a red flag** — if someone acknowledged a limitation in PTU behavior, that means they knew it was wrong and chose not to fix it. Verify whether the limitation is actually acceptable per the rules

---

## Lesson 4: File tickets inline during the review — never defer to a separate step

- **Category:** process-gap
- **Severity:** medium
- **Domain:** all
- **Frequency:** first occurrence
- **First observed:** 2026-02-18 (rules-review-029, refactoring-024/026)
- **Status:** active

### Pattern
During rules-review-029, the Game Logic Reviewer correctly identified a pre-existing MEDIUM issue (Asleep mislabeled as persistent in `HealingTab.vue` extended rest description text) and documented it in the review artifact's "Pre-Existing Issues" section. However, the reviewer did not file a ticket in the same pass — the ticket was only created after the user explicitly requested it.

This is a partial recurrence of Lesson 2's pattern. The reviewer correctly identified the issue and documented it (improvement over Lesson 2's "observation" pattern), but still required user intervention to create the actual ticket. Lesson 2 says "always create a refactoring ticket immediately" — "immediately" means in the same review session, not as a follow-up.

### Evidence
- `artifacts/reviews/rules-review-029.md`: Review identified the issue, wrote "Ticket recommended" but did not create the ticket
- User instruction: "File a ticket for the Asleep UI text issue, do this proactively in future"
- `artifacts/tickets/ptu-rule/ptu-rule-029.md`: Ticket created after user intervention

### Recommendation
When a rules review identifies ANY PTU incorrectness (including pre-existing issues in touched code), file the ticket **in the same tool-call batch as writing the review artifact**. The review artifact and the ticket should be created together, not sequentially. Specifically:
1. Write the review artifact with the finding documented
2. Write the ticket in the same pass — do not write "Ticket recommended" and wait
3. Reference the ticket ID in the review artifact's findings section
4. This applies to all severity levels — MEDIUM and LOW issues get lost just as easily as HIGH ones if not ticketed
