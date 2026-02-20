import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock $fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Mock window.location
const mockLocation = { href: '' }
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

// Import the store after mocking
import { useEncounterTablesStore } from '~/stores/encounterTables'
import type { EncounterTable, EncounterTableEntry, TableModification } from '~/types'

// Test data helpers
const createMockEntry = (overrides: Partial<EncounterTableEntry> = {}): EncounterTableEntry => ({
  id: 'entry-123',
  speciesId: 'species-001',
  speciesName: 'Bulbasaur',
  weight: 10,
  levelRange: undefined,
  ...overrides
})

const createMockModification = (overrides: Partial<TableModification> = {}): TableModification => ({
  id: 'mod-123',
  name: 'Night Time',
  description: 'Pokemon found at night',
  parentTableId: 'table-123',
  levelRange: undefined,
  entries: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createMockTable = (overrides: Partial<EncounterTable> = {}): EncounterTable => ({
  id: 'table-123',
  name: 'Route 1 Grass',
  description: 'Wild Pokemon in tall grass',
  imageUrl: undefined,
  levelRange: { min: 2, max: 5 },
  density: 'moderate',
  entries: [],
  modifications: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('Encounter Tables Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockLocation.href = ''
  })

  describe('Initial State', () => {
    it('should have empty tables and no errors', () => {
      const store = useEncounterTablesStore()

      expect(store.tables).toEqual([])
      expect(store.selectedTableId).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should have default filter values', () => {
      const store = useEncounterTablesStore()

      expect(store.filters.search).toBe('')
      expect(store.filters.sortBy).toBe('name')
      expect(store.filters.sortOrder).toBe('asc')
    })
  })

  describe('Weight Calculation Logic (2.T1)', () => {
    it('should calculate total weight for a table with entries', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', weight: 10 }),
          createMockEntry({ id: 'entry-2', speciesName: 'Charmander', weight: 5 }),
          createMockEntry({ id: 'entry-3', speciesName: 'Squirtle', weight: 3 }),
        ]
      })
      store.tables = [table]

      const totalWeight = store.getTotalWeight(table.id)
      expect(totalWeight).toBe(18)
    })

    it('should return 0 weight for empty table', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({ entries: [] })
      store.tables = [table]

      const totalWeight = store.getTotalWeight(table.id)
      expect(totalWeight).toBe(0)
    })

    it('should calculate weight correctly with decimal weights', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', weight: 10.5 }),
          createMockEntry({ id: 'entry-2', speciesName: 'Charmander', weight: 0.5 }),
        ]
      })
      store.tables = [table]

      const totalWeight = store.getTotalWeight(table.id)
      expect(totalWeight).toBe(11)
    })

    it('should calculate weight with modification applied', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', weight: 10 }),
          createMockEntry({ id: 'entry-2', speciesName: 'Charmander', weight: 5 }),
        ],
        modifications: [
          createMockModification({
            entries: [
              { id: 'mod-entry-1', speciesName: 'Bulbasaur', weight: 15, remove: false },
            ]
          })
        ]
      })
      store.tables = [table]

      // Without modification
      const baseWeight = store.getTotalWeight(table.id)
      expect(baseWeight).toBe(15)

      // With modification (Bulbasaur weight changes from 10 to 15)
      const modWeight = store.getTotalWeight(table.id, 'mod-123')
      expect(modWeight).toBe(20)
    })

    it('should reduce weight when modification removes an entry', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', weight: 10 }),
          createMockEntry({ id: 'entry-2', speciesName: 'Charmander', weight: 5 }),
        ],
        modifications: [
          createMockModification({
            entries: [
              { id: 'mod-entry-1', speciesName: 'Bulbasaur', remove: true },
            ]
          })
        ]
      })
      store.tables = [table]

      // Without modification
      const baseWeight = store.getTotalWeight(table.id)
      expect(baseWeight).toBe(15)

      // With modification (Bulbasaur removed)
      const modWeight = store.getTotalWeight(table.id, 'mod-123')
      expect(modWeight).toBe(5)
    })
  })

  describe('Modification Merge Logic (2.T2)', () => {
    it('should return parent entries when no modification specified', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', speciesId: 'sp-001', weight: 10 }),
          createMockEntry({ id: 'entry-2', speciesName: 'Charmander', speciesId: 'sp-002', weight: 5 }),
        ]
      })
      store.tables = [table]

      const resolved = store.getResolvedEntries(table.id)

      expect(resolved).toHaveLength(2)
      expect(resolved.every(e => e.source === 'parent')).toBe(true)
    })

    it('should override entry weight when modification specifies new weight', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', weight: 10 }),
        ],
        modifications: [
          createMockModification({
            entries: [
              { id: 'mod-entry-1', speciesName: 'Bulbasaur', weight: 20, remove: false },
            ]
          })
        ]
      })
      store.tables = [table]

      const resolved = store.getResolvedEntries(table.id, 'mod-123')

      expect(resolved).toHaveLength(1)
      expect(resolved[0].weight).toBe(20)
      expect(resolved[0].source).toBe('modification')
    })

    it('should remove entry when modification marks it for removal', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', weight: 10 }),
          createMockEntry({ id: 'entry-2', speciesName: 'Charmander', weight: 5 }),
        ],
        modifications: [
          createMockModification({
            entries: [
              { id: 'mod-entry-1', speciesName: 'Bulbasaur', remove: true },
            ]
          })
        ]
      })
      store.tables = [table]

      const resolved = store.getResolvedEntries(table.id, 'mod-123')

      expect(resolved).toHaveLength(1)
      expect(resolved[0].speciesName).toBe('Charmander')
    })

    it('should add new entry from modification', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', weight: 10 }),
        ],
        modifications: [
          createMockModification({
            entries: [
              { id: 'mod-entry-1', speciesName: 'Squirtle', weight: 8, remove: false },
            ]
          })
        ]
      })
      store.tables = [table]

      const resolved = store.getResolvedEntries(table.id, 'mod-123')

      expect(resolved).toHaveLength(2)
      const squirtle = resolved.find(e => e.speciesName === 'Squirtle')
      expect(squirtle).toBeDefined()
      expect(squirtle?.weight).toBe(8)
      expect(squirtle?.source).toBe('added')
    })

    it('should inherit table level range when entry has no override', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        levelRange: { min: 5, max: 10 },
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', levelRange: undefined }),
        ]
      })
      store.tables = [table]

      const resolved = store.getResolvedEntries(table.id)

      expect(resolved[0].levelRange).toEqual({ min: 5, max: 10 })
    })

    it('should use entry-specific level range when provided', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        levelRange: { min: 5, max: 10 },
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', levelRange: { min: 7, max: 8 } }),
        ]
      })
      store.tables = [table]

      const resolved = store.getResolvedEntries(table.id)

      expect(resolved[0].levelRange).toEqual({ min: 7, max: 8 })
    })

    it('should use modification level range for added entries', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        levelRange: { min: 5, max: 10 },
        entries: [],
        modifications: [
          createMockModification({
            levelRange: { min: 8, max: 12 },
            entries: [
              { id: 'mod-entry-1', speciesName: 'Squirtle', weight: 8, remove: false },
            ]
          })
        ]
      })
      store.tables = [table]

      const resolved = store.getResolvedEntries(table.id, 'mod-123')

      expect(resolved[0].levelRange).toEqual({ min: 8, max: 12 })
    })

    it('should handle complex modification scenario', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        levelRange: { min: 2, max: 5 },
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', weight: 10 }),
          createMockEntry({ id: 'entry-2', speciesName: 'Charmander', weight: 5 }),
          createMockEntry({ id: 'entry-3', speciesName: 'Squirtle', weight: 3 }),
        ],
        modifications: [
          createMockModification({
            entries: [
              { id: 'mod-entry-1', speciesName: 'Bulbasaur', weight: 15, remove: false },
              { id: 'mod-entry-2', speciesName: 'Charmander', remove: true },
              { id: 'mod-entry-3', speciesName: 'Pikachu', weight: 2, remove: false },
            ]
          })
        ]
      })
      store.tables = [table]

      const resolved = store.getResolvedEntries(table.id, 'mod-123')

      // Should have: Bulbasaur (modified), Squirtle (inherited), Pikachu (added)
      expect(resolved).toHaveLength(3)

      const bulbasaur = resolved.find(e => e.speciesName === 'Bulbasaur')
      expect(bulbasaur?.weight).toBe(15)
      expect(bulbasaur?.source).toBe('modification')

      const squirtle = resolved.find(e => e.speciesName === 'Squirtle')
      expect(squirtle?.weight).toBe(3)
      expect(squirtle?.source).toBe('parent')

      const pikachu = resolved.find(e => e.speciesName === 'Pikachu')
      expect(pikachu?.weight).toBe(2)
      expect(pikachu?.source).toBe('added')

      // Charmander should not exist
      const charmander = resolved.find(e => e.speciesName === 'Charmander')
      expect(charmander).toBeUndefined()
    })

    it('should return empty array for non-existent table', () => {
      const store = useEncounterTablesStore()

      const resolved = store.getResolvedEntries('non-existent')

      expect(resolved).toEqual([])
    })

    it('should return parent entries when modification not found', () => {
      const store = useEncounterTablesStore()
      const table = createMockTable({
        entries: [
          createMockEntry({ speciesName: 'Bulbasaur', weight: 10 }),
        ]
      })
      store.tables = [table]

      const resolved = store.getResolvedEntries(table.id, 'non-existent-mod')

      expect(resolved).toHaveLength(1)
      expect(resolved[0].source).toBe('parent')
    })
  })

  describe('Filtering and Sorting', () => {
    it('should filter tables by search term', () => {
      const store = useEncounterTablesStore()
      store.tables = [
        createMockTable({ id: 'table-1', name: 'Route 1 Forest' }),
        createMockTable({ id: 'table-2', name: 'Ocean Cave' }),
        createMockTable({ id: 'table-3', name: 'Mountain Forest' }),
      ]
      store.filters.search = 'forest'

      const filtered = store.filteredTables

      expect(filtered).toHaveLength(2)
      expect(filtered.map(t => t.name)).toContain('Route 1 Forest')
      expect(filtered.map(t => t.name)).toContain('Mountain Forest')
    })

    it('should sort tables by name ascending', () => {
      const store = useEncounterTablesStore()
      store.tables = [
        createMockTable({ id: 'table-1', name: 'Zebra Zone' }),
        createMockTable({ id: 'table-2', name: 'Apple Area' }),
        createMockTable({ id: 'table-3', name: 'Mountain' }),
      ]
      store.filters.sortBy = 'name'
      store.filters.sortOrder = 'asc'

      const sorted = store.filteredTables

      expect(sorted[0].name).toBe('Apple Area')
      expect(sorted[1].name).toBe('Mountain')
      expect(sorted[2].name).toBe('Zebra Zone')
    })

    it('should sort tables by name descending', () => {
      const store = useEncounterTablesStore()
      store.tables = [
        createMockTable({ id: 'table-1', name: 'Apple Area' }),
        createMockTable({ id: 'table-2', name: 'Zebra Zone' }),
      ]
      store.filters.sortBy = 'name'
      store.filters.sortOrder = 'desc'

      const sorted = store.filteredTables

      expect(sorted[0].name).toBe('Zebra Zone')
      expect(sorted[1].name).toBe('Apple Area')
    })
  })

  describe('CRUD Actions', () => {
    it('should load tables from API', async () => {
      const store = useEncounterTablesStore()
      const mockTables = [createMockTable(), createMockTable({ id: 'table-2', name: 'Route 2' })]
      mockFetch.mockResolvedValueOnce({ data: mockTables })

      await store.loadTables()

      expect(mockFetch).toHaveBeenCalledWith('/api/encounter-tables')
      expect(store.tables).toEqual(mockTables)
      expect(store.loading).toBe(false)
    })

    it('should handle load error', async () => {
      const store = useEncounterTablesStore()
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await store.loadTables()

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })

    it('should create a new table', async () => {
      const store = useEncounterTablesStore()
      const newTable = createMockTable()
      mockFetch.mockResolvedValueOnce({ data: newTable })

      const result = await store.createTable({
        name: 'Route 1 Grass',
        description: 'Wild Pokemon',
        levelRange: { min: 2, max: 5 }
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/encounter-tables', expect.objectContaining({
        method: 'POST'
      }))
      expect(store.tables).toContainEqual(result)
    })

    it('should update an existing table', async () => {
      const store = useEncounterTablesStore()
      const existingTable = createMockTable()
      store.tables = [existingTable]
      const updatedTable = { ...existingTable, name: 'Updated Name' }
      mockFetch.mockResolvedValueOnce({ data: updatedTable })

      await store.updateTable(existingTable.id, { name: 'Updated Name' })

      expect(mockFetch).toHaveBeenCalledWith(`/api/encounter-tables/${existingTable.id}`, expect.objectContaining({
        method: 'PUT'
      }))
      expect(store.tables[0].name).toBe('Updated Name')
    })

    it('should delete a table', async () => {
      const store = useEncounterTablesStore()
      const tableToDelete = createMockTable()
      store.tables = [tableToDelete]
      store.selectedTableId = tableToDelete.id
      mockFetch.mockResolvedValueOnce({})

      await store.deleteTable(tableToDelete.id)

      expect(mockFetch).toHaveBeenCalledWith(`/api/encounter-tables/${tableToDelete.id}`, expect.objectContaining({
        method: 'DELETE'
      }))
      expect(store.tables).toHaveLength(0)
      expect(store.selectedTableId).toBeNull()
    })
  })

  describe('Import/Export Actions', () => {
    it('should export table by redirecting to export URL', async () => {
      const store = useEncounterTablesStore()

      await store.exportTable('table-123')

      expect(mockLocation.href).toBe('/api/encounter-tables/table-123/export')
    })

    it('should import table and add to store', async () => {
      const store = useEncounterTablesStore()
      const importedTable = createMockTable({ id: 'imported-123', name: 'Imported Table' })
      mockFetch.mockResolvedValueOnce({ data: importedTable, warnings: null })

      const result = await store.importTable({ version: '1.0', table: { name: 'Test', levelRange: { min: 1, max: 5 } } })

      expect(mockFetch).toHaveBeenCalledWith('/api/encounter-tables/import', expect.objectContaining({
        method: 'POST'
      }))
      expect(store.tables).toContainEqual(importedTable)
      expect(result.warnings).toBeNull()
    })

    it('should return warnings from import', async () => {
      const store = useEncounterTablesStore()
      const importedTable = createMockTable()
      mockFetch.mockResolvedValueOnce({
        data: importedTable,
        warnings: '2 species could not be found: Fakemon, Missingno'
      })

      const result = await store.importTable({ version: '1.0', table: { name: 'Test', levelRange: { min: 1, max: 5 } } })

      expect(result.warnings).toBe('2 species could not be found: Fakemon, Missingno')
    })
  })

  describe('Entry Management', () => {
    it('should add entry to table', async () => {
      const store = useEncounterTablesStore()
      const table = createMockTable()
      store.tables = [table]
      const newEntry = createMockEntry()
      mockFetch
        .mockResolvedValueOnce({ data: newEntry })
        .mockResolvedValueOnce({ data: { ...table, entries: [newEntry] } })

      await store.addEntry(table.id, { speciesId: 'sp-001', weight: 10 })

      expect(mockFetch).toHaveBeenCalledWith(`/api/encounter-tables/${table.id}/entries`, expect.objectContaining({
        method: 'POST'
      }))
    })

    it('should update entry weight', async () => {
      const store = useEncounterTablesStore()
      const entry = createMockEntry()
      const table = createMockTable({ entries: [entry] })
      store.tables = [table]
      mockFetch.mockResolvedValueOnce({})

      await store.updateEntry(table.id, entry.id, { weight: 15 })

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/encounter-tables/${table.id}/entries/${entry.id}`,
        expect.objectContaining({ method: 'PUT', body: { weight: 15 } })
      )
      expect(store.tables[0].entries[0].weight).toBe(15)
    })

    it('should remove entry from table', async () => {
      const store = useEncounterTablesStore()
      const entry = createMockEntry()
      const table = createMockTable({ entries: [entry] })
      store.tables = [table]
      mockFetch.mockResolvedValueOnce({})

      await store.removeEntry(table.id, entry.id)

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/encounter-tables/${table.id}/entries/${entry.id}`,
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(store.tables[0].entries).toHaveLength(0)
    })
  })

  describe('Modification Management', () => {
    it('should create modification', async () => {
      const store = useEncounterTablesStore()
      const table = createMockTable()
      store.tables = [table]
      const newMod = createMockModification({ name: 'Night Time' })
      mockFetch.mockResolvedValueOnce({ data: newMod })

      await store.createModification(table.id, { name: 'Night Time' })

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/encounter-tables/${table.id}/modifications`,
        expect.objectContaining({ method: 'POST' })
      )
      expect(store.tables[0].modifications).toHaveLength(1)
    })

    it('should update modification', async () => {
      const store = useEncounterTablesStore()
      const mod = createMockModification()
      const table = createMockTable({ modifications: [mod] })
      store.tables = [table]
      const updatedMod = { ...mod, name: 'Updated Night' }
      mockFetch.mockResolvedValueOnce({ data: updatedMod })

      await store.updateModification(table.id, mod.id, { name: 'Updated Night' })

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/encounter-tables/${table.id}/modifications/${mod.id}`,
        expect.objectContaining({ method: 'PUT' })
      )
    })

    it('should delete modification', async () => {
      const store = useEncounterTablesStore()
      const mod = createMockModification()
      const table = createMockTable({ modifications: [mod] })
      store.tables = [table]
      mockFetch.mockResolvedValueOnce({})

      await store.deleteModification(table.id, mod.id)

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/encounter-tables/${table.id}/modifications/${mod.id}`,
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(store.tables[0].modifications).toHaveLength(0)
    })
  })
})
