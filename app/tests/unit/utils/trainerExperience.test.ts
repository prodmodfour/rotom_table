import { describe, it, expect } from 'vitest'
import {
  applyTrainerXp,
  isNewSpecies,
  TRAINER_MAX_LEVEL,
  TRAINER_XP_PER_LEVEL,
  TRAINER_XP_SUGGESTIONS
} from '~/utils/trainerExperience'

/**
 * T1: Pure utility tests for applyTrainerXp()
 *
 * PTU Core p.461: Trainer Experience Bank — accumulates XP, levels at 10.
 * Tests cover: basic addition, level-up trigger, multi-level jumps,
 * max level cap, negative deduction, and edge cases.
 */

describe('applyTrainerXp', () => {
  // T1.1 Basic XP Application
  describe('basic XP application', () => {
    it('adds XP to bank without level-up', () => {
      const result = applyTrainerXp({ currentXp: 3, currentLevel: 5, xpToAdd: 4 })
      expect(result.newXp).toBe(7)
      expect(result.newLevel).toBe(5)
      expect(result.levelsGained).toBe(0)
    })

    it('triggers level-up at exactly 10 XP', () => {
      const result = applyTrainerXp({ currentXp: 7, currentLevel: 5, xpToAdd: 3 })
      expect(result.newXp).toBe(0)
      expect(result.newLevel).toBe(6)
      expect(result.levelsGained).toBe(1)
    })

    it('triggers level-up with remainder', () => {
      const result = applyTrainerXp({ currentXp: 8, currentLevel: 5, xpToAdd: 5 })
      expect(result.newXp).toBe(3)
      expect(result.newLevel).toBe(6)
      expect(result.levelsGained).toBe(1)
    })
  })

  // T1.2 Multi-Level Jumps
  describe('multi-level jumps', () => {
    it('handles double level-up', () => {
      const result = applyTrainerXp({ currentXp: 8, currentLevel: 5, xpToAdd: 15 })
      // 8 + 15 = 23 -> floor(23/10) = 2 levels, remainder 3
      expect(result.newXp).toBe(3)
      expect(result.newLevel).toBe(7)
      expect(result.levelsGained).toBe(2)
    })

    it('handles triple level-up', () => {
      const result = applyTrainerXp({ currentXp: 0, currentLevel: 1, xpToAdd: 35 })
      // 0 + 35 = 35 -> 3 levels, remainder 5
      expect(result.newXp).toBe(5)
      expect(result.newLevel).toBe(4)
      expect(result.levelsGained).toBe(3)
    })

    it('handles exact multiple of 10', () => {
      const result = applyTrainerXp({ currentXp: 0, currentLevel: 1, xpToAdd: 20 })
      expect(result.newXp).toBe(0)
      expect(result.newLevel).toBe(3)
      expect(result.levelsGained).toBe(2)
    })
  })

  // T1.3 Max Level Handling
  describe('max level (50)', () => {
    it('does not level past 50', () => {
      const result = applyTrainerXp({ currentXp: 8, currentLevel: 50, xpToAdd: 5 })
      expect(result.newXp).toBe(13)
      expect(result.newLevel).toBe(50)
      expect(result.levelsGained).toBe(0)
    })

    it('caps level at 50 during multi-level jump', () => {
      const result = applyTrainerXp({ currentXp: 0, currentLevel: 49, xpToAdd: 25 })
      // Would be 2 levels but capped at 1 (49 -> 50)
      // Remaining XP: 25 - 10 = 15 (only 1 level consumed)
      expect(result.newLevel).toBe(50)
      expect(result.levelsGained).toBe(1)
      expect(result.newXp).toBe(15)
    })

    it('handles near-max level with exact level-up to 50', () => {
      const result = applyTrainerXp({ currentXp: 5, currentLevel: 49, xpToAdd: 5 })
      expect(result.newXp).toBe(0)
      expect(result.newLevel).toBe(50)
      expect(result.levelsGained).toBe(1)
    })
  })

  // T1.4 Negative XP (Deduction)
  describe('XP deduction', () => {
    it('deducts XP from bank', () => {
      const result = applyTrainerXp({ currentXp: 7, currentLevel: 5, xpToAdd: -3 })
      expect(result.newXp).toBe(4)
      expect(result.newLevel).toBe(5)
      expect(result.levelsGained).toBe(0)
    })

    it('clamps bank to 0 on excessive deduction', () => {
      const result = applyTrainerXp({ currentXp: 3, currentLevel: 5, xpToAdd: -10 })
      expect(result.newXp).toBe(0)
      expect(result.newLevel).toBe(5)
      expect(result.levelsGained).toBe(0)
    })

    it('does not reduce level on deduction', () => {
      const result = applyTrainerXp({ currentXp: 0, currentLevel: 5, xpToAdd: -5 })
      expect(result.newXp).toBe(0)
      expect(result.newLevel).toBe(5)
      expect(result.levelsGained).toBe(0)
    })
  })

  // T1.5 Edge Cases
  describe('edge cases', () => {
    it('handles zero starting XP', () => {
      const result = applyTrainerXp({ currentXp: 0, currentLevel: 1, xpToAdd: 1 })
      expect(result.newXp).toBe(1)
      expect(result.levelsGained).toBe(0)
    })

    it('handles level 1 with exactly 10 XP', () => {
      const result = applyTrainerXp({ currentXp: 0, currentLevel: 1, xpToAdd: 10 })
      expect(result.newXp).toBe(0)
      expect(result.newLevel).toBe(2)
      expect(result.levelsGained).toBe(1)
    })

    it('preserves previous values in result', () => {
      const result = applyTrainerXp({ currentXp: 7, currentLevel: 10, xpToAdd: 5 })
      expect(result.previousXp).toBe(7)
      expect(result.previousLevel).toBe(10)
      expect(result.xpAdded).toBe(5)
    })

    it('bank at 9, award +1 triggers level-up with bank 0', () => {
      const result = applyTrainerXp({ currentXp: 9, currentLevel: 5, xpToAdd: 1 })
      expect(result.newXp).toBe(0)
      expect(result.newLevel).toBe(6)
      expect(result.levelsGained).toBe(1)
    })
  })
})

/**
 * T2: isNewSpecies utility
 *
 * PTU p.461: +1 XP for first capture of a species.
 */
describe('isNewSpecies', () => {
  it('returns true for species not in list', () => {
    expect(isNewSpecies('Pikachu', ['charmander', 'bulbasaur'])).toBe(true)
  })

  it('returns false for species already in list', () => {
    expect(isNewSpecies('Pikachu', ['pikachu', 'charmander'])).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isNewSpecies('PIKACHU', ['pikachu'])).toBe(false)
    expect(isNewSpecies('pikachu', ['PIKACHU'])).toBe(false)
  })

  it('handles empty list', () => {
    expect(isNewSpecies('Pikachu', [])).toBe(true)
  })

  it('trims whitespace', () => {
    expect(isNewSpecies(' Pikachu ', ['pikachu'])).toBe(false)
  })
})

/**
 * Constants validation
 */
describe('constants', () => {
  it('TRAINER_MAX_LEVEL is 50', () => {
    expect(TRAINER_MAX_LEVEL).toBe(50)
  })

  it('TRAINER_XP_PER_LEVEL is 10', () => {
    expect(TRAINER_XP_PER_LEVEL).toBe(10)
  })

  it('TRAINER_XP_SUGGESTIONS has correct tiers', () => {
    expect(Object.keys(TRAINER_XP_SUGGESTIONS)).toEqual([
      'none', 'low', 'moderate', 'significant', 'major', 'critical'
    ])
    expect(TRAINER_XP_SUGGESTIONS.critical.xp).toBe(5) // decree-030: capped at x5
  })
})
