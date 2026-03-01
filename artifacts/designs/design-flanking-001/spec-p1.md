# P1 Specification: Advanced Flanking (Multi-Tile, Diagonal, 3+ Attackers)

P1 extends flanking detection to handle multi-tile tokens (Large, Huge, Gigantic), multi-tile attacker counting, and validates the non-adjacency check for groups of 3+ attackers. Depends on feature-013 (multi-tile token system) for the full multi-tile grid positioning.

---

## E. Multi-Tile Target Flanking Geometry

### Flanking Requirements by Size (PTU p.232)

Large targets (2x2) require 3 non-adjacent foes. Huge (3x3) require 4. Gigantic (4x4) require 5. The P0 `checkFlanking` already uses `FLANKING_FOES_REQUIRED[targetSize]`, so the requirement count scales automatically.

### Multi-Tile Adjacency Ring

For a 2x2 target at `(3, 3)`, the occupied cells are:
```
(3,3) (4,3)
(3,4) (4,4)
```

The adjacent ring (all 8-neighbor cells not occupied by the target) has 12 cells:
```
(2,2) (3,2) (4,2) (5,2)
(2,3)                (5,3)
(2,4)                (5,4)
(2,5) (3,5) (4,5) (5,5)
```

The `getAdjacentCells()` function from P0 already handles multi-tile tokens correctly -- it iterates all occupied cells and collects unique 8-neighbors not in the occupied set.

### Modified: `app/utils/flankingGeometry.ts`

Extend `checkFlanking` to handle the N-foe requirement for multi-tile targets. The core change: instead of checking for a single non-adjacent pair, check if there exist N non-mutually-adjacent foes.

```typescript
/**
 * Check if a target is flanked (P1: full multi-tile support).
 *
 * For multi-tile targets (Large+), the number of required foes scales.
 * The algorithm finds whether enough non-mutually-adjacent foes exist
 * to meet the flanking threshold.
 *
 * "Non-mutually-adjacent" means: among the N foes, no two of them are
 * adjacent to each other. This is the strict PTU reading -- the flankers
 * must be spread around the target, not clustered.
 *
 * Implementation: Build a graph where edges connect adjacent foe pairs.
 * Find an independent set of size >= requiredFoes. For small N (max ~16
 * foes around a 4x4 target), a greedy approach is sufficient.
 *
 * @param targetPos - Target's grid position (anchor)
 * @param targetSize - Target's token footprint
 * @param foes - Enemy combatants with positions and sizes
 * @returns Flanking result including effective foe count
 */
export function checkFlankingMultiTile(
  targetPos: GridPosition,
  targetSize: number,
  foes: ReadonlyArray<{ id: string; position: GridPosition; size: number }>
): { isFlanked: boolean; flankerIds: string[]; effectiveFoeCount: number; requiredFoes: number } {
  const requiredFoes = FLANKING_FOES_REQUIRED[targetSize] ?? 2

  // Step 1: Find all foes adjacent to the target
  const adjacentFoes = foes.filter(foe =>
    areAdjacent(targetPos, targetSize, foe.position, foe.size)
  )

  if (adjacentFoes.length < requiredFoes) {
    return {
      isFlanked: false,
      flankerIds: [],
      effectiveFoeCount: adjacentFoes.length,
      requiredFoes,
    }
  }

  // Step 2: Build adjacency graph among the foes
  // adjacencyMatrix[i][j] = true if foe i and foe j are adjacent to each other
  const n = adjacentFoes.length
  const isAdjacentPair: boolean[][] = Array.from({ length: n }, () =>
    Array(n).fill(false)
  )

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const adj = areAdjacent(
        adjacentFoes[i].position, adjacentFoes[i].size,
        adjacentFoes[j].position, adjacentFoes[j].size
      )
      isAdjacentPair[i][j] = adj
      isAdjacentPair[j][i] = adj
    }
  }

  // Step 3: Find an independent set of size >= requiredFoes
  // (set of foes where no two are adjacent to each other)
  // Use greedy: pick the foe with the fewest adjacent-to-other-foe connections first.
  // For typical combat scenarios (< 20 adjacent foes), this is fast enough.
  const independentSet = findIndependentSet(isAdjacentPair, n, requiredFoes)

  if (independentSet.length >= requiredFoes) {
    return {
      isFlanked: true,
      flankerIds: adjacentFoes.map(f => f.id),
      effectiveFoeCount: adjacentFoes.length,
      requiredFoes,
    }
  }

  return {
    isFlanked: false,
    flankerIds: [],
    effectiveFoeCount: adjacentFoes.length,
    requiredFoes,
  }
}

/**
 * Greedy independent set finder.
 *
 * Finds a set of vertices in the adjacency graph where no two are connected.
 * Uses a minimum-degree-first greedy heuristic.
 *
 * @param adjacency - Adjacency matrix (n x n)
 * @param n - Number of vertices
 * @param target - Desired independent set size (stop early when reached)
 * @returns Array of vertex indices in the independent set
 */
function findIndependentSet(
  adjacency: boolean[][],
  n: number,
  target: number
): number[] {
  const available = new Set<number>()
  for (let i = 0; i < n; i++) available.add(i)

  const selected: number[] = []

  while (available.size > 0 && selected.length < target) {
    // Pick vertex with minimum degree among available vertices
    let minDeg = Infinity
    let pick = -1
    for (const v of available) {
      let deg = 0
      for (const u of available) {
        if (u !== v && adjacency[v][u]) deg++
      }
      if (deg < minDeg) {
        minDeg = deg
        pick = v
      }
    }

    if (pick === -1) break

    selected.push(pick)
    // Remove pick and all its neighbors from available
    available.delete(pick)
    for (const u of [...available]) {
      if (adjacency[pick][u]) available.delete(u)
    }
  }

  return selected
}
```

**Note**: The greedy independent set is not guaranteed optimal for the general Maximum Independent Set problem (NP-hard), but for the small graph sizes in PTU combat (max ~20 foes around a Gigantic target), it will find the correct answer in virtually all practical cases. If needed, a backtracking solver can replace it with negligible performance cost at these sizes.

---

## F. Multi-Tile Attacker Counting

### PTU Rule (p.232)

> "Foes larger than Medium may occupy multiple squares -- in this case, they count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying."

A 2x2 attacker adjacent to a 1x1 target may have 1, 2, 3, or 4 of its cells adjacent to the target's cell. Each adjacent attacker cell counts as one "foe" for flanking purposes.

**Critical constraint**: "A single combatant cannot Flank by itself." Even if a 2x2 attacker has 4 cells adjacent to a target (counting as 4 foes), it still requires at least one other combatant to trigger flanking.

### Modified: `app/utils/flankingGeometry.ts`

Add a function to count how many of an attacker's cells are adjacent to the target:

```typescript
/**
 * Count how many cells of an attacker are adjacent to a target.
 * This determines the attacker's "foe count" for flanking purposes.
 *
 * PTU p.232: large attackers count as multiple foes equal to
 * the number of their squares adjacent to the flanked target.
 *
 * @param attackerPos - Attacker's anchor position
 * @param attackerSize - Attacker's token footprint
 * @param targetPos - Target's anchor position
 * @param targetSize - Target's token footprint
 * @returns Number of attacker cells adjacent to the target (0 if not adjacent)
 */
export function countAdjacentAttackerCells(
  attackerPos: GridPosition, attackerSize: number,
  targetPos: GridPosition, targetSize: number
): number {
  const targetCellSet = new Set<string>()
  for (let dx = 0; dx < targetSize; dx++) {
    for (let dy = 0; dy < targetSize; dy++) {
      targetCellSet.add(`${targetPos.x + dx},${targetPos.y + dy}`)
    }
  }

  let count = 0
  for (let dx = 0; dx < attackerSize; dx++) {
    for (let dy = 0; dy < attackerSize; dy++) {
      const ax = attackerPos.x + dx
      const ay = attackerPos.y + dy
      for (const [ox, oy] of NEIGHBOR_OFFSETS) {
        if (targetCellSet.has(`${ax + ox},${ay + oy}`)) {
          count++
          break // This attacker cell counts as at most 1 foe
        }
      }
    }
  }

  return count
}
```

### Integration with Flanking Detection

The `checkFlankingMultiTile` function must use `countAdjacentAttackerCells` when building the effective foe count. Each attacker contributes a count equal to its adjacent cells, but the minimum combatant count is still 2:

```typescript
// In checkFlankingMultiTile, before the independent set check:
// Calculate effective foe count with multi-tile attacker cells
let effectiveFoeCount = 0
const foeContributions: Array<{ id: string; contribution: number }> = []

for (const foe of adjacentFoes) {
  const contribution = foe.size > 1
    ? countAdjacentAttackerCells(foe.position, foe.size, targetPos, targetSize)
    : 1
  effectiveFoeCount += contribution
  foeContributions.push({ id: foe.id, contribution })
}

// Self-flank prevention: even with high effective count,
// need at least 2 distinct combatants
if (adjacentFoes.length < 2) {
  return { isFlanked: false, flankerIds: [], effectiveFoeCount, requiredFoes }
}

// Check if effective foe count meets the requirement
if (effectiveFoeCount >= requiredFoes) {
  // Still need to verify non-adjacency among the flankers
  // (the independent set check applies to combatants, not cells)
  // ...
}
```

**Important nuance**: The multi-tile attacker counting increases the effective foe count, but the non-adjacency rule still applies to the combatants themselves. If two large attackers are adjacent to each other AND adjacent to the target, they still don't flank (they fail the non-adjacency test). The multi-tile cell counting only helps when a large attacker is far enough from another attacker to not be adjacent.

---

## G. Diagonal Flanking with PTU Distance Rules

### Adjacency Definition

PTU uses 8-directional adjacency for flanking. A cell diagonally adjacent to the target is just as valid as a cardinally adjacent one. This is already handled by `NEIGHBOR_OFFSETS` in P0.

### Decree-002 Interaction

Decree-002 (PTU alternating diagonal for distance measurement) affects distance calculations but NOT adjacency. Adjacency is a topological property (8-neighbors), not a metric property. Two cells are adjacent if their Chebyshev distance is 1, regardless of the PTU diagonal movement cost.

The PTU alternating diagonal rule (1-2-1) applies when measuring movement or range distances, not when determining adjacency for flanking.

**Design decision**: No changes needed for diagonal flanking. The 8-directional adjacency in P0 is already correct per PTU.

---

## H. Flanking for 3+ Attackers

### Beyond the Minimum

When more than the minimum number of foes surround a target, the flanking detection must still verify the non-adjacency condition. The P0 algorithm checks for any pair of non-adjacent foes (sufficient for 1x1 targets needing 2 foes). P1's `findIndependentSet` generalizes this to N foes.

### Examples

**3 foes around a Large (2x2) target:**
```
  . A .
  . T T
  B T T
  . . C
```
A at (1,0), B at (0,2), C at (3,3), Target at (1,1) size 2.
- A is adjacent to target (cell (1,1) neighbors (1,0)) -- yes
- B is adjacent to target (cell (1,2) neighbors (0,2)) -- yes
- C is adjacent to target (cell (2,2) neighbors (3,3)) -- yes
- A-B adjacent? (1,0) and (0,2): |dx|=1, |dy|=2 -- NO
- A-C adjacent? (1,0) and (3,3): |dx|=2, |dy|=3 -- NO
- B-C adjacent? (0,2) and (3,3): |dx|=3, |dy|=1 -- NO
- Independent set of size 3 found: {A, B, C} -- FLANKED

**3 foes around a Large target, but two are adjacent to each other:**
```
  A B .
  . T T
  . T T
  . . C
```
A at (0,0), B at (1,0), C at (3,3), Target at (1,1) size 2.
- A-B adjacent? (0,0) and (1,0): |dx|=1, |dy|=0 -- YES
- A-C adjacent? No
- B-C adjacent? No
- Independent set: pick A (degree 1 via B), remove A and B. Then pick C.
- Set {A, C} has size 2, need 3 -- NOT FLANKED
- But wait: pick C (degree 0), then pick A (degree 0 after B removed). Set {C, A} = 2 < 3.
- Still NOT FLANKED. Correct -- A and B are clustered, only C is independent.

### All-Clustered Case

If all adjacent foes form a connected cluster (all mutually adjacent or linked by adjacency chains), no independent set of size >= 2 may exist, and the target is not flanked. This correctly models the PTU visual example on p.232 where two Zangoose adjacent to each other do not flank the Hitmonchan.

---

## Summary of File Changes (P1)

| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/utils/flankingGeometry.ts` | Add `checkFlankingMultiTile`, `countAdjacentAttackerCells`, `findIndependentSet` |
| **EDIT** | `app/composables/useFlankingDetection.ts` | Switch to `checkFlankingMultiTile` when multi-tile tokens present |
