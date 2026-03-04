---
review_id: code-review-258
review_type: code
reviewer: senior-reviewer
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
files_reviewed:
  - app/composables/usePathfinding.ts
  - app/composables/useGridMovement.ts
  - app/composables/useGridRendering.ts
  - app/stores/fogOfWar.ts
  - app/components/vtt/IsometricCanvas.vue
  - app/tests/unit/composables/usePathfinding.test.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-01T18:55:00Z
follows_up: code-review-250
---

## Review Scope

Re-review of the feature-013 P1 (Multi-Tile Token System) fix cycle. 6 commits across 6 files (+106/-37 lines). This review verifies that ALL issues raised in code-review-250 (1C/3H/2M) and rules-review-226 (1C/1H/2M) have been resolved without introducing regressions.

Decrees checked: decree-003 (tokens passable, enemy rough terrain), decree-010 (multi-tag terrain), decree-011 (speed averaging across terrain boundaries). All three remain respected.

## Issue Resolution Verification

### code-review-250 CRIT-1: Flood-fill call sites missing tokenSize/gridBounds

**Status: RESOLVED** (commit 71b581d0)

Verified all 5 call sites now pass `tokenSize` and `gridBounds`:

1. `useGridRendering.ts` line 448 -- `getMovementRangeCellsWithAveraging(...)` now receives `tokenSize` and `gridBounds` (lines 459-460)
2. `useGridRendering.ts` line 465 -- `getMovementRangeCells(...)` now receives `tokenSize` and `gridBounds` (line 467)
3. `useGridRendering.ts` line 627 -- `getMovementRangeCellsWithAveraging(...)` in `drawExternalMovementPreview` now receives `tokenSize` and `extGridBounds` (lines 633-634)
4. `useGridRendering.ts` line 640 -- `getMovementRangeCells(...)` in `drawExternalMovementPreview` now receives `tokenSize` and `extGridBounds` (line 643)
5. `IsometricCanvas.vue` lines 157 and 174 -- both `getMovementRangeCellsWithAveraging` and `getMovementRangeCells` now receive `tokenSize` and `gridBounds` (lines 168-169 and 182-183)

The `tokenSize` extraction pattern is consistent: `const tokenSize = token.size ?? 1`. The `gridBounds` construction is consistent: `{ width: options.config.value.width, height: options.config.value.height }`. Positional arguments are correctly ordered with `undefined` placeholders for elevation parameters where not available.

### code-review-250 HIGH-1: IsometricCanvas missing tokenSize to getTerrainCostGetter

**Status: RESOLVED BY DESIGN CHANGE** (commit 03b34d77)

The fix eliminated the need to pass `tokenSize` to `getTerrainCostGetter` entirely. The function signature now accepts `_tokenSize` (underscore-prefixed, ignored) for API compatibility. The getter always returns a single-cell terrain cost function. This is correct because the A* and flood-fill algorithms in `usePathfinding.ts` already iterate the full NxN footprint at each step, calling the single-cell getter for each cell. Per rules-review-226 CRIT-1, the previous approach of both the getter and the pathfinding iterating the footprint caused a double-footprint terrain cost bug. The single-cell approach (option B from rules-review-226) eliminates this entirely.

The comment block at `useGridMovement.ts` lines 430-437 clearly documents this design decision and the reasoning, which is good defensive documentation.

### code-review-250 HIGH-2: useGridRendering terrain cost getter not footprint-aware

**Status: RESOLVED BY DESIGN CHANGE** (commit 03b34d77)

Same fix as HIGH-1 above. Since `getTerrainCostGetter` always returns a single-cell getter now, and the pathfinding handles all footprint iteration, the rendering code's terrain cost getter construction (which was already single-cell) is now the correct pattern. The rendering passes `tokenSize` to the flood-fill functions (per CRIT-1 fix), which handles footprint-aware terrain checking internally.

Verified: `getTerrainCostForCombatant` (the single-cell getter) correctly handles per-cell Naturewalk bypass, swim/burrow passability, and blocking terrain checks. The pathfinding's `maxTerrainMultiplier` aggregation across the footprint correctly picks the worst-case cell, which is the PTU-correct behavior.

### code-review-250 HIGH-3: validateMovement not updated for multi-cell

**Status: RESOLVED** (commit fdbfe5ac)

`validateMovement()` now accepts `tokenSize` (default 1) and `gridBounds` (optional) parameters. Verified changes:

1. Destination check iterates full footprint: `for (let fx = 0; fx < size; fx++) { for (let fy = 0; fy < size; fy++) { ... } }` checking bounds, blocked cells, and terrain at each cell (lines 213-238)
2. Grid bounds check per footprint cell: `if (cellX < 0 || cellY < 0 || cellX >= gridBounds.width || cellY >= gridBounds.height)` (lines 219-222)
3. Blocked check uses Set for O(1) lookup: `const blockedSet = new Set(blockedCells.map(...))` (line 212)
4. Forwards `size` and `gridBounds` to `getMovementRangeCells` (lines 244-245)

The `const size = tokenSize ?? 1` on line 209 is a defensive null-coalesce consistent with other functions. Correct.

### code-review-250 MED-1: revealFootprintArea not wired

**Status: RESOLVED** (commit 5431b516)

The developer added a clear documentation comment to `revealFootprintArea` explaining why it is not yet wired (lines 158-162 in fogOfWar.ts): the caller (encounter-level auto-reveal on movement) requires fog vision radius configuration that is outside the P1 multi-tile scope, with an explicit follow-up note to wire it into the encounter page token move handler when fog-of-war auto-reveal is implemented.

This is an acceptable resolution. The action is correctly implemented and documented. The wiring depends on fog-of-war auto-reveal infrastructure that does not yet exist (no existing call to `revealArea` from token movement handlers in production code -- fog reveal is currently only manual via the GM tool). Filing a ticket or deferring to when the auto-reveal feature is built is the right call.

### code-review-250 MED-2: Empty test case

**Status: RESOLVED** (commit 9801a7a5)

The test "should route 2x2 token around obstacle that blocks footprint" has been completely rewritten with proper assertions. Verified the test logic:

- Setup: from (0,0) to (4,0), blocked cell at (2,1)
- A 1x1 token is unaffected (straight-line cost 4) -- asserted
- A 2x2 token at origin (2,0) would occupy (2,0), (3,0), (2,1), (3,1), hitting the block at (2,1) -- must detour
- Assertions verify: result is not null, cost is greater than 4 (detour penalty), path starts at (0,0) and ends at (4,0)

This is a well-designed test case that demonstrates the core value proposition of multi-cell pathfinding: a larger token must navigate around obstacles that a smaller token can ignore.

### rules-review-226 CRIT-1: Double-footprint terrain cost bug

**Status: RESOLVED** (commit 03b34d77)

The fix followed rules-review-226's recommended option (B): `getTerrainCostGetter` now always returns a single-cell getter. The footprint iteration is handled exclusively by the A* and flood-fill algorithms in `usePathfinding.ts`. Verified:

- `getTerrainCostGetter` (line 439): parameter renamed to `_tokenSize` (unused), no longer branches on `size > 1`
- `getTerrainCostForFootprint` function still exists (lines 408-423) but is no longer called by `getTerrainCostGetter` -- it remains available as a standalone utility if needed elsewhere
- All three pathfinding functions (`calculatePathCost`, `getMovementRangeCells`, `getMovementRangeCellsWithAveraging`) iterate the footprint and call the terrain getter per-cell, taking `Math.max` across all cells

No double-counting is possible with this architecture.

### rules-review-226 HIGH-1: Movement range not multi-cell aware

**Status: RESOLVED** (same as code-review-250 CRIT-1, commit 71b581d0)

All flood-fill call sites now pass `tokenSize` and `gridBounds`. Movement range display is now correct for multi-cell tokens.

### rules-review-226 MED-1: getAveragedSpeedForPath missing footprint terrain types

**Status: RESOLVED** (commit 6adfe6a8)

`getAveragedSpeedForPath` now iterates the full NxN footprint at each path position (lines 262-271 in useGridMovement.ts):

```typescript
const movingToken = options.tokens.value.find(t => t.combatantId === combatantId)
const tokenSize = movingToken?.size || 1
const terrainTypes = new Set<string>()
for (const pos of path) {
  for (let fx = 0; fx < tokenSize; fx++) {
    for (let fy = 0; fy < tokenSize; fy++) {
      terrainTypes.add(terrainStore.getTerrainAt(pos.x + fx, pos.y + fy))
    }
  }
}
```

This correctly matches the pattern in `getMovementRangeCellsWithAveraging` (lines 620-624 in usePathfinding.ts), ensuring consistent terrain type detection between the flood-fill display and the A* move validation. Per decree-011, a 2x2 token straddling land and water will now correctly average Overland and Swim speeds.

### rules-review-226 MED-2: revealFootprintArea not wired

**Status: RESOLVED** (same as code-review-250 MED-1, commit 5431b516)

Documented as deferred with clear follow-up note.

## Regression Check

### Backwards Compatibility

Verified all new parameters have safe defaults:
- `tokenSize: number = 1` everywhere -- 1x1 behavior unchanged
- `gridBounds?: { width: number; height: number }` optional everywhere -- unbounded exploration when omitted
- `_tokenSize?: number` in `getTerrainCostGetter` is ignored -- no behavioral change for any caller

### Cross-Consistency

Verified the `tokenSize` threading is consistent across all movement code paths:

1. **isValidMove** (useGridMovement.ts line 529): extracts `tokenSize` from token, passes to `getTerrainCostGetter`, `calculatePathCost`, and footprint bounds/stacking checks -- CORRECT
2. **calculateTerrainAwarePathCost** (useGridMovement.ts line 480): extracts `tokenSize`, passes to `getTerrainCostGetter` and `calculatePathCost` -- CORRECT
3. **drawMovementRange** (useGridRendering.ts line 441): extracts `tokenSize`, passes to flood-fill -- CORRECT
4. **drawExternalMovementPreview** (useGridRendering.ts line 620): extracts `tokenSize`, passes to flood-fill -- CORRECT
5. **movementRangeCells computed** (IsometricCanvas.vue line 139): extracts `tokenSize`, passes to flood-fill -- CORRECT
6. **getAveragedSpeedForPath** (useGridMovement.ts line 262): extracts `tokenSize` from token, iterates footprint -- CORRECT

### File Sizes

All files within limits: usePathfinding.ts (669), useGridMovement.ts (678), useGridRendering.ts (720), fogOfWar.ts (277), IsometricCanvas.vue (436), test file (259). None exceed 800.

### Decree Compliance

- **decree-003**: Token passability maintained. All pathfinding call sites pass empty blocked lists (`const blockedCells: GridPosition[] = []`). No-stacking checked only at destination via full footprint.
- **decree-010**: Multi-tag terrain system unaffected. The single-cell getter `getTerrainCostForCombatant` correctly reads cell flags (rough, slow) independently.
- **decree-011**: Speed averaging across terrain boundaries works for multi-cell tokens. Both `getMovementRangeCellsWithAveraging` (flood-fill) and `getAveragedSpeedForPath` (A* validation) now iterate full footprints for terrain type detection.

## What Looks Good

1. **Clean elimination of double-footprint bug.** The fix correctly chose option (B) from rules-review-226: single-cell getters with pathfinding-internal footprint iteration. The `_tokenSize` parameter with clear documentation prevents future developers from accidentally re-introducing footprint-aware getters without understanding the double-counting risk.

2. **Consistent tokenSize/gridBounds threading.** Every call site follows the same pattern: extract `token.size ?? 1`, construct `gridBounds` from config, pass both to the pathfinding function. No call site was missed.

3. **validateMovement properly generalized.** The new implementation checks bounds, blocked cells, and terrain at every footprint cell before delegating to flood-fill. The `blockedSet` conversion to Set for O(1) lookup is a good performance pattern.

4. **getAveragedSpeedForPath footprint expansion.** The nested loop pattern matches `getMovementRangeCellsWithAveraging` exactly, ensuring the flood-fill display and the A* validation see the same terrain types. This eliminates the scenario where a 2x2 token straddling terrain boundaries would get different speed calculations from the display vs. validation.

5. **Well-documented deferred work.** The `revealFootprintArea` annotation clearly states WHY it is not wired (missing auto-reveal infrastructure), WHAT needs to happen (wire into encounter page token move handler), and WHEN (when fog-of-war auto-reveal is implemented). This prevents future developers from thinking it was simply forgotten.

6. **Test rewrite is meaningful.** The 2x2 obstacle routing test verifies the key behavioral difference: a 1x1 token passes through at cost 4, while a 2x2 token must detour at higher cost. Both path endpoints are verified. This is not a trivial "passes compilation" test -- it exercises the actual footprint collision logic.

7. **Commit granularity is correct.** Each commit addresses one specific issue from the review: (1) double-footprint fix, (2) flood-fill call sites, (3) validateMovement, (4) speed averaging footprint, (5) documentation, (6) test rewrite. One issue per commit makes bisecting possible.

## Verdict

**APPROVED**

All 10 issues from both code-review-250 (1C/3H/2M) and rules-review-226 (1C/1H/2M) have been verified as resolved. The fixes are correct, consistent, and introduce no regressions. The double-footprint terrain cost bug (the most critical issue) is cleanly eliminated with good defensive documentation. Backwards compatibility is preserved through default parameter values. Decree compliance is maintained.

## Required Changes

None. All issues resolved.
