import { defineStore } from 'pinia'
import type { GridPosition, RangeType, ParsedRange } from '~/types'
import { ptuDiagonalDistance, ptuDistanceTokensBBox, maxDiagonalCells } from '~/utils/gridDistance'

export type MeasurementMode = 'none' | 'distance' | 'burst' | 'cone' | 'line' | 'close-blast'

export interface MeasurementState {
  mode: MeasurementMode
  isActive: boolean
  startPosition: GridPosition | null
  endPosition: GridPosition | null
  // Token metadata for edge-to-edge distance (multi-cell tokens)
  startTokenOrigin: GridPosition | null
  startTokenSize: number
  endTokenOrigin: GridPosition | null
  endTokenSize: number
  // For AoE shapes
  aoeSize: number
  aoeDirection: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest'
}

export interface MeasurementResult {
  distance: number // In cells (PTU: 1 cell = 1 meter)
  affectedCells: GridPosition[]
  originCell: GridPosition
  path: GridPosition[] // For line measurements
}

export const useMeasurementStore = defineStore('measurement', {
  state: (): MeasurementState => ({
    mode: 'none',
    isActive: false,
    startPosition: null,
    endPosition: null,
    startTokenOrigin: null,
    startTokenSize: 1,
    endTokenOrigin: null,
    endTokenSize: 1,
    aoeSize: 2,
    aoeDirection: 'north',
  }),

  getters: {
    // Calculate distance between start and end positions using PTU alternating diagonal rule.
    // When multi-cell token metadata is available, uses edge-to-edge distance via
    // ptuDistanceTokens for accurate measurement between large tokens.
    distance: (state): number => {
      if (!state.startPosition || !state.endPosition) return 0

      // Use token-aware edge-to-edge distance when either endpoint has a multi-cell token
      const hasStartToken = state.startTokenOrigin !== null && state.startTokenSize > 1
      const hasEndToken = state.endTokenOrigin !== null && state.endTokenSize > 1

      if (hasStartToken || hasEndToken) {
        const startFootprint = {
          position: state.startTokenOrigin ?? state.startPosition,
          size: state.startTokenSize,
        }
        const endFootprint = {
          position: state.endTokenOrigin ?? state.endPosition,
          size: state.endTokenSize,
        }
        return ptuDistanceTokensBBox(startFootprint, endFootprint)
      }

      return ptuDiagonalDistance(
        state.endPosition.x - state.startPosition.x,
        state.endPosition.y - state.startPosition.y
      )
    },

    // Get affected cells based on current measurement mode
    affectedCells: (state): GridPosition[] => {
      if (!state.startPosition) return []

      switch (state.mode) {
        case 'distance':
          return state.endPosition ? getLineCells(state.startPosition, state.endPosition) : []

        case 'burst':
          return getBurstCells(state.startPosition, state.aoeSize)

        case 'cone':
          return getConeCells(state.startPosition, state.aoeSize, state.aoeDirection)

        case 'line':
          return getLineAttackCells(state.startPosition, state.aoeSize, state.aoeDirection)

        case 'close-blast':
          return getCloseBlastCells(state.startPosition, state.aoeSize, state.aoeDirection)

        default:
          return []
      }
    },

    // Get measurement as a result object
    result(): MeasurementResult | null {
      if (!this.startPosition) return null

      return {
        distance: this.distance,
        affectedCells: this.affectedCells,
        originCell: this.startPosition,
        path: this.mode === 'distance' && this.endPosition
          ? getLineCells(this.startPosition, this.endPosition)
          : [],
      }
    },
  },

  actions: {
    setMode(mode: MeasurementMode) {
      this.mode = mode
      if (mode === 'none') {
        this.clearMeasurement()
      }
    },

    startMeasurement(
      position: GridPosition,
      tokenOrigin?: GridPosition,
      tokenSize?: number
    ) {
      this.isActive = true
      this.startPosition = { ...position }
      this.endPosition = { ...position }
      this.startTokenOrigin = tokenOrigin ? { ...tokenOrigin } : null
      this.startTokenSize = tokenSize ?? 1
      this.endTokenOrigin = null
      this.endTokenSize = 1
    },

    updateMeasurement(
      position: GridPosition,
      tokenOrigin?: GridPosition,
      tokenSize?: number
    ) {
      if (this.isActive) {
        this.endPosition = { ...position }
        this.endTokenOrigin = tokenOrigin ? { ...tokenOrigin } : null
        this.endTokenSize = tokenSize ?? 1
      }
    },

    endMeasurement() {
      this.isActive = false
    },

    clearMeasurement() {
      this.isActive = false
      this.startPosition = null
      this.endPosition = null
      this.startTokenOrigin = null
      this.startTokenSize = 1
      this.endTokenOrigin = null
      this.endTokenSize = 1
    },

    setAoeSize(size: number) {
      this.aoeSize = Math.max(1, Math.min(10, size))
    },

    setAoeDirection(direction: MeasurementState['aoeDirection']) {
      this.aoeDirection = direction
    },

    cycleDirection() {
      const directions: MeasurementState['aoeDirection'][] = [
        'north', 'northeast', 'east', 'southeast',
        'south', 'southwest', 'west', 'northwest'
      ]
      const currentIndex = directions.indexOf(this.aoeDirection)
      this.aoeDirection = directions[(currentIndex + 1) % directions.length]
    },
  },
})

// Helper functions for calculating affected cells

function getLineCells(start: GridPosition, end: GridPosition, width: number = 1): GridPosition[] {
  const cells: GridPosition[] = []

  // Bresenham's line algorithm
  let x0 = start.x
  let y0 = start.y
  const x1 = end.x
  const y1 = end.y

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  while (true) {
    cells.push({ x: x0, y: y0 })

    // For wider lines, add adjacent cells
    if (width > 1) {
      const halfWidth = Math.floor(width / 2)
      for (let w = 1; w <= halfWidth; w++) {
        // Perpendicular to line direction
        if (dx > dy) {
          cells.push({ x: x0, y: y0 - w })
          cells.push({ x: x0, y: y0 + w })
        } else {
          cells.push({ x: x0 - w, y: y0 })
          cells.push({ x: x0 + w, y: y0 })
        }
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

  return cells
}

function getBurstCells(center: GridPosition, radius: number): GridPosition[] {
  const cells: GridPosition[] = []

  // Burst N includes cells whose PTU diagonal distance from center <= N
  // Per decree-002 and decree-023: all distance uses PTU alternating diagonal.
  // This produces a diamond shape, not a filled square.
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      if (ptuDiagonalDistance(dx, dy) <= radius) {
        cells.push({ x: center.x + dx, y: center.y + dy })
      }
    }
  }

  return cells
}

function getConeCells(
  origin: GridPosition,
  length: number,
  direction: MeasurementState['aoeDirection']
): GridPosition[] {
  const cells: GridPosition[] = []

  // Direction vectors
  const dirVectors: Record<MeasurementState['aoeDirection'], { dx: number; dy: number }> = {
    north: { dx: 0, dy: -1 },
    south: { dx: 0, dy: 1 },
    east: { dx: 1, dy: 0 },
    west: { dx: -1, dy: 0 },
    northeast: { dx: 1, dy: -1 },
    northwest: { dx: -1, dy: -1 },
    southeast: { dx: 1, dy: 1 },
    southwest: { dx: -1, dy: 1 },
  }

  const dir = dirVectors[direction]

  // Cone with fixed 3m-wide rows per PTU (decree-007)
  // d=1: 1 cell (center only), d=2+: 3 cells wide (1 center + 1 each side)
  for (let d = 1; d <= length; d++) {
    const baseX = origin.x + dir.dx * d
    const baseY = origin.y + dir.dy * d

    // Width at this distance: d=1 is 1 cell, d=2+ is 3 cells
    const halfWidth = d === 1 ? 0 : 1

    // Perpendicular expansion
    if (dir.dx === 0) {
      // Vertical cone
      for (let w = -halfWidth; w <= halfWidth; w++) {
        cells.push({ x: baseX + w, y: baseY })
      }
    } else if (dir.dy === 0) {
      // Horizontal cone
      for (let w = -halfWidth; w <= halfWidth; w++) {
        cells.push({ x: baseX, y: baseY + w })
      }
    } else {
      // Diagonal cone - expand in both perpendicular directions
      for (let w = -halfWidth; w <= halfWidth; w++) {
        cells.push({ x: baseX + w, y: baseY })
        cells.push({ x: baseX, y: baseY + w })
        cells.push({ x: baseX + w, y: baseY + w })
      }
    }
  }

  // Remove duplicates
  const unique = cells.filter((cell, index, arr) =>
    arr.findIndex(c => c.x === cell.x && c.y === cell.y) === index
  )

  return unique
}

function getCloseBlastCells(
  origin: GridPosition,
  size: number,
  direction: MeasurementState['aoeDirection']
): GridPosition[] {
  const cells: GridPosition[] = []

  // Close blast is a square adjacent to the user
  const dirOffsets: Record<MeasurementState['aoeDirection'], { dx: number; dy: number }> = {
    north: { dx: 0, dy: -1 },
    south: { dx: 0, dy: 1 },
    east: { dx: 1, dy: 0 },
    west: { dx: -1, dy: 0 },
    northeast: { dx: 1, dy: -1 },
    northwest: { dx: -1, dy: -1 },
    southeast: { dx: 1, dy: 1 },
    southwest: { dx: -1, dy: 1 },
  }

  const offset = dirOffsets[direction]

  // Calculate corner of the blast area
  const startX = origin.x + offset.dx
  const startY = origin.y + offset.dy

  // Generate square of cells
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      const cellX = offset.dx >= 0 ? startX + dx : startX - dx
      const cellY = offset.dy >= 0 ? startY + dy : startY - dy
      cells.push({ x: cellX, y: cellY })
    }
  }

  return cells
}

/**
 * Calculate cells for a Line X attack from origin in a given direction.
 * Diagonal lines are shortened per PTU alternating diagonal rule (decree-009).
 *
 * Cardinal lines: X cells (1 meter per cell).
 * Diagonal lines: maxDiagonalCells(X) cells (alternating 1-2m cost per cell).
 */
function getLineAttackCells(
  origin: GridPosition,
  length: number,
  direction: MeasurementState['aoeDirection']
): GridPosition[] {
  const cells: GridPosition[] = []

  const dirVectors: Record<MeasurementState['aoeDirection'], { dx: number; dy: number }> = {
    north: { dx: 0, dy: -1 },
    south: { dx: 0, dy: 1 },
    east: { dx: 1, dy: 0 },
    west: { dx: -1, dy: 0 },
    northeast: { dx: 1, dy: -1 },
    northwest: { dx: -1, dy: -1 },
    southeast: { dx: 1, dy: 1 },
    southwest: { dx: -1, dy: 1 },
  }

  const dir = dirVectors[direction]
  const isDiagonal = dir.dx !== 0 && dir.dy !== 0
  const maxCells = isDiagonal ? maxDiagonalCells(length) : length

  for (let d = 1; d <= maxCells; d++) {
    cells.push({ x: origin.x + dir.dx * d, y: origin.y + dir.dy * d })
  }

  return cells
}
