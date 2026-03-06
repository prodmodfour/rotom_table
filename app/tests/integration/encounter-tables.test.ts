import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Prisma
const mockPrisma = {
  encounterTable: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  encounterTableEntry: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  tableModification: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  modificationEntry: {
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn()
  },
  speciesData: {
    findMany: vi.fn(),
    findUnique: vi.fn()
  }
}

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma
}))

// Mock H3 event utilities
const mockEvent = {
  node: { req: {}, res: {} },
  context: {}
}

const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()
const mockCreateError = vi.fn((opts) => {
  const error = new Error(opts.message) as Error & { statusCode: number }
  error.statusCode = opts.statusCode
  return error
})
const mockSetHeader = vi.fn()
const mockSend = vi.fn()

vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)
vi.stubGlobal('createError', mockCreateError)
vi.stubGlobal('setHeader', mockSetHeader)
vi.stubGlobal('send', mockSend)
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)

describe('Encounter Tables API (2.T3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/encounter-tables', () => {
    it('should return all encounter tables', async () => {
      const mockTables = [
        {
          id: 'table-1',
          name: 'Route 1 Grass',
          description: 'Wild Pokemon',
          imageUrl: null,
          levelMin: 2,
          levelMax: 5,
          entries: [],
          modifications: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockPrisma.encounterTable.findMany.mockResolvedValue(mockTables)

      // Import the handler
      const { default: handler } = await import('~/server/api/encounter-tables/index.get')

      const result = await handler(mockEvent as any)

      expect(mockPrisma.encounterTable.findMany).toHaveBeenCalled()
      expect(result.data).toBeDefined()
      expect(result.data[0].name).toBe('Route 1 Grass')
      expect(result.data[0].levelRange).toEqual({ min: 2, max: 5 })
    })

    it('should transform levelMin/levelMax to levelRange', async () => {
      const mockTable = {
        id: 'table-1',
        name: 'Test',
        levelMin: 10,
        levelMax: 20,
        entries: [],
        modifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.encounterTable.findMany.mockResolvedValue([mockTable])

      const { default: handler } = await import('~/server/api/encounter-tables/index.get')
      const result = await handler(mockEvent as any)

      expect(result.data[0].levelRange).toEqual({ min: 10, max: 20 })
    })
  })

  describe('POST /api/encounter-tables', () => {
    it('should create a new encounter table', async () => {
      mockReadBody.mockResolvedValue({
        name: 'Route 1 Forest',
        description: 'Forest area Pokemon',
        levelRange: { min: 3, max: 7 }
      })

      const createdTable = {
        id: 'new-table',
        name: 'Route 1 Forest',
        description: 'Forest area Pokemon',
        imageUrl: null,
        levelMin: 3,
        levelMax: 7,
        entries: [],
        modifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.encounterTable.create.mockResolvedValue(createdTable)

      const { default: handler } = await import('~/server/api/encounter-tables/index.post')
      const result = await handler(mockEvent as any)

      expect(mockPrisma.encounterTable.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          name: 'Route 1 Forest',
          levelMin: 3,
          levelMax: 7
        })
      }))
      expect(result.data.name).toBe('Route 1 Forest')
    })

    it('should reject missing name', async () => {
      mockReadBody.mockResolvedValue({
        levelRange: { min: 5, max: 10 }
      })

      const { default: handler } = await import('~/server/api/encounter-tables/index.post')

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400
      })
    })

    it('should use default level range when not provided', async () => {
      mockReadBody.mockResolvedValue({
        name: 'Default Range Table'
      })

      mockPrisma.encounterTable.create.mockResolvedValue({
        id: 'new-table',
        name: 'Default Range Table',
        levelMin: 1,
        levelMax: 10,
        entries: [],
        modifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const { default: handler } = await import('~/server/api/encounter-tables/index.post')
      const result = await handler(mockEvent as any)

      expect(mockPrisma.encounterTable.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          levelMin: 1,
          levelMax: 10
        })
      }))
    })
  })

  describe('GET /api/encounter-tables/[id]', () => {
    it('should return a single table by ID', async () => {
      mockGetRouterParam.mockReturnValue('table-123')

      const mockTable = {
        id: 'table-123',
        name: 'Route 1',
        levelMin: 2,
        levelMax: 5,
        entries: [
          { id: 'e1', speciesId: 'sp-1', weight: 10, levelMin: null, levelMax: null, species: { id: 'sp-1', name: 'Bulbasaur', type1: 'Grass', type2: 'Poison' } }
        ],
        modifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.encounterTable.findUnique.mockResolvedValue(mockTable)

      const { default: handler } = await import('~/server/api/encounter-tables/[id].get')
      const result = await handler(mockEvent as any)

      expect(mockPrisma.encounterTable.findUnique).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'table-123' }
      }))
      expect(result.data.entries[0].speciesName).toBe('Bulbasaur')
    })

    it('should return 404 for non-existent table', async () => {
      mockGetRouterParam.mockReturnValue('non-existent')
      mockPrisma.encounterTable.findUnique.mockResolvedValue(null)

      const { default: handler } = await import('~/server/api/encounter-tables/[id].get')

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 404
      })
    })
  })

  describe('PUT /api/encounter-tables/[id]', () => {
    it('should update a table', async () => {
      mockGetRouterParam.mockReturnValue('table-123')
      mockReadBody.mockResolvedValue({
        name: 'Updated Name',
        description: 'Updated description'
      })

      const existingTable = {
        id: 'table-123',
        name: 'Old Name'
      }

      const updatedTable = {
        id: 'table-123',
        name: 'Updated Name',
        description: 'Updated description',
        levelMin: 2,
        levelMax: 5,
        entries: [],
        modifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockPrisma.encounterTable.findUnique.mockResolvedValue(existingTable)
      mockPrisma.encounterTable.update.mockResolvedValue(updatedTable)

      const { default: handler } = await import('~/server/api/encounter-tables/[id].put')
      const result = await handler(mockEvent as any)

      expect(mockPrisma.encounterTable.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'table-123' },
        data: expect.objectContaining({
          name: 'Updated Name'
        })
      }))
      expect(result.data.name).toBe('Updated Name')
    })
  })

  describe('DELETE /api/encounter-tables/[id]', () => {
    it('should delete a table', async () => {
      mockGetRouterParam.mockReturnValue('table-123')

      mockPrisma.encounterTable.findUnique.mockResolvedValue({ id: 'table-123' })
      mockPrisma.encounterTable.delete.mockResolvedValue({ id: 'table-123' })

      const { default: handler } = await import('~/server/api/encounter-tables/[id].delete')
      const result = await handler(mockEvent as any)

      expect(mockPrisma.encounterTable.delete).toHaveBeenCalledWith({
        where: { id: 'table-123' }
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('Encounter Table Entries API (2.T3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/encounter-tables/[id]/entries', () => {
    it('should add entry to table', async () => {
      mockGetRouterParam.mockReturnValue('table-123')
      mockReadBody.mockResolvedValue({
        speciesId: 'species-001',
        weight: 10
      })

      mockPrisma.encounterTable.findUnique.mockResolvedValue({ id: 'table-123' })
      mockPrisma.speciesData.findUnique.mockResolvedValue({ id: 'species-001', name: 'Bulbasaur' })
      mockPrisma.encounterTableEntry.findUnique.mockResolvedValue(null)
      mockPrisma.encounterTableEntry.create.mockResolvedValue({
        id: 'entry-1',
        tableId: 'table-123',
        speciesId: 'species-001',
        weight: 10,
        levelMin: null,
        levelMax: null,
        species: { id: 'species-001', name: 'Bulbasaur', type1: 'Grass', type2: 'Poison' }
      })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/entries/index.post')
      const result = await handler(mockEvent as any)

      expect(result.data.speciesName).toBe('Bulbasaur')
      expect(result.data.weight).toBe(10)
    })

    it('should reject duplicate species in same table', async () => {
      mockGetRouterParam.mockReturnValue('table-123')
      mockReadBody.mockResolvedValue({
        speciesId: 'species-001',
        weight: 10
      })

      mockPrisma.encounterTable.findUnique.mockResolvedValue({ id: 'table-123' })
      mockPrisma.speciesData.findUnique.mockResolvedValue({ id: 'species-001', name: 'Bulbasaur' })
      mockPrisma.encounterTableEntry.findUnique.mockResolvedValue({ id: 'existing' })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/entries/index.post')

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 409
      })
    })
  })

  describe('PUT /api/encounter-tables/[id]/entries/[entryId]', () => {
    it('should update entry weight', async () => {
      mockGetRouterParam.mockImplementation((_, param) => {
        if (param === 'id') return 'table-123'
        if (param === 'entryId') return 'entry-1'
        return null
      })
      mockReadBody.mockResolvedValue({ weight: 15 })

      mockPrisma.encounterTableEntry.findFirst.mockResolvedValue({
        id: 'entry-1',
        tableId: 'table-123'
      })
      mockPrisma.encounterTableEntry.update.mockResolvedValue({
        id: 'entry-1',
        speciesId: 'species-001',
        weight: 15,
        levelMin: null,
        levelMax: null,
        species: { id: 'species-001', name: 'Bulbasaur', type1: 'Grass', type2: 'Poison' }
      })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/entries/[entryId].put')
      const result = await handler(mockEvent as any)

      expect(result.data.weight).toBe(15)
    })

    it('should update entry level range', async () => {
      mockGetRouterParam.mockImplementation((_, param) => {
        if (param === 'id') return 'table-123'
        if (param === 'entryId') return 'entry-1'
        return null
      })
      mockReadBody.mockResolvedValue({ levelMin: 5, levelMax: 10 })

      mockPrisma.encounterTableEntry.findFirst.mockResolvedValue({
        id: 'entry-1',
        tableId: 'table-123'
      })
      mockPrisma.encounterTableEntry.update.mockResolvedValue({
        id: 'entry-1',
        speciesId: 'species-001',
        weight: 10,
        levelMin: 5,
        levelMax: 10,
        species: { id: 'species-001', name: 'Bulbasaur', type1: 'Grass', type2: 'Poison' }
      })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/entries/[entryId].put')
      const result = await handler(mockEvent as any)

      expect(result.data.levelRange).toEqual({ min: 5, max: 10 })
    })

    it('should reject weight below minimum', async () => {
      mockGetRouterParam.mockImplementation((_, param) => {
        if (param === 'id') return 'table-123'
        if (param === 'entryId') return 'entry-1'
        return null
      })
      mockReadBody.mockResolvedValue({ weight: 0.05 })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/entries/[entryId].put')

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400
      })
    })
  })

  describe('DELETE /api/encounter-tables/[id]/entries/[entryId]', () => {
    it('should delete entry', async () => {
      mockGetRouterParam.mockImplementation((_, param) => {
        if (param === 'id') return 'table-123'
        if (param === 'entryId') return 'entry-1'
        return null
      })

      mockPrisma.encounterTableEntry.findUnique.mockResolvedValue({
        id: 'entry-1',
        tableId: 'table-123'
      })
      mockPrisma.encounterTableEntry.delete.mockResolvedValue({ id: 'entry-1' })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/entries/[entryId].delete')
      const result = await handler(mockEvent as any)

      expect(result.success).toBe(true)
    })
  })
})

describe('Table Modifications API (2.T4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/encounter-tables/[id]/modifications', () => {
    it('should create a modification', async () => {
      mockGetRouterParam.mockReturnValue('table-123')
      mockReadBody.mockResolvedValue({
        name: 'Night Time',
        description: 'Pokemon found at night'
      })

      mockPrisma.encounterTable.findUnique.mockResolvedValue({ id: 'table-123' })
      mockPrisma.tableModification.create.mockResolvedValue({
        id: 'mod-1',
        parentTableId: 'table-123',
        name: 'Night Time',
        description: 'Pokemon found at night',
        levelMin: null,
        levelMax: null,
        entries: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/modifications/index.post')
      const result = await handler(mockEvent as any)

      expect(result.data.name).toBe('Night Time')
    })

    it('should reject missing name', async () => {
      mockGetRouterParam.mockReturnValue('table-123')
      mockReadBody.mockResolvedValue({})

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/modifications/index.post')

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400
      })
    })
  })

  describe('PUT /api/encounter-tables/[id]/modifications/[modId]', () => {
    it('should update modification', async () => {
      mockGetRouterParam.mockImplementation((_, param) => {
        if (param === 'id') return 'table-123'
        if (param === 'modId') return 'mod-1'
        return null
      })
      mockReadBody.mockResolvedValue({
        name: 'Dusk Time',
        description: 'Pokemon found at dusk'
      })

      mockPrisma.tableModification.findUnique.mockResolvedValue({
        id: 'mod-1',
        parentTableId: 'table-123'
      })
      mockPrisma.tableModification.update.mockResolvedValue({
        id: 'mod-1',
        parentTableId: 'table-123',
        name: 'Dusk Time',
        description: 'Pokemon found at dusk',
        levelMin: null,
        levelMax: null,
        entries: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/modifications/[modId].put')
      const result = await handler(mockEvent as any)

      expect(result.data.name).toBe('Dusk Time')
    })
  })

  describe('DELETE /api/encounter-tables/[id]/modifications/[modId]', () => {
    it('should delete modification', async () => {
      mockGetRouterParam.mockImplementation((_, param) => {
        if (param === 'id') return 'table-123'
        if (param === 'modId') return 'mod-1'
        return null
      })

      mockPrisma.tableModification.findUnique.mockResolvedValue({
        id: 'mod-1',
        parentTableId: 'table-123'
      })
      mockPrisma.tableModification.delete.mockResolvedValue({ id: 'mod-1' })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/modifications/[modId].delete')
      const result = await handler(mockEvent as any)

      expect(result.success).toBe(true)
    })
  })

  describe('POST /api/encounter-tables/[id]/modifications/[modId]/entries', () => {
    it('should add entry to modification', async () => {
      mockGetRouterParam.mockImplementation((_, param) => {
        if (param === 'id') return 'table-123'
        if (param === 'modId') return 'mod-1'
        return null
      })
      mockReadBody.mockResolvedValue({
        speciesName: 'Hoothoot',
        weight: 8
      })

      mockPrisma.tableModification.findUnique.mockResolvedValue({
        id: 'mod-1',
        parentTableId: 'table-123'
      })
      mockPrisma.modificationEntry.findFirst.mockResolvedValue(null)
      mockPrisma.modificationEntry.create.mockResolvedValue({
        id: 'mod-entry-1',
        modificationId: 'mod-1',
        speciesName: 'Hoothoot',
        weight: 8,
        remove: false,
        levelMin: null,
        levelMax: null
      })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post')
      const result = await handler(mockEvent as any)

      expect(result.data.speciesName).toBe('Hoothoot')
    })

    it('should allow marking species for removal', async () => {
      mockGetRouterParam.mockImplementation((_, param) => {
        if (param === 'id') return 'table-123'
        if (param === 'modId') return 'mod-1'
        return null
      })
      mockReadBody.mockResolvedValue({
        speciesName: 'Pidgey',
        remove: true
      })

      mockPrisma.tableModification.findUnique.mockResolvedValue({
        id: 'mod-1',
        parentTableId: 'table-123'
      })
      mockPrisma.modificationEntry.findFirst.mockResolvedValue(null)
      mockPrisma.modificationEntry.create.mockResolvedValue({
        id: 'mod-entry-1',
        modificationId: 'mod-1',
        speciesName: 'Pidgey',
        weight: null,
        remove: true,
        levelMin: null,
        levelMax: null
      })

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post')
      const result = await handler(mockEvent as any)

      expect(result.data.remove).toBe(true)
    })
  })
})

describe('Import/Export API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/encounter-tables/[id]/export', () => {
    it('should export table as JSON', async () => {
      mockGetRouterParam.mockReturnValue('table-123')

      const mockTable = {
        id: 'table-123',
        name: 'Route 1 Grass',
        description: 'Wild Pokemon',
        imageUrl: null,
        density: 'dense',
        levelMin: 2,
        levelMax: 5,
        entries: [
          { species: { name: 'Bulbasaur' }, weight: 10, levelMin: null, levelMax: null }
        ],
        modifications: [
          {
            name: 'Night',
            description: 'Night time',
            levelMin: null,
            levelMax: null,
            entries: [
              { speciesName: 'Hoothoot', weight: 5, remove: false, levelMin: null, levelMax: null }
            ]
          }
        ]
      }

      mockPrisma.encounterTable.findUnique.mockResolvedValue(mockTable)

      const { default: handler } = await import('~/server/api/encounter-tables/[id]/export.get')
      const result = await handler(mockEvent as any)

      expect(result.version).toBe('1.0')
      expect(result.table.name).toBe('Route 1 Grass')
      expect(result.table.density).toBe('dense')
      expect(result.table.entries[0].speciesName).toBe('Bulbasaur')
    })
  })

  describe('POST /api/encounter-tables/import', () => {
    it('should import table from JSON', async () => {
      mockReadBody.mockResolvedValue({
        version: '1.0',
        table: {
          name: 'Imported Table',
          description: 'Imported from export',
          density: 'dense',
          levelRange: { min: 5, max: 10 },
          entries: [
            { speciesName: 'Bulbasaur', weight: 10 }
          ],
          modifications: []
        }
      })

      mockPrisma.encounterTable.findMany.mockResolvedValue([])
      mockPrisma.speciesData.findMany.mockResolvedValue([
        { id: 'sp-001', name: 'Bulbasaur' }
      ])
      mockPrisma.encounterTable.create.mockResolvedValue({
        id: 'new-table',
        name: 'Imported Table',
        description: 'Imported from export',
        imageUrl: null,
        density: 'dense',
        levelMin: 5,
        levelMax: 10,
        entries: [
          { id: 'e1', speciesId: 'sp-001', weight: 10, levelMin: null, levelMax: null, species: { id: 'sp-001', name: 'Bulbasaur', type1: 'Grass', type2: 'Poison' } }
        ],
        modifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const { default: handler } = await import('~/server/api/encounter-tables/import.post')
      const result = await handler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.name).toBe('Imported Table')
      expect(result.data.density).toBe('dense')
      expect(mockPrisma.encounterTable.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            density: 'dense'
          })
        })
      )
    })

    it('should append number to duplicate table names', async () => {
      mockReadBody.mockResolvedValue({
        version: '1.0',
        table: {
          name: 'Route 1',
          levelRange: { min: 1, max: 5 }
        }
      })

      mockPrisma.encounterTable.findMany.mockResolvedValue([
        { name: 'Route 1' },
        { name: 'Route 1 (1)' }
      ])
      mockPrisma.speciesData.findMany.mockResolvedValue([])
      mockPrisma.encounterTable.create.mockResolvedValue({
        id: 'new-table',
        name: 'Route 1 (2)',
        levelMin: 1,
        levelMax: 5,
        entries: [],
        modifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const { default: handler } = await import('~/server/api/encounter-tables/import.post')
      const result = await handler(mockEvent as any)

      expect(result.data.name).toBe('Route 1 (2)')
    })

    it('should report unmatched species as warnings', async () => {
      mockReadBody.mockResolvedValue({
        version: '1.0',
        table: {
          name: 'Test Table',
          levelRange: { min: 1, max: 5 },
          entries: [
            { speciesName: 'Bulbasaur', weight: 10 },
            { speciesName: 'Fakemon', weight: 5 }
          ]
        }
      })

      mockPrisma.encounterTable.findMany.mockResolvedValue([])
      mockPrisma.speciesData.findMany.mockResolvedValue([
        { id: 'sp-001', name: 'Bulbasaur' }
      ])
      mockPrisma.encounterTable.create.mockResolvedValue({
        id: 'new-table',
        name: 'Test Table',
        levelMin: 1,
        levelMax: 5,
        entries: [
          { id: 'e1', speciesId: 'sp-001', weight: 10, species: { id: 'sp-001', name: 'Bulbasaur', type1: 'Grass', type2: 'Poison' } }
        ],
        modifications: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const { default: handler } = await import('~/server/api/encounter-tables/import.post')
      const result = await handler(mockEvent as any)

      expect(result.warnings).toContain('Fakemon')
    })

    it('should reject invalid import data', async () => {
      mockReadBody.mockResolvedValue({
        invalid: 'data'
      })

      const { default: handler } = await import('~/server/api/encounter-tables/import.post')

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400
      })
    })
  })
})
