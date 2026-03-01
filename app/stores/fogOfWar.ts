import { defineStore } from 'pinia'
import type { GridPosition } from '~/types'

export type FogState = 'hidden' | 'revealed' | 'explored'

export interface FogOfWarState {
  enabled: boolean
  // Map of "x,y" -> FogState for tracking visibility
  cellStates: Map<string, FogState>
  // Default state for cells not in the map
  defaultState: FogState
  // Brush size for reveal/hide tools
  brushSize: number
  // Current tool mode
  toolMode: 'reveal' | 'hide' | 'explore'
}

// Helper to convert position to map key
const posToKey = (x: number, y: number): string => `${x},${y}`
const keyToPos = (key: string): GridPosition => {
  const [x, y] = key.split(',').map(Number)
  return { x, y }
}

export const useFogOfWarStore = defineStore('fogOfWar', {
  state: (): FogOfWarState => ({
    enabled: false,
    cellStates: new Map(),
    defaultState: 'hidden',
    brushSize: 1,
    toolMode: 'reveal',
  }),

  getters: {
    // Check if a specific cell is visible
    isVisible: (state) => (x: number, y: number): boolean => {
      const key = posToKey(x, y)
      const cellState = state.cellStates.get(key) ?? state.defaultState
      return cellState === 'revealed' || cellState === 'explored'
    },

    // Get the state of a specific cell
    getCellState: (state) => (x: number, y: number): FogState => {
      const key = posToKey(x, y)
      return state.cellStates.get(key) ?? state.defaultState
    },

    // Get all revealed cells as array
    revealedCells: (state): GridPosition[] => {
      const cells: GridPosition[] = []
      state.cellStates.forEach((fogState, key) => {
        if (fogState === 'revealed') {
          cells.push(keyToPos(key))
        }
      })
      return cells
    },

    // Get all explored cells as array
    exploredCells: (state): GridPosition[] => {
      const cells: GridPosition[] = []
      state.cellStates.forEach((fogState, key) => {
        if (fogState === 'explored') {
          cells.push(keyToPos(key))
        }
      })
      return cells
    },

    // Count of visible cells
    visibleCount: (state): number => {
      let count = 0
      state.cellStates.forEach((fogState) => {
        if (fogState === 'revealed' || fogState === 'explored') {
          count++
        }
      })
      return count
    },
  },

  actions: {
    // Toggle fog of war on/off
    setEnabled(enabled: boolean) {
      this.enabled = enabled
    },

    // Set the tool mode
    setToolMode(mode: FogOfWarState['toolMode']) {
      this.toolMode = mode
    },

    // Set brush size
    setBrushSize(size: number) {
      this.brushSize = Math.max(1, Math.min(10, size))
    },

    // Reveal a single cell (fully visible)
    revealCell(x: number, y: number) {
      const key = posToKey(x, y)
      this.cellStates.set(key, 'revealed')
    },

    // Hide a single cell
    hideCell(x: number, y: number) {
      const key = posToKey(x, y)
      this.cellStates.set(key, 'hidden')
    },

    // Set cell to explored state (dimmed but visible)
    exploreCell(x: number, y: number) {
      const key = posToKey(x, y)
      this.cellStates.set(key, 'explored')
    },

    // Reveal cells in a circular area (uses Chebyshev distance for PTU)
    revealArea(centerX: number, centerY: number, radius: number) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Use Chebyshev distance (PTU rules)
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= radius) {
            this.revealCell(centerX + dx, centerY + dy)
          }
        }
      }
    },

    // Hide cells in a circular area
    hideArea(centerX: number, centerY: number, radius: number) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= radius) {
            this.hideCell(centerX + dx, centerY + dy)
          }
        }
      }
    },

    // Mark area as explored
    exploreArea(centerX: number, centerY: number, radius: number) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= radius) {
            this.exploreCell(centerX + dx, centerY + dy)
          }
        }
      }
    },

    /**
     * Reveal cells visible from a multi-cell token footprint.
     * For a token at (x, y) with size s, reveals cells within Chebyshev
     * distance of `radius` from any cell in the footprint rectangle.
     *
     * This effectively reveals a larger area because a large token
     * "sees" from every cell it occupies.
     *
     * NOTE: Not yet wired into token movement handlers. The caller
     * (encounter-level auto-reveal on movement) requires fog vision
     * radius configuration that is outside the P1 multi-tile scope.
     * Follow-up: wire into encounter page token move handler when
     * fog-of-war auto-reveal is implemented.
     */
    revealFootprintArea(
      originX: number,
      originY: number,
      size: number,
      radius: number
    ) {
      // Compute the expanded bounding box
      const minX = originX - radius
      const maxX = originX + size - 1 + radius
      const minY = originY - radius
      const maxY = originY + size - 1 + radius

      // Footprint rectangle bounds
      const footX1 = originX
      const footY1 = originY
      const footX2 = originX + size - 1
      const footY2 = originY + size - 1

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          // Chebyshev distance from (x, y) to nearest cell in footprint rect
          const dx = Math.max(0, footX1 - x, x - footX2)
          const dy = Math.max(0, footY1 - y, y - footY2)
          const distToFootprint = Math.max(dx, dy)
          if (distToFootprint <= radius) {
            this.revealCell(x, y)
          }
        }
      }
    },

    // Apply tool at position based on current mode
    applyTool(x: number, y: number) {
      const radius = this.brushSize - 1

      switch (this.toolMode) {
        case 'reveal':
          this.revealArea(x, y, radius)
          break
        case 'hide':
          this.hideArea(x, y, radius)
          break
        case 'explore':
          this.exploreArea(x, y, radius)
          break
      }
    },

    // Reveal all cells in a rectangular area
    revealRect(x1: number, y1: number, x2: number, y2: number) {
      const minX = Math.min(x1, x2)
      const maxX = Math.max(x1, x2)
      const minY = Math.min(y1, y2)
      const maxY = Math.max(y1, y2)

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          this.revealCell(x, y)
        }
      }
    },

    // Hide all cells in a rectangular area
    hideRect(x1: number, y1: number, x2: number, y2: number) {
      const minX = Math.min(x1, x2)
      const maxX = Math.max(x1, x2)
      const minY = Math.min(y1, y2)
      const maxY = Math.max(y1, y2)

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          this.hideCell(x, y)
        }
      }
    },

    // Reveal all cells (clear fog)
    revealAll(gridWidth: number, gridHeight: number) {
      for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
          this.revealCell(x, y)
        }
      }
    },

    // Hide all cells (full fog)
    hideAll() {
      this.cellStates.clear()
      this.defaultState = 'hidden'
    },

    // Clear all custom states (reset to default)
    reset() {
      this.cellStates.clear()
      this.enabled = false
      this.brushSize = 1
      this.toolMode = 'reveal'
    },

    // Import fog state from serialized data
    importState(data: { cells: [string, FogState][], defaultState: FogState }) {
      this.cellStates = new Map(data.cells)
      this.defaultState = data.defaultState
    },

    // Export fog state for serialization
    exportState(): { cells: [string, FogState][], defaultState: FogState } {
      return {
        cells: Array.from(this.cellStates.entries()),
        defaultState: this.defaultState,
      }
    },
  },
})
