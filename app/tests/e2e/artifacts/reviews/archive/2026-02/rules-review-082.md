# Rules Review 082 — refactoring-051 (Encounter Endpoint Response Builder Migration)

**Ticket:** refactoring-051
**Commits:** `c61549d`, `6912161`, `b6100c3`, `7a31790`
**Reviewed:** 2026-02-20
**Verdict:** PASS

## Scope

8 encounter API endpoints were migrated from manual response construction (`const parsed = { ... }`) to the shared `buildEncounterResponse()` function in `encounter.service.ts`. This is a structural refactoring -- no PTU formulas, damage calculations, or game mechanics were changed.

## Detailed Findings

### 1. Combat-Relevant Field Preservation

Verified that `buildEncounterResponse()` (lines 170-224 of `encounter.service.ts`) produces all combat-critical fields:

| Field | Source | Correct? |
|-------|--------|----------|
| `combatants` | Passed as parameter (pre-parsed `Combatant[]`) | Yes |
| `turnOrder` | `JSON.parse(record.turnOrder)` or override | Yes |
| `currentRound` | `record.currentRound` or override | Yes |
| `currentTurnIndex` | `record.currentTurnIndex` or override | Yes |
| `moveLog` | `JSON.parse(record.moveLog)` or override | Yes |
| `defeatedEnemies` | `JSON.parse(record.defeatedEnemies)` or override | Yes |
| `weather` | `record.weather ?? null` | Yes |
| `weatherDuration` | `record.weatherDuration ?? 0` | Yes |
| `weatherSource` | `record.weatherSource ?? null` | Yes |
| `isActive` | `record.isActive` or override | Yes |
| `isPaused` | `record.isPaused` or override | Yes |
| `isServed` | `record.isServed` (no override path) | Yes |
| `currentPhase` | Override or default `'pokemon'` | Yes |
| `trainerTurnOrder` | Override or default `[]` | Yes |
| `pokemonTurnOrder` | Override or default `[]` | Yes |

All fields match what the manual construction previously produced. The builder additionally provides `createdAt`, `updatedAt`, `gridConfig`, and `sceneNumber` that some endpoints were previously missing.

### 2. next-turn.post.ts -- Updated Values (Critical Check)

**Concern:** The endpoint computes new `currentRound`, `currentTurnIndex`, `weather`, `weatherDuration`, `weatherSource`, and mutated `combatants` in memory, then writes to DB. Must pass the updated values (not stale) to the builder.

**Finding: CORRECT.** The endpoint:
1. Computes new values in local variables (`currentTurnIndex`, `currentRound`, `weather`, etc.)
2. Writes them to DB via `prisma.encounter.update()` and captures the result as `updatedRecord`
3. Passes `updatedRecord` to `buildEncounterResponse(updatedRecord, combatants)`

The builder reads `currentRound`, `currentTurnIndex`, `weather`, `weatherDuration`, `weatherSource` directly from `updatedRecord`, which contains the post-write values. The `combatants` parameter is the in-memory array with all mutations (`hasActed`, `tempConditions` cleared, action counts reset) already applied -- this same array was serialized and written to DB, so it is consistent.

No overrides are needed because the Prisma update returns the committed row.

### 3. serve.post.ts -- isServed Field

**Concern:** After serving, `isServed` must be `true` in the response.

**Finding: CORRECT.** The Prisma transaction sets `data: { isServed: true }` and returns the updated encounter record. The builder reads `isServed: record.isServed` (line 213) with no override path, so it correctly reflects `true`.

### 4. unserve.post.ts -- isServed Field

**Concern:** After unserving, `isServed` must be `false` in the response.

**Finding: CORRECT.** The Prisma update sets `data: { isServed: false }` and returns the updated record. Builder reads `record.isServed` which is `false`.

### 5. [id].put.ts -- Full State Update

**Concern:** This endpoint accepts a full encounter state from the client and writes it to DB. The response must reflect the written state.

**Finding: CORRECT.** The Prisma update returns the written row. The builder reads all fields from this record. Combatants are re-parsed from the DB string via `JSON.parse(encounter.combatants)`, ensuring consistency with what was actually persisted.

### 6. index.post.ts and from-scene.post.ts -- Fresh Encounters

**Concern:** New encounters have empty combatants, turnOrder, moveLog, and defeatedEnemies.

**Finding: CORRECT.**
- `index.post.ts` passes `buildEncounterResponse(encounter, [])` with the freshly created record. The builder will `JSON.parse` the `'[]'` strings for turnOrder, moveLog, defeatedEnemies, yielding empty arrays.
- `from-scene.post.ts` passes `buildEncounterResponse(updatedEncounter, combatants)` where `updatedEncounter` is the post-update record with combatants saved, and `combatants` is the in-memory array built during scene processing. Consistent.

### 7. gridConfig Behavior Change (Informational)

The old manual construction always built a `GridConfig` object regardless of `gridEnabled`:
```typescript
gridConfig: {
  enabled: encounter.gridEnabled,
  width: encounter.gridWidth,
  // ...
} as GridConfig,
```

The builder returns `null` when `gridEnabled` is false:
```typescript
const gridConfig: GridConfig | null = record.gridEnabled ? { ... } : null
```

This is a minor behavioral difference but is **not a PTU rule concern**. The builder has been used by 14+ other endpoints already, so the client handles this pattern. The `Encounter` type in `types/encounter.ts` declares `gridConfig: GridConfig` (non-nullable), but `ParsedEncounter` in the service uses `GridConfig | null` -- this is a pre-existing type-level inconsistency unrelated to this refactoring.

## PTU Mechanics Checklist

- [x] No damage formulas modified
- [x] No accuracy calculations modified
- [x] No initiative/turn order logic changed
- [x] No combat stage multipliers affected
- [x] No capture rate calculations touched
- [x] No weather duration/expiration logic changed (next-turn still computes weather in its own code; builder just serializes the result)
- [x] No rest/healing mechanics affected
- [x] No move frequency tracking altered
- [x] Turn progression logic in next-turn.post.ts unchanged (only response construction migrated)
- [x] PTU maneuver endpoints not in scope (already migrated in prior commit `c1d49a7`)

## Decision

**PASS** -- pure response construction refactoring with no PTU rule impact. All combat-relevant fields are correctly sourced from the Prisma record or passed combatants array. The `next-turn.post.ts` endpoint correctly uses the post-update DB record, ensuring `currentRound`, `currentTurnIndex`, and weather state are fresh. The `serve`/`unserve` endpoints correctly reflect `isServed` from the post-write record.
