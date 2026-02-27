---
ticket_id: refactoring-052
priority: P3
status: resolved
category: BEHAVIOR-CHANGE
source: code-review-100
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

During refactoring-032 (SCSS partial extraction), `encounters.vue` had its modal overflow model changed from `overflow: auto` (block-level) to `overflow: hidden` + flex column layout. While low-risk, this is a behavioral change introduced during a purely cosmetic refactoring.

## Affected Files

- `app/pages/gm/encounters.vue` — modal overflow/layout model

## Suggested Fix

Review whether the new flex-column + overflow-hidden model produces identical scrolling behavior as the original `overflow: auto`. If not, restore the original overflow model while keeping the mixin for other styles.

## Notes

Low priority — the encounters page modals are small and unlikely to overflow in practice. But behavioral changes should not be mixed into refactoring commits.

## Resolution Log

- **Commit:** 2b9a0a0 `fix: restore original overflow model in encounters.vue modals`
- **Files changed:** `app/pages/gm/encounters.vue`
- **New files:** None
- **Test status:** No existing tests for modal overflow behavior; change is CSS-only

### Analysis

The `modal-container-base` mixin applies `overflow: hidden` + `display: flex` + `flex-direction: column` with `overflow-y: auto` on `__body`. This creates a pinned-header/footer layout where only the body scrolls. The original code used `overflow: auto` on the entire modal container with no flex layout, meaning the whole modal (header + body + footer) scrolled together as a single block.

These are **not identical behaviors**. The fix overrides the mixin with:
- `overflow: auto` — restores whole-modal scrolling
- `display: block` — overrides flex column layout back to block
- `&__body { overflow-y: visible }` — removes body-only scroll from the mixin

The mixin is still used for border, border-radius, max-width, max-height, header/footer structure, and other shared properties.
