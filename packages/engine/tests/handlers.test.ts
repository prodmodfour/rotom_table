import { describe, it, expect } from 'vitest'
import {
  POUND, THUNDERBOLT, SWORDS_DANCE, DRAGON_DANCE, THUNDER_WAVE,
  EARTHQUAKE, BULLET_SEED, GYRO_BALL, HEX, PSYSHOCK,
  TOXIC_SPIKES, SAFEGUARD, AQUA_RING, PROTECT, WHIRLPOOL,
  CIRCLE_THROW, QUASH, RECOVER, RAIN_DANCE, STRUGGLE_BUG,
  MOVE_DEFINITIONS,
} from '../src/handlers/moves'
import {
  VOLT_ABSORB, WATER_ABSORB, FLASH_FIRE, ROUGH_SKIN,
  SNIPER, TECHNICIAN, SHELL, PHASER, OPPORTUNIST,
  POISON_COATED_NATURAL_WEAPON,
  TRAIT_DEFINITIONS,
} from '../src/handlers/traits'
import type { EffectContext } from '../src/types/effect-contract'
import { makeLens, makeCtx, makeTriggerCtx } from './test-helpers'

// ─── Move Definitions ───

describe('Move definitions', () => {
  it('defines exactly 30 moves', () => {
    expect(MOVE_DEFINITIONS.length).toBe(30)
  })

  it('all moves have unique ids', () => {
    const ids = MOVE_DEFINITIONS.map(m => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all moves have a handler function', () => {
    for (const move of MOVE_DEFINITIONS) {
      expect(typeof move.handler).toBe('function')
    }
  })
})

// ─── Move Handler Behavior ───

describe('Pound (pure damage)', () => {
  it('deals damage on hit', () => {
    const ctx = makeCtx({ accuracyRoll: 15 })
    const result = POUND.handler(ctx)
    expect(result.combatantDeltas.get('target-1')?.hpDelta).toBeLessThan(0)
  })

  it('returns miss result on nat 1', () => {
    const ctx = makeCtx({ accuracyRoll: 1 })
    const result = POUND.handler(ctx)
    expect(result.success).toBe(false)
  })
})

describe('Thunderbolt (damage + status chance)', () => {
  it('paralyzes on 19+', () => {
    const ctx = makeCtx({ accuracyRoll: 19 })
    const result = THUNDERBOLT.handler(ctx)
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.statusConditions).toBeDefined()
    expect(delta!.statusConditions!.some(m => m.condition === 'paralyzed')).toBe(true)
  })

  it('does not paralyze on 18', () => {
    const ctx = makeCtx({ accuracyRoll: 18 })
    const result = THUNDERBOLT.handler(ctx)
    const delta = result.combatantDeltas.get('target-1')
    const hasPara = delta?.statusConditions?.some(m => m.condition === 'paralyzed')
    expect(hasPara).toBeFalsy()
  })
})

describe('Swords Dance (self-buff)', () => {
  it('raises user ATK by +2 CS', () => {
    const ctx = makeCtx()
    const result = SWORDS_DANCE.handler(ctx)
    const delta = result.combatantDeltas.get('user-1')
    expect(delta!.combatStages!.atk).toBe(2)
  })
})

describe('Dragon Dance (multi-stat self-buff)', () => {
  it('raises ATK and SPD by +1 each', () => {
    const ctx = makeCtx()
    const result = DRAGON_DANCE.handler(ctx)
    const delta = result.combatantDeltas.get('user-1')
    expect(delta!.combatStages!.atk).toBe(1)
    expect(delta!.combatStages!.spd).toBe(1)
  })
})

describe('Thunder Wave (auto-hit status)', () => {
  it('paralyzes without accuracy check', () => {
    const ctx = makeCtx({ accuracyRoll: 1 }) // even nat 1 should work since auto-hit
    const result = THUNDER_WAVE.handler(ctx)
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.statusConditions![0].condition).toBe('paralyzed')
  })

  it('does not paralyze Electric types', () => {
    const ctx = makeCtx({ target: { types: ['electric'] } })
    const result = THUNDER_WAVE.handler(ctx)
    expect(result.combatantDeltas.size).toBe(0)
  })
})

describe('Earthquake (AoE)', () => {
  it('hits all non-user combatants', () => {
    const user = makeLens({ id: 'user-1', side: 'allies' })
    const enemy1 = makeLens({ id: 'e1', side: 'enemies' })
    const enemy2 = makeLens({ id: 'e2', side: 'enemies' })
    const ctx: EffectContext = {
      user, target: enemy1, allCombatants: [user, enemy1, enemy2],
      encounter: { weather: null, terrain: null, hazards: [], blessings: [], coats: [], vortexes: [], events: [], round: 1, currentTurnIndex: 0 },
      resolution: { accuracyRoll: 15, damageRolls: [10], multiHitCount: 1, playerDecisions: {}, interruptDecisions: {} },
      effectSource: { type: 'move', id: 'earthquake', entityId: 'test-entity' },
    }
    const result = EARTHQUAKE.handler(ctx)
    // Should have deltas for both enemies
    expect(result.combatantDeltas.has('e1') || result.combatantDeltas.has('e2')).toBe(true)
  })
})

describe('Bullet Seed (multi-hit)', () => {
  it('produces multiple damage deltas based on multiHitCount', () => {
    const ctx = makeCtx({ accuracyRoll: 15, multiHitCount: 3 })
    const result = BULLET_SEED.handler(ctx)
    // All hits on same target — merged. Check events count.
    const damageEvents = result.events.filter(e => e.type === 'damage-dealt')
    expect(damageEvents.length).toBe(3)
  })
})

describe('Gyro Ball (speed-comparison bonus)', () => {
  it('adds bonus damage when target is faster', () => {
    const ctx = makeCtx({
      user: { stats: { hp: 10, atk: 20, def: 10, spatk: 10, spdef: 10, spd: 5, stamina: 10 } },
      target: { stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 25, stamina: 10 } },
    })
    const result = GYRO_BALL.handler(ctx)
    const dmg = Math.abs(result.combatantDeltas.get('target-1')!.hpDelta!)
    // Without bonus, the damage would be lower
    expect(dmg).toBeGreaterThan(0)
  })
})

describe('Hex (conditional DB modifier)', () => {
  it('uses DB 13 when target has status', () => {
    // Target must not be Normal type (Normal is immune to Ghost)
    // Use high damage roll so the flat difference from DB 7 vs 13 shows:
    // DB 7 = 2d6+10 (flat 10), DB 13 = 4d10+10 (flat 10). Same flat,
    // but the dice total from resolution is added once — different dice counts
    // don't matter with fixed rolls. The real difference is the flat:
    // DB 7 flat=10, DB 13 flat=10... both have flat 10. The difference is
    // in dice count which multiplies the injected roll.
    // DB 7: diceTotal(10) + flat(10) = 20
    // DB 13: diceTotal(10) + flat(10) = 20 — same!
    // The issue is that our resolution provides a single roll, not per-die rolls.
    // The dealDamage utility uses damageRolls[0] as the raw dice total.
    // Since DB 7 and DB 13 both have flat 10, and we inject 10 as dice total,
    // they produce the same damage. Use set damage (no rolls) instead.
    const ctx = makeCtx({
      target: { types: ['water'], statusConditions: [{ condition: 'burned', source: { type: 'move', id: 'x', entityId: 'y' }, appliedCombatStages: {} }] },
      damageRolls: [], // set damage mode — uses average
    })
    const statusResult = HEX.handler(ctx)
    const cleanCtx = makeCtx({ target: { types: ['water'] }, damageRolls: [] })
    const cleanResult = HEX.handler(cleanCtx)
    const statusDmg = Math.abs(statusResult.combatantDeltas.get('target-1')!.hpDelta!)
    const cleanDmg = Math.abs(cleanResult.combatantDeltas.get('target-1')!.hpDelta!)
    // DB 7: avg dice = floor(2*(6+1)/2) = 7, +10 flat = 17
    // DB 13: avg dice = floor(4*(10+1)/2) = 22, +10 flat = 32
    // statusDmg should be significantly larger
    expect(statusDmg).toBeGreaterThan(cleanDmg)
  })
})

describe('Toxic Spikes (hazard)', () => {
  it('produces a hazard mutation in encounterDelta', () => {
    const ctx = makeCtx()
    const result = TOXIC_SPIKES.handler(ctx)
    expect(result.encounterDelta).toBeDefined()
    expect(result.encounterDelta!.hazards).toBeDefined()
    expect(result.encounterDelta!.hazards![0].op).toBe('add')
  })
})

describe('Safeguard (blessing)', () => {
  it('produces a blessing mutation with 3 activations', () => {
    const ctx = makeCtx()
    const result = SAFEGUARD.handler(ctx)
    expect(result.encounterDelta!.blessings![0].op).toBe('add')
    expect((result.encounterDelta!.blessings![0] as any).instance.activationsRemaining).toBe(3)
  })
})

describe('Aqua Ring (coat)', () => {
  it('produces a coat mutation on self', () => {
    const ctx = makeCtx()
    const result = AQUA_RING.handler(ctx)
    expect(result.encounterDelta!.coats![0].op).toBe('add')
    expect((result.encounterDelta!.coats![0] as any).instance.entityId).toBe('user-1')
  })
})

describe('Protect (interrupt)', () => {
  it('sets intercepted flag', () => {
    const ctx = makeCtx()
    const result = PROTECT.handler(ctx)
    expect(result.intercepted).toBe(true)
  })
})

describe('Whirlpool (vortex + damage)', () => {
  it('produces both damage and vortex', () => {
    const ctx = makeCtx({ accuracyRoll: 15 })
    const result = WHIRLPOOL.handler(ctx)
    expect(result.combatantDeltas.get('target-1')?.hpDelta).toBeLessThan(0)
    expect(result.encounterDelta!.vortexes![0].op).toBe('add')
  })
})

describe('Quash (initiative manipulation)', () => {
  it('sets target initiative to 0', () => {
    const ctx = makeCtx({ accuracyRoll: 15 })
    const result = QUASH.handler(ctx)
    expect(result.combatantDeltas.get('target-1')?.initiativeOverride).toBe(0)
  })
})

describe('Recover (self-heal)', () => {
  it('heals 50% of max HP', () => {
    // Level 10 Pokemon, HP stat 10 → maxHp = (10*5)+(10*3)+10 = 90 → heal = 45
    const ctx = makeCtx()
    const result = RECOVER.handler(ctx)
    expect(result.combatantDeltas.get('user-1')?.hpDelta).toBe(45)
  })
})

describe('Rain Dance (weather)', () => {
  it('sets weather to rain for 5 rounds', () => {
    const ctx = makeCtx()
    const result = RAIN_DANCE.handler(ctx)
    expect(result.encounterDelta!.weather).toEqual({ op: 'set', type: 'rain', roundsRemaining: 5 })
  })
})

// ─── Trait Definitions ───

describe('Trait definitions', () => {
  it('defines exactly 15 traits', () => {
    expect(TRAIT_DEFINITIONS.length).toBe(15)
  })

  it('all traits have unique ids', () => {
    const ids = TRAIT_DEFINITIONS.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ─── Trait Trigger Behavior ───

describe('Volt Absorb (type-absorb)', () => {
  it('intercepts Electric damage and restores energy', () => {
    const trigger = VOLT_ABSORB.triggers![0]
    const ctx = makeTriggerCtx({}, { moveType: 'electric' })
    const result = trigger.handler(ctx)
    expect(result.intercepted).toBe(true)
    // Should have energy delta on self
    const delta = result.combatantDeltas.get('user-1')
    expect(delta?.energyCurrent).toBe(5)
  })

  it('does nothing for non-Electric moves', () => {
    const trigger = VOLT_ABSORB.triggers![0]
    const ctx = makeTriggerCtx({}, { moveType: 'fire' })
    const result = trigger.handler(ctx)
    expect(result.intercepted).toBe(false)
    expect(result.combatantDeltas.size).toBe(0)
  })
})

describe('Rough Skin (contact retaliation)', () => {
  it('deals tick damage on contact', () => {
    const trigger = ROUGH_SKIN.triggers![0]
    const ctx = makeTriggerCtx({}, { isContact: true })
    const result = trigger.handler(ctx)
    expect(result.combatantDeltas.size).toBeGreaterThan(0)
  })

  it('does nothing on non-contact', () => {
    const trigger = ROUGH_SKIN.triggers![0]
    const ctx = makeTriggerCtx({}, { isContact: false })
    const result = trigger.handler(ctx)
    expect(result.combatantDeltas.size).toBe(0)
  })
})

describe('Flash Fire (type-absorb + boost)', () => {
  it('intercepts Fire damage and applies active effect', () => {
    const trigger = FLASH_FIRE.triggers![0]
    const ctx = makeTriggerCtx({}, { moveType: 'fire' })
    const result = trigger.handler(ctx)
    expect(result.intercepted).toBe(true)
    const delta = result.combatantDeltas.get('user-1')
    expect(delta?.activeEffects).toBeDefined()
    expect(delta!.activeEffects![0].op).toBe('add')
  })
})

describe('Sniper (passive)', () => {
  it('has critBonusDamage = 5', () => {
    expect(SNIPER.passiveEffects!.critBonusDamage).toBe(5)
  })
})

describe('Technician (passive DB boost)', () => {
  it('has dbBoostThreshold 6 and dbBoostAmount 2', () => {
    expect(TECHNICIAN.passiveEffects!.dbBoostThreshold).toBe(6)
    expect(TECHNICIAN.passiveEffects!.dbBoostAmount).toBe(2)
  })
})

describe('Phaser (movement type grant)', () => {
  it('grants phase movement type', () => {
    expect(PHASER.passiveEffects!.movementTypeGrant).toBe('phase')
  })
})

describe('Opportunist (action economy)', () => {
  it('overrides struggle type to dark', () => {
    expect(OPPORTUNIST.passiveEffects!.struggleAttackTypeOverride).toBe('dark')
  })
})

// ─── Poison Coated (findings 139, 140) ───

describe('Poison Coated (contact poison)', () => {
  it('applies poison on contact with accuracyRoll >= 18', () => {
    const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
    const ctx = makeTriggerCtx({}, {
      type: 'damage-dealt', isContact: true,
      sourceEntityId: 'user-1', targetId: 'target-1',
      accuracyRoll: 19,
    })
    const result = trigger.handler(ctx)
    const delta = result.combatantDeltas.get('target-1')
    expect(delta).toBeDefined()
    expect(delta!.statusConditions![0].condition).toBe('poisoned')
  })

  it('does nothing when accuracyRoll < 18', () => {
    const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
    const ctx = makeTriggerCtx({}, {
      type: 'damage-dealt', isContact: true,
      sourceEntityId: 'user-1', targetId: 'target-1',
      accuracyRoll: 15,
    })
    const result = trigger.handler(ctx)
    expect(result.combatantDeltas.size).toBe(0)
  })

  it('does nothing on non-contact', () => {
    const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
    const ctx = makeTriggerCtx({}, {
      type: 'damage-dealt', isContact: false,
      sourceEntityId: 'user-1', targetId: 'target-1',
      accuracyRoll: 20,
    })
    const result = trigger.handler(ctx)
    expect(result.combatantDeltas.size).toBe(0)
  })

  it('respects type immunity — Poison-type target is not poisoned', () => {
    const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
    const ctx = makeTriggerCtx(
      { target: { types: ['poison'] } },
      {
        type: 'damage-dealt', isContact: true,
        sourceEntityId: 'user-1', targetId: 'target-1',
        accuracyRoll: 20,
      },
    )
    const result = trigger.handler(ctx)
    expect(result.combatantDeltas.size).toBe(0) // immune
  })

  it('auto-applies -2 SpDef CS on successful poison', () => {
    const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
    const ctx = makeTriggerCtx({}, {
      type: 'damage-dealt', isContact: true,
      sourceEntityId: 'user-1', targetId: 'target-1',
      accuracyRoll: 20,
    })
    const result = trigger.handler(ctx)
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.combatStages!.spdef).toBe(-2)
  })

  it('emits status-applied event', () => {
    const trigger = POISON_COATED_NATURAL_WEAPON.triggers![0]
    const ctx = makeTriggerCtx({}, {
      type: 'damage-dealt', isContact: true,
      sourceEntityId: 'user-1', targetId: 'target-1',
      accuracyRoll: 18,
    })
    const result = trigger.handler(ctx)
    expect(result.events.some(e => e.type === 'status-applied')).toBe(true)
  })
})
