---
review_id: code-review-033
review_type: code
reviewer: senior-reviewer
trigger: bug-fix | refactoring
target_report: ptu-rule-029 | refactoring-030 | refactoring-027
domain: encounter-tables, healing
commits_reviewed:
  - 7783c65
  - 29c270f
  - 5583fa1
  - f82c28d
  - 5d6a26f
files_reviewed:
  - app/components/common/HealingTab.vue
  - app/composables/useEncounterCreation.ts
  - app/pages/gm/habitats/[id].vue
  - app/components/encounter-table/ImportTableModal.vue
  - app/pages/gm/encounter-tables.vue
  - app/pages/gm/encounter-tables/[id].vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
scenarios_to_rerun:
  - encounter-tables-generate
  - encounter-tables-import
reviewed_at: 2026-02-18T19:30:00
---

## Review Scope

Five commits across three tickets:
- **ptu-rule-029** (commit `7783c65`): Remove "Asleep" from persistent conditions list in extended rest description
- **refactoring-030** (commits `29c270f`, `5583fa1`): Extract `useEncounterCreation` composable, integrate into habitat editor
- **refactoring-027** (commits `f82c28d`, `5d6a26f`): Extract `ImportTableModal`, decompose `encounter-tables.vue` from 927→443 lines

## Issues

### CRITICAL
None.

### HIGH

1. **Scene-add error silently swallowed in encounter-tables.vue** — `encounter-tables.vue:141`

   The habitat page correctly merges both error sources:
   ```vue
   <!-- habitats/[id].vue:23 — CORRECT -->
   :add-error="encounterCreation.error.value || addError"
   ```

   The encounter-tables page only passes encounter creation errors:
   ```vue
   <!-- encounter-tables.vue:141 — BUG -->
   :add-error="encounterCreation.error.value"
   ```

   `handleAddToScene` (line 267) sets `addError.value` on failure, but the modal never receives it. The user gets no feedback when scene addition fails.

   **Fix:**
   ```vue
   :add-error="encounterCreation.error.value || addError"
   ```

### MEDIUM

1. **ptu-rule-029 ticket status not updated** — `app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-029.md:5`

   Status is still `in-progress`. Should be `resolved` since the fix is committed.

   **Fix:** Change `status: in-progress` → `status: resolved`

## New Ticket Filed

**refactoring-034** — `handleAddToScene` is duplicated verbatim in `encounter-tables.vue:267-279` and `habitats/[id].vue:72-84`. Same 8-line sequential `$fetch` loop with identical error handling. This duplication was introduced by this refactoring (the old encounter-tables page didn't have scene support; adopting `GenerateEncounterModal` required adding the handler). Should be extracted to a composable (extend `useEncounterCreation` or create `useSceneAddition`).

## What Looks Good

- **useEncounterCreation composable** is well-designed: `readonly()` return values, clear error/loading state, boolean success return for callers to handle modal dismiss. Clean separation.
- **927→443 line reduction** is substantial. The page went from 7 responsibilities to 2 (list/filter + create modal). Generate and import are properly delegated to existing components.
- **`?generate=tableId` query param pattern** is a smart way to let the editor's Generate button reuse the list page's modal without duplicating `GenerateEncounterModal` integration in the editor. The `closeGenerateModal` cleanup that strips the query param is thorough.
- **ImportTableModal** is a faithful extraction — no behavior changes, properly scoped SCSS, typed emits.
- **Commit granularity** is correct: composable first, then consumers, then extraction, then decomposition. Each commit produces a working state.
- **Dead code removal** — `deleteTable`, `exportTable` (never bound in template), inline generate functions, and associated SCSS were all cleaned up.

## Verdict

CHANGES_REQUIRED — One HIGH issue (scene-add error not displayed to user) and one MEDIUM (ticket status). Both are trivial one-line fixes.

## Required Changes

1. `encounter-tables.vue:141` — Change `:add-error="encounterCreation.error.value"` to `:add-error="encounterCreation.error.value || addError"` to surface scene-add errors
2. `app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-029.md:5` — Update `status: in-progress` → `status: resolved`

## Scenarios to Re-run

- **encounter-tables-generate**: Verify the `?generate=tableId` flow from editor → list page, including encounter creation and scene addition via `GenerateEncounterModal`
- **encounter-tables-import**: Verify the extracted `ImportTableModal` still handles file selection, drag-drop, JSON parsing, and navigation to imported table
