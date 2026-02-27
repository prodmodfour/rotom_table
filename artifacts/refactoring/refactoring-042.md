---
ticket_id: refactoring-042
priority: P2
status: resolved
category: EXT-DUPLICATE
created_at: 2026-02-20
created_by: senior-reviewer
source_review: code-review-073
resolved_at: 2026-02-20
---

## Summary

MoveTargetModal.vue is 869 lines (exceeds 800-line limit). The bloat is entirely in SCSS — 552 lines of styles vs 87 lines of script logic. The script section is lean thanks to good composable extraction, but the styles need to be moved to a partial or scoped stylesheet.

## Affected Files

- `app/components/encounter/MoveTargetModal.vue` — 869 lines total, 552 lines SCSS

## Suggested Refactoring

1. Extract the SCSS block into a dedicated partial (e.g., `app/assets/scss/components/_move-target-modal.scss`) or split the component into sub-components with co-located styles
2. Keep only component-specific overrides in the SFC `<style>` block
3. Verify no style regressions after extraction

## Acceptance Criteria

- MoveTargetModal.vue under 800 lines
- No visual regressions in the move targeting modal
- SCSS organization follows project patterns

## Resolution Log

**Commit:** `11e33ac` — refactor: extract MoveTargetModal SCSS to dedicated partial

**Files changed:**
- `app/components/encounter/MoveTargetModal.vue` — removed 551 inline SCSS lines, replaced with `@import` of the new partial (869 → 318 lines)

**Files created:**
- `app/assets/scss/components/_move-target-modal.scss` — 555 lines, contains all extracted SCSS

**Approach:** Extracted the entire 552-line scoped `<style>` block into a dedicated SCSS partial at `app/assets/scss/components/_move-target-modal.scss`. The component's `<style lang="scss" scoped>` block now contains a single `@import` statement. Scoping is preserved because Vue applies the `scoped` attribute to all selectors from imported files. The partial lives alongside existing component partials (`_modal.scss`, `_type-badges.scss`, `_effectiveness.scss`, `_conditions.scss`) following project conventions. Not added to `_index.scss` since it is only consumed via scoped import, not globally.
