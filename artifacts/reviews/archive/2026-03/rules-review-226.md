---
review_id: rules-review-226
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-013
domain: vtt-grid
commits_reviewed:
  - afa18df1
  - 1b0d1725
  - c4ce0908
  - 7b38e7a1
  - 5d204dd9
  - 3d97934d
  - e5dac1a7
mechanics_verified:
  - multi-cell-footprint-size-mapping
  - multi-cell-astar-pathfinding
  - multi-cell-flood-fill-movement-range
  - multi-cell-terrain-cost-aggregation
  - multi-cell-fog-of-war-reveal
  - ptu-diagonal-movement-multi-cell
  - speed-averaging-multi-cell
  - no-stacking-multi-cell
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 2
ptu_refs:
  - core/07-combat.md#footprint-size
  - core/07-combat.md#slow-terrain
  - core/07-combat.md#rough-terrain
  - core/07-combat.md#movement-capability-averaging
reviewed_at: 2026-03-01T16:10:00Z
follows_up: rules-review-221
---

## Mechanics Verified

### 1. Multi-Cell Footprint Size Mapping

- **Rule:** "A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4" (`core/07-combat.md` p.231)
- **Implementation:** `sizeCategory.ts` defines `SIZE_FOOTPRINT_MAP` mapping Small/Medium=1, Large=2, Huge=3, Gigantic=4. `sizeToFootprint()` defaults to 1 for unknown sizes. `getFootprintCells()` generates all NxN cells from origin.
- **Status:** CORRECT. Mapping matches PTU exactly.

### 2. Multi-Cell A* Pathfinding (Section F)

- **Rule:** A token occupying NxN cells must have all footprint cells passable at each step along the movement path. Per PTU p.231, the footprint moves as a unit.
- **Implementation:** `calculatePathCost()` in `usePathfinding.ts` accepts `tokenSize` parameter (default 1). For each neighbor exploration, iterates `fx` from 0 to `size-1` and `fy` from 0 to `size-1`, checking blocked cells and terrain cost at `(nx+fx, ny+fy)`. Destination footprint also validated before pathfinding begins (lines 271-281). Uses max terrain multiplier across footprint. PTU diagonal alternating rule correctly preserved.
- **Status:** CORRECT for blocked-cell checks. **INCORRECT for terrain cost when combined with footprint-aware terrain getter** (see CRIT-1).

### 3. Multi-Cell Flood-Fill Movement Range (Section G)

- **Rule:** Same as A* — all footprint cells must be passable at each exploration step.
- **Implementation:** `getMovementRangeCells()` accepts `tokenSize` (default 1) and `gridBounds`. Footprint iteration mirrors A* pattern. Grid bounds check skips positions where `nx + size > gridBounds.width` or `ny + size > gridBounds.height`. Both flood-fill variants (`getMovementRangeCells` and `getMovementRangeCellsWithAveraging`) updated consistently.
- **Status:** CORRECT in isolation. The pathfinding code correctly handles multi-cell footprints. However, **the rendering call sites do not pass tokenSize or gridBounds** (see HIGH-1).

### 4. Multi-Cell Terrain Cost Aggregation (Section H)

- **Rule:** Per PTU p.231: "When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead." For a multi-cell token, if ANY occupied cell is Slow Terrain, the movement cost doubles. Per shared-specs.md: maximum terrain cost across footprint is used.
- **Implementation:** `getTerrainCostForFootprint()` in `useGridMovement.ts` iterates all NxN cells, returns `Infinity` if any cell is impassable, otherwise returns max cost. `getTerrainCostGetter()` returns this footprint-aware closure when `tokenSize > 1`.
- **Status:** The terrain cost function itself is CORRECT. However, when this footprint-aware getter is combined with A* pathfinding that also iterates the footprint, it produces a **double-footprint** bug (see CRIT-1).

### 5. Multi-Cell Fog of War Reveal (Section I)

- **Rule:** No explicit PTU rule for fog of war — this is a VTT feature. The design spec says: "For a token at (x, y) with size s, reveals a Chebyshev-radius area around every cell in the footprint." This is a reasonable extension: a large creature should have visibility from all cells it occupies.
- **Implementation:** `revealFootprintArea()` in `fogOfWar.ts` computes the expanded bounding box `(originX - radius)` to `(originX + size - 1 + radius)`, then for each cell in the box computes Chebyshev distance to the footprint rectangle using `Math.max(0, footX1 - x, x - footX2)` for dx and dy, then `Math.max(dx, dy)` for distance.
- **Status:** CORRECT. The Chebyshev distance-to-rectangle formula is mathematically sound. Tested manually: a 2x2 token at (3,3) with radius 2 correctly reveals cells at distance 2 from the nearest footprint cell, and correctly excludes cells at distance 3+.

### 6. PTU Diagonal Movement for Multi-Cell

- **Rule:** "Diagonals alternate: 1m, 2m, 1m, 2m..." (`core/07-combat.md` p.231). Multi-cell tokens should follow the same diagonal rule based on the origin cell's movement.
- **Implementation:** Both A* and flood-fill use `currentParity` tracking. The diagonal parity toggles per diagonal step: `baseCost = currentParity === 0 ? 1 : 2; newParity = 1 - currentParity`. Cardinal moves preserve parity.
- **Status:** CORRECT. The alternating diagonal rule is properly applied regardless of token size. The heuristic `ptuDiagonalDistance` remains admissible for multi-cell tokens (origin-to-origin lower bound).

### 7. Speed Averaging for Multi-Cell (decree-011)

- **Rule:** Per decree-011 and PTU p.231: "When using multiple different Movement Capabilities in one turn... average the Capabilities and use that value."
- **Implementation:** `getMovementRangeCellsWithAveraging()` collects terrain types from ALL footprint cells at each step (lines 598-603: iterates `fx`/`fy` and adds `getTerrainType(nx + fx, ny + fy)`). `getAveragedSpeedForPath()` only checks origin cells along the path (does NOT iterate footprint).
- **Status:** PARTIALLY CORRECT. The flood-fill averaging correctly includes footprint terrain types. However, `getAveragedSpeedForPath()` in `isValidMove` only checks terrain at origin cells, missing terrain types under the rest of the footprint (see MED-1).

### 8. No-Stacking Rule for Multi-Cell (decree-003)

- **Rule:** Per decree-003: "Cannot end movement on any occupied square." For multi-cell tokens, ALL destination footprint cells must be unoccupied.
- **Implementation:** `isValidMove()` builds `destCells` via `getFootprintCells(toPos.x, toPos.y, tokenSize)` and checks each against `occupiedSet`. Tokens are passable during pathfinding (blockedCells is empty), consistent with decree-003.
- **Status:** CORRECT. Destination stacking check covers full footprint. Pathfinding allows pass-through per decree-003.

## Issues

### CRIT-1: Double-Footprint Terrain Cost Bug in A* and Flood-Fill

**Severity:** CRITICAL

**Location:** `app/composables/useGridMovement.ts` lines 550, 555-558; `app/composables/usePathfinding.ts` lines 378-401

**Description:** When `isValidMove()` calls `calculatePathCost()` for a multi-cell token, it passes BOTH a footprint-aware terrain getter AND `tokenSize`. The A* algorithm iterates footprint cells `(nx+fx, ny+fy)` and calls `getTerrainCost(nx+fx, ny+fy)` for each. But when `tokenSize > 1`, the terrain getter is `getTerrainCostForFootprint(x, y, size, combatantId)`, which ALSO iterates an NxN area starting from `(x, y)`.

This creates a double-footprint: each footprint cell is treated as the origin of another NxN footprint. For a 2x2 token moving to origin (3,0):
- A* checks footprint cell (4,0), calls `getTerrainCostForFootprint(4, 0, 2, id)` which checks (4,0), (5,0), (4,1), (5,1)
- Cell (5,0) and (5,1) are NOT part of the actual 2x2 footprint at (3,0), yet their terrain costs affect the calculation

**Impact:** Incorrect terrain costs for all multi-cell tokens. An impassable cell adjacent to (but outside) the actual footprint can incorrectly block movement. The max terrain multiplier includes costs from cells the token does not occupy.

**Fix:** Either:
- (A) Remove the footprint iteration from A*/flood-fill when using a footprint-aware terrain getter (pass `tokenSize=1` to pathfinding and let the getter handle footprint), OR
- (B) Always use single-cell terrain getters and let the pathfinding handle all footprint iteration (use `getTerrainCostForCombatant` instead of `getTerrainCostForFootprint`, and let A* iterate the footprint for terrain cost too)

Option (B) aligns with the implementation pattern already in the pathfinding code and is simpler. Change `getTerrainCostGetter()` to always return the single-cell getter:
```typescript
const getTerrainCostGetter = (combatantId?: string, _tokenSize?: number): TerrainCostGetter | undefined => {
  if (terrainStore.terrainCount === 0) return undefined
  if (combatantId) {
    return (x: number, y: number) => getTerrainCostForCombatant(x, y, combatantId)
  }
  return getTerrainCostAt
}
```

### HIGH-1: Movement Range Display Not Multi-Cell Aware

**Severity:** HIGH

**Location:** `app/composables/useGridRendering.ts` lines 404-416 (drawMovementRange) and lines 573-581 (drawExternalMovementPreview)

**Description:** The `drawMovementRange()` and `drawExternalMovementPreview()` functions call `getMovementRangeCells()` and `getMovementRangeCellsWithAveraging()` WITHOUT passing `tokenSize` or `gridBounds`. This means:

1. The flood-fill explores as if the token is 1x1, ignoring footprint collisions
2. Cells near grid edges that are unreachable by a large token (footprint extends out of bounds) are incorrectly shown as reachable
3. The terrain cost getter used (`getTerrainCostForCombatant`) is single-cell, not footprint-aware

Additionally, these functions use `options.getTerrainCostForCombatant` (single-cell) instead of a footprint-aware getter.

**Impact:** The movement range overlay for Large/Huge/Gigantic tokens shows incorrect reachable positions. The GM sees positions highlighted as reachable that would fail validation when clicked (because `isValidMove` does use multi-cell A*). This is a visual correctness issue that misrepresents game mechanics.

**Fix:** Pass `token.size` and `{ width: options.config.value.width, height: options.config.value.height }` to both flood-fill calls. Use a footprint-aware terrain getter (but see CRIT-1 — after fixing CRIT-1 with option B, the pathfinding handles footprint iteration, so pass `tokenSize` to both `getMovementRangeCells` and `getMovementRangeCellsWithAveraging`).

### MED-1: Speed Averaging Path Analysis Missing Footprint Terrain Types

**Severity:** MEDIUM

**Location:** `app/composables/useGridMovement.ts` lines 260-264 (`getAveragedSpeedForPath`)

**Description:** Per decree-011, speed averaging must consider ALL terrain types encountered along the path. For multi-cell tokens, the path returned by A* contains origin positions only. `getAveragedSpeedForPath()` collects terrain types only at origin cells:

```typescript
for (const pos of path) {
  terrainTypes.add(terrainStore.getTerrainAt(pos.x, pos.y))
}
```

For a 2x2 token, if the origin cell is on land but one of the other 3 footprint cells is in water, the water terrain type would not be included in the averaging calculation.

**Impact:** A multi-cell token straddling a terrain boundary could get an incorrectly high movement speed because the slower terrain under part of its footprint is not counted.

**Fix:** Iterate the full footprint for each path position:
```typescript
const movingToken = options.tokens.value.find(t => t.combatantId === combatantId)
const tokenSize = movingToken?.size || 1
for (const pos of path) {
  for (let fx = 0; fx < tokenSize; fx++) {
    for (let fy = 0; fy < tokenSize; fy++) {
      terrainTypes.add(terrainStore.getTerrainAt(pos.x + fx, pos.y + fy))
    }
  }
}
```

### MED-2: revealFootprintArea Not Wired to Movement Events

**Severity:** MEDIUM

**Location:** `app/stores/fogOfWar.ts` (action defined but unused)

**Description:** The `revealFootprintArea()` action is correctly implemented in the fog of war store, but no component or composable calls it. The existing `revealArea()` is also not called from any component file (the fog of war reveal on token movement appears to be handled elsewhere, or is not yet implemented). Without wiring, large tokens that move will only reveal fog based on their origin cell (if `revealArea` is used) or not at all.

**Impact:** Large tokens do not benefit from their expanded visibility area. A Gigantic (4x4) token reveals the same area as a Small (1x1) token, which is mechanically inaccurate — a creature occupying 16 cells should see from all of them.

**Fix:** Wire `revealFootprintArea()` into the movement confirmation handler (the call site that triggers after a token move is committed). Use `token.size` for the `size` parameter and the appropriate vision radius for `radius`.

## Summary

The P1 implementation makes correct structural decisions: footprint iteration in pathfinding, grid bounds enforcement, Chebyshev distance-to-rectangle for fog reveal, and terrain type collection across footprints in the averaging flood-fill. The PTU diagonal alternating rule, no-stacking check, and fog reveal algorithm are all mathematically sound.

However, there is a critical integration bug (CRIT-1) where the footprint-aware terrain getter and the pathfinding's own footprint iteration interact to produce a double-footprint effect, checking terrain at cells the token does not actually occupy. This produces wrong terrain costs for every multi-cell token movement validation.

Additionally, the movement range display (HIGH-1) was not updated to pass `tokenSize` or `gridBounds` to the flood-fill, meaning the reachable-cell overlay is incorrect for large tokens.

## Rulings

1. **Terrain cost aggregation model (max across footprint):** CORRECT per PTU. When a Large token straddles normal and slow terrain, the slow terrain (cost 2) applies to the whole step because "every square meter" in slow terrain costs 2. The max-cost model faithfully implements this.

2. **Elevation from origin cell:** ACCEPTABLE simplification. PTU does not address per-cell elevation for large tokens. Using the origin cell elevation is consistent with the P0 review (rules-review-221). If terrain elevation varies within a single NxN area, this is unlikely in practical play.

3. **Footprint-aware fog reveal using Chebyshev distance to rectangle:** CORRECT. No PTU rule governs fog of war, but the geometry is mathematically sound. Chebyshev distance to the nearest footprint cell produces the correct expanded visibility area.

4. **Per decree-003:** Token pass-through is correctly implemented — `blockedCells` is empty for pathfinding, stacking only checked at destination. Verified in both `isValidMove` and `calculateTerrainAwarePathCost`.

5. **Per decree-011:** Speed averaging correctly tracks terrain types across all footprint cells in the flood-fill variant. The A* path-based averaging (MED-1) needs the same footprint expansion.

## Verdict

**CHANGES_REQUIRED**

CRIT-1 must be fixed before approval — it produces incorrect terrain costs for all multi-cell tokens. HIGH-1 should also be fixed as it causes visually misleading movement range display.

## Required Changes

| ID | Severity | Description | File |
|----|----------|-------------|------|
| CRIT-1 | CRITICAL | Fix double-footprint terrain cost bug — pathfinding AND terrain getter both iterate NxN footprint | `useGridMovement.ts` (getTerrainCostGetter) |
| HIGH-1 | HIGH | Pass tokenSize and gridBounds to flood-fill in drawMovementRange and drawExternalMovementPreview | `useGridRendering.ts` |
| MED-1 | MEDIUM | Expand footprint terrain types in getAveragedSpeedForPath | `useGridMovement.ts` |
| MED-2 | MEDIUM | Wire revealFootprintArea to token movement events | Component/composable TBD |
