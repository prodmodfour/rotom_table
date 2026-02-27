---
review_id: code-review-006
target: refactoring-004
ticket_id: refactoring-004
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-16
commits_reviewed:
  - 86db8fc
files_reviewed:
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/[id]/wild-spawn.post.ts
  - app/server/api/encounters/[id]/start.post.ts
scenarios_to_rerun: []
---

## Summary

Refactoring-004 replaces inline encounter response construction in 3 API handlers with the canonical `buildEncounterResponse()` from `encounter.service.ts`. The refactoring is clean, correct, and fixes two real bugs: `backgroundImage` (wrong field name) in `wild-spawn.post.ts` and `start.post.ts`, and missing fields (`weather`, `sceneNumber`, `createdAt`, `updatedAt`) in `start.post.ts`. Net delta: +34 lines, -81 lines.

## Issues

None.

## Observations (non-blocking)

### Observation 1: gridConfig null behavior now consistent

The old inline code in all 3 files always returned a `gridConfig` object even when `gridEnabled` was false. The canonical function returns `null` when grid is disabled. This is technically a behavioral change for these 3 endpoints.

**Not an issue** because: 5 other endpoints (`status.post.ts`, `stages.post.ts`, `move.post.ts`, `damage.post.ts`, `heal.post.ts`) already used `buildEncounterResponse` and already returned `gridConfig: null` when disabled. The client handles this — 446/447 tests pass. This change makes all endpoints consistent.

### Observation 2: Ticket Finding 1 inaccuracy

The ticket stated `combatants.post.ts` had `backgroundImage` (wrong field name). The diff shows it already had the correct `background`. Only `wild-spawn.post.ts` and `start.post.ts` had the `backgroundImage` bug. Minor audit inaccuracy — doesn't affect the fix.

### Observation 3: Additional endpoints with inline responses

The resolution log correctly identifies 10 additional endpoints with inline `const parsed = {` response building: `next-turn.post.ts`, `breather.post.ts`, `end.post.ts`, `serve.post.ts`, `unserve.post.ts`, `[id].get.ts`, `[id].put.ts`, `index.post.ts`, `served.get.ts`, `from-scene.post.ts`. None have the `backgroundImage` bug. Converting these is a natural follow-up (likely overlaps with refactoring-002).

## What Looks Good

- **Override pattern** — `options?` parameter with field-level overrides for `isActive`, `isPaused`, `currentRound`, `currentTurnIndex`, `turnOrder`, `trainerTurnOrder`, `pokemonTurnOrder`, `currentPhase` is clean and extensible. Each caller passes only what it needs.
- **`start.post.ts` correctly uses overrides** — The endpoint updates the DB then responds using the stale `encounter` record. Override options for `isActive`, `isPaused`, `currentRound`, `currentTurnIndex`, `turnOrder` correctly bypass the stale record values. No race condition.
- **`ParsedEncounter` extension** — `trainerTurnOrder`, `pokemonTurnOrder`, `currentPhase` added to the interface with correct defaults (`[]`, `[]`, `'pokemon'`). Client `Encounter` type (`app/types/encounter.ts:112-114`) already has these fields.
- **Bug fixes confirmed** — `GridConfig.background` is the correct field name per `app/types/spatial.ts:21`. The old `backgroundImage` in wild-spawn and start was silently ignored by the client (field wasn't in the type). Now fixed.
- **Audit thoroughness** — Resolution log lists all 10 remaining endpoints with inline response building and confirms none have the `backgroundImage` bug.
- **Commit message** — Single commit, well-scoped, descriptive. Correct for a refactoring of this size.

## Verdict

**APPROVED** — Clean refactoring with zero code quality issues. Two real bugs fixed (`backgroundImage` field name, missing fields in `start.post.ts`). No functional regressions expected — the 3 endpoints now return the same shape as the 5 endpoints that already used `buildEncounterResponse`. No scenarios need re-running since response shape changes are additive (new fields with correct defaults) and the `backgroundImage` field was already being silently ignored by the client type system.
