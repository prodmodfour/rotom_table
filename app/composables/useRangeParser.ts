import type { RangeType, ParsedRange, GridPosition, TerrainType, TerrainCostGetter } from '~/types'
import { usePathfinding } from '~/composables/usePathfinding'
import { ptuDiagonalDistance, maxDiagonalCells } from '~/utils/gridDistance'

// Re-export VTT pathfinding types for backwards compatibility
export type { TerrainCostGetter, ElevationCostGetter, TerrainElevationGetter } from '~/types'
export type { TerrainTypeGetter, SpeedAveragingFn } from '~/composables/usePathfinding'

// Token footprint for multi-cell range calculations
export interface TokenFootprint {
  position: GridPosition
  size: number // 1 = 1x1, 2 = 2x2, 3 = 3x3, 4 = 4x4
}

/**
 * PTU Range Parser
 *
 * Parses move range strings into structured data for VTT calculations.
 *
 * PTU Range formats:
 * - "Melee" or "Melee, 1 Target" - Adjacent (range 1)
 * - "6" or "6, 1 Target" - Ranged attack at 6 meters
 * - "Burst 2" - 2-cell burst centered on a point within range
 * - "Cone 2" - 2-cell cone from user
 * - "Close Blast 2" - 2x2 square adjacent to user
 * - "Line 4" - 4-cell line from user
 * - "Ranged Blast 2" - 2x2 blast at range (needs separate range)
 * - "Self" - Affects only the user
 * - "Field" - Affects entire battlefield
 * - "Cardinally Adjacent" - Only orthogonal (not diagonal) adjacent cells
 */

export interface RangeParseResult {
  type: RangeType
  range: number        // Max range in cells (meters)
  aoeSize?: number     // Size of AoE if applicable
  targetCount?: number // Number of targets (if specified)
  width?: number       // Width for line attacks
  minRange?: number    // Minimum range (for ranged only moves)
  special?: string     // Any special notes
}

export function useRangeParser() {
  // Delegate pathfinding functions to usePathfinding composable
  const pathfinding = usePathfinding()

  /**
   * Parse a PTU range string into structured data
   */
  function parseRange(rangeString: string): RangeParseResult {
    if (!rangeString) {
      return { type: 'melee', range: 1 }
    }

    const str = rangeString.trim()
    const lower = str.toLowerCase()

    // Self-targeting
    if (lower === 'self' || lower.startsWith('self,')) {
      return { type: 'self', range: 0 }
    }

    // Field effect (entire battlefield)
    if (lower === 'field' || lower.includes('field')) {
      return { type: 'field', range: Infinity }
    }

    // Melee attacks
    if (lower === 'melee' || lower.startsWith('melee,')) {
      const targets = extractTargetCount(str)
      return { type: 'melee', range: 1, targetCount: targets }
    }

    // Cardinally adjacent
    if (lower.includes('cardinally adjacent')) {
      return { type: 'cardinally-adjacent', range: 1 }
    }

    // Burst (centered on target or self)
    const burstMatch = str.match(/burst\s*(\d+)/i)
    if (burstMatch) {
      const aoeSize = parseInt(burstMatch[1], 10)
      const baseRange = extractBaseRange(str) || 6 // Default burst range
      return { type: 'burst', range: baseRange, aoeSize }
    }

    // Cone attacks
    const coneMatch = str.match(/cone\s*(\d+)/i)
    if (coneMatch) {
      const aoeSize = parseInt(coneMatch[1], 10)
      return { type: 'cone', range: aoeSize, aoeSize }
    }

    // Close Blast (adjacent square)
    const closeBlastMatch = str.match(/close\s*blast\s*(\d+)/i)
    if (closeBlastMatch) {
      const aoeSize = parseInt(closeBlastMatch[1], 10)
      return { type: 'close-blast', range: 1, aoeSize }
    }

    // Ranged Blast (blast at range)
    const rangedBlastMatch = str.match(/(?:ranged\s*)?blast\s*(\d+)/i)
    if (rangedBlastMatch && !closeBlastMatch) {
      const aoeSize = parseInt(rangedBlastMatch[1], 10)
      const baseRange = extractBaseRange(str) || 6
      return { type: 'ranged-blast', range: baseRange, aoeSize }
    }

    // Line attacks
    const lineMatch = str.match(/line\s*(\d+)/i)
    if (lineMatch) {
      const aoeSize = parseInt(lineMatch[1], 10)
      const width = extractLineWidth(str)
      return { type: 'line', range: aoeSize, aoeSize, width }
    }

    // Simple ranged (just a number)
    const simpleRangeMatch = str.match(/^(\d+)(?:\s*,|\s*$)/i)
    if (simpleRangeMatch) {
      const range = parseInt(simpleRangeMatch[1], 10)
      const targets = extractTargetCount(str)
      return { type: 'ranged', range, targetCount: targets }
    }

    // Numeric range somewhere in string
    const numMatch = str.match(/(\d+)/i)
    if (numMatch) {
      const range = parseInt(numMatch[1], 10)
      return { type: 'ranged', range }
    }

    // Default to melee if unparseable
    return { type: 'melee', range: 1, special: str }
  }

  /**
   * Extract target count from range string
   */
  function extractTargetCount(str: string): number | undefined {
    const targetMatch = str.match(/(\d+)\s*target/i)
    return targetMatch ? parseInt(targetMatch[1], 10) : undefined
  }

  /**
   * Extract base range from compound range strings
   */
  function extractBaseRange(str: string): number | undefined {
    // Look for standalone number before AoE type
    const match = str.match(/^(\d+)[,\s]/i)
    return match ? parseInt(match[1], 10) : undefined
  }

  /**
   * Extract line width for wide line attacks
   */
  function extractLineWidth(str: string): number {
    const widthMatch = str.match(/(\d+)\s*wide/i)
    return widthMatch ? parseInt(widthMatch[1], 10) : 1
  }

  /**
   * Get all cells occupied by a token.
   * A token at (x, y) with size s occupies cells from (x, y) to (x+s-1, y+s-1).
   */
  function getOccupiedCells(token: TokenFootprint): GridPosition[] {
    const cells: GridPosition[] = []
    for (let dx = 0; dx < token.size; dx++) {
      for (let dy = 0; dy < token.size; dy++) {
        cells.push({ x: token.position.x + dx, y: token.position.y + dy })
      }
    }
    return cells
  }

  /**
   * Calculate minimum PTU diagonal distance between two multi-cell tokens.
   *
   * PTU Rule (decree-002): All grid distances use the alternating diagonal rule
   * (1-2-1-2). Range is measured from the nearest occupied cell of the
   * attacker to the nearest occupied cell of the target.
   *
   * Computes the gap between token bounding boxes and applies ptuDiagonalDistance.
   */
  function ptuDistanceTokens(
    a: TokenFootprint,
    b: TokenFootprint
  ): number {
    const aRight = a.position.x + a.size - 1
    const aBottom = a.position.y + a.size - 1
    const bRight = b.position.x + b.size - 1
    const bBottom = b.position.y + b.size - 1

    const gapX = Math.max(0, a.position.x - bRight, b.position.x - aRight)
    const gapY = Math.max(0, a.position.y - bBottom, b.position.y - aBottom)

    return ptuDiagonalDistance(gapX, gapY)
  }

  /**
   * Find the closest pair of cells between two tokens (for LoS tracing).
   * Returns the pair of cells (one from each token) that have the minimum
   * PTU diagonal distance between them.
   */
  function closestCellPair(
    a: TokenFootprint,
    b: TokenFootprint
  ): { from: GridPosition; to: GridPosition } {
    // For single-cell tokens, just return positions directly
    if (a.size === 1 && b.size === 1) {
      return { from: a.position, to: b.position }
    }

    const aCells = getOccupiedCells(a)
    const bCells = getOccupiedCells(b)

    let bestDist = Infinity
    let bestFrom = a.position
    let bestTo = b.position

    for (const ac of aCells) {
      for (const bc of bCells) {
        const dist = ptuDiagonalDistance(ac.x - bc.x, ac.y - bc.y)
        if (dist < bestDist) {
          bestDist = dist
          bestFrom = ac
          bestTo = bc
        }
      }
    }

    return { from: bestFrom, to: bestTo }
  }

  /**
   * Check if there is an unobstructed line of sight between two grid positions.
   * Uses Bresenham's line algorithm to trace cells along the path.
   *
   * PTU Rule: Blocking terrain blocks both movement AND targeting/line of sight.
   * Cells occupied by the attacker or the target are excluded from the check.
   *
   * @param from - Origin position (attacker)
   * @param to - Target position
   * @param isBlockingFn - Function that returns true if a cell blocks line of sight
   */
  function hasLineOfSight(
    from: GridPosition,
    to: GridPosition,
    isBlockingFn: (x: number, y: number) => boolean
  ): boolean {
    // Same cell always has LoS
    if (from.x === to.x && from.y === to.y) return true

    // Bresenham's line from center-of-cell to center-of-cell
    let x0 = from.x
    let y0 = from.y
    const x1 = to.x
    const y1 = to.y

    const dx = Math.abs(x1 - x0)
    const dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1
    const sy = y0 < y1 ? 1 : -1
    let err = dx - dy

    while (true) {
      // Skip the origin and destination cells — only check intermediate cells
      if (!(x0 === from.x && y0 === from.y) && !(x0 === to.x && y0 === to.y)) {
        if (isBlockingFn(x0, y0)) {
          return false
        }
      }

      if (x0 === x1 && y0 === y1) break

      const e2 = 2 * err
      if (e2 > -dy) {
        err -= dy
        x0 += sx
      }
      if (e2 < dx) {
        err += dx
        y0 += sy
      }
    }

    return true
  }

  /**
   * Check if a target position is within range of an attacker.
   *
   * Supports multi-cell tokens via optional attackerSize and targetSize params.
   * PTU Rule: Range for multi-cell tokens is measured from the nearest occupied
   * cell of the attacker to the nearest cell of the target.
   *
   * When an isBlockingFn is provided, also checks line of sight —
   * blocking terrain between attacker and target prevents targeting
   * per PTU rules.
   */
  function isInRange(
    attacker: GridPosition,
    target: GridPosition,
    parsedRange: RangeParseResult,
    isBlockingFn?: (x: number, y: number) => boolean,
    attackerSize: number = 1,
    targetSize: number = 1
  ): boolean {
    // Self only affects user — for multi-cell, check if target overlaps attacker footprint
    if (parsedRange.type === 'self') {
      if (attackerSize === 1 && targetSize === 1) {
        return attacker.x === target.x && attacker.y === target.y
      }
      // Multi-cell self: target cell must overlap attacker footprint
      const attackerFootprint = { position: attacker, size: attackerSize }
      const targetFootprint = { position: target, size: targetSize }
      return ptuDistanceTokens(attackerFootprint, targetFootprint) === 0
    }

    // Field affects everyone
    if (parsedRange.type === 'field') {
      return true
    }

    // Build footprints for multi-cell distance calculation
    const attackerFootprint: TokenFootprint = { position: attacker, size: attackerSize }
    const targetFootprint: TokenFootprint = { position: target, size: targetSize }

    // Calculate PTU diagonal distance between nearest cells (decree-002)
    const distance = ptuDistanceTokens(attackerFootprint, targetFootprint)

    // Cardinally adjacent - only orthogonal between nearest cells
    if (parsedRange.type === 'cardinally-adjacent') {
      if (distance !== 1) return false
      // Check that adjacency is cardinal (not diagonal)
      const { from: nearFrom, to: nearTo } = closestCellPair(attackerFootprint, targetFootprint)
      const dx = Math.abs(nearTo.x - nearFrom.x)
      const dy = Math.abs(nearTo.y - nearFrom.y)
      const isCardinal = (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
      if (!isCardinal) return false
      if (isBlockingFn) {
        return hasLineOfSight(nearFrom, nearTo, isBlockingFn)
      }
      return true
    }

    // Check min range if applicable
    if (parsedRange.minRange && distance < parsedRange.minRange) {
      return false
    }

    if (distance > parsedRange.range) {
      return false
    }

    // Check line of sight between closest cells if blocking function provided
    if (isBlockingFn) {
      const { from: losFrom, to: losTo } = closestCellPair(attackerFootprint, targetFootprint)
      return hasLineOfSight(losFrom, losTo, isBlockingFn)
    }

    return true
  }

  /**
   * Get all cells that would be affected by an AoE attack
   */
  function getAffectedCells(
    origin: GridPosition,
    direction: { dx: number; dy: number },
    parsedRange: RangeParseResult
  ): GridPosition[] {
    const cells: GridPosition[] = []
    const size = parsedRange.aoeSize || 1

    switch (parsedRange.type) {
      case 'burst':
        // Burst N includes cells whose PTU diagonal distance from center <= N
        // Per decree-002 and decree-023: all distance uses PTU alternating diagonal.
        // This produces a diamond shape, not a filled square.
        for (let dx = -size; dx <= size; dx++) {
          for (let dy = -size; dy <= size; dy++) {
            if (ptuDiagonalDistance(dx, dy) <= size) {
              cells.push({ x: origin.x + dx, y: origin.y + dy })
            }
          }
        }
        break

      case 'cone':
        // Cone from origin in direction (decree-007: fixed 3m-wide rows)
        // d=1: 1 cell (center only), d=2+: 3 cells wide (1 center + 1 each side)
        for (let d = 1; d <= size; d++) {
          const baseX = origin.x + direction.dx * d
          const baseY = origin.y + direction.dy * d
          const halfWidth = d === 1 ? 0 : 1

          if (direction.dx === 0) {
            for (let w = -halfWidth; w <= halfWidth; w++) {
              cells.push({ x: baseX + w, y: baseY })
            }
          } else if (direction.dy === 0) {
            for (let w = -halfWidth; w <= halfWidth; w++) {
              cells.push({ x: baseX, y: baseY + w })
            }
          } else {
            for (let w = -halfWidth; w <= halfWidth; w++) {
              cells.push({ x: baseX + w, y: baseY })
              cells.push({ x: baseX, y: baseY + w })
            }
          }
        }
        break

      case 'close-blast':
      case 'ranged-blast':
        // Square blast
        const startX = origin.x + direction.dx
        const startY = origin.y + direction.dy
        for (let dx = 0; dx < size; dx++) {
          for (let dy = 0; dy < size; dy++) {
            const cellX = direction.dx >= 0 ? startX + dx : startX - dx
            const cellY = direction.dy >= 0 ? startY + dy : startY - dy
            cells.push({ x: cellX, y: cellY })
          }
        }
        break

      case 'line': {
        // Line from origin in direction (decree-009: diagonal lines shortened)
        const width = parsedRange.width || 1
        const isDiagonal = direction.dx !== 0 && direction.dy !== 0
        // Diagonal lines cover fewer cells because each diagonal step costs
        // alternating 1-2m per PTU rules. Cardinal lines use 1 cell per meter.
        const maxCells = isDiagonal ? maxDiagonalCells(size) : size
        for (let d = 1; d <= maxCells; d++) {
          const baseX = origin.x + direction.dx * d
          const baseY = origin.y + direction.dy * d
          cells.push({ x: baseX, y: baseY })

          // Add width
          if (width > 1) {
            const halfWidth = Math.floor(width / 2)
            for (let w = 1; w <= halfWidth; w++) {
              if (direction.dx === 0) {
                cells.push({ x: baseX - w, y: baseY })
                cells.push({ x: baseX + w, y: baseY })
              } else if (direction.dy === 0) {
                cells.push({ x: baseX, y: baseY - w })
                cells.push({ x: baseX, y: baseY + w })
              }
            }
          }
        }
        break
      }

      case 'melee':
      case 'cardinally-adjacent':
        // Single target at position
        cells.push(origin)
        break

      default:
        cells.push(origin)
    }

    // Remove duplicates
    return cells.filter((cell, index, arr) =>
      arr.findIndex(c => c.x === cell.x && c.y === cell.y) === index
    )
  }

  return {
    parseRange,
    isInRange,
    hasLineOfSight,
    getOccupiedCells,
    ptuDistanceTokens,
    closestCellPair,
    getAffectedCells,
    // Re-exported from usePathfinding for backwards compatibility
    getMovementRangeCells: pathfinding.getMovementRangeCells,
    getMovementRangeCellsWithAveraging: pathfinding.getMovementRangeCellsWithAveraging,
    calculateMoveCost: pathfinding.calculateMoveCost,
    validateMovement: pathfinding.validateMovement,
    calculatePathCost: pathfinding.calculatePathCost,
  }
}
