---
review_id: rules-review-028
target: refactoring-023
trigger: developer-fix-review
reviewer: game-logic-reviewer
verdict: APPROVED
date: 2026-02-18
commits_reviewed:
  - 6447b86
  - 87af457
  - 1fe55df
  - e6b80b0
mechanics_verified:
  - encounter-table-rarity-weights
  - encounter-table-density-tiers
  - encounter-table-level-ranges
  - encounter-table-spawn-chance
  - encounter-creation-from-habitat
  - scene-pokemon-integration
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs: []
reviewed_at: 2026-02-18T18:00:00
---

# Rules Review: refactoring-023

## Scope

- [x] Shared `useTableEditor` composable extracted from two table editor pages
- [x] Shared `TableEditor.vue` component extracted with full template, modals, and SCSS
- [x] `encounter-tables/[id].vue` rewritten as thin wrapper (938 -> 44 lines)
- [x] `habitats/[id].vue` rewritten as thin wrapper (1024 -> 125 lines)
- [x] Habitat-specific logic preserved: encounter creation, scene integration, delete workflow

## Mechanics Verified

### Rarity Weight Presets
- **Rule:** App-defined spawn probability weights (common=10, uncommon=5, rare=3, very-rare=1, legendary=0.1). Not PTU-defined — these are custom encounter table weights for this tool.
- **Implementation:** `useTableEditor.ts:121-126` — `getWeight()` returns `RARITY_WEIGHTS[rarity]` for preset or `customWeight` for custom. Template dropdown in `TableEditor.vue:142-149` lists all 6 options with correct labels.
- **Status:** CORRECT
- **Cross-reference:** Original `encounter-tables/[id].vue:143-149` and `habitats/[id].vue:147-153` had identical presets. New code preserves them exactly.

### Density Tiers
- **Rule:** App-defined population density controlling spawn count. Four tiers: sparse, moderate, dense, abundant. Actual ranges from `DENSITY_RANGES` constant in `types/habitat.ts:17-22`.
- **Implementation:** `useTableEditor.ts:99-106` — `getDensityLabel()` capitalizes tier name, `getSpawnRange()` reads from `DENSITY_RANGES[density]` and formats as `min-max`. Template info panel at `TableEditor.vue:42-46` displays both correctly.
- **Status:** CORRECT
- **Cross-reference:** Original and new code both delegate to the same `DENSITY_RANGES` constant for the info panel display.

### Level Ranges
- **Rule:** Encounter tables have a default level range (min-max). Entries and modifications can override with per-entry/per-mod level ranges.
- **Implementation:** `useTableEditor.ts:148-151` — entry add passes `levelRange` only when both `levelMin` and `levelMax` are provided (conditional `? { min, max } : undefined`). Same pattern for modifications at lines 192-194 and 222-224. Settings save at lines 248-254 always passes level range. Template inputs constrain to `min="1" max="100"`.
- **Status:** CORRECT
- **Cross-reference:** Identical conditional logic preserved from both original pages. The `levelMin && levelMax` guard ensures partial ranges are not submitted.

### Spawn Chance Calculation
- **Rule:** Each entry's spawn chance = `weight / totalWeight * 100%`.
- **Implementation:** `useTableEditor.ts:88-91` — `totalWeight` computed as `entries.reduce((sum, e) => sum + e.weight, 0)`. Passed to `EntryRow` component via `:total-weight` prop at `TableEditor.vue:83`. The percentage calculation happens inside `EntryRow` (not touched by this refactoring).
- **Status:** CORRECT

### Encounter Creation from Habitat
- **Rule:** Habitat page generates encounters by creating a new encounter in `full_contact` mode, adding spawned Pokemon as `enemies`, and auto-serving to group view.
- **Implementation:** `habitats/[id].vue:87-104` — `handleAddToEncounter()` creates encounter with `tableName + 'full_contact'`, calls `addWildPokemon(pokemon, 'enemies')`, then `serveEncounter()`, then navigates to `/gm`.
- **Status:** CORRECT
- **Cross-reference:** Original `habitats/[id].vue:719-738` had identical logic. One non-functional difference: table name lookup changed from `table.value?.name` to `tablesStore.getTableById(tableId.value)?.name` — both resolve to the same data. Fallback `'Wild Encounter'` preserved.

### Scene Pokemon Integration
- **Rule:** Habitat page can add generated Pokemon to a scene by POSTing each Pokemon to `/api/scenes/{sceneId}/pokemon`.
- **Implementation:** `habitats/[id].vue:72-85` — `handleAddToScene()` iterates Pokemon array and POSTs `{ species, level, speciesId }` for each.
- **Status:** CORRECT
- **Cross-reference:** Original `habitats/[id].vue:702-714` had character-identical logic.

## Pre-Existing Issue

### Density Dropdown Labels Mismatch (MEDIUM)

The settings modal dropdown in `TableEditor.vue:373-376` hardcodes density labels that **do not match** the actual `DENSITY_RANGES` constant:

| Tier | Dropdown Label | Actual `DENSITY_RANGES` |
|------|---------------|------------------------|
| sparse | "1-2 Pokemon" | { min: 2, max: 4 } |
| moderate | "2-4 Pokemon" | { min: 4, max: 8 } |
| dense | "4-6 Pokemon" | { min: 8, max: 12 } |
| abundant | "6-8 Pokemon" | { min: 12, max: 16 } |

The table-info panel correctly shows `getSpawnRange()` (reading from `DENSITY_RANGES`), so users see the correct range after saving — but the dropdown they use to *choose* a density shows wrong numbers.

**This is pre-existing.** Both original files had identical wrong labels at `encounter-tables/[id].vue:376-379` and `habitats/[id].vue:380-383`. The refactoring preserved the bug faithfully. Not a regression.

**Recommendation:** File a ticket (DATA-INCORRECT, P2) to fix the dropdown to read from `DENSITY_RANGES` dynamically instead of hardcoding wrong numbers. The actual game behavior (spawn count) is correct — only the UI label is misleading.

## Summary
- Mechanics checked: 6
- Correct: 6
- Incorrect: 0
- Needs review: 0
- Pre-existing issues found: 1 (MEDIUM — density dropdown labels)

## Verdict
**APPROVED** — This refactoring is purely structural (UI deduplication). All 6 game-adjacent mechanics were preserved exactly from the original pages. The composable delegates to the same store methods and type constants. The habitats page's encounter creation and scene integration logic are character-identical to the originals. No PTU mechanics are at risk.

The density dropdown label mismatch is pre-existing and should be tracked separately.
