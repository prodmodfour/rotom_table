---
ticket_id: refactoring-101
category: EXT-DUPLICATE
priority: P4
severity: LOW
status: open
domain: pokemon-lifecycle
source: code-review-231 M1
created_by: slave-collector (plan-20260228-233710)
created_at: 2026-03-01
---

# Deduplicate type-badge SCSS across evolution components

## Summary

Three files contain identical `.type-badge` scoped SCSS with 18 type-color rules. The project already has a shared `app/assets/scss/components/_type-badges.scss` partial that provides both a `.type-badge` class and `@mixin type-badge-colors`.

## Affected Files

- `app/components/pokemon/EvolutionConfirmModal.vue` (lines 354-381)
- `app/components/encounter/XpDistributionResults.vue` (lines 376-402)
- `app/pages/gm/pokemon/[id].vue` (lines 566-592)

## Suggested Fix

Replace the duplicated scoped SCSS in all three files with either:
1. `@include type-badge-colors` from the shared mixin, or
2. Use the global `.type-badge` class directly

## Impact

Code hygiene. No functional impact. Reduces ~80 lines of duplicated SCSS.
