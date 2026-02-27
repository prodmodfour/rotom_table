---
ticket_id: ptu-rule-074
priority: P3
status: in-progress
domain: combat
source: code-review-083
created_at: 2026-02-20
created_by: orchestrator
severity: MEDIUM
affected_files:
  - app/composables/useEncounterActions.ts
---

## Summary

The `pass` action in `handleExecuteAction()` directly mutates the reactive `combatant.turnState` object instead of using an immutable update or server endpoint. This is the same class of bug that was fixed for Sprint in ptu-rule-069.

## Code Location

`app/composables/useEncounterActions.ts`, lines 163-167:

```typescript
if (combatant.turnState) {
  combatant.turnState.hasActed = true
  combatant.turnState.standardActionUsed = true
  combatant.turnState.shiftActionUsed = true
}
```

## Issue

The `combatant` is a reference into the reactive store via `findCombatant()`. Directly mutating `.turnState` properties violates the project's immutability rules. The Sprint mutation (ptu-rule-069) was fixed by creating a server endpoint — the `pass` action should follow the same pattern.

## Expected Fix

Either:
1. Create a `pass` server endpoint (like `sprint.post.ts`) that persists the turn state change, OR
2. Use an immutable store update method that creates a new combatant object with the updated turnState

## Discovery Context

Flagged as M1 in code-review-083 (re-review of VTT batch). Originally flagged as M3 in code-review-077 but never ticketed.

## Resolution Log

### 2026-02-20: Fix implemented

**Root cause:** The `pass` action in `handleExecuteAction()` directly mutated the reactive `combatant.turnState` object via `findCombatant()`, which returns a reference into the reactive store. This violated the project's immutability rules and the turn state was not persisted to the database (page refresh would lose it).

**Changes made:**

1. **Created `app/server/api/encounters/[id]/pass.post.ts`** -- Server endpoint that marks `turnState.hasActed`, `turnState.standardActionUsed`, and `turnState.shiftActionUsed` as true using an immutable spread pattern on the server-side plain JSON object. Adds a "Pass" entry to the move log. Follows the same pattern as `sprint.post.ts` and `breather.post.ts`.

2. **Added `pass()` method to `app/stores/encounterCombat.ts`** -- Thin `$fetch` wrapper for the new server endpoint, matching the `sprint()` and `takeABreather()` patterns.

3. **Fixed `app/composables/useEncounterActions.ts`** -- Replaced the direct reactive mutation (`combatant.turnState.hasActed = true`, etc.) with an immutable server-persisted call (`encounterCombatStore.pass()`). The server returns a fresh encounter object which replaces the store state, ensuring no reactive mutation occurs.

**Duplicate code path check:** Searched entire codebase for `.turnState.` mutations in client-side code (composables, stores, components) -- no other occurrences found. The only remaining `combatant.turnState` mutations are in `breather.post.ts` (server-side, operating on plain JSON objects parsed from the database, not reactive state).
