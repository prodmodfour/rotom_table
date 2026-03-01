/**
 * Grid Adjacency Utilities
 *
 * Shared utility for determining which combatants are adjacent on the VTT grid.
 * PTU p.231: adjacent = squares touching, including diagonals (8-directional).
 *
 * Used by:
 * - AoO trigger detection (shift_away, maneuver_other, ranged_attack, etc.)
 * - Intercept range checking (P2 scope)
 * - Client-side movement preview (getAoOTriggersForMove in useGridMovement)
 */

import type { GridPosition, Combatant, CombatSide } from '~/types'
import { isEnemySide } from '~/utils/combatSides'

/**
 * Get all cells occupied by a token at a given position with a given size.
 * Multi-cell tokens (NxN) occupy multiple grid cells.
 */
export function getTokenCells(position: GridPosition, size: number): GridPosition[] {
  const cells: GridPosition[] = []
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      cells.push({ x: position.x + dx, y: position.y + dy })
    }
  }
  return cells
}

/**
 * Get all cells adjacent to a set of occupied cells (8-directional).
 * Returns cells that are adjacent but NOT part of the occupied set itself.
 */
export function getAdjacentCellsForFootprint(cells: GridPosition[]): GridPosition[] {
  const occupiedSet = new Set(cells.map(c => `${c.x},${c.y}`))
  const adjacentSet = new Set<string>()
  const result: GridPosition[] = []

  for (const cell of cells) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue
        const key = `${cell.x + dx},${cell.y + dy}`
        if (!occupiedSet.has(key) && !adjacentSet.has(key)) {
          adjacentSet.add(key)
          result.push({ x: cell.x + dx, y: cell.y + dy })
        }
      }
    }
  }

  return result
}

/**
 * Check if two tokens are adjacent (including diagonals).
 * For multi-cell tokens, checks if ANY cell of one token is adjacent
 * to ANY cell of the other token.
 *
 * PTU p.231: Adjacent means touching squares, including diagonals.
 *
 * @param posA - Position (top-left) of token A
 * @param sizeA - Size of token A (1x1, 2x2, etc.)
 * @param posB - Position (top-left) of token B
 * @param sizeB - Size of token B
 * @returns true if any cell of A is adjacent to any cell of B
 */
export function areAdjacent(
  posA: GridPosition, sizeA: number,
  posB: GridPosition, sizeB: number
): boolean {
  // Get all cells for token B and build a set for fast lookup
  const cellsB = getTokenCells(posB, sizeB)
  const cellsBSet = new Set(cellsB.map(c => `${c.x},${c.y}`))

  // For each cell in token A, check if any of its 8 neighbors is in token B
  const cellsA = getTokenCells(posA, sizeA)
  for (const cellA of cellsA) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue
        if (cellsBSet.has(`${cellA.x + dx},${cellA.y + dy}`)) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Get all combatants adjacent to a given combatant.
 * Uses grid positions and token sizes.
 * Only considers combatants with valid positions on the grid.
 *
 * @param combatantId - The reference combatant's ID
 * @param combatants - All combatants in the encounter
 * @returns Array of adjacent combatants (excludes the reference combatant)
 */
export function getAdjacentCombatants(
  combatantId: string,
  combatants: Combatant[]
): Combatant[] {
  const self = combatants.find(c => c.id === combatantId)
  if (!self || !self.position) return []

  return combatants.filter(c => {
    if (c.id === combatantId) return false
    if (!c.position) return false
    return areAdjacent(self.position!, self.tokenSize, c.position, c.tokenSize)
  })
}

/**
 * Get all ENEMY combatants adjacent to a given combatant.
 * Filters by side: 'enemies' opposes 'players' and 'allies'.
 *
 * @param combatantId - The reference combatant's ID
 * @param combatants - All combatants in the encounter
 * @returns Array of adjacent enemy combatants
 */
export function getAdjacentEnemies(
  combatantId: string,
  combatants: Combatant[]
): Combatant[] {
  const self = combatants.find(c => c.id === combatantId)
  if (!self || !self.position) return []

  return combatants.filter(c => {
    if (c.id === combatantId) return false
    if (!c.position) return false
    if (!isEnemySide(self.side, c.side)) return false
    return areAdjacent(self.position!, self.tokenSize, c.position, c.tokenSize)
  })
}

/**
 * Check if a combatant was adjacent before a move and is no longer adjacent after.
 * Used for shift_away AoO trigger detection.
 *
 * For multi-cell tokens (Large, Huge, Gigantic):
 * A 2x2 token shifting away from a 1x1 enemy triggers AoO if any of its cells
 * were adjacent to the enemy's cell AND none of the new cells are.
 *
 * @param moverOldPos - The moving combatant's position BEFORE the shift
 * @param moverNewPos - The moving combatant's position AFTER the shift
 * @param moverSize - Size of the moving token
 * @param observerPos - The potential reactor's position
 * @param observerSize - Size of the potential reactor's token
 * @returns true if the observer was adjacent before but not after the move
 */
export function wasAdjacentBeforeMove(
  moverOldPos: GridPosition,
  moverNewPos: GridPosition,
  moverSize: number,
  observerPos: GridPosition,
  observerSize: number
): boolean {
  const wasBefore = areAdjacent(moverOldPos, moverSize, observerPos, observerSize)
  const isAfter = areAdjacent(moverNewPos, moverSize, observerPos, observerSize)

  // Trigger only if was adjacent BEFORE and is NOT adjacent AFTER
  return wasBefore && !isAfter
}
