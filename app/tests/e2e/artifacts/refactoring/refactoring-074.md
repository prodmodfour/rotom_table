---
id: refactoring-074
category: EXT-DUPLICATE
priority: P4
status: open
source: rules-review-131 (observation)
created_by: slave-collector (plan-20260223-085530)
created_at: 2026-02-23
---

# refactoring-074: Consolidate duplicate SIGNIFICANCE_PRESETS arrays

## Summary

Two separate `SIGNIFICANCE_PRESETS` arrays exist:
1. `app/utils/experienceCalculation.ts` (lines 59-66) — tiers: `below_average`, `average`, `above_average`, `significant`, `major`
2. `app/utils/encounterBudget.ts` (lines 72-108) — tiers: `insignificant`, `everyday`, `significant`, `climactic`, `legendary`

Both represent the PTU x1-x5 significance range but use different tier names and granularity. The `experienceCalculation.ts` version powers the post-combat XP distribution UI; the `encounterBudget.ts` version powers encounter creation.

## Affected Files

- `app/utils/experienceCalculation.ts`
- `app/utils/encounterBudget.ts`

## Suggested Fix

Consolidate into a single canonical set of significance tier definitions. Use the `encounterBudget.ts` version (which uses PTU-aligned terminology) as the source of truth. Update `experienceCalculation.ts` to reference the same constants.

## Impact

UI consistency — players/GMs see consistent significance terminology across encounter creation and XP distribution. No mechanical impact (both correctly span x1-x5).
