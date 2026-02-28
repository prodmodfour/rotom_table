import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma client
const mockPrisma = {
  pokemon: {
    updateMany: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn()
  },
  humanCharacter: {
    findMany: vi.fn(),
    update: vi.fn()
  },
  $transaction: vi.fn()
}

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma
}))

vi.mock('~/utils/moveFrequency', () => ({
  resetDailyUsage: vi.fn((moves: unknown[]) => moves)
}))

// Import after mocks are set up
import { calculateMaxAp } from '~/utils/restHealing'

describe('New Day — boundAp preservation (decree-016)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.pokemon.updateMany.mockResolvedValue({ count: 0 })
    mockPrisma.pokemon.findMany.mockResolvedValue([])
    mockPrisma.$transaction.mockImplementation(async (ops: Promise<unknown>[]) => {
      return Promise.all(ops)
    })
  })

  it('does NOT clear boundAp on new day (decree-016)', async () => {
    const charWithBoundAp = {
      id: 'char-1',
      level: 10,
      boundAp: 3
    }

    mockPrisma.humanCharacter.findMany.mockResolvedValue([charWithBoundAp])
    mockPrisma.humanCharacter.update.mockResolvedValue({})

    // Import and invoke handler
    const { default: handler } = await import('~/server/api/game/new-day.post')
    await handler({ /* mock event */ } as any)

    // Verify the update call for our character
    expect(mockPrisma.humanCharacter.update).toHaveBeenCalledTimes(1)
    const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]

    // boundAp should NOT be in the update data
    expect(updateCall.data).not.toHaveProperty('boundAp')
  })

  it('calculates currentAp as maxAp minus existing boundAp', async () => {
    const level = 10
    const boundAp = 2
    const expectedMaxAp = calculateMaxAp(level) // 5 + floor(10/5) = 7
    const expectedCurrentAp = expectedMaxAp - boundAp // 7 - 2 = 5

    const charWithBoundAp = {
      id: 'char-1',
      level,
      boundAp
    }

    mockPrisma.humanCharacter.findMany.mockResolvedValue([charWithBoundAp])
    mockPrisma.humanCharacter.update.mockResolvedValue({})

    const { default: handler } = await import('~/server/api/game/new-day.post')
    await handler({ /* mock event */ } as any)

    const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]
    expect(updateCall.data.currentAp).toBe(expectedCurrentAp)
  })

  it('clears drainedAp on new day (decree-019: daily counter)', async () => {
    const charWithDrainedAp = {
      id: 'char-1',
      level: 5,
      boundAp: 0
    }

    mockPrisma.humanCharacter.findMany.mockResolvedValue([charWithDrainedAp])
    mockPrisma.humanCharacter.update.mockResolvedValue({})

    const { default: handler } = await import('~/server/api/game/new-day.post')
    await handler({ /* mock event */ } as any)

    const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]
    expect(updateCall.data.drainedAp).toBe(0)
  })

  it('handles multiple characters with different boundAp values', async () => {
    const characters = [
      { id: 'char-1', level: 5, boundAp: 0 },
      { id: 'char-2', level: 10, boundAp: 3 },
      { id: 'char-3', level: 15, boundAp: 1 }
    ]

    mockPrisma.humanCharacter.findMany.mockResolvedValue(characters)
    mockPrisma.humanCharacter.update.mockResolvedValue({})

    const { default: handler } = await import('~/server/api/game/new-day.post')
    await handler({ /* mock event */ } as any)

    expect(mockPrisma.humanCharacter.update).toHaveBeenCalledTimes(3)

    // char-1: level 5, boundAp 0 → currentAp = 6 - 0 = 6
    const call1 = mockPrisma.humanCharacter.update.mock.calls[0][0]
    expect(call1.where.id).toBe('char-1')
    expect(call1.data.currentAp).toBe(calculateMaxAp(5) - 0)
    expect(call1.data).not.toHaveProperty('boundAp')

    // char-2: level 10, boundAp 3 → currentAp = 7 - 3 = 4
    const call2 = mockPrisma.humanCharacter.update.mock.calls[1][0]
    expect(call2.where.id).toBe('char-2')
    expect(call2.data.currentAp).toBe(calculateMaxAp(10) - 3)

    // char-3: level 15, boundAp 1 → currentAp = 8 - 1 = 7
    const call3 = mockPrisma.humanCharacter.update.mock.calls[2][0]
    expect(call3.where.id).toBe('char-3')
    expect(call3.data.currentAp).toBe(calculateMaxAp(15) - 1)
  })

  it('resets daily counters (restMinutesToday, injuriesHealedToday)', async () => {
    const character = { id: 'char-1', level: 5, boundAp: 0 }

    mockPrisma.humanCharacter.findMany.mockResolvedValue([character])
    mockPrisma.humanCharacter.update.mockResolvedValue({})

    const { default: handler } = await import('~/server/api/game/new-day.post')
    await handler({ /* mock event */ } as any)

    const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]
    expect(updateCall.data.restMinutesToday).toBe(0)
    expect(updateCall.data.injuriesHealedToday).toBe(0)
    expect(updateCall.data.lastRestReset).toBeInstanceOf(Date)
  })

  it('sets currentAp to full maxAp when boundAp is zero', async () => {
    const character = { id: 'char-1', level: 10, boundAp: 0 }

    mockPrisma.humanCharacter.findMany.mockResolvedValue([character])
    mockPrisma.humanCharacter.update.mockResolvedValue({})

    const { default: handler } = await import('~/server/api/game/new-day.post')
    await handler({ /* mock event */ } as any)

    const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]
    // Level 10: maxAp = 5 + floor(10/5) = 7, boundAp = 0 → currentAp = 7
    expect(updateCall.data.currentAp).toBe(7)
  })
})
