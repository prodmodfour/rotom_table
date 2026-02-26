---
ticket_id: ptu-rule-097
ticket_type: ptu-rule
priority: P0
status: in-progress
domain: vtt
source: decree-003
affected_files:
  - app/composables/useGridMovement.ts
  - app/composables/useGridRendering.ts
  - app/composables/useMoveCalculation.ts
created_at: 2026-02-26
---

# ptu-rule-097: Make tokens passable; enemy-occupied squares are rough terrain

## Problem

All tokens currently block movement entirely via `getBlockedCells()` in `useGridMovement.ts`. Per decree-003 (literal PTU p.231), enemy-occupied squares should be rough terrain (passable with accuracy penalty), and ally-occupied squares should be freely passable. No stacking allowed (can't end movement on an occupied square).

## Required Changes

1. **useGridMovement.ts**: Remove token-occupied cells from `getBlockedCells()`. Instead, mark enemy-occupied cells as rough terrain for the accuracy penalty system.
2. **usePathfinding.ts**: Update A* to allow pathfinding through occupied squares. Enemy squares should have increased cost (rough terrain). Add validation that the final destination is not occupied.
3. **Movement validation**: Ensure movement end-point is not occupied by any token (no stacking).
4. **Accuracy system**: When targeting through enemy-occupied rough terrain squares, apply -2 accuracy penalty.

## PTU Reference

- p.231: "Squares occupied by enemies always count as Rough Terrain"
- p.231: Rough Terrain: "-2 penalty to Accuracy Rolls" when targeting through

## Acceptance Criteria

- Tokens can move through ally-occupied squares freely
- Tokens can move through enemy-occupied squares (treated as rough terrain)
- Movement cannot end on any occupied square
- Accuracy penalty applied when targeting through enemy-occupied squares
- A* pathfinding routes through occupied squares when beneficial

## Resolution Log

| Commit | Files Changed | Description |
|--------|--------------|-------------|
| 9923a29 | `app/composables/useGridMovement.ts` | `getBlockedCells` returns empty (tokens no longer block). Added `getOccupiedCells` for no-stacking destination check, `getEnemyOccupiedCells` for accuracy penalty. `isValidMove` checks destination occupancy. `calculateTerrainAwarePathCost` passes empty blocked list. |
| 2359162 | `app/composables/useGridRendering.ts` | Movement preview shows 'Occupied' instead of 'Blocked' when hovering occupied cells. |
| d83c7f2 | `app/composables/useMoveCalculation.ts` | Added enemy-occupied rough terrain accuracy penalty. `enemyOccupiedCells` computed, Bresenham line trace via `targetsThroughEnemyRoughTerrain`, `getRoughTerrainPenalty` returns +2 threshold modifier. Integrated into `getAccuracyThreshold`. |
| 98a0d76 | `app/utils/combatSides.ts` | Extract shared `isEnemySide` utility for combat side determination (HIGH-2: DRY). |
| 07fd02a | `app/composables/useMoveCalculation.ts`, `useGridMovement.ts`, `MoveTargetModal.vue` | CRIT-1: `enemyOccupiedCells` now iterates `allCombatants` (grid property, not targeting list). HIGH-2: both composables use shared `isEnemySide`. |
| ee8ca1c | `app/composables/useGridMovement.ts` | HIGH-1: `isValidMove` checks full token footprint (size*size) for no-stacking, not just anchor cell. |
| bac22c3 | `app/composables/useMoveCalculation.ts` | MED-1: `targetsThroughEnemyRoughTerrain` uses `closestCellPair` for multi-cell token LoS endpoints. |
| dd88134 | `useGridMovement.ts`, `useGridRendering.ts`, `useGridInteraction.ts`, `GridCanvas.vue`, `IsometricCanvas.vue` | MED-3: Removed dead `getBlockedCells` function and all callers (always returned []). |
| 4c4c285 | tests | MED-2: Added unit tests for `isEnemySide`, `getOccupiedCells`, `closestCellPair`. |
