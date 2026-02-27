---
id: ptu-rule-089
title: Extended rest does not refresh daily moves
priority: P3
severity: MEDIUM
status: open
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
