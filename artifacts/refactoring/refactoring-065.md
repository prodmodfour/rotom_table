---
ticket_id: refactoring-065
category: EXT-DUPLICATE
priority: P4
status: resolved
domain: combat
source: code-review-125 M1
created_by: slave-collector (plan-20260221-071325)
created_at: 2026-02-21
---

# refactoring-065: Extract shared evasion computation helper in useMoveCalculation

## Summary

`getTargetEvasion()` and `getTargetEvasionLabel()` in `useMoveCalculation.ts` share identical 12-line blocks for Focus bonus extraction from equipment. The duplication was expanded from 4 lines to 12 lines by the ptu-rule-077 Focus bonus fix. Both functions perform identical target lookup, stage extraction, evasion bonus computation, and Focus bonus extraction — they differ only in return type (number vs string label).

## Affected Files

- `app/composables/useMoveCalculation.ts` (lines 201-212 and 248-259)

## Suggested Fix

Extract a shared helper that computes all three evasion values (physical, special, speed) including Focus bonuses. Then:
- `getTargetEvasion()` returns the relevant max value
- `getTargetEvasionLabel()` returns the formatted label

## Impact

- **Extensibility:** Any future change to Focus or evasion handling must be synchronized across both functions. With 6 duplicated local variables (`focusDefBonus`, `focusSpDefBonus`, `focusSpeedBonus` x2), this is error-prone.

## Resolution Log

- **Commit:** 7489587
- **Files changed:** `app/composables/useMoveCalculation.ts`
- **Fix:** Extracted `computeTargetEvasions(target)` helper that computes all three evasion values (physical, special, speed) including Focus bonuses and equipment evasion. Both `getTargetEvasion()` and `getTargetEvasionLabel()` now delegate to this shared helper, eliminating the duplicated 12-line blocks.
