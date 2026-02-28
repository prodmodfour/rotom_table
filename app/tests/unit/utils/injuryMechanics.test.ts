import { describe, it, expect } from 'vitest'
import {
  checkHeavilyInjured,
  calculateDeathHpThreshold,
  checkDeath,
  applyHeavilyInjuredPenalty,
  HEAVILY_INJURED_THRESHOLD,
  LETHAL_INJURY_COUNT,
  DEATH_HP_ABSOLUTE,
  DEATH_HP_PERCENTAGE
} from '~/utils/injuryMechanics'

// ============================================
// CONSTANTS
// ============================================

describe('injuryMechanics constants', () => {
  it('has correct PTU threshold values', () => {
    expect(HEAVILY_INJURED_THRESHOLD).toBe(5)
    expect(LETHAL_INJURY_COUNT).toBe(10)
    expect(DEATH_HP_ABSOLUTE).toBe(-50)
    expect(DEATH_HP_PERCENTAGE).toBe(-2.0)
  })
})

// ============================================
// checkHeavilyInjured
// ============================================

describe('checkHeavilyInjured', () => {
  it('returns not heavily injured for 0 injuries', () => {
    const result = checkHeavilyInjured(0)
    expect(result.isHeavilyInjured).toBe(false)
    expect(result.hpLoss).toBe(0)
  })

  it('returns not heavily injured for 4 injuries (below threshold)', () => {
    const result = checkHeavilyInjured(4)
    expect(result.isHeavilyInjured).toBe(false)
    expect(result.hpLoss).toBe(0)
  })

  it('returns heavily injured at exactly 5 injuries', () => {
    const result = checkHeavilyInjured(5)
    expect(result.isHeavilyInjured).toBe(true)
    expect(result.hpLoss).toBe(5)
  })

  it('returns heavily injured for 7 injuries with correct HP loss', () => {
    const result = checkHeavilyInjured(7)
    expect(result.isHeavilyInjured).toBe(true)
    expect(result.hpLoss).toBe(7)
  })

  it('returns heavily injured for 10 injuries', () => {
    const result = checkHeavilyInjured(10)
    expect(result.isHeavilyInjured).toBe(true)
    expect(result.hpLoss).toBe(10)
  })
})

// ============================================
// calculateDeathHpThreshold
// ============================================

describe('calculateDeathHpThreshold', () => {
  it('uses -200% for high max HP (100 HP Pokemon)', () => {
    // -50 vs -200. Lower (more negative) = -200
    const threshold = calculateDeathHpThreshold(100)
    expect(threshold).toBe(-200)
  })

  it('uses -50 for low max HP (20 HP Pokemon)', () => {
    // -50 vs -40. Lower (more negative) = -50
    const threshold = calculateDeathHpThreshold(20)
    expect(threshold).toBe(-50)
  })

  it('uses -50 for 25 HP (exact tie: -50 vs -50)', () => {
    // -50 vs -50. min(-50, -50) = -50
    const threshold = calculateDeathHpThreshold(25)
    expect(threshold).toBe(-50)
  })

  it('uses -200% for very high max HP (200 HP Pokemon)', () => {
    // -50 vs -400. Lower = -400
    const threshold = calculateDeathHpThreshold(200)
    expect(threshold).toBe(-400)
  })

  it('handles small max HP (10 HP)', () => {
    // -50 vs -20. Lower = -50
    const threshold = calculateDeathHpThreshold(10)
    expect(threshold).toBe(-50)
  })

  it('handles trainer-level HP (60 HP)', () => {
    // -50 vs -120. Lower = -120
    const threshold = calculateDeathHpThreshold(60)
    expect(threshold).toBe(-120)
  })
})

// ============================================
// checkDeath
// ============================================

describe('checkDeath', () => {
  describe('injury-based death', () => {
    it('declares death at 10 injuries', () => {
      const result = checkDeath(50, 100, 10, false)
      expect(result.isDead).toBe(true)
      expect(result.cause).toBe('injuries')
      expect(result.leagueSuppressed).toBe(false)
    })

    it('declares death at 12 injuries', () => {
      const result = checkDeath(50, 100, 12, false)
      expect(result.isDead).toBe(true)
      expect(result.cause).toBe('injuries')
    })

    it('does NOT declare death at 9 injuries', () => {
      const result = checkDeath(50, 100, 9, false)
      expect(result.isDead).toBe(false)
    })

    it('injury death is NOT suppressed in League Battles', () => {
      const result = checkDeath(50, 100, 10, true)
      expect(result.isDead).toBe(true)
      expect(result.cause).toBe('injuries')
      expect(result.leagueSuppressed).toBe(false)
    })
  })

  describe('HP-based death (full contact)', () => {
    it('declares death when HP drops below threshold (100 HP Pokemon at -201)', () => {
      // Threshold for 100 HP = -200
      const result = checkDeath(0, 100, 3, false, -201)
      expect(result.isDead).toBe(true)
      expect(result.cause).toBe('hp_threshold')
    })

    it('declares death at exactly the threshold (100 HP Pokemon at -200)', () => {
      // At exactly -200, which is <= -200, so death
      const result = checkDeath(0, 100, 3, false, -200)
      expect(result.isDead).toBe(true)
      expect(result.cause).toBe('hp_threshold')
    })

    it('does NOT declare death above threshold (100 HP Pokemon at -199)', () => {
      const result = checkDeath(0, 100, 3, false, -199)
      expect(result.isDead).toBe(false)
    })

    it('uses -50 threshold for low HP entities (20 HP)', () => {
      // Threshold for 20 HP = -50 (since -50 < -40)
      const result = checkDeath(0, 20, 3, false, -51)
      expect(result.isDead).toBe(true)
      expect(result.cause).toBe('hp_threshold')
    })

    it('alive just above -50 threshold for low HP entities', () => {
      const result = checkDeath(0, 20, 3, false, -49)
      expect(result.isDead).toBe(false)
    })
  })

  describe('League Battle exemption', () => {
    it('suppresses HP-based death in League Battles', () => {
      const result = checkDeath(0, 100, 3, true, -250)
      expect(result.isDead).toBe(false)
      expect(result.leagueSuppressed).toBe(true)
    })

    it('does NOT suppress injury-based death in League Battles', () => {
      const result = checkDeath(50, 100, 10, true)
      expect(result.isDead).toBe(true)
      expect(result.cause).toBe('injuries')
      expect(result.leagueSuppressed).toBe(false)
    })
  })

  describe('uses unclampedHp when provided', () => {
    it('uses clamped currentHp when unclampedHp not provided', () => {
      // currentHp = 0 (clamped), maxHp = 100, threshold = -200
      // 0 > -200, so not dead
      const result = checkDeath(0, 100, 3, false)
      expect(result.isDead).toBe(false)
    })

    it('uses unclampedHp for threshold check when provided', () => {
      // currentHp = 0 (clamped), but unclampedHp = -250, threshold = -200
      // -250 <= -200, so dead
      const result = checkDeath(0, 100, 3, false, -250)
      expect(result.isDead).toBe(true)
      expect(result.cause).toBe('hp_threshold')
    })
  })

  describe('deathHpThreshold in result', () => {
    it('returns correct threshold for 100 HP entity', () => {
      const result = checkDeath(50, 100, 0, false)
      expect(result.deathHpThreshold).toBe(-200)
    })

    it('returns correct threshold for 20 HP entity', () => {
      const result = checkDeath(15, 20, 0, false)
      expect(result.deathHpThreshold).toBe(-50)
    })
  })
})

// ============================================
// applyHeavilyInjuredPenalty
// ============================================

describe('applyHeavilyInjuredPenalty', () => {
  it('does nothing for 0 injuries', () => {
    const result = applyHeavilyInjuredPenalty(50, 0)
    expect(result.newHp).toBe(50)
    expect(result.unclampedHp).toBe(50)
    expect(result.hpLost).toBe(0)
  })

  it('does nothing for 4 injuries (below threshold)', () => {
    const result = applyHeavilyInjuredPenalty(50, 4)
    expect(result.newHp).toBe(50)
    expect(result.hpLost).toBe(0)
  })

  it('applies 5 HP loss for 5 injuries', () => {
    const result = applyHeavilyInjuredPenalty(50, 5)
    expect(result.newHp).toBe(45)
    expect(result.unclampedHp).toBe(45)
    expect(result.hpLost).toBe(5)
  })

  it('applies 8 HP loss for 8 injuries', () => {
    const result = applyHeavilyInjuredPenalty(30, 8)
    expect(result.newHp).toBe(22)
    expect(result.unclampedHp).toBe(22)
    expect(result.hpLost).toBe(8)
  })

  it('clamps HP to 0 when penalty exceeds current HP', () => {
    const result = applyHeavilyInjuredPenalty(3, 7)
    expect(result.newHp).toBe(0)
    expect(result.unclampedHp).toBe(-4)
    expect(result.hpLost).toBe(7)
  })

  it('does nothing when current HP is 0 (already fainted)', () => {
    const result = applyHeavilyInjuredPenalty(0, 7)
    expect(result.newHp).toBe(0)
    expect(result.unclampedHp).toBe(0)
    expect(result.hpLost).toBe(0)
  })

  it('exact HP equals injury count results in 0 HP', () => {
    const result = applyHeavilyInjuredPenalty(5, 5)
    expect(result.newHp).toBe(0)
    expect(result.unclampedHp).toBe(0)
    expect(result.hpLost).toBe(5)
  })
})
