---
ticket_id: refactoring-004
priority: P1
categories:
  - LLM-INCONSISTENT
affected_files:
  - app/server/api/encounters/[id]/combatants.post.ts
  - app/server/api/encounters/[id]/wild-spawn.post.ts
  - app/server/api/encounters/[id]/start.post.ts
estimated_scope: small
status: resolved
created_at: 2026-02-16T01:00:00
---

## Summary
Three API handlers build encounter response objects inline instead of using `buildEncounterResponse()` from `encounter.service.ts`. Each inline version differs slightly (missing fields, different field names, inconsistent defaults), causing LLM agents to copy the wrong response shape when writing new endpoints.

## Findings

### Finding 1: LLM-INCONSISTENT
- **Metric:** 3 files building encounter responses differently; canonical service function exists but is bypassed
- **Threshold:** Same operation done differently across files
- **Impact:** LLM agents learn response patterns from existing code. Three different response shapes for the same data means 2-in-3 chance of copying the wrong one. New API endpoints may return incomplete or inconsistent data.
- **Evidence:**
  - `encounter.service.ts:102-141` — canonical `buildEncounterResponse()` with proper GridConfig construction and defaults
  - `combatants.post.ts:201-226` — inline response with `backgroundImage` (wrong field name, should be `background`)
  - `wild-spawn.post.ts:140-165` — inline response with `backgroundImage` (same wrong field name)
  - `start.post.ts:161-184` — inline response with `backgroundImage` (same wrong field name), missing `weather` field
  - Additional: `start.post.ts` and `combatants.post.ts` don't include `sceneNumber`, `gridConfig` null handling, or `defeatedEnemies` parsing that the canonical version handles

## Suggested Refactoring
1. Replace inline response construction in all 3 files with `buildEncounterResponse(record, combatants, options)`
2. If `buildEncounterResponse` needs additional fields (e.g., `trainerTurnOrder`, `pokemonTurnOrder`, `currentPhase`), extend its interface — don't bypass it
3. Audit any remaining API handlers in `app/server/api/encounters/` for the same pattern

Estimated commits: 1-2

## Related Lessons
- none (new finding)

## Resolution Log
- Commits: 86db8fc
- Files changed:
  - `app/server/services/encounter.service.ts` — extended `ParsedEncounter` with `trainerTurnOrder`, `pokemonTurnOrder`, `currentPhase`; extended `buildEncounterResponse` options with override fields (`isActive`, `isPaused`, `currentRound`, `currentTurnIndex`, `turnOrder`) and combat phase fields
  - `app/server/api/encounters/[id]/combatants.post.ts` — replaced 25-line inline response with `buildEncounterResponse()` call
  - `app/server/api/encounters/[id]/wild-spawn.post.ts` — replaced 25-line inline response with `buildEncounterResponse()` call; fixed `backgroundImage` → `background`
  - `app/server/api/encounters/[id]/start.post.ts` — replaced 22-line inline response with `buildEncounterResponse()` call; fixed `backgroundImage` → `background`, added missing `weather`, `sceneNumber`, `createdAt`, `updatedAt`
- New files created: none
- Tests passing: 446/447 (1 pre-existing failure in settings.test.ts unrelated to this change)
- Net delta: +34 lines, −81 lines

### Audit Notes
Additional endpoints with inline `const parsed = {` response building that could benefit from `buildEncounterResponse()` in a follow-up ticket: `next-turn.post.ts`, `breather.post.ts`, `end.post.ts`, `serve.post.ts`, `unserve.post.ts`, `[id].get.ts`, `[id].put.ts`, `index.post.ts`, `served.get.ts`, `from-scene.post.ts`. None of these have the `backgroundImage` bug — they either use `background` (correct) or omit `gridConfig` entirely.
