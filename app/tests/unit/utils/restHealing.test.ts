import { describe, it, expect } from 'vitest'
import { getEffectiveMaxHp, calculateRestHealing, isDailyMoveRefreshable, calculateAvailableAp } from '~/utils/restHealing'

describe('getEffectiveMaxHp', () => {
  it('returns raw maxHp when injuries is 0', () => {
    expect(getEffectiveMaxHp(50, 0)).toBe(50)
    expect(getEffectiveMaxHp(100, 0)).toBe(100)
  })

  it('returns raw maxHp when injuries is negative (defensive)', () => {
    expect(getEffectiveMaxHp(50, -1)).toBe(50)
    expect(getEffectiveMaxHp(50, -5)).toBe(50)
  })

  it('reduces maxHp by 10% per injury (PTU example: 50 maxHp, 3 injuries = 35)', () => {
    expect(getEffectiveMaxHp(50, 3)).toBe(35)
  })

  it('handles various injury counts correctly', () => {
    expect(getEffectiveMaxHp(100, 1)).toBe(90)
    expect(getEffectiveMaxHp(100, 2)).toBe(80)
    expect(getEffectiveMaxHp(100, 5)).toBe(50)
    expect(getEffectiveMaxHp(60, 1)).toBe(54)
    expect(getEffectiveMaxHp(60, 4)).toBe(36)
  })

  it('floors the result for non-round values', () => {
    // 33 * 9/10 = 29.7 → 29
    expect(getEffectiveMaxHp(33, 1)).toBe(29)
    // 7 * 7/10 = 4.9 → 4
    expect(getEffectiveMaxHp(7, 3)).toBe(4)
  })

  it('returns 0 when injuries is 10 (dead per PTU p.251)', () => {
    expect(getEffectiveMaxHp(50, 10)).toBe(0)
    expect(getEffectiveMaxHp(100, 10)).toBe(0)
    expect(getEffectiveMaxHp(1, 10)).toBe(0)
  })

  it('clamps injuries greater than 10 to 10, returning 0', () => {
    expect(getEffectiveMaxHp(50, 11)).toBe(0)
    expect(getEffectiveMaxHp(50, 12)).toBe(0)
    expect(getEffectiveMaxHp(50, 100)).toBe(0)
  })

  it('returns 0 when maxHp is 0 regardless of injuries', () => {
    expect(getEffectiveMaxHp(0, 0)).toBe(0)
    expect(getEffectiveMaxHp(0, 3)).toBe(0)
    expect(getEffectiveMaxHp(0, 10)).toBe(0)
  })
})

describe('calculateRestHealing', () => {
  it('uses real maxHp for 1/16th healing amount, not effective max', () => {
    // 80 maxHp, 4 injuries: effectiveMax = floor(80 * 6/10) = 48
    // healAmount should be floor(80/16) = 5, NOT floor(48/16) = 3
    const result = calculateRestHealing({
      currentHp: 0,
      maxHp: 80,
      injuries: 4,
      restMinutesToday: 0
    })
    expect(result.canHeal).toBe(true)
    expect(result.hpHealed).toBe(5)
  })

  it('caps healing at effective max, not raw max', () => {
    // 50 maxHp, 3 injuries: effectiveMax = 35
    // healAmount = floor(50/16) = 3
    // currentHp = 34, so actualHeal = min(3, 35-34) = 1
    const result = calculateRestHealing({
      currentHp: 34,
      maxHp: 50,
      injuries: 3,
      restMinutesToday: 0
    })
    expect(result.canHeal).toBe(true)
    expect(result.hpHealed).toBe(1)
  })

  it('reports already at full HP when at effective max (not raw max)', () => {
    // 50 maxHp, 3 injuries: effectiveMax = 35
    // currentHp = 35 → already at full
    const result = calculateRestHealing({
      currentHp: 35,
      maxHp: 50,
      injuries: 3,
      restMinutesToday: 0
    })
    expect(result.canHeal).toBe(false)
    expect(result.reason).toBe('Already at full HP')
  })

  it('blocks rest healing with 5+ injuries', () => {
    const result = calculateRestHealing({
      currentHp: 10,
      maxHp: 50,
      injuries: 5,
      restMinutesToday: 0
    })
    expect(result.canHeal).toBe(false)
    expect(result.reason).toBe('Cannot rest-heal with 5+ injuries')
  })

  it('blocks rest healing after 480 minutes', () => {
    const result = calculateRestHealing({
      currentHp: 10,
      maxHp: 50,
      injuries: 0,
      restMinutesToday: 480
    })
    expect(result.canHeal).toBe(false)
    expect(result.reason).toBe('Already rested maximum 8 hours today')
  })

  it('heals 0 HP for very low maxHp (PTU floor rounding, no minimum)', () => {
    // 10 maxHp, 0 injuries: healAmount = floor(10/16) = 0
    // PTU p.31: no minimum specified — low-HP entities heal 0 per rest
    const result = calculateRestHealing({
      currentHp: 0,
      maxHp: 10,
      injuries: 0,
      restMinutesToday: 0
    })
    expect(result.canHeal).toBe(true)
    expect(result.hpHealed).toBe(0)
  })
})

describe('isDailyMoveRefreshable', () => {
  it('returns true when lastUsedAt is null (no usage record)', () => {
    expect(isDailyMoveRefreshable(null)).toBe(true)
  })

  it('returns true when lastUsedAt is undefined', () => {
    expect(isDailyMoveRefreshable(undefined)).toBe(true)
  })

  it('returns false when move was used today (same calendar day)', () => {
    const now = new Date()
    expect(isDailyMoveRefreshable(now.toISOString())).toBe(false)
  })

  it('returns true when move was used yesterday', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    expect(isDailyMoveRefreshable(yesterday.toISOString())).toBe(true)
  })

  it('returns true when move was used several days ago', () => {
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    expect(isDailyMoveRefreshable(lastWeek.toISOString())).toBe(true)
  })
})

describe('calculateAvailableAp', () => {
  it('returns max AP with no bound or drained AP', () => {
    expect(calculateAvailableAp(5, 0, 0)).toBe(5)
  })

  it('subtracts bound AP from max', () => {
    expect(calculateAvailableAp(7, 2, 0)).toBe(5)
  })

  it('subtracts drained AP from max', () => {
    expect(calculateAvailableAp(7, 0, 3)).toBe(4)
  })

  it('subtracts both bound and drained AP', () => {
    expect(calculateAvailableAp(8, 2, 3)).toBe(3)
  })

  it('floors at 0 when bound + drained exceeds max', () => {
    expect(calculateAvailableAp(5, 3, 4)).toBe(0)
  })
})
