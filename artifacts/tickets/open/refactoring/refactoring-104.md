---
ticket_id: refactoring-104
category: EXT-DUPLICATE
priority: P4
severity: LOW
title: "useCharacterCreation.ts has inline rank progression arrays instead of shared constant"
source: code-review-234 + code-review-235 (observation, pre-existing)
created_by: slave-collector (plan-20260301-084803)
created_at: 2026-03-01
---

## Summary

`useCharacterCreation.ts` (lines 289, 321) contains inline `['Pathetic', 'Untrained', ...]` skill rank arrays. The shared constant `RANK_PROGRESSION` now exists in `constants/trainerStats.ts` (extracted during feature-008 fix cycle). The character creation composable should import and use the shared constant instead of maintaining its own copy.

## Affected Files

- `app/composables/useCharacterCreation.ts` — lines 289, 321
- `app/constants/trainerStats.ts` — has `RANK_PROGRESSION` constant

## Suggested Fix

Import `RANK_PROGRESSION` from `~/constants/trainerStats` and replace inline arrays.

## Impact

Low — code hygiene. Prevents drift between the two definitions.
