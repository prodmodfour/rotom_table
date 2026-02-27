---
ticket_id: refactoring-035
priority: P2
categories:
  - EXT-DUPLICATE
affected_files:
  - app/pages/gm/encounter-tables.vue
estimated_scope: small
status: resolved
source: rules-review-030
created_at: 2026-02-18T19:00:00
---

## Summary

`encounter-tables.vue` does not pass scene-add errors to the `GenerateEncounterModal`'s `:add-error` prop. The `handleAddToScene` handler stores errors in a local `addError` ref, but the modal only receives `encounterCreation.error.value`. Scene-add failures are silently swallowed from the user's perspective.

## Findings

### Finding 1: EXT-DUPLICATE (inconsistent error wiring)

- **Metric:** `habitats/[id].vue` correctly wires `:add-error="encounterCreation.error.value || addError"`, but `encounter-tables.vue` only wires `:add-error="encounterCreation.error.value"`
- **Threshold:** Shared components should receive equivalent props from all consumers
- **Impact:** If adding generated Pokemon to a scene fails on the encounter-tables page, the user sees no error message. The modal stays open with no feedback.
- **Evidence:**
  - `encounter-tables.vue:141`: `:add-error="encounterCreation.error.value"`
  - `habitats/[id].vue:23`: `:add-error="encounterCreation.error.value || addError"`

## Suggested Fix

Change `encounter-tables.vue` line 141 from:
```
:add-error="encounterCreation.error.value"
```
to:
```
:add-error="encounterCreation.error.value || addError"
```

Also wire `encounterCreation.clearError()` into the `@close` handler (as `habitats/[id].vue` does).

Estimated commits: 0

## Resolution Log

- **Fixed by:** refactoring-034 (commit `a607adb`)
- **No additional code change needed.** Refactoring-034 extracted `handleAddToScene` into the `useEncounterCreation` composable, removing the local `addError` ref from `encounter-tables.vue`. All scene-add errors now flow through `encounterCreation.error.value`, which is already wired to the modal via `:add-error="encounterCreation.error.value"`. The `closeGenerateModal` handler already calls `encounterCreation.clearError()`.
- **Verification:** All three consumers (`encounter-tables.vue`, `habitats/[id].vue`, `habitats/index.vue`) now delegate to the composable and wire `encounterCreation.error.value` to the modal's `:add-error` prop.
