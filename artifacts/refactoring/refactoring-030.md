---
ticket_id: refactoring-030
priority: P1
categories:
  - EXT-DUPLICATE
affected_files:
  - app/pages/gm/encounter-tables.vue
  - app/pages/gm/habitats/[id].vue
  - app/stores/encounter.ts
estimated_scope: small
status: resolved
created_at: 2026-02-18T12:00:00
---

## Summary

The encounter creation workflow (createEncounter → addWildPokemon → serveEncounter → navigate to /gm) is duplicated in 2 page files. This 3-step async sequence should be a single composable or store action.

## Findings

### Finding 1: EXT-DUPLICATE
- **Metric:** ~20 lines of identical async workflow in 2 files
- **Threshold:** >10 similar lines in 2+ files
- **Impact:** If the encounter creation flow changes (e.g., new required step, different navigation target), both files must be updated independently.
- **Evidence:**
  - encounter-tables.vue lines 486-508: `encounterStore.createEncounter(tableName, 'full_contact')` → `encounterStore.addWildPokemon(pokemonToAdd, 'enemies')` → `encounterStore.serveEncounter()` → `router.push('/gm')`
  - habitats/[id].vue lines 87-103: Same 3-step sequence with identical error handling pattern (post refactoring-023 — page is now a thin wrapper)

## Suggested Refactoring

1. Add `createWildEncounterFromGeneration(pokemon, tableName)` action to `encounter.ts` store (or create `useEncounterCreation` composable)
2. The action encapsulates: create → add wild pokemon → serve → return success/error
3. Both pages call the single action and handle navigation on success
4. Optionally include the navigation in the composable if it always goes to `/gm`

Estimated commits: 1-2

## Related Lessons
- Pattern F (duplicate code paths for same operation) — retrospective-summary.md

## Resolution Log
- Commits: `29c270f` (extract composable), `5583fa1` (update habitats/[id].vue), `5d6a26f` (update encounter-tables.vue)
- Files changed: `app/pages/gm/habitats/[id].vue`, `app/pages/gm/encounter-tables.vue`
- New files created: `app/composables/useEncounterCreation.ts`
- Tests passing: typecheck passes (pre-existing errors only, none from changes)
