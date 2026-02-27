---
review_id: code-review-103
ticket: refactoring-052
commits: [2b9a0a0, 1efa4ea]
files_reviewed:
  - app/pages/gm/encounters.vue
  - app/assets/scss/_modal.scss
verdict: CHANGES_REQUIRED
date: 2026-02-20
---

## Summary

The fix correctly identifies the behavioral change introduced by refactoring-032 and restores whole-modal scrolling via three CSS overrides (`overflow: auto`, `display: block`, `overflow-y: visible`). The overrides are functionally correct. However, the fix creates a code-smell issue that warrants a follow-up, and it missed one pre-existing silent regression in the footer gap.

## Issues

### ISSUE-1: Footer gap silently changed from $spacing-md to $spacing-sm [MEDIUM]

**Not introduced by this fix** -- this was introduced by refactoring-032 (commit `abfe751`) and was not caught by refactoring-052 or this fix.

The original `encounters.vue` footer had:
```scss
&__footer {
  gap: $spacing-md;  // 16px
}
```

The `modal-container-base` mixin provides:
```scss
&__footer {
  gap: $spacing-sm;  // 8px
}
```

The fix did not restore the original gap. The footer button spacing is now 8px instead of the original 16px. This is a minor visual regression that should be addressed.

**Required action:** Add `&__footer { gap: $spacing-md; }` override to the `.modal` block in `encounters.vue`, OR file a new ticket to track this separately.

### ISSUE-2: Mixin provides diminishing value when 5 of its properties are overridden [MEDIUM]

The `modal-container-base` mixin emits properties across 4 selectors. In this component, the following are overridden or dead:

| Mixin property | Override in encounters.vue | Status |
|---|---|---|
| `background: $color-bg-secondary` | `background: $color-bg-primary` | Overridden |
| `width: 100%` | `width: 90%` | Overridden |
| `overflow: hidden` | `overflow: auto` | Overridden |
| `display: flex` | `display: block` | Overridden |
| `flex-direction: column` | (dead, no effect with block) | Dead |
| `&__close` | (not used in template) | Dead |
| `&__body overflow-y: auto` | `overflow-y: visible` | Overridden |
| `&__footer gap: $spacing-sm` | Should be $spacing-md (see ISSUE-1) | Silent regression |

What the mixin still contributes:
- `border-radius: $border-radius-lg`
- `border: 1px solid $glass-border`
- `max-width: 500px`
- `max-height: 90vh`
- `&__header` layout (flex, padding, border-bottom)
- `&__body` padding
- `&__footer` layout (flex, justify-content, padding, border-top)

The mixin still provides ~7 useful property groups, so it is not zero-value. But overriding 5 properties immediately after including a mixin is a code smell -- it obscures what the final computed style actually is.

**Required action:** This is acceptable for now because encounters.vue is the only consumer that needs block-level scrolling. However, file a ticket (P4) to evaluate whether encounters.vue should stop using the mixin entirely and inline just the properties it actually needs. This would make the modal styling self-documenting and avoid the "include then undo" pattern.

## Properties Verified Correct

- `overflow: auto` on `.modal` -- matches original pre-refactoring-032 behavior
- `display: block` on `.modal` -- correctly removes flex column layout, restoring block flow
- `overflow-y: visible` on `&__body` -- correctly prevents body-only scroll, since the parent now scrolls
- `h2` font-size override at `1.25rem` -- restored in prior commit `0dca5ad`, verified present
- `background: $color-bg-primary` -- matches original, correctly overrides mixin's `$color-bg-secondary`

## Mixin Ecosystem Check

7 other components use `modal-container-base`. None of them override `overflow`, `display`, or `flex-direction`. All 7 use the flex-column layout model as intended. This confirms encounters.vue is the sole outlier, and the overrides do not indicate a systemic mixin design problem.

## Verdict: CHANGES_REQUIRED

The core fix is sound. Two actions are required before approval:

1. **ISSUE-1:** Restore `gap: $spacing-md` on `&__footer` (or file a ticket).
2. **ISSUE-2:** File a P4 ticket to evaluate removing the mixin from encounters.vue entirely.

Once both are addressed, this can be re-reviewed for approval.
