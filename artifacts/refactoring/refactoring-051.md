---
ticket_id: refactoring-051
priority: P2
categories:
  - EXT-DUPLICATE
affected_files:
  - app/server/api/encounters/[id].get.ts
  - app/server/api/encounters/[id].put.ts
  - app/server/api/encounters/[id]/serve.post.ts
  - app/server/api/encounters/[id]/unserve.post.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/api/encounters/index.post.ts
  - app/server/api/encounters/from-scene.post.ts
  - app/server/api/encounters/served.get.ts
estimated_scope: small
status: resolved
created_at: 2026-02-20
filed_by: code-review-086
---

## Summary

8 encounter API endpoints manually construct encounter response objects (`const parsed = { ... }`) instead of using the shared `buildEncounterResponse()` from `encounter.service.ts`. This is the same pattern that caused ptu-rule-073 (missing weather fields) and was partially fixed in commit `c1d49a7` for sprint, breather, and end endpoints. The remaining 8 endpoints have varying degrees of field drift from the canonical `ParsedEncounter` interface.

## Findings

### Finding 1: EXT-DUPLICATE

- **Metric:** 8 endpoints with duplicated response construction logic
- **Threshold:** Shared builder function exists and is already used by 14+ other endpoints
- **Impact:** Field drift -- `serve.post.ts` and `unserve.post.ts` are missing 7 fields each (`gridConfig`, `sceneNumber`, `currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`, `createdAt`, `updatedAt`). All 8 endpoints are missing at least `createdAt` and `updatedAt`. Any future field added to `ParsedEncounter` will need manual updates in 8 places instead of 1.
- **Evidence:**
  - `grep 'const parsed = {' app/server/api/encounters/` returns 8 hits
  - `grep 'buildEncounterResponse' app/server/api/encounters/` returns 14 endpoints already using the shared builder
  - The 3 endpoints fixed in commit `c1d49a7` (sprint, breather, end) are the template for the remaining 8

### Missing fields per endpoint

| Endpoint | Missing vs ParsedEncounter |
|----------|---------------------------|
| `serve.post.ts` | `gridConfig`, `sceneNumber`, `currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`, `createdAt`, `updatedAt` |
| `unserve.post.ts` | `gridConfig`, `sceneNumber`, `currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`, `createdAt`, `updatedAt` |
| `[id].get.ts` | `createdAt`, `updatedAt` |
| `[id].put.ts` | `createdAt`, `updatedAt` |
| `next-turn.post.ts` | `createdAt`, `updatedAt` |
| `index.post.ts` | `createdAt`, `updatedAt` |
| `from-scene.post.ts` | `createdAt`, `updatedAt` |
| `served.get.ts` | `createdAt`, `updatedAt` |

## Suggested Refactoring

Replace each `const parsed = { ... }` block with a call to `buildEncounterResponse(record, combatants, overrides?)`. Follow the pattern from commit `c1d49a7`:

1. Add `import { buildEncounterResponse } from '~/server/services/encounter.service'` (or add to existing import)
2. Replace the manual `parsed` object with `const response = buildEncounterResponse(record, combatants, { ...overrides })`
3. Remove the manual `JSON.parse(record.turnOrder)` line that precedes the `parsed` block (handled internally by the builder)
4. For `next-turn.post.ts`: pass `currentRound`, `currentTurnIndex`, `turnOrder` as overrides since the endpoint computes new values
5. For `index.post.ts`: pass `combatants: [], turnOrder: [], moveLog: [], defeatedEnemies: []` as overrides since these are empty for a new encounter (or adjust the builder to handle fresh records)

Estimated commits: 1-2 (mechanical, same pattern repeated 8 times)

## Resolution Log

All 8 endpoints migrated to `buildEncounterResponse()` in 4 commits:

- **`c61549d`** — `[id].get.ts`, `served.get.ts`: Replaced manual response with `loadEncounter()` + `buildEncounterResponse()`. Added `createdAt`/`updatedAt`.
- **`6912161`** — `serve.post.ts`, `unserve.post.ts`: Added 7 missing fields (`gridConfig`, `sceneNumber`, `currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`, `createdAt`, `updatedAt`).
- **`b6100c3`** — `index.post.ts`, `from-scene.post.ts`: Fresh encounter creation now uses builder with empty combatants array. Added `createdAt`/`updatedAt`.
- **`7a31790`** — `[id].put.ts`, `next-turn.post.ts`: Mutation endpoints now capture the updated Prisma record and pass it to the builder. Added `createdAt`/`updatedAt`.

**Files changed:** 8 endpoint files
**Tests:** 640/640 Vitest unit tests pass. No regressions.
**Verification:** `grep 'const parsed = {' app/server/api/encounters/` returns 0 hits. All 21 encounter endpoint files now use `buildEncounterResponse`.
