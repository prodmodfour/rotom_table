---
review_id: code-review-133
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-056
domain: character-lifecycle
commits_reviewed:
  - 3374668
  - d8c63eb
  - 8c0279f
  - c8d4edd
  - a34c2f4
  - 06dca93
  - 95e7248
files_reviewed:
  - app/components/create/BiographySection.vue
  - app/components/create/QuickCreateForm.vue
  - app/composables/useCharacterCreation.ts
  - app/pages/gm/create.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
reviewed_at: 2026-02-22T22:10:00Z
follows_up: code-review-129
---

## Review Scope

Re-review of 7 commits (3374668..95e7248) fixing issues raised in code-review-129 (ptu-rule-056 P2 CHANGES_REQUIRED). The original review found 1 CRITICAL (file size), 2 HIGH (cmToFeetInches rounding, Pokemon weight class scale), and 3 MEDIUM (negative int parsing, magic number in completion check, missing money in Quick Create) issues.

## Fix Verification

### H1: cmToFeetInches() rounding (commit 3374668) -- RESOLVED

The guard `if (inches === 12) { return \`${feet + 1}'0"\` }` correctly handles the edge case where `Math.round(totalInches % 12)` produces 12. Verified with the example from the original review: 182 cm = 71.653 inches, `feet = 5`, `inches = Math.round(11.653) = 12`, now correctly returns `6'0"` instead of the previous `5'12"`. The fix is minimal, correct, and well-placed.

### H2: Trainer weight class scale (commit d8c63eb) -- RESOLVED

`computeWeightClass()` now converts kg to lbs and applies the PTU Trainer weight class thresholds: WC 3 for up to 110 lbs, WC 4 for 111-220 lbs, WC 5 for 221+ lbs. This matches PTU Core p.16 Step 6 exactly. The comment block documenting the thresholds and the distinction from Pokemon weight classes is thorough.

The design decision to default sub-55 lbs trainers to WC 3 (rather than displaying "N/A") is a reasonable UX choice -- the PTU rulebook simply does not define a WC for trainers under 55 lbs, and WC 3 is the minimum. This aligns with the rules-review-119 recommendation.

### M1: parseOptionalInt() negative values (commit 8c0279f) -- RESOLVED

The guard `parsed < 1` correctly rejects zero and negative values for age, height, and weight fields, returning null instead. This is appropriate since none of these biography fields have a meaningful zero or negative value. The JSDoc comment was updated to reflect the new behavior ("positive integer").

### M2: Background section completion magic number (commit c8d4edd) -- RESOLVED

The `skillsWithRanks >= 5` threshold was removed from the background section completion check. Now `complete: hasBackground` is the sole criterion. The `skillsWithRanks` variable is retained because it is still used in the `detail` string (`\`${skillsWithRanks} skills set\``), so there is no dead code. The validation warning system elsewhere catches insufficient skill ranks, making this threshold redundant for section completion purposes.

### M3: Money in Quick Create payload (commit a34c2f4) -- RESOLVED

Quick Create now includes `money` in the payload: PCs get `DEFAULT_STARTING_MONEY` (5000), NPCs get 0. The `DEFAULT_STARTING_MONEY` constant was exported from `useCharacterCreation.ts` to enable reuse in `QuickCreateForm.vue`. This correctly applies the PTU p.17 recommendation for starting money.

### C1: create.vue file size (commit 06dca93) -- RESOLVED (with issues)

Quick Create form template, reactive state, and submission logic were extracted into `QuickCreateForm.vue` (147 lines). The parent `create.vue` dropped from 869 lines to 756 lines (confirmed under the 800-line limit). `QuickCreateForm.vue` is well-structured: it owns its own reactive form state, computes the HP formula and money locally, and emits a pre-built payload via `@submit`. The commit message accurately describes the extraction.

However, the extraction introduced two new issues detailed below.

## Issues

### HIGH: Styling regression -- scoped CSS classes not inherited by extracted component

**Files:** `app/components/create/QuickCreateForm.vue`, `app/pages/gm/create.vue`

QuickCreateForm.vue uses CSS classes that are defined in create.vue's `<style lang="scss" scoped>` block:

1. **`.form-row`** (create.vue line 708): provides `display: flex; gap: $spacing-md` for the Name/Type and Level/Location rows. QuickCreateForm.vue uses this class on lines 6 and 20. Without it, the two-column layout collapses to stacked single-column.

2. **`.create-form__section`** (create.vue line 676): provides `margin-bottom: $spacing-xl` and gradient `h3` styling. QuickCreateForm.vue uses this class on lines 3, 33, and 63. Without it, sections lose their spacing and headers lose the gradient text effect.

3. **`.create-form__actions`** (create.vue line 700): provides `display: flex; justify-content: flex-end; padding-top: $spacing-lg; border-top: 1px solid $glass-border`. QuickCreateForm.vue uses this class on line 68. Without it, the submit button loses its right-alignment and top border separator.

Vue's scoped styles only leak to the **root element** of a child component, not to deeper nested elements. Since QuickCreateForm's root is `<form class="create-form">`, only the root `.create-form` styles from the parent will apply. The nested `__section`, `__actions`, and `.form-row` elements will be unstyled.

**Impact:** The Quick Create form will render with broken layout -- no two-column rows, no section spacing, no header gradient, no button alignment. This is a visual regression that would be immediately visible.

**Fix:** Move `.form-row`, `.create-form__section`, and `.create-form__actions` styles into QuickCreateForm.vue's own `<style scoped>` block. Alternatively, move these shared styles to a global SCSS partial (e.g., `_create-form.scss`) and import it. The latter is preferable since the Full Create form in create.vue also uses these same classes.

### MEDIUM: Type safety regression -- `Record<string, unknown>` payload loses type checking

**Files:** `app/components/create/QuickCreateForm.vue` (line 87), `app/pages/gm/create.vue` (line 420)

QuickCreateForm.vue emits the submit payload typed as `Record<string, unknown>`:

```typescript
const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
}>()
```

The parent receives this as `Record<string, unknown>` and passes it to `libraryStore.createHuman(payload)`, which expects `Partial<HumanCharacter>`. Before the extraction, the payload was an inline object literal that TypeScript could structurally verify against `Partial<HumanCharacter>`. Now the type information is erased at the emit boundary.

This means:
- If a field name in the payload object drifts from `HumanCharacter` (e.g., typo `specialAtack` instead of `specialAttack`), TypeScript will not catch it.
- `Record<string, unknown>` is not assignable to `Partial<HumanCharacter>` without a cast, so this will likely produce a TypeScript compile error depending on strictness settings.

**Fix:** Type the emit payload properly. Import `HumanCharacter` and use `Partial<HumanCharacter>` (or a dedicated `QuickCreatePayload` interface) as the emit type. Update `createHumanQuick` in create.vue to match.

## What Looks Good

1. **Commit granularity is excellent.** Each of the 7 commits addresses exactly one issue with a clear, descriptive message. The commit messages include the "why" (e.g., "Math.round(totalInches % 12) can produce 12 for values like 182cm") and not just the "what."

2. **H1 cmToFeetInches fix** is minimal and correct. The guard is placed at the right location and handles the edge case cleanly without over-engineering.

3. **H2 weight class fix** correctly implements the PTU Trainer scale with proper kg-to-lbs conversion and accurate threshold values. The JSDoc comment clearly documents the distinction from Pokemon weight classes and cites the PTU source.

4. **M2 simplification** is a genuine improvement -- removing the magic number makes the completion check clearer and delegates validation to the appropriate system (the validation warnings).

5. **M3 money fix** correctly differentiates between PCs and NPCs, and the export of `DEFAULT_STARTING_MONEY` avoids magic number duplication across files.

6. **QuickCreateForm extraction** is structurally sound -- the component owns its state, computes derived values locally, and communicates with the parent via a clean props/emits interface. The single `creating` prop and single `submit` emit is a good component boundary.

## Verdict

**CHANGES_REQUIRED**

All 6 original issues from code-review-129 are correctly resolved. The fixes are well-implemented, correctly scoped, and properly committed. However, the QuickCreateForm extraction (C1 fix) introduced 1 HIGH styling regression (scoped CSS classes not reaching the child component) and 1 MEDIUM type safety regression (`Record<string, unknown>` erasing the payload type).

The styling regression is HIGH because it produces a visually broken form that would be immediately apparent to any user -- this is not a subtle issue. The type safety regression is MEDIUM because it works at runtime but defeats TypeScript's ability to catch payload shape errors at compile time.

## Required Changes

1. **[HIGH] Fix scoped CSS inheritance in QuickCreateForm.vue.** The `.form-row`, `.create-form__section`, and `.create-form__actions` styles defined in create.vue's scoped block do not reach nested elements inside the child component. Either:
   - (a) Duplicate these styles into QuickCreateForm.vue's own `<style scoped>` block, or
   - (b) Extract shared `.create-form` and `.form-row` styles into a global SCSS partial and import it in both components (preferred -- avoids duplication since the Full Create form in create.vue also uses these classes).

2. **[MEDIUM] Type the QuickCreateForm emit payload.** Replace `Record<string, unknown>` with `Partial<HumanCharacter>` (or a narrower interface) in the emit definition. Update `createHumanQuick` in create.vue to accept the typed payload. This restores the compile-time type checking that was lost during extraction.
