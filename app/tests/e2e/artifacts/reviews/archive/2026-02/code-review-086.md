---
review_id: code-review-086
review_type: code
reviewer: senior-reviewer
follows_up: code-review-084
trigger: changes-required-followup
target_tickets: [ptu-rule-073]
commits_reviewed:
  - c1d49a7
files_reviewed:
  - app/server/api/encounters/[id]/sprint.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/end.post.ts
  - app/server/services/encounter.service.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
scenarios_to_rerun: []
reviewed_at: 2026-02-20T06:00:00Z
---

## Review Scope

Follow-up review of commit `c1d49a7` which replaces manual response construction with `buildEncounterResponse()` in three encounter endpoints. This directly addresses the HIGH issue from code-review-084: sprint, breather, and end endpoints manually constructed response objects that omitted `isServed`, `gridConfig`, `sceneNumber`, `currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`, `createdAt`, and `updatedAt`.

## Status Table

| Endpoint | Manual construction removed | Uses buildEncounterResponse | Overrides correct | Status |
|----------|---------------------------|----------------------------|--------------------|--------|
| sprint.post.ts | Yes (17 lines removed) | Yes, with `{ moveLog }` | N/A (no overrides needed) | APPROVED |
| breather.post.ts | Yes (17 lines removed) | Yes, with `{ moveLog }` | N/A (no overrides needed) | APPROVED |
| end.post.ts | Yes (13 lines removed) | Yes, with `{ isActive: false, isPaused: false }` | Correct -- see analysis below | APPROVED |

## Detailed Verification

### sprint.post.ts

**Import:** Updated correctly at line 7 -- `buildEncounterResponse` added to the existing import from `encounter.service.ts`.

**Call site (line 63):**
```typescript
const response = buildEncounterResponse(record, combatants, { moveLog })
```

The `moveLog` override is necessary because the endpoint appends a Sprint log entry to the parsed moveLog array (lines 43-53) and then writes it to the database (line 59). The `record.moveLog` still contains the pre-update JSON string, so passing the updated `moveLog` array as an override ensures the response includes the new log entry. Correct.

The `record` variable comes from `loadEncounter(id)` (line 28), which returns the raw Prisma record. `combatants` comes from the same call, already parsed. Both match the `EncounterRecord` and `Combatant[]` parameter types of `buildEncounterResponse`. Correct.

### breather.post.ts

**Import:** Updated correctly at line 9 -- `buildEncounterResponse` added to the existing import.

**Call site (line 129):**
```typescript
const response = buildEncounterResponse(record, combatants, { moveLog })
```

Same pattern as sprint. The `moveLog` is modified at lines 109-119 (adds "Take a Breather" log entry) before the DB write at line 121-127. Passing the updated `moveLog` as an override is correct.

### end.post.ts

**Import:** New import added at line 13 -- `buildEncounterResponse` imported from `encounter.service.ts`. The `loadEncounter` import was not added because `end.post.ts` uses a direct `prisma.encounter.findUnique` call (line 42) rather than the `loadEncounter` helper. This is fine -- `buildEncounterResponse` accepts any object matching the `EncounterRecord` interface, which the raw Prisma query result satisfies.

**Call site (lines 159-162):**
```typescript
const response = buildEncounterResponse(encounter, updatedCombatants, {
  isActive: false,
  isPaused: false
})
```

**Override analysis:** The `encounter` variable is fetched at line 42 (before the DB update at line 92). After the DB update sets `isActive: false, isPaused: false`, the local `encounter` still holds the pre-update values. The overrides ensure the response reflects the actual post-update state. `buildEncounterResponse` applies overrides at lines 211-212: `isActive: options?.isActive ?? record.isActive`. Correct.

**No moveLog override needed:** Unlike sprint/breather, `end.post.ts` does not modify the moveLog. The `buildEncounterResponse` call will parse `encounter.moveLog` from the original record, which is still the correct value (the DB update at line 92 does not modify `moveLog`). Correct.

**No defeatedEnemies override needed:** Same reasoning -- `end.post.ts` does not modify `defeatedEnemies`, so the default parsing from `record.defeatedEnemies` at `buildEncounterResponse` line 190 is correct.

### Response shape comparison

Before this commit, all three endpoints returned a `parsed` object with ~12 fields. After this commit, all three return the output of `buildEncounterResponse`, which includes the full `ParsedEncounter` interface (22 fields). The 8 previously-missing fields are now present:

| Field | Source in buildEncounterResponse |
|-------|--------------------------------|
| `isServed` | `record.isServed` (line 213) |
| `gridConfig` | Built from `record.gridEnabled/Width/Height/CellSize/Background` (lines 192-198) |
| `sceneNumber` | Hardcoded `1` (line 216) |
| `currentPhase` | Default `'pokemon'` (line 220) |
| `trainerTurnOrder` | Default `[]` (line 218) |
| `pokemonTurnOrder` | Default `[]` (line 219) |
| `createdAt` | `record.createdAt` (line 221) |
| `updatedAt` | `record.updatedAt` (line 222) |

No fields were lost. The wrapper return structures (`sprintResult`, `breatherResult`) in sprint and breather endpoints are unchanged.

### Net code reduction

The diff shows -58 lines / +11 lines across 3 files. Each endpoint removed ~17 lines of manual object construction and replaced it with a single function call. Clean, mechanical refactoring.

## Search for remaining manually-constructed endpoints

Grepping for `const parsed = {` across the encounter API directory reveals **8 additional endpoints** that still manually construct encounter response objects instead of using `buildEncounterResponse()`:

| Endpoint | Missing fields vs ParsedEncounter |
|----------|----------------------------------|
| `[id].get.ts` | `createdAt`, `updatedAt` |
| `[id].put.ts` | `createdAt`, `updatedAt` |
| `[id]/serve.post.ts` | `gridConfig`, `sceneNumber`, `currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`, `createdAt`, `updatedAt` |
| `[id]/unserve.post.ts` | `gridConfig`, `sceneNumber`, `currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`, `createdAt`, `updatedAt` |
| `[id]/next-turn.post.ts` | `createdAt`, `updatedAt` |
| `index.post.ts` | `createdAt`, `updatedAt` |
| `from-scene.post.ts` | `createdAt`, `updatedAt` |
| `served.get.ts` | `createdAt`, `updatedAt` |

These are the same class of drift that originally caused ptu-rule-073. Filing as a new refactoring ticket (see below).

## New Tickets Filed

1. **refactoring-051: Migrate remaining 8 encounter endpoints to buildEncounterResponse()** -- `serve.post.ts`, `unserve.post.ts`, `next-turn.post.ts`, `[id].get.ts`, `[id].put.ts`, `index.post.ts`, `from-scene.post.ts`, `served.get.ts` all manually construct encounter response objects. They should use the shared `buildEncounterResponse()` from `encounter.service.ts` to prevent field drift. Priority P2. `serve.post.ts` and `unserve.post.ts` are missing 7 fields each; the remaining 6 are missing `createdAt` and `updatedAt`.

2. **ptu-rule-075: breather.post.ts uses push() mutation for tempConditions** -- Lines 89 and 93 use `combatant.tempConditions.push('Tripped')` and `.push('Vulnerable')`, mutating the array in place. The sprint endpoint at lines 37-38 uses the correct immutable spread pattern: `combatant.tempConditions = [...combatant.tempConditions, 'Sprint']`. Pre-existing, not introduced by this commit. Severity: LOW (server-side parsed JSON, not reactive, but inconsistent with sprint's pattern and project immutability rules).

## What Looks Good

1. **Mechanical correctness:** All three replacements are exact functional equivalents plus the 8 previously-missing fields. No behavioral change to existing fields.

2. **Override pattern in end.post.ts:** The developer correctly identified that `end.post.ts` needs `isActive: false, isPaused: false` overrides because the local `encounter` variable predates the DB update. They did NOT pass unnecessary `moveLog` or `defeatedEnemies` overrides, letting `buildEncounterResponse` parse them from the record. This shows understanding of the function's fallback semantics.

3. **Import hygiene:** `end.post.ts` added only `buildEncounterResponse` (not `loadEncounter`) since it uses a direct Prisma query. Sprint and breather added `buildEncounterResponse` to their existing multi-import from `encounter.service.ts`. No unused imports.

4. **Commit scope:** Single commit, three files, one concern (response standardization). Correct granularity for a mechanical refactoring.

## Verdict

**APPROVED** -- The refactoring correctly replaces manual response construction with `buildEncounterResponse()` in all three endpoints. The 8 previously-missing fields are now present. The override pattern in `end.post.ts` is correct. No fields were lost or changed. The ptu-rule-073 ticket can be marked as done.
