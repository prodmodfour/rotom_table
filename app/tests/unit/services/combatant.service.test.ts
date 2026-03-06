import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma to avoid DB initialization when importing the service module
vi.mock('~/server/utils/prisma', () => ({
  prisma: {}
}))

// Mock uuid for deterministic IDs
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234'
}))

import {
  buildCombatantFromEntity,
  createDefaultStageModifiers,
  calculateDamage
} from '~/server/services/combatant.service'
import type { BuildCombatantOptions } from '~/server/services/combatant.service'
import type { Pokemon, HumanCharacter, StageModifiers, HpReductionType } from '~/types'

// --- Helpers ---

function makeDefaultStageModifiers(): StageModifiers {
  return {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0
  }
}

function makePokemonEntity(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: 'poke-001',
    species: 'Pikachu',
    nickname: null,
    level: 10,
    experience: 0,
    nature: { name: 'Hardy', raisedStat: null, loweredStat: null },
    types: ['Electric'],
    baseStats: { hp: 35, attack: 55, defense: 30, specialAttack: 50, specialDefense: 40, speed: 90 },
    currentStats: { hp: 35, attack: 55, defense: 30, specialAttack: 50, specialDefense: 40, speed: 90 },
    currentHp: 45,
    maxHp: 45,
    stageModifiers: makeDefaultStageModifiers(),
    abilities: [],
    moves: [],
    capabilities: { overland: 6, swim: 2, sky: 0, burrow: 0, levitate: 0, jump: { high: 1, long: 1 }, power: 3, weightClass: 1, size: 'Small' },
    skills: {},
    statusConditions: [],
    injuries: 0,
    temporaryHp: 0,
    restMinutesToday: 0,
    lastInjuryTime: null,
    injuriesHealedToday: 0,
    tutorPoints: 0,
    trainingExp: 0,
    eggGroups: ['Field', 'Fairy'],
    shiny: false,
    gender: 'Male',
    isInLibrary: true,
    origin: 'manual',
    ...overrides
  }
}

function makeHumanEntity(overrides: Partial<HumanCharacter> = {}): HumanCharacter {
  return {
    id: 'human-001',
    name: 'Ash',
    characterType: 'player',
    level: 5,
    stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 5, speed: 10 },
    currentHp: 60,
    maxHp: 60,
    trainerClasses: [],
    skills: {},
    features: [],
    edges: [],
    pokemonIds: [],
    statusConditions: [],
    stageModifiers: makeDefaultStageModifiers(),
    injuries: 0,
    temporaryHp: 0,
    restMinutesToday: 0,
    lastInjuryTime: null,
    injuriesHealedToday: 0,
    drainedAp: 0,
    boundAp: 0,
    currentAp: 5,
    equipment: {},
    inventory: [],
    money: 0,
    isInLibrary: true,
    ...overrides
  }
}

// --- Tests ---

describe('combatant.service — buildCombatantFromEntity', () => {
  describe('input entity immutability', () => {
    it('does not mutate the input Pokemon entity', () => {
      const entity = makePokemonEntity()
      const entitySnapshot = JSON.parse(JSON.stringify(entity))

      buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      expect(entity).toEqual(entitySnapshot)
    })

    it('does not mutate the input HumanCharacter entity without equipment', () => {
      const entity = makeHumanEntity()
      const entitySnapshot = JSON.parse(JSON.stringify(entity))

      buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      expect(entity).toEqual(entitySnapshot)
    })

    it('does not mutate the input HumanCharacter entity with Heavy Armor', () => {
      const entity = makeHumanEntity({
        equipment: {
          body: {
            name: 'Heavy Armor',
            slot: 'body',
            damageReduction: 10,
            speedDefaultCS: -1
          }
        }
      })
      const entitySnapshot = JSON.parse(JSON.stringify(entity))

      buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // The original entity's stageModifiers must remain unchanged
      expect(entity).toEqual(entitySnapshot)
      expect(entity.stageModifiers.speed).toBe(0)
    })

    it('does not mutate the input entity stageModifiers object reference', () => {
      const stageModifiers = makeDefaultStageModifiers()
      const entity = makeHumanEntity({
        stageModifiers,
        equipment: {
          body: {
            name: 'Heavy Armor',
            slot: 'body',
            damageReduction: 10,
            speedDefaultCS: -1
          }
        }
      })

      buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // The original stageModifiers object must not have been mutated
      expect(stageModifiers.speed).toBe(0)
      expect(entity.stageModifiers).toBe(stageModifiers)
    })
  })

  describe('Heavy Armor speed combat stage', () => {
    it('applies speed default CS of -1 to combatant stage modifiers (PTU p.293)', () => {
      const entity = makeHumanEntity({
        equipment: {
          body: {
            name: 'Heavy Armor',
            slot: 'body',
            damageReduction: 10,
            speedDefaultCS: -1
          }
        }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'enemies'
      })

      expect(combatant.entity.stageModifiers.speed).toBe(-1)
    })

    it('reduces initiative due to Heavy Armor speed CS', () => {
      const baseSpeed = 10

      // Without armor
      const entityNoArmor = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 5, speed: baseSpeed }
      })
      const combatantNoArmor = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entityNoArmor.id,
        entity: entityNoArmor,
        side: 'players'
      })

      // With Heavy Armor
      const entityWithArmor = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 5, speed: baseSpeed },
        equipment: {
          body: {
            name: 'Heavy Armor',
            slot: 'body',
            damageReduction: 10,
            speedDefaultCS: -1
          }
        }
      })
      const combatantWithArmor = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entityWithArmor.id,
        entity: entityWithArmor,
        side: 'players'
      })

      // Speed 10 with CS -1 => floor(10 * 0.9) = 9
      // Without armor: initiative = 10
      // With armor: initiative = 9
      expect(combatantNoArmor.initiative).toBe(baseSpeed)
      expect(combatantWithArmor.initiative).toBe(Math.floor(baseSpeed * 0.9))
      expect(combatantWithArmor.initiative).toBeLessThan(combatantNoArmor.initiative)
    })

    it('does not apply speed CS to other stage modifiers', () => {
      const entity = makeHumanEntity({
        equipment: {
          body: {
            name: 'Heavy Armor',
            slot: 'body',
            damageReduction: 10,
            speedDefaultCS: -1
          }
        }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // Only speed should be -1, all others remain 0
      expect(combatant.entity.stageModifiers.attack).toBe(0)
      expect(combatant.entity.stageModifiers.defense).toBe(0)
      expect(combatant.entity.stageModifiers.specialAttack).toBe(0)
      expect(combatant.entity.stageModifiers.specialDefense).toBe(0)
      expect(combatant.entity.stageModifiers.accuracy).toBe(0)
      expect(combatant.entity.stageModifiers.evasion).toBe(0)
    })
  })

  describe('equipment evasion bonuses', () => {
    it('adds shield evasion bonus to physical, special, and speed evasion', () => {
      const entity = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 10, specialAttack: 4, specialDefense: 10, speed: 10 },
        equipment: {
          offHand: {
            name: 'Light Shield',
            slot: 'offHand',
            evasionBonus: 2
          }
        }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // Base evasion for stat 10: floor(10/5) = 2
      // With shield +2 evasion bonus: 2 + 2 = 4
      expect(combatant.physicalEvasion).toBe(4)
      expect(combatant.specialEvasion).toBe(4)
      expect(combatant.speedEvasion).toBe(4)
    })

    it('produces zero evasion with no equipment and low stats', () => {
      const entity = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 4, specialAttack: 4, specialDefense: 4, speed: 4 }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // floor(4/5) = 0 for all evasion stats
      expect(combatant.physicalEvasion).toBe(0)
      expect(combatant.specialEvasion).toBe(0)
      expect(combatant.speedEvasion).toBe(0)
    })

    it('caps stat-derived evasion at 6 even with high stats', () => {
      const entity = makePokemonEntity({
        currentStats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50 }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId: entity.id,
        entity,
        side: 'enemies'
      })

      // floor(50/5) = 10, but capped at 6
      expect(combatant.physicalEvasion).toBe(6)
      expect(combatant.specialEvasion).toBe(6)
      expect(combatant.speedEvasion).toBe(6)
    })
  })

  describe('equipment DR computation', () => {
    it('equipment DR is computed from equipped items via computeEquipmentBonuses', () => {
      // DR is computed by computeEquipmentBonuses and used in damage calculation,
      // not stored directly on the combatant. The combatant builder passes equipment
      // through to the entity. We verify the entity equipment is preserved.
      const entity = makeHumanEntity({
        equipment: {
          body: {
            name: 'Light Armor',
            slot: 'body',
            damageReduction: 5
          }
        }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // The entity on the combatant should retain the equipment for later DR computation
      const humanEntity = combatant.entity as HumanCharacter
      expect(humanEntity.equipment.body?.damageReduction).toBe(5)
    })

    it('preserves multiple equipment pieces with DR', () => {
      const entity = makeHumanEntity({
        equipment: {
          body: {
            name: 'Heavy Armor',
            slot: 'body',
            damageReduction: 10,
            speedDefaultCS: -1
          },
          head: {
            name: 'Helmet',
            slot: 'head',
            conditionalDR: { amount: 15, condition: 'Critical Hits only' }
          }
        }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      const humanEntity = combatant.entity as HumanCharacter
      expect(humanEntity.equipment.body?.damageReduction).toBe(10)
      expect(humanEntity.equipment.head?.conditionalDR?.amount).toBe(15)
    })
  })

  describe('Focus stat bonuses', () => {
    it('applies Focus speed bonus to initiative (PTU p.295)', () => {
      const baseSpeed = 10
      const entity = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 5, speed: baseSpeed },
        equipment: {
          accessory: {
            name: 'Focus (Speed)',
            slot: 'accessory',
            statBonus: { stat: 'speed', value: 5 }
          }
        }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // Initiative = speed + focusSpeedBonus = 10 + 5 = 15
      expect(combatant.initiative).toBe(baseSpeed + 5)
    })

    it('applies Focus defense bonus to physical evasion', () => {
      const entity = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 10, specialAttack: 4, specialDefense: 5, speed: 10 },
        equipment: {
          accessory: {
            name: 'Focus (Defense)',
            slot: 'accessory',
            statBonus: { stat: 'defense', value: 5 }
          }
        }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // Physical evasion: floor((10 + 5) / 5) = floor(3) = 3
      // Without focus: floor(10/5) = 2
      expect(combatant.physicalEvasion).toBe(3)
    })

    it('applies Focus specialDefense bonus to special evasion', () => {
      const entity = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 10, speed: 10 },
        equipment: {
          accessory: {
            name: 'Focus (Special Defense)',
            slot: 'accessory',
            statBonus: { stat: 'specialDefense', value: 5 }
          }
        }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // Special evasion: floor((10 + 5) / 5) = 3
      expect(combatant.specialEvasion).toBe(3)
    })

    it('applies Focus speed bonus to speed evasion', () => {
      const entity = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 5, speed: 10 },
        equipment: {
          accessory: {
            name: 'Focus (Speed)',
            slot: 'accessory',
            statBonus: { stat: 'speed', value: 5 }
          }
        }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // Speed evasion: floor((10 + 5) / 5) = 3
      expect(combatant.speedEvasion).toBe(3)
    })

    it('combines Heavy Armor speed CS with Focus speed bonus for initiative', () => {
      const baseSpeed = 20
      const entity = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 5, speed: baseSpeed },
        equipment: {
          body: {
            name: 'Heavy Armor',
            slot: 'body',
            damageReduction: 10,
            speedDefaultCS: -1
          },
          accessory: {
            name: 'Focus (Speed)',
            slot: 'accessory',
            statBonus: { stat: 'speed', value: 5 }
          }
        }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // Speed CS -1 applied first: floor(20 * 0.9) = 18
      // Then Focus +5: 18 + 5 = 23
      expect(combatant.initiative).toBe(23)
    })
  })

  describe('Pokemon entities excluded from equipment logic', () => {
    it('does not apply equipment bonuses to Pokemon', () => {
      const entity = makePokemonEntity({
        currentStats: { hp: 35, attack: 55, defense: 15, specialAttack: 50, specialDefense: 15, speed: 20 }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // Pokemon evasion derived purely from stats, no equipment bonuses
      // floor(15/5) = 3 for physical and special, floor(20/5) = 4 for speed
      expect(combatant.physicalEvasion).toBe(3)
      expect(combatant.specialEvasion).toBe(3)
      expect(combatant.speedEvasion).toBe(4)
    })

    it('Pokemon initiative is pure speed stat plus bonus', () => {
      const entity = makePokemonEntity({
        currentStats: { hp: 35, attack: 55, defense: 30, specialAttack: 50, specialDefense: 40, speed: 25 }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId: entity.id,
        entity,
        side: 'enemies',
        initiativeBonus: 3
      })

      // Initiative = speed + bonus = 25 + 3
      expect(combatant.initiative).toBe(28)
    })

    it('Pokemon stageModifiers are not modified by equipment defaults', () => {
      const entity = makePokemonEntity()

      const combatant = buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      // Pokemon entity should pass through unmodified (no Heavy Armor speed CS)
      expect(combatant.entity.stageModifiers.speed).toBe(0)
    })
  })

  describe('non-equipped human entity defaults', () => {
    it('produces default combatant values with no equipment', () => {
      const entity = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 10, specialAttack: 4, specialDefense: 10, speed: 15 }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'allies'
      })

      // Initiative = speed = 15
      expect(combatant.initiative).toBe(15)

      // Evasions from stats only
      // Physical: floor(10/5) = 2
      // Special: floor(10/5) = 2
      // Speed: floor(15/5) = 3
      expect(combatant.physicalEvasion).toBe(2)
      expect(combatant.specialEvasion).toBe(2)
      expect(combatant.speedEvasion).toBe(3)

      // Stage modifiers remain at defaults
      expect(combatant.entity.stageModifiers).toEqual(makeDefaultStageModifiers())
    })

    it('sets correct default turn state', () => {
      const entity = makeHumanEntity()

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      expect(combatant.turnState).toEqual({
        hasActed: false,
        standardActionUsed: false,
        shiftActionUsed: false,
        swiftActionUsed: false,
        canBeCommanded: true,
        isHolding: false
      })
    })

    it('sets correct default combat flags', () => {
      const entity = makeHumanEntity()

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      expect(combatant.hasActed).toBe(false)
      expect(combatant.actionsRemaining).toBe(2)
      expect(combatant.shiftActionsRemaining).toBe(1)
      expect(combatant.injuries).toEqual({ count: 0, sources: [] })
    })

    it('uses default initiativeBonus of 0 when not specified', () => {
      const entity = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 5, speed: 12 }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      expect(combatant.initiative).toBe(12)
      expect(combatant.initiativeBonus).toBe(0)
    })

    it('applies initiativeBonus when provided', () => {
      const entity = makeHumanEntity({
        stats: { hp: 10, attack: 8, defense: 6, specialAttack: 4, specialDefense: 5, speed: 12 }
      })

      const combatant = buildCombatantFromEntity({
        entityType: 'human',
        entityId: entity.id,
        entity,
        side: 'players',
        initiativeBonus: 5
      })

      expect(combatant.initiative).toBe(17)
      expect(combatant.initiativeBonus).toBe(5)
    })
  })

  describe('combatant output shape', () => {
    it('produces correct id, type, entityId, and side', () => {
      const entity = makePokemonEntity()

      const combatant = buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId: 'poke-001',
        entity,
        side: 'enemies'
      })

      expect(combatant.id).toBe('test-uuid-1234')
      expect(combatant.type).toBe('pokemon')
      expect(combatant.entityId).toBe('poke-001')
      expect(combatant.side).toBe('enemies')
    })

    it('sets default tokenSize to 1', () => {
      const entity = makePokemonEntity()

      const combatant = buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      expect(combatant.tokenSize).toBe(1)
    })

    it('accepts custom tokenSize', () => {
      const entity = makePokemonEntity()

      const combatant = buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId: entity.id,
        entity,
        side: 'players',
        tokenSize: 2
      })

      expect(combatant.tokenSize).toBe(2)
    })

    it('accepts grid position', () => {
      const entity = makePokemonEntity()

      const combatant = buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId: entity.id,
        entity,
        side: 'players',
        position: { x: 5, y: 3 }
      })

      expect(combatant.position).toEqual({ x: 5, y: 3 })
    })

    it('position is undefined when not provided', () => {
      const entity = makePokemonEntity()

      const combatant = buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId: entity.id,
        entity,
        side: 'players'
      })

      expect(combatant.position).toBeUndefined()
    })
  })
})

// ============================================
// calculateDamage — lossType parameter tests
// ============================================

describe('combatant.service — calculateDamage lossType', () => {
  // Common test values:
  // maxHp = 100, so 50% threshold = 50, massive damage triggers at 50+
  // Marker at 50 (50%), 0 (0%), -50 (-50%), -100 (-100%)
  const maxHp = 100
  const noInjuries = 0

  describe('default backward compatibility', () => {
    it('defaults to damage type when lossType is omitted', () => {
      const result = calculateDamage(60, 80, maxHp, 0, noInjuries)
      expect(result.lossType).toBe('damage')
    })

    it('triggers massive damage when lossType is omitted and damage >= 50% maxHp', () => {
      const result = calculateDamage(50, 80, maxHp, 0, noInjuries)
      expect(result.massiveDamageInjury).toBe(true)
    })
  })

  describe('damage type (standard attack damage)', () => {
    it('returns lossType damage in result', () => {
      const result = calculateDamage(30, 80, maxHp, 0, noInjuries, 'damage')
      expect(result.lossType).toBe('damage')
    })

    it('triggers massive damage injury when hpDamage >= 50% maxHp', () => {
      const result = calculateDamage(50, 80, maxHp, 0, noInjuries, 'damage')
      expect(result.massiveDamageInjury).toBe(true)
      expect(result.totalNewInjuries).toBeGreaterThanOrEqual(1)
    })

    it('absorbs temp HP first', () => {
      const result = calculateDamage(30, 80, maxHp, 20, noInjuries, 'damage')
      expect(result.tempHpAbsorbed).toBe(20)
      expect(result.hpDamage).toBe(10)
      expect(result.newHp).toBe(70)
      expect(result.newTempHp).toBe(0)
    })

    it('counts marker injuries on threshold crossings', () => {
      // HP goes from 60 to 10 (crosses 50% marker at 50)
      const result = calculateDamage(50, 60, maxHp, 0, noInjuries, 'damage')
      expect(result.markerInjuries).toBe(1)
      expect(result.markersCrossed).toContain(50)
    })
  })

  describe('hpLoss type (Belly Drum, Life Orb)', () => {
    it('returns lossType hpLoss in result', () => {
      const result = calculateDamage(30, 80, maxHp, 0, noInjuries, 'hpLoss')
      expect(result.lossType).toBe('hpLoss')
    })

    it('skips massive damage injury even when loss >= 50% maxHp', () => {
      // 50 HP loss from 80 HP — would be massive damage for 'damage' type
      const result = calculateDamage(50, 80, maxHp, 0, noInjuries, 'hpLoss')
      expect(result.massiveDamageInjury).toBe(false)
    })

    it('does NOT absorb temp HP (bypasses temp HP)', () => {
      const result = calculateDamage(30, 80, maxHp, 20, noInjuries, 'hpLoss')
      expect(result.tempHpAbsorbed).toBe(0)
      expect(result.hpDamage).toBe(30)
      expect(result.newHp).toBe(50)
      expect(result.newTempHp).toBe(20) // temp HP preserved
    })

    it('still counts marker injuries on threshold crossings', () => {
      // HP goes from 60 to 10 (crosses 50% marker at 50)
      const result = calculateDamage(50, 60, maxHp, 0, noInjuries, 'hpLoss')
      expect(result.markerInjuries).toBe(1)
      expect(result.markersCrossed).toContain(50)
    })

    it('still causes fainting at 0 HP', () => {
      const result = calculateDamage(80, 80, maxHp, 0, noInjuries, 'hpLoss')
      expect(result.fainted).toBe(true)
      expect(result.newHp).toBe(0)
    })

    it('accumulates only marker injuries, not massive damage', () => {
      // 90 HP loss from 90 HP — crosses 50% (50) and 0% (0) markers
      // Massive damage would trigger (90 >= 50) for 'damage', but not for 'hpLoss'
      const result = calculateDamage(90, 90, maxHp, 0, noInjuries, 'hpLoss')
      expect(result.massiveDamageInjury).toBe(false)
      expect(result.markerInjuries).toBe(2) // crossed 50 and 0
      expect(result.totalNewInjuries).toBe(2) // markers only, no massive damage
    })
  })

  describe('setHp type (Pain Split, Endeavor)', () => {
    it('returns lossType setHp in result', () => {
      const result = calculateDamage(30, 80, maxHp, 0, noInjuries, 'setHp')
      expect(result.lossType).toBe('setHp')
    })

    it('skips massive damage injury even when loss >= 50% maxHp', () => {
      const result = calculateDamage(60, 80, maxHp, 0, noInjuries, 'setHp')
      expect(result.massiveDamageInjury).toBe(false)
    })

    it('does NOT absorb temp HP (bypasses temp HP)', () => {
      const result = calculateDamage(30, 80, maxHp, 20, noInjuries, 'setHp')
      expect(result.tempHpAbsorbed).toBe(0)
      expect(result.hpDamage).toBe(30)
      expect(result.newTempHp).toBe(20) // temp HP preserved
    })

    it('still counts marker injuries on threshold crossings', () => {
      // HP goes from 60 to 10 (crosses 50% marker at 50)
      const result = calculateDamage(50, 60, maxHp, 0, noInjuries, 'setHp')
      expect(result.markerInjuries).toBe(1)
      expect(result.markersCrossed).toContain(50)
    })

    it('still causes fainting at 0 HP', () => {
      const result = calculateDamage(80, 80, maxHp, 0, noInjuries, 'setHp')
      expect(result.fainted).toBe(true)
    })
  })

  describe('injury accumulation across lossTypes', () => {
    it('adds marker injuries to existing injury count for all types', () => {
      const existingInjuries = 3
      // HP 60 -> 10, crossing 50% marker
      const dmg = calculateDamage(50, 60, maxHp, 0, existingInjuries, 'damage')
      const loss = calculateDamage(50, 60, maxHp, 0, existingInjuries, 'hpLoss')
      const set = calculateDamage(50, 60, maxHp, 0, existingInjuries, 'setHp')

      // All should have 1 marker injury added to 3 existing
      // damage also gets massive damage (50 >= 50)
      expect(dmg.newInjuries).toBe(existingInjuries + 1 + 1) // +1 marker +1 massive
      expect(loss.newInjuries).toBe(existingInjuries + 1) // +1 marker only
      expect(set.newInjuries).toBe(existingInjuries + 1) // +1 marker only
    })
  })

  describe('temp HP interaction by lossType', () => {
    it('damage absorbs all temp HP when damage <= temp HP', () => {
      const result = calculateDamage(15, 80, maxHp, 20, noInjuries, 'damage')
      expect(result.tempHpAbsorbed).toBe(15)
      expect(result.hpDamage).toBe(0)
      expect(result.newHp).toBe(80)
      expect(result.newTempHp).toBe(5)
    })

    it('hpLoss preserves temp HP entirely', () => {
      const result = calculateDamage(15, 80, maxHp, 20, noInjuries, 'hpLoss')
      expect(result.tempHpAbsorbed).toBe(0)
      expect(result.newTempHp).toBe(20)
      expect(result.newHp).toBe(65)
    })

    it('setHp preserves temp HP entirely', () => {
      const result = calculateDamage(15, 80, maxHp, 20, noInjuries, 'setHp')
      expect(result.tempHpAbsorbed).toBe(0)
      expect(result.newTempHp).toBe(20)
      expect(result.newHp).toBe(65)
    })
  })
})
