---
ticket_id: refactoring-034
priority: P2
categories:
  - EXT-DUPLICATE
affected_files:
  - app/pages/gm/encounter-tables.vue
  - app/pages/gm/habitats/[id].vue
estimated_scope: small
status: resolved
created_at: 2026-02-18T19:30:00
found_by: code-review-033
---

## Summary

`handleAddToScene` is duplicated verbatim in `encounter-tables.vue:267-279` and `habitats/[id].vue:72-84`. Both perform the same sequential `$fetch` loop to add generated Pokemon to a scene, with identical error handling. This duplication was introduced when `encounter-tables.vue` adopted `GenerateEncounterModal` (refactoring-027), which requires a scene-add handler.

## Findings

### Finding 1: EXT-DUPLICATE
- **Metric:** 8 lines of identical async logic in 2 files
- **Threshold:** >10 similar lines in 2+ files (borderline but the logic is non-trivial async with error handling)
- **Impact:** If the scene Pokemon addition API changes (e.g., batch endpoint, different body shape), both files must be updated. The pattern is also a candidate for extension if more pages adopt `GenerateEncounterModal`.
- **Evidence:**

  `encounter-tables.vue:267-279`:
  ```typescript
  const handleAddToScene = async (sceneId: string, pokemon: Array<...>) => {
    addError.value = null
    try {
      for (const p of pokemon) {
        await $fetch(`/api/scenes/${sceneId}/pokemon`, {
          method: 'POST',
          body: { species: p.speciesName, level: p.level, speciesId: p.speciesId }
        })
      }
      closeGenerateModal()
    } catch (e: unknown) {
      addError.value = e instanceof Error ? e.message : 'Failed to add Pokemon to scene'
    }
  }
  ```

  `habitats/[id].vue:72-84`: Identical except `showGenerateModal.value = false` instead of `closeGenerateModal()`.

## Suggested Refactoring

Extract into `useEncounterCreation` composable (which already handles the encounter creation workflow) or a new `useSceneAddition` composable. Return `{ addToScene, addingToScene, addError }` so both pages delegate to the composable.

Estimated commits: 1

## Resolution Log

- **Commit:** `a607adb` — refactor: extract handleAddToScene into useEncounterCreation composable
- **Files changed:**
  - `app/composables/useEncounterCreation.ts` — added `addToScene()` method returning `Promise<boolean>`, unified error handling through existing `error` ref
  - `app/pages/gm/encounter-tables.vue` — replaced inline `$fetch` loop with `encounterCreation.addToScene()`, removed local `addError` ref
  - `app/pages/gm/habitats/[id].vue` — same replacement, removed local `addError` ref, simplified `@close` handler
- **Test status:** Typecheck passes (exit 0), all 508 unit tests pass
- **Behavior change:** None — identical API calls and error handling, only the code location moved
