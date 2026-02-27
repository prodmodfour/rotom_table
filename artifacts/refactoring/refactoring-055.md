---
ticket_id: refactoring-055
priority: P3
status: resolved
category: EXT-DUPLICATE
source: code-review-112
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

`calculateEvasion` is duplicated in both `app/composables/useCombat.ts` and `app/utils/damageCalculation.ts` with identical logic. Consolidate into a single canonical location.

## Affected Files

- `app/composables/useCombat.ts` — `calculateEvasion()` (lines ~64-70)
- `app/utils/damageCalculation.ts` — `calculateEvasion()` (lines ~102-108)

## Suggested Fix

Keep the utility version in `damageCalculation.ts` (pure function, no Vue dependencies) and have `useCombat.ts` import and re-export or call it directly. Both compute `min(6, floor(applyStageModifier(baseStat, combatStage) / 5))`.

## Resolution Log

**Resolved:** 2026-02-20
**Commit:** `0de9094` — `refactor: deduplicate calculateEvasion — import from damageCalculation.ts`

### What changed

1. **`app/composables/useCombat.ts`** — Removed the local `calculateEvasion` arrow function and its 17-line comment block. Added `import { calculateEvasion } from '~/utils/damageCalculation'` at the top. The composable's return object still exposes `calculateEvasion` (now the imported reference), so all consumers are unaffected.

2. **No other files required changes.** The only non-test consumers of `calculateEvasion` are:
   - `app/server/api/encounters/[id]/calculate-damage.post.ts` — already imports from `~/utils/damageCalculation`
   - `app/composables/useMoveCalculation.ts` — uses the wrapper aliases (`calculatePhysicalEvasion`, etc.) from `useCombat()`, which now delegate to the imported function
   - `app/tests/unit/composables/useCombat.test.ts` — destructures `calculateEvasion` from `useCombat()`, which still works identically

### Verification

- All 35 `useCombat.test.ts` tests pass (including 4 `calculateEvasion` tests and 3 evasion alias tests)
- All 608 unit tests across 21 test files pass with zero regressions
- Pure refactoring — zero behavior change
