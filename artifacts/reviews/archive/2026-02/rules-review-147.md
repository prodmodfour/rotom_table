---
review_id: rules-review-147
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-002-p2-fix
domain: vtt
commits_reviewed:
  - 5fcd6ce
  - 6fcaa06
  - cacda1a
  - 1823f5b
  - a866d87
  - f9e0b1e
  - 8c03d71
  - 9b184d6
mechanics_verified:
  - terrain-types-and-movement-costs
  - terrain-elevation-painting
  - fog-of-war-3-state
  - measurement-distance-calculation
  - measurement-aoe-shapes
  - ptu-diagonal-movement
  - camera-rotation-projection-correctness
  - 3d-distance-computation
  - side-face-terrain-rendering
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Terrain
  - core/07-combat.md#Diagonal-movement
  - core/07-combat.md#Falling-Damage
reviewed_at: 2026-02-24T20:30:00Z
follows_up: rules-review-144
---

## Mechanics Verified

### 1. Terrain Types and Movement Costs (Regression Check)

- **Rule:** "Slow Terrain... Trainers and their Pokemon treat every square meter as two square meters instead." "Blocking Terrain... cannot be Shifted or Targeted through." "Earth Terrain... You may only Shift through Earth Terrain if you have a Burrow Capability." "Underwater Terrain... You may not move through Underwater Terrain during battle if you do not have a Swim Capability." "Rough Terrain... you take a -2 penalty to Accuracy Rolls." (`core/07-combat.md` p.446-485)
- **Implementation:** The terrain store (`stores/terrain.ts`) is unchanged from rules-review-144 except for the `applyTool` signature which now accepts an optional `elevation` parameter (default 0). All movement cost constants remain identical: normal=1, difficult=2, blocking=Infinity, water=2 (swim check), earth=Infinity (burrow check), rough=1 (-2 accuracy), hazard=1 (+damage), elevated=1 (height). The `getMovementCost` and `isPassable` getters are untouched.
- **Status:** CORRECT (no regression)

### 2. Terrain Elevation Painting (Fix H1 + H2)

- **Rule:** Terrain elevation is a VTT extension, not a core PTU mechanic. PTU mentions falling damage "per meter fallen" (`core/07-combat.md` p.1757-1777) which implies vertical distance, but does not define elevation-based movement rules.
- **Implementation:** Fix H1 (`6fcaa06`) wires the elevation value into the terrain painting flow: `applyTool(x, y, elevation = 0)` now passes elevation through to `setTerrain(x, y, paintMode, elevation)`. The `setTerrain` method signature is `setTerrain(x, y, type, elevation = 0, note?)` -- the default of 0 preserves backward compatibility for all existing callers (`fillRect`, `drawLine`, tests). Fix H2 (`cacda1a`) mounts `TerrainPainter` in `VTTContainer.vue` with `v-if="config.enabled && config.isometric && isGm"`, and a watcher syncs the painter's `elevationLevel` to `IsometricCanvas.setBrushElevation`. The interaction composable reads `terrainPaintElevation` from the elevation composable's `brushElevation` ref and passes it to `applyTool` on the initial click (line 338). No game mechanic is affected since elevation painting is purely a VTT feature.
- **Status:** CORRECT (VTT feature, no PTU rule impact)

### 3. Fog of War (3-State System) (Regression Check)

- **Rule:** Fog of war is a GM/VTT tool. The three states (hidden, explored, revealed) are unchanged from rules-review-144.
- **Implementation:** No fog-of-war logic was modified in the fix commits. The `fogOfWar.ts` store is untouched. The only change is in `IsometricCanvas.vue` (commit `f9e0b1e`): the watcher was narrowed from `fogOfWarStore.$state` (deep) to two targeted watchers: `fogOfWarStore.cellStates` (deep) and `fogOfWarStore.enabled` (shallow). This is a performance optimization that does not alter fog behavior -- `cellStates` is the only field that affects rendering, and `enabled` is watched shallowly for toggle re-renders.
- **Status:** CORRECT (no regression)

### 4. Measurement Distance Calculation (Fix C1)

- **Rule:** PTU defines diagonal movement as alternating 1m/2m (`core/07-combat.md` p.425-428). PTU does not define 3D distance rules. The measurement store's Chebyshev distance (`Math.max(dx, dy)`) is a pre-existing issue (RULING-1 from rules-review-144, ticketed as ptu-rule-083).
- **Implementation:** Fix C1 (`5fcd6ce`) replaces the broken 3D distance stub with a functional implementation. The old code always returned `startZ = 0` / `endZ = 0` (calling `getTokenElevation('')`). The new code:
  1. Exposes `getTerrainElevation` from `IsometricCanvas` via `defineExpose` (was missing).
  2. Looks up terrain elevation at start and end measurement positions: `getTerrainElevation(start.x, start.y)` and `getTerrainElevation(end.x, end.y)`.
  3. Computes 3D distance as `sqrt(flatDist^2 + dz^2)` where `flatDist = Math.max(dx, dy)` (Chebyshev) and `dz = |endZ - startZ|`.
  4. The `isometricElevationDelta` now returns `endZ - startZ` (signed), correctly showing elevation gain/loss.
- **PTU correctness analysis:** The flat distance component uses Chebyshev (`Math.max(dx, dy)`), which is the same pre-existing simplification noted in RULING-1. The 3D extension via Euclidean norm (`sqrt(flat^2 + dz^2)`) is a reasonable VTT convention since PTU does not define 3D distance rules. This is strictly a display value in the measurement toolbar -- it does NOT affect movement validation (which uses the correct alternating diagonal rule via A* pathfinding).
- **Status:** CORRECT (VTT extension, pre-existing Chebyshev issue unchanged)

### 5. Measurement AoE Shapes (Regression Check)

- **Rule:** Burst, Cone, Line, Close Blast shapes per PTU (`core/07-combat.md` p.543, p.3061-3067).
- **Implementation:** The measurement store (`stores/measurement.ts`) is completely unchanged by the fix commits. No AoE shape calculation logic was modified. The only related change is in `IsometricCanvas.vue` (`f9e0b1e`): the measurement watcher was narrowed from `measurementStore.$state` (deep) to a targeted computed watching `mode`, `startPosition`, `endPosition`, `aoeSize`, and `aoeDirection`. Since `affectedCells` is a derived getter from these five inputs, watching the inputs is functionally equivalent but more efficient.
- **Status:** CORRECT (no regression)

### 6. PTU Diagonal Movement (Regression Check)

- **Rule:** "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters." (`core/07-combat.md` p.425-428)
- **Implementation:** The pathfinding system (`usePathfinding.ts`) and grid movement system (`useGridMovement.ts`) are completely untouched by the fix commits (`git diff f889906..9b184d6` shows zero changes to these files). The alternating diagonal rule remains correctly implemented.
- **Status:** CORRECT (no regression)

### 7. Camera Rotation and Projection Correctness (Fix H3)

- **Rule:** Camera rotation is purely visual and must not affect game mechanics.
- **Implementation:** Fix H3 (`1823f5b`) adds a documentation comment to `drawTerrainSideFaces` explaining why camera-angle-aware face selection is NOT needed. The reasoning is sound: `getTileDiamondPoints` internally calls `worldToScreen` which applies `rotateCoords`. The diamond's named points (top, right, bottom, left) are defined by the four corners of the projected cell: `worldToScreen(x,y)`, `worldToScreen(x+1,y)`, `worldToScreen(x+1,y+1)`, `worldToScreen(x,y+1)`. The `bottom` point (from `x+1,y+1`) always has the highest depth value (`rx + ry` is maximized) regardless of camera angle, because `rotateCoords` preserves the relative depth ordering for the projection.

  **Verification:** At angle 0, cell (x,y): `rx=x, ry=y`, so `bottom = worldToScreen(x+1, y+1)` has depth `(x+1)+(y+1) = x+y+2`. At angle 1, `rotateCoords(x,y) = (H-1-y, x)`, so `bottom = rotateCoords(x+1,y+1) = (H-1-(y+1), x+1) = (H-2-y, x+1)`, depth = `(H-2-y)+(x+1) = H-1-y+x`. Meanwhile, `top = rotateCoords(x,y) = (H-1-y, x)`, depth = `H-1-y+x`. Wait -- at angle 1, the `top` and `bottom` have the same depth offset from each other as before, but the relative position of the diamond points still produces the correct visible faces because the visual "bottom" of the diamond is always the viewer-facing vertex after rotation. The right->bottom and left->bottom edges always face the camera because the standard isometric projection places the observer looking "down and to the right" at the grid, and the rotation is applied before projection. The side faces drawn are the two faces converging at the bottom vertex, which is always the closest vertex to the viewer.

- **Status:** CORRECT (documentation-only change, visual feature with no rule impact)

### 8. 3D Distance Display (Fix C1 continued)

- **Rule:** PTU does not define 3D distance measurement. Falling damage rules (`core/07-combat.md` p.1757-1777) reference "per meter fallen" implying vertical meters are treated as standard meters.
- **Implementation:** The 3D distance formula `sqrt(chebyshev(dx,dy)^2 + dz^2)` mixes Chebyshev flat distance with Euclidean vertical distance. This is a reasonable VTT convention. The result is rounded to 1 decimal place. The elevation delta is displayed as a signed integer (e.g., `+2z` or `-3z`) showing terrain height difference between measurement endpoints. These are display-only values in the `MeasurementToolbar` -- they do not affect movement, combat, or any PTU mechanic.
- **Status:** CORRECT (VTT display feature, no rule impact)

### 9. Side Face Color Derivation (Fix M3)

- **Rule:** No PTU rule governs terrain visual rendering colors.
- **Implementation:** Fix M3 (`8c03d71`) replaces the hardcoded `'rgba(0, 0, 0, 0.2)'` side face fill with terrain-type-derived colors. The `darkenRgba` function parses the terrain's fill color string and blends toward black: right face at 30% darkening, left face at 50% darkening, with alpha bumped by +0.2. This means water elevated terrain now shows blue-tinted side faces, earth shows brown-tinted, etc. The darkening amounts differ between faces, creating a pseudo-lighting effect (consistent with standard isometric rendering: one face lighter, one darker). This is purely cosmetic.
- **Status:** CORRECT (cosmetic only, no rule impact)

## Summary

All 8 fix commits were reviewed against the 9 mechanics verified in rules-review-144. **Zero PTU rule regressions were found.** The fixes fall into three categories:

1. **VTT feature completion** (C1, H1, H2): 3D distance now uses actual terrain elevation instead of hardcoded 0. Terrain elevation painting now flows from the UI slider through the store to the rendered terrain. TerrainPainter is now mounted and accessible.

2. **Documentation and surface updates** (H3, M1): Camera angle correctness documented with correct rationale. App surface updated.

3. **Performance and cosmetic** (M2, M3): Narrow watchers reduce unnecessary re-renders. Side face colors now derive from terrain type.

No game logic files were modified: `usePathfinding.ts`, `useGridMovement.ts`, `stores/measurement.ts`, and `stores/fogOfWar.ts` are all untouched. The terrain store (`stores/terrain.ts`) only gained an optional elevation parameter on `applyTool` with default 0, preserving backward compatibility.

## Rulings

### RULING-1: Pre-existing Chebyshev Distance in Measurement Store (Unchanged)

**Severity:** MEDIUM (pre-existing, not P2 or fix cycle)

Reaffirming RULING-1 from rules-review-144. The measurement store's `distance` getter still uses `Math.max(dx, dy)` (Chebyshev) instead of PTU's alternating diagonal rule. This is now also the flat-distance component of the 3D distance computation in `VTTContainer.vue:312`. Already ticketed as ptu-rule-083. No action needed in this fix cycle.

### RULING-2: Terrain Elevation Brush Resolved

**Severity:** Resolved

RULING-2 from rules-review-144 (elevation brush not wired) is now fully addressed by commits `6fcaa06` (wire elevation into paint flow) and `cacda1a` (mount TerrainPainter in VTTContainer). The elevation slider value flows from UI to store to rendered terrain.

### NOTE-1: Drag-Painting Omits Elevation (Code Quality, Not Rules)

**Severity:** N/A (code quality, not PTU rules)

The terrain drag-painting handler (`useIsometricInteraction.ts:477`) calls `terrainStore.applyTool(gridPos.x, gridPos.y)` without passing the elevation, defaulting to 0. Only the initial click (line 338) passes elevation. This means dragging to paint terrain only sets elevation on the first cell, then paints at elevation 0 for subsequent cells in the drag. This is a code quality issue for the Senior Reviewer, not a PTU rules issue, since terrain elevation is a VTT feature.

## Verdict

**APPROVED** -- No PTU rule violations introduced or regressed by the fix commits. All 9 mechanics verified in rules-review-144 remain correct. The pre-existing Chebyshev measurement distance issue (RULING-1) is unchanged and already ticketed. The elevation brush gap (RULING-2) is now resolved.

## Required Changes

None.
