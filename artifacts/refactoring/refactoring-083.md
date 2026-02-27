---
id: refactoring-083
category: BUILD-BREAK
priority: P0
status: in-review
source: manual
created_at: 2026-02-26T00:00:00Z
---

# refactoring-083: Fix undefined $z-index-modal in XpDistributionModal SCSS partial

## Summary

`XpDistributionModal.vue` fails to compile with a Sass error: `Undefined variable $z-index-modal` at `_modal.scss:29`. The variable is defined in `_variables.scss` and injected globally via Nuxt's `additionalData` config, but the component's `@import` of the extracted SCSS partial `_xp-distribution-modal.scss` creates a compilation context where the variable isn't resolved when the `modal-overlay-enhanced` mixin expands.

## Error

```
[sass] Undefined variable.
   ╷
29 │   z-index: $z-index-modal;
   │            ^^^^^^^^^^^^^^
   ╵
  assets/scss/_modal.scss 29:12                            modal-overlay-enhanced()
  assets/scss/components/_xp-distribution-modal.scss 15:3  @import
  components/encounter/XpDistributionModal.vue 2:9         root stylesheet
```

## Root Cause

Other modals (e.g., `GMActionModal.vue`, `AddCombatantModal.vue`) use `@include modal-overlay-enhanced` directly in their `<style lang="scss" scoped>` block, where Nuxt's `additionalData` has already injected `@use "~/assets/scss/_variables.scss" as *`.

`XpDistributionModal.vue` instead uses `@import '~/assets/scss/components/xp-distribution-modal'` to pull in a separate SCSS partial. The `@import` within the component style block creates a nested scope where the `additionalData`-injected `@use` variables don't propagate into the imported file's mixin expansion.

## Fix

Either:
1. **Inline the styles** — Move the contents of `_xp-distribution-modal.scss` directly into the component's `<style scoped>` block (consistent with other modals), or
2. **Add `@use` to the partial** — Add `@use "~/assets/scss/_variables.scss" as *` at the top of `_xp-distribution-modal.scss`

Option 1 is preferred for consistency with other modal components in the codebase.

## Files

- `app/components/encounter/XpDistributionModal.vue` — line 568, `@import` statement
- `app/assets/scss/components/_xp-distribution-modal.scss` — line 15, `@include modal-overlay-enhanced`
- `app/assets/scss/_modal.scss` — line 29, `$z-index-modal` usage in mixin
- `app/assets/scss/_variables.scss` — line 151, `$z-index-modal: 200` definition

## Resolution Log

| Commit | Files | Description |
|--------|-------|-------------|
| `7642cc7` | `XpDistributionModal.vue`, `_xp-distribution-modal.scss` (deleted) | Inlined SCSS partial into component `<style scoped>` block and deleted the partial file. Consistent with all other modals that use `modal-overlay-enhanced` directly in their scoped styles. |
| `f03e508` | `_form-utilities.scss` (new), `nuxt.config.ts` | Extracted shared SCSS utilities (.btn--ghost, .toggle, .empty-state, .loading-state, .error-state) to global partial registered in css array. |
| `4ac40f2` | `XpDistributionModal.vue` | Removed extracted SCSS utilities from scoped styles (68 lines). |
| `994cf41` | `XpDistributionResults.vue` (new), `XpDistributionModal.vue`, `_form-utilities.scss` | Extracted results phase into child component. Added .section, .form-select-compact, .form-input-compact to global partial. Consolidated imports and state declarations. Total: 1019 -> 798 lines (221 line reduction). |

### Verification

- `XpDistributionModal.vue` line count: 798 (Template 220, Script 293, Style 274) — under 800-line cap
- `XpDistributionResults.vue` line count: 113 (Template 34, Script 11, Style 63)
- `_form-utilities.scss` line count: 129 — registered in `nuxt.config.ts` css array (NOT additionalData)
- Confirmed no other SCSS partials in `app/assets/scss/components/` use `modal-overlay-enhanced`. The three other `@import`-ed partials (`_move-target-modal.scss`, `_level-up-notification.scss`, `_significance-panel.scss`) do not reference this mixin, so they are not affected by the same scoping issue.
