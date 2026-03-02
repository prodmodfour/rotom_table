import { describe, it, expect } from 'vitest'
import { evaluateBallCondition } from '~/utils/pokeBallConditions'
import type { BallConditionContext } from '~/constants/pokeBalls'

/**
 * Unit tests for all 13 conditional ball evaluators.
 *
 * PTU 1.05 Chapter 9, p.271-273 — Poke Ball Chart.
 * Each evaluator is tested for:
 * - Condition met (modifier applied)
 * - Condition not met (modifier = 0)
 * - Missing data (graceful fallback)
 * - Edge cases and boundary values
 */

describe('evaluateBallCondition', () => {
  it('returns modifier 0 for balls without conditional logic', () => {
    const result = evaluateBallCondition('Basic Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns modifier 0 for unknown ball names', () => {
    const result = evaluateBallCondition('Nonexistent Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })
})

// ============================================
// ROUND-DEPENDENT BALLS
// ============================================

describe('Timer Ball', () => {
  it('returns 0 conditional on round 1 (no rounds elapsed)', () => {
    const result = evaluateBallCondition('Timer Ball', { encounterRound: 1 })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns -5 on round 2 (1 round elapsed)', () => {
    const result = evaluateBallCondition('Timer Ball', { encounterRound: 2 })
    expect(result.modifier).toBe(-5)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -10 on round 3', () => {
    const result = evaluateBallCondition('Timer Ball', { encounterRound: 3 })
    expect(result.modifier).toBe(-10)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -15 on round 4', () => {
    const result = evaluateBallCondition('Timer Ball', { encounterRound: 4 })
    expect(result.modifier).toBe(-15)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -20 on round 5', () => {
    const result = evaluateBallCondition('Timer Ball', { encounterRound: 5 })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('caps at -25 conditional (total = base +5 + (-25) = -20)', () => {
    // Round 6: 5 rounds elapsed -> -25 raw, capped at -25
    const result = evaluateBallCondition('Timer Ball', { encounterRound: 6 })
    expect(result.modifier).toBe(-25)
    expect(result.conditionMet).toBe(true)
  })

  it('remains capped at -25 for very high rounds', () => {
    const result = evaluateBallCondition('Timer Ball', { encounterRound: 20 })
    expect(result.modifier).toBe(-25)
    expect(result.conditionMet).toBe(true)
  })

  it('defaults to round 1 when encounterRound is undefined', () => {
    const result = evaluateBallCondition('Timer Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('includes description text', () => {
    const result = evaluateBallCondition('Timer Ball', { encounterRound: 3 })
    expect(result.description).toContain('2 rounds elapsed')
    expect(result.description).toContain('-10')
  })
})

describe('Quick Ball', () => {
  it('returns 0 conditional on round 1 (best: total = -20)', () => {
    const result = evaluateBallCondition('Quick Ball', { encounterRound: 1 })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns +5 on round 2 (total = -15)', () => {
    const result = evaluateBallCondition('Quick Ball', { encounterRound: 2 })
    expect(result.modifier).toBe(5)
    expect(result.conditionMet).toBe(true)
  })

  it('returns +10 on round 3 (total = -10)', () => {
    const result = evaluateBallCondition('Quick Ball', { encounterRound: 3 })
    expect(result.modifier).toBe(10)
    expect(result.conditionMet).toBe(true)
  })

  it('returns +20 on round 4+ (total = 0)', () => {
    const result = evaluateBallCondition('Quick Ball', { encounterRound: 4 })
    expect(result.modifier).toBe(20)
    expect(result.conditionMet).toBe(true)
  })

  it('stays at +20 for very high rounds', () => {
    const result = evaluateBallCondition('Quick Ball', { encounterRound: 100 })
    expect(result.modifier).toBe(20)
    expect(result.conditionMet).toBe(true)
  })

  it('defaults to round 1 when encounterRound is undefined', () => {
    const result = evaluateBallCondition('Quick Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('includes description with total effective modifier', () => {
    const result = evaluateBallCondition('Quick Ball', { encounterRound: 3 })
    expect(result.description).toContain('round 3')
    expect(result.description).toContain('-10')
  })
})

// ============================================
// STAT-COMPARISON BALLS
// ============================================

describe('Level Ball', () => {
  it('returns -20 when target level is under half of active Pokemon level', () => {
    const result = evaluateBallCondition('Level Ball', {
      targetLevel: 4,
      activePokemonLevel: 10,
    })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when target level equals half of active level', () => {
    const result = evaluateBallCondition('Level Ball', {
      targetLevel: 5,
      activePokemonLevel: 10,
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when target level is above half of active level', () => {
    const result = evaluateBallCondition('Level Ball', {
      targetLevel: 8,
      activePokemonLevel: 10,
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when activePokemonLevel is not provided', () => {
    const result = evaluateBallCondition('Level Ball', {
      targetLevel: 5,
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
    expect(result.description).toContain('not provided')
  })

  it('returns 0 when targetLevel is not provided', () => {
    const result = evaluateBallCondition('Level Ball', {
      activePokemonLevel: 20,
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('handles odd active levels correctly (e.g., level 7 -> threshold 3.5)', () => {
    const result = evaluateBallCondition('Level Ball', {
      targetLevel: 3,
      activePokemonLevel: 7,
    })
    // 3 < 3.5 = true
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('handles level 1 active Pokemon (threshold 0.5)', () => {
    const result = evaluateBallCondition('Level Ball', {
      targetLevel: 1,
      activePokemonLevel: 1,
    })
    // 1 < 0.5 = false
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })
})

describe('Heavy Ball', () => {
  it('returns 0 for WC 1 (no bonus at minimum weight)', () => {
    const result = evaluateBallCondition('Heavy Ball', { targetWeightClass: 1 })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns -5 for WC 2', () => {
    const result = evaluateBallCondition('Heavy Ball', { targetWeightClass: 2 })
    expect(result.modifier).toBe(-5)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -10 for WC 3', () => {
    const result = evaluateBallCondition('Heavy Ball', { targetWeightClass: 3 })
    expect(result.modifier).toBe(-10)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -15 for WC 4', () => {
    const result = evaluateBallCondition('Heavy Ball', { targetWeightClass: 4 })
    expect(result.modifier).toBe(-15)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -20 for WC 5', () => {
    const result = evaluateBallCondition('Heavy Ball', { targetWeightClass: 5 })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -25 for WC 6 (maximum)', () => {
    const result = evaluateBallCondition('Heavy Ball', { targetWeightClass: 6 })
    expect(result.modifier).toBe(-25)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when targetWeightClass is not provided', () => {
    const result = evaluateBallCondition('Heavy Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
    expect(result.description).toContain('not provided')
  })
})

describe('Fast Ball', () => {
  it('returns -20 when target movement is above 7', () => {
    const result = evaluateBallCondition('Fast Ball', { targetMovementSpeed: 8 })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when target movement equals 7 (not above)', () => {
    const result = evaluateBallCondition('Fast Ball', { targetMovementSpeed: 7 })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when target movement is below 7', () => {
    const result = evaluateBallCondition('Fast Ball', { targetMovementSpeed: 5 })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when targetMovementSpeed is not provided', () => {
    const result = evaluateBallCondition('Fast Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
    expect(result.description).toContain('not provided')
  })

  it('handles very high movement speeds', () => {
    const result = evaluateBallCondition('Fast Ball', { targetMovementSpeed: 15 })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })
})

// ============================================
// CONTEXT-DEPENDENT BALLS
// ============================================

describe('Love Ball', () => {
  it('returns -30 when same evo line and opposite gender', () => {
    const result = evaluateBallCondition('Love Ball', {
      targetGender: 'M',
      activePokemonGender: 'F',
      targetEvoLine: ['Pikachu', 'Raichu'],
      activePokemonEvoLine: ['Pikachu', 'Raichu'],
    })
    expect(result.modifier).toBe(-30)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when same gender (even with same evo line)', () => {
    const result = evaluateBallCondition('Love Ball', {
      targetGender: 'M',
      activePokemonGender: 'M',
      targetEvoLine: ['Pikachu', 'Raichu'],
      activePokemonEvoLine: ['Pikachu', 'Raichu'],
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when different evo lines (even with opposite gender)', () => {
    const result = evaluateBallCondition('Love Ball', {
      targetGender: 'M',
      activePokemonGender: 'F',
      targetEvoLine: ['Pikachu', 'Raichu'],
      activePokemonEvoLine: ['Bulbasaur', 'Ivysaur', 'Venusaur'],
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 for genderless target', () => {
    const result = evaluateBallCondition('Love Ball', {
      targetGender: 'N',
      activePokemonGender: 'F',
      targetEvoLine: ['Magnemite', 'Magneton', 'Magnezone'],
      activePokemonEvoLine: ['Magnemite', 'Magneton', 'Magnezone'],
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
    expect(result.description).toContain('genderless')
  })

  it('returns 0 for genderless active Pokemon', () => {
    const result = evaluateBallCondition('Love Ball', {
      targetGender: 'F',
      activePokemonGender: 'N',
      targetEvoLine: ['Magnemite', 'Magneton'],
      activePokemonEvoLine: ['Magnemite', 'Magneton'],
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when gender data is missing', () => {
    const result = evaluateBallCondition('Love Ball', {
      targetEvoLine: ['Pikachu'],
      activePokemonEvoLine: ['Pikachu'],
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('handles case-insensitive evo line comparison', () => {
    const result = evaluateBallCondition('Love Ball', {
      targetGender: 'M',
      activePokemonGender: 'F',
      targetEvoLine: ['pikachu', 'raichu'],
      activePokemonEvoLine: ['Pikachu', 'Raichu'],
    })
    expect(result.modifier).toBe(-30)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when evo lines are empty arrays', () => {
    const result = evaluateBallCondition('Love Ball', {
      targetGender: 'M',
      activePokemonGender: 'F',
      targetEvoLine: [],
      activePokemonEvoLine: [],
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })
})

describe('Net Ball', () => {
  it('returns -20 for Water type', () => {
    const result = evaluateBallCondition('Net Ball', {
      targetTypes: ['Water'],
    })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -20 for Bug type', () => {
    const result = evaluateBallCondition('Net Ball', {
      targetTypes: ['Bug'],
    })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -20 for dual-type with Water (e.g., Water/Flying)', () => {
    const result = evaluateBallCondition('Net Ball', {
      targetTypes: ['Water', 'Flying'],
    })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -20 for dual-type with Bug (e.g., Bug/Poison)', () => {
    const result = evaluateBallCondition('Net Ball', {
      targetTypes: ['Bug', 'Poison'],
    })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 for non-Water/Bug type', () => {
    const result = evaluateBallCondition('Net Ball', {
      targetTypes: ['Fire', 'Flying'],
    })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('handles case-insensitive type matching', () => {
    const result = evaluateBallCondition('Net Ball', {
      targetTypes: ['water'],
    })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when targetTypes is empty', () => {
    const result = evaluateBallCondition('Net Ball', { targetTypes: [] })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when targetTypes is not provided', () => {
    const result = evaluateBallCondition('Net Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })
})

describe('Dusk Ball', () => {
  it('returns -20 when isDarkOrLowLight is true', () => {
    const result = evaluateBallCondition('Dusk Ball', { isDarkOrLowLight: true })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when isDarkOrLowLight is false', () => {
    const result = evaluateBallCondition('Dusk Ball', { isDarkOrLowLight: false })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when isDarkOrLowLight is not provided', () => {
    const result = evaluateBallCondition('Dusk Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })
})

describe('Moon Ball', () => {
  it('returns -20 when target evolves with Evolution Stone', () => {
    const result = evaluateBallCondition('Moon Ball', { targetEvolvesWithStone: true })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when target does not evolve with stone', () => {
    const result = evaluateBallCondition('Moon Ball', { targetEvolvesWithStone: false })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when targetEvolvesWithStone is not provided', () => {
    const result = evaluateBallCondition('Moon Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })
})

describe('Lure Ball', () => {
  it('returns -20 when target was baited', () => {
    const result = evaluateBallCondition('Lure Ball', { targetWasBaited: true })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when target was not baited', () => {
    const result = evaluateBallCondition('Lure Ball', { targetWasBaited: false })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when targetWasBaited is not provided', () => {
    const result = evaluateBallCondition('Lure Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })
})

describe('Repeat Ball', () => {
  it('returns -20 when trainer owns same species', () => {
    const result = evaluateBallCondition('Repeat Ball', { trainerOwnsSpecies: true })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when trainer does not own same species', () => {
    const result = evaluateBallCondition('Repeat Ball', { trainerOwnsSpecies: false })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when trainerOwnsSpecies is not provided', () => {
    const result = evaluateBallCondition('Repeat Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })
})

describe('Nest Ball', () => {
  it('returns -20 when target is under level 10', () => {
    const result = evaluateBallCondition('Nest Ball', { targetLevel: 5 })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -20 for level 1 (minimum level)', () => {
    const result = evaluateBallCondition('Nest Ball', { targetLevel: 1 })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns -20 for level 9 (boundary)', () => {
    const result = evaluateBallCondition('Nest Ball', { targetLevel: 9 })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 for level 10 (exactly at threshold)', () => {
    const result = evaluateBallCondition('Nest Ball', { targetLevel: 10 })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 for level 50 (well above threshold)', () => {
    const result = evaluateBallCondition('Nest Ball', { targetLevel: 50 })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when targetLevel is not provided', () => {
    const result = evaluateBallCondition('Nest Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
    expect(result.description).toContain('not provided')
  })
})

describe('Dive Ball', () => {
  it('returns -20 when underwater or underground', () => {
    const result = evaluateBallCondition('Dive Ball', { isUnderwaterOrUnderground: true })
    expect(result.modifier).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('returns 0 when on surface', () => {
    const result = evaluateBallCondition('Dive Ball', { isUnderwaterOrUnderground: false })
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })

  it('returns 0 when isUnderwaterOrUnderground is not provided', () => {
    const result = evaluateBallCondition('Dive Ball', {})
    expect(result.modifier).toBe(0)
    expect(result.conditionMet).toBe(false)
  })
})

// ============================================
// INTEGRATION: calculateBallModifier with conditions
// ============================================

describe('calculateBallModifier integration', () => {
  // Import the real calculateBallModifier to verify end-to-end
  // This import uses the real pokeBallConditions (not mocked)
  let calculateBallModifier: typeof import('~/constants/pokeBalls').calculateBallModifier

  beforeAll(async () => {
    const mod = await import('~/constants/pokeBalls')
    calculateBallModifier = mod.calculateBallModifier
  })

  it('Timer Ball on round 1 returns base +5 only', () => {
    const result = calculateBallModifier('Timer Ball', { encounterRound: 1 })
    expect(result.base).toBe(5)
    expect(result.conditional).toBe(0)
    expect(result.total).toBe(5)
    expect(result.conditionMet).toBe(false)
  })

  it('Timer Ball on round 6 returns total -20', () => {
    const result = calculateBallModifier('Timer Ball', { encounterRound: 6 })
    expect(result.base).toBe(5)
    expect(result.conditional).toBe(-25)
    expect(result.total).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('Quick Ball on round 1 returns -20 (best)', () => {
    const result = calculateBallModifier('Quick Ball', { encounterRound: 1 })
    expect(result.base).toBe(-20)
    expect(result.conditional).toBe(0)
    expect(result.total).toBe(-20)
  })

  it('Quick Ball on round 4+ returns 0 (fully degraded)', () => {
    const result = calculateBallModifier('Quick Ball', { encounterRound: 5 })
    expect(result.base).toBe(-20)
    expect(result.conditional).toBe(20)
    expect(result.total).toBe(0)
  })

  it('Net Ball returns -20 for Water type', () => {
    const result = calculateBallModifier('Net Ball', { targetTypes: ['Water', 'Ground'] })
    expect(result.base).toBe(0)
    expect(result.conditional).toBe(-20)
    expect(result.total).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('Heavy Ball returns scaled modifier for WC 4', () => {
    const result = calculateBallModifier('Heavy Ball', { targetWeightClass: 4 })
    expect(result.base).toBe(0)
    expect(result.conditional).toBe(-15)
    expect(result.total).toBe(-15)
  })

  it('Basic Ball has no condition, returns base 0', () => {
    const result = calculateBallModifier('Basic Ball', {})
    expect(result.base).toBe(0)
    expect(result.conditional).toBe(0)
    expect(result.total).toBe(0)
  })

  it('Great Ball has no condition, returns base -10', () => {
    const result = calculateBallModifier('Great Ball', {})
    expect(result.base).toBe(-10)
    expect(result.conditional).toBe(0)
    expect(result.total).toBe(-10)
  })

  it('Love Ball returns -30 with matching conditions', () => {
    const result = calculateBallModifier('Love Ball', {
      targetGender: 'F',
      activePokemonGender: 'M',
      targetEvoLine: ['Eevee', 'Vaporeon'],
      activePokemonEvoLine: ['Eevee', 'Flareon'],
    })
    expect(result.base).toBe(0)
    expect(result.conditional).toBe(-30)
    expect(result.total).toBe(-30)
  })

  it('Nest Ball returns -20 for low-level target', () => {
    const result = calculateBallModifier('Nest Ball', { targetLevel: 5 })
    expect(result.total).toBe(-20)
    expect(result.conditionMet).toBe(true)
  })

  it('description field is populated when condition is evaluated', () => {
    const result = calculateBallModifier('Dusk Ball', { isDarkOrLowLight: true })
    expect(result.description).toBeDefined()
    expect(result.description).toContain('dark')
  })
})
