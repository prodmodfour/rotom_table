---
ticket_id: ptu-rule-103
ticket_type: ptu-rule
priority: P1
status: in-progress
domain: vtt
topic: mixed-terrain-speed-averaging
source: decree-011
affected_files:
  - app/utils/combatantCapabilities.ts
  - app/composables/usePathfinding.ts
  - app/composables/useRangeParser.ts
  - app/composables/useGridMovement.ts
  - app/composables/useGridRendering.ts
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/IsometricCanvas.vue
created_at: 2026-02-26T18:00:00
---

## Summary

Implement path-based speed averaging when movement crosses terrain boundaries, per PTU p.231.

## PTU Rule

"When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value." (p.231)

## Current Behavior

`useGridMovement.ts:getSpeed()` selects movement speed based on terrain at the combatant's starting position only. No terrain boundary detection or speed averaging.

## Required Behavior

1. Detect which terrain types are traversed along the A* path
2. Identify the applicable movement capability for each terrain type (Overland, Swim, etc.)
3. Average the movement capabilities to determine max movement distance for that turn
4. Example: Overland 7 + Swim 5 = 6 meters maximum when crossing land/water boundary

## Notes

- Movement is always one continuous path per turn (PTU p.227-228 — cannot split movement)
- Related decrees: decree-008 (water terrain cost), decree-010 (multi-tag terrain), decree-011 (this ruling)

## Resolution Log

### Implementation (slave/3-dev-terrain-speed-avg-20260226)

**Approach:** Path-based speed averaging using terrain type detection along A* paths and flood-fill expansion.

1. **`8998549` — combatantCapabilities.ts**: Added `getOverlandSpeed`, `getSwimSpeed`, `getBurrowSpeed`, `getSpeedForTerrain`, and `calculateAveragedSpeed` utility functions. `calculateAveragedSpeed` collects distinct movement capabilities required by terrain types along a path and averages them (floored).

2. **`e8ac904` — usePathfinding.ts**: Modified A* `calculatePathCost` to reconstruct the full path (all intermediate cells) instead of just start+end. Added `closedNodes` map for parent pointer tracking during path reconstruction.

3. **`26964bd` — usePathfinding.ts**: Added `getMovementRangeCellsWithAveraging` — a terrain-type-aware flood-fill that tracks terrain types along each explored path. Uses a `SpeedAveragingFn` callback to constrain exploration: cells are only reachable if their path cost fits within the averaged speed for the terrain types encountered.

4. **`e49685e` — useRangeParser.ts**: Re-exported `getMovementRangeCellsWithAveraging`, `TerrainTypeGetter`, and `SpeedAveragingFn` types for downstream consumers.

5. **`6120220` — useGridMovement.ts**: Core speed averaging integration:
   - `getMaxPossibleSpeed`: Returns max of all applicable speeds (exploration budget for A*/flood-fill)
   - `getAveragedSpeedForPath`: Analyzes terrain types along an A* path and computes averaged speed with modifiers
   - `buildSpeedAveragingFn`: Builds a callback for flood-fill terrain-type-aware expansion
   - `isValidMove`: Now uses path-based averaged speed instead of single-terrain speed selection
   - `getTerrainTypeAt`: Exposes terrain type lookup for rendering

6. **`f8d6f66` — useGridRendering.ts**: Updated `drawMovementRange` and `drawExternalMovementPreview` to use `getMovementRangeCellsWithAveraging` when terrain is present. Added optional `getMaxPossibleSpeed`, `buildSpeedAveragingFn`, `getTerrainTypeAt` to rendering options.

7. **`9a36a0c` — GridCanvas.vue, IsometricCanvas.vue**: Wired new speed averaging functions from movement composable through to rendering. IsometricCanvas uses averaging flood-fill with elevation support.

**Files changed:** 7 files
**Duplicate code path check:** All speed consumers verified — `getSpeed` (badge display), `isValidMove` (path-based averaging), `getMovementRangeCells`/`getMovementRangeCellsWithAveraging` (flood-fill), `calculateTerrainAwarePathCost` (A* with full path). All paths now respect speed averaging when terrain is present.

### Fix Cycle (slave/2-dev-ptu-rule-103-fix-20260227)

Addresses all 4 issues from code-review-187 + rules-review-164 CHANGES_REQUIRED.

1. **`2aaa5e9` — combatantCapabilities.ts** (CRIT-2/M-001): Changed `capabilitySpeeds` from `Set<number>` to `number[]` in `calculateAveragedSpeed`. Replaced `.add()` with `.push()`, `.size` with `.length`. Fixes incorrect averaging when 2+ distinct capabilities share the same speed value (e.g., Overland 6 + Swim 6 + Burrow 3 was (6+3)/2=4 instead of correct (6+6+3)/3=5).

2. **`ef76650` — useGridRendering.ts** (CRIT-1/M-002): Fixed undefined `speed` variable in `drawExternalMovementPreview`. Declared `displaySpeed` before the if/else branch and set it in both branches. Speed badge now uses `displaySpeed` consistently.

3. **`0692024` — useGridMovement.ts** (MED-1): Replaced direct `pokemon.capabilities?.swim`/`burrow` property access in `getMaxPossibleSpeed` with canonical `getSwimSpeed(combatant)`/`getBurrowSpeed(combatant)` utility functions. Added missing imports.

4. **`046d24a` — usePathfinding.ts** (MED-2): Added JSDoc comment to `getMovementRangeCellsWithAveraging` documenting the conservative approximation limitation (flood-fill may under-report reachable cells in edge cases where a higher-cost path yields a higher averaged speed).

**Files changed:** 4 files (combatantCapabilities.ts, useGridRendering.ts, useGridMovement.ts, usePathfinding.ts)
