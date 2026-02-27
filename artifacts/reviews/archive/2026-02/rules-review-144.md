---
review_id: rules-review-144
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-002-p2
domain: vtt-grid
commits_reviewed:
  - 9faf0cb
  - 18e0548
  - 5a95152
  - 7600cd1
  - 12ddac5
  - 3d7429c
  - ce2d526
  - e5569c1
  - f889906
mechanics_verified:
  - fog-of-war-3-state
  - terrain-types-and-movement-costs
  - terrain-elevation-rendering
  - measurement-distance-calculation
  - measurement-aoe-shapes
  - ptu-diagonal-movement
  - camera-rotation-projection-correctness
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#Terrain
  - core/07-combat.md#Diagonal-movement
  - core/07-combat.md#Range
reviewed_at: 2026-02-24T18:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Fog of War (3-State System)

- **Rule:** Fog of war is a GM tool, not a PTU mechanic per se. The implementation defines three visibility states: hidden (opaque), explored (dimmed), revealed (clear). This is a standard VTT convention compatible with PTU's visibility rules (Blindness, Total Blindness, Smokescreen effects described in `core/07-combat.md` p.1693-1717).
- **Implementation:** `useIsometricOverlays.ts` renders fog as isometric diamond overlays at elevation 0 (ground plane). Hidden cells get `rgba(10, 10, 15, 0.95)` near-opaque fill; explored cells get `rgba(10, 10, 15, 0.5)` semi-transparent fill. GM preview uses striped pattern for hidden and center dots for explored. The fog store (`fogOfWar.ts`) correctly implements 3-state transitions: hidden/explored/revealed.
- **Status:** CORRECT

The fog is rendered per-column (2D) covering all elevations at a given XY coordinate. This is documented in the comment at line 139 of `useIsometricOverlays.ts`: "Fog is per-column (2D) -- covers all elevations at that XY." For a 3D isometric grid, this means elevated terrain shares fog state with the ground tile below it, which is a reasonable simplification. If a cell is hidden, you cannot see anything at that column regardless of elevation.

### 2. Terrain Types and Movement Costs

- **Rule:** "Slow Terrain... Trainers and their Pokemon treat every square meter as two square meters instead." (`core/07-combat.md` p.465-474). "Blocking Terrain... cannot be Shifted or Targeted through." (p.487-489). "Earth Terrain... You may only Shift through Earth Terrain if you have a Burrow Capability." (p.451-454). "Underwater Terrain... You may not move through Underwater Terrain during battle if you do not have a Swim Capability." (p.456-459). "Rough Terrain... When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." (p.476-485).
- **Implementation:** The terrain store (`terrain.ts`) defines correct costs:
  - `normal`: 1 (correct)
  - `difficult`: 2 (correct -- maps to "Slow Terrain" at 2x cost)
  - `blocking`: Infinity (correct -- impassable)
  - `water`: 2 with swim check (correct -- requires Swim capability, else blocking)
  - `earth`: Infinity with burrow check (correct -- requires Burrow capability, else blocking)
  - `rough`: 1 (correct -- normal movement cost but accuracy penalty)
  - `hazard`: 1 (correct -- normal cost with damage on entry)
  - `elevated`: 1 (correct -- normal cost with height advantage)
- **Status:** CORRECT

The isometric terrain overlay (`useIsometricOverlays.ts:184-225`) reads terrain types via `getTerrainType` and renders them using the same `TERRAIN_COLORS` record from the terrain store. Each terrain type gets its own visual pattern (blocking = X pattern, water = waves, hazard = warning triangle, etc.). The rendering correctly respects terrain elevation by passing the elevation value to `getTileDiamondPoints`.

### 3. Terrain Elevation Rendering (3D Side Faces)

- **Rule:** Elevation is not a core PTU mechanic but is a reasonable VTT extension for representing height differences in encounters. The implementation adds visual depth to elevated terrain.
- **Implementation:** `useIsometricOverlays.ts:231-266` draws side faces for elevated terrain. It creates a "box" effect by drawing the right face and left face between the top diamond (at elevation) and bottom diamond (at ground level). The darkened fill (`rgba(0, 0, 0, 0.2)`) gives visual depth. This is purely cosmetic and does not affect any game calculations.
- **Status:** CORRECT (cosmetic only -- no rule impact)

### 4. Measurement Distance Calculation

- **Rule:** "Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again." (`core/07-combat.md` p.425-428).
- **Implementation:** The measurement store's `distance` getter uses Chebyshev distance: `Math.max(dx, dy)`. This is a pre-existing simplification (the store was created in commit `433fdb0` before P2). The movement system's `calculateMoveDistance` correctly implements the alternating diagonal rule: `diagonalCost = diagonals + Math.floor(diagonals / 2)`. The P2 isometric overlay simply renders the measurement cells and distance values already computed by the existing measurement store -- it does NOT introduce a new distance calculation.
- **Status:** NEEDS REVIEW (pre-existing, not a P2 regression)

**Note:** The measurement store's Chebyshev distance (`Math.max(dx, dy)`) underestimates PTU diagonal distance. Example: moving 3 diagonally should cost 1+2+1 = 4m, but Chebyshev returns 3m. This is a pre-existing issue in the measurement store, NOT introduced by P2. The isometric overlay faithfully renders whatever distance the store provides. Filing as MEDIUM since it affects distance tool display but not actual movement validation (which correctly uses alternating diagonals via A* pathfinding).

### 5. Measurement AoE Shapes (Burst, Cone, Line, Close Blast)

- **Rule:** AoE shapes are defined in PTU: Burst is a radius (Chebyshev square), Cone emanates from origin expanding with distance, Line is a straight path, Close Blast is a square adjacent to the user. (`core/07-combat.md` p.543, p.3061-3067; `core/10-indices-and-reference.md` p.831).
- **Implementation:** The measurement store correctly implements:
  - **Burst** (`getBurstCells`): Uses Chebyshev distance for radius, producing a square area centered on origin. This is correct for PTU burst shapes.
  - **Cone** (`getConeCells`): Emanates from origin, expanding width at each distance step. Supports 8 directions (cardinal + diagonal).
  - **Line** (`getLineCells`): Uses Bresenham's line algorithm with configurable width.
  - **Close Blast** (`getCloseBlastCells`): Square area adjacent to the user in a specified direction.
- **Isometric rendering:** `useIsometricOverlays.ts:400-467` renders all measurement cells as isometric diamond highlights at elevation 0. The origin gets a center dot marker. Distance mode gets a dashed line between start and end with a distance label. All 5 modes use the correct color-coding.
- **Status:** CORRECT

The isometric overlay does not modify the AoE shape calculations -- it only projects the pre-calculated 2D cell lists into isometric diamond overlays. The shape logic remains in the measurement store, which is unchanged by P2.

### 6. PTU Diagonal Movement in Isometric Mode

- **Rule:** "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters." (`core/07-combat.md` p.425-428).
- **Implementation:** The isometric interaction handler (`useIsometricInteraction.ts`) delegates movement validation to `useGridMovement.isValidMove`, which uses A* pathfinding with the correct alternating diagonal rule (implemented in `usePathfinding.ts:100-109`). The isometric mode does NOT introduce a new distance calculation -- it reuses the exact same movement system as the 2D grid.
- **Status:** CORRECT

### 7. Camera Rotation and Projection Correctness

- **Rule:** Camera rotation is purely visual and should not affect game mechanics. Grid coordinates must remain consistent regardless of camera angle.
- **Implementation:** `useIsometricProjection.ts` implements 4 camera angles (0-3) with coordinate rotation. The `screenToWorld` inverse function correctly unrotates coordinates back to grid space. All game logic (movement, fog, terrain, measurement) operates on the original grid coordinates, not rotated screen coordinates. Camera rotation only affects visual rendering order (depth sorting) and screen-space positions.
- **Status:** CORRECT

The depth sorting in `useIsometricRendering.ts:111-123` correctly uses rotated coordinates for painter's algorithm ordering. The fog of war and terrain overlays iterate the same `sortedCells` array, ensuring visual consistency across all overlays.

### 8. R Key for Measurement Direction Cycling

- **Rule:** No PTU rule governs this -- it's a UI convenience for cycling AoE direction (north -> northeast -> east -> ... -> northwest).
- **Implementation:** `useIsometricInteraction.ts:625-629` handles the R key press by calling `measurementStore.cycleDirection()`. The store correctly cycles through all 8 directions in clockwise order.
- **Status:** CORRECT (UI convenience, no rule impact)

### 9. 3D Distance Display in MeasurementToolbar

- **Rule:** PTU does not define explicit 3D distance rules. The implementation adds `chebyshev(dx, dy) + |dz|` as a 3D distance approximation.
- **Implementation:** `VTTContainer.vue:286-303` computes `isometric3dDistance` as `flatDist + elevDelta`. However, the current implementation hardcodes `startZ = 0` and `endZ = 0` (lines 294-297), making the 3D distance always equal to the flat distance. The `isometricElevationDelta` is also hardcoded to 0 (lines 305-311). This means the 3D distance display is currently a no-op stub.
- **Status:** CORRECT (stub implementation -- no incorrect calculations, just not yet enhanced)

## Summary

The P2 isometric overlay implementation is **mechanically sound**. All game logic (movement validation, terrain costs, fog of war states, AoE shapes) is computed by the existing 2D stores and composables, which are **unchanged by P2**. The isometric rendering layer is purely a visual projection of these pre-existing calculations onto diamond-shaped tiles.

Key findings:
1. **No new game logic was introduced** -- P2 only adds rendering code that reads from existing stores.
2. **Terrain types and costs remain correct** per PTU rules.
3. **Fog of war 3-state system** is faithfully rendered in isometric projection.
4. **Measurement shapes** (burst, cone, line, blast) are projected without distortion -- the AoE cell sets are computed in 2D grid space and then visually rendered as diamonds.
5. **Movement system** continues to use the correct alternating diagonal rule via A* pathfinding.

## Rulings

### RULING-1: Measurement Store Distance Uses Chebyshev, Not PTU Alternating Diagonal

**Severity:** MEDIUM (pre-existing, not P2)

The measurement store's `distance` getter (`stores/measurement.ts:35-43`) uses `Math.max(dx, dy)` (Chebyshev distance), which does not match PTU's alternating diagonal rule. Example: 3 diagonal squares should cost 4m (1+2+1), but Chebyshev returns 3m.

This is a **pre-existing issue** from commit `433fdb0` and was NOT introduced by P2. The isometric overlay simply renders the distance value from the store. The movement system (`useGridMovement.calculateMoveDistance`) correctly implements the alternating rule.

**Recommendation:** File a separate ticket to align the measurement store's distance getter with `calculateMoveDistance` from `useGridMovement.ts`. This would make the distance tool display match actual movement costs.

### RULING-2: Terrain Elevation Brush UI Not Wired to Paint Action

**Severity:** MEDIUM (functionality gap)

The `TerrainPainter.vue` component exposes an `elevationLevel` ref (lines 164, 248-251) for the isometric elevation brush UI. However, this elevation value is never passed to the terrain store's `applyTool` method. The store's `applyTool` (line 151-162) calls `setTerrain(x, y, this.paintMode)` without an elevation parameter, defaulting to 0.

The `setTerrain` method (line 128) accepts an optional `elevation` parameter, so the infrastructure exists -- it's just not connected.

This means: the elevation brush slider appears in the UI but has no effect on painted terrain. Terrain is always painted at elevation 0 regardless of the slider value. This is not a PTU rule violation (elevation painting is a VTT feature), but it's a feature gap that may confuse users.

**Recommendation:** Either wire the elevation level to the paint action, or remove the elevation slider from the UI until it's functional. Note that `TerrainPainter.vue` is not currently imported in `VTTContainer.vue`, so this is effectively dead UI code -- but it's still exposed via `defineExpose`.

## Verdict

**APPROVED** -- No critical or high PTU rule violations found. The two MEDIUM issues are either pre-existing (measurement distance formula) or represent a UI feature gap that doesn't affect game mechanics. The P2 implementation correctly projects all existing game mechanics into isometric visual space without introducing distortions or incorrect calculations.
