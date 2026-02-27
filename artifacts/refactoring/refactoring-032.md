---
ticket_id: refactoring-032
priority: P2
categories:
  - EXT-DUPLICATE
affected_files:
  - app/pages/gm/pokemon/[id].vue
  - app/pages/gm/characters/[id].vue
  - app/components/encounter-table/TableEditor.vue
  - app/pages/gm/encounter-tables/[id].vue
  - app/pages/gm/habitats/[id].vue
  - app/pages/gm/encounter-tables.vue
  - app/components/group/CombatantDetailsPanel.vue
estimated_scope: medium
status: resolved
created_at: 2026-02-18T12:00:00
---

## Summary

Two categories of SCSS are copy-pasted across multiple files: (1) type badge colors (18 Pokemon type color definitions) appear in 3+ files, and (2) modal overlay/modal styles (~60 lines) appear in 4+ files. While SCSS duplication is lower impact than logic duplication, it increases maintenance burden and file sizes.

## Findings

### Finding 1: EXT-DUPLICATE — Type badge SCSS
- **Metric:** 18 type-badge color definitions (~30 lines) duplicated in 3+ .vue files
- **Threshold:** >10 similar lines in 2+ files
- **Impact:** Adding a new type or changing a color requires editing every file that has the badge styles. Contributes to the oversized file problem.
- **Evidence:**
  - pokemon/[id].vue lines 996-1014 (type-badge--fire through type-badge--fairy)
  - CombatantDetailsPanel.vue (type-badge styles in scoped SCSS)
  - Multiple other encounter components with inline type badge colors

### Finding 2: EXT-DUPLICATE — Modal overlay SCSS
- **Metric:** ~60 lines of identical .modal-overlay + .modal styles in 4+ files
- **Threshold:** >10 similar lines in 2+ files
- **Impact:** Every page that needs a modal re-defines the same overlay, positioning, close button, header, body, footer styles.
- **Evidence:**
  - ~~encounter-tables/[id].vue lines 833-897~~ → moved to `app/components/encounter-table/TableEditor.vue` lines 588-692 (post refactoring-023)
  - ~~habitats/[id].vue lines 920-983~~ → moved to `app/components/encounter-table/TableEditor.vue` lines 588-692 (post refactoring-023)
  - encounter-tables.vue lines 639-700
  - Also: `.btn--with-icon` / `.btn-icon` duplicated in TableEditor.vue:431-442, encounter-tables/[id].vue:32-43, habitats/[id].vue:113-124, plus 3 other files (6 copies total)

### Finding 3: EXT-DUPLICATE — Sheet page SCSS
- **Metric:** ~200 lines of shared sheet styles (stats-grid, stat-block, healing-status, healing-action, form-row) between pokemon/[id].vue and characters/[id].vue
- **Threshold:** >10 similar lines in 2+ files
- **Impact:** Sheet styling changes require editing both files
- **Evidence:**
  - pokemon/[id].vue lines 1141-1193 (stats-grid, stat-block) — identical to characters/[id].vue lines 647-699
  - pokemon/[id].vue lines 1518-1601 (healing styles) — identical to characters/[id].vue lines 857-940

## Suggested Refactoring

1. Extract type badge colors to `app/assets/scss/_type-badges.scss` mixin or shared class
2. Extract modal overlay styles to `app/assets/scss/_modal.scss` (or create a `BaseModal.vue` component)
3. Extract shared sheet SCSS (stats-grid, healing-status, healing-action) to `app/assets/scss/_sheet.scss`
4. Import shared partials in affected files, remove duplicated blocks

Estimated commits: 2-3

## Related Lessons
- none

## Resolution Log
- Commits: 9bce538, abfe751, 3a3d093
- Files changed: 20 files across 3 commits
  - Finding 1 (type badge colors): `_pokemon-sheet.scss`, `PlayerLobbyView.vue`, `CombatantDetailsPanel.vue`
  - Finding 2 (modal + btn-icon): `TableEditor.vue`, `ImportTableModal.vue`, `ModificationCard.vue`, `SaveTemplateModal.vue`, `LoadTemplateModal.vue`, `StartEncounterModal.vue`, `encounter-tables.vue`, `encounters.vue`, `encounter-tables/[id].vue`, `habitats/[id].vue`, `NewEncounterForm.vue`, `EncounterHeader.vue`, `VTTContainer.vue`, `gm.vue`
  - Finding 3 (sheet styles): `pokemon/[id].vue`, `characters/[id].vue`
  - Config: `nuxt.config.ts`
- New files created:
  - `app/assets/scss/_modal.scss` (modal overlay, modal container, btn-with-icon, btn-icon-img mixins)
  - `app/assets/scss/_sheet.scss` (sheet-page, sheet-header, sheet-back-link, sheet-loading-error, sheet-card, sheet-tab-btn, sheet-tab-content, sheet-empty-state, sheet-form-row mixins)
- Tests passing: yes (SCSS compiles cleanly; pre-existing type errors and missing SVG icon are unrelated)
