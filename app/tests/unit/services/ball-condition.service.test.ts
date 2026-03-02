import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Unit tests for ball-condition.service.ts
 *
 * Tests the shared buildConditionContext function and its helpers:
 * - checkEvolvesWithStone: stone evolution detection from triggers JSON
 * - deriveEvoLine: evolution line derivation from triggers JSON
 * - buildConditionContext: full context assembly from DB data with GM overrides
 *
 * Covers code-review-277 M3 (zero test coverage for buildConditionContext).
 */

// vi.hoisted runs BEFORE vi.mock hoisting
const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      encounter: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
      pokemon: {
        count: vi.fn().mockResolvedValue(0),
      },
      speciesData: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    },
  }
})

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma,
}))

import {
  buildConditionContext,
  checkEvolvesWithStone,
  deriveEvoLine,
} from '~/server/services/ball-condition.service'

// ============================================
// PURE FUNCTION TESTS: checkEvolvesWithStone
// ============================================

describe('checkEvolvesWithStone', () => {
  it('returns false for undefined triggers', () => {
    expect(checkEvolvesWithStone(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(checkEvolvesWithStone('')).toBe(false)
  })

  it('returns false for empty array', () => {
    expect(checkEvolvesWithStone('[]')).toBe(false)
  })

  it('returns false for non-array JSON', () => {
    expect(checkEvolvesWithStone('{"requiredItem": "Moon Stone"}')).toBe(false)
  })

  it('returns false for invalid JSON', () => {
    expect(checkEvolvesWithStone('not json')).toBe(false)
  })

  it('returns true for Moon Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Nidoking', requiredItem: 'Moon Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true for Fire Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Arcanine', requiredItem: 'Fire Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true for Water Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Starmie', requiredItem: 'Water Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true for Thunder Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Raichu', requiredItem: 'Thunder Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true for Leaf Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Vileplume', requiredItem: 'Leaf Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true for Sun Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Bellossom', requiredItem: 'Sun Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true for Shiny Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Togekiss', requiredItem: 'Shiny Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true for Dusk Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Mismagius', requiredItem: 'Dusk Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true for Dawn Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Gallade', requiredItem: 'Dawn Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true for Ice Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Alolan Ninetales', requiredItem: 'Ice Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true for Oval Stone evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Chansey', requiredItem: 'Oval Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns true when generic "stone" keyword matches', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Evolved', requiredItem: 'Some Special Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('is case-insensitive', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Raichu', requiredItem: 'THUNDER STONE' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('returns false for level-up evolution (no requiredItem)', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Charmeleon', requiredLevel: 16 }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(false)
  })

  it('returns false for trade evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Gengar', method: 'trade' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(false)
  })

  it('returns false for non-stone item evolution', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Steelix', requiredItem: 'Metal Coat' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(false)
  })

  it('returns true if any trigger has a stone (mixed triggers)', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Charmeleon', requiredLevel: 16 },
      { toSpecies: 'Raichu', requiredItem: 'Thunder Stone' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(true)
  })

  it('handles trigger with empty requiredItem string', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Something', requiredItem: '' }
    ])
    expect(checkEvolvesWithStone(triggers)).toBe(false)
  })
})

// ============================================
// PURE FUNCTION TESTS: deriveEvoLine
// ============================================

describe('deriveEvoLine', () => {
  it('returns array with just the species name when no triggers', () => {
    expect(deriveEvoLine('Pikachu')).toEqual(['Pikachu'])
  })

  it('returns array with just the species name for undefined triggers', () => {
    expect(deriveEvoLine('Pikachu', undefined)).toEqual(['Pikachu'])
  })

  it('returns array with just the species name for empty triggers array', () => {
    expect(deriveEvoLine('Pikachu', '[]')).toEqual(['Pikachu'])
  })

  it('includes toSpecies from triggers', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Raichu', requiredItem: 'Thunder Stone' }
    ])
    expect(deriveEvoLine('Pikachu', triggers)).toEqual(['Pikachu', 'Raichu'])
  })

  it('includes multiple toSpecies', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Vaporeon', requiredItem: 'Water Stone' },
      { toSpecies: 'Jolteon', requiredItem: 'Thunder Stone' },
      { toSpecies: 'Flareon', requiredItem: 'Fire Stone' },
    ])
    expect(deriveEvoLine('Eevee', triggers)).toEqual(['Eevee', 'Vaporeon', 'Jolteon', 'Flareon'])
  })

  it('does not duplicate the species name if it appears in toSpecies', () => {
    const triggers = JSON.stringify([
      { toSpecies: 'Pikachu', requiredLevel: 1 }
    ])
    expect(deriveEvoLine('Pikachu', triggers)).toEqual(['Pikachu'])
  })

  it('handles invalid JSON gracefully', () => {
    expect(deriveEvoLine('Pikachu', 'not json')).toEqual(['Pikachu'])
  })

  it('handles non-array JSON gracefully', () => {
    expect(deriveEvoLine('Pikachu', '{"toSpecies": "Raichu"}')).toEqual(['Pikachu'])
  })

  it('handles triggers without toSpecies field', () => {
    const triggers = JSON.stringify([
      { requiredLevel: 16 }
    ])
    expect(deriveEvoLine('Charmander', triggers)).toEqual(['Charmander'])
  })
})

// ============================================
// DB-DEPENDENT TESTS: buildConditionContext
// ============================================

describe('buildConditionContext', () => {
  const basePokemon = { species: 'Pidgey', level: 5, gender: 'Male' }
  const baseSpeciesData = {
    name: 'Pidgey',
    type1: 'Normal',
    type2: 'Flying',
    weightClass: 1,
    overland: 3,
    swim: 0,
    sky: 5,
    evolutionTriggers: JSON.stringify([{ toSpecies: 'Pidgeotto', requiredLevel: 18 }]),
  }
  const baseTrainer = { id: 'trainer-1' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.encounter.findUnique.mockResolvedValue(null)
    mockPrisma.pokemon.count.mockResolvedValue(0)
    mockPrisma.speciesData.findUnique.mockResolvedValue(null)
  })

  it('populates target fields from species data', async () => {
    const context = await buildConditionContext(basePokemon, baseSpeciesData, baseTrainer)

    expect(context.targetLevel).toBe(5)
    expect(context.targetSpecies).toBe('Pidgey')
    expect(context.targetTypes).toEqual(['Normal', 'Flying'])
    expect(context.targetWeightClass).toBe(1)
    expect(context.targetGender).toBe('Male')
  })

  it('derives highest movement speed from species data', async () => {
    const context = await buildConditionContext(basePokemon, baseSpeciesData, baseTrainer)

    // Pidgey: overland=3, swim=0, sky=5 -> max is 5
    expect(context.targetMovementSpeed).toBe(5)
  })

  it('derives target evo line from species data', async () => {
    const context = await buildConditionContext(basePokemon, baseSpeciesData, baseTrainer)

    expect(context.targetEvoLine).toEqual(['Pidgey', 'Pidgeotto'])
  })

  it('detects stone evolution from species data', async () => {
    const stoneSpecies = {
      ...baseSpeciesData,
      name: 'Pikachu',
      type1: 'Electric',
      type2: null,
      evolutionTriggers: JSON.stringify([{ toSpecies: 'Raichu', requiredItem: 'Thunder Stone' }]),
    }
    const pokemon = { species: 'Pikachu', level: 10, gender: 'Male' }

    const context = await buildConditionContext(pokemon, stoneSpecies, baseTrainer)

    expect(context.targetEvolvesWithStone).toBe(true)
  })

  it('defaults to no stone evolution when triggers have no stone', async () => {
    const context = await buildConditionContext(basePokemon, baseSpeciesData, baseTrainer)

    expect(context.targetEvolvesWithStone).toBe(false)
  })

  it('handles null speciesData gracefully', async () => {
    const context = await buildConditionContext(basePokemon, null, baseTrainer)

    expect(context.targetTypes).toEqual([])
    expect(context.targetWeightClass).toBe(1)
    expect(context.targetMovementSpeed).toBe(5)
    expect(context.targetEvolvesWithStone).toBe(false)
    expect(context.targetEvoLine).toEqual(['Pidgey'])
  })

  it('handles single-type species (no type2)', async () => {
    const singleTypeSpecies = { ...baseSpeciesData, type2: null }
    const context = await buildConditionContext(basePokemon, singleTypeSpecies, baseTrainer)

    expect(context.targetTypes).toEqual(['Normal'])
  })

  it('defaults gender to N when pokemon gender is empty', async () => {
    const genderlessPokemon = { species: 'Magnemite', level: 10, gender: '' }
    const context = await buildConditionContext(genderlessPokemon, baseSpeciesData, baseTrainer)

    expect(context.targetGender).toBe('N')
  })

  // --- Encounter round lookup ---

  it('defaults encounterRound to 1 when no encounterId', async () => {
    const context = await buildConditionContext(basePokemon, baseSpeciesData, baseTrainer)

    expect(context.encounterRound).toBe(1)
  })

  it('reads encounterRound from the encounter record', async () => {
    mockPrisma.encounter.findUnique.mockResolvedValue({
      id: 'enc-1',
      currentRound: 5,
      combatants: '[]',
    })

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, 'enc-1'
    )

    expect(context.encounterRound).toBe(5)
  })

  it('defaults encounterRound to 1 when encounter has null currentRound', async () => {
    mockPrisma.encounter.findUnique.mockResolvedValue({
      id: 'enc-1',
      currentRound: null,
      combatants: '[]',
    })

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, 'enc-1'
    )

    expect(context.encounterRound).toBe(1)
  })

  it('defaults encounterRound to 1 when encounter not found', async () => {
    mockPrisma.encounter.findUnique.mockResolvedValue(null)

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, 'nonexistent-enc'
    )

    expect(context.encounterRound).toBe(1)
  })

  // --- Active Pokemon resolution ---

  it('resolves active Pokemon level and gender from encounter combatants', async () => {
    const combatants = [
      {
        type: 'pokemon',
        entity: {
          species: 'Charizard',
          ownerId: 'trainer-1',
          level: 30,
          gender: 'Male',
          statusConditions: '[]',
        },
      },
    ]

    mockPrisma.encounter.findUnique.mockResolvedValue({
      id: 'enc-1',
      currentRound: 3,
      combatants: JSON.stringify(combatants),
    })
    mockPrisma.speciesData.findUnique.mockResolvedValue({
      name: 'Charizard',
      evolutionTriggers: JSON.stringify([]),
    })

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, 'enc-1'
    )

    expect(context.activePokemonLevel).toBe(30)
    expect(context.activePokemonGender).toBe('Male')
  })

  it('skips fainted Pokemon when finding active Pokemon', async () => {
    const combatants = [
      {
        type: 'pokemon',
        entity: {
          species: 'Pikachu',
          ownerId: 'trainer-1',
          level: 20,
          gender: 'Male',
          statusConditions: '["Fainted"]',
        },
      },
      {
        type: 'pokemon',
        entity: {
          species: 'Charizard',
          ownerId: 'trainer-1',
          level: 35,
          gender: 'Female',
          statusConditions: '[]',
        },
      },
    ]

    mockPrisma.encounter.findUnique.mockResolvedValue({
      id: 'enc-1',
      currentRound: 2,
      combatants: JSON.stringify(combatants),
    })
    mockPrisma.speciesData.findUnique.mockResolvedValue({
      name: 'Charizard',
      evolutionTriggers: '[]',
    })

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, 'enc-1'
    )

    // Should pick Charizard (second, non-fainted), not Pikachu (first, fainted)
    expect(context.activePokemonLevel).toBe(35)
    expect(context.activePokemonGender).toBe('Female')
  })

  it('skips enemy Pokemon (different owner) when finding active', async () => {
    const combatants = [
      {
        type: 'pokemon',
        entity: {
          species: 'Rattata',
          ownerId: 'other-trainer',
          level: 3,
          gender: 'Male',
          statusConditions: '[]',
        },
      },
      {
        type: 'pokemon',
        entity: {
          species: 'Bulbasaur',
          ownerId: 'trainer-1',
          level: 12,
          gender: 'Female',
          statusConditions: '[]',
        },
      },
    ]

    mockPrisma.encounter.findUnique.mockResolvedValue({
      id: 'enc-1',
      currentRound: 1,
      combatants: JSON.stringify(combatants),
    })
    mockPrisma.speciesData.findUnique.mockResolvedValue({
      name: 'Bulbasaur',
      evolutionTriggers: JSON.stringify([{ toSpecies: 'Ivysaur' }]),
    })

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, 'enc-1'
    )

    expect(context.activePokemonLevel).toBe(12)
    expect(context.activePokemonGender).toBe('Female')
    expect(context.activePokemonEvoLine).toEqual(['Bulbasaur', 'Ivysaur'])
  })

  it('sets active Pokemon fields to undefined when no trainer Pokemon in encounter', async () => {
    const combatants = [
      {
        type: 'pokemon',
        entity: {
          species: 'Rattata',
          ownerId: 'other-trainer',
          level: 3,
          gender: 'Male',
          statusConditions: '[]',
        },
      },
    ]

    mockPrisma.encounter.findUnique.mockResolvedValue({
      id: 'enc-1',
      currentRound: 1,
      combatants: JSON.stringify(combatants),
    })

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, 'enc-1'
    )

    expect(context.activePokemonLevel).toBeUndefined()
    expect(context.activePokemonGender).toBeUndefined()
    expect(context.activePokemonEvoLine).toBeUndefined()
  })

  it('defaults active Pokemon gender to N when entity gender is empty', async () => {
    const combatants = [
      {
        type: 'pokemon',
        entity: {
          species: 'Magnemite',
          ownerId: 'trainer-1',
          level: 15,
          gender: '',
          statusConditions: '[]',
        },
      },
    ]

    mockPrisma.encounter.findUnique.mockResolvedValue({
      id: 'enc-1',
      currentRound: 1,
      combatants: JSON.stringify(combatants),
    })
    mockPrisma.speciesData.findUnique.mockResolvedValue({
      name: 'Magnemite',
      evolutionTriggers: '[]',
    })

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, 'enc-1'
    )

    expect(context.activePokemonGender).toBe('N')
  })

  // --- Species ownership ---

  it('sets trainerOwnsSpecies to true when trainer owns the species', async () => {
    mockPrisma.pokemon.count.mockResolvedValue(2)

    const context = await buildConditionContext(basePokemon, baseSpeciesData, baseTrainer)

    expect(context.trainerOwnsSpecies).toBe(true)
    expect(mockPrisma.pokemon.count).toHaveBeenCalledWith({
      where: { ownerId: 'trainer-1', species: 'Pidgey' },
    })
  })

  it('sets trainerOwnsSpecies to false when trainer does not own the species', async () => {
    mockPrisma.pokemon.count.mockResolvedValue(0)

    const context = await buildConditionContext(basePokemon, baseSpeciesData, baseTrainer)

    expect(context.trainerOwnsSpecies).toBe(false)
  })

  // --- GM override merging ---

  it('GM overrides take priority over auto-populated values', async () => {
    const gmOverrides = {
      encounterRound: 10,
      isDarkOrLowLight: true,
      targetWasBaited: true,
      isUnderwaterOrUnderground: true,
      targetLevel: 99,
    }

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, undefined, gmOverrides
    )

    expect(context.encounterRound).toBe(10)
    expect(context.isDarkOrLowLight).toBe(true)
    expect(context.targetWasBaited).toBe(true)
    expect(context.isUnderwaterOrUnderground).toBe(true)
    expect(context.targetLevel).toBe(99)
  })

  it('GM overrides merge with (not replace) auto-populated context', async () => {
    const gmOverrides = {
      isDarkOrLowLight: true,
    }

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, undefined, gmOverrides
    )

    // Auto-populated fields still present
    expect(context.targetSpecies).toBe('Pidgey')
    expect(context.targetTypes).toEqual(['Normal', 'Flying'])
    expect(context.targetLevel).toBe(5)
    // GM override present
    expect(context.isDarkOrLowLight).toBe(true)
  })

  it('empty GM overrides do not affect auto-populated context', async () => {
    const context1 = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, undefined, {}
    )
    const context2 = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, undefined, undefined
    )

    expect(context1.targetLevel).toBe(context2.targetLevel)
    expect(context1.targetSpecies).toBe(context2.targetSpecies)
  })

  // --- Edge cases ---

  it('skips trainer combatants when finding active Pokemon', async () => {
    const combatants = [
      {
        type: 'trainer',
        entity: {
          ownerId: 'trainer-1',
          level: 10,
        },
      },
      {
        type: 'pokemon',
        entity: {
          species: 'Squirtle',
          ownerId: 'trainer-1',
          level: 8,
          gender: 'Male',
          statusConditions: '[]',
        },
      },
    ]

    mockPrisma.encounter.findUnique.mockResolvedValue({
      id: 'enc-1',
      currentRound: 1,
      combatants: JSON.stringify(combatants),
    })
    mockPrisma.speciesData.findUnique.mockResolvedValue({
      name: 'Squirtle',
      evolutionTriggers: '[]',
    })

    const context = await buildConditionContext(
      basePokemon, baseSpeciesData, baseTrainer, 'enc-1'
    )

    // Should find Squirtle, not the trainer
    expect(context.activePokemonLevel).toBe(8)
  })
})
