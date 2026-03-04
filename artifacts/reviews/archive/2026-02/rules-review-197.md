---
review_id: rules-review-197
review_type: rules
reviewer: game-logic-reviewer
trigger: re-review
target_report: ptu-rule-107
domain: combat
commits_reviewed:
  - 9a2b7e2
  - 96aee22
  - 3e23317
  - 67a7d39
  - 35d69b9
mechanics_verified:
  - skip-fainted-trainer-test-correctness
  - skip-undeclared-trainer-test-correctness
  - declaration-progress-counter-accuracy
  - decree-021-compliance
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Page 227 (Initiative - League Battles)
reviewed_at: 2026-02-28T13:25:00Z
follows_up: rules-review-193
---

## Review Scope

Re-review of the P1 fix cycle for ptu-rule-107. The previous rules-review-193 APPROVED all 13 game mechanics for the P1 implementation. This re-review verifies that the fix cycle commits (addressing code-review-217 issues) do not introduce any PTU rule violations or decree non-compliance.

The fix cycle contains:
- 9a2b7e2: Unit tests for skip functions (tests only -- no game logic changes)
- 96aee22: SCSS variable replacement (styling only -- no game logic changes)
- 3e23317: Declaration progress counter denominator fix (UI display only)
- 67a7d39: app-surface.md documentation update (docs only)
- 35d69b9: Ticket resolution log update (docs only)

**Decrees verified:**
- decree-021: Two-phase trainer system. No changes to phase transitions, turn ordering, or declaration/resolution mechanics. Still fully compliant.
- decree-006: Dynamic initiative reorder. Not modified.

## Mechanics Verified

### 1. Skip Fainted Trainer Test Correctness

The 3 new test cases for `skipFaintedTrainers` correctly model the PTU rule that fainted trainers (0 HP) cannot take actions and should be skipped during declaration:

- **Single skip:** Trainer at 0 HP is bypassed, next alive trainer (HP > 0) gets to declare. Correct per PTU -- a fainted combatant cannot act.
- **Multi-skip:** Multiple consecutive fainted trainers are all bypassed. The while-loop in `skipFaintedTrainers` correctly advances past all fainted trainers until finding an alive one. Correct per PTU.
- **All-fainted cascade:** When all trainers are fainted, the index goes past `turnOrder.length`, triggering the phase transition to pokemon. Correct per PTU -- if no trainers can act, proceed to pokemon phase.

The test helper `skipFaintedTrainers` in the test file uses the same HP check (`combatant.entity.currentHp > 0`) as the production code. The `createTrainerCombatant` factory's `currentHp` parameter (default 100) correctly models both alive and fainted states.

**Status:** CORRECT

### 2. Skip Undeclared Trainer Test Correctness

The 4 new test cases for `skipUndeclaredTrainers` correctly model the rule that trainers with no declaration have nothing to resolve:

- **Undeclared skip:** A trainer who was fainted during declaration (and therefore has no declaration entry) is skipped during resolution. Correct -- you cannot resolve an action that was never declared.
- **All-undeclared cascade:** When no declarations exist for any trainer, all are skipped and the phase transitions to pokemon. Correct -- nothing to resolve.
- **Declared trainer not skipped:** A trainer with a valid declaration for the current round is NOT skipped. This verifies the function's positive case -- declared trainers MUST resolve.
- **Round boundary guard:** Declarations from round 1 are not matched when checking round 2. This prevents stale declarations from a previous round from keeping a trainer in the resolution queue. Correct -- declarations are per-round, per decree-021's "per round" cycle.

The test helper `skipUndeclaredTrainers` uses the same declaration-matching logic (`d.combatantId === combatantId && d.round === currentRound`) as the production code.

**Status:** CORRECT

### 3. Declaration Progress Counter Accuracy

The fix (commit 3e23317) filters fainted trainers from the denominator:

```typescript
const aliveTrainers = trainers.filter(t => (t.entity as { currentHp: number }).currentHp > 0)
return `${declared + 1} of ${aliveTrainers.length}`
```

This is a UI display fix with no impact on game mechanics. The progress counter now accurately reflects the number of trainers who will actually declare. Previously, it showed (e.g.) "2 of 4" when only 3 trainers were alive, which was misleading. Now it correctly shows "2 of 3".

The numerator (`declared + 1`) is still correct because fainted trainers never produce declarations (they are auto-skipped by `skipFaintedTrainers` in `next-turn.post.ts`), so `encounterStore.currentDeclarations.length` only counts alive trainers' declarations.

**Status:** CORRECT (UI accuracy improvement, no rule impact)

### 4. Decree-021 Compliance

The fix cycle makes no changes to:
- Phase transition logic (declaration -> resolution -> pokemon)
- Turn order direction (low-to-high for declaration, high-to-low for resolution)
- Declaration recording or execution mechanics
- Resolution action economy or turn state management

All changes are either tests, styling, UI display accuracy, or documentation. The two-phase trainer system mandated by decree-021 remains fully intact and correctly implemented.

**Status:** COMPLIANT

## Summary

The fix cycle contains zero game logic changes. The unit tests correctly model PTU mechanics for fainted-trainer skipping and undeclared-trainer skipping. The progress counter fix improves UI accuracy without affecting any game rules. All 13 mechanics verified in rules-review-193 remain correct and unchanged.

## Verdict

**APPROVED** -- No PTU rule violations or decree non-compliance introduced by the fix cycle. All test cases correctly model the expected PTU behavior. The P1 implementation of ptu-rule-107 is rules-compliant.

## Required Changes

None.
