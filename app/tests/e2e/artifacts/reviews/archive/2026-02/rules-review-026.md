---
review_id: rules-review-026
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: refactoring-021
domain: combat
commits_reviewed:
  - a9b0c89
mechanics_verified:
  - accuracy-roll-mechanics
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Accuracy-Roll
reviewed_at: 2026-02-18T04:00:00
---

## Review Scope

Reviewed commit `a9b0c89` which deletes the orphaned component `AccuracySection.vue`. The ticket (refactoring-021) identified three findings: DEAD-CODE (component never referenced), EXT-DUPLICATE (duplicate `AccuracyResult` interface), and PTU-INCORRECT (per-target d20 roll bug from refactoring-018).

## Mechanics Verified

### Accuracy Roll Mechanics (in deleted code)

- **Rule:** PTU 1.05 specifies a single accuracy roll per attack: "make **an** Accuracy Roll" (singular, `core/07-combat.md:735-738`). The gameplay example (`core/07-combat.md:2211-2218`) shows one accuracy roll and one damage roll for an AoE move hitting two targets.
- **Implementation (deleted):** `AccuracySection.vue:69-70` called `roll('1d20')` inside a `for...of` loop over `props.targetIds`, producing one roll per target — the exact per-target roll bug fixed by refactoring-018 in `useMoveCalculation.ts`.
- **Status:** CORRECT (deletion is the right action)
- **Notes:** The deleted component was never used (grep for `AccuracySection` and `<AccuracySection>` across all `.vue` files returns zero usage references). `MoveTargetModal.vue` has its own inline accuracy section using the `.accuracy-section` CSS class — this is standalone markup, not a usage of the deleted component. No PTU mechanics were lost by this deletion. The live accuracy logic resides in `useMoveCalculation.ts` which now has the correct single-roll behavior (fixed by refactoring-018).

## Summary

- Mechanics checked: 1
- Correct: 1
- Incorrect: 0
- Needs review: 0

## Rulings

None required. Deleting dead code that contained a known PTU-incorrect implementation (per-target rolls) is strictly beneficial. If the component is ever needed in the future, it should be rebuilt using `useMoveCalculation`'s corrected `rollAccuracy` function.

## Verdict

APPROVED — The deleted component was dead code with zero references. It contained a known PTU-incorrect per-target roll bug (refactoring-018). No live PTU mechanics are affected. The canonical accuracy logic in `useMoveCalculation.ts` is untouched.

## Required Changes

(none)
