---
ticket_id: refactoring-084
priority: P4
category: EXT-COSMETIC
status: open
source: code-review-174 M1, code-review-175 M1
created_by: slave-collector (plan-20260226-073726)
created_at: 2026-02-26T09:00:00Z
---

## Summary

`app-surface.md` is missing entries for two new files added during session 36 refactoring:

1. `app/composables/useTouchInteraction.ts` — shared touch interaction composable extracted from `useGridInteraction.ts` and `useIsometricInteraction.ts` (refactoring-082). Should be listed under VTT Grid composables.
2. `app/utils/gridDistance.ts` — shared PTU diagonal distance utility extracted from 7 inline implementations (refactoring-080). Should be listed under VTT Grid utilities.

## Affected Files

- `app/tests/e2e/artifacts/app-surface.md`

## Suggested Fix

Add `useTouchInteraction.ts` to the VTT Grid composables list and `gridDistance.ts` to the VTT Grid utilities list in `app-surface.md`.

## Impact

Documentation-only. No runtime behavior affected.
