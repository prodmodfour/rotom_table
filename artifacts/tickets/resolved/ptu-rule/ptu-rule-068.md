---
ticket_id: ptu-rule-068
priority: P2
status: resolved
domain: combat
source: rules-review-067, code-review-077
created_at: 2026-02-20
created_by: orchestrator
severity: HIGH
affected_files:
  - app/composables/useGridMovement.ts
---

## Summary

Speed Combat Stage movement modifier uses multiplicative stat table instead of PTU's additive movement rule.

## PTU Rule Reference

PTU 1.05 p.234: "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down." Minimum floor of 2 per PTU p.700.

## Expected Behavior

Speed CS +6 on Overland 5 should yield 5 + 3 = 8 (additive). Minimum floor is 2.

## Current Behavior

Uses `getSpeedStageMultiplier()` which applies the stat multiplier table (x0.4 at -6 through x2.2 at +6). Speed CS +6 on Overland 5 yields 5 x 2.2 = 11 (wrong). Minimum floor is 1 (should be 2).

## Fix

Replace multiplicative stage multiplier with additive `Math.floor(stage / 2)`. Set minimum floor to 2.

## Resolution Log

- **Commit:** `9f2fe2b` — Replaced `getSpeedStageMultiplier()` (multiplicative stat table) with additive `Math.floor(clamped / 2)` bonus/penalty. Added `Math.max(modifiedSpeed, 2)` guard for negative CS per PTU 1.05 p.700. Removed the now-unused `getSpeedStageMultiplier` function entirely.
- **Duplicate code path check:** Searched entire `app/` for all code paths using `getSpeedStageMultiplier` or applying speed stage to movement. Confirmed it was only used in `applyMovementModifiers()`. The stat multiplier table in `useCombat.ts`/`damageCalculation.ts` is a separate concern (evasion calculation, not movement).
- **Awaiting:** Code review and test verification before marking done.

### 2026-02-20 — Rules review (rules-review-072) found HIGH issue with rounding

**Issue:** The fix uses `Math.floor(clamped / 2)` which produces asymmetric results for negative odd Speed CS values. PTU says "Being at a negative Combat Stage reduces your movement equally" — "equally" means the magnitude should match the positive counterpart. `Math.floor(-5/2) = -3` but `Math.floor(5/2) = 2`. The symmetric result for -5 should be -2 (same magnitude as +5's +2).

**Required fix:** Replace `Math.floor(clamped / 2)` with `Math.trunc(clamped / 2)`. `Math.trunc` rounds toward zero for both positive and negative values, producing symmetric results: +5→+2, -5→-2, +1→0, -1→0.

**Practical impact:** At CS -1, -3, or -5, the combatant loses 1 more movement than they should. For a base-5 Overland combatant at CS -1, the speed becomes 4 instead of the correct 5.

**PTU ref:** "reduces your movement equally" (core/07-combat.md, line 699-700).

### 2026-02-20 — Math.trunc fix applied

- **Commit:** `ca0ea5c` — Replaced `Math.floor(clamped / 2)` with `Math.trunc(clamped / 2)` in `applyMovementModifiers()`. This produces symmetric results for positive and negative Speed CS values: +1/−1 both give 0 bonus/penalty, +3/−3 both give magnitude 1, +5/−5 both give magnitude 2.
- **Tests:** 38 unit tests added in `app/tests/unit/composables/useGridMovement.test.ts` including 3 explicit symmetry tests (CS +1 vs -1, CS +3 vs -3, CS +5 vs -5) that verify equal magnitude for positive/negative counterparts.
- **Awaiting:** Code review and test verification before marking done.
