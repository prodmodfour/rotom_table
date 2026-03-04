import { describe, it, expect } from 'vitest'
import { reconstructWieldRelationships } from '~/server/services/living-weapon-state'
import type { Combatant } from '~/types/encounter'
import type { Pokemon, HumanCharacter } from '~/types/character'

// ============================================================
// Test Helpers
// ============================================================

function makeDefaultTurnState() {
  return {
    hasActed: false,
    standardActionUsed: false,
    shiftActionUsed: false,
    swiftActionUsed: false,
    canBeCommanded: true,
    isHolding: false,
  }
}

function makeHumanCombatant(id: string, wieldingWeaponId?: string): Combatant {
  return {
    id,
    type: 'human',
    entityId: `entity-${id}`,
    side: 'players',
    initiative: 10,
    initiativeBonus: 0,
    turnState: makeDefaultTurnState(),
    hasActed: false,
    actionsRemaining: 1,
    shiftActionsRemaining: 1,
    injuries: { count: 0, sources: [] },
    badlyPoisonedRound: 0,
    physicalEvasion: 3,
    specialEvasion: 3,
    speedEvasion: 3,
    tokenSize: 1,
    ...(wieldingWeaponId !== undefined ? { wieldingWeaponId } : {}),
    entity: {
      id: `entity-${id}`,
      name: 'Trainer',
      characterType: 'player',
      level: 10,
      stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 5, speed: 10 },
      currentHp: 60,
      maxHp: 60,
      stageModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
      statusConditions: [],
      injuries: 0,
      skills: {},
      trainerClasses: [],
      features: [],
      equipment: {},
    } as unknown as HumanCharacter,
  } as Combatant
}

function makePokemonCombatant(
  id: string,
  species: string,
  overrides: { currentHp?: number; statusConditions?: string[] } = {}
): Combatant {
  return {
    id,
    type: 'pokemon',
    entityId: `entity-${id}`,
    side: 'players',
    initiative: 8,
    initiativeBonus: 0,
    turnState: makeDefaultTurnState(),
    hasActed: false,
    actionsRemaining: 1,
    shiftActionsRemaining: 1,
    injuries: { count: 0, sources: [] },
    badlyPoisonedRound: 0,
    physicalEvasion: 2,
    specialEvasion: 2,
    speedEvasion: 2,
    tokenSize: 1,
    entity: {
      id: `entity-${id}`,
      species,
      currentHp: overrides.currentHp ?? 40,
      maxHp: 40,
      statusConditions: overrides.statusConditions ?? [],
      stageModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
      capabilities: {
        overland: 3, swim: 0, sky: 0, burrow: 0, levitate: 0,
        jump: { high: 1, long: 1 }, power: 2, weightClass: 1, size: 'Small',
        otherCapabilities: ['Living Weapon'],
      },
    } as unknown as Pokemon,
  } as Combatant
}

// ============================================================
// reconstructWieldRelationships
// ============================================================

describe('reconstructWieldRelationships', () => {
  it('should return empty array when no combatants are wielding', () => {
    const human = makeHumanCombatant('h1')
    const pokemon = makePokemonCombatant('p1', 'Honedge')
    expect(reconstructWieldRelationships([human, pokemon])).toEqual([])
  })

  it('should reconstruct a Honedge wield relationship from flags', () => {
    const human = makeHumanCombatant('h1', 'p1')
    const pokemon = makePokemonCombatant('p1', 'Honedge')
    const result = reconstructWieldRelationships([human, pokemon])

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      wielderId: 'h1',
      weaponId: 'p1',
      weaponSpecies: 'Honedge',
      isFainted: false,
      movementUsedThisRound: 0,
    })
  })

  it('should reconstruct Doublade species correctly', () => {
    const human = makeHumanCombatant('h1', 'p1')
    const pokemon = makePokemonCombatant('p1', 'Doublade')
    const result = reconstructWieldRelationships([human, pokemon])

    expect(result[0].weaponSpecies).toBe('Doublade')
  })

  it('should reconstruct Aegislash species correctly', () => {
    const human = makeHumanCombatant('h1', 'p1')
    const pokemon = makePokemonCombatant('p1', 'Aegislash')
    const result = reconstructWieldRelationships([human, pokemon])

    expect(result[0].weaponSpecies).toBe('Aegislash')
  })

  it('should default unknown species to Honedge for homebrew', () => {
    const human = makeHumanCombatant('h1', 'p1')
    const pokemon = makePokemonCombatant('p1', 'HomebrewSword')
    const result = reconstructWieldRelationships([human, pokemon])

    expect(result[0].weaponSpecies).toBe('Honedge')
  })

  it('should detect fainted state from currentHp <= 0', () => {
    const human = makeHumanCombatant('h1', 'p1')
    const pokemon = makePokemonCombatant('p1', 'Honedge', { currentHp: 0 })
    const result = reconstructWieldRelationships([human, pokemon])

    expect(result[0].isFainted).toBe(true)
  })

  it('should detect fainted state from Fainted status condition', () => {
    const human = makeHumanCombatant('h1', 'p1')
    const pokemon = makePokemonCombatant('p1', 'Honedge', {
      currentHp: 10,
      statusConditions: ['Fainted'],
    })
    const result = reconstructWieldRelationships([human, pokemon])

    expect(result[0].isFainted).toBe(true)
  })

  it('should not be fainted when HP > 0 and no Fainted status', () => {
    const human = makeHumanCombatant('h1', 'p1')
    const pokemon = makePokemonCombatant('p1', 'Honedge', { currentHp: 30 })
    const result = reconstructWieldRelationships([human, pokemon])

    expect(result[0].isFainted).toBe(false)
  })

  it('should initialize movementUsedThisRound to 0', () => {
    const human = makeHumanCombatant('h1', 'p1')
    const pokemon = makePokemonCombatant('p1', 'Honedge')
    const result = reconstructWieldRelationships([human, pokemon])

    expect(result[0].movementUsedThisRound).toBe(0)
  })

  it('should reconstruct multiple wield relationships', () => {
    const h1 = makeHumanCombatant('h1', 'p1')
    const h2 = makeHumanCombatant('h2', 'p2')
    const p1 = makePokemonCombatant('p1', 'Honedge')
    const p2 = makePokemonCombatant('p2', 'Aegislash')
    const result = reconstructWieldRelationships([h1, h2, p1, p2])

    expect(result).toHaveLength(2)
    expect(result[0].wielderId).toBe('h1')
    expect(result[0].weaponSpecies).toBe('Honedge')
    expect(result[1].wielderId).toBe('h2')
    expect(result[1].weaponSpecies).toBe('Aegislash')
  })

  it('should skip if weapon combatant is not found', () => {
    const human = makeHumanCombatant('h1', 'nonexistent')
    expect(reconstructWieldRelationships([human])).toEqual([])
  })

  it('should skip if weapon combatant is not a Pokemon', () => {
    const h1 = makeHumanCombatant('h1', 'h2')
    const h2 = makeHumanCombatant('h2')
    expect(reconstructWieldRelationships([h1, h2])).toEqual([])
  })

  it('should skip Pokemon combatants (only scan humans for wieldingWeaponId)', () => {
    const pokemon = makePokemonCombatant('p1', 'Honedge')
    expect(reconstructWieldRelationships([pokemon])).toEqual([])
  })
})
