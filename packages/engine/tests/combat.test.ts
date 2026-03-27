import { describe, it, expect } from 'vitest'
import { rollAccuracy, modifyCombatStages, healHP, manageResource, displaceEntity, modifyInitiative, targetHasAnyStatus, targetHasStatus } from '../src/utilities/combat'
import { makeCtx, makeLens } from './test-helpers'

describe('rollAccuracy', () => {
  it('natural 1 always misses', () => {
    const ctx = makeCtx({ accuracyRoll: 1 })
    const { hit } = rollAccuracy(ctx, { ac: 2 })
    expect(hit).toBe(false)
  })

  it('natural 20 always hits', () => {
    const ctx = makeCtx({ accuracyRoll: 20 })
    const { hit } = rollAccuracy(ctx, { ac: 99 })
    expect(hit).toBe(true)
  })

  it('hit when roll + accuracy CS >= AC + evasion', () => {
    // Evasion = floor(10/5) = 2 for all stats, best = 2. AC = 2. Need roll >= 4.
    const ctx = makeCtx({ accuracyRoll: 5 })
    const { hit } = rollAccuracy(ctx, { ac: 2 })
    expect(hit).toBe(true)
  })

  it('miss when roll + accuracy CS < AC + evasion', () => {
    // Target with high def → evasion = floor(30/5) = 6
    const ctx = makeCtx({
      accuracyRoll: 3,
      target: { stats: { hp: 10, atk: 10, def: 30, spatk: 10, spdef: 10, spd: 10, stamina: 10 } },
    })
    const { hit } = rollAccuracy(ctx, { ac: 2 })
    expect(hit).toBe(false)
  })

  it('returns success=false on miss', () => {
    const ctx = makeCtx({ accuracyRoll: 1 })
    const { result } = rollAccuracy(ctx, { ac: 2 })
    expect(result.success).toBe(false)
  })

  it('returns the raw roll value', () => {
    const ctx = makeCtx({ accuracyRoll: 17 })
    const { roll } = rollAccuracy(ctx, { ac: 2 })
    expect(roll).toBe(17)
  })

  it('produces an accuracy-check event', () => {
    const ctx = makeCtx({ accuracyRoll: 10 })
    const { result } = rollAccuracy(ctx, { ac: 2 })
    expect(result.events[0].type).toBe('accuracy-check')
  })
})

describe('modifyCombatStages', () => {
  it('produces stage delta on target by default', () => {
    const ctx = makeCtx()
    const result = modifyCombatStages(ctx, { stages: { atk: 2 } })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.combatStages!.atk).toBe(2)
  })

  it('targets self when specified', () => {
    const ctx = makeCtx()
    const result = modifyCombatStages(ctx, { stages: { spd: 1 }, target: 'self' })
    const delta = result.combatantDeltas.get('user-1')
    expect(delta!.combatStages!.spd).toBe(1)
  })

  it('can modify multiple stages at once', () => {
    const ctx = makeCtx()
    const result = modifyCombatStages(ctx, { stages: { atk: 1, spd: 1 }, target: 'self' })
    const delta = result.combatantDeltas.get('user-1')
    expect(delta!.combatStages!.atk).toBe(1)
    expect(delta!.combatStages!.spd).toBe(1)
  })
})

describe('healHP', () => {
  it('produces positive hpDelta on self', () => {
    const ctx = makeCtx()
    const result = healHP(ctx, { amount: 20, target: 'self' })
    const delta = result.combatantDeltas.get('user-1')
    expect(delta!.hpDelta).toBe(20)
  })

  it('heals by tick when ticks specified', () => {
    // Level 10 Pokemon, HP stat 10 → max HP = 90 → tick = 9 → 2 ticks = 18
    const ctx = makeCtx()
    const result = healHP(ctx, { ticks: 2, target: 'self' })
    const delta = result.combatantDeltas.get('user-1')
    expect(delta!.hpDelta).toBe(18)
  })

  it('produces a heal event', () => {
    const ctx = makeCtx()
    const result = healHP(ctx, { amount: 10, target: 'self' })
    expect(result.events[0].type).toBe('heal')
  })

  it('heals self ticks using user stats, not target stats', () => {
    // User: level 15, HP stat 20 → maxHp = (15*5) + (20*3) + 10 = 145, tick = 14. 2 ticks = 28
    // Target: level 10, HP stat 10 → maxHp = (10*5) + (10*3) + 10 = 90, tick = 9. 2 ticks = 18
    const ctx = makeCtx({
      user: { stats: { hp: 20, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 }, level: 15 },
      target: { stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 }, level: 10 },
    })
    const result = healHP(ctx, { ticks: 2, target: 'self' })
    const delta = result.combatantDeltas.get('user-1')
    expect(delta!.hpDelta).toBe(28)
  })

  it('heals user ticks when target is undefined (default)', () => {
    // User: level 15, HP stat 20 → maxHp = 145, tick = 14. 2 ticks = 28
    // Target: level 10, HP stat 10 → maxHp = 90, tick = 9. 2 ticks = 18
    // Per utility-self-targeting-convention.md: undefined ≡ 'self'
    const ctx = makeCtx({
      user: { stats: { hp: 20, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 }, level: 15 },
      target: { stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 }, level: 10 },
    })
    const result = healHP(ctx, { ticks: 2 })  // no target — defaults to self
    const delta = result.combatantDeltas.get('user-1')
    expect(delta!.hpDelta).toBe(28)  // user stats (145 maxHp), not target stats (90 maxHp)
  })
})

describe('manageResource', () => {
  it('modifies energy', () => {
    const ctx = makeCtx()
    const result = manageResource(ctx, { resource: 'energy', amount: 5, target: 'self' })
    const delta = result.combatantDeltas.get('user-1')
    expect(delta!.energyCurrent).toBe(5)
  })

  it('modifies fatigue', () => {
    const ctx = makeCtx()
    const result = manageResource(ctx, { resource: 'fatigue', amount: 1 })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.fatigueLevel).toBe(1)
  })
})

describe('displaceEntity', () => {
  it('moves target position on push', () => {
    const ctx = makeCtx({ target: { position: { x: 5, y: 5 } } })
    const result = displaceEntity(ctx, { direction: 'push', distance: 3 })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.position).toEqual({ x: 8, y: 5 })
  })

  it('uses 6-weight-class formula', () => {
    const ctx = makeCtx({ target: { position: { x: 0, y: 0 }, weightClass: 2 } })
    const result = displaceEntity(ctx, { direction: 'push', distance: '6-weight-class' })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.position).toEqual({ x: 4, y: 0 })
  })

  it('uses highest movement trait for distance', () => {
    const ctx = makeCtx({ target: { position: { x: 0, y: 0 }, movementTypes: [{ type: 'land', speed: 4 }, { type: 'swim', speed: 6 }] } })
    const result = displaceEntity(ctx, { direction: 'away-from-user', distance: 'highest-movement-trait' })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.position).toEqual({ x: 6, y: 0 })
  })
})

describe('modifyInitiative', () => {
  it('sets initiative override to specified value', () => {
    const ctx = makeCtx()
    const result = modifyInitiative(ctx, { op: 'set', value: 0 })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.initiativeOverride).toBe(0)
  })
})

describe('targetHasStatus', () => {
  it('finds a persistent status condition', () => {
    const ctx = makeCtx({
      target: { statusConditions: [{ condition: 'burned', source: { type: 'move', id: 'x', entityId: 'y' }, appliedCombatStages: {} }] },
    })
    expect(targetHasStatus(ctx, 'burned')).toBe(true)
  })

  it('finds a volatile condition', () => {
    const ctx = makeCtx({
      target: { volatileConditions: [{ condition: 'confused', source: { type: 'move', id: 'x', entityId: 'y' } }] },
    })
    expect(targetHasStatus(ctx, 'confused')).toBe(true)
  })

  it('returns false when condition not present', () => {
    const ctx = makeCtx()
    expect(targetHasStatus(ctx, 'paralyzed')).toBe(false)
  })
})

describe('targetHasAnyStatus', () => {
  it('returns false when no conditions at all', () => {
    const ctx = makeCtx()
    expect(targetHasAnyStatus(ctx)).toBe(false)
  })

  it('returns true when target has persistent status', () => {
    const ctx = makeCtx({
      target: { statusConditions: [{ condition: 'burned', source: { type: 'move', id: 'x', entityId: 'y' }, appliedCombatStages: {} }] },
    })
    expect(targetHasAnyStatus(ctx)).toBe(true)
  })

  it('returns true when target has volatile condition', () => {
    const ctx = makeCtx({
      target: { volatileConditions: [{ condition: 'confused', source: { type: 'move', id: 'x', entityId: 'y' } }] },
    })
    expect(targetHasAnyStatus(ctx)).toBe(true)
  })
})

describe('healHP — target resolution', () => {
  it('throws when explicit target ID not found in allCombatants', () => {
    const ctx = makeCtx()
    expect(() => healHP(ctx, { amount: 10, target: 'nonexistent-id' })).toThrow('not found in allCombatants')
  })
})

describe('displaceEntity — target resolution', () => {
  it('throws when explicit target ID not found in allCombatants', () => {
    const ctx = makeCtx()
    expect(() => displaceEntity(ctx, { direction: 'push', distance: 3, target: 'nonexistent-id' })).toThrow('not found in allCombatants')
  })
})
