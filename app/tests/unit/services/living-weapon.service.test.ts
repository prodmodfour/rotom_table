import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock createError (Nitro global used by the service)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})

// Mock adjacency — default to true, tests override as needed
const mockAreAdjacent = vi.fn().mockReturnValue(true)
vi.mock('~/utils/adjacency', () => ({
  areAdjacent: (...args: unknown[]) => mockAreAdjacent(...args),
}))

// Mock damageCalculation (not under test here)
vi.mock('~/utils/damageCalculation', () => ({
  calculateEvasion: () => 0,
}))

// Mock trainerDerivedStats (used by getOverlandSpeed)
vi.mock('~/utils/trainerDerivedStats', () => ({
  computeTrainerDerivedStats: () => ({ overland: 5, swimming: 2 }),
}))

// Mock equipmentBonuses getEquipmentGrantedCapabilities
vi.mock('~/utils/equipmentBonuses', () => ({
  computeEquipmentBonuses: () => ({
    damageReduction: 0,
    evasionBonus: 0,
    statBonuses: {},
    speedDefaultCS: 0,
    conditionalDR: [],
    conditionalSpeedPenalties: [],
  }),
  computeEffectiveEquipment: (eq: unknown) => eq,
  getEquipmentGrantedCapabilities: () => [],
}))

import {
  meetsSkillRequirement,
  engageLivingWeapon,
  disengageLivingWeapon,
  updateWieldFaintedState,
  clearWieldOnRemoval,
  findWieldRelationship,
  isWielded,
  isWielding,
} from '~/server/services/living-weapon.service'
import type { Combatant } from '~/types/encounter'
import type { WieldRelationship } from '~/types/combat'
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

function makeHumanCombatant(overrides: Partial<Combatant> = {}, entityOverrides: Partial<HumanCharacter> = {}): Combatant {
  return {
    id: 'human-1',
    type: 'human',
    entityId: 'entity-human-1',
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
    entity: {
      id: 'entity-human-1',
      name: 'Ash',
      characterType: 'player',
      level: 10,
      stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 5, speed: 10 },
      currentHp: 60,
      maxHp: 60,
      trainerClasses: [],
      skills: { Combat: 'Adept' },
      features: [],
      stageModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
      statusConditions: [],
      injuries: 0,
      equipment: {},
      ...entityOverrides,
    } as unknown as HumanCharacter,
    ...overrides,
  } as Combatant
}

function makePokemonCombatant(
  overrides: Partial<Combatant> = {},
  entityOverrides: Partial<Pokemon> = {}
): Combatant {
  return {
    id: 'pkmn-1',
    type: 'pokemon',
    entityId: 'entity-pkmn-1',
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
      id: 'entity-pkmn-1',
      species: 'Honedge',
      nickname: null,
      level: 15,
      currentHp: 40,
      maxHp: 40,
      types: ['Steel', 'Ghost'],
      nature: { name: 'Adamant', raisedStat: 'attack', loweredStat: 'specialAttack' },
      baseStats: { hp: 45, attack: 80, defense: 100, specialAttack: 35, specialDefense: 37, speed: 28 },
      currentStats: { hp: 45, attack: 80, defense: 100, specialAttack: 35, specialDefense: 37, speed: 28 },
      stageModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
      abilities: [],
      moves: [],
      capabilities: {
        overland: 3, swim: 0, sky: 0, burrow: 0, levitate: 0,
        jump: { high: 1, long: 1 }, power: 2, weightClass: 1, size: 'Small',
        otherCapabilities: ['Living Weapon'],
      },
      skills: {},
      statusConditions: [],
      injuries: 0,
      temporaryHp: 0,
      experience: 0,
      eggGroups: ['Mineral'],
      shiny: false,
      gender: 'Genderless',
      isInLibrary: true,
      origin: 'manual',
      restMinutesToday: 0,
      lastInjuryTime: null,
      injuriesHealedToday: 0,
      tutorPoints: 0,
      trainingExp: 0,
      ...entityOverrides,
    } as unknown as Pokemon,
    ...overrides,
  } as Combatant
}

// ============================================================
// meetsSkillRequirement
// ============================================================

describe('meetsSkillRequirement', () => {
  it('should return true when actual rank equals required rank', () => {
    expect(meetsSkillRequirement('Adept', 'Adept')).toBe(true)
  })

  it('should return true when actual rank exceeds required rank', () => {
    expect(meetsSkillRequirement('Master', 'Adept')).toBe(true)
    expect(meetsSkillRequirement('Expert', 'Novice')).toBe(true)
  })

  it('should return false when actual rank is below required rank', () => {
    expect(meetsSkillRequirement('Novice', 'Adept')).toBe(false)
    expect(meetsSkillRequirement('Untrained', 'Master')).toBe(false)
  })

  it('should default undefined rank to Untrained', () => {
    expect(meetsSkillRequirement(undefined, 'Untrained')).toBe(true)
    expect(meetsSkillRequirement(undefined, 'Novice')).toBe(false)
  })

  it('should handle Pathetic rank correctly', () => {
    expect(meetsSkillRequirement('Pathetic', 'Pathetic')).toBe(true)
    expect(meetsSkillRequirement('Pathetic', 'Untrained')).toBe(false)
  })

  it('should handle full rank order', () => {
    const ranks = ['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master'] as const
    for (let i = 0; i < ranks.length; i++) {
      for (let j = 0; j < ranks.length; j++) {
        expect(meetsSkillRequirement(ranks[i], ranks[j])).toBe(i >= j)
      }
    }
  })
})

// ============================================================
// engageLivingWeapon — Validation
// ============================================================

describe('engageLivingWeapon — validation', () => {
  beforeEach(() => {
    mockAreAdjacent.mockReturnValue(true)
  })

  it('should throw 404 if wielder not found', () => {
    const weapon = makePokemonCombatant()
    expect(() =>
      engageLivingWeapon([weapon], [], 'nonexistent', weapon.id)
    ).toThrow('Wielder combatant not found')
  })

  it('should throw 404 if weapon not found', () => {
    const wielder = makeHumanCombatant()
    expect(() =>
      engageLivingWeapon([wielder], [], wielder.id, 'nonexistent')
    ).toThrow('Weapon combatant not found')
  })

  it('should throw 400 if wielder is not human', () => {
    const pokemonWielder = makePokemonCombatant({ id: 'pkmn-wielder' })
    const weapon = makePokemonCombatant({ id: 'pkmn-weapon' })
    expect(() =>
      engageLivingWeapon([pokemonWielder, weapon], [], pokemonWielder.id, weapon.id)
    ).toThrow('Only trainers (human combatants) can wield Living Weapons')
  })

  it('should throw 400 if weapon is not Pokemon', () => {
    const wielder = makeHumanCombatant({ id: 'human-1' })
    const humanWeapon = makeHumanCombatant({ id: 'human-2' })
    expect(() =>
      engageLivingWeapon([wielder, humanWeapon], [], wielder.id, humanWeapon.id)
    ).toThrow('Only Pokemon can be wielded as Living Weapons')
  })

  it('should throw 400 if Pokemon lacks Living Weapon capability', () => {
    const wielder = makeHumanCombatant()
    const weapon = makePokemonCombatant({}, {
      species: 'Pikachu',
      capabilities: {
        overland: 6, swim: 2, sky: 0, burrow: 0, levitate: 0,
        jump: { high: 1, long: 1 }, power: 3, weightClass: 1, size: 'Small',
      } as any,
    })
    expect(() =>
      engageLivingWeapon([wielder, weapon], [], wielder.id, weapon.id)
    ).toThrow('does not have the Living Weapon capability')
  })

  it('should throw 400 if not on the same side', () => {
    const wielder = makeHumanCombatant({ side: 'players' })
    const weapon = makePokemonCombatant({ side: 'enemies' })
    expect(() =>
      engageLivingWeapon([wielder, weapon], [], wielder.id, weapon.id)
    ).toThrow('Wielder and weapon must be on the same side')
  })

  it('should throw 400 if trainer is already wielding', () => {
    const wielder = makeHumanCombatant({ wieldingWeaponId: 'other-weapon' })
    const weapon = makePokemonCombatant()
    expect(() =>
      engageLivingWeapon([wielder, weapon], [], wielder.id, weapon.id)
    ).toThrow('Trainer is already wielding a Living Weapon')
  })

  it('should throw 400 if Pokemon is already wielded', () => {
    const wielder = makeHumanCombatant()
    const weapon = makePokemonCombatant({ wieldedByTrainerId: 'other-trainer' })
    expect(() =>
      engageLivingWeapon([wielder, weapon], [], wielder.id, weapon.id)
    ).toThrow('This Pokemon is already being wielded by another trainer')
  })

  it('should throw 400 if not adjacent when both have positions', () => {
    mockAreAdjacent.mockReturnValue(false)
    const wielder = makeHumanCombatant({ position: { x: 0, y: 0 } })
    const weapon = makePokemonCombatant({ position: { x: 10, y: 10 } })
    expect(() =>
      engageLivingWeapon([wielder, weapon], [], wielder.id, weapon.id)
    ).toThrow('Wielder and weapon must be adjacent to engage')
  })

  it('should skip adjacency check if wielder has no position', () => {
    const wielder = makeHumanCombatant()
    const weapon = makePokemonCombatant({ position: { x: 5, y: 5 } })
    // Should not throw — adjacency check skipped
    const result = engageLivingWeapon([wielder, weapon], [], wielder.id, weapon.id)
    expect(result.wieldRelationship).toBeDefined()
  })

  it('should skip adjacency check if weapon has no position', () => {
    const wielder = makeHumanCombatant({ position: { x: 0, y: 0 } })
    const weapon = makePokemonCombatant()
    const result = engageLivingWeapon([wielder, weapon], [], wielder.id, weapon.id)
    expect(result.wieldRelationship).toBeDefined()
  })
})

// ============================================================
// engageLivingWeapon — Execution
// ============================================================

describe('engageLivingWeapon — execution', () => {
  beforeEach(() => {
    mockAreAdjacent.mockReturnValue(true)
  })

  it('should set wieldingWeaponId on wielder and wieldedByTrainerId on weapon', () => {
    const wielder = makeHumanCombatant({ id: 'h1' })
    const weapon = makePokemonCombatant({ id: 'p1' })
    const result = engageLivingWeapon([wielder, weapon], [], 'h1', 'p1')

    expect(result.wielder.wieldingWeaponId).toBe('p1')
    expect(result.weapon.wieldedByTrainerId).toBe('h1')
  })

  it('should create a WieldRelationship with correct fields', () => {
    const wielder = makeHumanCombatant({ id: 'h1' })
    const weapon = makePokemonCombatant({ id: 'p1' })
    const result = engageLivingWeapon([wielder, weapon], [], 'h1', 'p1')

    expect(result.wieldRelationship).toEqual({
      wielderId: 'h1',
      weaponId: 'p1',
      weaponSpecies: 'Honedge',
      isFainted: false,
      movementUsedThisRound: 0,
    })
  })

  it('should append relationship to existing wieldRelationships', () => {
    const wielder = makeHumanCombatant({ id: 'h1' })
    const weapon = makePokemonCombatant({ id: 'p1' })
    const existing: WieldRelationship = {
      wielderId: 'h2',
      weaponId: 'p2',
      weaponSpecies: 'Doublade',
      isFainted: false,
      movementUsedThisRound: 0,
    }
    const result = engageLivingWeapon([wielder, weapon], [existing], 'h1', 'p1')

    expect(result.wieldRelationships).toHaveLength(2)
    expect(result.wieldRelationships[0]).toBe(existing)
    expect(result.wieldRelationships[1].wielderId).toBe('h1')
  })

  it('should detect fainted weapon correctly', () => {
    const wielder = makeHumanCombatant({ id: 'h1' })
    const weapon = makePokemonCombatant({ id: 'p1' }, { currentHp: 0 })
    const result = engageLivingWeapon([wielder, weapon], [], 'h1', 'p1')

    expect(result.wieldRelationship.isFainted).toBe(true)
  })

  it('should detect fainted weapon from Fainted status condition', () => {
    const wielder = makeHumanCombatant({ id: 'h1' })
    const weapon = makePokemonCombatant({ id: 'p1' }, {
      currentHp: 10,
      statusConditions: ['Fainted'],
    })
    const result = engageLivingWeapon([wielder, weapon], [], 'h1', 'p1')

    expect(result.wieldRelationship.isFainted).toBe(true)
  })

  it('should not mutate original combatants array', () => {
    const wielder = makeHumanCombatant({ id: 'h1' })
    const weapon = makePokemonCombatant({ id: 'p1' })
    const originals = [wielder, weapon]
    engageLivingWeapon(originals, [], 'h1', 'p1')

    // Original combatants should be unchanged
    expect(wielder.wieldingWeaponId).toBeUndefined()
    expect(weapon.wieldedByTrainerId).toBeUndefined()
  })

  it('should default unknown species to Honedge', () => {
    const wielder = makeHumanCombatant({ id: 'h1' })
    const weapon = makePokemonCombatant({ id: 'p1' }, {
      species: 'HomebrewBlade',
      capabilities: {
        overland: 3, swim: 0, sky: 0, burrow: 0, levitate: 0,
        jump: { high: 1, long: 1 }, power: 2, weightClass: 1, size: 'Small',
        otherCapabilities: ['Living Weapon'],
      } as any,
    })
    const result = engageLivingWeapon([wielder, weapon], [], 'h1', 'p1')

    expect(result.wieldRelationship.weaponSpecies).toBe('Honedge')
  })

  it('should correctly identify Doublade species', () => {
    const wielder = makeHumanCombatant({ id: 'h1' })
    const weapon = makePokemonCombatant({ id: 'p1' }, { species: 'Doublade' })
    const result = engageLivingWeapon([wielder, weapon], [], 'h1', 'p1')

    expect(result.wieldRelationship.weaponSpecies).toBe('Doublade')
  })

  it('should correctly identify Aegislash species', () => {
    const wielder = makeHumanCombatant({ id: 'h1' })
    const weapon = makePokemonCombatant({ id: 'p1' }, { species: 'Aegislash' })
    const result = engageLivingWeapon([wielder, weapon], [], 'h1', 'p1')

    expect(result.wieldRelationship.weaponSpecies).toBe('Aegislash')
  })
})

// ============================================================
// disengageLivingWeapon
// ============================================================

describe('disengageLivingWeapon', () => {
  function makeEngagedPair() {
    const wielder = makeHumanCombatant({ id: 'h1', wieldingWeaponId: 'p1' })
    const weapon = makePokemonCombatant({ id: 'p1', wieldedByTrainerId: 'h1' })
    const relationship: WieldRelationship = {
      wielderId: 'h1',
      weaponId: 'p1',
      weaponSpecies: 'Honedge',
      isFainted: false,
      movementUsedThisRound: 0,
    }
    return { wielder, weapon, relationship }
  }

  it('should throw if combatant is not in any wield relationship', () => {
    const combatant = makeHumanCombatant()
    expect(() =>
      disengageLivingWeapon([combatant], [], combatant.id)
    ).toThrow('Combatant is not part of any wield relationship')
  })

  it('should clear wieldingWeaponId from wielder when disengaging from wielder side', () => {
    const { wielder, weapon, relationship } = makeEngagedPair()
    const result = disengageLivingWeapon([wielder, weapon], [relationship], 'h1')

    expect(result.wielder.wieldingWeaponId).toBeUndefined()
  })

  it('should clear wieldedByTrainerId from weapon when disengaging from wielder side', () => {
    const { wielder, weapon, relationship } = makeEngagedPair()
    const result = disengageLivingWeapon([wielder, weapon], [relationship], 'h1')

    expect(result.weapon.wieldedByTrainerId).toBeUndefined()
  })

  it('should work when disengaging from weapon side', () => {
    const { wielder, weapon, relationship } = makeEngagedPair()
    const result = disengageLivingWeapon([wielder, weapon], [relationship], 'p1')

    expect(result.wielder.wieldingWeaponId).toBeUndefined()
    expect(result.weapon.wieldedByTrainerId).toBeUndefined()
  })

  it('should remove the relationship from the array', () => {
    const { wielder, weapon, relationship } = makeEngagedPair()
    const result = disengageLivingWeapon([wielder, weapon], [relationship], 'h1')

    expect(result.wieldRelationships).toHaveLength(0)
  })

  it('should return the removed relationship', () => {
    const { wielder, weapon, relationship } = makeEngagedPair()
    const result = disengageLivingWeapon([wielder, weapon], [relationship], 'h1')

    expect(result.removedRelationship).toEqual(relationship)
  })

  it('should not mutate original combatants', () => {
    const { wielder, weapon, relationship } = makeEngagedPair()
    disengageLivingWeapon([wielder, weapon], [relationship], 'h1')

    expect(wielder.wieldingWeaponId).toBe('p1')
    expect(weapon.wieldedByTrainerId).toBe('h1')
  })

  it('should preserve other wield relationships', () => {
    const { wielder, weapon, relationship } = makeEngagedPair()
    const otherRelationship: WieldRelationship = {
      wielderId: 'h2',
      weaponId: 'p2',
      weaponSpecies: 'Doublade',
      isFainted: false,
      movementUsedThisRound: 0,
    }
    const result = disengageLivingWeapon(
      [wielder, weapon],
      [relationship, otherRelationship],
      'h1'
    )

    expect(result.wieldRelationships).toHaveLength(1)
    expect(result.wieldRelationships[0].wielderId).toBe('h2')
  })
})

// ============================================================
// updateWieldFaintedState
// ============================================================

describe('updateWieldFaintedState', () => {
  it('should set isFainted to true for matching weapon', () => {
    const relationships: WieldRelationship[] = [{
      wielderId: 'h1',
      weaponId: 'p1',
      weaponSpecies: 'Honedge',
      isFainted: false,
      movementUsedThisRound: 0,
    }]
    const result = updateWieldFaintedState(relationships, 'p1', true)
    expect(result[0].isFainted).toBe(true)
  })

  it('should set isFainted to false for matching weapon', () => {
    const relationships: WieldRelationship[] = [{
      wielderId: 'h1',
      weaponId: 'p1',
      weaponSpecies: 'Honedge',
      isFainted: true,
      movementUsedThisRound: 0,
    }]
    const result = updateWieldFaintedState(relationships, 'p1', false)
    expect(result[0].isFainted).toBe(false)
  })

  it('should not modify non-matching relationships', () => {
    const relationships: WieldRelationship[] = [
      { wielderId: 'h1', weaponId: 'p1', weaponSpecies: 'Honedge', isFainted: false, movementUsedThisRound: 0 },
      { wielderId: 'h2', weaponId: 'p2', weaponSpecies: 'Doublade', isFainted: false, movementUsedThisRound: 0 },
    ]
    const result = updateWieldFaintedState(relationships, 'p1', true)
    expect(result[0].isFainted).toBe(true)
    expect(result[1].isFainted).toBe(false)
  })

  it('should not mutate the original array', () => {
    const original: WieldRelationship = {
      wielderId: 'h1', weaponId: 'p1', weaponSpecies: 'Honedge',
      isFainted: false, movementUsedThisRound: 0,
    }
    const relationships = [original]
    updateWieldFaintedState(relationships, 'p1', true)
    expect(original.isFainted).toBe(false)
  })
})

// ============================================================
// clearWieldOnRemoval
// ============================================================

describe('clearWieldOnRemoval', () => {
  it('should return unchanged data if removed combatant has no relationship', () => {
    const combatant = makeHumanCombatant({ id: 'h1' })
    const combatants = [combatant]
    const result = clearWieldOnRemoval(combatants, [], 'h1')
    // Intentional reference equality: no-op path must return the original array (not a copy)
    expect(result.combatants).toBe(combatants)
    expect(result.wieldRelationships).toHaveLength(0)
  })

  it('should clear wieldingWeaponId on wielder when weapon is removed', () => {
    const wielder = makeHumanCombatant({ id: 'h1', wieldingWeaponId: 'p1' })
    const weapon = makePokemonCombatant({ id: 'p1', wieldedByTrainerId: 'h1' })
    const relationship: WieldRelationship = {
      wielderId: 'h1', weaponId: 'p1', weaponSpecies: 'Honedge',
      isFainted: false, movementUsedThisRound: 0,
    }
    const result = clearWieldOnRemoval([wielder, weapon], [relationship], 'p1')

    const updatedWielder = result.combatants.find(c => c.id === 'h1')!
    expect(updatedWielder.wieldingWeaponId).toBeUndefined()
  })

  it('should clear wieldedByTrainerId on weapon when wielder is removed', () => {
    const wielder = makeHumanCombatant({ id: 'h1', wieldingWeaponId: 'p1' })
    const weapon = makePokemonCombatant({ id: 'p1', wieldedByTrainerId: 'h1' })
    const relationship: WieldRelationship = {
      wielderId: 'h1', weaponId: 'p1', weaponSpecies: 'Honedge',
      isFainted: false, movementUsedThisRound: 0,
    }
    const result = clearWieldOnRemoval([wielder, weapon], [relationship], 'h1')

    const updatedWeapon = result.combatants.find(c => c.id === 'p1')!
    expect(updatedWeapon.wieldedByTrainerId).toBeUndefined()
  })

  it('should remove the wield relationship', () => {
    const wielder = makeHumanCombatant({ id: 'h1', wieldingWeaponId: 'p1' })
    const weapon = makePokemonCombatant({ id: 'p1', wieldedByTrainerId: 'h1' })
    const relationship: WieldRelationship = {
      wielderId: 'h1', weaponId: 'p1', weaponSpecies: 'Honedge',
      isFainted: false, movementUsedThisRound: 0,
    }
    const result = clearWieldOnRemoval([wielder, weapon], [relationship], 'p1')
    expect(result.wieldRelationships).toHaveLength(0)
  })
})

// ============================================================
// findWieldRelationship, isWielded, isWielding (query helpers)
// ============================================================

describe('findWieldRelationship', () => {
  const relationship: WieldRelationship = {
    wielderId: 'h1', weaponId: 'p1', weaponSpecies: 'Honedge',
    isFainted: false, movementUsedThisRound: 0,
  }

  it('should find by wielder ID', () => {
    expect(findWieldRelationship([relationship], 'h1')).toBe(relationship)
  })

  it('should find by weapon ID', () => {
    expect(findWieldRelationship([relationship], 'p1')).toBe(relationship)
  })

  it('should return null for unknown ID', () => {
    expect(findWieldRelationship([relationship], 'unknown')).toBeNull()
  })

  it('should return null for empty array', () => {
    expect(findWieldRelationship([], 'h1')).toBeNull()
  })
})

describe('isWielded', () => {
  it('should return true when wieldedByTrainerId is set', () => {
    const c = makePokemonCombatant({ wieldedByTrainerId: 'h1' })
    expect(isWielded(c)).toBe(true)
  })

  it('should return false when wieldedByTrainerId is undefined', () => {
    const c = makePokemonCombatant()
    expect(isWielded(c)).toBe(false)
  })
})

describe('isWielding', () => {
  it('should return true when wieldingWeaponId is set', () => {
    const c = makeHumanCombatant({ wieldingWeaponId: 'p1' })
    expect(isWielding(c)).toBe(true)
  })

  it('should return false when wieldingWeaponId is undefined', () => {
    const c = makeHumanCombatant()
    expect(isWielding(c)).toBe(false)
  })
})
