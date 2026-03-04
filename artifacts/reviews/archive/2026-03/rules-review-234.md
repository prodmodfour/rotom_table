---
review_id: rules-review-234
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-013
domain: vtt-grid
commits_reviewed:
  - 03b34d77
  - 71b581d0
  - fdbfe5ac
  - 6adfe6a8
  - 5431b516
  - 9801a7a5
mechanics_verified:
  - multi-cell-footprint-terrain-cost-aggregation
  - multi-cell-flood-fill-movement-range
  - multi-cell-astar-pathfinding
  - multi-cell-speed-averaging
  - multi-cell-fog-of-war-reveal
  - multi-cell-validate-movement
  - ptu-diagonal-movement-multi-cell
  - no-stacking-multi-cell
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#footprint-size
  - core/07-combat.md#slow-terrain
  - core/07-combat.md#rough-terrain
  - core/07-combat.md#movement-capability-averaging
  - core/07-combat.md#diagonal-movement
reviewed_at: 2026-03-01T19:15:00Z
follows_up: rules-review-226
---

## Mechanics Verified

### 1. Multi-Cell Terrain Cost Aggregation (CRIT-1 Fix)

- **Rule:** "When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead." (`core/07-combat.md` p.231). For multi-cell tokens, the maximum terrain cost across ALL occupied cells applies to each movement step. Per shared-specs.md, the spec calls for a combined approach: pathfinding handles spatial checks (bounds, blocked) while the terrain cost getter handles terrain-specific logic.
- **Previous Issue (CRIT-1 from rules-review-226):** The footprint-aware terrain getter AND the pathfinding both iterated NxN footprints, creating a double-footprint effect (N^2 * N^2 cells checked instead of N^2). Terrain at cells the token does NOT occupy was incorrectly influencing movement cost.
- **Fix (commit 03b34d77):** `getTerrainCostGetter()` in `useGridMovement.ts` (line 439) now ALWAYS returns a single-cell getter (`getTerrainCostForCombatant`), regardless of `tokenSize`. The `_tokenSize` parameter is accepted for API compatibility but ignored. The A* and flood-fill algorithms in `usePathfinding.ts` handle the full NxN footprint iteration at each step (lines 101-117 in flood-fill, lines 402-422 in A*), calling the single-cell getter for each cell in the footprint. This eliminates the double-counting bug.
- **Verification:** For a 2x2 token at origin (3,0): A* checks cells (3,0), (4,0), (3,1), (4,1) and calls `getTerrainCostForCombatant(cellX, cellY, combatantId)` for each. The getter returns the terrain cost for exactly that one cell, including Naturewalk bypass and capability-specific passability (swim/burrow). The max across all 4 cells becomes the step multiplier. No cells outside the actual footprint are checked.
- **Status:** CORRECT. The double-footprint bug is eliminated. The approach chosen (option B from rules-review-226) is clean and consistent: pathfinding owns all footprint iteration, getter owns per-cell capability logic.

### 2. Multi-Cell Flood-Fill Movement Range (HIGH-1 Fix)

- **Rule:** Same footprint passability rule as A*. The movement range overlay must show positions where the token's NxN footprint fits entirely within passable terrain and grid bounds.
- **Previous Issue (HIGH-1 from rules-review-226 / CRIT-1 from code-review-250):** All 5 production call sites for `getMovementRangeCells` and `getMovementRangeCellsWithAveraging` did not pass `tokenSize` or `gridBounds`, causing the flood-fill to treat all tokens as 1x1 for range display.
- **Fix (commit 71b581d0):** All 6 call sites (2 in `useGridRendering.ts:drawMovementRange`, 2 in `useGridRendering.ts:drawExternalMovementPreview`, 2 in `IsometricCanvas.vue:movementRangeCells`) now pass `tokenSize` (extracted from `token.size ?? 1`) and `gridBounds` (from config width/height). Positional arguments for elevation getters are explicitly passed as `undefined` where not available to maintain correct parameter alignment.
- **Verification:** In `drawMovementRange()` (lines 440-441): `const tokenSize = token.size ?? 1; const gridBounds = { width: options.config.value.width, height: options.config.value.height }`. These are passed to both `getMovementRangeCellsWithAveraging` (line 458-459) and `getMovementRangeCells` (line 467). In `IsometricCanvas.vue` (lines 139-140): same extraction, passed to both flood-fill variants (lines 168-169 and 183-184). In `drawExternalMovementPreview()` (line 620): `extGridBounds` with same width/height, passed to both flood-fill calls (lines 633-634 and 642).
- **Status:** CORRECT. All flood-fill call sites now pass tokenSize and gridBounds. The movement range overlay will correctly reflect footprint-aware reachability for Large/Huge/Gigantic tokens.

### 3. Multi-Cell A* Pathfinding

- **Rule:** Per PTU p.231: a token's footprint moves as a unit. All occupied cells must be passable at each step. The terrain cost multiplier is the max across all occupied cells (Slow Terrain doubles cost per cell; if ANY cell is Slow, the whole step costs double).
- **Implementation:** `calculatePathCost()` in `usePathfinding.ts` (lines 279-465) accepts `tokenSize` (default 1). Neighbor exploration (lines 399-422) iterates `fx` 0 to size-1 and `fy` 0 to size-1, checking each footprint cell against `blockedSet` and `getTerrainCost`. Uses `maxTerrainMultiplier` across the footprint. Destination pre-check (lines 293-302) validates the full footprint before A* begins.
- **PTU diagonal rule preserved:** Lines 429-435 apply the alternating 1m/2m diagonal cost based on parity, independent of token size. This is correct -- the diagonal rule applies to the origin cell's movement step, not per-footprint-cell.
- **Status:** CORRECT. Unchanged from previous review; the A* core was already correct. The fix cycle addressed the terrain cost getter and call sites, not the A* itself.

### 4. Multi-Cell Speed Averaging (MED-1 Fix)

- **Rule:** Per PTU p.231 and decree-011: "When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value." For multi-cell tokens, terrain types under ALL footprint cells must be considered, not just the origin.
- **Previous Issue (MED-1 from rules-review-226):** `getAveragedSpeedForPath()` only checked terrain at origin cells along the path, missing terrain types under the rest of the footprint.
- **Fix (commit 6adfe6a8):** `getAveragedSpeedForPath()` in `useGridMovement.ts` (lines 260-271) now looks up the moving token's size and iterates the full NxN footprint at each path position:
  ```typescript
  const tokenSize = movingToken?.size || 1
  for (const pos of path) {
    for (let fx = 0; fx < tokenSize; fx++) {
      for (let fy = 0; fy < tokenSize; fy++) {
        terrainTypes.add(terrainStore.getTerrainAt(pos.x + fx, pos.y + fy))
      }
    }
  }
  ```
- **Verification:** For a 2x2 token traversing a path where the origin cells are all on land but one footprint cell touches water, the `terrainTypes` set will now include both 'normal' and 'water', triggering the speed averaging logic. This correctly averages Overland and Swim speeds per decree-011.
- **Consistency check:** The flood-fill variant `getMovementRangeCellsWithAveraging()` also collects terrain types from all footprint cells (lines 619-624 in usePathfinding.ts). Both path-based and flood-fill-based averaging now use the same footprint-aware terrain type collection.
- **Status:** CORRECT. Speed averaging is now fully footprint-aware in both code paths.

### 5. Multi-Cell Fog of War Reveal (MED-2 Documentation)

- **Rule:** No explicit PTU rule for fog of war. The design spec says large tokens should reveal fog from ALL occupied cells, not just the origin. The `revealFootprintArea()` action uses Chebyshev distance from the nearest footprint cell.
- **Previous Issue (MED-2 from rules-review-226):** `revealFootprintArea()` was defined but not wired to any movement handler.
- **Fix (commit 5431b516):** The action remains unwired, but is now annotated with a detailed NOTE (lines 157-162 in `fogOfWar.ts`) explaining that the caller (encounter-level auto-reveal on movement) requires fog vision radius configuration that is outside P1 multi-tile scope. A follow-up is specified for when fog auto-reveal is implemented.
- **Assessment:** This is an acceptable deferral. The `revealFootprintArea()` algorithm itself is mathematically correct (verified in rules-review-226). The auto-reveal-on-movement feature is not currently active for ANY token size (1x1 included), so this is not a regression from P1. When fog auto-reveal is implemented, it should use `revealFootprintArea()` for multi-cell tokens.
- **Status:** CORRECT (algorithm). DEFERRED (wiring). Not a blocker for P1 approval.

### 6. Multi-Cell validateMovement (HIGH-3 Fix)

- **Rule:** Destination validation must check ALL cells in the NxN footprint for blocked cells, impassable terrain, and grid bounds.
- **Previous Issue (HIGH-3 from code-review-250):** `validateMovement()` only checked `to.x, to.y` (single cell) and did not pass `tokenSize` or `gridBounds` to the flood-fill call.
- **Fix (commit fdbfe5ac):** `validateMovement()` in `usePathfinding.ts` (lines 196-258) now accepts `tokenSize` (default 1) and `gridBounds` parameters. The destination check (lines 211-238) iterates all footprint cells, checking each against grid bounds, blocked set, and terrain cost. The flood-fill call (lines 242-246) forwards `size` and `gridBounds`.
- **Verification:** The bounds check uses `cellX >= gridBounds.width` (exclusive), consistent with the flood-fill's `nx + size > gridBounds.width`. For a 2x2 token at destination (9,0) on a 10x10 grid: cells (9,0) and (9,1) pass bounds check, but cell (10,0) fails `cellX >= gridBounds.width` (10 >= 10). This is correct -- column 10 does not exist on a 10-wide grid.
- **Status:** CORRECT. Full footprint validation at destination, consistent bounds checking, and multi-cell-aware flood-fill call.

### 7. PTU Diagonal Movement for Multi-Cell

- **Rule:** "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again." (`core/07-combat.md` p.231).
- **Implementation:** Both A* (line 429-435) and flood-fill (lines 123-129) use `currentParity` toggling: `baseCost = currentParity === 0 ? 1 : 2; newParity = 1 - currentParity`. Cardinal moves preserve parity. This is independent of token size.
- **Status:** CORRECT. Unchanged by the fix cycle; already verified in rules-review-226.

### 8. No-Stacking Rule for Multi-Cell (decree-003)

- **Rule:** Per decree-003: tokens are passable during movement, but cannot end movement on any occupied square. For multi-cell tokens, ALL destination footprint cells must be unoccupied.
- **Implementation:** `isValidMove()` (lines 536-539) builds `occupiedSet` from `getOccupiedCells(combatantId)` and checks `destCells = getFootprintCells(toPos.x, toPos.y, tokenSize)` against it. Pathfinding uses empty `blockedCells` list (line 551), allowing pass-through.
- **Status:** CORRECT. Unchanged by the fix cycle; already verified in rules-review-226.

### 9. Test Coverage (MED-2 Fix)

- **Previous Issue (MED-2 from code-review-250):** Empty test case with no assertions.
- **Fix (commit 9801a7a5):** The test "should route 2x2 token around obstacle that blocks footprint" now uses valid geometry: 2x2 token from (0,0) to (4,0) with (2,1) blocked. Verifies: (1) 1x1 baseline path costs 4 (straight east), (2) 2x2 detour path costs more than 4, (3) path starts at (0,0) and ends at (4,0).
- **PTU correctness of test:** The blocked cell at (2,1) falls within the 2x2 footprint at origin (2,0) which covers (2,0), (3,0), (2,1), (3,1). The 2x2 token cannot pass through origin (2,0) and must detour, while the 1x1 token is unaffected. The test correctly validates this distinction.
- **Status:** CORRECT. Meaningful assertions that verify multi-cell obstacle routing.

## Issue Resolution Tracking

### From rules-review-226 (previous game logic review)

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| CRIT-1 | CRITICAL | Double-footprint terrain cost bug | RESOLVED by commit 03b34d77. Single-cell getter now used; pathfinding handles footprint iteration. |
| HIGH-1 | HIGH | Movement range not multi-cell aware (call sites missing tokenSize/gridBounds) | RESOLVED by commit 71b581d0. All 6 call sites now pass tokenSize and gridBounds. |
| MED-1 | MEDIUM | getAveragedSpeedForPath missing footprint terrain types | RESOLVED by commit 6adfe6a8. Full NxN footprint iterated at each path position. |
| MED-2 | MEDIUM | revealFootprintArea not wired to movement events | RESOLVED by commit 5431b516 (documented deferral). Auto-reveal not active for any token size; follow-up noted. |

### From code-review-250 (previous code quality review)

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| CRIT-1 | CRITICAL | 5 flood-fill call sites missing tokenSize/gridBounds | RESOLVED by commit 71b581d0. |
| HIGH-1 | HIGH | IsometricCanvas missing tokenSize to getTerrainCostGetter | RESOLVED by commit 03b34d77 (getTerrainCostGetter now ignores tokenSize; always returns single-cell getter). |
| HIGH-2 | HIGH | useGridRendering terrain cost getter not footprint-aware | RESOLVED by combined fix (03b34d77 + 71b581d0). Pathfinding handles footprint iteration; single-cell getter is correct. |
| HIGH-3 | HIGH | validateMovement not updated for multi-cell tokens | RESOLVED by commit fdbfe5ac. Full footprint destination check + tokenSize/gridBounds forwarded. |
| MED-1 | MEDIUM | revealFootprintArea not wired | RESOLVED by commit 5431b516 (documented deferral). |
| MED-2 | MEDIUM | Empty test case (no assertions) | RESOLVED by commit 9801a7a5. Proper 2x2 obstacle routing test. |

## Regression Check

Checked for potential regressions introduced by the fix cycle:

1. **Single-cell tokens unaffected:** `getTerrainCostGetter` always returns single-cell getter (was already the behavior for size=1). Flood-fill functions default `tokenSize=1` and `gridBounds=undefined`, preserving unbounded 1x1 exploration. `validateMovement` defaults `tokenSize=1`. Backwards compatibility tests in the test file verify 1x1 behavior explicitly.

2. **Naturewalk/Swim/Burrow capability checks preserved:** The single-cell getter `getTerrainCostForCombatant` is used by the pathfinding for each footprint cell. This correctly applies combatant-specific capability checks (Naturewalk bypass, swim passability, burrow passability) per-cell within the footprint. No capability-specific logic was lost by removing the footprint-aware getter.

3. **Elevation handling unchanged:** Elevation is still read from the origin cell `(nx, ny)`, not per-footprint-cell. This simplification was ruled acceptable in rules-review-226 and remains unchanged.

4. **getTerrainCostForFootprint still available:** The `getTerrainCostForFootprint` function was not removed, only the `getTerrainCostGetter` branching that returned it. It remains available for any future use case that needs footprint-level cost aggregation outside of pathfinding.

5. **IsometricCanvas.vue terrain getter call:** Line 141 calls `movement.getTerrainCostGetter(selectedId)` without `tokenSize`. Since `getTerrainCostGetter` now ignores `_tokenSize`, this is functionally identical to passing it. No regression.

## Rulings

1. **Single-cell getter + pathfinding footprint iteration is the correct architecture:** The A* and flood-fill iterate the full NxN footprint at each step, calling the single-cell terrain getter for each cell. This ensures that combatant-specific capabilities (Naturewalk, Swim, Burrow) are correctly evaluated per-cell. The alternative (footprint-aware getter + single-cell pathfinding) would have required duplicating capability logic into the getter and was the source of the CRIT-1 double-counting bug. The fix correctly eliminates the source of the bug.

2. **Terrain cost aggregation model (max across footprint) remains CORRECT per PTU:** Per PTU p.231, "every square meter" in Slow Terrain costs double. A multi-cell token entering a step where any footprint cell is Slow pays the doubled cost for the entire step. Using `maxTerrainMultiplier` across footprint cells faithfully implements this rule.

3. **revealFootprintArea deferral is acceptable:** Fog auto-reveal on movement is not currently implemented for any token size. Wiring `revealFootprintArea` requires a vision radius system that is outside P1 scope. The algorithm is correct; only the wiring is deferred.

4. **Per decree-011:** Speed averaging is now correctly footprint-aware in both the A* path analysis (`getAveragedSpeedForPath`) and the flood-fill variant (`getMovementRangeCellsWithAveraging`). Both iterate all NxN cells at each path position to collect terrain types.

5. **Per decree-003 (referenced from rules-review-226):** Token pass-through during pathfinding is correctly maintained (empty `blockedCells`). No-stacking check at destination covers the full footprint. Unchanged by fix cycle.

## Summary

All 4 issues from rules-review-226 (1 CRIT, 1 HIGH, 2 MED) and all 6 issues from code-review-250 (1 CRIT, 3 HIGH, 2 MED) are resolved. The fix cycle chose a clean architectural approach: the terrain cost getter always returns single-cell results, and the pathfinding algorithms own all footprint iteration. This eliminates the double-footprint CRITICAL bug and creates a clear separation of concerns. No regressions were found -- single-cell tokens, capability-specific terrain checks, diagonal movement rules, and elevation handling are all preserved. The test suite now includes a meaningful 2x2 obstacle routing test with proper assertions.

## Verdict

**APPROVED**

All mechanics verified correct. All issues from both previous reviews resolved. No new issues found. No regressions detected. The P1 multi-tile token movement integration is ready for merge.
