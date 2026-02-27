---
ticket_id: refactoring-045
priority: P3
status: resolved
category: PERF
source: code-review-074, code-review-075
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

N+1 query pattern in `game/new-day.post.ts` and `scenes/[id]/activate.post.ts`. Both do per-character sequential DB updates instead of batching. Non-blocking for TTRPG scale (typically <10 characters) but inefficient.

## Affected Files

- `app/server/api/game/new-day.post.ts` — findMany + N individual updates
- `app/server/api/scenes/[id]/activate.post.ts` — per-character AP restore

## Suggested Refactoring

Group characters by level and use `updateMany` per level group (L+1 queries instead of N+1). Or use a transaction with batch updates.

## Resolution Log

**Resolved:** 2026-02-20

### Changes Made

1. **`app/server/api/game/new-day.post.ts`** — Replaced N sequential `humanCharacter.update()` calls with group-by-level `updateMany` inside a `$transaction`. Characters are grouped by level (since `calculateMaxAp` depends only on level), yielding L+1 queries (one per distinct level) instead of N+1 (one per character). Commit: `f127e53`.

2. **`app/server/api/scenes/[id]/activate.post.ts`** — Replaced N sequential `humanCharacter.update()` calls with group-by-`(level, drainedAp)` `updateMany` inside a `$transaction`. Characters are grouped by the composite key because `calculateSceneEndAp` depends on both fields. Yields G+1 queries (one per distinct group) instead of N+1. Commit: `ea438a3`.

### Behavior Preserved

- New-day still resets all daily counters, clears drained/bound AP, and sets `currentAp` to `calculateMaxAp(level)` for every character.
- Scene activation still restores AP to `calculateSceneEndAp(level, drainedAp)` and clears `boundAp` for characters in previously active scenes.
- Both use immutable patterns (no mutation of fetched arrays).
