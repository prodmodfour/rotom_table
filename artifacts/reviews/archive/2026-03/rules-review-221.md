---
review_id: rules-review-221
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-013
domain: vtt-grid
commits_reviewed:
  - c2c906ea
  - 7dab881f
  - 93c8ef2c
  - 3b61cf7e
  - 6fa0a041
  - 623b9c66
  - 33d111d2
  - 83420817
  - e8e5224b
  - 2dfc531a
mechanics_verified:
  - ptu-size-categories
  - multi-cell-footprint-occupation
  - token-passability-decree-003
  - isometric-depth-sorting
  - movement-validation-bounds
  - no-stacking-rule
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#size-footprint
  - core/07-combat.md#movement
  - core/07-combat.md#flanking
reviewed_at: 2026-03-01T14:10:00Z
follows_up: code-review-242
---

## Mechanics Verified

### PTU Size Categories (vtt-grid-R003)

- **Rule:** "A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4" (`core/07-combat.md`, p.231)
- **Implementation:** `app/utils/sizeCategory.ts` defines `SIZE_FOOTPRINT_MAP`: Small=1, Medium=1, Large=2, Huge=3, Gigantic=4. Server-side `grid-placement.service.ts` `sizeToTokenSize()` has the identical mapping. The `SizeCategory` type union matches PTU's five size categories exactly.
- **Status:** CORRECT

The size-to-footprint mapping is consistent between the client utility (`sizeCategory.ts`) and the server-side function (`sizeToTokenSize`). Both default to 1 for unknown/undefined sizes, which is a safe fallback. The errata (`errata-2.md`) contains no corrections to size category rules.

### Multi-Cell Footprint Occupation

- **Rule:** A token of size N occupies an NxN block of cells, with position being the top-left (minimum x, minimum y) cell. (`core/07-combat.md`, p.231)
- **Implementation:** `getFootprintCells()` in `sizeCategory.ts` generates all cells from `(x, y)` to `(x+size-1, y+size-1)` using nested loops. This is used by `getOccupiedCells()` and `getEnemyOccupiedCells()` in `useGridMovement.ts` (lines 312, 344). Server-side `buildOccupiedCellsSet()` and `canFit()` in `grid-placement.service.ts` use equivalent inline loops.
- **Status:** CORRECT

The `getFootprintCells()` function correctly produces all NxN cells. For a 3x3 Huge token at (2, 3), it returns 9 cells: (2,3), (3,3), (4,3), (2,4), (3,4), (4,4), (2,5), (3,5), (4,5). This matches PTU expectations.

### Bounds Validation for Multi-Cell Tokens

- **Rule:** A multi-cell token must have all its cells within the grid. No partial placement.
- **Implementation:** `isFootprintInBounds()` checks `x >= 0 && y >= 0 && x + size <= gridWidth && y + size <= gridHeight`. Used in `isValidMove()` at line 490 of `useGridMovement.ts`. Server-side `canFit()` uses `x + size > gridWidth || y + size > gridHeight`.
- **Status:** CORRECT

The bounds check is mathematically equivalent to the previous inline check (`toPos.x + tokenSize - 1 < gridWidth`), since for integers `a + n - 1 < w` is equivalent to `a + n <= w`. The new utility function is cleaner and reusable.

### No-Stacking Rule (decree-003)

- **Rule:** Per decree-003: "Movement can pass through any occupied square (ally or enemy). Cannot end movement on an occupied square." This implements PTU p.231.
- **Implementation:** `isValidMove()` (line 496-497) uses `getFootprintCells()` to get all destination cells, then checks each against the occupied set using `.some()`. If any destination cell overlaps an occupied cell, the move is invalid with `blocked: true`.
- **Status:** CORRECT

Per decree-003, the no-stacking validation correctly checks ALL cells of the NxN destination footprint. The `getOccupiedCells()` function excludes the moving combatant's own cells (via `excludeCombatantId`), so a token moving within its own footprint area is not self-blocked.

### Token Passability (decree-003)

- **Rule:** Per decree-003: "All tokens are passable" and "Enemy-occupied squares count as rough terrain" (accuracy penalty only, no movement cost).
- **Implementation:** A* pathfinding in `isValidMove()` passes `blockedCells: []` (line 509), meaning no cells are blocked by tokens. `getEnemyOccupiedCells()` (line 340-348) uses `getFootprintCells()` for multi-cell enemy tokens, correctly marking all NxN cells of enemy tokens as rough terrain sources.
- **Status:** CORRECT

### Isometric Depth Sorting Center (CRIT-1 Fix)

- **Rule:** Multi-cell tokens should sort by geometric center for correct isometric draw order (painter's algorithm). A token's geometric center in grid space is `position + size/2` since the footprint spans from `position` to `position + size` in each axis.
- **Implementation:** `drawTokens()` in `useIsometricRendering.ts` (lines 473-474) now uses `token.position.x + token.size / 2` and `token.position.y + token.size / 2`. This matches `drawSingleToken()` (lines 500-501) and `drawMovementArrow()` (lines 694-697), all using `token.size / 2`.
- **Status:** CORRECT

The fix resolves the CRIT-1 inconsistency. For a 2x2 token at (3, 3), the center is now (4.0, 4.0) everywhere -- correct since the footprint spans cells (3,3) through (4,4) with edges at world coordinates (3,3) to (5,5). The depth key `rx + ry` is now computed from the same geometric center used for rendering, eliminating z-fighting between multi-cell and adjacent single-cell tokens.

### NxN Footprint Highlight Bounds Checking (HIGH-1 Fix)

- **Rule:** Grid cells rendered outside grid bounds create visual artifacts and waste draw calls.
- **Implementation:** All three NxN highlight loops now check `cellX >= 0 && cellX < gridW && cellY >= 0 && cellY < gridH` before drawing:
  1. `drawMovementPreview()` in `useGridRendering.ts` (lines 483-485)
  2. `drawExternalMovementPreview()` in `useGridRendering.ts` (lines 607-609)
  3. `drawMovementArrow()` in `useIsometricRendering.ts` (lines 716-718)
- **Status:** CORRECT

This matches the bounds checking pattern already used by `drawMovementRange` and `drawMeasurementOverlay` in the same files, ensuring consistency.

### Per-Cell Elevation in Isometric Highlight (MED-2 Fix)

- **Rule:** When a multi-cell token's footprint spans an elevation boundary, each cell should render at its own terrain elevation.
- **Implementation:** `drawMovementArrow()` in `useIsometricRendering.ts` (lines 719-721) now calls `options.getTerrainElevation(cellX, cellY)` per cell instead of using the anchor point elevation for all cells.
- **Status:** CORRECT

### Utility Wiring (HIGH-2 Fix)

- **Rule:** No dead code -- utilities must be used.
- **Implementation:** `useGridMovement.ts` imports `getFootprintCells` and `isFootprintInBounds` from `sizeCategory.ts` (line 13). Three functions use them: `getOccupiedCells()` (line 312), `getEnemyOccupiedCells()` (line 344), `isValidMove()` (lines 490, 496).
- **Status:** CORRECT

Note: `sizeToFootprint()` remains exported but not imported elsewhere. This is acceptable -- on the client side, `token.size` is already a number (converted server-side by `sizeToTokenSize()`), so the string-to-number converter has no current client consumer. It will be needed if future P1/P2 code needs to convert raw size category strings client-side.

## Decree Compliance

| Decree | Status | Notes |
|--------|--------|-------|
| decree-003 | COMPLIANT | No-stacking checks ALL NxN cells; all tokens passable; enemy rough terrain uses NxN footprint |
| decree-002 | NOT APPLICABLE | PTU alternating diagonal for range -- movement distance calculation unmodified |
| decree-007 | NOT APPLICABLE | Cone width -- AoE unmodified |
| decree-023 | NOT APPLICABLE | Burst uses PTU diagonal -- AoE unmodified |
| decree-024 | NOT APPLICABLE | Diagonal cone diamond -- AoE unmodified |
| decree-025 | NOT APPLICABLE | Rough terrain endpoint exclusion -- AoE unmodified |

No decree violations found.

## Code-Review-242 Fix Verification

| Issue | Severity | Fix Status | Verification |
|-------|----------|------------|--------------|
| CRIT-1: Depth sorting center | CRITICAL | FIXED | `token.size / 2` used consistently in `drawTokens`, `drawSingleToken`, `drawMovementArrow` |
| HIGH-1: Bounds checking | HIGH | FIXED | All 3 NxN loops now check grid bounds per cell |
| HIGH-2: Dead code | HIGH | FIXED | `getFootprintCells` and `isFootprintInBounds` wired into `useGridMovement` (3 call sites) |
| MED-1: app-surface.md | MEDIUM | FIXED | `sizeCategory.ts` added to VTT Grid utilities section with full export list |
| MED-2: Elevation per cell | MEDIUM | FIXED | Per-cell elevation lookup in isometric destination highlight |
| MED-3: Commit message accuracy | MEDIUM | N/A (cosmetic, no action required) | Acknowledged in original review |

All 5 actionable findings from code-review-242 have been addressed correctly.

## Overall Multi-Tile P0 Assessment

The P0 implementation correctly establishes the multi-tile token foundation:

1. **Size category mapping** (sizeCategory.ts): Matches PTU Core p.231 exactly. Five categories, correct NxN footprints.

2. **2D token rendering** (VTTToken.vue): `tokenStyle` uses `cellSize * token.size` for width/height, with percentage-based HP bar and label positioning that scales naturally. No PTU rule issues.

3. **Isometric token rendering** (useIsometricRendering.ts): Depth sorting uses geometric center (`size/2`), sprite scaling uses `cellSize * size`, movement arrow correctly accounts for NxN footprint at both source and destination. Elevation is per-cell for destination highlights.

4. **Cell occupation** (useGridMovement.ts): `getOccupiedCells()` and `getEnemyOccupiedCells()` use `getFootprintCells()` for correct NxN iteration. `isValidMove()` uses `isFootprintInBounds()` for destination bounds and `getFootprintCells()` for no-stacking checks.

5. **Server-side placement** (grid-placement.service.ts): `canFit()`, `buildOccupiedCellsSet()`, `markOccupied()` all correctly iterate NxN. `findPlacementPosition()` adjusts search bounds for token size (`gridHeight - tokenSize + 1`).

6. **Hit testing** (useGridInteraction.ts): `getTokenAtPosition()` checks `position.x` to `position.x + size - 1` for both axes, correctly detecting clicks anywhere within a multi-cell footprint.

No PTU rule violations found. The implementation correctly models PTU size categories and their grid implications.

## Summary

All code-review-242 findings have been resolved. The Multi-Tile Token System P0 correctly implements PTU 1.05 size categories (Small 1x1, Medium 1x1, Large 2x2, Huge 3x3, Gigantic 4x4) with proper multi-cell occupation tracking, bounds validation, depth sorting, and rendering in both 2D and isometric modes. Decree-003 compliance is maintained for no-stacking and token passability.

## Verdict

**APPROVED**

No PTU rule violations. All code-review-242 fixes verified correct. P0 provides a solid foundation for P1 (multi-cell pathfinding, fog of war reveal) and P2 (AoE hit detection against multi-cell targets).

## Required Changes

None.
