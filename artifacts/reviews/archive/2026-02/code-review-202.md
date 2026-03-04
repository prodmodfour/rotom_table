---
review_id: code-review-202
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-107
domain: combat
commits_reviewed:
  - 11a42f3
  - 8a3e507
  - b90f089
  - 06bcb11
  - 9418d96
files_reviewed:
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/[id]/declare.post.ts
  - app/server/services/encounter.service.ts
  - app/stores/encounter.ts
  - app/types/combat.ts
  - app/tests/unit/api/league-battle-phases.test.ts
  - .claude/skills/references/app-surface.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-107.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-27T20:30:00Z
follows_up: code-review-198
---

## Review Scope

Re-review of ptu-rule-107 fix cycle addressing all 4 issues from code-review-198 (CHANGES_REQUIRED). The fix cycle consists of 5 commits: 2 bug fixes (C1, H1), 1 docs update (H2), 1 test addition (M2), and 1 ticket resolution log.

**Decrees verified:**
- decree-021: Two-phase trainer system. The fixes preserve the core flow (declaration low-to-high, resolution high-to-low). tempConditions now correctly persist through declaration and clear during resolution, matching the decree's intent that resolution is the trainer's actual turn. **Compliant.**
- decree-006: Dynamic initiative reorder. Not affected by these fixes. `reorderInitiativeAfterSpeedChange` remains phase-aware. **Not impacted.**
- decree-005: Auto-apply CS from status conditions. Not affected by these fixes. **Not impacted.**

## Verification of code-review-198 Issues

### C1 (CRITICAL): tempConditions cleared during declaration phase -- FIXED

**Commit 11a42f3.** Two changes in `next-turn.post.ts`:

1. **Lines 65-69:** The general tempConditions clearing is now wrapped in `if (currentPhase !== 'trainer_declaration')`. During declaration phase, tempConditions are preserved. During resolution and pokemon phases, they are cleared as before. This is the correct fix -- declaration is not the trainer's actual turn in the action-economy sense.

2. **Lines 206-208 (resetResolvingTrainerTurnState):** Added `trainer.tempConditions = []` to the resolution turn reset. This ensures tempConditions are cleared when the trainer's resolution turn arrives -- the correct time per PTU rules ("until the combatant's next turn").

**Verified the full lifecycle:** A trainer with Sprint from the pokemon phase keeps it through declaration (line 67 skips clearing), then loses it when their resolution turn arrives (either via `resetResolvingTrainerTurnState` at the phase transition for the first resolver, or mid-resolution for subsequent resolvers). The general clearing at line 67-69 also fires during resolution turns but is harmless (redundant clear of already-empty array from `resetResolvingTrainerTurnState`). No gaps in the lifecycle.

### H1 (HIGH): hasActed not reset for all trainers at resolution transition -- FIXED

**Commit 8a3e507.** Added `resetAllTrainersForResolution` function (lines 227-234) that uses a Set lookup on the resolution order to reset `hasActed = false` for all trainers entering resolution. Called at line 93, before the first trainer's `resetResolvingTrainerTurnState` call at line 96.

**Verified:** The `combatantsWithActions` getter in the encounter store (line 86-91) checks `turnState.hasActed`. With all trainers having `hasActed = false` upon entering resolution, no trainer will incorrectly appear as "already acted" before their resolution turn. The first trainer additionally gets full action economy via `resetResolvingTrainerTurnState`. Subsequent trainers get only `hasActed = false` until their mid-resolution turn (line 148) gives them full action economy. This is correct -- only the currently-resolving trainer needs full action economy.

### H2 (HIGH): app-surface.md missing declare endpoint -- FIXED

**Commit b90f089.** Added `POST /api/encounters/:id/declare` with description "record trainer declaration (League Battle)" to the Encounters section in `app-surface.md`. Placement is correct (after `next-turn`, before `combatants`).

### M2 (MEDIUM): No unit tests for three-phase flow -- FIXED

**Commit 06bcb11.** Added `league-battle-phases.test.ts` (598 lines) with comprehensive test coverage:

- **Phase transitions (4 tests):** declaration-to-resolution, resolution-to-pokemon, pokemon-to-new-round, and full round cycle. All verify correct phase, turnOrder, currentTurnIndex, and currentRound values.
- **C1 regression tests (3 tests):** Verifies tempConditions preserved during declaration, cleared during resolution (both via general path and via `resetResolvingTrainerTurnState`).
- **H1 regression test (1 test):** Verifies ALL 3 trainers have `hasActed = false` after transitioning to resolution (not just the first).
- **Declaration validation (6 tests):** Phase rejection, non-current combatant rejection, duplicate prevention, round boundary, trainer-only check, valid action types.
- **Resolution state management (2 tests):** Fresh action economy verification, mid-resolution reset for subsequent trainers.

The tests use a `simulateNextTurn` helper that replicates the handler's logic. This is the same pattern used in the existing `encounters.test.ts` -- testing data transformations rather than calling the actual HTTP handler. While integration tests would be stronger, this pattern provides adequate regression coverage for the specific fixes and is consistent with the codebase conventions.

## What Looks Good

1. **Surgical fixes.** Both C1 and H1 fixes are minimal, targeted changes that address exactly the reported issue without introducing side effects. No unnecessary refactoring or scope creep.

2. **Correct tempConditions lifecycle.** The two-part fix (skip during declaration + clear during resolution reset) creates a clean lifecycle: tempConditions survive declaration, clear at resolution. No gap where a condition could be lost prematurely or persist too long.

3. **resetAllTrainersForResolution is well-scoped.** It only touches `hasActed`, leaving action economy to `resetResolvingTrainerTurnState` on a per-turn basis. This separation is clean -- all trainers need consistent `hasActed` state for UI, but only the active trainer needs full action economy.

4. **Test coverage targets the specific bugs.** The C1 and H1 regression tests directly verify the conditions that caused the original bugs. The test for 3 trainers (not just 2) in the H1 test is good -- it catches the "only first trainer reset" bug more clearly than a 2-trainer test would.

5. **Commit granularity is correct.** Each fix is a separate commit with a clear description referencing the specific code-review-198 issue. The test commit is separate from the fix commits. The ticket resolution log is a documentation-only commit.

6. **File sizes remain healthy.** `next-turn.post.ts` at 274 lines and the test file at 598 lines are both well within the 800-line limit.

7. **Comments explain the "why."** Both the declaration skip comment (line 65-66) and the resolution clearing comment (lines 206-207) explain WHY the code works this way, not just WHAT it does.

## Verdict

**APPROVED**

All 4 issues from code-review-198 are fixed correctly:
- C1 (CRITICAL): tempConditions now persist through declaration and clear during resolution. Full lifecycle verified.
- H1 (HIGH): All trainers get `hasActed = false` at the resolution phase boundary. UI state is consistent.
- H2 (HIGH): Declare endpoint added to app-surface.md.
- M2 (MEDIUM): 16 unit tests covering phase transitions, C1 regression, H1 regression, declaration validation, and resolution state.

No new issues introduced. The fixes are minimal, correct, and well-tested. The implementation continues to faithfully implement decree-021's two-phase trainer system.
