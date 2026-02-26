---
ticket_id: refactoring-078
category: TEST-STALE
priority: P4
status: in-progress
source: code-review-151 regression check note
created_by: slave-collector (plan-20260224-162105)
created_at: 2026-02-24T17:00:00Z
---

# refactoring-078: Add elevation parameters to validateMovement for unit tests

## Summary

`validateMovement` in `usePathfinding.ts` (lines 171-208) does not accept elevation cost parameters. It is only called from unit tests, not the main application code path (which uses `isValidMove` in `useGridMovement`). This means unit tests cannot validate elevation-aware movement scenarios.

## Affected Files

- `app/composables/usePathfinding.ts` (add optional elevation params to validateMovement signature)
- `app/tests/unit/` (add elevation-aware movement test cases once params are available)

## Suggested Fix

Add optional `getElevationCost`, `getTerrainElevation`, and `fromElev` parameters to `validateMovement`, mirroring `calculatePathCost`'s signature. Update existing unit tests to pass elevation getters for isometric scenarios.

## Impact

- **Code health:** Low — test utility function only
- **Testability:** Enables unit testing of elevation-aware movement validation
- **Extensibility:** None

## Resolution Log

| Commit | Files | Description |
|--------|-------|-------------|
| 5258f2f | `app/composables/usePathfinding.ts`, `app/tests/unit/composables/useRangeParser.test.ts` | Added getElevationCost, getTerrainElevation, fromElevation params to validateMovement; added 6 elevation-aware tests |
