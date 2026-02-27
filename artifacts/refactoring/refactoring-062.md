---
ticket_id: refactoring-062
priority: P4
status: in-progress
category: TEST-COVERAGE
source: code-review-120b
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

`buildCombatantFromEntity()` in `app/server/services/combatant.service.ts` is a critical function (called by 3 endpoints) with zero unit test coverage. This function handles equipment bonus application, initiative calculation, evasion computation, and stage modifier initialization. The recent immutability fix (commit `a0b1466`) demonstrated the risk — a mutation bug existed because no test asserted that the input entity remains unchanged.

## Affected Files

- `app/server/services/combatant.service.ts` — `buildCombatantFromEntity()` function

## Suggested Tests

1. Input entity is not mutated after call (immutability assertion)
2. Heavy Armor speed default CS (-1) applied to combatant stage modifiers
3. Equipment evasion bonus added to physical/special/speed evasion
4. Equipment DR computed and available on combatant
5. Focus stat bonuses computed correctly
6. Pokemon entities excluded from all equipment logic
7. Non-equipped human entity produces default values

## Impact

Medium — this function is on the critical path for every encounter start. The immutability bug was caught by code review, but a regression test would catch future re-introductions automatically.

## Resolution Log

- **Commit:** `1f42648` — `test: add unit tests for buildCombatantFromEntity()`
- **Files changed:** `app/tests/unit/services/combatant.service.test.ts` (new, 747 lines)
- **Tests added:** 30 tests across 8 describe blocks:
  1. Input entity immutability (4 tests) — Pokemon, human, human w/ Heavy Armor, stageModifiers object ref
  2. Heavy Armor speed CS (3 tests) — CS -1 applied, initiative reduced, other stages unaffected
  3. Equipment evasion bonuses (3 tests) — shield bonus, zero evasion baseline, cap at +6
  4. Equipment DR computation (2 tests) — single armor DR, multiple equipment pieces
  5. Focus stat bonuses (5 tests) — speed initiative, defense evasion, spDef evasion, speed evasion, combined with Heavy Armor
  6. Pokemon excluded from equipment logic (3 tests) — pure stat evasion, pure speed initiative, no stage modification
  7. Non-equipped human defaults (5 tests) — default values, turn state, combat flags, initiative bonus behavior
  8. Combatant output shape (5 tests) — id/type/side, tokenSize, position
- **All 30 tests passing**
