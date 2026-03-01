---
ticket_id: refactoring-116
category: EXT-GOD
priority: P4
severity: LOW
status: open
source: code-review-257 MEDIUM-03
created_by: slave-collector (plan-20260301-184039)
created_at: 2026-03-01
---

# refactoring-116: XpDistributionModal.vue exceeds 800-line file limit (873 lines)

## Summary

`app/components/encounter/XpDistributionModal.vue` is 873 lines, exceeding the project's 800-line maximum. The file was already at 813 lines before feature-009 P1 added ~60 lines for trainer XP integration. The 273-line `<style>` block is the largest contributor.

## Affected Files

- `app/components/encounter/XpDistributionModal.vue` (873 lines)

## Suggested Fix

One or both of:
1. Extract the `<style>` block into a dedicated SCSS partial (`assets/scss/components/_xp-distribution-modal.scss`)
2. Extract a sub-component for the Pokemon XP distribution section (the original P0 functionality) to reduce template/script complexity

## Impact

Pre-existing code health issue. Does not affect functionality. Reduces maintainability and makes future changes to XP distribution harder to review.
