import { describe, it, expect } from 'vitest'
import {
  buildStatTiers,
  validateBaseRelations,
  extractStatPoints,
  getValidAllocationTargets,
  formatStatName,
  STAT_KEYS
} from '~/utils/baseRelations'
import type { Stats } from '~/types/character'

/**
 * Helper to create a Stats object with defaults of 0.
 * Allows specifying only the stats that matter for the test.
 */
function makeStats(overrides: Partial<Stats> = {}): Stats {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    ...overrides
  }
}

// ============================================
// buildStatTiers
// ============================================

describe('buildStatTiers', () => {
  it('creates distinct tiers for all-different base stats', () => {
    const base = makeStats({
      hp: 10, attack: 8, defense: 6,
      specialAttack: 4, specialDefense: 2, speed: 1
    })
    const tiers = buildStatTiers(base)

    expect(tiers).toHaveLength(6)
    expect(tiers[0]).toEqual({ stats: ['hp'], baseValue: 10 })
    expect(tiers[1]).toEqual({ stats: ['attack'], baseValue: 8 })
    expect(tiers[5]).toEqual({ stats: ['speed'], baseValue: 1 })
  })

  it('groups equal base stats into a single tier', () => {
    const base = makeStats({
      hp: 8, attack: 8, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 3
    })
    const tiers = buildStatTiers(base)

    expect(tiers).toHaveLength(3)
    expect(tiers[0].baseValue).toBe(8)
    expect(tiers[0].stats).toContain('hp')
    expect(tiers[0].stats).toContain('attack')
    expect(tiers[0].stats).toHaveLength(2)
    expect(tiers[1].baseValue).toBe(5)
    expect(tiers[1].stats).toHaveLength(3)
    expect(tiers[2].baseValue).toBe(3)
    expect(tiers[2].stats).toEqual(['speed'])
  })

  it('puts all stats into one tier when all base stats are equal', () => {
    const base = makeStats({
      hp: 7, attack: 7, defense: 7,
      specialAttack: 7, specialDefense: 7, speed: 7
    })
    const tiers = buildStatTiers(base)

    expect(tiers).toHaveLength(1)
    expect(tiers[0].stats).toHaveLength(6)
    expect(tiers[0].baseValue).toBe(7)
  })

  it('handles a single stat being uniquely highest', () => {
    // Pikachu-like: speed is highest, rest are equal
    const base = makeStats({
      hp: 4, attack: 6, defense: 4,
      specialAttack: 5, specialDefense: 5, speed: 9
    })
    const tiers = buildStatTiers(base)

    expect(tiers[0]).toEqual({ stats: ['speed'], baseValue: 9 })
    expect(tiers[1]).toEqual({ stats: ['attack'], baseValue: 6 })
    // specialAttack and specialDefense tied at 5
    expect(tiers[2].baseValue).toBe(5)
    expect(tiers[2].stats).toContain('specialAttack')
    expect(tiers[2].stats).toContain('specialDefense')
    expect(tiers[3].baseValue).toBe(4)
    expect(tiers[3].stats).toContain('hp')
    expect(tiers[3].stats).toContain('defense')
  })

  it('sorts descending even with zero base stats', () => {
    const base = makeStats({
      hp: 5, attack: 0, defense: 3,
      specialAttack: 0, specialDefense: 0, speed: 1
    })
    const tiers = buildStatTiers(base)

    expect(tiers[0].baseValue).toBe(5)
    expect(tiers[tiers.length - 1].baseValue).toBe(0)
    expect(tiers[tiers.length - 1].stats).toHaveLength(3) // attack, spAtk, spDef
  })

  it('handles large base stat values', () => {
    const base = makeStats({
      hp: 255, attack: 190, defense: 230,
      specialAttack: 190, specialDefense: 230, speed: 150
    })
    const tiers = buildStatTiers(base)

    expect(tiers[0]).toEqual({ stats: ['hp'], baseValue: 255 })
    expect(tiers[1].baseValue).toBe(230)
    expect(tiers[1].stats).toContain('defense')
    expect(tiers[1].stats).toContain('specialDefense')
    expect(tiers[2].baseValue).toBe(190)
    expect(tiers[2].stats).toContain('attack')
    expect(tiers[2].stats).toContain('specialAttack')
    expect(tiers[3]).toEqual({ stats: ['speed'], baseValue: 150 })
  })
})

// ============================================
// validateBaseRelations
// ============================================

describe('validateBaseRelations', () => {
  it('validates a valid allocation where ordering is preserved', () => {
    const base = makeStats({
      hp: 10, attack: 8, defense: 6,
      specialAttack: 4, specialDefense: 2, speed: 1
    })
    // Allocate more to higher-base stats — always valid
    const points = makeStats({
      hp: 5, attack: 4, defense: 3,
      specialAttack: 2, specialDefense: 1, speed: 0
    })

    const result = validateBaseRelations(base, points)

    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
    expect(result.tiers).toHaveLength(6)
  })

  it('detects a violation when lower base stat overtakes higher', () => {
    const base = makeStats({
      hp: 10, attack: 8, defense: 6,
      specialAttack: 4, specialDefense: 2, speed: 1
    })
    // Give speed (base 1) way more points than hp (base 10)
    const points = makeStats({
      hp: 0, attack: 0, defense: 0,
      specialAttack: 0, specialDefense: 0, speed: 20
    })

    const result = validateBaseRelations(base, points)

    expect(result.valid).toBe(false)
    expect(result.violations.length).toBeGreaterThan(0)
    // Speed should violate against all higher stats
    expect(result.violations.some(v => v.includes('Speed'))).toBe(true)
  })

  it('allows equal final stats when base stats differ', () => {
    const base = makeStats({
      hp: 10, attack: 8, defense: 6,
      specialAttack: 4, specialDefense: 4, speed: 2
    })
    // Bring everyone to exactly 10
    const points = makeStats({
      hp: 0, attack: 2, defense: 4,
      specialAttack: 6, specialDefense: 6, speed: 8
    })

    const result = validateBaseRelations(base, points)

    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('allows any allocation when all base stats are equal (single tier)', () => {
    const base = makeStats({
      hp: 5, attack: 5, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 5
    })
    // Wild allocation — no constraint since all base stats are equal
    const points = makeStats({
      hp: 0, attack: 20, defense: 0,
      specialAttack: 0, specialDefense: 0, speed: 0
    })

    const result = validateBaseRelations(base, points)

    expect(result.valid).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('detects violation for a single stat pair inversion', () => {
    const base = makeStats({
      hp: 10, attack: 8, defense: 6,
      specialAttack: 6, specialDefense: 6, speed: 6
    })
    // Only attack and hp have different base values
    // Give attack more than hp to cause violation
    const points = makeStats({
      hp: 0, attack: 5, defense: 0,
      specialAttack: 0, specialDefense: 0, speed: 0
    })

    const result = validateBaseRelations(base, points)

    // attack: 8+5=13 > hp: 10+0=10 — violation since hp base (10) > attack base (8)
    expect(result.valid).toBe(false)
    expect(result.violations).toHaveLength(1)
    expect(result.violations[0]).toContain('HP')
    expect(result.violations[0]).toContain('Attack')
  })

  it('allows tied equal-base stats to diverge freely', () => {
    // hp and attack have equal base, so they can diverge
    const base = makeStats({
      hp: 8, attack: 8, defense: 5,
      specialAttack: 5, specialDefense: 3, speed: 3
    })
    const points = makeStats({
      hp: 10, attack: 0, defense: 3,
      specialAttack: 0, specialDefense: 1, speed: 0
    })

    const result = validateBaseRelations(base, points)

    // hp (8+10=18) and attack (8+0=8) are in the same tier, so no violation between them
    // But defense (5+3=8) = attack (8+0=8), and base attack (8) > base defense (5) — valid since final is >=
    expect(result.valid).toBe(true)
  })

  it('reports multiple violations when several stats are inverted', () => {
    const base = makeStats({
      hp: 10, attack: 8, defense: 6,
      specialAttack: 4, specialDefense: 2, speed: 1
    })
    // Give all points to speed, nothing to others — violates against all higher stats
    const points = makeStats({
      hp: 0, attack: 0, defense: 0,
      specialAttack: 0, specialDefense: 0, speed: 15
    })

    const result = validateBaseRelations(base, points)

    expect(result.valid).toBe(false)
    // Speed (1+15=16) > all others, so it violates against hp, attack, defense, spAtk, spDef
    expect(result.violations.length).toBe(5)
  })

  it('returns tiers alongside validation result', () => {
    const base = makeStats({
      hp: 10, attack: 5, defense: 5,
      specialAttack: 3, specialDefense: 3, speed: 3
    })
    const points = makeStats()

    const result = validateBaseRelations(base, points)

    expect(result.tiers).toHaveLength(3)
    expect(result.tiers[0].baseValue).toBe(10)
    expect(result.tiers[1].baseValue).toBe(5)
    expect(result.tiers[2].baseValue).toBe(3)
  })

  it('validates zero allocation as always valid', () => {
    const base = makeStats({
      hp: 10, attack: 8, defense: 6,
      specialAttack: 4, specialDefense: 2, speed: 1
    })
    const points = makeStats()

    const result = validateBaseRelations(base, points)

    expect(result.valid).toBe(true)
  })
})

// ============================================
// extractStatPoints
// ============================================

describe('extractStatPoints', () => {
  it('extracts zero stat points when current = base (new Pokemon, level 1)', () => {
    // Level 1 Pokemon, stat budget = 1 + 10 = 11
    // If all points allocated to HP and current matches base for other stats,
    // let's test with truly zero allocation
    const base = makeStats({
      hp: 5, attack: 6, defense: 4,
      specialAttack: 5, specialDefense: 4, speed: 7
    })
    // maxHp with 0 points allocated to HP: level + (baseHp * 3) + 10 = 1 + (5*3) + 10 = 26
    const result = extractStatPoints({
      level: 1,
      maxHp: 26, // 1 + (5*3) + 10
      baseStats: base,
      currentStats: { ...base } // current = base means 0 points allocated
    })

    expect(result.statPoints).toEqual(makeStats())
    expect(result.totalAllocated).toBe(0)
    expect(result.expectedTotal).toBe(11)
    expect(result.isConsistent).toBe(false) // 0 != 11
    expect(result.warnings).toHaveLength(0)
  })

  it('correctly reverse-engineers HP stat points via PTU formula', () => {
    // Level 5 Pokemon, baseHp = 4
    // Allocated 3 points to HP -> hpStat = 4 + 3 = 7
    // maxHp = 5 + (7*3) + 10 = 36
    const base = makeStats({
      hp: 4, attack: 6, defense: 5,
      specialAttack: 3, specialDefense: 3, speed: 8
    })
    const current = makeStats({
      hp: 4, // not used for HP calculation
      attack: 6, defense: 5,
      specialAttack: 3, specialDefense: 3, speed: 8
    })

    const result = extractStatPoints({
      level: 5,
      maxHp: 36,
      baseStats: base,
      currentStats: current
    })

    expect(result.statPoints.hp).toBe(3)
    expect(result.warnings).toHaveLength(0)
  })

  it('rounds HP extraction correctly for exact formula round-trip', () => {
    // Level 10, baseHp = 6, allocate 5 HP points
    // hpStat = 6 + 5 = 11
    // maxHp = 10 + (11*3) + 10 = 53
    // Reverse: hpStat = (53 - 10 - 10) / 3 = 33/3 = 11
    // hpPoints = 11 - 6 = 5
    const base = makeStats({ hp: 6, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 })
    const current = makeStats({ hp: 6, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 5 })

    const result = extractStatPoints({
      level: 10,
      maxHp: 53,
      baseStats: base,
      currentStats: current
    })

    expect(result.statPoints.hp).toBe(5)
  })

  it('detects negative extraction and produces warnings', () => {
    // Current defense (3) < base defense (5) — should be clamped to 0 with a warning
    const base = makeStats({
      hp: 5, attack: 6, defense: 5,
      specialAttack: 4, specialDefense: 4, speed: 7
    })
    const current = makeStats({
      hp: 5, attack: 6, defense: 3,
      specialAttack: 4, specialDefense: 4, speed: 7
    })

    const result = extractStatPoints({
      level: 1,
      maxHp: 26, // 1 + (5*3) + 10
      baseStats: base,
      currentStats: current
    })

    expect(result.statPoints.defense).toBe(0)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('Defense')
    expect(result.warnings[0]).toContain('negative')
    expect(result.warnings[0]).toContain('-2')
  })

  it('produces multiple warnings when multiple stats have negative extraction', () => {
    const base = makeStats({
      hp: 10, attack: 8, defense: 6,
      specialAttack: 6, specialDefense: 4, speed: 5
    })
    // Current attack and speed are below base
    const current = makeStats({
      hp: 10, attack: 5, defense: 6,
      specialAttack: 6, specialDefense: 4, speed: 2
    })

    const result = extractStatPoints({
      level: 5,
      maxHp: 45, // 5 + (10*3) + 10 = 45 -> hpStat = (45-5-10)/3 = 10, hpPoints = 0
      baseStats: base,
      currentStats: current
    })

    expect(result.statPoints.attack).toBe(0)
    expect(result.statPoints.speed).toBe(0)
    expect(result.warnings).toHaveLength(2)
    expect(result.warnings.some(w => w.includes('Attack'))).toBe(true)
    expect(result.warnings.some(w => w.includes('Speed'))).toBe(true)
  })

  it('produces no warnings when all extractions are non-negative', () => {
    const base = makeStats({
      hp: 5, attack: 6, defense: 4,
      specialAttack: 5, specialDefense: 4, speed: 7
    })
    const current = makeStats({
      hp: 5, attack: 8, defense: 6,
      specialAttack: 7, specialDefense: 5, speed: 10
    })

    const result = extractStatPoints({
      level: 5,
      maxHp: 30, // 5 + (5*3) + 10 = 30 -> hpStat = 5, hpPoints = 0
      baseStats: base,
      currentStats: current
    })

    expect(result.warnings).toHaveLength(0)
    expect(result.statPoints.attack).toBe(2)
    expect(result.statPoints.defense).toBe(2)
    expect(result.statPoints.specialAttack).toBe(2)
    expect(result.statPoints.specialDefense).toBe(1)
    expect(result.statPoints.speed).toBe(3)
  })

  it('isConsistent is true when totalAllocated equals level + 10', () => {
    // Level 5 Pokemon, budget = 15
    // Allocate exactly 15 points across stats
    const base = makeStats({
      hp: 5, attack: 5, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 5
    })
    const current = makeStats({
      hp: 5, attack: 8, defense: 7,
      specialAttack: 7, specialDefense: 6, speed: 7
    })
    // Non-HP points: 3+2+2+1+2 = 10
    // HP points to reach 15: need 5
    // hpStat = 5 + 5 = 10, maxHp = 5 + (10*3) + 10 = 45

    const result = extractStatPoints({
      level: 5,
      maxHp: 45,
      baseStats: base,
      currentStats: current
    })

    expect(result.totalAllocated).toBe(15)
    expect(result.expectedTotal).toBe(15)
    expect(result.isConsistent).toBe(true)
  })

  it('isConsistent is false when totalAllocated differs from budget', () => {
    const base = makeStats({
      hp: 5, attack: 5, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 5
    })
    const current = makeStats({
      hp: 5, attack: 6, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 5
    })

    const result = extractStatPoints({
      level: 10,
      maxHp: 25, // 10 + (5*3) + 10 = 35, but using 25 to make HP points = round((25-10-10)/3)-5 = round(5/3)-5 ≈ 2-5 = -3 → clamped to 0
      baseStats: base,
      currentStats: current
    })

    // totalAllocated = 0 (hp clamped) + 1 (attack) + 0*4 = 1
    // expectedTotal = 10 + 10 = 20
    expect(result.isConsistent).toBe(false)
  })

  it('handles level 1 Pokemon with minimal stats', () => {
    const base = makeStats({
      hp: 3, attack: 4, defense: 3,
      specialAttack: 5, specialDefense: 3, speed: 6
    })
    const current = makeStats({
      hp: 3, attack: 4, defense: 3,
      specialAttack: 5, specialDefense: 3, speed: 6
    })

    const result = extractStatPoints({
      level: 1,
      maxHp: 20, // 1 + (3*3) + 10 = 20 -> hpStat = 3, points = 0
      baseStats: base,
      currentStats: current
    })

    expect(result.statPoints).toEqual(makeStats())
    expect(result.totalAllocated).toBe(0)
    expect(result.expectedTotal).toBe(11)
  })

  it('handles high-level Pokemon with many allocated points', () => {
    // Level 100, budget = 110
    const base = makeStats({
      hp: 8, attack: 10, defense: 7,
      specialAttack: 12, specialDefense: 6, speed: 9
    })
    const current = makeStats({
      hp: 8, attack: 30, defense: 20,
      specialAttack: 32, specialDefense: 16, speed: 24
    })
    // Non-HP allocated: 20 + 13 + 20 + 10 + 15 = 78
    // HP: budget is 110, need hpPoints = 110 - 78 = 32
    // hpStat = 8 + 32 = 40, maxHp = 100 + (40*3) + 10 = 230

    const result = extractStatPoints({
      level: 100,
      maxHp: 230,
      baseStats: base,
      currentStats: current
    })

    expect(result.statPoints.hp).toBe(32)
    expect(result.statPoints.attack).toBe(20)
    expect(result.statPoints.defense).toBe(13)
    expect(result.statPoints.specialAttack).toBe(20)
    expect(result.statPoints.specialDefense).toBe(10)
    expect(result.statPoints.speed).toBe(15)
    expect(result.totalAllocated).toBe(110)
    expect(result.isConsistent).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('handles HP negative extraction when maxHp is too low', () => {
    const base = makeStats({
      hp: 10, attack: 5, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 5
    })
    const current = makeStats({
      hp: 10, attack: 5, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 5
    })

    // maxHp deliberately too low: level + (baseHp*3) + 10 would be 5+(10*3)+10 = 45
    // Using 20 instead: hpStat = round((20-5-10)/3) = round(5/3) = round(1.67) = 2
    // hpPoints = 2 - 10 = -8 -> clamped to 0
    const result = extractStatPoints({
      level: 5,
      maxHp: 20,
      baseStats: base,
      currentStats: current
    })

    expect(result.statPoints.hp).toBe(0)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('HP')
    expect(result.warnings[0]).toContain('negative')
  })
})

// ============================================
// getValidAllocationTargets
// ============================================

describe('getValidAllocationTargets', () => {
  it('allows all stats when allocation is zero (no constraints yet)', () => {
    const base = makeStats({
      hp: 10, attack: 8, defense: 6,
      specialAttack: 4, specialDefense: 2, speed: 1
    })
    const points = makeStats()

    const targets = getValidAllocationTargets(base, points)

    // All stats should be valid since adding 1 to any won't violate ordering
    for (const key of STAT_KEYS) {
      expect(targets[key]).toBe(true)
    }
  })

  it('blocks a lower-base stat from overtaking the next higher stat', () => {
    // attack base 10, defense base 5
    // If defense already has 5 points (final = 10), adding +1 would make it 11 > attack's 10
    const base = makeStats({
      hp: 3, attack: 10, defense: 5,
      specialAttack: 3, specialDefense: 3, speed: 3
    })
    const points = makeStats({
      hp: 0, attack: 0, defense: 5,
      specialAttack: 0, specialDefense: 0, speed: 0
    })

    const targets = getValidAllocationTargets(base, points)

    // defense (5+5=10, +1 would make 11) > attack (10+0=10) — BLOCKED
    expect(targets.defense).toBe(false)
    // attack should still be valid
    expect(targets.attack).toBe(true)
  })

  it('allows allocation to a stat right at the boundary (final equal)', () => {
    // attack base 10, defense base 8
    // defense has 1 point (final = 9). Adding +1 makes it 10 = attack. Should be allowed.
    const base = makeStats({
      hp: 3, attack: 10, defense: 8,
      specialAttack: 3, specialDefense: 3, speed: 3
    })
    const points = makeStats({
      hp: 0, attack: 0, defense: 1,
      specialAttack: 0, specialDefense: 0, speed: 0
    })

    const targets = getValidAllocationTargets(base, points)

    // defense would become 8+2=10 = attack 10+0=10 — valid (>= is satisfied)
    expect(targets.defense).toBe(true)
  })

  it('blocks stat when it would overtake multiple higher-base stats', () => {
    const base = makeStats({
      hp: 10, attack: 8, defense: 6,
      specialAttack: 4, specialDefense: 4, speed: 2
    })
    // speed at 8 points: final = 2+8=10, equal to hp. Adding +1 = 11 > hp 10
    const points = makeStats({
      hp: 0, attack: 0, defense: 0,
      specialAttack: 0, specialDefense: 0, speed: 8
    })

    const targets = getValidAllocationTargets(base, points)

    // speed +1 = 2+9=11, would exceed hp (10) — blocked
    expect(targets.speed).toBe(false)
  })

  it('allows all allocations when all base stats are equal', () => {
    const base = makeStats({
      hp: 5, attack: 5, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 5
    })
    // Even with uneven existing allocation, all are in the same tier
    const points = makeStats({
      hp: 0, attack: 10, defense: 0,
      specialAttack: 0, specialDefense: 0, speed: 0
    })

    const targets = getValidAllocationTargets(base, points)

    for (const key of STAT_KEYS) {
      expect(targets[key]).toBe(true)
    }
  })

  it('correctly handles constraint propagation across tiers', () => {
    // Three tiers: hp(10) > attack(7) > speed(3)
    const base = makeStats({
      hp: 10, attack: 7, defense: 7,
      specialAttack: 7, specialDefense: 7, speed: 3
    })
    // speed has 4 points: 3+4=7 = attack tier final. Adding +1 would make 8 > 7
    const points = makeStats({
      hp: 0, attack: 0, defense: 0,
      specialAttack: 0, specialDefense: 0, speed: 4
    })

    const targets = getValidAllocationTargets(base, points)

    expect(targets.speed).toBe(false) // would exceed attack tier
    expect(targets.attack).toBe(true) // can still go up
    expect(targets.hp).toBe(true) // highest, always can go up
  })

  it('allows stat to match but not exceed the tier above', () => {
    // hp(10) > attack(7)
    // attack has 2 points: 7+2=9. Adding +1 makes 10 = hp. Allowed.
    const base = makeStats({
      hp: 10, attack: 7, defense: 5,
      specialAttack: 5, specialDefense: 5, speed: 5
    })
    const points = makeStats({
      hp: 0, attack: 2, defense: 0,
      specialAttack: 0, specialDefense: 0, speed: 0
    })

    const targets = getValidAllocationTargets(base, points)

    expect(targets.attack).toBe(true) // 7+3=10 = hp 10+0=10, valid
  })
})

// ============================================
// formatStatName
// ============================================

describe('formatStatName', () => {
  it('formats known stat keys correctly', () => {
    expect(formatStatName('hp')).toBe('HP')
    expect(formatStatName('attack')).toBe('Attack')
    expect(formatStatName('defense')).toBe('Defense')
    expect(formatStatName('specialAttack')).toBe('Sp.Atk')
    expect(formatStatName('specialDefense')).toBe('Sp.Def')
    expect(formatStatName('speed')).toBe('Speed')
  })

  it('returns the key itself for unknown stat names', () => {
    expect(formatStatName('unknown')).toBe('unknown')
    expect(formatStatName('customStat')).toBe('customStat')
  })
})

// ============================================
// Integration: allocation workflow
// ============================================

describe('integration: allocation workflow', () => {
  it('validates a full allocation round-trip (allocate -> extract -> validate)', () => {
    const base = makeStats({
      hp: 8, attack: 6, defense: 5,
      specialAttack: 7, specialDefense: 4, speed: 9
    })
    // Allocate 15 points (level 5) respecting ordering:
    // speed(9) > hp(8) > spAtk(7) > atk(6) > def(5) > spDef(4)
    const statPoints = makeStats({
      hp: 3, attack: 2, defense: 2,
      specialAttack: 3, specialDefense: 1, speed: 4
    })

    // Step 1: Validate the allocation
    const validation = validateBaseRelations(base, statPoints)
    expect(validation.valid).toBe(true)

    // Step 2: Calculate what the Pokemon's stats would look like
    const calculatedStats = makeStats({
      hp: base.hp + statPoints.hp,
      attack: base.attack + statPoints.attack,
      defense: base.defense + statPoints.defense,
      specialAttack: base.specialAttack + statPoints.specialAttack,
      specialDefense: base.specialDefense + statPoints.specialDefense,
      speed: base.speed + statPoints.speed
    })
    const level = 5
    const hpStat = base.hp + statPoints.hp // 11
    const maxHp = level + (hpStat * 3) + 10 // 5 + 33 + 10 = 48

    // Step 3: Extract stat points back from the calculated state
    const extraction = extractStatPoints({
      level,
      maxHp,
      baseStats: base,
      currentStats: calculatedStats
    })

    expect(extraction.statPoints).toEqual(statPoints)
    expect(extraction.totalAllocated).toBe(15)
    expect(extraction.expectedTotal).toBe(15)
    expect(extraction.isConsistent).toBe(true)
    expect(extraction.warnings).toHaveLength(0)
  })

  it('getValidAllocationTargets respects current validation state', () => {
    // Tiers: speed(9) > hp(8) > spAtk(7) > atk(6) > def(5) > spDef(4)
    const base = makeStats({
      hp: 8, attack: 6, defense: 5,
      specialAttack: 7, specialDefense: 4, speed: 9
    })

    // Start with zero allocation — all targets valid
    let targets = getValidAllocationTargets(base, makeStats())
    for (const key of STAT_KEYS) {
      expect(targets[key]).toBe(true)
    }

    // Allocate enough to spDef to bring it near defense
    // spDef(4) + 1 = 5 = def(5) — still valid
    const points1 = makeStats({ specialDefense: 1 })
    targets = getValidAllocationTargets(base, points1)
    expect(targets.specialDefense).toBe(false) // spDef(4+2=6) > def(5+0=5)
  })
})
