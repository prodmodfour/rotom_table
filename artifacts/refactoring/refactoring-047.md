---
ticket_id: refactoring-047
priority: P2
status: resolved
category: EXT-DUPLICATE
source: code-review-076
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

~200 lines of SCSS duplicated across the 6 extracted Pokemon sheet components (`fadeIn`, `rollIn`, `roll-result`, `empty-state`, `info-section`, `tab-content`, `type-badge` styles).

## Affected Files

- `app/components/pokemon/PokemonStatsTab.vue`
- `app/components/pokemon/PokemonMovesTab.vue`
- `app/components/pokemon/PokemonSkillsTab.vue`
- `app/components/pokemon/PokemonEditForm.vue`
- `app/components/pokemon/PokemonLevelUpPanel.vue`
- `app/components/pokemon/PokemonCapabilitiesTab.vue`

## Suggested Refactoring

Extract shared styles into `app/assets/scss/_pokemon-sheet.scss` partial and import in each component.

## Resolution Log

**Resolved:** 2026-02-20

### Approach

Created `app/assets/scss/_pokemon-sheet.scss` with 8 mixins for duplicated SCSS patterns, registered it in `nuxt.config.ts` `additionalData` for auto-injection (zero CSS output from mixins unless `@include`d). Replaced duplicated SCSS blocks in 5 of 6 components with `@include` calls. PokemonLevelUpPanel had no shared duplicated styles and was left unchanged.

### Mixins Created

- `pokemon-tab-content` -- fade-in animation for tab panels
- `pokemon-roll-result` -- roll result display (skill checks, move attack/damage rolls)
- `pokemon-empty-state` -- centered placeholder text
- `pokemon-info-section` -- bordered section header (Nature, Training, Capabilities)
- `pokemon-tag-list` / `pokemon-tag` -- flex tag layout for capabilities, egg groups
- `pokemon-sheet-type-badge` -- flat-color type badges (18 types, distinct from global gradient type-badge)
- `pokemon-sheet-keyframes` -- fadeIn and rollIn `@keyframes`

### Commits

- `37461ba` refactor: add _pokemon-sheet.scss partial with shared mixins
- `01a2c43` refactor: use shared mixins in PokemonStatsTab
- `2f9c0a2` refactor: use shared mixins in PokemonMovesTab
- `0abe87e` refactor: use shared mixins in PokemonSkillsTab
- `acb3c32` refactor: use shared type-badge mixin in PokemonEditForm
- `3d26260` refactor: use shared mixins in PokemonCapabilitiesTab

### Files Changed

- **New:** `app/assets/scss/_pokemon-sheet.scss` (170 lines)
- **Modified:** `app/nuxt.config.ts` (additionalData injection)
- **Modified:** `app/components/pokemon/PokemonStatsTab.vue` (-12 lines)
- **Modified:** `app/components/pokemon/PokemonMovesTab.vue` (-114 lines)
- **Modified:** `app/components/pokemon/PokemonSkillsTab.vue` (-60 lines)
- **Modified:** `app/components/pokemon/PokemonEditForm.vue` (-23 lines)
- **Modified:** `app/components/pokemon/PokemonCapabilitiesTab.vue` (-17 lines)
- **Unchanged:** `app/components/pokemon/PokemonLevelUpPanel.vue` (no shared duplicated styles)

**Net reduction:** ~226 lines of duplicated SCSS removed, replaced by ~170 lines of reusable mixins.
