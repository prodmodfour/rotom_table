import { describe, it, expect } from 'vitest'
import { useCombat } from '~/composables/useCombat'

const {
  stageMultipliers,
  applyStageModifier,
  calculatePokemonMaxHP,
  calculateTrainerMaxHP,
  calculateEvasion,
  calculatePhysicalEvasion,
  calculateSpecialEvasion,
  calculateSpeedEvasion,
  getHealthPercentage,
  getHealthStatus,
  checkForInjury,
  calculateXPGain,
  getAccuracyThreshold,
  calculateMaxActionPoints,
  calculateMovementModifier,
  calculateEffectiveMovement
} = useCombat()

describe('useCombat composable', () => {
  describe('stageMultipliers', () => {
    it('should use PTU 1.05 values (+20% per positive stage, -10% per negative)', () => {
      expect(stageMultipliers[-6]).toBe(0.4)
      expect(stageMultipliers[-5]).toBe(0.5)
      expect(stageMultipliers[-4]).toBe(0.6)
      expect(stageMultipliers[-3]).toBe(0.7)
      expect(stageMultipliers[-2]).toBe(0.8)
      expect(stageMultipliers[-1]).toBe(0.9)
      expect(stageMultipliers[0]).toBe(1.0)
      expect(stageMultipliers[1]).toBe(1.2)
      expect(stageMultipliers[2]).toBe(1.4)
      expect(stageMultipliers[3]).toBe(1.6)
      expect(stageMultipliers[4]).toBe(1.8)
      expect(stageMultipliers[5]).toBe(2.0)
      expect(stageMultipliers[6]).toBe(2.2)
    })
  })

  describe('applyStageModifier', () => {
    it('should return base stat at stage 0', () => {
      expect(applyStageModifier(100, 0)).toBe(100)
    })

    it('should increase stat at positive stages (PTU: +20% per stage)', () => {
      expect(applyStageModifier(100, 1)).toBe(120)
      expect(applyStageModifier(100, 2)).toBe(140)
      expect(applyStageModifier(100, 6)).toBe(220)
    })

    it('should decrease stat at negative stages (PTU: -10% per stage)', () => {
      expect(applyStageModifier(100, -1)).toBe(90)
      expect(applyStageModifier(100, -2)).toBe(80)
      expect(applyStageModifier(100, -6)).toBe(40)
    })

    it('should clamp stages to -6 to +6 range', () => {
      expect(applyStageModifier(100, 10)).toBe(220)  // Clamped to +6
      expect(applyStageModifier(100, -10)).toBe(40)   // Clamped to -6
    })

    it('should floor the result', () => {
      // 75 * 1.2 = 90 (exact), 75 * 0.9 = 67.5 → 67
      expect(applyStageModifier(75, 1)).toBe(90)
      expect(applyStageModifier(75, -1)).toBe(67)
    })
  })

  describe('calculatePokemonMaxHP', () => {
    it('should use PTU formula: level + (hpStat × 3) + 10', () => {
      expect(calculatePokemonMaxHP(10, 5)).toBe(10 + 15 + 10)  // 35
      expect(calculatePokemonMaxHP(50, 10)).toBe(50 + 30 + 10) // 90
      expect(calculatePokemonMaxHP(1, 1)).toBe(1 + 3 + 10)     // 14
    })
  })

  describe('calculateTrainerMaxHP', () => {
    it('should use PTU formula: (level × 2) + (hpStat × 3) + 10', () => {
      expect(calculateTrainerMaxHP(10, 5)).toBe(20 + 15 + 10)  // 45
      expect(calculateTrainerMaxHP(50, 10)).toBe(100 + 30 + 10) // 140
      expect(calculateTrainerMaxHP(1, 1)).toBe(2 + 3 + 10)     // 15
    })
  })

  describe('calculateEvasion', () => {
    it('should be floor(stat / 5), max 6', () => {
      expect(calculateEvasion(25)).toBe(5)   // 25/5 = 5
      expect(calculateEvasion(30)).toBe(6)   // 30/5 = 6
      expect(calculateEvasion(50)).toBe(6)   // 50/5 = 10, capped at 6
      expect(calculateEvasion(3)).toBe(0)    // 3/5 = 0.6 → 0
    })

    it('should apply combat stages to stat before dividing', () => {
      // stat 25, stage +1 → 25 * 1.2 = 30 → 30/5 = 6
      expect(calculateEvasion(25, 1)).toBe(6)
      // stat 25, stage -1 → 25 * 0.9 = 22.5 → floor 22 → 22/5 = 4.4 → floor 4
      expect(calculateEvasion(25, -1)).toBe(4)
    })

    it('should add evasion bonus on top of stat evasion', () => {
      // stat 25 → 5, bonus +2 → 7
      expect(calculateEvasion(25, 0, 2)).toBe(7)
    })

    it('should not go below 0 with negative bonus', () => {
      // stat 5 → 1, bonus -3 → -2 → clamped to 0
      expect(calculateEvasion(5, 0, -3)).toBe(0)
    })

    it('should add statBonus after combat stages but before dividing by 5 (Focus items, PTU p.295)', () => {
      // stat 20, stage 0, evasionBonus 0, statBonus +5 → (20 + 5) / 5 = 5
      expect(calculateEvasion(20, 0, 0, 5)).toBe(5)
      // stat 20, stage 0, evasionBonus 0, statBonus 0 → 20 / 5 = 4
      expect(calculateEvasion(20, 0, 0, 0)).toBe(4)
    })

    it('should apply statBonus after combat stage multiplier', () => {
      // stat 20, stage -1 → floor(20 * 0.9) = 18, then +5 = 23, then 23/5 = 4.6 → floor 4
      expect(calculateEvasion(20, -1, 0, 5)).toBe(4)
      // stat 20, stage +1 → floor(20 * 1.2) = 24, then +5 = 29, then 29/5 = 5.8 → floor 5
      expect(calculateEvasion(20, 1, 0, 5)).toBe(5)
    })
  })

  describe('evasion aliases', () => {
    it('calculatePhysicalEvasion should match calculateEvasion', () => {
      expect(calculatePhysicalEvasion(25)).toBe(calculateEvasion(25))
      expect(calculatePhysicalEvasion(25, 1, 2)).toBe(calculateEvasion(25, 1, 2))
    })

    it('calculateSpecialEvasion should match calculateEvasion', () => {
      expect(calculateSpecialEvasion(25)).toBe(calculateEvasion(25))
    })

    it('calculateSpeedEvasion should match calculateEvasion', () => {
      expect(calculateSpeedEvasion(25)).toBe(calculateEvasion(25))
    })

    it('evasion aliases should pass statBonus through to calculateEvasion', () => {
      expect(calculatePhysicalEvasion(20, 0, 0, 5)).toBe(calculateEvasion(20, 0, 0, 5))
      expect(calculateSpecialEvasion(20, 0, 0, 5)).toBe(calculateEvasion(20, 0, 0, 5))
      expect(calculateSpeedEvasion(20, 0, 0, 5)).toBe(calculateEvasion(20, 0, 0, 5))
    })
  })

  describe('getHealthPercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(getHealthPercentage(100, 100)).toBe(100)
      expect(getHealthPercentage(50, 100)).toBe(50)
      expect(getHealthPercentage(25, 100)).toBe(25)
      expect(getHealthPercentage(0, 100)).toBe(0)
    })

    it('should round to nearest integer', () => {
      expect(getHealthPercentage(33, 100)).toBe(33)
      expect(getHealthPercentage(66, 100)).toBe(66)
      expect(getHealthPercentage(1, 3)).toBe(33)
    })
  })

  describe('getHealthStatus', () => {
    it('should return healthy for percentage > 50', () => {
      expect(getHealthStatus(100)).toBe('healthy')
      expect(getHealthStatus(75)).toBe('healthy')
      expect(getHealthStatus(51)).toBe('healthy')
    })

    it('should return warning for percentage 26-50', () => {
      expect(getHealthStatus(50)).toBe('warning')
      expect(getHealthStatus(40)).toBe('warning')
      expect(getHealthStatus(26)).toBe('warning')
    })

    it('should return critical for percentage 1-25', () => {
      expect(getHealthStatus(25)).toBe('critical')
      expect(getHealthStatus(10)).toBe('critical')
      expect(getHealthStatus(1)).toBe('critical')
    })

    it('should return fainted for percentage <= 0', () => {
      expect(getHealthStatus(0)).toBe('fainted')
      expect(getHealthStatus(-10)).toBe('fainted')
    })
  })

  describe('checkForInjury', () => {
    it('should detect massive damage (50%+ of max HP in one hit)', () => {
      const result = checkForInjury(100, 40, 100, 60)
      expect(result.injured).toBe(true)
      expect(result.reason).toBe('Massive Damage')
    })

    it('should detect crossing 50% HP marker', () => {
      const result = checkForInjury(60, 40, 100, 20)
      expect(result.injured).toBe(true)
      expect(result.reason).toContain('50%')
    })

    it('should detect crossing 0% HP marker', () => {
      const result = checkForInjury(10, -5, 100, 15)
      expect(result.injured).toBe(true)
      expect(result.reason).toContain('0%')
    })

    it('should not trigger when staying above a marker', () => {
      // 80 → 60: stays above 50%
      const result = checkForInjury(80, 60, 100, 20)
      expect(result.injured).toBe(false)
    })

    it('should not trigger for small damage that does not cross a marker', () => {
      // 45 → 40: both below 50% but above 0%, no marker crossed
      const result = checkForInjury(45, 40, 100, 5)
      expect(result.injured).toBe(false)
    })
  })

  describe('calculateXPGain', () => {
    it('should calculate XP based on level and participants', () => {
      expect(calculateXPGain(10, 1)).toBe(100)
      expect(calculateXPGain(10, 2)).toBe(50)
      expect(calculateXPGain(20, 4)).toBe(50)
    })

    it('should floor XP values', () => {
      // 100 / 3 = 33.33 → 33
      expect(calculateXPGain(10, 3)).toBe(33)
    })
  })

  describe('getAccuracyThreshold', () => {
    it('should calculate modified AC: baseAC - accuracy + evasion', () => {
      // AC 2, accuracy 0, evasion 0 → 2
      expect(getAccuracyThreshold(2, 0, 0)).toBe(2)
      // AC 3, accuracy 2, evasion 1 → 3 - 2 + 1 = 2
      expect(getAccuracyThreshold(3, 2, 1)).toBe(2)
    })

    it('should cap evasion contribution at +9', () => {
      // AC 2, accuracy 0, evasion 15 → 2 - 0 + 9 = 11
      expect(getAccuracyThreshold(2, 0, 15)).toBe(11)
    })

    it('should not go below 1', () => {
      // AC 2, accuracy 10, evasion 0 → 2 - 10 + 0 = -8 → clamped to 1
      expect(getAccuracyThreshold(2, 10, 0)).toBe(1)
    })
  })

  describe('calculateMaxActionPoints', () => {
    it('should return 5 + floor(level / 5)', () => {
      expect(calculateMaxActionPoints(1)).toBe(5)
      expect(calculateMaxActionPoints(5)).toBe(6)
      expect(calculateMaxActionPoints(10)).toBe(7)
      expect(calculateMaxActionPoints(20)).toBe(9)
    })
  })

  describe('calculateMovementModifier', () => {
    it('should return floor(speedCS / 2)', () => {
      expect(calculateMovementModifier(0)).toBe(0)
      expect(calculateMovementModifier(2)).toBe(1)
      expect(calculateMovementModifier(3)).toBe(1)
      expect(calculateMovementModifier(6)).toBe(3)
      expect(calculateMovementModifier(-2)).toBe(-1)
      expect(calculateMovementModifier(-6)).toBe(-3)
    })
  })

  describe('calculateEffectiveMovement', () => {
    it('should add movement modifier to base movement', () => {
      expect(calculateEffectiveMovement(5, 0)).toBe(5)
      expect(calculateEffectiveMovement(5, 2)).toBe(6)
    })

    it('should enforce minimum movement of 2', () => {
      expect(calculateEffectiveMovement(3, -6)).toBe(2)
      expect(calculateEffectiveMovement(1, -4)).toBe(2)
    })
  })
})
