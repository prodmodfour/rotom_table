---
review_id: code-review-138
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-056
domain: character-lifecycle
commits_reviewed:
  - 27ffffd
  - 1180c9c
  - b7c53ee
files_reviewed:
  - app/assets/scss/_create-form.scss
  - app/types/character.ts
  - app/components/create/QuickCreateForm.vue
  - app/pages/gm/create.vue
  - app/nuxt.config.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
reviewed_at: 2026-02-23T09:15:00Z
follows_up: code-review-133
---

## Review Scope

Re-review of 3 commits (27ffffd, 1180c9c, b7c53ee) fixing 2 issues raised in code-review-133 (ptu-rule-056 P2 CHANGES_REQUIRED). The original review found 1 HIGH (scoped CSS classes not reaching QuickCreateForm.vue child component) and 1 MEDIUM (Record<string, unknown> erasing type checking on emit payload).

## Fix Verification

### M1: QuickCreatePayload type safety (commit 1180c9c) -- RESOLVED

The `QuickCreatePayload` interface in `app/types/character.ts` (lines 200-210) correctly types the emit boundary between `QuickCreateForm.vue` and `create.vue`:

- All 9 fields (`name`, `characterType`, `level`, `location?`, `stats`, `maxHp`, `currentHp`, `money`, `notes?`) match the payload shape built in `QuickCreateForm.vue`'s `handleSubmit()` (lines 116-133).
- Every field type is compatible with `Partial<HumanCharacter>` (which `libraryStore.createHuman()` expects). The `Stats` import reuses the existing shared interface from the same file.
- `QuickCreatePayload` is re-exported from `~/types/index.ts` via `export * from './character'`, so the barrel import in `create.vue` (`import type { PokemonType, QuickCreatePayload } from '~/types'`) resolves correctly.
- The `createHumanQuick` handler in `create.vue` (line 423) now accepts `QuickCreatePayload` instead of `Record<string, unknown>`, restoring compile-time type checking across the emit boundary.

The interface is narrow and purpose-specific (ISP-compliant), placed in the correct file (`character.ts`), and avoids over-reaching by not re-typing all of `HumanCharacter`. This is the right approach.

### H1: Scoped CSS extraction (commit 27ffffd) -- PARTIALLY RESOLVED (new issue)

The original problem (scoped styles in `create.vue` not reaching nested elements in `QuickCreateForm.vue`) is correctly identified and the extracted styles in `_create-form.scss` match the original definitions exactly -- including `.create-form`, `.create-form__section` (with `h3` gradient and `--warnings` modifier), `.create-form__actions`, and `.form-row` with `.form-group` child. The diff confirms 49 lines removed from `create.vue`'s scoped block and 54 lines added to the partial (accounting for the header comment block).

**However, the delivery mechanism is wrong.** See H1 below.

### Docs commit (b7c53ee) -- RESOLVED

The ticket resolution log correctly documents both fixes with commit hashes, descriptions, and the specific issues addressed. Follows the established format.

## Issues

### HIGH: Bare CSS rules in `additionalData` SCSS partial causes style duplication across all components

**Files:** `app/assets/scss/_create-form.scss`, `app/nuxt.config.ts` (line 48)

The `_create-form.scss` partial contains bare CSS rule declarations (`.create-form { ... }`, `.form-row { ... }`). It was registered in `nuxt.config.ts` via `vite.css.preprocessorOptions.scss.additionalData`, which prepends `@use "~/assets/scss/_create-form.scss" as *;` to **every component's SCSS compilation**.

Every other partial in `additionalData` follows a strict convention: variables only (`_variables.scss`) or mixins only (`_difficulty.scss`, `_pokemon-sheet.scss`, `_modal.scss`, `_sheet.scss`). None of them contain bare CSS rules. This is by design -- `additionalData` content is prepended to each component's SCSS and compiled independently. Bare CSS rules in a `@use`'d module are emitted at the point of inclusion, which means:

1. **Style duplication:** The 54 lines of CSS in `_create-form.scss` are emitted into the compiled output of all 127 `.vue` files with `<style lang="scss">` blocks. This adds ~6,800 lines of redundant CSS to the production bundle.

2. **Namespace collision risk:** The `.form-row` class is defined in at least 12 other components' scoped styles (CharacterModal.vue, PokemonEditForm.vue, characters/[id].vue, encounter-tables.vue, encounters.vue, HumanStatsTab.vue, HumanEquipmentTab.vue, TableEditor.vue, EncounterTableModal.vue, GenerateEncounterModal.vue). While Vue's scoped attribute selectors will win in specificity, having an unscoped `.form-row` leaking into every component's CSS is architecturally unsound.

**Fix:** Remove `_create-form.scss` from `additionalData` in `nuxt.config.ts`. Instead, either:

- **(a) Preferred -- global stylesheet:** Add `'~/assets/scss/_create-form.scss'` to the `css` array in `nuxt.config.ts` (alongside `main.scss`). This emits the rules exactly once as a global stylesheet. Since the classes are meant to be shared globally between `create.vue` and `QuickCreateForm.vue` (and both are unscoped for these class names), global CSS is the correct delivery mechanism. Note: the partial would need to import its variable dependencies explicitly (e.g., `@use 'variables' as *;` at the top) since it would no longer be prepended after `_variables.scss`.

- **(b) Alternative -- mixin pattern:** Convert the bare rules into mixins (matching `_sheet.scss` / `_modal.scss` pattern), keep the file in `additionalData`, and have both `create.vue` and `QuickCreateForm.vue` `@include` the mixin in their scoped styles. This duplicates the CSS in only 2 components instead of 127.

Option (a) is simpler and matches the intent (these are truly shared global styles for the create page family). Option (b) is architecturally cleaner but more verbose.

## What Looks Good

1. **M1 fix is clean and complete.** The `QuickCreatePayload` interface correctly models the emit shape, uses the existing `Stats` and `CharacterType` types, is placed in the right file, and is structurally compatible with `Partial<HumanCharacter>`. The emit type in `QuickCreateForm.vue` and the handler type in `create.vue` are both updated consistently.

2. **The extracted CSS rules are correct.** The content of `_create-form.scss` faithfully reproduces the original scoped styles from `create.vue`, including the `--warnings` modifier and the `.form-group` flex child rule. No styles were lost or altered during extraction.

3. **Commit granularity is correct.** Three separate commits for three distinct changes (SCSS extraction, type safety, docs update). Each commit message explains both what and why.

4. **The scoped block cleanup in `create.vue` is thorough.** The removed styles exactly match what was extracted -- no orphaned rules left behind, and the remaining scoped styles (`create-page`, `mode-toggle`, `section-progress`, `type-btn`, `stats-grid`, `validation-summary`, `validation-item`) are all still used by the Full Create form and Pokemon form that remain in `create.vue`.

## Verdict

**CHANGES_REQUIRED**

The M1 type safety fix is complete and approved. The H1 scoped CSS fix correctly solves the original styling regression but introduces a new architecture issue: bare CSS rules in `additionalData` cause the styles to be duplicated into all 127 component CSS outputs. The fix is to move `_create-form.scss` from `additionalData` to the `css` array (or convert to mixins). This is a one-line change in `nuxt.config.ts` plus adding a `@use 'variables' as *;` import to the partial.

## Required Changes

1. **[HIGH] Move `_create-form.scss` out of `additionalData` and into the `css` array.** Remove `@use "~/assets/scss/_create-form.scss" as *;` from the `additionalData` string in `nuxt.config.ts` line 48. Add `'~/assets/scss/_create-form.scss'` to the `css` array (line 18). Add `@use 'variables' as *;` at the top of `_create-form.scss` so its SCSS variable references resolve. This delivers the shared styles as a single global stylesheet instead of duplicating them 127 times.
