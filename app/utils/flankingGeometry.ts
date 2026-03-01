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
