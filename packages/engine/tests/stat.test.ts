import { describe, it, expect } from 'vitest'
import { effectiveStat, maxHp, currentHp, maxEnergy, tickValue } from '../src/utilities/stat'
import { makeLens } from './test-helpers'

describe('effectiveStat', () => {
  it('returns base stat at stage 0', () => {
    const lens = makeLens({ entityType: 'pokemon', stats: { hp: 10, atk: 50, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 } })
    expect(effectiveStat(lens, 'atk')).toBe(50)
  })

  it('applies stage multiplier and floors', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 10, atk: 50, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
      combatStages: { atk: 3, def: 0, spatk: 0, spdef: 0, spd: 0, accuracy: 0 },
    })
    // 50 * 1.33 = 66.5 → 66
    expect(effectiveStat(lens, 'atk')).toBe(66)
  })

  it('handles negative stages', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 10, atk: 50, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
      combatStages: { atk: -2, def: 0, spatk: 0, spdef: 0, spd: 0, accuracy: 0 },
    })
    // 50 * 0.8 = 40
    expect(effectiveStat(lens, 'atk')).toBe(40)
  })

  it('stage +6 doubles the stat', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 10, atk: 50, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
      combatStages: { atk: 6, def: 0, spatk: 0, spdef: 0, spd: 0, accuracy: 0 },
    })
    expect(effectiveStat(lens, 'atk')).toBe(100)
  })

  it('works for all combat stats', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 10, atk: 30, def: 40, spatk: 50, spdef: 60, spd: 70, stamina: 10 },
      combatStages: { atk: 0, def: 0, spatk: 0, spdef: 0, spd: 0, accuracy: 0 },
    })
    expect(effectiveStat(lens, 'atk')).toBe(30)
    expect(effectiveStat(lens, 'def')).toBe(40)
    expect(effectiveStat(lens, 'spatk')).toBe(50)
    expect(effectiveStat(lens, 'spdef')).toBe(60)
    expect(effectiveStat(lens, 'spd')).toBe(70)
  })
})

describe('maxHp', () => {
  it('computes Pokemon HP: (Level * 5) + (HP stat * 3) + 10', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 50, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
    })
    // (20 * 5) + (50 * 3) + 10 = 100 + 150 + 10 = 260
    expect(maxHp(lens, 20)).toBe(260)
  })

  it('computes Pokemon HP at level 1', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
    })
    // (1 * 5) + (10 * 3) + 10 = 5 + 30 + 10 = 45
    expect(maxHp(lens, 1)).toBe(45)
  })

  it('computes Trainer HP: (HP stat * 3) + 10 — no level component', () => {
    const lens = makeLens({
      entityType: 'trainer', level: null,
      stats: { hp: 20, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
    })
    // (20 * 3) + 10 = 70
    expect(maxHp(lens)).toBe(70)
  })

  it('trainer ignores level parameter', () => {
    const lens = makeLens({
      entityType: 'trainer', level: null,
      stats: { hp: 20, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
    })
    expect(maxHp(lens, 20)).toBe(70)
    expect(maxHp(lens)).toBe(70)
  })

  it('throws when Pokemon has no level', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
    })
    expect(() => maxHp(lens)).toThrow('maxHp requires level for Pokemon')
  })
})

describe('currentHp', () => {
  it('returns maxHp when no damage taken', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 50, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
      hpDelta: 0,
    })
    expect(currentHp(lens, 20)).toBe(260)
  })

  it('subtracts damage from maxHp', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 50, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
      hpDelta: -100,
    })
    expect(currentHp(lens, 20)).toBe(160)
  })

  it('works for trainers', () => {
    const lens = makeLens({
      entityType: 'trainer',
      stats: { hp: 20, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
      hpDelta: -30,
    })
    // 70 - 30 = 40
    expect(currentHp(lens)).toBe(40)
  })
})

describe('maxEnergy', () => {
  it('formula: max(3, floor(2 * sqrt(Stamina)))', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 25 },
    })
    // 2 * sqrt(25) = 10
    expect(maxEnergy(lens)).toBe(10)
  })

  it('has minimum of 3', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 1 },
    })
    expect(maxEnergy(lens)).toBe(3)
  })

  it('works for high stamina', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 100 },
    })
    // 2 * sqrt(100) = 20
    expect(maxEnergy(lens)).toBe(20)
  })
})

describe('tickValue', () => {
  it('is floor(maxHp / 10)', () => {
    const lens = makeLens({
      entityType: 'pokemon',
      stats: { hp: 50, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
    })
    // maxHp = 260, tick = 26
    expect(tickValue(lens, 20)).toBe(26)
  })

  it('works for trainers', () => {
    const lens = makeLens({
      entityType: 'trainer', level: null,
      stats: { hp: 20, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
    })
    // maxHp = 70, tick = 7
    expect(tickValue(lens)).toBe(7)
  })
})
