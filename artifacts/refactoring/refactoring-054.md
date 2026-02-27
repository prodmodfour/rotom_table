---
ticket_id: refactoring-054
priority: P3
status: resolved
category: EXT-SMELL
source: code-review-103
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

encounters.vue uses `modal-container-base` mixin but overrides 6 of its properties. Evaluate whether to stop using the mixin and inline only the needed properties.

## Affected Files

- `app/pages/gm/encounters.vue` — uses mixin then overrides overflow, display, flex-direction, __close, __body overflow-y, and footer gap

## Suggested Fix

Remove the `@include modal-container-base` and inline only the ~7 property groups that encounters.vue actually uses from the mixin.

## Resolution Log

- **Commit:** fe23d1c
- **Files changed:** `app/pages/gm/encounters.vue`
- **What was done:**
  - Removed `@include modal-container-base` from `.modal` selector
  - Inlined only the properties actually used with their correct (overridden) values:
    - `background: $color-bg-primary` (was overriding mixin's `$color-bg-secondary`)
    - `border-radius: $border-radius-lg` (kept from mixin)
    - `border: 1px solid $glass-border` (kept from mixin)
    - `width: 90%` (was overriding mixin's `100%`)
    - `max-width: 500px` (kept from mixin)
    - `max-height: 90vh` (kept from mixin)
    - `overflow: auto` (was overriding mixin's `hidden`)
  - Removed `display: block` override — the mixin set `display: flex; flex-direction: column` and encounters.vue overrode to `display: block`, but the sub-selectors (`__header`, `__body`, `__footer`) don't need flex layout on the parent; omitting `display` lets it default to `block`
  - Inlined `&__header` sub-selector with all mixin properties plus the existing `h2` custom styles
  - Inlined `&__body` with only `padding: $spacing-lg` (dropped `overflow-y: auto` which was overridden to `visible`, and omitting both lets it default to `visible`)
  - Inlined `&__footer` with mixin properties using `gap: $spacing-md` (was overriding mixin's `$spacing-sm`)
  - Dropped unused `&__close` sub-selector (template uses `.btn.btn--icon.btn--ghost` for close buttons)
- **Net effect:** 21 insertions, 7 deletions — styles are now self-contained and immediately readable without tracing through the mixin
