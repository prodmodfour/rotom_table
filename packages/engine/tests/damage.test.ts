import { describe, it, expect } from 'vitest'
import { dealDamage, dealTickDamage } from '../src/utilities/damage'
import { makeLens, makeCtx } from './test-helpers'

describe('dealDamage', () => {
  it('produces negative hpDelta on the target', () => {
    const ctx = makeCtx()
    const result = dealDamage(ctx, { db: 4, type: 'normal', class: 'physical' })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta).toBeDefined()
    expect(delta!.hpDelta).toBeLessThan(0)
  })

  it('applies STAB (+2 DB) when user shares move type', () => {
    const ctx = makeCtx({ user: { types: ['fire'] } })
    const noStab = dealDamage(ctx, { db: 6, type: 'normal', class: 'special' })
    const withStab = dealDamage(ctx, { db: 6, type: 'fire', class: 'special' })
    const noStabDmg = Math.abs(noStab.combatantDeltas.get('target-1')!.hpDelta!)
    const stabDmg = Math.abs(withStab.combatantDeltas.get('target-1')!.hpDelta!)
    expect(stabDmg).toBeGreaterThan(noStabDmg)
  })

  it('respects type effectiveness — super effective deals more', () => {
    const ctx = makeCtx({ target: { types: ['grass'] } })
    const neutral = dealDamage(ctx, { db: 6, type: 'normal', class: 'physical' })
    const superEff = dealDamage(ctx, { db: 6, type: 'fire', class: 'physical' })
    const neutralDmg = Math.abs(neutral.combatantDeltas.get('target-1')!.hpDelta!)
    const superDmg = Math.abs(superEff.combatantDeltas.get('target-1')!.hpDelta!)
    expect(superDmg).toBeGreaterThan(neutralDmg)
  })

  it('returns 0 damage for immune type matchup', () => {
    const ctx = makeCtx({ target: { types: ['ghost'] } })
    const result = dealDamage(ctx, { db: 6, type: 'normal', class: 'physical' })
    const delta = result.combatantDeltas.get('target-1')
    // Immune = 0 damage, no delta set (or hpDelta === 0)
    expect(delta?.hpDelta ?? 0).toBe(0)
  })

  it('applies bonusDamage from params', () => {
    const ctx = makeCtx()
    const noBonus = dealDamage(ctx, { db: 6, type: 'normal', class: 'physical' })
    const withBonus = dealDamage(ctx, { db: 6, type: 'normal', class: 'physical', bonusDamage: 10 })
    const noBonusDmg = Math.abs(noBonus.combatantDeltas.get('target-1')!.hpDelta!)
    const bonusDmg = Math.abs(withBonus.combatantDeltas.get('target-1')!.hpDelta!)
    expect(bonusDmg).toBe(noBonusDmg + 10)
  })

  it('uses defenderStat override (Psyshock: special move targeting Def)', () => {
    // Target with high SpDef but low Def
    const ctx = makeCtx({
      target: { stats: { hp: 10, atk: 10, def: 5, spatk: 10, spdef: 30, spd: 10, stamina: 10 } },
    })
    const normalSpecial = dealDamage(ctx, { db: 6, type: 'psychic', class: 'special' })
    const psyshock = dealDamage(ctx, { db: 6, type: 'psychic', class: 'special', defenderStat: 'def' })
    const normalDmg = Math.abs(normalSpecial.combatantDeltas.get('target-1')!.hpDelta!)
    const psyshockDmg = Math.abs(psyshock.combatantDeltas.get('target-1')!.hpDelta!)
    // Psyshock should deal more because it targets lower Def instead of higher SpDef
    expect(psyshockDmg).toBeGreaterThan(normalDmg)
  })

  it('produces a damage-dealt event', () => {
    const ctx = makeCtx()
    const result = dealDamage(ctx, { db: 4, type: 'normal', class: 'physical' })
    expect(result.events.length).toBeGreaterThan(0)
    expect(result.events[0].type).toBe('damage-dealt')
  })

  it('floors damage at 1 for non-immune matchups', () => {
    // Massive defense, tiny attack
    const ctx = makeCtx({
      user: { stats: { hp: 10, atk: 1, def: 10, spatk: 1, spdef: 10, spd: 10, stamina: 10 } },
      target: { stats: { hp: 10, atk: 10, def: 100, spatk: 10, spdef: 100, spd: 10, stamina: 10 } },
      damageRolls: [1],
    })
    const result = dealDamage(ctx, { db: 1, type: 'normal', class: 'physical' })
    const dmg = Math.abs(result.combatantDeltas.get('target-1')!.hpDelta!)
    expect(dmg).toBe(1)
  })
})

describe('dealTickDamage', () => {
  it('deals 1/10 of max HP per tick', () => {
    // Level 10 Pokemon, HP stat 10 → max HP = (10*5)+(10*3)+10 = 90 → tick = 9
    const ctx = makeCtx({ target: { stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 } } })
    const result = dealTickDamage(ctx, { ticks: 1 })
    const dmg = Math.abs(result.combatantDeltas.get('target-1')!.hpDelta!)
    expect(dmg).toBe(9)
  })

  it('applies type effectiveness to tick damage when type provided', () => {
    const ctx = makeCtx({ target: { types: ['grass'] } })
    const untyped = dealTickDamage(ctx, { ticks: 1 })
    const typed = dealTickDamage(ctx, { ticks: 1, type: 'fire' })
    const untypedDmg = Math.abs(untyped.combatantDeltas.get('target-1')!.hpDelta!)
    const typedDmg = Math.abs(typed.combatantDeltas.get('target-1')!.hpDelta!)
    expect(typedDmg).toBeGreaterThan(untypedDmg)
  })

  it('returns 0 for immune typed tick damage', () => {
    const ctx = makeCtx({ target: { types: ['ghost'] } })
    const result = dealTickDamage(ctx, { ticks: 1, type: 'normal' })
    expect(result.combatantDeltas.get('target-1')?.hpDelta ?? 0).toBe(0)
  })

  it('uses specified target stats, not ctx.target stats (finding 120 regression)', () => {
    // Specified target: HP 50, level 10 → max HP = (10*5)+(50*3)+10 = 210 → tick = 21
    // ctx.target: HP 10, level 10 → max HP = (10*5)+(10*3)+10 = 90 → tick = 9
    const specifiedTarget = makeLens({
      id: 'specified-target',
      entityId: 'specified-entity',
      side: 'enemies',
      stats: { hp: 50, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
    })
    const ctx = makeCtx({
      target: { stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 } },
    })
    // Add specified target to allCombatants
    ctx.allCombatants = [...ctx.allCombatants, specifiedTarget]
    const result = dealTickDamage(ctx, { ticks: 1, target: 'specified-target' })
    const dmg = Math.abs(result.combatantDeltas.get('specified-target')!.hpDelta!)
    // tick = floor(210/10) = 21, NOT 9 (which would be ctx.target's tick)
    expect(dmg).toBe(21)
  })

  it('throws when specified target ID is not in allCombatants', () => {
    const ctx = makeCtx()
    expect(() => dealTickDamage(ctx, { ticks: 1, target: 'nonexistent-id' })).toThrow(
      'Target nonexistent-id not found in allCombatants'
    )
  })
})
