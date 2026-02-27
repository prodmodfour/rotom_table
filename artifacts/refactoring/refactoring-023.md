---
ticket_id: refactoring-023
priority: P0
categories:
  - EXT-DUPLICATE
  - LLM-SIZE
affected_files:
  - app/pages/gm/encounter-tables/[id].vue
  - app/pages/gm/habitats/[id].vue
estimated_scope: large
status: resolved
created_at: 2026-02-18T12:00:00
---

## Summary

Two pages implement nearly identical table editor UIs — `encounter-tables/[id].vue` (938 lines) and `habitats/[id].vue` (1024 lines). Both exceed the 800-line P0 threshold and share ~90% of their template, script, and SCSS. This is the largest duplication in the codebase at ~1,960 combined lines.

## Findings

### Finding 1: EXT-DUPLICATE
- **Metric:** ~850 lines of identical or near-identical code across both files
- **Threshold:** >10 similar lines in 2+ files
- **Impact:** Any bug fixed in one editor must be manually replicated in the other. LLM agents will follow the pattern from whichever file they read first and produce inconsistent edits.
- **Evidence:**
  - Template: Both files have identical table-info panel, entries-list section, modifications section, 4 inline modals (add-entry, add-modification, edit-modification, settings)
  - Script: Identical form state (newEntry, newMod, editMod, editSettings), CRUD methods (addEntry, removeEntry, updateEntryWeight, updateEntryLevelRange, addModification, editModification, saveModification, deleteModification, saveSettings), computed properties (totalWeight, sortedEntries, getDensityLabel, getSpawnRange)
  - SCSS: Identical styles for .table-editor, .table-info, .editor-section, .entries-list, .modal-overlay, .modal, .form-group, .form-label, .density-badge, .level-range-inputs (~280 lines each)

### Finding 2: LLM-SIZE
- **Metric:** encounter-tables/[id].vue = 938 lines, habitats/[id].vue = 1024 lines
- **Threshold:** >800 lines = P0
- **Impact:** Both files individually exceed the P0 threshold. The duplication means any change requires editing two 900+ line files.
- **Evidence:** `wc -l` on both files

### Finding 3: EXT-GOD (habitats/[id].vue only)
- **Metric:** Script handles 7 responsibilities: table CRUD, entry management, modification management, settings, delete confirmation, encounter generation, scene integration
- **Threshold:** 3+ unrelated responsibilities
- **Impact:** The habitats variant adds encounter/scene integration (handleAddToEncounter, handleAddToScene, $fetch call) on top of the shared editor logic, making it a SRP violation.
- **Evidence:** habitats/[id].vue lines 702-738 (encounter creation + scene integration)

## Suggested Refactoring

1. Extract shared table editor into `app/components/encounter-table/TableEditor.vue` with props for the table data and emit for CRUD actions
2. Extract the 4 inline modals into separate components: `AddEntryModal.vue`, `AddModificationModal.vue`, `EditModificationModal.vue`, `TableSettingsModal.vue`
3. Extract shared CRUD logic into a `useTableEditor` composable (form state, validation, store interactions)
4. Reduce `habitats/[id].vue` to: import TableEditor + add encounter/scene generation buttons
5. Reduce `encounter-tables/[id].vue` to: import TableEditor + add navigation-only generate button
6. Move shared SCSS into a `_table-editor.scss` partial or scoped in the new component

Estimated commits: 5-7

## Related Lessons
- Pattern H (duplication chains spawn cascading tickets) — retrospective-summary.md

## Resolution Log
- Commits:
  - `6447b86` refactor: extract useTableEditor composable from table editor pages
  - `87af457` refactor: create shared TableEditor component for table editor pages
  - `1fe55df` refactor: rewrite encounter-tables/[id].vue as thin wrapper
  - `e6b80b0` refactor: rewrite habitats/[id].vue as thin wrapper
- Files changed:
  - `app/pages/gm/encounter-tables/[id].vue` (938 → 44 lines)
  - `app/pages/gm/habitats/[id].vue` (1024 → 125 lines)
- New files created:
  - `app/composables/useTableEditor.ts` (314 lines) — shared state, CRUD, computed, helpers
  - `app/components/encounter-table/TableEditor.vue` (693 lines) — shared template, modals, SCSS
- Total: 1962 combined lines → 1176 lines (786 lines removed, 40% reduction)
- Tests passing: 508/508 unit tests pass (Vitest). Build succeeds. No e2e tests cover these pages.
