import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTerrainStore, TERRAIN_COSTS, TERRAIN_COLORS, DEFAULT_FLAGS, FLAG_COLORS } from '~/stores/terrain'

describe('terrain store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should have correct default values', () => {
      const store = useTerrainStore()

      expect(store.enabled).toBe(false)
      expect(store.cells.size).toBe(0)
      expect(store.defaultType).toBe('normal')
      expect(store.paintMode).toBe('water')
      expect(store.brushSize).toBe(1)
    })

    it('should have default paint flags', () => {
      const store = useTerrainStore()

      expect(store.paintFlags).toEqual({ rough: false, slow: false })
    })
  })

  describe('exported constants', () => {
    it('should have correct DEFAULT_FLAGS', () => {
      expect(DEFAULT_FLAGS).toEqual({ rough: false, slow: false })
    })

    it('should have FLAG_COLORS for rough and slow', () => {
      expect(FLAG_COLORS.rough).toBeDefined()
      expect(FLAG_COLORS.rough.fill).toBeDefined()
      expect(FLAG_COLORS.rough.stroke).toBeDefined()
      expect(FLAG_COLORS.slow).toBeDefined()
      expect(FLAG_COLORS.slow.fill).toBeDefined()
      expect(FLAG_COLORS.slow.stroke).toBeDefined()
    })
  })

  describe('terrain types', () => {
    it('should have correct movement costs', () => {
      expect(TERRAIN_COSTS.normal).toBe(1)
      expect(TERRAIN_COSTS.difficult).toBe(2)
      expect(TERRAIN_COSTS.blocking).toBe(Infinity)
      expect(TERRAIN_COSTS.water).toBe(1)
      expect(TERRAIN_COSTS.earth).toBe(Infinity)
      expect(TERRAIN_COSTS.rough).toBe(1)
      expect(TERRAIN_COSTS.hazard).toBe(1)
      expect(TERRAIN_COSTS.elevated).toBe(1)
    })

    it('should have colors defined for all terrain types', () => {
      const terrainTypes = ['normal', 'difficult', 'blocking', 'water', 'earth', 'rough', 'hazard', 'elevated'] as const

      terrainTypes.forEach(type => {
        expect(TERRAIN_COLORS[type]).toBeDefined()
        expect(TERRAIN_COLORS[type].fill).toBeDefined()
        expect(TERRAIN_COLORS[type].stroke).toBeDefined()
      })
    })
  })

  describe('setTerrain', () => {
    it('should set terrain at a position', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'blocking')

      expect(store.getTerrainAt(5, 5)).toBe('blocking')
      expect(store.cells.size).toBe(1)
    })

    it('should remove cell when setting to normal (default)', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'blocking')
      expect(store.cells.size).toBe(1)

      store.setTerrain(5, 5, 'normal')
      expect(store.cells.size).toBe(0)
    })

    it('should store elevation', () => {
      const store = useTerrainStore()

      store.setTerrain(3, 3, 'elevated', undefined, 5)

      const cell = store.getCellAt(3, 3)
      expect(cell).not.toBeNull()
      expect(cell?.elevation).toBe(5)
    })

    it('should store notes', () => {
      const store = useTerrainStore()

      store.setTerrain(3, 3, 'hazard', undefined, 0, 'Lava pit')

      const cell = store.getCellAt(3, 3)
      expect(cell?.note).toBe('Lava pit')
    })

    it('should store flags', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'water', { rough: true, slow: false })

      const cell = store.getCellAt(5, 5)
      expect(cell?.flags).toEqual({ rough: true, slow: false })
    })

    it('should default flags to DEFAULT_FLAGS when not provided', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'water')

      const cell = store.getCellAt(5, 5)
      expect(cell?.flags).toEqual({ rough: false, slow: false })
    })

    it('should convert legacy difficult type to normal + slow flag', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'difficult')

      expect(store.getTerrainAt(5, 5)).toBe('normal')
      const cell = store.getCellAt(5, 5)
      expect(cell?.flags.slow).toBe(true)
    })

    it('should convert legacy rough type to normal + rough flag', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'rough')

      expect(store.getTerrainAt(5, 5)).toBe('normal')
      const cell = store.getCellAt(5, 5)
      expect(cell?.flags.rough).toBe(true)
    })

    it('should merge legacy conversion flags with provided flags', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'difficult', { rough: true, slow: false })

      const cell = store.getCellAt(5, 5)
      expect(cell?.type).toBe('normal')
      expect(cell?.flags).toEqual({ rough: true, slow: true })
    })
  })

  describe('getTerrainAt', () => {
    it('should return default type for empty cells', () => {
      const store = useTerrainStore()

      expect(store.getTerrainAt(10, 10)).toBe('normal')
    })

    it('should return set terrain type', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'blocking')

      expect(store.getTerrainAt(5, 5)).toBe('blocking')
    })
  })

  describe('getFlagsAt', () => {
    it('should return default flags for empty cells', () => {
      const store = useTerrainStore()

      expect(store.getFlagsAt(10, 10)).toEqual({ rough: false, slow: false })
    })

    it('should return flags for set cell', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'water', { rough: true, slow: true })

      expect(store.getFlagsAt(5, 5)).toEqual({ rough: true, slow: true })
    })
  })

  describe('isRoughAt', () => {
    it('should return false for empty cells', () => {
      const store = useTerrainStore()

      expect(store.isRoughAt(10, 10)).toBe(false)
    })

    it('should return true for cells with rough flag', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'normal', { rough: true, slow: false })

      expect(store.isRoughAt(5, 5)).toBe(true)
    })

    it('should return false for cells without rough flag', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'water', { rough: false, slow: true })

      expect(store.isRoughAt(5, 5)).toBe(false)
    })
  })

  describe('isSlowAt', () => {
    it('should return false for empty cells', () => {
      const store = useTerrainStore()

      expect(store.isSlowAt(10, 10)).toBe(false)
    })

    it('should return true for cells with slow flag', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'normal', { rough: false, slow: true })

      expect(store.isSlowAt(5, 5)).toBe(true)
    })

    it('should return false for cells without slow flag', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'water', { rough: true, slow: false })

      expect(store.isSlowAt(5, 5)).toBe(false)
    })
  })

  describe('getMovementCost', () => {
    it('should return 1 for normal terrain', () => {
      const store = useTerrainStore()

      expect(store.getMovementCost(0, 0)).toBe(1)
    })

    it('should return 2 for normal terrain with slow flag', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'normal', { rough: false, slow: true })

      expect(store.getMovementCost(0, 0)).toBe(2)
    })

    it('should return 1 for normal terrain with rough flag (rough has no cost impact)', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'normal', { rough: true, slow: false })

      expect(store.getMovementCost(0, 0)).toBe(1)
    })

    it('should return 2 for legacy difficult terrain (auto-converted to normal + slow)', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'difficult')

      expect(store.getMovementCost(0, 0)).toBe(2)
    })

    it('should return Infinity for blocking terrain', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'blocking')

      expect(store.getMovementCost(0, 0)).toBe(Infinity)
    })

    it('should return Infinity for water without swim', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'water')

      expect(store.getMovementCost(0, 0, false)).toBe(Infinity)
    })

    it('should return 1 for water with swim (decree-008)', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'water')

      expect(store.getMovementCost(0, 0, true)).toBe(1)
    })

    it('should return 2 for water with swim and slow flag', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'water', { rough: false, slow: true })

      expect(store.getMovementCost(0, 0, true)).toBe(2)
    })

    it('should return Infinity for earth without burrow', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'earth')

      expect(store.getMovementCost(0, 0, false, false)).toBe(Infinity)
    })

    it('should return Infinity for earth with default params (no burrow)', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'earth')

      expect(store.getMovementCost(0, 0)).toBe(Infinity)
    })

    it('should return 1 for earth with burrow', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'earth')

      expect(store.getMovementCost(0, 0, false, true)).toBe(1)
    })

    it('should return 1 for legacy rough terrain (auto-converted, rough has no cost impact)', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'rough')

      expect(store.getMovementCost(0, 0)).toBe(1)
    })
  })

  describe('isPassable', () => {
    it('should return true for normal terrain', () => {
      const store = useTerrainStore()

      expect(store.isPassable(0, 0)).toBe(true)
    })

    it('should return false for blocking terrain', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'blocking')

      expect(store.isPassable(0, 0)).toBe(false)
    })

    it('should return false for water without swim', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'water')

      expect(store.isPassable(0, 0, false)).toBe(false)
    })

    it('should return true for water with swim', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'water')

      expect(store.isPassable(0, 0, true)).toBe(true)
    })

    it('should return true for normal terrain with slow flag', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'normal', { rough: false, slow: true })

      expect(store.isPassable(0, 0)).toBe(true)
    })

    it('should return true for hazard terrain', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'hazard')

      expect(store.isPassable(0, 0)).toBe(true)
    })

    it('should return false for earth without burrow', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'earth')

      expect(store.isPassable(0, 0)).toBe(false)
    })

    it('should return true for earth with burrow', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'earth')

      expect(store.isPassable(0, 0, false, true)).toBe(true)
    })

    it('should return true for legacy rough terrain (auto-converted to normal)', () => {
      const store = useTerrainStore()
      store.setTerrain(0, 0, 'rough')

      expect(store.isPassable(0, 0)).toBe(true)
    })
  })

  describe('setPaintFlags', () => {
    it('should set paint flags', () => {
      const store = useTerrainStore()

      store.setPaintFlags({ rough: true, slow: true })

      expect(store.paintFlags).toEqual({ rough: true, slow: true })
    })

    it('should not mutate the input object', () => {
      const store = useTerrainStore()
      const input = { rough: true, slow: false }

      store.setPaintFlags(input)
      store.setPaintFlags({ rough: false, slow: false })

      expect(input).toEqual({ rough: true, slow: false })
    })
  })

  describe('togglePaintFlag', () => {
    it('should toggle rough flag', () => {
      const store = useTerrainStore()

      expect(store.paintFlags.rough).toBe(false)

      store.togglePaintFlag('rough')
      expect(store.paintFlags.rough).toBe(true)

      store.togglePaintFlag('rough')
      expect(store.paintFlags.rough).toBe(false)
    })

    it('should toggle slow flag', () => {
      const store = useTerrainStore()

      expect(store.paintFlags.slow).toBe(false)

      store.togglePaintFlag('slow')
      expect(store.paintFlags.slow).toBe(true)

      store.togglePaintFlag('slow')
      expect(store.paintFlags.slow).toBe(false)
    })

    it('should toggle one flag without affecting the other', () => {
      const store = useTerrainStore()

      store.togglePaintFlag('rough')
      expect(store.paintFlags).toEqual({ rough: true, slow: false })

      store.togglePaintFlag('slow')
      expect(store.paintFlags).toEqual({ rough: true, slow: true })
    })
  })

  describe('setPaintMode', () => {
    it('should set paint mode to a valid terrain type', () => {
      const store = useTerrainStore()

      store.setPaintMode('blocking')

      expect(store.paintMode).toBe('blocking')
    })

    it('should convert legacy difficult to normal and set slow paint flag', () => {
      const store = useTerrainStore()

      store.setPaintMode('difficult')

      expect(store.paintMode).toBe('normal')
      expect(store.paintFlags.slow).toBe(true)
    })

    it('should convert legacy rough to normal and set rough paint flag', () => {
      const store = useTerrainStore()

      store.setPaintMode('rough')

      expect(store.paintMode).toBe('normal')
      expect(store.paintFlags.rough).toBe(true)
    })

    it('should preserve existing paint flags when converting legacy difficult', () => {
      const store = useTerrainStore()
      store.setPaintFlags({ rough: true, slow: false })

      store.setPaintMode('difficult')

      expect(store.paintMode).toBe('normal')
      expect(store.paintFlags).toEqual({ rough: true, slow: true })
    })

    it('should preserve existing paint flags when converting legacy rough', () => {
      const store = useTerrainStore()
      store.setPaintFlags({ rough: false, slow: true })

      store.setPaintMode('rough')

      expect(store.paintMode).toBe('normal')
      expect(store.paintFlags).toEqual({ rough: true, slow: true })
    })
  })

  describe('applyTool', () => {
    it('should paint single cell with brush size 1', () => {
      const store = useTerrainStore()
      store.setPaintMode('blocking')
      store.setBrushSize(1)

      store.applyTool(5, 5)

      expect(store.getTerrainAt(5, 5)).toBe('blocking')
      expect(store.getTerrainAt(4, 5)).toBe('normal')
      expect(store.getTerrainAt(6, 5)).toBe('normal')
    })

    it('should paint area with brush size 2', () => {
      const store = useTerrainStore()
      store.setPaintMode('water')
      store.setBrushSize(2)

      store.applyTool(5, 5)

      // Brush size 2 = radius 1 (3x3 area)
      expect(store.getTerrainAt(5, 5)).toBe('water')
      expect(store.getTerrainAt(4, 5)).toBe('water')
      expect(store.getTerrainAt(6, 5)).toBe('water')
      expect(store.getTerrainAt(5, 4)).toBe('water')
      expect(store.getTerrainAt(5, 6)).toBe('water')
    })

    it('should apply current paint flags', () => {
      const store = useTerrainStore()
      store.setPaintMode('water')
      store.setPaintFlags({ rough: true, slow: true })
      store.setBrushSize(1)

      store.applyTool(5, 5)

      const cell = store.getCellAt(5, 5)
      expect(cell?.flags).toEqual({ rough: true, slow: true })
    })
  })

  describe('eraseTool', () => {
    it('should clear terrain in area', () => {
      const store = useTerrainStore()

      // Paint some terrain
      store.setTerrain(5, 5, 'blocking')
      store.setTerrain(6, 5, 'blocking')
      store.setTerrain(5, 6, 'blocking')

      expect(store.terrainCount).toBe(3)

      // Erase with brush size 2
      store.setBrushSize(2)
      store.eraseTool(5, 5)

      expect(store.getTerrainAt(5, 5)).toBe('normal')
      expect(store.getTerrainAt(6, 5)).toBe('normal')
      expect(store.getTerrainAt(5, 6)).toBe('normal')
    })
  })

  describe('fillRect', () => {
    it('should fill rectangular area with terrain', () => {
      const store = useTerrainStore()

      store.fillRect(0, 0, 2, 2, 'water')

      expect(store.getTerrainAt(0, 0)).toBe('water')
      expect(store.getTerrainAt(1, 0)).toBe('water')
      expect(store.getTerrainAt(2, 0)).toBe('water')
      expect(store.getTerrainAt(0, 1)).toBe('water')
      expect(store.getTerrainAt(1, 1)).toBe('water')
      expect(store.getTerrainAt(2, 1)).toBe('water')
      expect(store.getTerrainAt(0, 2)).toBe('water')
      expect(store.getTerrainAt(1, 2)).toBe('water')
      expect(store.getTerrainAt(2, 2)).toBe('water')

      expect(store.terrainCount).toBe(9)
    })

    it('should handle reversed coordinates', () => {
      const store = useTerrainStore()

      store.fillRect(2, 2, 0, 0, 'water')

      expect(store.terrainCount).toBe(9)
    })

    it('should pass flags to filled cells', () => {
      const store = useTerrainStore()

      store.fillRect(0, 0, 1, 1, 'water', { rough: true, slow: false })

      const cell = store.getCellAt(0, 0)
      expect(cell?.flags).toEqual({ rough: true, slow: false })
    })
  })

  describe('drawLine', () => {
    it('should draw horizontal line', () => {
      const store = useTerrainStore()

      store.drawLine(0, 5, 4, 5, 'blocking')

      for (let x = 0; x <= 4; x++) {
        expect(store.getTerrainAt(x, 5)).toBe('blocking')
      }
    })

    it('should draw vertical line', () => {
      const store = useTerrainStore()

      store.drawLine(5, 0, 5, 4, 'blocking')

      for (let y = 0; y <= 4; y++) {
        expect(store.getTerrainAt(5, y)).toBe('blocking')
      }
    })

    it('should draw diagonal line', () => {
      const store = useTerrainStore()

      store.drawLine(0, 0, 3, 3, 'hazard')

      expect(store.getTerrainAt(0, 0)).toBe('hazard')
      expect(store.getTerrainAt(1, 1)).toBe('hazard')
      expect(store.getTerrainAt(2, 2)).toBe('hazard')
      expect(store.getTerrainAt(3, 3)).toBe('hazard')
    })
  })

  describe('clearAll', () => {
    it('should remove all terrain', () => {
      const store = useTerrainStore()

      store.setTerrain(0, 0, 'blocking')
      store.setTerrain(1, 1, 'water')
      store.setTerrain(2, 2, 'hazard')

      expect(store.terrainCount).toBe(3)

      store.clearAll()

      expect(store.terrainCount).toBe(0)
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = useTerrainStore()

      store.setEnabled(true)
      store.setPaintMode('blocking')
      store.setBrushSize(5)
      store.setTerrain(5, 5, 'blocking')

      store.reset()

      expect(store.enabled).toBe(false)
      expect(store.paintMode).toBe('water')
      expect(store.paintFlags).toEqual({ rough: false, slow: false })
      expect(store.brushSize).toBe(1)
      expect(store.terrainCount).toBe(0)
    })
  })

  describe('getCellsByType', () => {
    it('should return cells of a specific type', () => {
      const store = useTerrainStore()

      store.setTerrain(0, 0, 'water')
      store.setTerrain(1, 0, 'water')
      store.setTerrain(0, 1, 'blocking')
      store.setTerrain(2, 2, 'hazard')

      const waterCells = store.getCellsByType('water')
      const blockingCells = store.getCellsByType('blocking')

      expect(waterCells.length).toBe(2)
      expect(blockingCells.length).toBe(1)
    })
  })

  describe('import/export', () => {
    it('should export state correctly', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'hazard', undefined, 0, 'test')
      store.setTerrain(6, 6, 'blocking')

      const exported = store.exportState()

      expect(exported.cells.length).toBe(2)
      expect(exported.cells.some(c => c.position.x === 5 && c.position.y === 5)).toBe(true)
      expect(exported.cells.some(c => c.position.x === 6 && c.position.y === 6)).toBe(true)
    })

    it('should export flags in state', () => {
      const store = useTerrainStore()

      store.setTerrain(5, 5, 'water', { rough: true, slow: true })

      const exported = store.exportState()
      const cell = exported.cells.find(c => c.position.x === 5)

      expect(cell?.flags).toEqual({ rough: true, slow: true })
    })

    it('should import state correctly', () => {
      const store = useTerrainStore()

      store.importState({
        cells: [
          { position: { x: 1, y: 1 }, type: 'water', elevation: 0 },
          { position: { x: 2, y: 2 }, type: 'hazard', elevation: 3, note: 'danger' },
        ],
      })

      expect(store.getTerrainAt(1, 1)).toBe('water')
      expect(store.getTerrainAt(2, 2)).toBe('hazard')
      expect(store.getCellAt(2, 2)?.elevation).toBe(3)
      expect(store.getCellAt(2, 2)?.note).toBe('danger')
    })

    it('should add default flags during import', () => {
      const store = useTerrainStore()

      store.importState({
        cells: [
          { position: { x: 1, y: 1 }, type: 'water', elevation: 0 },
        ],
      })

      const cell = store.getCellAt(1, 1)
      expect(cell?.flags).toEqual({ rough: false, slow: false })
    })

    it('should migrate legacy difficult type during import', () => {
      const store = useTerrainStore()

      store.importState({
        cells: [
          { position: { x: 1, y: 1 }, type: 'difficult', elevation: 0 },
        ],
      })

      expect(store.getTerrainAt(1, 1)).toBe('normal')
      const cell = store.getCellAt(1, 1)
      expect(cell?.flags).toEqual({ rough: false, slow: true })
    })

    it('should migrate legacy rough type during import', () => {
      const store = useTerrainStore()

      store.importState({
        cells: [
          { position: { x: 1, y: 1 }, type: 'rough', elevation: 0 },
        ],
      })

      expect(store.getTerrainAt(1, 1)).toBe('normal')
      const cell = store.getCellAt(1, 1)
      expect(cell?.flags).toEqual({ rough: true, slow: false })
    })
  })

  describe('brush size limits', () => {
    it('should clamp brush size to minimum 1', () => {
      const store = useTerrainStore()

      store.setBrushSize(0)
      expect(store.brushSize).toBe(1)

      store.setBrushSize(-5)
      expect(store.brushSize).toBe(1)
    })

    it('should clamp brush size to maximum 10', () => {
      const store = useTerrainStore()

      store.setBrushSize(15)
      expect(store.brushSize).toBe(10)
    })
  })

})
