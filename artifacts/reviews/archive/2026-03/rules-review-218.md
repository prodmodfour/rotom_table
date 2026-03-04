---
review_id: rules-review-216
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-013
domain: vtt-grid
commits_reviewed:
  - 623b9c66
  - 33d111d2
  - 83420817
  - e8e5224b
  - 2dfc531a
mechanics_verified:
  - ptu-size-category-footprints
  - multi-cell-occupation-tracking
  - multi-cell-destination-validation
  - multi-cell-bounds-checking
  - isometric-depth-sorting
  - movement-preview-footprint
  - decree-003-passable-tokens
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#page-231
  - core/05-pokemon.md#size-information
reviewed_at: 2026-03-01T12:00:00Z
follows_up: null
---

## Mechanics Verified

### 1. PTU Size Category Footprints

- **Rule:** "A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4" (`core/07-combat.md#page-231`)
- **Implementation:** `app/utils/sizeCategory.ts` defines `SIZE_FOOTPRINT_MAP` as `{ Small: 1, Medium: 1, Large: 2, Huge: 3, Gigantic: 4 }`. The `sizeToFootprint()` function maps string categories to cell-per-side values, defaulting to 1 for unknown sizes.
- **Server parity check:** Compared against `app/server/services/grid-placement.service.ts:sizeToTokenSize()` which uses a switch statement with identical mappings (Small/Medium=1, Large=2, Huge=3, Gigantic=4, default=1). The client-side utility is a faithful mirror.
- **Status:** CORRECT

The PTU rulebook explicitly lists exactly these five size categories with these footprints. The implementation matches perfectly. The fallback to 1 for unknown/undefined/null sizes is a safe defensive default. No "Tiny" size category exists in PTU 1.05.

### 2. Multi-Cell Occupation Tracking

- **Rule:** Large+ tokens occupy multiple cells on the grid per their footprint size.
- **Implementation:** `app/composables/useGridMovement.ts:getOccupiedCells()` (lines 306-320) iterates `dx = 0..token.size-1` and `dy = 0..token.size-1`, pushing all NxN cells. `getEnemyOccupiedCells()` (lines 334-358) uses the same pattern for enemy-specific cells.
- **Status:** CORRECT

The occupation tracking correctly expands the anchor position (top-left) into all NxN cells. The `getFootprintCells()` utility in `sizeCategory.ts` provides the same pattern as a reusable function.

### 3. Multi-Cell Destination Validation (No-Stacking)

- **Rule:** Per decree-003: "Movement can pass through any occupied square (ally or enemy). Cannot end movement on an occupied square."
- **Implementation:** `app/composables/useGridMovement.ts:isValidMove()` (lines 503-514) checks ALL cells the moving token would occupy at the destination against the occupied set. Uses a nested loop `dx = 0..tokenSize-1, dy = 0..tokenSize-1` and checks each destination cell against `occupiedSet`.
- **Status:** CORRECT (per decree-003)

The implementation correctly prevents a Large (2x2) token from ending on any position where any of its 4 cells overlap with another token's cells. The occupied set itself is built using the same NxN expansion, so a 2x2 token at (3,3) blocks cells (3,3), (4,3), (3,4), (4,4).

### 4. Multi-Cell Bounds Checking

- **Rule:** All cells of a multi-cell token must remain within the grid bounds.
- **Implementation:** Two equivalent implementations exist:
  - `isValidMove()` uses `toPos.x + tokenSize - 1 < gridWidth` (lines 500-501)
  - `isFootprintInBounds()` uses `x + size <= gridWidth` (line 61-63)
- **Equivalence verified:** Both correctly constrain the anchor position to `[0, gridWidth - size]`. For a 4x4 Gigantic token on a 20-wide grid, the maximum x position is 16 (cells 16,17,18,19). Both formulas agree: `16 + 4 - 1 = 19 < 20` and `16 + 4 = 20 <= 20`.
- **Status:** CORRECT

### 5. Isometric Depth Sorting for Multi-Cell Tokens

- **Rule:** Isometric rendering requires painter's algorithm (back-to-front) draw order. Multi-cell tokens should sort by a representative position, not just their anchor.
- **Implementation:** `app/composables/useIsometricRendering.ts:drawTokens()` (lines 469-478) computes depth using the center of the NxN grid: `centerX = token.position.x + (token.size - 1) / 2`. The rotated coordinates `rx + ry + elevation` form the depth key. Tokens are sorted ascending by depth (back-to-front).
- **Status:** CORRECT

For a 1x1 token: center offset is `(1-1)/2 = 0` (anchor itself). For a 2x2 token: center offset is `(2-1)/2 = 0.5` (center of occupied cells). This ensures multi-cell tokens sort at their visual center rather than their top-left corner, preventing z-fighting artifacts where a large token at (3,3) would draw behind tokens at (4,4) when they should overlap.

Note: The depth sort uses `(size-1)/2` while the render function `drawSingleToken()` uses `size/2` for screen position. These serve different purposes: `(size-1)/2` is the center of the NxN cell grid (0-indexed cells), while `size/2` is the center of the NxN area in world coordinates (needed for correct screen projection). Both are mathematically valid for their contexts.

### 6. Movement Preview Footprint Highlight

- **Rule:** When previewing a move for a Large+ token, the destination should show all NxN cells the token would occupy, not just a single cell.
- **Implementation:**
  - **2D grid** (`useGridRendering.ts:drawMovementPreview()`, lines 480-492): Nested loop `dx = 0..tokenSize-1, dy = 0..tokenSize-1` highlights all destination cells. Arrow endpoints use `(tokenSize * cellSize) / 2` for center-of-footprint targeting.
  - **2D external preview** (`drawExternalMovementPreview()`, lines 598-610): Same NxN highlight pattern for WebSocket-received previews.
  - **Isometric** (`useIsometricRendering.ts:drawMovementArrow()`, lines 713-723): Same NxN highlight loop for isometric diamond cells. Arrow from/to positions use `tokenSize / 2` for footprint center.
- **Status:** CORRECT

All three movement preview code paths (2D local, 2D external, isometric) correctly highlight the full NxN footprint at the destination.

### 7. Isometric Token Sprite Scaling

- **Rule:** Multi-cell tokens should visually fill their NxN isometric footprint.
- **Implementation:** `drawSingleToken()` (lines 505-506):
  - `tokenW = cellSize * token.size * 0.9` (90% of NxN width)
  - `tokenH = cellSize * token.size * 1.1` (110% of NxN height, taller for sprite proportions)
  - Screen position uses `token.position.x + token.size / 2` for world-space center
- **Status:** CORRECT

The scaling is proportional to `token.size`, so a 2x2 token gets double the sprite dimensions of a 1x1 token. The 0.9/1.1 multipliers provide visual breathing room while maintaining proportional coverage. The size badge (`token.size > 1` check at line 572) provides a "2x2", "3x3", or "4x4" label for visual identification.

### 8. Decree Compliance

- **decree-003** (All tokens passable; enemy = rough terrain): `useGridMovement.ts:isValidMove()` passes empty `blockedCells` array to pathfinding (line 526), and `drawMovementRange()` in `useGridRendering.ts` passes empty blocked list (line 381) with comment citing decree-003. COMPLIANT.
- **decree-010** (Multi-tag terrain system): Not directly affected by this feature. Terrain system remains untouched. COMPLIANT.
- **decree-011** (Speed averaging across terrain boundaries): Movement validation still uses the terrain-aware path averaging. Multi-cell changes do not alter the speed averaging logic. COMPLIANT.

## Issues

### MEDIUM-1: A* Pathfinding is Single-Cell (Documented as P1 Scope)

The A* pathfinding in `isValidMove()` (line 538, `calculatePathCost()`) calculates path cost from the anchor position only. For a 2x2 token, it does not verify that all 4 cells along the path are free of blocking terrain. A Large token could path through a narrow 1-cell gap in blocking terrain that it physically cannot fit through.

**Example:** A 2x2 token at (2,2) moving to (5,2) where cell (4,3) is blocking terrain. The A* path through (3,2) -> (4,2) -> (5,2) would succeed because the anchor cells are clear, but cell (4,3) is blocking and the token's footprint at position (4,2) includes cell (4,3).

**Severity:** MEDIUM -- This is explicitly documented as P1 scope in the design spec (`spec-p0.md`, line 281: "The A* pathfinding used for cost calculation is still single-cell (addressed in P1)"). It is an intentional limitation of the P0 tier.

**Recommendation:** Ensure P1 multi-cell pathfinding validates all NxN cells at each step. File no additional ticket since this is already tracked in the P1 design spec.

## Summary

The P0 Multi-Tile Token System implementation correctly maps PTU 1.05 size categories to grid footprints. All five categories (Small, Medium, Large, Huge, Gigantic) are accurately mapped. The client-side `sizeCategory.ts` utility is a faithful mirror of the server-side `sizeToTokenSize()` function. Multi-cell occupation tracking, destination validation (no-stacking), and bounds checking are all correct. The isometric renderer properly scales sprites, centers multi-cell tokens, and uses footprint-center depth sorting to avoid z-fighting. Movement preview correctly highlights the full NxN destination footprint in both 2D and isometric modes. All applicable decrees (003, 010, 011) are respected.

The single MEDIUM issue (single-cell A* pathfinding) is a known, documented limitation explicitly deferred to P1. No PTU rule correctness violations were found.

## Rulings

1. **SIZE_FOOTPRINT_MAP is PTU-accurate.** The five-category mapping (Small/Medium=1, Large=2, Huge=3, Gigantic=4) matches PTU Core Chapter 7, page 231 exactly. No size categories are missing from the PTU 1.05 ruleset.

2. **Depth sorting by footprint center is correct for isometric rendering.** Using `(size-1)/2` offset from the anchor position places the sort key at the visual center of the NxN footprint, which produces correct painter's algorithm ordering. The alternative (sorting by maximum depth cell) would also work but could cause tokens to draw too late relative to nearby tokens.

3. **PTU allows non-square shapes for serpentine Pokemon** ("you may choose to use other shapes for Pokemon that have different body shapes such as serpents" -- PTU p.231). The current implementation only supports square NxN footprints. This is acceptable for P0 as the rulebook explicitly frames non-square shapes as optional GM customization, not a mandatory mechanic. If support for non-square footprints is desired in the future, a `decree-need` ticket should be filed.

## Verdict

**APPROVED** -- No critical or high severity issues found. The single medium issue is an intentional P1 deferral, not a bug. The implementation faithfully represents PTU size category mechanics. P1 development can proceed.

## Required Changes

None. All issues are within acceptable scope for P0.
