---
review_id: rules-review-078
ticket_id: refactoring-049
reviewer: game-logic-reviewer
verdict: PASS
date: 2026-02-20
commits_reviewed:
  - 021b8b2 (refactor: fix mutation and double-await in move.post.ts)
  - 2d61472 (refactor: use immutable .map() in start.post.ts)
  - d632827 (test: add resetSceneUsage test for preserving usedToday on Daily moves)
  - 97bd979 (docs: clarify usedThisScene on Daily moves is not dead data)
  - 1c7fc47 (fix: remove dead reference check in next-scene.post.ts)
---

## Rules Review: refactoring-049

### Scope

Pure refactoring of scene-frequency move enforcement code. No new game mechanics added. Review focuses on verifying that no PTU rule behavior was altered.

### PTU Rules Referenced

**PTU 1.05 p.337 -- Move Frequency Definitions:**

> **At-Will** means your Pokemon can perform the attack as often as it'd like, with no rest needed to perform the attack again.

> **EOT** is an abbreviation for Every Other Turn, and it means your Pokemon can perform the move once every other turn.

> **Scene X:** This Frequency means this Move can be performed X times per Scene. Moves that simply have the Scene Frequency without a number can be performed once a Scene. **Moves that can be used multiple times a Scene can still only be used Every Other Turn within a Scene and not on consecutive turns.**

> **Daily** is the lowest Frequency. This Move's Frequency is only refreshed by an Extended Rest, or by a visit to the Pokemon Center. **Moves that can be used multiple times Daily can still only be used once a Scene and not multiple times within the same Scene.**

> **Static**, like with Features, means this Move has some effect that is always granted to the user, as long as they know this Move.

### Verification Items

#### 1. move.post.ts (commit 021b8b2) -- Move execution flow preserved

**Rule under test:** Frequency check -> execute -> increment usage -> persist to DB.

**Before refactoring:** `pokemonEntity.moves` was mutated directly. The `dbUpdates` array accumulated both damage-sync and move-usage promises, and `Promise.all(dbUpdates)` was called twice (once after damage, once after move usage), meaning the second call re-awaited already-resolved damage promises.

**After refactoring:** A separate `moveDbUpdates` array is used for move-usage DB writes. The actor entity is updated immutably via `actor.entity = { ...actor.entity, moves: updatedMoves }`. The damage `dbUpdates` are awaited exactly once, and `moveDbUpdates` are awaited exactly once.

**Verdict: CORRECT.** The execution order is preserved:
1. `checkMoveFrequency(move, record.currentRound)` -- validates before executing
2. Damage is applied and DB-synced via `Promise.all(dbUpdates)`
3. `incrementMoveUsage(move, record.currentRound)` -- updates usage counters
4. Move-usage DB writes via `Promise.all(moveDbUpdates)`
5. Combatants snapshot is persisted to encounter record

The frequency check still receives the pre-increment move state and the current round. The increment still happens after damage. No behavioral change.

#### 2. start.post.ts (commit 2d61472) -- Encounter start resets

**Rule under test:** Starting a new encounter constitutes a new scene. Scene-frequency moves must be reset. Combat state (actions, turn state) must be initialized.

**Before refactoring:** `combatants.forEach()` mutated each combatant directly (`c.hasActed = false`, `entity.moves = resetMoves`).

**After refactoring:** `combatants.map()` returns a new `readyCombatants` array. Each combatant is rebuilt via spread with:
- `hasActed: false`, `actionsRemaining: 2`, `shiftActionsRemaining: 1`
- Fresh `turnState` object
- For Pokemon: entity rebuilt with `resetSceneUsage(moves)` result if moves changed

All downstream references updated from `combatants` to `readyCombatants` (sorting, turn order, DB persistence, response building).

**Verdict: CORRECT.** The same fields are reset. The `resetSceneUsage` call is identical. The DB sync only fires when moves actually changed (same optimization as before, but now using `!resetMoves.every((m, i) => m === moves[i])` which was already in the old code). No PTU rule behavior changed.

**Note on a subtle difference:** The old code had a guard `if (!resetMoves.every((m, i) => m === moves[i]))` that both assigned `entity.moves = resetMoves` AND pushed the DB update inside one block. The new code separates the DB push from the entity rebuild -- the entity always gets `resetMoves` in the spread when `movesChanged` is true, and the DB update only fires when `movesChanged && c.entityId`. This is functionally equivalent because the entity spread uses a ternary `movesChanged ? { ...entity, moves: resetMoves } : entity`, correctly preserving the original entity when no changes occurred.

#### 3. resetSceneUsage test (commit d632827) -- Daily usedToday preservation

**Rule under test:** PTU p.337 -- Daily moves have a per-day budget. Scene transitions must NOT reset the daily counter. Only `usedThisScene` and `lastTurnUsed` should be reset.

**New test assertions:**
- `usedToday` on Daily x2 (value 1) survives scene reset
- `usedToday` on Daily x3 (value 2) survives scene reset
- `usedToday` on Daily (value 1) survives scene reset
- `usedThisScene` is reset to 0 on all
- `lastTurnUsed` is reset to 0 on all

**Verdict: CORRECT.** The `resetSceneUsage` function (lines 234-246) only zeroes `usedThisScene` and `lastTurnUsed`. It does not touch `usedToday` or `lastUsedAt`. This matches PTU rules: daily budget is restored only by Extended Rest or Pokemon Center, not by scene transitions. The test correctly verifies this invariant.

#### 4. usedThisScene for Daily moves (commit 97bd979) -- NOT dead data

**Rule under test:** PTU p.337 -- "Moves that can be used multiple times Daily can still only be used once a Scene."

The ticket originally suspected `usedThisScene` on Daily moves was dead data. The developer investigated and found it is read by `checkMoveFrequency` at lines 166-175:

```typescript
// Daily x2/x3: enforce 1-use-per-scene cap (Daily x1 is implicitly safe -- only 1 use total)
if (dailyLimit > 1) {
  const usedScene = move.usedThisScene ?? 0
  if (usedScene >= 1) {
    return {
      canUse: false,
      reason: `${frequency} move already used this scene (1 use per scene limit)`,
      remainingDailyUses: remaining
    }
  }
}
```

**Verdict: CORRECT.** This is a direct implementation of the PTU p.337 rule. The code correctly:
- Skips the per-scene check for `Daily` (dailyLimit === 1) since a move with only 1 daily use can never be used twice in a scene anyway
- Blocks `Daily x2` and `Daily x3` moves once `usedThisScene >= 1`
- Returns the remaining daily uses in the result for UI feedback
- Checks daily exhaustion first (lines 158-163), then per-scene cap -- so daily exhaustion takes priority in the error message

The clarifying comment added to `incrementMoveUsage` is accurate. `usedThisScene` is written for Daily moves at line 218 and read by `checkMoveFrequency` at line 167. Not dead data.

#### 5. next-scene.post.ts (commit 1c7fc47) -- Dead reference check removal

**Rule under test:** Scene transition resets scene-frequency move counters.

**Before:** `if (resetMoves === moves || resetMoves.every((m, i) => m === moves[i]))`

**After:** `if (resetMoves.every((m, i) => m === moves[i]))`

**Verdict: CORRECT.** `resetSceneUsage` uses `.map()` which always returns a new array reference. The `resetMoves === moves` check was always false (referential inequality). Removing it has zero behavioral impact -- the `.every()` element-wise check is the real equality test and it remains unchanged.

The scene transition still:
1. Calls `resetSceneUsage(moves)` on each Pokemon combatant
2. Only creates a new combatant object when moves actually changed
3. Syncs changed moves to the Pokemon DB record
4. Persists updated combatants to the encounter record

No PTU rule behavior changed.

### Test Verification

All 63 unit tests in `moveFrequency.test.ts` pass, including the new test added in commit d632827. The test suite covers:
- 11 frequency parsing tests
- 30 frequency validation tests (At-Will, Static, EOT, Scene/x2/x3, Daily/x2/x3)
- 10 usage tracking tests (incrementMoveUsage)
- 6 scene reset tests (resetSceneUsage) including the new daily preservation test
- 8 daily reset tests (resetDailyUsage)

### Summary

All five commits are pure refactoring (immutability, dead code removal, test coverage, documentation). No PTU game mechanic behavior was changed. The move frequency system correctly implements:

| Frequency | Uses/Scene | Uses/Day | EOT Between Uses | Scene Reset Clears | Daily Reset Clears |
|-----------|-----------|----------|-------------------|--------------------|--------------------|
| At-Will   | Unlimited | Unlimited | No               | N/A                | N/A                |
| EOT       | Unlimited | Unlimited | Yes              | lastTurnUsed       | N/A                |
| Scene     | 1         | Unlimited | No (only 1 use)  | usedThisScene, lastTurnUsed | N/A      |
| Scene x2  | 2         | Unlimited | Yes              | usedThisScene, lastTurnUsed | N/A      |
| Scene x3  | 3         | Unlimited | Yes              | usedThisScene, lastTurnUsed | N/A      |
| Daily     | 1         | 1        | No               | usedThisScene      | usedToday, lastUsedAt |
| Daily x2  | 1         | 2        | No               | usedThisScene      | usedToday, lastUsedAt |
| Daily x3  | 1         | 3        | No               | usedThisScene      | usedToday, lastUsedAt |

### Issues Found

None. All changes are behavior-preserving.
