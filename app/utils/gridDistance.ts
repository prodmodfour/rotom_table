/**
 * PTU grid distance utilities.
 *
 * PTU uses alternating diagonal movement: first diagonal costs 1m,
 * second costs 2m, third costs 1m, etc.  The closed-form formula
 * for total diagonal cost is: diagonals + floor(diagonals / 2).
 */

/**
 * Calculate the PTU diagonal distance between two axis deltas.
 *
 * Implements the PTU alternating diagonal movement rule:
 *   diagonals + floor(diagonals / 2) + straights
 *
 * @param dx - Horizontal distance (may be negative; absolute value is used)
 * @param dy - Vertical distance (may be negative; absolute value is used)
 * @returns Movement cost in meters (cells)
 */
export function ptuDiagonalDistance(dx: number, dy: number): number {
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  const diagonals = Math.min(absDx, absDy)
  const straights = Math.abs(absDx - absDy)
  return diagonals + Math.floor(diagonals / 2) + straights
}
