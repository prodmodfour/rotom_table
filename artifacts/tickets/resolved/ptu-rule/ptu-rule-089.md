---
id: ptu-rule-089
title: Extended rest does not refresh daily moves
priority: P3
severity: MEDIUM
status: in-progress
domain: healing
source: healing-audit.md (R034)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-089: Extended rest does not refresh daily moves

## Summary

The `isDailyMoveRefreshable()` utility function exists and is correct, but the extended rest endpoint (`extended-rest.post.ts`) does NOT call it. Extended rests that cross day boundaries do not refresh daily moves used on the previous day. Only the "New Day" action or Pokemon Center refreshes daily moves.

## Affected Files

- `app/server/api/characters/[id]/extended-rest.post.ts`
- `app/utils/restHealing.ts` (`isDailyMoveRefreshable`)

## PTU Rule Reference

Extended rest (4+ hours): refreshes daily-use moves if rest crosses a day boundary.

## Suggested Fix

Wire `isDailyMoveRefreshable()` into the extended rest endpoint. When an extended rest crosses a day boundary, refresh daily moves for the character and their Pokemon.

## Impact

Daily moves are never refreshed by extended rests, only by explicit "New Day" or Pokemon Center actions.

## Fix Log

### 2026-02-27 — slave-6-developer

**Commits:**
- `4a09d5e` — refactor: extract `refreshDailyMoves()` service for reuse across rest endpoints
- `25fccd2` — feat: wire daily move refresh into character extended-rest endpoint
- `fc7b43e` — refactor: use shared `refreshDailyMoves()` in Pokemon extended-rest endpoint
- `baa8bbc` — test: add unit tests for `refreshDailyMoves` service function

**Files changed:**
- `app/server/services/rest-healing.service.ts` (NEW) — shared `refreshDailyMoves()` and `refreshDailyMovesForOwnedPokemon()`
- `app/server/api/characters/[id]/extended-rest.post.ts` — imports and calls `refreshDailyMovesForOwnedPokemon()` after character update
- `app/server/api/pokemon/[id]/extended-rest.post.ts` — refactored to use shared `refreshDailyMoves()` instead of inline logic
- `app/tests/unit/services/restHealing.service.test.ts` (NEW) — 10 test cases for `refreshDailyMoves()`

**What was done:**
1. Extracted inline daily move refresh logic from the Pokemon extended-rest endpoint into a reusable service function `refreshDailyMoves()` in `rest-healing.service.ts`.
2. Added `refreshDailyMovesForOwnedPokemon()` which batch-refreshes daily moves for all Pokemon owned by a character.
3. Wired `refreshDailyMovesForOwnedPokemon()` into the character extended-rest endpoint so that a trainer's owned Pokemon get their daily moves refreshed during extended rest.
4. Refactored the Pokemon extended-rest endpoint to use the same shared `refreshDailyMoves()` function (eliminates code duplication).
5. Added unit tests covering rolling window, Daily/Daily x2/x3, immutability, mixed sets, and scene usage reset.
