---
ticket_id: ptu-rule-080
priority: P3
status: in-progress
domain: character-lifecycle
source: code-review-121 (M3)
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

Character creation validation in `validateSkillBackground()` and `validateStatAllocation()` only fires warnings for `level === 1` characters. No validation warnings are shown when creating higher-level characters, even though PTU has different rules for stat allocation at higher levels (additional stat points per level, higher skill rank caps, etc.).

## Expected Behavior

When creating a character at level > 1, the form should provide guidance on:
- Additional stat points available per level (PTU p.434)
- Higher skill rank caps unlocked at levels 2, 6, 12 (Adept, Expert, Master)
- Additional edges and features gained per level

## Actual Behavior

The `level === 1` guard in `characterCreationValidation.ts` causes all validation to silently pass for higher-level characters. No warnings or guidance are shown.

## Affected Files

- `app/utils/characterCreationValidation.ts` — `level === 1` guard on validation functions

## Suggested Fix

P2 scope: Extend validation to handle level > 1 character creation. Calculate expected stat points, skill rank caps, and feature/edge counts based on level. Show informational messages about what's available at the character's level.

## Impact

Medium — higher-level character creation is less common (most campaigns start at level 1), but when used, the lack of validation guidance forces the GM to manually reference the rulebook.

## Resolution Log

### Commits (branch: slave/7-dev-080-20260222-214423)

1. `8257f14` — feat: add level-aware trainer progression helpers to trainerStats
   - `app/constants/trainerStats.ts`: Added `getStatPointsForLevel()`, `getMaxSkillRankForLevel()`, `isSkillRankAboveCap()`, `getExpectedEdgesForLevel()`, `getExpectedFeaturesForLevel()`
   - All formulas verified against PTU Core pp. 19-21 progression table

2. `f3538ba` — feat: extend validateStatAllocation for higher-level characters
   - `app/utils/characterCreationValidation.ts`: Removed `level === 1` guard on stat validation; now calculates expected stat points for any level and warns when allocation differs

3. `11548e6` — feat: extend validateSkillBackground with skill rank cap validation
   - `app/utils/characterCreationValidation.ts`: Added rank cap check (Novice->Adept->Expert->Master by level), warns when skills exceed cap

4. `c67be50` — feat: extend validateEdgesAndFeatures for higher-level characters
   - `app/utils/characterCreationValidation.ts`: Calculates expected edge/feature counts at any level; shows milestone bonus info

5. `4cec809` — feat: make character creation composable and UI level-aware
   - `app/composables/useCharacterCreation.ts`: Level-aware stat point pool, per-stat cap only at Lv1, level-aware skill edge rank cap
   - `app/components/create/StatAllocationSection.vue`: New `level` and `statPointsTotal` props, level-aware disabled state
   - `app/pages/gm/create.vue`: Passes new props to StatAllocationSection

### Files Changed

- `app/constants/trainerStats.ts` — 5 new pure functions for PTU trainer progression
- `app/utils/characterCreationValidation.ts` — All 3 validation functions extended for any level
- `app/composables/useCharacterCreation.ts` — Level-aware stat tracking and skill edge cap
- `app/components/create/StatAllocationSection.vue` — Level-aware UI props
- `app/pages/gm/create.vue` — Passes level-aware props to component
