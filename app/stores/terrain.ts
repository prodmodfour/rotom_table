import { defineStore } from 'pinia'
import type { GridPosition, TerrainType, TerrainCell, TerrainFlags } from '~/types'

export interface TerrainState {
  enabled: boolean
  // Map of "x,y" -> TerrainCell for tracking terrain
  cells: Map<string, TerrainCell>
  // Default terrain type for cells not in the map
  defaultType: TerrainType
  // Current painting tool — base terrain type
  paintMode: TerrainType
  // Current painting flags — applied alongside paintMode
  paintFlags: TerrainFlags
  // Brush size for terrain painting
  brushSize: number
}

// Default flags (no modifiers)
export const DEFAULT_FLAGS: TerrainFlags = { rough: false, slow: false }

// Base movement costs for terrain types (without flags).
// Per decree-008: water cost is 1 (swim speed selection handles the constraint).
export const TERRAIN_COSTS: Record<TerrainType, number> = {
  normal: 1,
  difficult: 2, // Legacy — kept for backward compat rendering, migrated on import
  blocking: Infinity,
  water: 1,     // decree-008: water is basic terrain, cost 1
  earth: Infinity, // Requires burrow capability, else blocking
  rough: 1,     // Legacy — kept for backward compat rendering, migrated on import
  hazard: 1,    // Normal cost but deals damage
  elevated: 1,  // Normal cost but affects line of sight
}

// Terrain display colors — base terrain types
export const TERRAIN_COLORS: Record<TerrainType, { fill: string; stroke: string; pattern?: string }> = {
  normal: { fill: 'transparent', stroke: 'transparent' },
  difficult: { fill: 'rgba(139, 69, 19, 0.3)', stroke: 'rgba(139, 69, 19, 0.6)' }, // Legacy brown
  blocking: { fill: 'rgba(64, 64, 64, 0.8)', stroke: 'rgba(32, 32, 32, 1)' }, // Dark gray
  water: { fill: 'rgba(30, 144, 255, 0.4)', stroke: 'rgba(30, 144, 255, 0.7)' }, // Blue
  earth: { fill: 'rgba(139, 90, 43, 0.5)', stroke: 'rgba(101, 67, 33, 0.8)' }, // Dark brown
  rough: { fill: 'rgba(189, 183, 107, 0.3)', stroke: 'rgba(189, 183, 107, 0.6)' }, // Legacy khaki
  hazard: { fill: 'rgba(255, 69, 0, 0.3)', stroke: 'rgba(255, 69, 0, 0.6)' }, // Red-orange
  elevated: { fill: 'rgba(144, 238, 144, 0.3)', stroke: 'rgba(144, 238, 144, 0.6)' }, // Light green
}

// Flag overlay colors — drawn on top of base terrain color
export const FLAG_COLORS = {
  rough: { fill: 'rgba(189, 183, 107, 0.25)', stroke: 'rgba(189, 183, 107, 0.5)' },
  slow: { fill: 'rgba(139, 69, 19, 0.25)', stroke: 'rgba(139, 69, 19, 0.5)' },
}

// Helper to convert position to map key
const posToKey = (x: number, y: number): string => `${x},${y}`

/**
 * Migrate a legacy single-type terrain cell to the multi-tag format.
 * Legacy types 'difficult' and 'rough' are converted to normal + flags.
 */
export function migrateLegacyCell(cell: {
  position: GridPosition
  type: TerrainType
  elevation: number
  note?: string
  flags?: TerrainFlags
}): TerrainCell {
  // Already has flags — no migration needed
  if (cell.flags) {
    // Still migrate legacy base types even if flags are present
    if (cell.type === 'difficult') {
      return {
        ...cell,
        type: 'normal',
        flags: { ...cell.flags, slow: true },
      }
    }
    if (cell.type === 'rough') {
      return {
        ...cell,
        type: 'normal',
        flags: { ...cell.flags, rough: true },
      }
    }
    return cell as TerrainCell
  }

  // No flags — migrate legacy types
  if (cell.type === 'difficult') {
    return {
      position: cell.position,
      type: 'normal',
      flags: { rough: false, slow: true },
      elevation: cell.elevation,
      note: cell.note,
    }
  }
  if (cell.type === 'rough') {
    return {
      position: cell.position,
      type: 'normal',
      flags: { rough: true, slow: false },
      elevation: cell.elevation,
      note: cell.note,
    }
  }

  // Non-legacy type, add default flags
  return {
    position: cell.position,
    type: cell.type,
    flags: { ...DEFAULT_FLAGS },
    elevation: cell.elevation,
    note: cell.note,
  }
}

export const useTerrainStore = defineStore('terrain', {
  state: (): TerrainState => ({
    enabled: false,
    cells: new Map(),
    defaultType: 'normal',
    paintMode: 'water',
    paintFlags: { ...DEFAULT_FLAGS },
    brushSize: 1,
  }),

  getters: {
    // Get terrain type at position (base type only)
    getTerrainAt: (state) => (x: number, y: number): TerrainType => {
      const key = posToKey(x, y)
      const cell = state.cells.get(key)
      return cell?.type ?? state.defaultType
    },

    // Get terrain flags at position
    getFlagsAt: (state) => (x: number, y: number): TerrainFlags => {
      const key = posToKey(x, y)
      const cell = state.cells.get(key)
      return cell?.flags ?? { ...DEFAULT_FLAGS }
    },

    // Get full terrain cell data at position
    getCellAt: (state) => (x: number, y: number): TerrainCell | null => {
      const key = posToKey(x, y)
      return state.cells.get(key) ?? null
    },

    // Get movement cost for a cell, aggregating base terrain + flags.
    // Per decree-010: slow flag doubles movement cost. rough only affects accuracy.
    getMovementCost: (state) => (x: number, y: number, canSwim: boolean = false, canBurrow: boolean = false): number => {
      const cell = state.cells.get(posToKey(x, y))
      const terrain = cell?.type ?? state.defaultType
      const flags = cell?.flags ?? DEFAULT_FLAGS

      if (terrain === 'blocking') return Infinity
      if (terrain === 'water' && !canSwim) return Infinity
      if (terrain === 'earth') return canBurrow ? 1 : Infinity

      // Base cost from terrain type
      const baseCost = TERRAIN_COSTS[terrain]

      // Slow flag doubles movement cost (decree-010)
      return flags.slow ? baseCost * 2 : baseCost
    },

    // Check if cell is passable
    isPassable: (state) => (x: number, y: number, canSwim: boolean = false, canBurrow: boolean = false): boolean => {
      const cell = state.cells.get(posToKey(x, y))
      const terrain = cell?.type ?? state.defaultType

      if (terrain === 'blocking') return false
      if (terrain === 'water' && !canSwim) return false
      if (terrain === 'earth' && !canBurrow) return false

      return true
    },

    // Check if cell has rough flag (for accuracy penalty checks)
    isRoughAt: (state) => (x: number, y: number): boolean => {
      const cell = state.cells.get(posToKey(x, y))
      return cell?.flags?.rough ?? false
    },

    // Check if cell has slow flag
    isSlowAt: (state) => (x: number, y: number): boolean => {
      const cell = state.cells.get(posToKey(x, y))
      return cell?.flags?.slow ?? false
    },

    // Get all terrain cells as array (for serialization)
    allCells: (state): TerrainCell[] => {
      return Array.from(state.cells.values())
    },

    // Get cells of a specific type
    getCellsByType: (state) => (type: TerrainType): TerrainCell[] => {
      return Array.from(state.cells.values()).filter(cell => cell.type === type)
    },

    // Count of non-normal terrain cells
    terrainCount: (state): number => {
      return state.cells.size
    },
  },

  actions: {
    // Toggle terrain system on/off
    setEnabled(enabled: boolean) {
      this.enabled = enabled
    },

    // Set the paint mode (base terrain type to paint)
    setPaintMode(mode: TerrainType) {
      this.paintMode = mode
    },

    // Set the paint flags
    setPaintFlags(flags: TerrainFlags) {
      this.paintFlags = { ...flags }
    },

    // Toggle a single paint flag
    togglePaintFlag(flag: keyof TerrainFlags) {
      this.paintFlags = {
        ...this.paintFlags,
        [flag]: !this.paintFlags[flag],
      }
    },

    // Set brush size
    setBrushSize(size: number) {
      this.brushSize = Math.max(1, Math.min(10, size))
    },

    // Set terrain at a single cell with flags
    setTerrain(x: number, y: number, type: TerrainType, flags?: TerrainFlags, elevation: number = 0, note?: string) {
      const key = posToKey(x, y)
      const cellFlags = flags ?? { ...DEFAULT_FLAGS }

      if (type === 'normal' && !cellFlags.rough && !cellFlags.slow && elevation === 0 && !note) {
        // Remove from map if setting to fully default
        this.cells.delete(key)
      } else {
        this.cells.set(key, {
          position: { x, y },
          type,
          flags: cellFlags,
          elevation,
          note,
        })
      }
    },

    // Clear terrain at a single cell (reset to normal)
    clearTerrain(x: number, y: number) {
      const key = posToKey(x, y)
      this.cells.delete(key)
    },

    // Apply paint tool at position (uses current paintMode, paintFlags, and brushSize)
    applyTool(x: number, y: number, elevation: number = 0) {
      const radius = this.brushSize - 1

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Use Chebyshev distance for brush shape
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= radius) {
            this.setTerrain(x + dx, y + dy, this.paintMode, { ...this.paintFlags }, elevation)
          }
        }
      }
    },

    // Erase terrain in area (uses brushSize)
    eraseTool(x: number, y: number) {
      const radius = this.brushSize - 1

      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= radius) {
            this.clearTerrain(x + dx, y + dy)
          }
        }
      }
    },

    // Fill a rectangular area with terrain
    fillRect(x1: number, y1: number, x2: number, y2: number, type: TerrainType, flags?: TerrainFlags) {
      const minX = Math.min(x1, x2)
      const maxX = Math.max(x1, x2)
      const minY = Math.min(y1, y2)
      const maxY = Math.max(y1, y2)

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          this.setTerrain(x, y, type, flags)
        }
      }
    },

    // Draw a line of terrain (for walls)
    drawLine(x1: number, y1: number, x2: number, y2: number, type: TerrainType, flags?: TerrainFlags) {
      // Bresenham's line algorithm
      const dx = Math.abs(x2 - x1)
      const dy = Math.abs(y2 - y1)
      const sx = x1 < x2 ? 1 : -1
      const sy = y1 < y2 ? 1 : -1
      let err = dx - dy

      let x = x1
      let y = y1

      while (true) {
        this.setTerrain(x, y, type, flags)

        if (x === x2 && y === y2) break

        const e2 = 2 * err
        if (e2 > -dy) {
          err -= dy
          x += sx
        }
        if (e2 < dx) {
          err += dx
          y += sy
        }
      }
    },

    // Clear all terrain
    clearAll() {
      this.cells.clear()
    },

    // Reset store to initial state
    reset() {
      this.cells.clear()
      this.enabled = false
      this.paintMode = 'water'
      this.paintFlags = { ...DEFAULT_FLAGS }
      this.brushSize = 1
    },

    // Import terrain state from serialized data (with legacy migration)
    importState(data: { cells: Array<{
      position: GridPosition
      type: TerrainType
      elevation: number
      note?: string
      flags?: TerrainFlags
    }> }) {
      this.cells.clear()
      data.cells.forEach(cell => {
        const migrated = migrateLegacyCell(cell)
        const key = posToKey(migrated.position.x, migrated.position.y)
        this.cells.set(key, migrated)
      })
    },

    // Export terrain state for serialization (new format with flags)
    exportState(): { cells: Array<{
      position: GridPosition
      type: TerrainType
      flags: TerrainFlags
      elevation: number
      note?: string
    }> } {
      return {
        cells: Array.from(this.cells.values()),
      }
    },
  },
})
