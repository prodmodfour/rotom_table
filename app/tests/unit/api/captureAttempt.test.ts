import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Tests for POST /api/capture/attempt — ownership validation and ball modifier integration.
 *
 * PTU p.214: Capture rules target wild Pokemon only.
 * Owned Pokemon (ownerId non-null) must be rejected before any capture logic runs.
 *
 * Uses the same mock-Prisma pattern as pokemon.test.ts / encounters.test.ts.
 * The handler is imported directly and invoked with a mocked H3 event.
 */

// vi.hoisted runs BEFORE vi.mock hoisting, so these are available in mock factories
const {
  mockPrisma,
  mockAttemptCapture,
  mockCalculateBallModifier,
} = vi.hoisted(() => {
  // Stub H3 auto-imports used by Nitro handlers (must happen before handler import)
  (globalThis as any).readBody = (event: any) => Promise.resolve(event._requestBody);
  (globalThis as any).createError = (opts: { statusCode: number; message: string }) => {
    const err = new Error(opts.message) as any
    err.statusCode = opts.statusCode
    return err
  };
  (globalThis as any).defineEventHandler = (fn: Function) => fn

  return {
    mockPrisma: {
      pokemon: {
        findUnique: vi.fn(),
        update: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
      },
      humanCharacter: {
        findUnique: vi.fn(),
      },
      speciesData: {
        findUnique: vi.fn(),
      },
      encounter: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    },
    mockAttemptCapture: vi.fn(() => ({
      success: true,
      roll: 30,
      modifiedRoll: 30,
      effectiveCaptureRate: 55,
      naturalHundred: false,
      ballModifier: 0,
    })),
    mockCalculateBallModifier: vi.fn(() => ({
      total: 0,
      base: 0,
      conditional: 0,
      conditionMet: false,
    })),
  }
})

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma,
}))

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
      slowModifier: 0,
    },
  })),
  attemptCapture: mockAttemptCapture,
  getCaptureDescription: vi.fn(() => 'Moderate'),
}))

vi.mock('~/constants/legendarySpecies', () => ({
  isLegendarySpecies: vi.fn(() => false),
}))

vi.mock('~/constants/pokeBalls', () => ({
  POKE_BALL_CATALOG: {
    'Basic Ball': {
      id: 1, name: 'Basic Ball', category: 'basic', modifier: 0,
      description: 'Basic Poke Ball', cost: 250,
    },
    'Great Ball': {
      id: 2, name: 'Great Ball', category: 'basic', modifier: -10,
      description: 'A better Poke Ball', cost: 400,
      conditionDescription: undefined,
    },
    'Ultra Ball': {
      id: 3, name: 'Ultra Ball', category: 'basic', modifier: -15,
      description: 'The best generic Poke Ball', cost: 800,
      conditionDescription: undefined,
    },
  },
  DEFAULT_BALL_TYPE: 'Basic Ball',
  calculateBallModifier: mockCalculateBallModifier,
}))

vi.mock('~/utils/trainerExperience', () => ({
  applyTrainerXp: vi.fn(() => ({
    previousXp: 0, newXp: 1, previousLevel: 1, newLevel: 1, levelsGained: 0,
  })),
  isNewSpecies: vi.fn(() => false),
}))

vi.mock('~/server/utils/websocket', () => ({
  broadcast: vi.fn(),
}))

// Import the handler after mocks are set up
import captureAttemptHandler from '~/server/api/capture/attempt.post'

// Helper to create a mock H3 event
function createMockEvent(body: Record<string, unknown>) {
  return {
    _requestBody: body,
    node: { req: {}, res: {} },
  } as any
}

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
  gender: 'Male',
  ownerId: null,
  origin: 'wild',
  ...overrides,
})

const createOwnedPokemon = (overrides = {}) => ({
  ...createWildPokemon(),
  id: 'poke-owned-1',
  ownerId: 'trainer-rival',
  origin: 'manual',
  ...overrides,
})

const createMockTrainer = (overrides = {}) => ({
  id: 'trainer-1',
  name: 'Ash',
  level: 5,
  ...overrides,
})

const createMockSpeciesData = (overrides = {}) => ({
  name: 'Pidgey',
  evolutionStage: 1,
  maxEvolutionStage: 3,
  type1: 'Normal',
  type2: 'Flying',
  weightClass: 1,
  overland: 3,
  swim: 0,
  sky: 5,
  evolutionTriggers: '[]',
  ...overrides,
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
        trainerId: 'trainer-1',
      })

      await expect(captureAttemptHandler(event)).rejects.toThrow('Cannot capture an owned Pokemon')
    })

    it('should not look up the trainer when Pokemon is already owned', async () => {
      const ownedPokemon = createOwnedPokemon()
      mockPrisma.pokemon.findUnique.mockResolvedValue(ownedPokemon)

      const event = createMockEvent({
        pokemonId: ownedPokemon.id,
        trainerId: 'trainer-1',
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
        trainerId: trainer.id,
      })

      const result = await captureAttemptHandler(event)

      expect(result.success).toBe(true)
      expect(result.data.captured).toBe(true)
    })
  })

  describe('input validation', () => {
    it('should reject when pokemonId is missing', async () => {
      const event = createMockEvent({
        trainerId: 'trainer-1',
      })

      await expect(captureAttemptHandler(event)).rejects.toThrow('pokemonId and trainerId are required')
    })

    it('should reject when trainerId is missing', async () => {
      const event = createMockEvent({
        pokemonId: 'poke-1',
      })

      await expect(captureAttemptHandler(event)).rejects.toThrow('pokemonId and trainerId are required')
    })

    it('should reject when Pokemon does not exist', async () => {
      mockPrisma.pokemon.findUnique.mockResolvedValue(null)

      const event = createMockEvent({
        pokemonId: 'non-existent',
        trainerId: 'trainer-1',
      })

      await expect(captureAttemptHandler(event)).rejects.toThrow('Pokemon not found')
    })
  })

  describe('ball modifier integration', () => {
    it('should pass the ball type to calculateBallModifier and include result in response', async () => {
      const wildPokemon = createWildPokemon()
      const trainer = createMockTrainer()
      const speciesData = createMockSpeciesData()

      mockPrisma.pokemon.findUnique.mockResolvedValue(wildPokemon)
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(trainer)
      mockPrisma.speciesData.findUnique.mockResolvedValue(speciesData)
      mockPrisma.pokemon.update.mockResolvedValue({ ...wildPokemon, ownerId: trainer.id, origin: 'captured' })

      // Configure Great Ball modifier
      mockCalculateBallModifier.mockReturnValue({
        total: -10,
        base: -10,
        conditional: 0,
        conditionMet: false,
      })

      const event = createMockEvent({
        pokemonId: wildPokemon.id,
        trainerId: trainer.id,
        ballType: 'Great Ball',
      })

      const result = await captureAttemptHandler(event)

      // Verify calculateBallModifier was called with ball type + condition context
      expect(mockCalculateBallModifier).toHaveBeenCalledWith(
        'Great Ball',
        expect.objectContaining({ targetLevel: 5, targetSpecies: 'Pidgey' })
      )

      // Verify the ball modifier is included in the response
      expect(result.data.ballType).toBe('Great Ball')
      expect(result.data.ballModifier).toBe(-10)
      expect(result.data.ballBreakdown).toEqual({
        baseModifier: -10,
        conditionalModifier: 0,
        conditionMet: false,
        conditionDescription: undefined,
      })
    })

    it('should pass ball modifier total to attemptCapture', async () => {
      const wildPokemon = createWildPokemon()
      const trainer = createMockTrainer()
      const speciesData = createMockSpeciesData()

      mockPrisma.pokemon.findUnique.mockResolvedValue(wildPokemon)
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(trainer)
      mockPrisma.speciesData.findUnique.mockResolvedValue(speciesData)
      mockPrisma.pokemon.update.mockResolvedValue({ ...wildPokemon, ownerId: trainer.id, origin: 'captured' })

      mockCalculateBallModifier.mockReturnValue({
        total: -15,
        base: -15,
        conditional: 0,
        conditionMet: false,
      })

      const event = createMockEvent({
        pokemonId: wildPokemon.id,
        trainerId: trainer.id,
        ballType: 'Ultra Ball',
      })

      await captureAttemptHandler(event)

      // attemptCapture should receive -15 as the ball modifier (5th argument)
      expect(mockAttemptCapture).toHaveBeenCalledWith(
        50,    // captureRate
        5,     // trainerLevel
        0,     // modifiers
        false, // criticalHit
        -15,   // ballModifier total
      )
    })

    it('should reject unknown ball types with 400 error', async () => {
      const wildPokemon = createWildPokemon()
      mockPrisma.pokemon.findUnique.mockResolvedValue(wildPokemon)

      const event = createMockEvent({
        pokemonId: wildPokemon.id,
        trainerId: 'trainer-1',
        ballType: 'Nonexistent Ball',
      })

      await expect(captureAttemptHandler(event)).rejects.toThrow('Unknown ball type: Nonexistent Ball')
    })

    it('should default to Basic Ball when no ballType is provided', async () => {
      const wildPokemon = createWildPokemon()
      const trainer = createMockTrainer()
      const speciesData = createMockSpeciesData()

      mockPrisma.pokemon.findUnique.mockResolvedValue(wildPokemon)
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(trainer)
      mockPrisma.speciesData.findUnique.mockResolvedValue(speciesData)
      mockPrisma.pokemon.update.mockResolvedValue({ ...wildPokemon, ownerId: trainer.id, origin: 'captured' })

      mockCalculateBallModifier.mockReturnValue({
        total: 0,
        base: 0,
        conditional: 0,
        conditionMet: false,
      })

      const event = createMockEvent({
        pokemonId: wildPokemon.id,
        trainerId: trainer.id,
        // No ballType specified
      })

      const result = await captureAttemptHandler(event)

      expect(mockCalculateBallModifier).toHaveBeenCalledWith(
        'Basic Ball',
        expect.objectContaining({ targetLevel: 5, targetSpecies: 'Pidgey' })
      )
      expect(result.data.ballType).toBe('Basic Ball')
    })
  })
})
