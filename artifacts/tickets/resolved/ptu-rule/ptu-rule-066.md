---
ticket_id: ptu-rule-066
priority: P2
status: resolved
domain: healing
source: code-review-079
created_at: 2026-02-20
created_by: senior-reviewer
---

## Summary

Global new-day endpoint does not reset Pokemon daily move usage counters (`usedToday`, `lastUsedAt`) inside the `moves` JSON column.

## Expected Behavior (PTU Rules)

A new day should be a clean slate. All daily move usage counters should reset so Pokemon start the new day with full daily move availability.

## Actual Behavior

`POST /api/game/new-day` uses `prisma.pokemon.updateMany()` to reset `restMinutesToday` and `injuriesHealedToday`, but cannot touch the `moves` JSON column via `updateMany`. Each Pokemon's `moves` JSON retains stale `usedToday` and `lastUsedAt` values from the previous day.

While `isDailyMoveRefreshable` would correctly identify yesterday's moves as refreshable during the next extended rest, the `usedToday` counter remains non-zero. This means:
1. UI would show daily moves as "used" even after a new day
2. The counter is semantically wrong (it says "used today" but it means "used yesterday")

## Files to Change

- `app/server/api/game/new-day.post.ts` -- iterate all Pokemon, parse their `moves` JSON, reset `usedToday: 0` and `lastUsedAt: undefined` for all moves, save back

## Notes

The individual `characters/[id]/new-day.post.ts` has the same gap but is lower priority since it targets characters, not their Pokemon directly.

## Resolution Log

### 2026-02-20: Fix implemented

**Root cause:** `prisma.pokemon.updateMany()` cannot manipulate JSON columns. The `moves` JSON field (containing `usedToday` and `lastUsedAt` per-move counters) was never touched by new-day resets.

**Changes made:**

1. **Added `resetDailyUsage()` to `app/utils/moveFrequency.ts`** -- Pure function that maps over a moves array, resetting `usedToday: 0` and `lastUsedAt: undefined` for any move with non-zero daily usage. Follows the same immutable pattern as the existing `resetSceneUsage()` function. Returns same reference for moves needing no reset.

2. **Fixed `app/server/api/game/new-day.post.ts`** -- After the bulk `updateMany` for scalar fields, iterates all Pokemon individually via `findMany` + per-record `update`. Parses each Pokemon's `moves` JSON, applies `resetDailyUsage()`, and writes back only when changes are detected. Returns `pokemonMovesReset` count in response.

3. **Fixed `app/server/api/characters/[id]/new-day.post.ts`** -- Added `include: { pokemon: { select: { id: true, moves: true } } }` to the character query. Iterates through owned Pokemon, resets scalar daily counters (`restMinutesToday`, `injuriesHealedToday`, `lastRestReset`) and applies `resetDailyUsage()` to each Pokemon's moves JSON. Returns `pokemonReset` count in response.

**Duplicate code path check:** Searched for all code paths that reset daily state:
- `app/server/api/game/new-day.post.ts` -- global new-day (FIXED)
- `app/server/api/characters/[id]/new-day.post.ts` -- per-character new-day (FIXED)
- `app/server/api/pokemon/[id]/extended-rest.post.ts` -- already handles daily move reset with rolling window logic
- `app/server/api/pokemon/[id]/pokemon-center.post.ts` -- already handles daily move reset (unconditional)

**Test results:** All 39 moveFrequency unit tests pass. All 24 restHealing unit tests pass.
