---
review_id: code-review-101
target: ptu-rule-046
trigger: orchestrator-routed
reviewed_commits:
  - 4a326c1
  - 4aaf84c
  - 0328d43
  - bbe7a7c
  - baa5e0e
  - 09dc204
  - c9352d6
  - bca5335
  - 218f2df
  - 46c3ea6
  - 626a47f
verdict: CHANGES_REQUIRED
reviewed_at: 2026-02-20
reviewer: senior-reviewer
---

# Code Review: ptu-rule-046 — League Battle Declaration Phase

## Scope

11 commits implementing PTU League battle declaration phase: schema changes, start/next-turn endpoints, WebSocket sync, UI phase badges (EncounterHeader, CombatantSides, InitiativeTracker), list/PUT/DELETE endpoint fixes, and ticket docs update.

## Summary

The implementation correctly models PTU's League battle round structure with separate trainer declaration (low-to-high speed) and pokemon action (high-to-low speed) phases. The architecture is sound: phase state is persisted to DB, synced over WebSocket, and surfaced in both GM and Group views. Full Contact mode is properly isolated. However, there are two required fixes.

## Required Changes

### ISSUE-1 [HIGH]: Delete endpoint returns unparsed JSON strings for trainerTurnOrder and pokemonTurnOrder

**File:** `app/server/api/encounters/[id]/combatants/[combatantId].delete.ts`, lines 76-83

The response builder uses `...updatedEncounter` spread, which includes the raw Prisma record. Then it manually parses `combatants`, `turnOrder`, `moveLog`, and `defeatedEnemies` — but does NOT parse `trainerTurnOrder` or `pokemonTurnOrder`. These fields will be returned to the client as JSON strings (e.g. `"[\"abc\"]"`) instead of arrays.

This will break the client-side encounter store update: `this.encounter.trainerTurnOrder` will become a string instead of `string[]`, causing the `trainersByTurnOrder` and `pokemonByTurnOrder` getters (which call `.map()`) to fail silently or produce garbage.

**Fix:** Add the two missing JSON.parse lines to the response builder:

```typescript
const parsedEncounter = {
  ...updatedEncounter,
  combatants: JSON.parse(updatedEncounter.combatants || '[]'),
  turnOrder: JSON.parse(updatedEncounter.turnOrder || '[]'),
  trainerTurnOrder: JSON.parse(updatedEncounter.trainerTurnOrder || '[]'),   // ADD
  pokemonTurnOrder: JSON.parse(updatedEncounter.pokemonTurnOrder || '[]'),    // ADD
  moveLog: JSON.parse(updatedEncounter.moveLog || '[]'),
  defeatedEnemies: JSON.parse(updatedEncounter.defeatedEnemies || '[]')
}
```

Alternatively, refactor the delete endpoint to use `buildEncounterResponse()` (which already handles all field parsing correctly) instead of building the response manually. This would prevent the class of bug entirely.

### ISSUE-2 [MEDIUM]: `resetCombatantsForNewRound` JSDoc contradicts its behavior

**File:** `app/server/api/encounters/[id]/next-turn.post.ts`, line 136

The function's JSDoc says "immutable pattern applied to each combatant in-place" — but the function directly mutates each combatant (`c.hasActed = false`, etc.). This is not an immutability pattern; it is plain mutation.

The mutation is acceptable in this server-side context because the combatants array is a freshly parsed JSON array (not a reactive store object), but the JSDoc is misleading and contradictory.

**Fix:** Change the JSDoc to accurately describe the behavior:

```typescript
/**
 * Reset all combatants' turn state for a new round.
 * Mutates combatant objects in the provided array.
 */
```

## Verified (No Issues)

### Full Contact mode isolation

Full Contact mode is properly guarded. In `start.post.ts`, the `if (encounter.battleType === 'trainer')` branch is the only place where trainer/pokemon sorting and phase assignment occur. The `else` branch (Full Contact) sets `currentPhase = 'pokemon'` and uses standard high-to-low sorting. In `next-turn.post.ts`, `isLeagueBattle` flag isolates all phase transition logic. Full Contact's linear progression path is unchanged.

### Phase transitions correctness

The transition logic in `next-turn.post.ts` is correct:
- `trainer_declaration` phase ends -> transitions to `pokemon` phase (turnOrder swaps to pokemonTurnOrder, index resets to 0)
- `pokemon` phase ends -> new round starts with `trainer_declaration` (turnOrder swaps to trainerTurnOrder, index resets to 0, combatants reset, weather decremented)
- Edge case: no Pokemon after trainer phase -> immediately starts new round
- Edge case: no trainers after pokemon phase -> stays in pokemon phase for next round

### Turn order sorting

Trainers: `sortByInitiativeWithRollOff(trainers, false)` — `descending: false` produces low-to-high speed order. The sort function at `encounter.service.ts:161` negates the comparison when `descending` is false, which correctly reverses to ascending. Pokemon: `sortByInitiativeWithRollOff(pokemon, true)` — standard high-to-low. Both are correct per PTU rules.

### WebSocket sync

Commit `bbe7a7c` adds all four relevant fields (`currentPhase`, `turnOrder`, `trainerTurnOrder`, `pokemonTurnOrder`) to the surgical WebSocket update handler in `encounter.ts:361-365`. The `updateFromWebSocket` action uses nullish coalescing (`??`) to preserve existing values when incoming data omits fields. This is correct and consistent with the existing pattern.

### Undo/redo preservation

Commit `218f2df` adds `currentPhase`, `trainerTurnOrder`, and `pokemonTurnOrder` to the PUT endpoint's data object. The undo/redo system in the store calls `$fetch(PUT)` with the full encounter snapshot, so these fields will be persisted and restored correctly.

### Combatant deletion cleanup

Commit `46c3ea6` correctly removes deleted combatants from all three turn order arrays (`turnOrder`, `trainerTurnOrder`, `pokemonTurnOrder`). The response bug noted in ISSUE-1 is separate from the DB persistence, which is correct.

### File sizes

All files are well under the 800-line limit:
- `encounter.ts` (store): 609 lines
- `next-turn.post.ts`: 164 lines
- `start.post.ts`: 162 lines
- `encounter.service.ts`: 268 lines
- `EncounterHeader.vue`: 397 lines
- `CombatantSides.vue`: 279 lines
- `InitiativeTracker.vue`: 310 lines

### Schema design

New columns (`currentPhase`, `trainerTurnOrder`, `pokemonTurnOrder`) use sensible defaults (`"pokemon"` and `"[]"`) so existing encounters are unaffected. The use of JSON-stringified arrays for turn orders is consistent with the existing `turnOrder` column pattern.

### Type system

`TurnPhase` union type correctly extended to `'trainer_declaration' | 'trainer_resolution' | 'pokemon'`. All server-side type annotations are consistent. The `ParsedEncounter` interface and `buildEncounterResponse` options type both reference the full union.

### Unit tests

All 640 Vitest unit tests pass. The 43 "failed" test files in the run output are Playwright e2e specs that are not designed for Vitest execution (different test runner) and are pre-existing.

## Observations (Ticketed)

### OBS-1: `trainer_resolution` phase is declared but never used

The `TurnPhase` type includes `'trainer_resolution'`, UI components have labels for it, but no server-side logic ever sets `currentPhase = 'trainer_resolution'`. The current implementation transitions directly from `trainer_declaration` to `pokemon`, which is a valid simplification for this ticket's scope (declaration order is the primary gap). However, this should be tracked for future implementation if the full declaration-then-resolution split is desired. File a ticket if this is intentionally deferred.

### OBS-2: Commit `4a326c1` bundles unrelated changes

The first commit ("feat: add League battle phase columns to Encounter schema") includes 4 unrelated component refactors (replacing hardcoded type-badge styles with `@include pokemon-sheet-type-badge` mixin and replacing a star emoji with PhStar icon in CharacterModal). These should have been a separate commit per the project's commit guidelines. Not blocking, but noted for future discipline.

### OBS-3: `phaseTitle` computed in InitiativeTracker has redundant logic

`InitiativeTracker.vue:61-68` — the `phaseTitle` computed property has overlapping branches. When `currentPhase === 'pokemon'`, the first branch enters, then falls through to `return PHASE_TITLES['pokemon']` which returns `'Pokemon Phase'`. But this means League battles in the pokemon phase show "Pokemon Phase" as the tracker title, which is correct. Full Contact (where `currentPhase` is `undefined`) returns "Initiative", also correct. The code works but could be simplified to a single `return props.currentPhase ? (PHASE_TITLES[props.currentPhase] ?? 'Initiative') : 'Initiative'`. Not blocking.
