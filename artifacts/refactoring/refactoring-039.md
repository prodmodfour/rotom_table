---
ticket_id: refactoring-039
priority: P2
categories:
  - EXT-DUPLICATE
affected_files:
  - app/pages/gm/habitats/index.vue
estimated_scope: small
status: resolved
created_at: 2026-02-19T15:30:00
found_by: code-review-048
---

## Summary

`habitats/index.vue` manually reimplements the encounter creation workflow (lines 185-205) with local `addingToEncounter` and `addError` refs instead of using `useEncounterCreation.createWildEncounter()`. This is the same class of duplication that refactoring-034 fixed for the scene addition path — the encounter path in this file was missed because it wasn't in the original ticket's scope.

## Findings

### Finding 1: EXT-DUPLICATE
- **Metric:** 20 lines of inline encounter creation logic duplicating `useEncounterCreation.createWildEncounter()`
- **Threshold:** >10 similar lines in 2+ files
- **Impact:** If encounter creation workflow changes (e.g., new steps, different error handling), this file won't pick up the change. The composable is already used by the sibling pages (`encounter-tables.vue`, `habitats/[id].vue`) — this is the sole remaining holdout.
- **Evidence:**

  `habitats/index.vue:185-205`:
  ```typescript
  const handleAddToEncounter = async (pokemon: Array<{ speciesId: string; speciesName: string; level: number }>) => {
    addingToEncounter.value = true
    addError.value = null
    try {
      const tableName = generatingFromTable.value?.name || 'Wild Encounter'
      await encounterStore.createEncounter(tableName, 'full_contact')
      const added = await encounterStore.addWildPokemon(pokemon, 'enemies')
      await encounterStore.serveEncounter()
      generatingFromTable.value = null
    } catch (e: any) {
      addError.value = e.message || 'Failed to add Pokemon to encounter'
    } finally {
      addingToEncounter.value = false
    }
  }
  ```

  Compare with `useEncounterCreation.createWildEncounter()` which does the identical sequence: create encounter → add wild Pokemon → serve encounter → return success/failure.

## Suggested Refactoring

1. Import and use `useEncounterCreation` in `habitats/index.vue`
2. Replace `handleAddToEncounter` with a call to `encounterCreation.createWildEncounter()`
3. Remove local `addingToEncounter` and `addError` refs
4. Update `:add-error` and `:adding-to-encounter` bindings to use composable refs
5. Note: this page does NOT have `@add-to-scene` or `:scenes` — only the encounter path needs updating

Estimated commits: 1

## Related Lessons
- refactoring-034 fixed the scene addition path; this is the encounter creation path in the same family of pages

## Resolution Log
- Commits: 337f6df
- Files changed: app/pages/gm/habitats/index.vue
- New files created: none
- Tests passing: no regressions (behavioral equivalent — composable performs identical sequence)
