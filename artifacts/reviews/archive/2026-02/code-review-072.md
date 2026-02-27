---
review_id: code-review-072
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-019
domain: vtt-grid
commits_reviewed:
  - 6ff3b0a
files_reviewed:
  - app/composables/useRangeParser.ts
verdict: APPROVED WITH NOTES
issues_found:
  critical: 0
  high: 0
  medium: 3
scenarios_to_rerun: []
reviewed_at: 2026-02-20T16:30:00Z
---

## Review Scope

Review of bug-019 fix (commit `6ff3b0a`): multi-cell token range measurement in `useRangeParser.ts`. The fix adds `TokenFootprint`, `getOccupiedCells()`, `chebyshevDistanceTokens()`, `closestCellPair()` and extends `isInRange()` with optional `attackerSize`/`targetSize` parameters.

**Diff stats:** 1 file, +122/-17 lines.

## Issues

### MEDIUM-1: `closestCellPair()` uses O(n*m) brute force while `chebyshevDistanceTokens()` is O(1)

**File:** `app/composables/useRangeParser.ts:205-233`

`chebyshevDistanceTokens()` correctly uses O(1) interval gap math to compute the minimum Chebyshev distance between two rectangular tokens. However, `closestCellPair()` falls back to O(n*m) iteration over all cell pairs (via `getOccupiedCells`). For a 4x4 vs 4x4 matchup (Gigantic vs Gigantic), this is 16*16 = 256 iterations.

The closest cell pair can also be computed in O(1) using the same interval clamping logic:
```typescript
function closestCellPair(a: TokenFootprint, b: TokenFootprint): { from: GridPosition; to: GridPosition } {
  if (a.size === 1 && b.size === 1) {
    return { from: a.position, to: b.position }
  }
  const aRight = a.position.x + a.size - 1
  const aBottom = a.position.y + a.size - 1
  const bRight = b.position.x + b.size - 1
  const bBottom = b.position.y + b.size - 1

  // Clamp each token's range to the nearest point in the other token
  const fromX = Math.max(a.position.x, Math.min(aRight, b.position.x))
  const fromY = Math.max(a.position.y, Math.min(aBottom, b.position.y))
  const toX = Math.max(b.position.x, Math.min(bRight, a.position.x))
  const toY = Math.max(b.position.y, Math.min(bBottom, a.position.y))

  return { from: { x: fromX, y: fromY }, to: { x: toX, y: toY } }
}
```

**Impact:** Low in practice -- 256 iterations is trivial for modern JS engines. But the inconsistency between O(1) distance and O(n*m) pair-finding is architecturally odd. This is a performance nit, not a correctness bug.

**Recommendation:** Refactor to O(1) in a follow-up. Not blocking.

### MEDIUM-2: No unit tests for new functions

**File:** `app/tests/unit/composables/useRangeParser.test.ts`

The test file destructures `{ parseRange, isInRange, validateMovement, getMovementRangeCells }` at line 5. None of the new functions (`getOccupiedCells`, `chebyshevDistanceTokens`, `closestCellPair`) are tested. The existing `isInRange` tests all use single-cell tokens (no `attackerSize`/`targetSize` arguments).

**Fix:** Add test suites covering:

1. **`getOccupiedCells`:**
   - Size 1 at (3,3) returns `[{x:3,y:3}]`
   - Size 2 at (3,3) returns 4 cells: (3,3), (4,3), (3,4), (4,4)
   - Size 3 at (0,0) returns 9 cells

2. **`chebyshevDistanceTokens`:**
   - Two 1x1 tokens: equivalent to standard Chebyshev
   - 2x2 at (0,0) vs 1x1 at (3,0): distance = 2 (nearest cell is (1,0) to (3,0))
   - Two 2x2 tokens adjacent: distance = 1
   - Two 2x2 tokens overlapping: distance = 0
   - Two 2x2 tokens diagonally separated: correct gap

3. **`closestCellPair`:**
   - Single-cell returns positions directly
   - 2x2 vs 1x1: returns the nearest edge cell from the 2x2

4. **`isInRange` with multi-cell tokens:**
   - 2x2 attacker melee range: can reach cells adjacent to any of its 4 cells
   - 2x2 self-targeting: target overlapping attacker returns true
   - Cardinally-adjacent with 2x2 attacker
   - Ranged attack measuring from nearest cell

### MEDIUM-3: `isInRange` parameter ordering creates a positional trap

**File:** `app/composables/useRangeParser.ts:301-307`

```typescript
function isInRange(
  attacker: GridPosition,
  target: GridPosition,
  parsedRange: RangeParseResult,
  isBlockingFn?: (x: number, y: number) => boolean,
  attackerSize: number = 1,
  targetSize: number = 1
): boolean
```

To pass `attackerSize` without `isBlockingFn`, callers must write: `isInRange(a, t, range, undefined, 2, 3)`. This `undefined` hole pattern is a known API smell. When callers start wiring both LoS and multi-cell tokens, every call site will need all 6 arguments.

**Recommendation:** Consider refactoring to an options object in a follow-up:
```typescript
interface IsInRangeOptions {
  isBlockingFn?: (x: number, y: number) => boolean
  attackerSize?: number
  targetSize?: number
}
function isInRange(
  attacker: GridPosition,
  target: GridPosition,
  parsedRange: RangeParseResult,
  options?: IsInRangeOptions
): boolean
```

This is not blocking because (a) no callers currently pass any optional params, and (b) the default values make the current signature backward compatible. But when wiring happens, the options object will be cleaner.

## Algorithm Verification

### `getOccupiedCells` -- CORRECT

Lines 159-167: Iterates `dx` from 0 to `size-1` and `dy` from 0 to `size-1`, producing `size * size` cells starting from `token.position`. For a 2x2 token at (3,3), this correctly produces (3,3), (4,3), (3,4), (4,4). The convention that `position` is the top-left corner is consistent with `useGridInteraction.ts:107-108` which computes `right = token.position.x + token.size - 1`.

### `chebyshevDistanceTokens` -- CORRECT

Lines 177-198: The O(1) rectangle-to-rectangle Chebyshev distance formula.

Walkthrough for Token A at (0,0) size 2 and Token B at (4,2) size 2:
- A occupies [0,1] x [0,1], B occupies [4,5] x [2,3]
- `aRight = 1`, `aBottom = 1`, `bRight = 5`, `bBottom = 3`
- `gapX = max(0, 0-5, 4-1) = max(0, -5, 3) = 3`
- `gapY = max(0, 0-3, 2-1) = max(0, -3, 1) = 1`
- `distance = max(3, 1) = 3`

Manual check: nearest cells are A(1,1) to B(4,2). Chebyshev = max(|4-1|, |2-1|) = max(3,1) = 3. Correct.

Overlapping case: A at (0,0) size 2 and B at (1,1) size 2:
- A occupies [0,1] x [0,1], B occupies [1,2] x [1,2]
- `gapX = max(0, 0-2, 1-1) = max(0, -2, 0) = 0`
- `gapY = max(0, 0-2, 1-1) = max(0, -2, 0) = 0`
- `distance = max(0, 0) = 0` -- correct, they share cell (1,1).

### `closestCellPair` -- CORRECT (but slow)

Lines 205-233: Brute-force finds the pair with minimum Chebyshev distance. The single-cell fast path at line 210 avoids allocation for the common case. The algorithm is correct but O(n*m) as noted in MEDIUM-1.

### `isInRange` Multi-Cell Integration -- CORRECT

**Self-targeting (lines 309-318):**
For single-cell, uses exact position match (unchanged). For multi-cell, checks `chebyshevDistanceTokens === 0` which means any cell overlap. This is correct: a 2x2 token using a Self move targets itself, and any cell within its footprint counts.

**Distance calculation (lines 325-330):**
Replaced inline `Math.max(Math.abs(...), Math.abs(...))` with `chebyshevDistanceTokens(attackerFootprint, targetFootprint)`. For size-1 tokens, the formula reduces to the same single-point Chebyshev distance (since the intervals degenerate to points and `gap = max(0, distance) = distance`). Backward compatible.

**Cardinally-adjacent (lines 333-345):**
First checks `distance !== 1` (must be exactly adjacent). Then calls `closestCellPair()` to get the actual nearest cells and verifies they are cardinally (not diagonally) adjacent. This is correct for multi-cell: a 2x2 token at (3,3) next to a 1x1 at (5,3) would have `closestCellPair` return `from: (4,3)` and `to: (5,3)`, which is cardinal (dx=1, dy=0). If the 1x1 were at (5,5), `closestCellPair` returns `from: (4,4)` and `to: (5,5)`, which is diagonal (dx=1, dy=1) and correctly rejected.

**LoS integration (lines 356-360):**
Uses `closestCellPair` to find the nearest cells, then traces LoS between them. This is correct: if the nearest path between two tokens passes through a wall, the attack is blocked.

### Backward Compatibility -- VERIFIED

Both `attackerSize` and `targetSize` default to `1`. When both are 1:
- `getOccupiedCells` returns a single-element array
- `chebyshevDistanceTokens` reduces to point Chebyshev (gap formula with degenerate intervals)
- `closestCellPair` returns the positions directly via the fast path (line 210)

All 13 existing `isInRange` unit tests pass unchanged because they use the 3-argument form (or old 4-argument with `isBlockingFn` omitted).

## File Size Assessment

After both bug-018 and bug-019 commits, the file is **775 lines**. This is within the 800-line limit but only 25 lines of headroom remain.

The file now contains:
- Range parsing (lines 40-153) -- 113 lines
- Multi-cell token helpers (lines 155-233) -- 78 lines
- LoS checking (lines 235-288) -- 53 lines
- `isInRange` (lines 290-363) -- 73 lines
- AoE cell calculation (lines 365-464) -- 99 lines
- Movement range / Dijkstra (lines 466-581) -- 115 lines
- Move cost / validation (lines 583-637) -- 54 lines
- A* pathfinding (lines 639-760) -- 121 lines
- Return object (lines 762-775) -- 13 lines

The A* pathfinding block (121 lines) and Dijkstra flood-fill (115 lines) are the largest sections. If further features need to be added to this file, extracting pathfinding into a separate `usePathfinding.ts` composable would be the natural split point. This is not required now but should be the first move if the file approaches 800.

## What Looks Good

- **O(1) rectangle distance is a smart optimization.** Computing interval gaps instead of iterating cell pairs is elegant and correct. The formula handles overlapping, adjacent, and separated tokens uniformly.
- **Clean type design.** `TokenFootprint` is minimal and self-documenting. The `position` + `size` convention matches the existing grid interaction code at `useGridInteraction.ts:107-108`.
- **Self-targeting overlap detection is correct.** Using `chebyshevDistanceTokens === 0` for multi-cell self-targeting is the right abstraction -- it avoids enumerating cells and handles all size combinations.
- **Cardinal adjacency check is thorough.** The two-step approach (distance check then cardinal verification via closest cell pair) correctly handles edge cases like large tokens adjacent diagonally.
- **LoS integration with multi-cell tokens is correct.** Tracing LoS from the closest cell pair (not token origins) ensures the most favorable LoS path is checked, which matches PTU intent.
- **Commit message is detailed and cites PTU reference.** Lists all new functions, notes O(1) optimization, and explains backward compatibility.

## Verdict

APPROVED WITH NOTES -- The multi-cell token range calculation is algorithmically correct and well-integrated. The O(1) Chebyshev distance formula is verified. All backward compatibility is maintained. Required follow-ups:

1. **Add unit tests for new functions** (MEDIUM-2) -- `getOccupiedCells`, `chebyshevDistanceTokens`, `closestCellPair`, and `isInRange` with multi-cell params.
2. **Wire `attackerSize`/`targetSize` into callers** -- same as bug-018's remaining work, no callers pass size yet.
3. **Consider O(1) closestCellPair** (MEDIUM-1) -- low priority but architecturally consistent.
4. **Consider options object refactor for `isInRange`** (MEDIUM-3) -- when wiring both LoS and multi-cell, the positional args will be unwieldy.
5. **Monitor file size** -- 775/800 lines. Extract pathfinding if more code is added.
