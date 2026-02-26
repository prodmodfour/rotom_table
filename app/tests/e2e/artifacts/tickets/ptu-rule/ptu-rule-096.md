---
ticket_id: ptu-rule-096
ticket_type: ptu-rule
priority: P0
status: in-progress
domain: vtt
source: decree-002
affected_files:
  - app/composables/useRangeParser.ts
  - app/utils/gridDistance.ts
created_at: 2026-02-26
---

# ptu-rule-096: Switch range measurement to PTU alternating diagonal

## Problem

Ranged attack distance currently uses Chebyshev distance (`Math.max(gapX, gapY)`) via `chebyshevDistanceTokens()`, while movement uses PTU's alternating diagonal rule (1-2-1) via `ptuDiagonalDistance()`. Per decree-002, all grid distances should use the PTU diagonal rule consistently.

## Required Changes

1. Replace Chebyshev distance calls in `useRangeParser.ts` with `ptuDiagonalDistance()` from `gridDistance.ts`
2. Verify all range-checking code paths (attack range validation, measurement tool display) use the same metric
3. Update any tests that assert Chebyshev distances

## PTU Reference

- p.231: Diagonal movement rule (alternating 1-2-1)
- p.344: "Ranged X — hits one target within X meters"

## Acceptance Criteria

- All ranged attack distance checks use `ptuDiagonalDistance()`
- Measurement tool displays PTU diagonal distances
- No Chebyshev distance usage remains for gameplay measurements

## Resolution Log

| Commit | Files Changed | Description |
|--------|--------------|-------------|
| 1b3b1a3 | `app/composables/useRangeParser.ts`, `app/utils/gridDistance.ts`, `app/stores/measurement.ts` | Replaced Chebyshev distance with PTU alternating diagonal in range measurement, token distance, and measurement store. |
| 4c4c285 | `app/tests/unit/utils/gridDistance.test.ts`, `app/tests/unit/composables/useRangeParser.test.ts` | Added unit tests for `ptuDiagonalDistance`, `maxDiagonalCells`, PTU diagonal range checks. |
