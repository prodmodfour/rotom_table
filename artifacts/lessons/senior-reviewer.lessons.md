---
skill: senior-reviewer
last_analyzed: 2026-02-17T13:00:00
analyzed_by: retrospective-analyst
total_lessons: 2
domains_covered:
  - combat
---

# Lessons: Senior Reviewer

## Summary
Two lessons from the refactoring review cycle. L1 addresses a coverage gap found when refactoring expands behavioral scope. L2 is new: framing PTU incorrectness as an "acknowledged limitation" instead of flagging it for the Game Logic Reviewer. The Senior Reviewer's overall performance is strong — it caught real bugs in 5 of 26 reviews, including missed duplicates (code-review-010, 023) and a net-clamp edge case (code-review-020).

---

## Lesson 1: Verify test coverage for behavioral changes in refactoring reviews

- **Category:** process-gap
- **Severity:** medium
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-16 (code-review-005)
- **Status:** active

### Pattern
Code-review-005 reviewed refactoring-006, which expanded `breather.post.ts` from curing 5 volatile conditions to curing 12 (10 volatile + Slowed + Stuck). The reviewer identified that this behavioral expansion had zero test coverage for the 7 newly-curable conditions. The existing `combat-take-a-breather-001.spec.ts` only tested the original 5 conditions. Without the review catch, the expanded breather behavior would have shipped with no verification that the new conditions are actually cleared.

### Evidence
- `artifacts/reviews/code-review-005.md`: HIGH issue — "bug fix has zero test coverage for newly-cured conditions"
- `git diff a95b67e`: Added Slowed+Stuck breather test and fixed stale comment
- `git diff 767e6f3`: Expanded volatile conditions in breather from 5 to 12

### Recommendation
When reviewing refactoring that expands a function's behavioral scope (handles more cases, covers more conditions, processes more input types), check whether test coverage exists for the delta — the newly-handled cases specifically. If tests only cover the pre-refactoring scope, flag it as a HIGH issue requiring at least one test for the new behavior. This applies to:
- Condition lists that grow (breather, capture rate, status clearing)
- Switch/case statements that gain new branches
- Validation functions that accept new input types
- API endpoints that handle new request shapes

---

## Lesson 2: Don't frame PTU incorrectness as "acknowledged limitation"

- **Category:** process-gap
- **Severity:** high
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-17 (code-review-017, refactoring-017)
- **Status:** active

### Pattern
In code-review-017, the Senior Reviewer encountered the `.some()` multi-target crit sharing behavior — where `useMoveCalculation.ts` rolled one d20 per target, inflating crit probability. The review framed this as an "acknowledged limitation" that was "better than the previous behavior (crit for none, ever)." This framing caused the Game Logic Reviewer (rules-review-015) to initially accept the behavior without checking the PTU rulebook, writing "not PTU-incorrect — the rules don't specify multi-target crit mechanics."

The user had to intervene to prompt investigation. The PTU rules DO specify single-roll-per-attack (07-combat.md:735-738, 2206-2218), and refactoring-018 was filed to fix the genuine PTU incorrectness.

### Evidence
- `artifacts/reviews/code-review-017.md`: Framed per-target rolls as "acknowledged limitation"
- `artifacts/reviews/rules-review-015.md`: GLR initially accepted the framing
- `artifacts/refactoring/refactoring-018.md`: Filed after user intervention — genuine PTU-INCORRECT
- `git diff e12a083`: Fixed to single accuracy roll per move use
- User prompt: "Multi-target crit sharing via .some() Is this accurate to PTU? If not, it should obviously be a ticket"

### Recommendation
When a code review encounters behavior that deviates from expected game rules:
1. Never use "acknowledged limitation" or "acceptable tradeoff" framing for PTU mechanics — flag it explicitly as a potential PTU correctness issue
2. If the behavior appears intentionally different from PTU rules, flag it for the Game Logic Reviewer with a specific question: "Is [behavior X] correct per PTU? Cite the relevant rule."
3. The Senior Reviewer's scope is code quality and architecture — PTU rule correctness is exclusively the Game Logic Reviewer's domain. Don't make rulings on PTU mechanics, even informally
4. "Better than before" is not the same as "correct." If a refactoring improves behavior but the result is still PTU-incorrect, the improvement should be noted but a ticket should still be filed
