/**
 * Pure geometry functions for PTU flanking detection.
 *
 * PTU p.232: A combatant is Flanked when a sufficient number of foes
 * are adjacent to them but NOT adjacent to each other. The required
 * number depends on the target's size category.
 *
 * No Vue/Pinia dependencies -- fully unit-testable.
 */

import type { GridPosition } from '~/types'

/**
 * The 8 directional offsets for adjacency (cardinal + diagonal).
 * PTU treats diagonal adjacency identically to cardinal for flanking.
 */
export const NEIGHBOR_OFFSETS: ReadonlyArray<[number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1,  0],          [1,  0],
  [-1,  1], [0,  1], [1,  1],
]

/**
 * Map token footprint size to the number of non-adjacent foes required to flank.
 * PTU p.232: Small/Medium=2, Large=3, Huge=4, Gigantic=5.
 */
export const FLANKING_FOES_REQUIRED: Readonly<Record<number, number>> = {
  1: 2,  // Small/Medium (1x1)
  2: 3,  // Large (2x2)
  3: 4,  // Huge (3x3)
  4: 5,  // Gigantic (4x4)
}

/**
 * Flanking evasion penalty per PTU p.232.
 * Applied to Physical, Special, and Speed evasion.
 */
export const FLANKING_EVASION_PENALTY = 2

/**
 * Get all cells occupied by a token.
 *
 * @param position - Top-left anchor position
 * @param size - Token footprint (1=1x1, 2=2x2, etc.)
 * @returns Array of all occupied grid positions
 */
export function getOccupiedCells(position: GridPosition, size: number): GridPosition[] {
  const cells: GridPosition[] = []
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      cells.push({ x: position.x + dx, y: position.y + dy })
    }
  }
  return cells
}

/**
 * Get all cells adjacent to a token (the border ring).
 * Adjacent cells are within 1 step (8-directional) of any occupied cell
 * but NOT occupied by the token itself.
 *
 * @param position - Top-left anchor position
 * @param size - Token footprint
 * @returns Array of unique adjacent grid positions
 */
export function getAdjacentCells(position: GridPosition, size: number): GridPosition[] {
  const occupied = new Set<string>()
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      occupied.add(`${position.x + dx},${position.y + dy}`)
    }
  }

  const adjacent: GridPosition[] = []
  const seen = new Set<string>()

  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      const cx = position.x + dx
      const cy = position.y + dy
      for (const [ox, oy] of NEIGHBOR_OFFSETS) {
        const nx = cx + ox
        const ny = cy + oy
        const key = `${nx},${ny}`
        if (!occupied.has(key) && !seen.has(key)) {
          seen.add(key)
          adjacent.push({ x: nx, y: ny })
        }
      }
    }
  }

  return adjacent
}

/**
 * Check if two combatants are adjacent (any cell of one is an 8-neighbor
 * of any cell of the other).
 *
 * For P0 with 1x1 tokens, this simplifies to: |dx| <= 1 && |dy| <= 1
 * and not the same cell.
 *
 * @param posA - Position of combatant A
 * @param sizeA - Token size of combatant A
 * @param posB - Position of combatant B
 * @param sizeB - Token size of combatant B
 * @returns true if adjacent
 */
export function areAdjacent(
  posA: GridPosition, sizeA: number,
  posB: GridPosition, sizeB: number
): boolean {
  for (let dxA = 0; dxA < sizeA; dxA++) {
    for (let dyA = 0; dyA < sizeA; dyA++) {
      for (let dxB = 0; dxB < sizeB; dxB++) {
        for (let dyB = 0; dyB < sizeB; dyB++) {
          const dx = Math.abs((posA.x + dxA) - (posB.x + dxB))
          const dy = Math.abs((posA.y + dyA) - (posB.y + dyB))
          if (dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)) {
            return true
          }
        }
      }
    }
  }
  return false
}

/**
 * Determine if a target is flanked by a set of foes (P0: 1x1 tokens only).
 *
 * PTU p.232 Flanking Rule:
 * A combatant is Flanked when at least N foes are adjacent to them
 * but NOT adjacent to each other, where N depends on target size.
 *
 * Algorithm (P0, all 1x1):
 * 1. Collect all foes adjacent to the target.
 * 2. Find any pair of foes that are NOT adjacent to each other.
 * 3. If such a pair exists, the target is Flanked (N=2 for 1x1 targets).
 *
 * @param targetPos - Target's grid position
 * @param targetSize - Target's token size (1 for P0)
 * @param foes - Array of { id, position, size } for all enemy combatants
 * @returns FlankingResult with isFlanked flag and flanker IDs
 */
export function checkFlanking(
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

  // Step 2: For 1x1 targets (P0), find any pair of adjacent foes
  // that are NOT adjacent to each other.
  // This is O(n^2) over adjacent foes -- typically 0-8, so negligible.
  for (let i = 0; i < adjacentFoes.length; i++) {
    for (let j = i + 1; j < adjacentFoes.length; j++) {
      const foeA = adjacentFoes[i]
      const foeB = adjacentFoes[j]
      if (!areAdjacent(foeA.position, foeA.size, foeB.position, foeB.size)) {
        // Found a non-adjacent pair -> target is Flanked
        // Return all adjacent foes as potential flankers
        return {
          isFlanked: true,
          flankerIds: adjacentFoes.map(f => f.id),
          effectiveFoeCount: adjacentFoes.length,
          requiredFoes,
        }
      }
    }
  }

  // All adjacent foes are adjacent to each other -- no flanking
  return {
    isFlanked: false,
    flankerIds: [],
    effectiveFoeCount: adjacentFoes.length,
    requiredFoes,
  }
}

/**
 * Count how many cells of an attacker are adjacent to a target.
 * This determines the attacker's "foe count" for flanking purposes.
 *
 * PTU p.232: Foes larger than Medium count as multiple foes equal to
 * the number of their squares adjacent to the flanked target.
 *
 * An attacker cell is "adjacent" to the target if any of its 8-neighbors
 * is a cell occupied by the target.
 *
 * @param attackerPos - Attacker's anchor position (top-left)
 * @param attackerSize - Attacker's token footprint
 * @param targetPos - Target's anchor position (top-left)
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
      // Check if this attacker cell is adjacent to any target cell
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

/**
 * Greedy independent set finder.
 *
 * Finds a set of vertices in the adjacency graph where no two are connected.
 * Uses a minimum-degree-first greedy heuristic: at each step, pick the vertex
 * with the fewest connections among remaining candidates, add it to the set,
 * then remove it and all its neighbors from the candidate pool.
 *
 * For the small graph sizes in PTU combat (max ~20 foes around a Gigantic
 * target), this greedy approach finds the correct answer in virtually all
 * practical cases.
 *
 * @param adjacency - Adjacency matrix (n x n), true if two vertices are connected
 * @param n - Number of vertices
 * @param target - Desired independent set size (stop early when reached)
 * @returns Array of vertex indices in the independent set
 */
export function findIndependentSet(
  adjacency: ReadonlyArray<ReadonlyArray<boolean>>,
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

/**
 * Check if a target is flanked (P1: full multi-tile support).
 *
 * Handles multi-tile targets (Large 2x2, Huge 3x3, Gigantic 4x4) which
 * require more non-adjacent foes. Also handles multi-tile attackers which
 * count as multiple foes equal to the number of their cells adjacent to
 * the target (PTU p.232).
 *
 * Algorithm:
 * 1. Find all foes adjacent to the target.
 * 2. Count effective foe contributions (multi-tile attackers count more).
 * 3. Enforce self-flank prevention (minimum 2 distinct combatants).
 * 4. Build adjacency graph among foes.
 * 5. Find an independent set of size >= requiredFoes using greedy algorithm.
 *    For multi-tile attackers in the independent set, their contribution
 *    counts toward the effective total.
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

  // Self-flank prevention: minimum 2 distinct combatants always required
  if (adjacentFoes.length < 2) {
    const effectiveCount = adjacentFoes.length === 1
      ? (adjacentFoes[0].size > 1
        ? countAdjacentAttackerCells(adjacentFoes[0].position, adjacentFoes[0].size, targetPos, targetSize)
        : 1)
      : 0
    return {
      isFlanked: false,
      flankerIds: [],
      effectiveFoeCount: effectiveCount,
      requiredFoes,
    }
  }

  // Step 2: Calculate each foe's contribution (multi-tile attackers count more)
  const foeContributions = adjacentFoes.map(foe => ({
    ...foe,
    contribution: foe.size > 1
      ? countAdjacentAttackerCells(foe.position, foe.size, targetPos, targetSize)
      : 1,
  }))

  const totalEffectiveCount = foeContributions.reduce(
    (sum, f) => sum + f.contribution, 0
  )

  // Quick check: if total effective foe count is less than required, no flanking
  if (totalEffectiveCount < requiredFoes) {
    return {
      isFlanked: false,
      flankerIds: [],
      effectiveFoeCount: totalEffectiveCount,
      requiredFoes,
    }
  }

  // Step 3: Build adjacency graph among the foes themselves
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

  // Step 4: Find an independent set and check if their combined contributions
  // meet the required foe count.
  // For 1x1 targets (requiredFoes=2), we just need any 2 non-adjacent foes.
  // For multi-tile targets, we need an independent set whose total contribution >= requiredFoes.
  const independentSet = findIndependentSet(isAdjacentPair, n, requiredFoes)

  // Sum contributions of the independent set members
  const independentContribution = independentSet.reduce(
    (sum, idx) => sum + foeContributions[idx].contribution, 0
  )

  if (independentContribution >= requiredFoes) {
    return {
      isFlanked: true,
      flankerIds: adjacentFoes.map(f => f.id),
      effectiveFoeCount: totalEffectiveCount,
      requiredFoes,
    }
  }

  return {
    isFlanked: false,
    flankerIds: [],
    effectiveFoeCount: totalEffectiveCount,
    requiredFoes,
  }
}
