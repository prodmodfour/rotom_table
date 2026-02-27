---
ticket_id: refactoring-016
priority: P1
categories:
  - TEST-STALE
affected_files:
  - app/tests/unit/composables/useCombat.test.ts
estimated_scope: medium
status: resolved
created_at: 2026-02-16T23:30:00
origin: code-review-015
---

## Summary

`useCombat.test.ts` (29 tests) does not import or exercise the actual composable code. Instead, it re-implements every function locally at the top of the file with **different formulas**, then tests those local copies. The tests pass but provide zero regression coverage for the real composable.

## Findings

### Finding 1: TEST-STALE — Stage multipliers use mainline Pokemon values, not PTU

- **Test file:** `app/tests/unit/composables/useCombat.test.ts:7-21`
- **Test values:** `{-6: 0.25, -5: 0.28, -4: 0.33, -3: 0.40, -2: 0.50, -1: 0.67, 0: 1.0, 1: 1.5, 2: 2.0, 3: 2.5, 4: 3.0, 5: 3.5, 6: 4.0}`
- **Actual composable:** `{-6: 0.4, -5: 0.5, -4: 0.6, -3: 0.7, -2: 0.8, -1: 0.9, 0: 1.0, 1: 1.2, 2: 1.4, 3: 1.6, 4: 1.8, 5: 2.0, 6: 2.2}` (PTU 1.05 rules)
- **Impact:** Every stage-dependent test assertion is verifying the wrong multipliers. Stage +1 test expects `150` (1.5x), actual composable returns `120` (1.2x).

### Finding 2: TEST-STALE — Type effectiveness uses 2x/0.5x, not PTU 1.5x/0.5x

- **Test file:** `app/tests/unit/composables/useCombat.test.ts:54-73`
- **Test values:** Super effective = `2`, e.g., `Fire: { Grass: 2, Ice: 2, Bug: 2, ... }`
- **Actual composable (`useTypeChart.ts`):** Super effective = `1.5`, e.g., `Fire: { Grass: 1.5, Ice: 1.5, Bug: 1.5, ... }`
- **Impact:** All type effectiveness test assertions are verifying mainline Pokemon multipliers, not PTU multipliers.

### Finding 3: TEST-STALE — calculateSetDamage uses wrong formula

- **Test file:** `app/tests/unit/composables/useCombat.test.ts:31-51`
- **Test formula:** `damage = (attackStat + damageBase) × STAB × effectiveness × crit` — simple multiplication
- **Actual composable (`useDamageCalculation.ts`):** Uses damage base chart lookup (`damageBaseChart[DB].set[1]`), adds attack stat, subtracts defense stat, applies effectiveness — completely different pipeline
- **Impact:** The `calculateSetDamage` test suite verifies a formula that doesn't exist anywhere in the codebase.

### Finding 4: TEST-STALE — getHealthStatus missing 'fainted' state

- **Test file:** `app/tests/unit/composables/useCombat.test.ts:100-104`
- **Test signature:** Returns `'healthy' | 'warning' | 'critical'` (3 states)
- **Actual composable:** Returns `'healthy' | 'warning' | 'critical' | 'fainted'` (4 states, `fainted` when `percentage <= 0`)
- **Impact:** The `fainted` state has no unit test coverage.

## Root Cause

The test file was likely written early in development when the formulas matched mainline Pokemon games, then never updated when the composable was corrected to use PTU 1.05 rules. Because the tests duplicate logic locally rather than importing from the composable, they silently diverged.

## Suggested Refactoring

1. **Rewrite tests to import from actual composables.** The composables are pure functions with no Vue reactivity dependencies — they can be imported directly in Vitest without mocks.
2. **Split into three test files** matching the new composable structure:
   - `useCombat.test.ts` — stages, HP, evasion, initiative, health, injury, XP, accuracy, movement
   - `useDamageCalculation.test.ts` — damage base chart, set/rolled damage, full calculation pipeline
   - `useTypeChart.test.ts` — type effectiveness, immunities, STAB
3. **Update all expected values** to match PTU 1.05 rules (1.5x super effective, PTU stage multipliers, chart-based damage).
4. **Add the `fainted` state** to `getHealthStatus` tests.

Estimated commits: 3 (one per test file)

## Resolution Log
- Commits: a4dd634, 35e7acc, bf5cb7a
- Files changed: `app/tests/unit/composables/useCombat.test.ts` (rewritten — 174 added, 211 removed)
- New files created: `app/tests/unit/composables/useTypeChart.test.ts`, `app/tests/unit/composables/useDamageCalculation.test.ts`
- Tests passing: 78/78 (was 29 — all tested wrong values). Breakdown: useCombat 35, useTypeChart 24, useDamageCalculation 19
- All four findings resolved:
  - F1: Stage multipliers now use PTU 1.05 values (1.2x at +1, not 1.5x)
  - F2: Type effectiveness uses PTU 1.5x super effective (not 2x)
  - F3: Damage tests use real chart-based pipeline (DB lookup + attack - defense)
  - F4: `fainted` state added to getHealthStatus tests
