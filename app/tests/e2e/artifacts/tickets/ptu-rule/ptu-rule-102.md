---
ticket_id: ptu-rule-102
ticket_type: ptu-rule
priority: P1
status: in-progress
domain: vtt
source: decree-009
affected_files:
  - app/composables/useRangeParser.ts
  - app/stores/measurement.ts
created_at: 2026-02-26
---

# ptu-rule-102: Shorten diagonal Line attacks per PTU alternating diagonal rule

## Problem

Diagonal Line attacks currently always step exactly `size` cells. Per decree-009, diagonal lines should be shortened because the alternating diagonal rule (1-2-1) means X meters covers fewer cells diagonally.

## Required Changes

1. When rendering a diagonal Line X, calculate the number of cells as the maximum cells reachable within X meters using alternating diagonal cost.
   - Line 2 diagonal: 1 cell (next cell would cost 2m, totaling 3m > 2m)
   - Line 4 diagonal: 3 cells (1+2+1=4m)
   - Line 6 diagonal: 4 cells (1+2+1+2=6m)
2. Apply this calculation in both `useRangeParser.ts` and `measurement.ts`.
3. Update tests.

## PTU Reference

- p.343-344: "When used diagonally, apply the same rules as for diagonal movement"
- p.231: Alternating diagonal rule (1-2-1)

## Acceptance Criteria

- Diagonal Line X covers the correct reduced number of cells
- Cardinal Line X still covers exactly X cells
- Visual rendering matches the shortened diagonal pattern

## Resolution Log

| Commit | Files Changed | Description |
|--------|--------------|-------------|
| 6d058c4 | `app/composables/useRangeParser.ts`, `app/stores/measurement.ts`, `app/utils/gridDistance.ts` | Added `maxDiagonalCells` utility. Both line implementations use it for diagonal directions. |
| 4c4c285 | `app/tests/unit/composables/useRangeParser.test.ts`, `app/tests/unit/utils/gridDistance.test.ts` | Added unit tests for diagonal line shortening and `maxDiagonalCells`. |
