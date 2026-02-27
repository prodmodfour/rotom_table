---
review_id: code-review-019
target: refactoring-016
reviewer: senior-reviewer
verdict: APPROVED
date: 2026-02-17T06:20:00
commits_reviewed:
  - a4dd634
  - 35e7acc
  - bf5cb7a
  - 47eacea
files_reviewed:
  - app/tests/unit/composables/useTypeChart.test.ts (new — 150 lines)
  - app/tests/unit/composables/useDamageCalculation.test.ts (new — 154 lines)
  - app/tests/unit/composables/useCombat.test.ts (rewritten — 174 added, 211 removed)
  - app/tests/e2e/artifacts/refactoring/refactoring-016.md (resolution log)
scenarios_to_rerun: []
---

## Summary

Refactoring-016 rewrites the unit test suite for the three combat composables (`useCombat`, `useDamageCalculation`, `useTypeChart`). The old `useCombat.test.ts` reimplemented every function locally with wrong formulas (mainline Pokemon multipliers instead of PTU 1.05), then tested those local copies. 29 tests passed but provided zero regression coverage.

The fix splits into three test files matching the composable structure, imports from actual composables, and corrects all expected values to PTU 1.05 rules. 78 tests now pass with real coverage.

## Findings Verification

All four ticket findings resolved:

| Finding | Old Value | Corrected Value | Verified |
|---------|-----------|-----------------|----------|
| F1: Stage multipliers | +1 = 1.5x (mainline) | +1 = 1.2x (PTU) | Yes — matches `useCombat.ts:11-24` |
| F2: Type effectiveness | SE = 2x (mainline) | SE = 1.5x (PTU) | Yes — matches `useTypeChart.ts:13-32` |
| F3: Damage formula | `attack + DB × mods` (invented) | Chart lookup + attack − defense (PTU) | Yes — matches `useDamageCalculation.ts:95-132` |
| F4: Missing fainted state | 3 states (healthy/warning/critical) | 4 states (+fainted at ≤0%) | Yes — matches `useCombat.ts:99-104` |

## Value Verification (Spot Checks)

I verified every test assertion against the source composable. Key spot checks:

- **Stage +6**: test expects `220` → `100 * 2.2 = 220` ✓
- **Stage -6**: test expects `40` → `100 * 0.4 = 40` ✓
- **Floor behavior**: test expects `applyStageModifier(75, -1) = 67` → `75 * 0.9 = 67.5 → floor = 67` ✓
- **DB 8 avg**: test expects `19` → chart `[12, 19, 26]` ✓
- **STAB as +2 DB**: test expects DB 6 + STAB → DB 8 avg 19 → `19 + 20 - 10 = 29` ✓
- **Critical doubles chart damage**: test expects `15 + 15 = 30` baseDamage ✓
- **Effectiveness after defense**: test expects `(15 + 20 - 10) × 1.5 = 37.5 → floor 37` ✓
- **Min damage enforcement**: DB 1, attack 1, defense 100 → `5 + 1 - 100 = -94 → clamp 1` ✓
- **Dual type**: Fire → Grass/Steel = `1.5 × 1.5 = 2.25` ✓
- **Evasion with bonus exceeds cap**: stat 25 → `5`, bonus +2 → `7` (cap is on stat portion only) ✓
- **Evasion with combat stages**: stat 25, stage -1 → `floor(22.5) = 22 → 22/5 = 4.4 → floor 4` ✓
- **HP markers**: `previousHp=60, currentHp=40, maxHp=100` → crosses 50% marker ✓
- **Accuracy evasion cap**: evasion 15 → `min(9, 15) = 9` → `2 - 0 + 9 = 11` ✓

All assertions match composable logic exactly.

## Test Run

```
78 passed (78) across 3 files
  useCombat.test.ts: 35 tests
  useTypeChart.test.ts: 24 tests
  useDamageCalculation.test.ts: 19 tests
Duration: 1.69s
```

## Commit Structure

| Commit | Scope | Assessment |
|--------|-------|------------|
| `a4dd634` | New `useTypeChart.test.ts` (24 tests) | Clean — single file, good scope |
| `35e7acc` | New `useDamageCalculation.test.ts` (19 tests) | Clean — single file, good scope |
| `bf5cb7a` | Rewrite `useCombat.test.ts` (35 tests) | Clean — removes all local copies, imports real composable |
| `47eacea` | Mark ticket resolved | Clean — resolution log is accurate |

Commit granularity follows the ticket's suggestion (one per test file) and each commit is a working state.

## What Looks Good

- **Zero local reimplementations** — every test imports from the actual composable. This was the core problem and it's fully fixed.
- **Good edge case coverage** — clamping, floor behavior, minimum damage, evasion cap vs bonus stacking, negative evasion bonus, immunity cancelling super effective on dual types.
- **Injury system tests are thorough** — massive damage, crossing 50%, crossing 0%, staying above marker, staying between markers.
- **New coverage** not in old file: `calculatePokemonMaxHP`, `calculateTrainerMaxHP`, `calculateEvasion` (+ aliases), `checkForInjury`, `getAccuracyThreshold`, `calculateMaxActionPoints`, `calculateMovementModifier`, `calculateEffectiveMovement`. Significant net gain.
- **Resolution log** is accurate — counts match, findings enumerated.

## Notes

- `calculateInitiative` was tested in the old file (3 tests with wrong signature) but dropped in the rewrite. The real function takes `(entity: Pokemon | HumanCharacter, bonus)` which requires entity fixtures. The core math (`applyStageModifier(speed, stages) + bonus`) IS tested through `applyStageModifier`. Acceptable for a "fix stale tests" ticket.
- `canAct` is untested — was never tested before, not a regression.

## Verdict

**APPROVED** — All four findings resolved. 78 tests passing with real composable imports. PTU values verified correct throughout. No issues found.
