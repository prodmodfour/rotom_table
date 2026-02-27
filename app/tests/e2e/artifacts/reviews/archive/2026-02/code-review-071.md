---
review_id: code-review-071
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-018
domain: vtt-grid
commits_reviewed:
  - 72d383c
files_reviewed:
  - app/composables/useRangeParser.ts
verdict: APPROVED WITH NOTES
issues_found:
  critical: 0
  high: 1
  medium: 2
scenarios_to_rerun: []
reviewed_at: 2026-02-20T16:00:00Z
---

## Review Scope

Review of bug-018 fix (commit `72d383c`): adding line-of-sight checking for blocking terrain to `useRangeParser.ts`. The fix adds `hasLineOfSight()` using Bresenham's line algorithm and integrates it into `isInRange()` via an optional `isBlockingFn` parameter.

**Diff stats:** 1 file, +80/-4 lines.

## Issues

### HIGH-1: Bresenham's algorithm traces a single 1-pixel-wide path -- LoS can be circumvented by diagonal gaps

**File:** `app/composables/useRangeParser.ts:254-285`

Standard Bresenham's line algorithm traces a single rasterized path from cell to cell. When tracing diagonally (e.g., from (0,0) to (3,3)), the algorithm steps through one cell per iteration. It does NOT check both neighbors when crossing a diagonal boundary. This means a blocker at (1,1) will correctly block, but two blockers placed at (1,0) and (0,1) -- forming a diagonal wall -- may NOT block because the algorithm steps from (0,0) directly to (1,1) without visiting either wall cell.

This is a known limitation of single-line Bresenham for LoS in grid-based games. Many TTRPG VTTs use either:
- **Supercover line** (visits ALL cells the line passes through, including both sides of diagonal crossings)
- **Symmetric LoS** (if A can see B, B can see A -- Bresenham does not guarantee this for all positions)

**Impact:** In practice, blocking terrain arranged diagonally (e.g., a zigzag wall) can have "gaps" that allow LoS through when it should not. This is an edge case but will surprise GMs who place diagonal walls.

**Recommendation:** This is acceptable for a P2 fix given the straightforward Bresenham implementation is correct for axis-aligned and most diagonal walls. File a follow-up ticket to investigate supercover line or symmetric LoS if diagonal wall gaps become a reported issue. Do NOT block this fix on it.

### MEDIUM-1: `hasLineOfSight` is exported but has zero callers outside `isInRange`

**File:** `app/composables/useRangeParser.ts:765`

`hasLineOfSight` is exposed in the return object. Currently, no component, composable, or store calls it directly -- only `isInRange()` calls it internally. Exporting it is fine for testability and future use, but the existing unit tests (`app/tests/unit/composables/useRangeParser.test.ts`) do not destructure or test it.

**Fix:** Add unit tests for `hasLineOfSight` directly. The test file at line 5 destructures `{ parseRange, isInRange, validateMovement, getMovementRangeCells }` -- it needs updating to include `hasLineOfSight` and test:
1. Same cell returns `true`
2. Adjacent cells (no intermediate) returns `true` even if `isBlockingFn` always returns `true`
3. Straight-line with blocker in middle returns `false`
4. Diagonal with blocker in middle returns `false`
5. Blocker at origin or destination does NOT block (only intermediate cells checked)

### MEDIUM-2: `isBlockingFn` is not wired into any caller yet -- the fix is dormant

**File:** `app/composables/useRangeParser.ts:305` (the `isBlockingFn?` parameter)

The `isInRange` signature now accepts `isBlockingFn`, but grep across the entire `app/` directory shows zero callers passing this argument. The only callers of `isInRange` are in the test file, and they all use the old 3-argument signature.

The ticket's "Remaining Work" section correctly notes this: "Wire `isBlockingFn` from terrain store into callers of `isInRange()`". This is acknowledged but worth flagging explicitly: **the bug is not user-facing fixed yet**. The plumbing exists but the terrain store's `isPassable` getter (or a dedicated `isBlocking` check) needs to be passed through from `useGridInteraction.ts` or wherever targeting decisions are made.

**Fix:** Ensure the wiring ticket exists and is tracked. The terrain store already has `isPassable` at `stores/terrain.ts:85` and `TERRAIN_COSTS` with `blocking: Infinity` at line 20. A simple `isBlockingFn` could be: `(x, y) => terrainStore.getTerrainCost(x, y) === Infinity`.

## Algorithm Verification

### Bresenham's Line Implementation -- CORRECT

Walking through the algorithm at lines 254-285:

1. **Initialization:** `x0, y0` start at `from`, `x1, y1` are `to`. `dx = |x1-x0|`, `dy = |y1-y0|`, `sx/sy` are step directions (+1 or -1). `err = dx - dy` -- standard Bresenham error term.

2. **Loop:** The while-true loop visits cells along the line. On each iteration:
   - Check if current cell is intermediate (not origin, not destination) -- if so, test blocking.
   - If we've reached destination, break.
   - Update error and step in x/y as appropriate.

3. **Correctness:** The `e2 = 2 * err` check with `e2 > -dy` and `e2 < dx` is the standard Bresenham step. Both x and y can update in a single iteration for diagonal steps. This is correct.

4. **Termination:** The loop terminates when `x0 === x1 && y0 === y1`, which is guaranteed because each step brings at least one coordinate closer to the target.

### Edge Cases

| Case | Expected | Actual | Pass? |
|---|---|---|---|
| Same cell (from === to) | `true` (early return) | `true` (line 252) | Yes |
| Adjacent cells (distance 1) | `true` (no intermediate) | `true` (loop runs 2 iterations: origin skip, destination break) | Yes |
| Self-targeting | `true` (early return) | `true` | Yes |
| Blocker at origin cell | Not blocked | Correct (line 268 skips origin) | Yes |
| Blocker at destination cell | Not blocked | Correct (line 268 skips destination) | Yes |

### Backward Compatibility -- VERIFIED

The `isBlockingFn` parameter is optional (`isBlockingFn?: (x: number, y: number) => boolean`). All existing callers pass 3 arguments (attacker, target, parsedRange) and will not be affected. The `if (isBlockingFn)` guard at lines 340 and 357 prevents any LoS check when the parameter is omitted.

Existing unit tests (13 `isInRange` tests at `useRangeParser.test.ts:85-131`) all use the 3-argument form. They will continue to pass unchanged.

## Cardinally-Adjacent LoS Check -- GOOD

Lines 340-342: Even for cardinally adjacent cells (distance 1), LoS is checked when `isBlockingFn` is provided. This is correct per PTU rules -- a wall between two adjacent cells should block targeting. The Bresenham trace for adjacent cells will have no intermediate cells, so it will always return `true` (the wall would need to be AT the target cell, which is excluded). This means adjacent LoS effectively always passes, which is appropriate because "blocking terrain between adjacent cells" would require sub-cell wall representation that the grid does not support.

## File Size

The file is now **775 lines**. The 800-line limit is 25 lines away. This is noted for awareness. The subsequent bug-019 commit adds more code to this file -- see code-review-072 for the combined assessment.

## What Looks Good

- **Clean separation of concerns:** LoS logic lives in `hasLineOfSight()` as a pure function, not mixed into `isInRange()`. The integration is a simple guard check.
- **Origin/destination exclusion is correct:** An attacker standing on blocking terrain can still attack, and a target on blocking terrain can still be targeted. Only walls between them matter.
- **Optional parameter design is solid:** Backward compatibility is maintained perfectly. No existing callers need changes.
- **Clear documentation:** JSDoc comments explain the PTU rule reference and parameter semantics.
- **Commit message is excellent:** Cites the PTU page reference (Ch. 7 p.487), lists all changes, notes backward compatibility.

## Verdict

APPROVED WITH NOTES -- The Bresenham LoS implementation is algorithmically correct and cleanly integrated. The HIGH-1 diagonal gap limitation is a known tradeoff of single-line Bresenham that is acceptable for a P2 fix. Required follow-ups:

1. **Add unit tests for `hasLineOfSight`** (MEDIUM-1) -- test the 5 cases listed above.
2. **Wire `isBlockingFn` into callers** (MEDIUM-2) -- the fix is dormant until the terrain store is connected to targeting code.
3. **File follow-up ticket for diagonal wall gaps** (HIGH-1) -- if diagonal blocking arrangements are used in play, the single-line trace may miss them.
