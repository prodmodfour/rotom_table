import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * T3: Tests for POST /api/characters/[id]/xp — Trainer XP endpoint.
 *
 * Validates input validation, successful XP award, level-up detection,
 * and WebSocket broadcast behavior.
 */

// Use vi.hoisted() to define mock variables that can be referenced in vi.mock factories
const { mockPrisma, mockBroadcast } = vi.hoisted(() => {
  const mocks = {
    mockPrisma: {
      humanCharacter: {
        findUnique: vi.fn(),
        update: vi.fn()
      }
    },
    mockBroadcast: vi.fn()
  }

  // Stub H3 auto-imports (must be defined before module imports via vi.mock hoisting)
  globalThis.getRouterParam = (_event: any, param: string) => _event._routerParams?.[param]
  globalThis.readBody = (event: any) => Promise.resolve(event._requestBody)
  globalThis.createError = (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as any
    err.statusCode = opts.statusCode
    return err
  }
  globalThis.defineEventHandler = (fn: Function) => fn

  return mocks
})

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma
}))

vi.mock('~/server/utils/websocket', () => ({
  broadcast: mockBroadcast
}))

// Mock the serializer to return a passthrough
vi.mock('~/server/utils/serializers', () => ({
  serializeCharacter: (char: any) => char
}))

// Import the handler after mocks are set up
import xpHandler from '~/server/api/characters/[id]/xp.post'

// Helper to create a mock H3 event
function createMockEvent(id: string | undefined, body: Record<string, unknown>) {
  return {
    _routerParams: id ? { id } : {},
    _requestBody: body,
    node: { req: {}, res: {} }
  } as any
}

// Factory for character
function createCharacter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'char-1',
    name: 'Ash',
    level: 5,
    trainerXp: 3,
    capturedSpecies: '[]',
    trainerClasses: '[]',
    skills: '{}',
    features: '[]',
    edges: '[]',
    capabilities: '[]',
    equipment: '{}',
    inventory: '[]',
    statusConditions: '[]',
    stageModifiers: '{}',
    pokemon: [],
    ...overrides
  }
}

describe('POST /api/characters/[id]/xp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // T3.1 Input Validation
  describe('input validation', () => {
    it('rejects missing character ID', async () => {
      const event = createMockEvent(undefined, { amount: 5 })
      await expect(xpHandler(event)).rejects.toThrow('Character ID is required')
    })

    it('rejects missing amount', async () => {
      const event = createMockEvent('char-1', {})
      await expect(xpHandler(event)).rejects.toThrow('amount must be an integer')
    })

    it('rejects non-integer amount', async () => {
      const event = createMockEvent('char-1', { amount: 2.5 })
      await expect(xpHandler(event)).rejects.toThrow('amount must be an integer')
    })

    it('rejects zero amount', async () => {
      const event = createMockEvent('char-1', { amount: 0 })
      await expect(xpHandler(event)).rejects.toThrow('amount must be non-zero')
    })

    it('rejects out-of-range positive amount', async () => {
      const event = createMockEvent('char-1', { amount: 200 })
      await expect(xpHandler(event)).rejects.toThrow('amount must be between -100 and 100')
    })

    it('rejects out-of-range negative amount', async () => {
      const event = createMockEvent('char-1', { amount: -200 })
      await expect(xpHandler(event)).rejects.toThrow('amount must be between -100 and 100')
    })

    it('rejects non-existent character', async () => {
      mockPrisma.humanCharacter.findUnique.mockResolvedValueOnce(null)
      const event = createMockEvent('nonexistent', { amount: 5 })
      await expect(xpHandler(event)).rejects.toThrow('Character not found')
    })
  })

  // T3.2 Successful XP Award
  describe('successful XP award', () => {
    it('awards XP without level-up', async () => {
      const char = createCharacter({ trainerXp: 3, level: 5 })
      mockPrisma.humanCharacter.findUnique.mockResolvedValueOnce(char)
      mockPrisma.humanCharacter.update.mockResolvedValueOnce({
        ...char,
        trainerXp: 7
      })

      const event = createMockEvent('char-1', { amount: 4 })
      const response = await xpHandler(event)

      expect(response.success).toBe(true)
      expect(response.data.newXp).toBe(7)
      expect(response.data.newLevel).toBe(5)
      expect(response.data.levelsGained).toBe(0)
    })

    it('awards XP with level-up', async () => {
      const char = createCharacter({ trainerXp: 8, level: 5 })
      mockPrisma.humanCharacter.findUnique.mockResolvedValueOnce(char)
      mockPrisma.humanCharacter.update.mockResolvedValueOnce({
        ...char,
        trainerXp: 3,
        level: 6
      })

      const event = createMockEvent('char-1', { amount: 5 })
      const response = await xpHandler(event)

      expect(response.success).toBe(true)
      expect(response.data.newXp).toBe(3)
      expect(response.data.newLevel).toBe(6)
      expect(response.data.levelsGained).toBe(1)
    })

    it('updates database with correct values', async () => {
      const char = createCharacter({ trainerXp: 8, level: 5 })
      mockPrisma.humanCharacter.findUnique.mockResolvedValueOnce(char)
      mockPrisma.humanCharacter.update.mockResolvedValueOnce({
        ...char,
        trainerXp: 3,
        level: 6
      })

      const event = createMockEvent('char-1', { amount: 5 })
      await xpHandler(event)

      expect(mockPrisma.humanCharacter.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { trainerXp: 3, level: 6 },
        include: { pokemon: true }
      })
    })

    it('broadcasts character_update on level-up', async () => {
      const char = createCharacter({ trainerXp: 9, level: 5 })
      mockPrisma.humanCharacter.findUnique.mockResolvedValueOnce(char)
      mockPrisma.humanCharacter.update.mockResolvedValueOnce({
        ...char,
        trainerXp: 0,
        level: 6
      })

      const event = createMockEvent('char-1', { amount: 1 })
      await xpHandler(event)

      expect(mockBroadcast).toHaveBeenCalledWith({
        type: 'character_update',
        data: { characterId: 'char-1' }
      })
    })

    it('does not broadcast without level-up', async () => {
      const char = createCharacter({ trainerXp: 3, level: 5 })
      mockPrisma.humanCharacter.findUnique.mockResolvedValueOnce(char)
      mockPrisma.humanCharacter.update.mockResolvedValueOnce({
        ...char,
        trainerXp: 5
      })

      const event = createMockEvent('char-1', { amount: 2 })
      await xpHandler(event)

      expect(mockBroadcast).not.toHaveBeenCalled()
    })

    it('handles deduction correctly', async () => {
      const char = createCharacter({ trainerXp: 7, level: 5 })
      mockPrisma.humanCharacter.findUnique.mockResolvedValueOnce(char)
      mockPrisma.humanCharacter.update.mockResolvedValueOnce({
        ...char,
        trainerXp: 4
      })

      const event = createMockEvent('char-1', { amount: -3 })
      const response = await xpHandler(event)

      expect(response.data.newXp).toBe(4)
      expect(response.data.levelsGained).toBe(0)
    })
  })
})
