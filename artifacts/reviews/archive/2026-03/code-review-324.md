---
review_id: code-review-324
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-024
domain: testing
commits_reviewed:
  - b3f26f0f
  - d43aafba
  - 23c522f7
files_reviewed:
  - app/tests/unit/services/living-weapon.service.test.ts
  - app/tests/unit/services/living-weapon-state.test.ts
  - app/tests/unit/utils/combatantCapabilities.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
reviewed_at: 2026-03-04T13:45:00Z
follows_up: null
---

## Review Scope

First review of feature-024 (Living Weapon unit test coverage). The developer added 72 unit tests across 3 test files:

1. `living-weapon.service.test.ts` (671 lines, 50 tests) -- meetsSkillRequirement, engage validation/execution, disengage, clearWieldOnRemoval, updateWieldFaintedState, query helpers (findWieldRelationship, isWielded, isWielding)
2. `living-weapon-state.test.ts` (211 lines, 13 tests) -- reconstructWieldRelationships: reconstruction from flags, homebrew fallback, fainted detection, edge cases
3. `combatantCapabilities.test.ts` (89 new lines, 9 new tests) -- getLivingWeaponConfig: known species, homebrew fallback, case-insensitive matching

All ticket requirements from feature-024 are covered. Decree compliance verified: per decree-043, engagement is not gated by Combat Skill Rank -- the engage tests correctly verify engagement succeeds without any rank check, and meetsSkillRequirement is tested in isolation for future P1 move access gating. Per decree-046, No Guard uses +3/-3 flat accuracy -- not directly in scope for these tests, but isNoGuardActive is an untested P2 function that would need its own coverage.

## Issues

### HIGH

**H1: Duplicate `vi.mock('~/utils/equipmentBonuses')` in living-weapon.service.test.ts (dead code)**

File: `app/tests/unit/services/living-weapon.service.test.ts`, lines 17-26 vs 39-49

There are two `vi.mock` calls for `~/utils/equipmentBonuses`. In Vitest, the second call silently overwrites the first. The first mock (lines 17-26) lacks `getEquipmentGrantedCapabilities`, while the second (lines 39-49) includes it. The tests pass because the second mock wins, but the first mock block is dead code that creates confusion about which mock is active.

This is a maintenance hazard: a future developer editing the first mock block would see no effect, leading to wasted debugging time. The fix is trivial -- remove lines 17-26 entirely.

**Fix:** Delete the first `vi.mock('~/utils/equipmentBonuses', ...)` block (lines 17-26).

### MEDIUM

**M1: `clearWieldOnRemoval` test asserts `result.combatants` is the same reference when no relationship exists, but this is an implementation detail**

File: `app/tests/unit/services/living-weapon.service.test.ts`, line 581

```typescript
expect(result.combatants).toBe(combatants) // same reference
```

The test asserts reference equality (`toBe`) to verify the no-op path returns the original array unchanged. While this tests the current optimization (returning the same reference when no relationship exists), it couples the test to an implementation detail. If the function were refactored to always return a new array for consistency, this test would break despite correct behavior.

**Fix:** Change `toBe` to `toEqual` for the combatant array comparison, or add a comment explicitly documenting that reference equality is the intentional contract being tested (i.e., the optimization is part of the API guarantee). Either approach is acceptable.

## What Looks Good

1. **Comprehensive coverage of ticket scope.** All functions listed in feature-024 are tested: meetsSkillRequirement (6 tests including exhaustive rank matrix), engage validation (10 edge cases), engage execution (8 tests including immutability), disengage (8 tests from both sides), clearWieldOnRemoval (4 tests), updateWieldFaintedState (4 tests with immutability), query helpers (6 tests), reconstruction (13 tests), getLivingWeaponConfig (9 tests).

2. **Immutability verification.** Both the service test and state test correctly assert that original combatant arrays and objects are not mutated by operations (lines 389-398, 493-499, 560-568). This is critical for the project's immutable state management pattern.

3. **Fainted detection tested via both paths.** Both HP <= 0 and Fainted status condition triggers are tested in engage execution (lines 370-387), state reconstruction (lines 147-164), and marked as `isFainted: false` when neither condition holds (lines 166-172). Good coverage of the dual-detection logic.

4. **Homebrew species fallback tested.** Both engage (line 400-413) and reconstruction (lines 139-145) test that unknown species default to Honedge config, matching the source logic. The getLivingWeaponConfig tests also cover case-insensitive and whitespace-tolerant matching (lines 1043-1052).

5. **Clean test helper structure.** Each test file defines its own factory functions appropriate to its scope. The living-weapon.service.test.ts helpers are more detailed (full Combatant with entity), while living-weapon-state.test.ts helpers are leaner (only fields needed for reconstruction). This follows the project pattern of minimal test fixtures.

6. **Correct mock strategy.** The adjacency mock defaults to true with per-test override capability. The service mocks (equipmentBonuses, damageCalculation, trainerDerivedStats) correctly isolate the functions under test without pulling in unrelated dependencies.

7. **Decree compliance.** The engage tests verify that no Combat Skill Rank check blocks engagement, consistent with decree-043. The meetsSkillRequirement function is tested in isolation, ready for P1 move injection where rank gating will be applied per decree-043.

## Verdict

**CHANGES_REQUIRED** -- Two issues found. H1 (dead mock code) is a straightforward deletion. M1 (reference equality assertion) needs either a fix or an explicit comment. Both are quick fixes that should take under 5 minutes.

## Required Changes

1. **H1:** Remove the first `vi.mock('~/utils/equipmentBonuses', ...)` block (lines 17-26 of `living-weapon.service.test.ts`). The second block (lines 39-49) is the one that takes effect and includes all needed exports.

2. **M1:** In `clearWieldOnRemoval` test "should return unchanged data if removed combatant has no relationship" (line 581), either change `expect(result.combatants).toBe(combatants)` to `expect(result.combatants).toEqual(combatants)`, or add a comment like `// Intentional: reference equality verifies no-op optimization`.
