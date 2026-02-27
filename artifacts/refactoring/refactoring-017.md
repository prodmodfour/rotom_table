---
ticket_id: refactoring-017
priority: P1
categories:
  - PTU-INCORRECT
affected_files:
  - app/utils/diceRoller.ts
  - app/composables/useMoveCalculation.ts
estimated_scope: small
status: resolved
created_at: 2026-02-16T23:00:00
filed_by: rules-review-013
---

## Summary

Critical hits are cosmetically detected (natural 20 on accuracy roll) but deal normal damage in the GM UI move workflow. Two independent bugs combine to make the critical hit damage mechanic completely non-functional on the client side.

The server-side `utils/damageCalculation.ts:calculateDamage()` handles critical hits correctly via set damage doubling and is exercised by e2e tests. This ticket affects only the client-side GM UI damage path.

## Findings

### Finding 1: PTU-INCORRECT — `rollCritical` does not double the flat modifier

- **File:** `app/utils/diceRoller.ts:109`
- **Code:** `const total = diceSum + parsed.modifier`
- **Rule:** PTU 07-combat.md:800-804 — "A Critical Hit adds the Damage Dice Roll a second time to the total damage dealt... a DB6 Move Crit would be 4d6+16+Stat"
- **Bug:** For DB6 (2d6+8), the function rolls 4d6 but only adds +8 instead of +16. The flat modifier from the dice notation should be doubled along with the dice.
- **Fix:** Change to `const total = diceSum + (parsed.modifier * 2)` on line 109.

### Finding 2: PTU-INCORRECT — Critical hit flag never passed to damage roll

- **File:** `app/composables/useMoveCalculation.ts:322`
- **Code:** `damageRollResult.value = rollDamageBase(effectiveDB.value, false)`
- **Bug:** The `isNat20` flag from accuracy results (line 139) is detected and stored, but the `rollDamage()` function hardcodes the critical parameter to `false`. Even if Finding 1 were fixed, critical hits would still deal normal damage.
- **Fix:** Pass the critical hit flag from accuracy results to `rollDamageBase`. This requires the `rollDamage()` function to know which target's accuracy result to check (currently it applies to all targets).

## Impact

Every rolled-damage critical hit in the GM UI deals less damage than PTU rules specify. In set damage mode, the `calculateDamage` function in `useDamageCalculation.ts` correctly doubles set damage for crits, but Finding 2 means this path is also never triggered from the move workflow.

The server-side damage calculator (`utils/damageCalculation.ts`) is correct and is what e2e tests exercise.

## Suggested Fix

1. Fix `rollCritical` to double the modifier: `parsed.modifier * 2`
2. Thread the `isNat20` flag from `accuracyResults` through to `rollDamage` / damage calculation
3. Add unit tests for `rollCritical` verifying the worked example: DB6 crit = 4d6+16

Estimated commits: 2 (one per finding)

## Resolution Log

### Commit 1: `db8b0b6` — Finding 1 fix
- **File:** `app/utils/diceRoller.ts`
- **Change:** `rollCritical` now doubles the flat modifier (`parsed.modifier * 2`) along with the dice. Breakdown string updated to show the doubled value.

### Commit 2: `91e2e0d` — Finding 2 fix
- **Files:** `app/composables/useMoveCalculation.ts`
- **Change:** Added `isCriticalHit` computed that checks if any hit target scored a nat 20. `rollDamage()` now passes this flag to `rollDamageBase` instead of hardcoding `false`. Exposed `isCriticalHit` in composable return.

### Commit 3: `6d0860c` — Test update
- **File:** `app/tests/unit/utils/diceRoller.test.ts`
- **Change:** Updated `rollCritical` test from "adds modifier only once" (wrong) to "doubles the flat modifier along with dice" — DB6 crit with all dice=4 now expects 32 (4+4+4+4+16) instead of 24.

**Test status:** 25/25 diceRoller tests pass. Pre-existing settings test failure unrelated.
