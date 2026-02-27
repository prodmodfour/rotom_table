---
ticket_id: ptu-rule-062
priority: P2
status: resolved
domain: vtt-grid
matrix_source:
  rule_ids:
    - vtt-grid-R012
    - vtt-grid-R013
  audit_file: matrix/vtt-grid-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Two terrain/movement type gaps: (1) Earth terrain type (requires Burrow to traverse) is absent; Water terrain has `canSwim` hardcoded to false making all water impassable to all entities. (2) Movement capability types are defined in types but speed selection ignores terrain context — all movement uses a single flat speed value regardless of terrain (swim speed for water, burrow speed for earth, etc.).

## Expected Behavior (PTU Rules)

Per PTU Core: different terrain types require different movement capabilities (Swim for Water, Burrow for Earth, Fly to ignore most terrain). Speed should match the appropriate movement type for the terrain being traversed.

## Actual Behavior

Only Overland speed is used. Water is universally impassable. Earth terrain doesn't exist. Flying/Swimming/Burrowing speeds are stored but never selected based on terrain.

## Resolution Log

**Date:** 2026-02-20
**Status:** in-progress (code complete, awaiting review)

### Changes Made

**Gap 1 — Earth terrain:** Earth terrain type already existed in `stores/terrain.ts` (`TERRAIN_COSTS.earth`, `TERRAIN_COLORS.earth`) and `types/spatial.ts` (`TerrainType`). The terrain store's `getMovementCost` and `isPassable` getters already accepted `canBurrow`. The gap was that `useGridMovement.ts` never passed `canBurrow` to the store. Fixed by adding `combatantCanBurrow()` helper and `getTerrainCostForCombatant()` which passes both `canSwim` and `canBurrow` based on the combatant's Pokemon capabilities. Earth terrain is now traversable by Pokemon with Burrow capability.

**Gap 2 — Terrain-aware speed selection:** Added `getTerrainAwareSpeed()` function that returns:
- `capabilities.swim` speed when combatant is on water terrain
- `capabilities.burrow` speed when on earth terrain
- `capabilities.overland` speed for all other terrain

The `getSpeed()` function now checks the terrain at the combatant's current position and selects the appropriate speed. This means a Gyarados (Swim 6, Overland 3) will use Swim speed 6 when on water terrain.

### Verification

All 546 unit tests pass. Earth terrain is now fully wired end-to-end (store already had it, composable now uses it). Speed selection respects terrain context.
