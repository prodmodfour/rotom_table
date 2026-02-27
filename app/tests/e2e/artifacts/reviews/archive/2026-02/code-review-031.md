---
review_id: code-review-031
review_type: code
reviewer: senior-reviewer
trigger: refactoring
target_report: refactoring-023
domain: code-health
commits_reviewed:
  - 6447b86
  - 87af457
  - 1fe55df
  - e6b80b0
files_reviewed:
  - app/composables/useTableEditor.ts
  - app/components/encounter-table/TableEditor.vue
  - app/pages/gm/encounter-tables/[id].vue
  - app/pages/gm/habitats/[id].vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
scenarios_to_rerun: []
reviewed_at: 2026-02-18T11:00:00
---

## Summary

Excellent refactoring that eliminates ~850 lines of structural duplication between two 900+ line table editor pages. Both pages are now thin wrappers (44 and 125 lines) delegating to a shared composable (314 lines) and component (693 lines). Total: 1962 combined lines reduced to 1176 lines (40% reduction). All behavior preserved. No functional changes.

## Commit Review

### 6447b86 — Extract useTableEditor composable from table editor pages

**Scope:** 1 new file (314 lines)

- `app/composables/useTableEditor.ts`: Extracts all shared state (4 modals, 4 forms), computed properties (`totalWeight`, `sortedEntries`), helpers (`getDensityLabel`, `getSpawnRange`), and CRUD methods (10 methods covering entries, modifications, settings).
- Clean interface definitions for all 4 form types with factory functions (`createNewEntryForm()`, etc.) — immutable pattern for form resets.
- Accepts `Ref<string>` for `tableId`, enabling reactive route param binding.
- `onMounted` and `useHead` calls inside the composable are valid — they register during `setup()` execution.
- Return type explicitly lists all exposed state, computed, helpers, and methods — good API surface.

### 87af457 — Create shared TableEditor component for table editor pages

**Scope:** 1 new file (693 lines)

- `app/components/encounter-table/TableEditor.vue`: Full shared UI — info panel, entries list, modifications list, 4 modals (add entry, add modification, edit modification, settings).
- Props: `tableId`, `backLink`, `backLabel` — minimal and clean.
- Two slots: `header-actions` for page-specific buttons (generate, delete), `after` for page-specific modals (generate encounter, confirm delete). Both slots pass `table` as scoped slot data.
- `reactive(useTableEditor(computed(() => props.tableId)))` — valid pattern that auto-unwraps composable refs for cleaner template access (`editor.table` instead of `editor.table.value`).
- SCSS is comprehensive (283 lines) — all modal, form, density badge, section, and entry list styles scoped to this component.

### 1fe55df — Rewrite encounter-tables/[id].vue as thin wrapper

**Scope:** 1 file, 938 → 44 lines (-894 lines)

- Page reduced to: `<EncounterTableTableEditor>` with `#header-actions` slot containing the Generate button.
- `generateEncounter()` preserved exactly — `router.push` with query param.
- `definePageMeta({ layout: 'gm' })` preserved.

### e6b80b0 — Rewrite habitats/[id].vue as thin wrapper

**Scope:** 1 file, 1024 → 125 lines (-899 lines)

- Page reduced to: `<EncounterTableTableEditor>` with `#header-actions` slot (Generate + Delete buttons) and `#after` slot (GenerateEncounterModal + ConfirmModal).
- All habitat-specific logic preserved: `handleAddToEncounter` (3-step encounter creation), `handleAddToScene` (scene Pokemon injection), `handleDelete`, scene fetching via `groupViewTabsStore`.
- Minor simplification in `handleDelete`: removed `if (!table.value) return` guard (unnecessary — delete button only renders when table exists) and uses `tableId.value` from route params instead of `table.value.id`. Functionally equivalent.

## Issues

### MEDIUM #1: `.btn--with-icon` / `.btn-icon` SCSS in 3 files

The same 12-line SCSS block appears in:
- `TableEditor.vue:431-442` (for the Settings button)
- `encounter-tables/[id].vue:32-43` (for the Generate button in slot)
- `habitats/[id].vue:113-124` (for Generate + Delete buttons in slot)

This is a consequence of Vue scoped styles — slot content gets the parent's scope, so each file needs its own definition. However, this same pattern also exists in 3 other files (`EncounterHeader.vue`, `VTTContainer.vue`, `NewEncounterForm.vue`), totaling 6 copies project-wide.

**Not blocking** because this is already tracked by **refactoring-032** (Finding 2: shared SCSS duplication). When refactoring-032 is worked, `.btn--with-icon` should be included in the global extraction.

**Note for Auditor:** refactoring-032's evidence references line numbers in the pre-refactoring files (e.g., "encounter-tables/[id].vue lines 833-897", "habitats/[id].vue lines 920-983"). These line references are now stale — the modal SCSS lives in `TableEditor.vue:588-692`. Similarly, refactoring-030's line reference for habitats/[id].vue (was 722-733) is now 87-103.

## Behavior Verification

- **encounter-tables page**: Generate button → `router.push` with query param. Identical to original.
- **habitats page**: Generate button → `GenerateEncounterModal` with encounter creation + scene integration. Delete button → `ConfirmModal` → `tablesStore.deleteTable`. All identical to original.
- **`getTableById` in habitats `handleAddToEncounter`**: Works because `useTableEditor` calls `loadTable()` on mount, which pushes the table into `store.tables` (see `encounterTables.ts:151-156`). The store lookup will succeed.
- **Component auto-import**: `pathPrefix: false` in Nuxt config means `components/encounter-table/TableEditor.vue` auto-imports as `EncounterTableTableEditor` (directory name + file name). `components/habitat/GenerateEncounterModal.vue` auto-imports as `GenerateEncounterModal`. Both match usage.

## What Looks Good

- **Commit granularity is exemplary.** Four clean steps: composable → component → page 1 → page 2. Each commit is backward-compatible — commits 1-2 add new files without touching existing code, commits 3-4 swap in the new code one page at a time.
- **Slot design is well-considered.** `header-actions` for buttons next to Settings, `after` for page-specific modals. The habitats page's extra complexity (encounter creation, scene integration, delete) is cleanly isolated in its 125-line wrapper.
- **Composable API is complete.** All 10 CRUD methods, 4 form states, 4 modal flags, 2 computed properties, and 2 helpers properly exposed. No leaky abstractions.
- **No behavioral changes.** Pure structural refactoring verified against original source.

## Verdict

**APPROVED** — no blocking issues. The MEDIUM SCSS duplication is already tracked by refactoring-032. Proceed to Game Logic Reviewer (though this is a pure structural refactoring with no PTU logic changes, so rules review should be quick).
