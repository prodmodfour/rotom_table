---
review_id: code-review-109
ticket: refactoring-054
commits_reviewed: ["fe23d1c", "93c6b5d"]
verdict: APPROVED
reviewer: senior-reviewer
date: 2026-02-20
---

## Review: refactoring-054 — Inline modal styles in encounters.vue

### Scope

Two commits: `fe23d1c` (refactor SCSS in encounters.vue) and `93c6b5d` (mark ticket resolved with Resolution Log).

### Verification Method

Property-by-property comparison of the `modal-container-base` mixin definition (lines 34-83 of `_modal.scss`) against the old overrides and the new inlined styles. Template inspection to confirm sub-selector usage.

### Property-Level Audit

**Root `.modal` properties (9 from mixin):**

| Mixin Property | Old Override | New Inlined Value | Verdict |
|---|---|---|---|
| `background: $color-bg-secondary` | `$color-bg-primary` | `$color-bg-primary` | Correct |
| `border-radius: $border-radius-lg` | none | `$border-radius-lg` | Correct |
| `border: 1px solid $glass-border` | none | `1px solid $glass-border` | Correct |
| `width: 100%` | `90%` | `90%` | Correct |
| `max-width: 500px` | none | `500px` | Correct |
| `max-height: 90vh` | none | `90vh` | Correct |
| `overflow: hidden` | `auto` | `auto` | Correct |
| `display: flex` | `block` | omitted (defaults to block) | Correct |
| `flex-direction: column` | n/a (display:block) | omitted | Correct |

**Sub-selectors:**

| Sub-selector | Mixin Content | Old Override | New Inlined | Verdict |
|---|---|---|---|---|
| `&__header` | flex layout + `h3` styles | `h2` styles only | flex layout + `h2` styles | Correct |
| `&__close` | full button styles | none (unused) | dropped | Correct — no `.modal__close` in template |
| `&__body` | `padding: $spacing-lg` + `overflow-y: auto` | `overflow-y: visible` | `padding: $spacing-lg` only | Correct — overflow-y defaults to visible |
| `&__footer` | flex layout + `gap: $spacing-sm` | `gap: $spacing-md` | flex layout + `gap: $spacing-md` | Correct |

### Key Decisions Validated

1. **Dropping `display: block`**: The mixin set `display: flex; flex-direction: column`, and the old code overrode to `display: block`. The new code omits display entirely, which defaults to block. The three sub-selectors (`__header`, `__body`, `__footer`) are plain divs that don't depend on a flex parent — they each set their own display/layout internally. No behavioral change.

2. **Dropping `&__close`**: All three modals in the template use `<button class="btn btn--icon btn--ghost">` for close actions. No element has the `modal__close` class. Dead code correctly removed.

3. **`h2` vs `h3` in header**: The mixin styles `h3` inside `&__header`, but the template exclusively uses `<h2>`. The developer correctly inlined the `h2`-targeted styles (with `font-size: 1.25rem`) rather than carrying over the mixin's `h3` rule. This was actually a latent issue from the original mixin adoption (flagged in code-review-100) — the refactoring eliminates it cleanly.

4. **`overflow-y` omission in `&__body`**: Mixin sets `overflow-y: auto`, old code overrode to `visible`, new code omits both. CSS default for `overflow-y` is `visible`. Equivalent behavior with less code.

### Mixin Not Orphaned

7 other components still use `modal-container-base`: SaveTemplateModal, LoadTemplateModal, TableEditor, ImportTableModal, ModificationCard, StartEncounterModal, encounter-tables.vue. The mixin remains in active use.

### File Size

640 lines — well within the 800-line limit.

### Resolution Log

The Resolution Log in the ticket is thorough and accurate. Every property decision is documented with reasoning. The commit message clearly explains the 6 overrides that motivated the refactoring.

### Issues Found

None.
