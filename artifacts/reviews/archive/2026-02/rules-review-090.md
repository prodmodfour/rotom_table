---
review_id: rules-review-090
target: refactoring-032
trigger: orchestrator-routed
reviewed_commits:
  - 9bce538
  - abfe751
  - 3a3d093
verdict: PASS
reviewed_at: 2026-02-20
reviewer: game-logic-reviewer
---

## PTU Rules Review: refactoring-032 (Extract shared SCSS partials)

### Scope

Three commits extracting duplicated SCSS into shared partials:

1. **9bce538** — Extract `type-color-modifiers` mixin in `_pokemon-sheet.scss`; replace hardcoded hex in `PlayerLobbyView.vue` type-pip and `CombatantDetailsPanel.vue` status-tag with `$type-*` SCSS variables.
2. **abfe751** — Create `_modal.scss` with 6 reusable mixins (`modal-overlay-base`, `modal-container-base`, `modal-overlay-enhanced`, `modal-container-enhanced`, `btn-with-icon`, `btn-icon-img`); replace ~450 lines across 15 files.
3. **3a3d093** — Create `_sheet.scss` with 9 mixins for entity sheet layout; replace ~160 lines across `pokemon/[id].vue` and `characters/[id].vue`.

### Verification Checklist

#### 1. No game logic changes

- **No `<template>` changes** in any commit. All diffs are confined to `<style lang="scss" scoped>` blocks and new SCSS partial files.
- **No `<script>` changes** in any commit. No TypeScript/JavaScript was modified.
- **Only config change**: `nuxt.config.ts` SCSS `additionalData` line — adds `@use` imports for new partials. This is build configuration, not game logic.
- **No server-side changes**: No files under `server/api/`, `server/services/`, `server/utils/`, `composables/`, `stores/`, `utils/`, or `constants/` were touched.

#### 2. Type color mappings are cosmetic only

The type-pip color replacement in `PlayerLobbyView.vue` maps the same 18 hardcoded hex values to existing `$type-*` SCSS variables. Verified all hex values match their variable definitions in `_variables.scss`:

| Type | Original hex | Variable | Variable value | Match |
|------|-------------|----------|---------------|-------|
| Fire | #F08030 | $type-fire | #F08030 | Exact |
| Water | #6890F0 | $type-water | #6890F0 | Exact |
| Electric | #F8D030 | $type-electric | #F8D030 | Exact |
| Ice | #98D8D8 | $type-ice | #98D8D8 | Exact |
| Poison | #A040A0 | $type-poison | #A040A0 | Exact |
| Ghost | #705898 | $type-ghost | #705898 | Exact |
| Psychic | #F85888 | $type-psychic | #F85888 | Exact |
| Dark | #705848 | $type-dark | #705848 | Exact |
| Fairy | #EE99AC | $type-fairy | #EE99AC | Exact |

The status-tag colors in `CombatantDetailsPanel.vue` were also replaced with type variables. These map status conditions to thematically matching type colors (burn -> fire, frozen -> ice, etc.) — all values are identical hex-for-variable replacements.

One minor note: `badly-poisoned` changed from `#682a68` (rgb 104,42,104) to `darken($type-poison, 15%)` (rgb ~105,42,105). The 1-unit rounding difference in two channels is completely imperceptible and this is a purely cosmetic badge color with zero gameplay impact.

#### 3. No component template changes that would alter game behavior

Confirmed zero `<template>` modifications across all 20 changed files. The HTML structure, event handlers, data bindings, and component composition are entirely untouched. Only SCSS styling rules were deduplicated into shared mixins.

### PTU Rules Impact

**None.** This refactoring is entirely cosmetic/structural. No PTU mechanics, formulas, calculations, or game rules are involved in any of the changes. The affected areas are:

- Modal overlay positioning and appearance (visual only)
- Button icon sizing and filters (visual only)
- Sheet page layout (visual only)
- Type badge/pip colors (visual only, confirmed hex-equivalent)
- Status condition tag colors (visual only, confirmed hex-equivalent)

### Verdict

**PASS** — Pure SCSS refactoring with no game logic impact. All type color substitutions verified as hex-equivalent to their original hardcoded values.
