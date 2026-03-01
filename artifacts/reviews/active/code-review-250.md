---
review_id: code-review-250
review_type: code
reviewer: senior-reviewer
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
files_reviewed:
  - app/composables/usePathfinding.ts
  - app/composables/useGridMovement.ts
  - app/composables/useGridRendering.ts
  - app/stores/fogOfWar.ts
  - app/tests/unit/composables/usePathfinding.test.ts
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 2
reviewed_at: 2026-03-01T16:15:00Z
follows_up: code-review-245
---

## Review Scope

P1 implementation of feature-013 (Multi-Tile Token System): multi-cell pathfinding, flood-fill movement range, terrain cost aggregation, fog of war reveal, ghost footprint outline, and movement validation integration. 7 commits, 4 production files changed (+212/-46 lines), 1 new test file (+253 lines).

Decrees checked: decree-003 (tokens passable, enemy rough terrain), decree-010 (multi-tag terrain), decree-011 (speed averaging across terrain boundaries). All three are respected by this implementation.

## Issues

### CRITICAL

#### CRIT-1: Movement range call sites do not pass `tokenSize` or `gridBounds` to flood-fill

The `getMovementRangeCells` and `getMovementRangeCellsWithAveraging` functions now accept `tokenSize` and `gridBounds` parameters, but **none of the 5 call sites in production code pass them**. This means the movement range overlay always shows single-cell reachability for all tokens, including Large/Huge/Gigantic.

**Affected call sites:**

1. `app/composables/useGridRendering.ts` line 404 -- `getMovementRangeCellsWithAveraging(...)` missing `tokenSize` and `gridBounds`
2. `app/composables/useGridRendering.ts` line 416 -- `getMovementRangeCells(...)` missing `tokenSize` and `gridBounds`
3. `app/composables/useGridRendering.ts` line 573 -- `getMovementRangeCellsWithAveraging(...)` in `drawExternalMovementPreview` missing `tokenSize` and `gridBounds`
4. `app/composables/useGridRendering.ts` line 581 -- `getMovementRangeCells(...)` in `drawExternalMovementPreview` missing `tokenSize` and `gridBounds`
5. `app/components/vtt/IsometricCanvas.vue` lines 155 and 170 -- both `getMovementRangeCellsWithAveraging` and `getMovementRangeCells` missing `tokenSize` and `gridBounds`

**Impact:** A 2x2 Large Pokemon will show reachable cells that include positions where its footprint overlaps impassable terrain or extends beyond grid bounds. The movement range display will be incorrect for all multi-cell tokens. Meanwhile, `isValidMove` (the actual move validation) correctly passes `tokenSize` to A*, so moves that look valid in the range display may be rejected, causing player confusion.

**Fix:** At each call site, extract `token.size` and pass it as `tokenSize`. For `gridBounds`, pass `{ width: options.config.value.width, height: options.config.value.height }` (grid config is already available at every call site). For `getMovementRangeCellsWithAveraging`, the `tokenSize` parameter comes after `originElevation` and `gridBounds` after that, so the `elevationCostGetter` and `terrainElevGetter` must be passed for the positional args to line up. Where elevation getters are not currently passed (useGridRendering.ts), they should be passed as `undefined`.

### HIGH

#### HIGH-1: `IsometricCanvas.vue` calls `getTerrainCostGetter(selectedId)` without `tokenSize`

`app/components/vtt/IsometricCanvas.vue` line 139 calls `movement.getTerrainCostGetter(selectedId)` without the new `tokenSize` parameter. This means the terrain cost getter returned is the single-cell variant even for multi-cell tokens. The flood-fill then checks terrain per single cell only, missing footprint-wide aggregation.

**Fix:** Extract `token.size` and pass it: `movement.getTerrainCostGetter(selectedId, token.size)`.

#### HIGH-2: `useGridRendering.ts` terrain cost getter is not footprint-aware

In `drawMovementRange()` (line 384-388) and `drawExternalMovementPreview()` (line 554-558), the terrain cost getter is built as:
```typescript
const terrainCostGetter = terrainStore.terrainCount > 0
  ? (options.getTerrainCostForCombatant
    ? (x: number, y: number) => options.getTerrainCostForCombatant!(x, y, token.combatantId)
    : options.getTerrainCostAt)
  : undefined
```

This wraps `getTerrainCostForCombatant` (single-cell). Per the spec Section H, when `tokenSize > 1`, the terrain cost getter should use `getTerrainCostForFootprint` to aggregate terrain cost across the full NxN footprint. The spec's "combined approach" says the terrain cost getter handles terrain aggregation while pathfinding handles blocked-cell and bounds checks.

However, note that `getTerrainCostGetter()` in `useGridMovement.ts` already handles this branching correctly (lines 426-436) -- when `tokenSize > 1`, it returns a footprint-aware closure. The rendering code should either:
1. Use `getTerrainCostGetter(combatantId, tokenSize)` directly (add it to the options interface), or
2. Use `getTerrainCostForFootprint` in the lambda

Option 1 is cleaner and matches the existing pattern in `isValidMove` and `calculateTerrainAwarePathCost`.

**Note:** This issue is somewhat mitigated if `tokenSize` is passed to the flood-fill (CRIT-1 fix), because the flood-fill itself also does footprint-wide terrain checks. But the spec explicitly calls for *both* the terrain getter to be footprint-aware *and* the pathfinding to receive tokenSize. The terrain getter aggregation handles Naturewalk, enemy rough terrain, and capability-specific passability (swim/burrow) at the footprint level, which the pathfinding's raw terrain check does not.

#### HIGH-3: `validateMovement()` in `usePathfinding.ts` not updated for multi-cell tokens

`validateMovement()` (lines 194-237) still checks blocked and terrain at `to.x, to.y` only (single cell) and calls `getMovementRangeCells` without passing `tokenSize` or `gridBounds`. While `validateMovement` may not be directly called for combat movement (that goes through `isValidMove`), it is a public API exposed via `useRangeParser` and tested. Leaving it single-cell-only creates a trap for future callers who expect it to handle multi-cell tokens.

**Fix:** Add `tokenSize` and `gridBounds` optional parameters to `validateMovement`, and forward them to `getMovementRangeCells`. Update the blocked/terrain destination check to iterate over the full footprint.

### MEDIUM

#### MED-1: `revealFootprintArea` is defined but never called

The `revealFootprintArea` action was added to `fogOfWar.ts` per Section I of the spec, but no call site invokes it. The spec says: "The call site (in the page component or composable that handles `tokenMove` events) should use `revealFootprintArea()` with the token's size instead of `revealArea()` with the origin cell only."

Since `revealArea` is currently called nowhere in production code for token movement (grep shows it is only called from `applyTool` internally), the fog reveal for token movement is likely triggered from the page component outside the reviewed files. However, the new action is dead code until it is wired in. This should be connected at the caller that triggers fog reveal on movement, or a follow-up ticket should be filed.

**Recommendation:** If the fog reveal caller is outside P1 scope (e.g., in the page component), file a ticket to wire `revealFootprintArea` into the token movement handler. If it was supposed to be part of P1, this is a missing feature.

#### MED-2: Test file has a skipped/empty test case

`app/tests/unit/composables/usePathfinding.test.ts` lines 109-121: the test "should route 2x2 token around obstacle that blocks footprint" is effectively a no-op. It sets up a blocked cell at (1,1), calls `calculatePathCost`, but then has only comments with "Skip this test" and no assertions. This inflates the test count without providing coverage.

**Fix:** Either implement the test properly with a valid grid configuration (start the 2x2 token at a position where its starting footprint does not overlap the block, e.g., `from: {x: 0, y: 3}` so the footprint is (0,3),(1,3),(0,4),(1,4)), or remove it.

## What Looks Good

1. **Core pathfinding logic is correct.** The footprint loop pattern (`for fx/fy`) with early termination on impassable cells and max-cost aggregation is implemented consistently across all three functions (`calculatePathCost`, `getMovementRangeCells`, `getMovementRangeCellsWithAveraging`). The `break` on impassable + `isPassable` flag pattern is clean.

2. **`getTerrainCostForFootprint` and `getTerrainCostGetter` are well designed.** The closure-based approach in `useGridMovement.ts` (lines 426-436) that branches on `tokenSize > 1` is the right pattern -- it encapsulates footprint awareness so callers don't need to know about it.

3. **`isValidMove` correctly passes `tokenSize` to both the terrain cost getter and A*.** The two places in `isValidMove` (lines 550 and 555-558) where `tokenSize` is threaded through are correct. This means actual move validation works properly for multi-cell tokens.

4. **`calculateTerrainAwarePathCost` correctly retrieves tokenSize.** It looks up the token, extracts `size`, and passes it to both `getTerrainCostGetter` and `calculatePathCost`.

5. **`revealFootprintArea` math is correct.** The Chebyshev distance-to-rectangle calculation using `Math.max(0, footX1 - x, x - footX2)` is the standard clamped distance formula and correctly reveals a Chebyshev-radius area around the full footprint rectangle. Matches the spec exactly.

6. **Ghost footprint outline is well placed.** The dashed rectangle at the hovered cell position, only shown for `token.size > 1` and only when the cell is in range, provides clear visual feedback per Section J.

7. **`gridBounds` implementation is clean.** Optional parameter, when provided checks `nx + size > gridBounds.width` and `ny + size > gridBounds.height`, correctly preventing footprint overflow. Backward compatible when omitted.

8. **Backwards compatibility preserved.** All new parameters default to 1/undefined, so existing 1x1 behavior is unchanged. Tests verify this explicitly.

9. **Commit granularity is good.** Each section (F/G/H/I/J + tests + docs) gets its own commit. Per decree-003, token passability is correctly maintained (empty blocked lists for pathfinding).

10. **Test coverage for the pathfinding core is solid.** 253-line test file covering: 1x1 default, 2x2 basic, footprint blocked, max terrain multiplier, impassable terrain, gridBounds enforcement, backward compatibility. The tests are well-structured with clear helpers.

## Verdict

**CHANGES_REQUIRED**

The core algorithms (A*, flood-fill, terrain cost aggregation, fog reveal) are correctly implemented. However, the critical gap is that the call sites that *display* movement range never pass `tokenSize` or `gridBounds` to the flood-fill functions. This means the movement range overlay is incorrect for all multi-cell tokens even though the move validation is correct, creating a confusing UX where valid-looking moves are rejected and invalid-looking moves succeed.

## Required Changes

| ID | Severity | Description | Files |
|----|----------|-------------|-------|
| CRIT-1 | CRITICAL | Pass `tokenSize` and `gridBounds` to all 5 flood-fill call sites in rendering code | `useGridRendering.ts`, `IsometricCanvas.vue` |
| HIGH-1 | HIGH | Pass `tokenSize` to `getTerrainCostGetter()` in `IsometricCanvas.vue` | `IsometricCanvas.vue` |
| HIGH-2 | HIGH | Use footprint-aware terrain getter in `useGridRendering.ts` (either via `getTerrainCostGetter` with tokenSize or direct footprint lambda) | `useGridRendering.ts` |
| HIGH-3 | HIGH | Update `validateMovement()` to accept and forward `tokenSize`/`gridBounds` | `usePathfinding.ts` |
| MED-1 | MEDIUM | Wire `revealFootprintArea` to actual movement handler, or file follow-up ticket | Page component / ticket |
| MED-2 | MEDIUM | Fix or remove the no-op test case (lines 109-121) | `usePathfinding.test.ts` |
