import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Tests for POST /api/capture/attempt — ownership validation.
 *
 * PTU p.214: Capture rules target wild Pokemon only.
 * Owned Pokemon (ownerId non-null) must be rejected before any capture logic runs.
 *
 * Uses the same mock-Prisma pattern as pokemon.test.ts / encounters.test.ts.
 * The handler is imported directly and invoked with a mocked H3 event.
 */

// Mock Prisma client
const mockPrisma = {
  pokemon: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  humanCharacter: {
    findUnique: vi.fn()
  },
  speciesData: {
    findUnique: vi.fn()
  }
}

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma
}))

// Mock captureRate utilities to isolate the ownership guard test
vi.mock('~/utils/captureRate', () => ({
  calculateCaptureRate: vi.fn(() => ({
    captureRate: 50,
    canBeCaptured: true,
    hpPercentage: 50,
    breakdown: {
      base: 100,
      levelModifier: -10,
      hpModifier: -20,
      evolutionModifier: 0,
      shinyModifier: 0,
      legendaryModifier: 0,
      statusModifier: 0,
      injuryModifier: 0,
      stuckModifier: 0,
      slowModifier: 0
    }
  })),
  attemptCapture: vi.fn(() => ({
    success: true,
    roll: 30,
    modifiedRoll: 30,
    effectiveCaptureRate: 55,
    naturalHundred: false
  })),
  getCaptureDescription: vi.fn(() => 'Moderate')
}))

vi.mock('~/constants/legendarySpecies', () => ({
  isLegendarySpecies: vi.fn(() => false)
}))

// Import the handler after mocks are set up
import captureAttemptHandler from '~/server/api/capture/attempt.post'

// Helper to create a mock H3 event
function createMockEvent(body: Record<string, unknown>) {
  return {
    _requestBody: body,
    node: { req: {}, res: {} }
  } as any
}

// Patch global H3 auto-imports used by Nitro handlers
vi.stubGlobal('readBody', (event: any) => Promise.resolve(event._requestBody))
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as any
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)

// Test data factories
const createWildPokemon = (overrides = {}) => ({
  id: 'poke-wild-1',
  species: 'Pidgey',
  level: 5,
  currentHp: 15,
  maxHp: 25,
  statusConditions: '[]',
  injuries: 0,
  shiny: false,
  ownerId: null,
  origin: 'wild',
  ...overrides
})

const createOwnedPokemon = (overrides = {}) => ({
  ...createWildPokemon(),
  id: 'poke-owned-1',
  ownerId: 'trainer-rival',
  origin: 'manual',
  ...overrides
})

const createMockTrainer = (overrides = {}) => ({
  id: 'trainer-1',
  name: 'Ash',
  level: 5,
  ...overrides
})

const createMockSpeciesData = (overrides = {}) => ({
  name: 'Pidgey',
  evolutionStage: 1,
  maxEvolutionStage: 3,
  ...overrides
})

describe('POST /api/capture/attempt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ownership validation', () => {
    it('should reject capture of an owned Pokemon with 400', async () => {
      const ownedPokemon = createOwnedPokemon()
      mockPrisma.pokemon.findUnique.mockResolvedValue(ownedPokemon)

      const event = createMockEvent({
        pokemonId: ownedPokemon.id,
        trainerId: 'trainer-1'
      })

      await expect(captureAttemptHandler(event)).rejects.toThrow('Cannot capture an owned Pokemon')
    })

    it('should not look up the trainer when Pokemon is already owned', async () => {
      const ownedPokemon = createOwnedPokemon()
      mockPrisma.pokemon.findUnique.mockResolvedValue(ownedPokemon)

      const event = createMockEvent({
        pokemonId: ownedPokemon.id,
        trainerId: 'trainer-1'
      })

      try {
        await captureAttemptHandler(event)
      } catch {
        // Expected to throw
      }

      // Trainer lookup should never be called — we bail before reaching it
      expect(mockPrisma.humanCharacter.findUnique).not.toHaveBeenCalled()
    })

    it('should allow capture of a wild Pokemon (ownerId is null)', async () => {
      const wildPokemon = createWildPokemon()
      const trainer = createMockTrainer()
      const speciesData = createMockSpeciesData()

      mockPrisma.pokemon.findUnique.mockResolvedValue(wildPokemon)
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(trainer)
      mockPrisma.speciesData.findUnique.mockResolvedValue(speciesData)
      mockPrisma.pokemon.update.mockResolvedValue({ ...wildPokemon, ownerId: trainer.id, origin: 'captured' })

      const event = createMockEvent({
        pokemonId: wildPokemon.id,
        trainerId: trainer.id
      })

      const result = await captureAttemptHandler(event)

      expect(result.success).toBe(true)
      expect(result.data.captured).toBe(true)
    })
  })

  describe('input validation', () => {
    it('should reject when pokemonId is missing', async () => {
      const event = createMockEvent({
        trainerId: 'trainer-1'
      })

      await expect(captureAttemptHandler(event)).rejects.toThrow('pokemonId and trainerId are required')
    })

    it('should reject when trainerId is missing', async () => {
      const event = createMockEvent({
        pokemonId: 'poke-1'
      })

      await expect(captureAttemptHandler(event)).rejects.toThrow('pokemonId and trainerId are required')
    })

    it('should reject when Pokemon does not exist', async () => {
      mockPrisma.pokemon.findUnique.mockResolvedValue(null)

      const event = createMockEvent({
        pokemonId: 'non-existent',
        trainerId: 'trainer-1'
      })

      await expect(captureAttemptHandler(event)).rejects.toThrow('Pokemon not found')
    })
  })
})
