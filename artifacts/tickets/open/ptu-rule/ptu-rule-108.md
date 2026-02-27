---
ticket_id: ptu-rule-108
ticket_type: ptu-rule
priority: P2
status: open
domain: vtt-grid
topic: static-rough-terrain-accuracy-penalty
source: rules-review-160 M2 + rules-review-162 M1
created_by: slave-collector (plan-20260226-190737)
created_at: 2026-02-26T21:00:00
affected_files:
  - app/composables/useMoveCalculation.ts
  - app/stores/terrain.ts
---

## Summary

Targeting through rough terrain cells (painted via TerrainPainter) does not apply the -2 accuracy penalty. Only enemy-occupied squares trigger the penalty.

## PTU Rule

"When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." (p.231, lines 476-485)

This applies to ALL rough terrain, including static terrain cells painted on the grid, not just enemy-occupied squares.

## Current Behavior

`getRoughTerrainPenalty()` in `useMoveCalculation.ts` only checks `enemyOccupiedCells`. It does not consult `terrainStore.isRoughAt()` for cells along the Bresenham line-of-fire trace.

## Required Behavior

The Bresenham line trace in `targetsThroughEnemyRoughTerrain` should also check `terrainStore.isRoughAt(x, y)` for each intermediate cell. If ANY intermediate cell is rough terrain (either enemy-occupied or terrain-store rough), the -2 penalty applies.

## Notes

- The terrain store already exposes `isRoughAt()` (from the multi-tag refactoring)
- The Bresenham trace infrastructure already exists — just needs to also check terrain flags
- Pre-existing gap, not a regression. Tracked as R015 in VTT grid matrix.
