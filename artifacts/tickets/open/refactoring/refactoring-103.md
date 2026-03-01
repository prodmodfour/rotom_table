---
ticket_id: refactoring-103
category: EXT-INCONSISTENCY
priority: P4
severity: LOW
title: "damage.post.ts uses species instead of nickname for defeated enemy tracking"
source: code-review-233 (observation, pre-existing)
created_by: slave-collector (plan-20260301-084803)
created_at: 2026-03-01
---

## Summary

`damage.post.ts` line 119 uses `entity.species` for defeated enemy name tracking, while `next-turn.post.ts` and `move.post.ts` (via `getEntityName`) use `nickname || species`. This is an inconsistency in how defeated enemies are named for XP tracking.

## Affected Files

- `app/server/api/encounters/[id]/damage.post.ts` — line 119
- `app/server/api/encounters/[id]/move.post.ts` — uses `getEntityName` (correct)
- `app/server/api/encounters/[id]/next-turn.post.ts` — uses `getEntityName` (correct)

## Suggested Fix

Replace `entity.species` with `getEntityName(entity)` or equivalent `entity.nickname || entity.species` in the defeated tracking section of `damage.post.ts`.

## Impact

Low — affects only the display name in XP distribution results when a Pokemon has a nickname and is defeated via GM direct damage.
