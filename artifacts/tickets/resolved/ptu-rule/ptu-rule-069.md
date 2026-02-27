---
ticket_id: ptu-rule-069
priority: P2
status: resolved
domain: combat
source: code-review-077
created_at: 2026-02-20
created_by: orchestrator
severity: HIGH
affected_files:
  - app/composables/useEncounterActions.ts
  - app/composables/useGridMovement.ts
---

## Summary

Sprint tempCondition is applied via direct reactive mutation and not persisted to database.

## Issues

1. `combatant.tempConditions.push('Sprint')` in `useEncounterActions.ts` directly mutates the reactive store object, violating the project's immutability rules.
2. Sprint is applied client-side only — page refresh loses the Sprint state. Compare with Take a Breather which persists via a server endpoint.

## Fix

1. Replace direct push with immutable array creation: `{ ...combatant, tempConditions: [...(combatant.tempConditions || []), 'Sprint'] }`
2. Persist Sprint via a server endpoint (similar to breather.post.ts) so it survives page refresh.

## Resolution Log

### 2026-02-20: Fix implemented

**Root cause:** Sprint tempCondition was applied client-side only via direct reactive mutation (`combatant.tempConditions.push('Sprint')`), violating immutability rules and not persisting to the database.

**Changes made:**

1. **Created `app/server/api/encounters/[id]/sprint.post.ts`** — Server endpoint that persists the Sprint tempCondition to the database, adds a move log entry, and returns the updated encounter. Follows the same pattern as `breather.post.ts`.

2. **Added `sprint()` method to `app/stores/encounterCombat.ts`** — Thin `$fetch` wrapper for the new server endpoint, matching the `takeABreather()` pattern.

3. **Fixed `app/composables/useEncounterActions.ts`** — Replaced the direct mutation (`combatant.tempConditions.push('Sprint')`) with an immutable server-persisted call (`encounterCombatStore.sprint()`). The server returns a fresh encounter object which replaces the store state, ensuring no reactive mutation occurs.

**Duplicate code path check:** Searched entire codebase for `tempConditions.push` — only other occurrences are in `breather.post.ts` (server-side, operating on plain JSON objects, not reactive). No other Sprint-related mutation paths found.
