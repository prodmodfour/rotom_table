# Code Review 107 — refactoring-053: Replace inline enhanced modal styles with mixin @includes

**Ticket:** refactoring-053
**Commit:** `d2944fe` (refactor), `01b1ab3` (ticket update)
**Reviewer:** Senior Reviewer
**Verdict:** APPROVED

---

## Scope

Three components replaced inline enhanced-modal CSS with `@include modal-overlay-enhanced` / `@include modal-container-enhanced` from `_modal.scss`, keeping only component-specific overrides. All three also removed local `@keyframes fadeIn` and `@keyframes slideUp` definitions.

**Files changed:**
- `app/components/character/CharacterModal.vue` (-52 lines inline, +2 @include)
- `app/components/encounter/GMActionModal.vue` (-39 lines inline, +2 @include)
- `app/components/encounter/AddCombatantModal.vue` (-52 lines inline, +2 @include)

---

## Property-by-Property Comparison

### CharacterModal.vue

| Area | Original inline | Mixin provides | Override | Match? |
|------|----------------|----------------|----------|--------|
| `.modal-overlay` | `position:fixed; inset:0; background-color:rgba(0,0,0,0.85); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:$z-index-modal; animation:fadeIn 0.2s ease-out` | Identical | None needed | YES |
| `.modal` container | `background:$glass-bg; backdrop-filter:$glass-blur; border:1px solid $glass-border; border-radius:$border-radius-xl; width:100%; max-height:90vh; display:flex; flex-direction:column; box-shadow:$shadow-xl,0 0 40px rgba($color-accent-violet,0.15); animation:slideUp 0.3s ease-out` | All above + `max-width:500px` | `&--fullsheet { max-width:900px }` | YES (template always applies `modal--fullsheet`, so 500px default is always overridden to 900px) |
| `&__header` | `display:flex; justify-content:space-between; align-items:center; padding:$spacing-lg; border-bottom:1px solid $glass-border; h2{margin:0;color:$color-text;font-weight:600}` + `background:linear-gradient(...)` | All structural props + h2 rule | `background: linear-gradient(...)` | YES |
| `&__body` | `flex:1; overflow-y:auto; padding:$spacing-lg` | Identical | None needed | YES |
| `&__footer` | `display:flex; justify-content:flex-end; gap:$spacing-md; padding:$spacing-lg; border-top:1px solid $glass-border` + `background:rgba($color-bg-primary,0.5)` | All structural props | `background: rgba($color-bg-primary, 0.5)` | YES |

### AddCombatantModal.vue

| Area | Original inline | Mixin provides | Override | Match? |
|------|----------------|----------------|----------|--------|
| `.modal-overlay` | Identical to CharacterModal | Identical | None needed | YES |
| `.modal` container | Same as CharacterModal but with `max-width:500px; max-height:80vh` | `max-width:500px; max-height:90vh` | `max-height:80vh` (overrides mixin's 90vh) | YES |
| `&__header` | Same structural props + `background:linear-gradient(135deg, rgba($color-accent-scarlet,0.1)...)` | All structural props + h2 rule | `background: linear-gradient(...)` with scarlet accent | YES |
| `&__body` | `flex:1; overflow-y:auto; padding:$spacing-lg` | Identical | None needed | YES |
| `&__footer` | Same structural props + `background:rgba($color-bg-primary,0.5)` | All structural props | `background: rgba($color-bg-primary, 0.5)` | YES |

### GMActionModal.vue

| Area | Original inline | Mixin provides | Override | Match? |
|------|----------------|----------------|----------|--------|
| `.modal-overlay` | Identical to CharacterModal | Identical | None needed | YES |
| `.gm-action-modal` container | `background:$glass-bg; backdrop-filter:$glass-blur; border:1px solid $glass-border; border-radius:$border-radius-xl; width:100%; max-width:600px; max-height:85vh; display:flex; flex-direction:column; box-shadow:...; animation:slideUp...` | All base props with `max-width:500px; max-height:90vh` | `max-width:600px; max-height:85vh` (both override correctly) | YES |
| `&__header` | `display:flex; align-items:center; gap:$spacing-md; padding:$spacing-lg; border-bottom:1px solid $glass-border; background:linear-gradient(...)` | `display:flex; justify-content:space-between; align-items:center; padding:$spacing-lg; border-bottom:1px solid $glass-border; h2{...}` | `gap:$spacing-md; background:linear-gradient(...)` | YES (see note 1) |
| `&__body` | `flex:1; overflow-y:auto; padding:$spacing-lg` | Identical | None needed | YES |

---

## @keyframes Verification

All three components removed local `@keyframes fadeIn` and `@keyframes slideUp` definitions. These are defined globally in:
- `app/assets/scss/main.scss` lines 878-891

The components use `<style lang="scss" scoped>`. Vue's scoped style system does NOT scope `@keyframes` names or `animation` property references -- keyframe names are matched globally. Since `main.scss` is loaded globally via `nuxt.config.ts` (`css: ['~/assets/scss/main.scss']`), the animations will resolve correctly. Removal of local duplicates is safe.

---

## Notes

1. **GMActionModal `&__header` gains `justify-content: space-between`** -- The original header did not set `justify-content` (defaults to `flex-start`). The mixin adds `justify-content: space-between`. However, the header's first child (`.header-info`) has `flex: 1`, which absorbs all remaining space. With a flex-grow child, the difference between `flex-start` and `space-between` is invisible -- the layout is identical in both cases. No visual impact.

2. **GMActionModal `&__header` gains mixin's `h2` rule** -- The mixin includes `h2 { margin: 0; color: $color-text; font-weight: 600 }`, which the original GMActionModal header did not have. The component's `h2` lives inside `.header-info__text h2`, which has its own explicit `margin: 0 0 $spacing-xs` (higher specificity). The mixin's `h2` rule is overridden and has no visual impact.

---

## Commit Hygiene

- Commit `d2944fe`: Single-purpose refactoring commit. Message accurately describes the change. Correct file scope. Good.
- Commit `01b1ab3`: Ticket status update. Correct and separate from the code change. Good.

---

## Verdict

**APPROVED** -- All three components produce identical visual output after the refactoring. The mixin output + component overrides match the original inline styles property-for-property. The `@keyframes` removal is safe because `main.scss` provides them globally. The two minor additive properties from the mixin (GMActionModal header `justify-content` and `h2` rule) are neutralized by existing CSS specificity and flex layout behavior. Net reduction of 155 lines with zero visual regressions.
