---
ticket_id: refactoring-027
priority: P1
categories:
  - LLM-SIZE
  - EXT-GOD
  - EXT-DUPLICATE
affected_files:
  - app/pages/gm/encounter-tables.vue
estimated_scope: medium
status: resolved
created_at: 2026-02-18T12:00:00
---

## Summary

`encounter-tables.vue` is 927 lines — a list page that handles 7 responsibilities: table listing, filtering/sorting, table creation, table deletion, encounter generation, JSON import/export, and encounter creation with serve-to-group. Exceeds 800-line P0 threshold and duplicates encounter creation logic from `habitats/[id].vue`.

## Findings

### Finding 1: LLM-SIZE
- **Metric:** 927 total lines (script: 268, template: 310, SCSS: 349)
- **Threshold:** >800 lines = P0
- **Impact:** A list page should not be this large. The script section alone handles 7 distinct concerns.
- **Evidence:** `wc -l app/pages/gm/encounter-tables.vue` = 927

### Finding 2: EXT-GOD
- **Metric:** Script handles 7 responsibilities
- **Threshold:** 3+ unrelated responsibilities
- **Impact:** SRP violation. Changes to import logic risk breaking generation; changes to filtering risk breaking creation.
- **Evidence:**
  1. Table listing + loading (lines 329-331)
  2. Filtering/sorting (lines 346-357, 385-391)
  3. Table creation (lines 393-410)
  4. Table deletion (line 412-416)
  5. Encounter generation (lines 418-464, generateFromTable, doGenerate, rerollPokemon)
  6. JSON import (lines 516-579, file handling, drag-drop, parsing)
  7. Encounter creation (lines 470-508, createEncounter → addWildPokemon → serveEncounter → navigate)

### Finding 3: EXT-DUPLICATE — Encounter creation
- **Metric:** The `addToEncounter` pattern (lines 470-508) is duplicated in habitats/[id].vue (lines 717-738)
- **Threshold:** >10 similar lines in 2+ files
- **Impact:** Same workflow (createEncounter → addWildPokemon → serveEncounter → router.push('/gm')) appears in both files
- **Evidence:** See also refactoring-030

## Suggested Refactoring

1. Extract generation modal into standalone `GenerateFromTableModal.vue` (the page-level generate modal duplicates functionality already in `GenerateEncounterModal.vue`)
2. Extract import modal into `ImportTableModal.vue`
3. Extract encounter creation workflow into composable (see refactoring-030)
4. Reduce page to: list view + filter bar + 3 modal triggers

Estimated commits: 3-4

## Related Lessons
- Pattern H (duplication chains) — encounter creation workflow duplicated

## Resolution Log
- Commits: `f82c28d` (extract ImportTableModal), `5d6a26f` (decompose encounter-tables.vue)
- Files changed: `app/pages/gm/encounter-tables.vue` (927 → 443 lines)
- New files created: `app/components/encounter-table/ImportTableModal.vue`
- Tests passing: typecheck passes (pre-existing errors only, none from changes)
- Notes:
  - Replaced inferior inline generate modal with existing `GenerateEncounterModal` component (full-featured: density-based counts, pool preview, selection, TV serve, scene add)
  - Added `?generate=tableId` query param handling to fix broken flow from `encounter-tables/[id].vue` editor Generate button
  - Removed dead code: `deleteTable`, `exportTable` (never bound in template), inline generate functions
  - Used `useEncounterCreation` composable (from refactoring-030) for encounter creation
  - Replaced emoji `📤` with Phosphor icon `upload-simple.svg`
  - Page now has 2 responsibilities: table listing/filtering + table creation modal
