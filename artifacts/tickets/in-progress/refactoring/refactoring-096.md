---
ticket_id: refactoring-096
title: Harmonize tag color styling between character detail and classes tab
severity: LOW
priority: P4
domain: character-lifecycle
source: code-review-215 MED-03
created_by: slave-collector (plan-20260228-072000)
status: in-progress
---

## Summary

Tag styles (`.tag--class`, `.tag--feature`, `.tag--edge`, `.tag--capability`) are duplicated with inconsistent colors between two components:

- `app/pages/gm/characters/[id].vue` uses `rgba($color-accent-scarlet, 0.2)` for features, `rgba($color-info, 0.2)` for edges
- `app/components/character/tabs/HumanClassesTab.vue` uses `rgba($color-accent-teal, 0.15)` for features, `rgba($color-warning, 0.15)` for edges

The `--capability` variant is consistent (both use `$color-success`), but other tag colors diverge.

## Affected Files

- `app/pages/gm/characters/[id].vue` (lines 617-641)
- `app/components/character/tabs/HumanClassesTab.vue` (lines 69-98)

## Suggested Fix

1. Extract shared tag styles to a SCSS partial (e.g., `_tags.scss`) or a shared component
2. Use a single consistent color scheme for all tag variants
3. Ensure `border-color` is consistently applied (currently missing on `--capability` in `[id].vue`)

## Impact

Low — cosmetic inconsistency. Users see different colors for the same tag type depending on which view they're in.

## Resolution Log

### Fix: Extract shared _tags.scss partial and unify tag colors

**Branch:** `slave/5-developer-refactoring-096-20260228`

**Canonical color scheme:**
| Variant | Color | Background | Border |
|---|---|---|---|
| `--class` | `$color-accent-violet` | `rgba(violet, 0.15)` | `rgba(violet, 0.3)` |
| `--feature` | `$color-accent-teal` | `rgba(teal, 0.15)` | `rgba(teal, 0.3)` |
| `--edge` | `$color-warning` | `rgba(warning, 0.15)` | `rgba(warning, 0.3)` |
| `--capability` | `$color-success` | `rgba(success, 0.15)` | `rgba(success, 0.3)` |
| `--skill-edge` | `$color-warning` | `rgba(warning, 0.2)` | `rgba(warning, 0.4)` |

**Commits:**
- `5c8bec7` — Create `app/assets/scss/components/_tags.scss` partial + register in `nuxt.config.ts`
- `8a3ea3c` — Remove tag variants from `app/pages/gm/characters/[id].vue` (color change: features scarlet->teal, edges info->warning)
- `29cf8a9` — Remove tag variants from `app/components/character/tabs/HumanClassesTab.vue`
- `da9e584` — Remove tag variants from `app/components/create/ClassFeatureSection.vue`
- `14034d6` — Remove tag variants from `app/components/create/EdgeSelectionSection.vue`
- `63a9ee5` — Remove tag--edge override from `app/assets/scss/components/_player-character-sheet.scss` (color change: edges teal->warning)

**Files changed:**
- `app/assets/scss/components/_tags.scss` (new — canonical tag variant styles)
- `app/nuxt.config.ts` (added _tags.scss to css array)
- `app/pages/gm/characters/[id].vue` (removed 28 lines of scoped tag styles)
- `app/components/character/tabs/HumanClassesTab.vue` (removed 31 lines of scoped tag styles)
- `app/components/create/ClassFeatureSection.vue` (removed 15 lines of scoped tag styles)
- `app/components/create/EdgeSelectionSection.vue` (removed 14 lines of scoped tag styles)
- `app/assets/scss/components/_player-character-sheet.scss` (removed 5 lines of edge color override)

**All 5 locations** with tag variant styles are now unified through the single `_tags.scss` partial.

### Fix Cycle: code-review-224

**Branch:** `slave/3-dev-refactoring-096-20260304`

**Commits:**
- `06c3b5b` — H1: Remove color properties (background, border, color) from `.player-sheet .tag` so variant colors from `_tags.scss` cascade naturally
- `461aad7` — M1: Update stale comment in `_create-form-shared.scss` to reference `_tags.scss` instead of component scoped styles

**Files changed:**
- `app/assets/scss/components/_player-character-sheet.scss` (removed background, border, color from `.player-sheet .tag`)
- `app/assets/scss/components/_create-form-shared.scss` (updated comment on line 65)
