---
ticket_id: refactoring-063
priority: P4
status: resolved
category: EXT-DUPLICATE
source: code-review-123 (M2) + rules-review-113 (M2)
created_at: 2026-02-21
created_by: slave-collector (plan-20260221-063148)
resolved_at: 2026-02-21
resolved_by: slave/1-dev-058-fix
---

## Summary

Significance preset utilities are duplicated across `SignificancePanel.vue` and `XpDistributionModal.vue`. The `resolvePresetFromMultiplier()` function is copy-pasted identically in both components. Additionally, preset labels diverge between the two — SignificancePanel uses hardcoded friendly labels ("Insignificant", "Minor", "Everyday", "Notable", "Significant", "Climactic") while XpDistributionModal auto-generates from key names ("Insignificant", "Below Average", "Average", "Above Average", "Significant", "Major"). A GM switching between the two views sees different names for the same presets.

## Affected Files

- `app/components/encounter/SignificancePanel.vue` — hardcoded preset labels + `resolvePresetFromMultiplier()`
- `app/components/encounter/XpDistributionModal.vue` — auto-generated preset labels + `resolvePresetFromMultiplier()`
- `app/utils/experienceCalculation.ts` — target location for extracted utilities

## Suggested Fix

1. Move `resolvePresetFromMultiplier()` to `experienceCalculation.ts` alongside `SIGNIFICANCE_PRESETS`
2. Add a `SIGNIFICANCE_PRESET_LABELS` map to `experienceCalculation.ts` with the canonical friendly labels
3. Import and use both in `SignificancePanel.vue` and `XpDistributionModal.vue`

## Impact

Low — this is a code hygiene issue. The duplication creates a maintenance risk where one component's labels or logic could drift from the other. The fix is small (extract + import) and improves consistency.

## Resolution Log

- **2d6831b** `refactor: extract resolvePresetFromMultiplier and preset labels to experienceCalculation.ts`
  - Moved `resolvePresetFromMultiplier()` to `app/utils/experienceCalculation.ts`
  - Added `SIGNIFICANCE_PRESET_LABELS` map with canonical friendly labels
  - Updated `SignificancePanel.vue` and `XpDistributionModal.vue` to import shared utilities
  - Both components now display identical preset labels
