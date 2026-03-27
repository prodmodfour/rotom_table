import { describe, it, expect } from 'vitest'
import {
  applyStageMultiplier,
  clampStage,
  computeEnergy,
  computePokemonMaxHp,
  computeTrainerMaxHp,
  computeTickValue,
  getTypeEffectiveness,
  STAGE_MULTIPLIERS,
  DB_TO_DICE,
  TYPE_EFFECTIVENESS,
} from '../src/constants'

describe('STAGE_MULTIPLIERS', () => {
  it('has entries for stages -6 through +6', () => {
    for (let stage = -6; stage <= 6; stage++) {
      expect(STAGE_MULTIPLIERS[stage]).toBeDefined()
    }
  })

  it('stage 0 is x1.0', () => {
    expect(STAGE_MULTIPLIERS[0]).toBe(1.0)
  })

  it('stage +6 is x2.0 (buff ceiling)', () => {
    expect(STAGE_MULTIPLIERS[6]).toBe(2.0)
  })

  it('stage -6 is x0.4 (debuff floor)', () => {
    expect(STAGE_MULTIPLIERS[-6]).toBe(0.4)
  })

  it('is asymmetric — buffs are wider than debuffs', () => {
    // +6 doubles (2.0x), -6 only reduces to 0.4x (not 0.5x)
    const buffRange = STAGE_MULTIPLIERS[6] - STAGE_MULTIPLIERS[0]   // 1.0
    const debuffRange = STAGE_MULTIPLIERS[0] - STAGE_MULTIPLIERS[-6] // 0.6
    expect(buffRange).toBeGreaterThan(debuffRange)
  })
})

describe('DB_TO_DICE', () => {
  it('has entries for DB 1 through 28', () => {
    for (let db = 1; db <= 28; db++) {
      expect(DB_TO_DICE[db]).toBeDefined()
    }
  })

  it('DB 6 is 2d6+8', () => {
    expect(DB_TO_DICE[6]).toEqual({ dice: 2, sides: 6, flat: 8 })
  })

  it('DB 8 is 2d8+10', () => {
    expect(DB_TO_DICE[8]).toEqual({ dice: 2, sides: 8, flat: 10 })
  })
})

describe('computeEnergy', () => {
  it('formula: max(3, floor(2 * sqrt(Stamina)))', () => {
    expect(computeEnergy(1)).toBe(3)   // 2*1=2, max(3,2)=3
    expect(computeEnergy(10)).toBe(6)  // 2*3.16=6.32, floor=6
    expect(computeEnergy(25)).toBe(10) // 2*5=10
    expect(computeEnergy(100)).toBe(20) // 2*10=20
  })

  it('has a floor of 3 even at minimum stamina', () => {
    expect(computeEnergy(0)).toBe(3)
    expect(computeEnergy(1)).toBe(3)
  })
})

describe('computePokemonMaxHp', () => {
  it('formula: (Level * 5) + (HP stat * 3) + 10', () => {
    expect(computePokemonMaxHp(1, 10)).toBe(5 + 30 + 10)   // 45
    expect(computePokemonMaxHp(10, 20)).toBe(50 + 60 + 10)  // 120
    expect(computePokemonMaxHp(20, 50)).toBe(100 + 150 + 10) // 260
  })
})

describe('computeTrainerMaxHp', () => {
  it('formula: (HP stat * 3) + 10 — no level component', () => {
    expect(computeTrainerMaxHp(10)).toBe(40)
    expect(computeTrainerMaxHp(20)).toBe(70)
  })
})

describe('computeTickValue', () => {
  it('is floor(maxHp / 10)', () => {
    expect(computeTickValue(100)).toBe(10)
    expect(computeTickValue(45)).toBe(4)
    expect(computeTickValue(7)).toBe(0)
  })
})

describe('clampStage', () => {
  it('clamps to -6..+6', () => {
    expect(clampStage(-10)).toBe(-6)
    expect(clampStage(10)).toBe(6)
    expect(clampStage(0)).toBe(0)
    expect(clampStage(-3)).toBe(-3)
  })
})

describe('applyStageMultiplier', () => {
  it('applies multiplier and floors the result', () => {
    // 50 * 1.33 = 66.5 → 66
    expect(applyStageMultiplier(50, 3)).toBe(66)
    // 50 * 0.8 = 40
    expect(applyStageMultiplier(50, -2)).toBe(40)
  })

  it('clamps out-of-range stages', () => {
    expect(applyStageMultiplier(50, 10)).toBe(applyStageMultiplier(50, 6))
  })
})

describe('TYPE_EFFECTIVENESS chart structure', () => {
  it('has exactly 17 attacking types (no Flying)', () => {
    expect(Object.keys(TYPE_EFFECTIVENESS)).toHaveLength(17)
    expect(TYPE_EFFECTIVENESS).not.toHaveProperty('flying')
  })

  it('no type has flying as a defending matchup', () => {
    for (const [, defenses] of Object.entries(TYPE_EFFECTIVENESS)) {
      expect(defenses).not.toHaveProperty('flying')
    }
  })

  it('electric has only water as SE (lost Flying target)', () => {
    const electricSE = Object.entries(TYPE_EFFECTIVENESS.electric)
      .filter(([, v]) => v === 2)
      .map(([k]) => k)
    expect(electricSE).toEqual(['water'])
  })

  it('ground has no immunity entries (lost Flying immunity target)', () => {
    const groundImmunities = Object.entries(TYPE_EFFECTIVENESS.ground)
      .filter(([, v]) => v === 0)
      .map(([k]) => k)
    expect(groundImmunities).toEqual([])
  })
})

describe('getTypeEffectiveness', () => {
  it('returns 2 for super effective', () => {
    expect(getTypeEffectiveness('fire', ['grass'])).toBe(2)
    expect(getTypeEffectiveness('water', ['fire'])).toBe(2)
  })

  it('returns 0.5 for resisted', () => {
    expect(getTypeEffectiveness('fire', ['water'])).toBe(0.5)
  })

  it('returns 0 for immune', () => {
    expect(getTypeEffectiveness('normal', ['ghost'])).toBe(0)
    expect(getTypeEffectiveness('electric', ['ground'])).toBe(0)
  })

  it('returns 1 for neutral', () => {
    expect(getTypeEffectiveness('fire', ['normal'])).toBe(1)
  })

  it('handles dual types — both weak = x4 (doubly super effective)', () => {
    // Ice vs Grass/Ground = 2 * 2 = 4
    expect(getTypeEffectiveness('ice', ['grass', 'ground'])).toBe(4)
  })

  it('handles dual types — one weak one resist = x1 (neutral)', () => {
    // Fire vs Grass/Water = 2 * 0.5 = 1
    expect(getTypeEffectiveness('fire', ['grass', 'water'])).toBe(1)
  })

  it('handles dual types — either immune = x0', () => {
    // Normal vs Ghost/Dark = 0 * anything = 0
    expect(getTypeEffectiveness('normal', ['ghost', 'dark'])).toBe(0)
  })

  it('returns 1 for empty defender types (typeless trainers)', () => {
    expect(getTypeEffectiveness('fire', [])).toBe(1)
  })
})
