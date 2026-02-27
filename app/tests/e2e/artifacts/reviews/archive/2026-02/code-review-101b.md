---
review_id: code-review-101b
target: ptu-rule-046
trigger: follow-up-review
follows_up: code-review-101
reviewed_commits:
  - 4f8a299
  - 6783d14
verdict: APPROVED
reviewed_at: 2026-02-20
reviewer: senior-reviewer
---

# Follow-Up Review: ptu-rule-046 — League Battle Declaration Phase

## Context

code-review-101 raised two required changes. The developer addressed each in a dedicated commit:
- `4f8a299` — ISSUE-1: Replaced manual JSON parsing with `buildEncounterResponse` in combatant delete endpoint
- `6783d14` — ISSUE-2: Fixed misleading JSDoc on `resetCombatantsForNewRound`

## ISSUE-1 Verification: buildEncounterResponse in combatant delete endpoint

**Status: RESOLVED**

### Import and invocation

`buildEncounterResponse` is correctly imported from `~/server/services/encounter.service` at line 2 of `[combatantId].delete.ts`. It is called at line 77 with two arguments: `updatedEncounter` (the Prisma record returned from `prisma.encounter.update()`) and `combatants` (the already-parsed and modified array). This matches the function signature `buildEncounterResponse(record: EncounterRecord, combatants: Combatant[])`.

### Old manual parsing block fully removed

The diff confirms the entire manual parsing block (lines 76-83 in the old version) was deleted:

```typescript
// REMOVED:
const parsedEncounter = {
  ...updatedEncounter,
  combatants: JSON.parse(updatedEncounter.combatants || '[]'),
  turnOrder: JSON.parse(updatedEncounter.turnOrder || '[]'),
  moveLog: JSON.parse(updatedEncounter.moveLog || '[]'),
  defeatedEnemies: JSON.parse(updatedEncounter.defeatedEnemies || '[]')
}
```

No remnant of the manual parsing remains. The return statement was updated from `{ data: parsedEncounter }` to `{ data: response }`.

### All JSON fields now handled by the service function

`buildEncounterResponse` (encounter.service.ts, lines 173-227) parses every JSON-stored field:
- `turnOrder` — line 191: `JSON.parse(record.turnOrder)`
- `moveLog` — line 192: `JSON.parse(record.moveLog)`
- `defeatedEnemies` — line 193: `JSON.parse(record.defeatedEnemies)`
- `trainerTurnOrder` — line 221: `JSON.parse(record.trainerTurnOrder || '[]')`
- `pokemonTurnOrder` — line 222: `JSON.parse(record.pokemonTurnOrder || '[]')`
- `currentPhase` — line 223: cast from string to union type
- `combatants` — passed as the second argument (already parsed), not re-parsed from the record

The two fields that were missing from the original manual parsing (`trainerTurnOrder` and `pokemonTurnOrder`) are now correctly parsed. The root cause (manual parsing that diverges from the service function) has been eliminated by switching to the shared service function. This is the better of the two fix options suggested in the original review.

### Additional correctness note

The delete endpoint passes the locally modified `combatants` array (with the deleted combatant already spliced out) directly to `buildEncounterResponse`. This is correct because the Prisma update at line 66-74 writes `JSON.stringify(combatants)` to the DB, so `updatedEncounter.combatants` would contain the same data. By passing the already-parsed array, we avoid a redundant parse cycle. The service function uses the passed `combatants` parameter directly (line 210) and does not re-parse from the record.

## ISSUE-2 Verification: JSDoc on resetCombatantsForNewRound

**Status: RESOLVED**

### JSDoc accuracy

The updated JSDoc at `next-turn.post.ts` lines 135-137 reads:

```typescript
/**
 * Reset all combatants for a new round by mutating each object in the array.
 * Acceptable here because combatants are freshly parsed from JSON (no shared references).
 */
```

This accurately describes the function's behavior. The function uses `combatants.forEach((c: any) => { c.hasActed = false; ... })` which is direct property mutation on each object in the array. The word "mutating" correctly names what happens.

### Mutation justification

The JSDoc explains why mutation is acceptable: "combatants are freshly parsed from JSON (no shared references)." This is correct. At line 33, `combatants` is populated via `JSON.parse(encounter.combatants)`, which creates new objects with no shared references to any reactive store or other consumer. The mutated array is then serialized back to JSON at line 115 for the DB write. There is no risk of unintended side effects.

The previous JSDoc ("immutable pattern applied to each combatant in-place") was self-contradictory. The replacement is clear, accurate, and appropriately concise.

## Verdict

Both required changes from code-review-101 have been correctly addressed. ISSUE-1 was resolved via the stronger fix option (switching to the shared service function rather than adding two missing parse lines), which eliminates the entire class of divergent-parsing bugs. ISSUE-2 was resolved with clear, accurate documentation.

**APPROVED** — No further changes required.
