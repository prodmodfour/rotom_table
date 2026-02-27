---
ticket_id: refactoring-049
priority: P2
status: resolved
category: EXT-DUPLICATE
source: code-review-080
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Scene-frequency move enforcement has several code quality issues flagged by code-review-080.

## Issues

1. `move.post.ts` line 113 mutates `pokemonEntity.moves` directly (should use immutable pattern)
2. `dbUpdates` array is `Promise.all`-ed twice — second call re-awaits already-resolved promises
3. `start.post.ts` mutates combatants directly in forEach (unlike `end.post.ts` which uses immutable `.map()`)
4. Missing test: `resetSceneUsage` preserving `usedToday` on Daily moves
5. `incrementMoveUsage` tracks `usedThisScene` for Daily moves but `checkMoveFrequency` never reads it (dead data)
6. Dead reference check in `next-scene.post.ts` line 41

## Affected Files

- `app/server/api/encounters/[id]/move.post.ts`
- `app/server/api/encounters/[id]/start.post.ts`
- `app/server/api/encounters/[id]/next-scene.post.ts`
- `app/utils/moveFrequency.ts`
- `app/tests/unit/utils/moveFrequency.test.ts`

## Resolution Log

All 6 issues resolved on 2026-02-20:

1. **move.post.ts mutation fixed** — Replaced direct `pokemonEntity.moves = ...` assignment with immutable spread (`actor.entity = { ...actor.entity, moves: updatedMoves }`). Moves are built into a new `updatedMoves` array, and `actor.entity` is replaced via spread, not mutated.

2. **Double Promise.all fixed** — Introduced separate `moveDbUpdates` array for move-usage DB writes so damage `dbUpdates` are not re-awaited by the second `Promise.all` call.

3. **start.post.ts immutable refactor** — Replaced `.forEach()` direct mutation with `.map()` that returns new `readyCombatants` array. Each combatant gets spread with reset turn state. All downstream references updated from `combatants` to `readyCombatants`.

4. **Missing test added** — New test `preserves usedToday on Daily moves while resetting scene counters` verifies that `resetSceneUsage` clears `usedThisScene` and `lastTurnUsed` but preserves `usedToday` on Daily x2/x3 moves.

5. **usedThisScene on Daily moves is NOT dead data** — `checkMoveFrequency` reads it at lines 166-175 to enforce the PTU p.337 per-scene cap on Daily x2/x3 moves. Added clarifying comment in `incrementMoveUsage`.

6. **Dead reference check removed in next-scene.post.ts** — `resetMoves === moves` was always false since `.map()` always returns a new array. Removed the dead `resetMoves === moves ||` branch.
