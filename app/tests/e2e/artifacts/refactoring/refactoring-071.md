---
ticket_id: refactoring-071
priority: P4
status: in-progress
category: PTU-INCORRECT
source: code-review-137 (M2)
created_at: 2026-02-23
created_by: slave-collector (plan-20260223-061421)
---

## Summary

`MAX_FEATURES` constant in `useCharacterCreation.ts` is hardcoded to 4, which is correct for level 1 characters (4 class features + 1 training feature = 5 total). For higher-level characters, this cap silently blocks adding features beyond 4 non-training features through the composable, even though they should have more.

The validation warnings correctly flag when feature count differs from expected, but the `addFeature()` guard blocks the user before they reach the expected count. The `addEdge()` function does NOT have an equivalent cap, which is the correct behavior (it relies on warnings).

## Affected Files

- `app/composables/useCharacterCreation.ts` (lines 200-202)

## Suggested Fix

Either:
1. Remove the hard cap on `addFeature()` to match `addEdge()` behavior (relying on warnings)
2. Make it level-aware: `getExpectedFeaturesForLevel(form.level) - 1` (subtract 1 for training feature slot)

## Impact

UX friction for higher-level character creation. Does not cause data loss or incorrect validation — warnings still display correctly.

## Resolution Log

### Commit: 38095c7 (branch: slave/4-dev-refactoring-071-070-20260226)

**Files changed:**
- `app/composables/useCharacterCreation.ts`: Removed `MAX_FEATURES` constant and guard clause in `addFeature()`. Added level-aware `expectedFeatures` computed (`getExpectedFeaturesForLevel(level) - 1`). Replaced `MAX_FEATURES` in return with `expectedFeatures`.
- `app/components/create/ClassFeatureSection.vue`: Renamed `maxFeatures` prop to `expectedFeatures`. Removed input/button disable logic that enforced the hard cap. Kept counter display with level-aware expected count.
- `app/pages/gm/create.vue`: Updated prop binding from `:max-features="creation.MAX_FEATURES"` to `:expected-features="creation.expectedFeatures.value"`.

**Approach:** Combined both suggested fixes — removed the hard cap from `addFeature()` to match `addEdge()` behavior (relying on validation warnings), AND made the UI counter level-aware so it shows the correct expected feature count per level.
