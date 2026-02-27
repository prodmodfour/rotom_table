---
review_id: code-review-088
ticket: refactoring-049
result: APPROVED
date: 2026-02-20
reviewer: senior-reviewer
commits_reviewed:
  - 021b8b2
  - 2d61472
  - d632827
  - 97bd979
  - 1c7fc47
---

# Code Review: refactoring-049 (Scene-frequency move enforcement code quality)

## Verdict: APPROVED

All 6 issues are correctly resolved. No regressions. No new issues found.

---

## Issue-by-Issue Verification

### Issue 1: move.post.ts mutation fix (021b8b2) -- PASS

**Before:** `pokemonEntity.moves = pokemonEntity.moves.map(...)` mutated a property on a shared reference obtained via `actor.entity`.

**After:** A local `updatedMoves` array is built via `.map()`, then the actor's entity is replaced via spread: `actor.entity = { ...actor.entity, moves: updatedMoves }`. The old `.moves` property on the original entity object is never assigned to.

**Verified:** The new entity object is constructed immutably. `updatedMoves` is a fresh array, and `{ ...actor.entity, moves: updatedMoves }` creates a new entity object. The `actor.entity` property reassignment is a shallow mutation on the combatant reference (same pattern as `actor.actionsRemaining--` on line 153, `applyDamageToEntity` on line 83, and `moveLog.push` on line 150), which is a pre-existing server-side pattern throughout the encounter endpoints -- these were not in scope for this ticket.

### Issue 2: Double Promise.all fix (021b8b2) -- PASS

**Before:** A single `dbUpdates` array accumulated damage sync promises (lines 85-92) and move usage promises. The first `Promise.all(dbUpdates)` on line 106 resolved the damage promises, then a second `Promise.all(dbUpdates)` re-awaited the same already-resolved promises plus any new move usage promises.

**After:** Move usage DB writes go into a separate `moveDbUpdates` array (line 110). Damage promises are awaited via `Promise.all(dbUpdates)` on line 106, then move promises are awaited via `Promise.all(moveDbUpdates)` on line 134. No promises are double-awaited.

**Verified:** The `dbUpdates` array (line 62) collects only damage sync writes. The `moveDbUpdates` array (line 110) collects only move usage DB writes. Each is awaited exactly once.

### Issue 3: start.post.ts immutable .map() (2d61472) -- PASS

**Before:** `combatants.forEach()` mutated `.hasActed`, `.actionsRemaining`, `.shiftActionsRemaining`, `.turnState`, and `.entity.moves` directly on each combatant object.

**After:** `combatants.map()` returns a new `readyCombatants` array. Each combatant is spread into a new object with reset turn state. Pokemon entities with changed moves get a new entity via `{ ...entity, moves: resetMoves }`. All downstream references updated: `trainers` filter (line 95), `pokemon` filter (line 96), `sortByInitiativeWithRollOff` (line 113), `JSON.stringify` (line 131), `buildEncounterResponse` (line 135) -- all use `readyCombatants`.

**Verified no nested mutations in the map callback:** The `entity` variable (line 60) is only read, never assigned to. The `moves` variable (line 61) is passed to `resetSceneUsage()` which returns a new array. The conditional `movesChanged ? { ...entity, moves: resetMoves } : entity` correctly creates a new entity only when needed. No mutations leak through.

### Issue 4: resetSceneUsage test for Daily moves (d632827) -- PASS

The new test `preserves usedToday on Daily moves while resetting scene counters` creates three Daily moves with non-zero `usedToday`, `usedThisScene`, and `lastTurnUsed` values, then asserts:
- `usedToday` is preserved (1, 2, 1 respectively)
- `usedThisScene` is reset to 0
- `lastTurnUsed` is reset to 0

This correctly validates the critical invariant: daily budget (`usedToday`) survives scene boundaries while per-scene counters reset. Test passes as part of the 63-test suite.

### Issue 5: usedThisScene documentation (97bd979) -- PASS

**Ticket claim:** `usedThisScene` on Daily moves is dead data since `checkMoveFrequency` never reads it.

**Developer rebuttal:** `checkMoveFrequency` DOES read `usedThisScene` for Daily x2/x3 at lines 166-175.

**Verified in moveFrequency.ts lines 165-175:**
```typescript
if (dailyLimit > 1) {
  const usedScene = move.usedThisScene ?? 0
  if (usedScene >= 1) {
    return {
      canUse: false,
      reason: `${frequency} move already used this scene (1 use per scene limit)`,
```

Confirmed: `usedThisScene` is read for Daily x2/x3 to enforce the PTU p.337 per-scene cap. The added comment in `incrementMoveUsage` (lines 214-215) correctly documents this relationship. The original ticket issue was wrong -- the developer correctly identified and documented the actual behavior.

### Issue 6: Dead reference check in next-scene.post.ts (1c7fc47) -- PASS

**Before (line 41):** `if (resetMoves === moves || resetMoves.every((m, i) => m === moves[i]))`

**After:** `if (resetMoves.every((m, i) => m === moves[i]))`

**Verified:** `resetSceneUsage()` uses `.map()` (moveFrequency.ts line 235), which always returns a new array reference. Therefore `resetMoves === moves` was always `false` -- pure dead code. The element-wise `.every()` comparison remains and correctly detects whether individual move objects changed. Removing the dead branch has zero functional impact.

---

## Cross-cutting Checks

| Check | Result |
|---|---|
| File sizes under 800 lines | PASS (move.post.ts: 176, start.post.ts: 154, next-scene.post.ts: 88, moveFrequency.ts: 265, test: 523) |
| No functional behavior changes | PASS (all changes are structural refactoring or dead code removal) |
| All tests pass | PASS (63 tests, 0 failures) |
| Ticket resolution log updated | PASS (all 6 issues documented) |
| No new mutations introduced | PASS |
| No secrets or hardcoded values | PASS |

---

## Issues Found

None.
