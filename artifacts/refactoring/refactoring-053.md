---
ticket_id: refactoring-053
priority: P3
status: resolved
category: EXT-UNUSED
source: code-review-100
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

`app/assets/scss/_modal.scss` defines `modal-overlay-enhanced` and `modal-container-enhanced` mixins, but they are never used. Three files (`CharacterModal.vue`, `GMActionModal.vue`, `AddCombatantModal.vue`) still inline the enhanced glass-morphism modal pattern that these mixins were designed to replace.

## Affected Files

- `app/assets/scss/_modal.scss` — unused `modal-overlay-enhanced` and `modal-container-enhanced` mixins
- `app/components/character/CharacterModal.vue` — inlines enhanced modal styles
- `app/components/encounter/GMActionModal.vue` — inlines enhanced modal styles
- `app/components/encounter/AddCombatantModal.vue` — inlines enhanced modal styles

## Suggested Fix

Either:
1. Replace the inline enhanced modal styles in the 3 files with `@include` of the enhanced mixins, OR
2. Remove the unused mixins if they don't accurately match the inline patterns

## Notes

Created during refactoring-032 review. The base modal mixins are well-used (15 files), but the enhanced variants were defined speculatively without migrating their consumers.

## Resolution Log

- **Commit:** d2944fe `refactor: replace inline enhanced modal styles with @include mixins`
- **Approach:** Option 1 — replaced inline styles with `@include` of the enhanced mixins
- **Files changed:**
  - `app/components/character/CharacterModal.vue` — replaced `.modal-overlay` (10 lines) with `@include modal-overlay-enhanced`; replaced `.modal` container (31 lines) with `@include modal-container-enhanced` + 3 overrides (fullsheet max-width, header gradient, footer background); removed duplicate `@keyframes fadeIn/slideUp`
  - `app/components/encounter/GMActionModal.vue` — replaced `.modal-overlay` (10 lines) with `@include modal-overlay-enhanced`; replaced `.gm-action-modal` container core (12 lines) with `@include modal-container-enhanced` + overrides (max-width 600px, max-height 85vh, header gap/gradient); removed duplicate `@keyframes fadeIn/slideUp`
  - `app/components/encounter/AddCombatantModal.vue` — replaced `.modal-overlay` (10 lines) with `@include modal-overlay-enhanced`; replaced `.modal` container (28 lines) with `@include modal-container-enhanced` + overrides (max-height 80vh, header scarlet gradient, footer background); removed duplicate `@keyframes fadeIn/slideUp`
- **Net reduction:** 155 lines removed, 6 lines added
- **Test status:** SCSS compiles without errors; pre-existing build failure unrelated (missing icon in encounter-tables.vue)
