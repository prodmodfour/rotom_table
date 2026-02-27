---
ticket_id: refactoring-064
category: EXT-DUPLICATE
priority: P4
status: resolved
domain: scenes
source: code-review-124 H2
created_by: slave-collector (plan-20260221-071325)
created_at: 2026-02-21
---

# refactoring-064: Extract shared difficulty color styles

## Summary

The same 5-tier difficulty color mapping (`trivial: #9e9e9e`, `easy: $color-success`, `balanced: $color-info`, `hard: $color-warning`, `deadly: $color-danger`) is duplicated verbatim across `BudgetIndicator.vue` and `StartEncounterModal.vue`. Additionally, `#9e9e9e` is a hardcoded hex value that should use an SCSS variable.

## Affected Files

- `app/components/encounter/BudgetIndicator.vue` (lines 128-153)
- `app/components/scene/StartEncounterModal.vue` (lines 130-153)

## Suggested Fix

1. Extract difficulty color mapping into a shared SCSS mixin or utility class (e.g., `@mixin difficulty-color` in `_variables.scss` or a new `_difficulty.scss` partial)
2. Replace hardcoded `#9e9e9e` with a named SCSS variable (e.g., `$color-neutral` or `$color-muted`)
3. Use the shared mixin in both components

## Impact

- **Extensibility:** P1/P2 budget features will add more consumers of difficulty colors. Without extraction, each new consumer copies the mapping independently.
- **Consistency:** Hardcoded hex values bypass the SCSS variable system.

## Resolution

Resolved in commit `1c4a6cc`. Extracted to `app/assets/scss/_difficulty.scss` with `difficulty-text-colors` and `difficulty-bg-colors` mixins. Added `$color-neutral` variable to `_variables.scss`. Both `BudgetIndicator.vue` and `StartEncounterModal.vue` now use the shared mixins.
