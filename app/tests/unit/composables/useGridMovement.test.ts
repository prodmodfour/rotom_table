import { describe, it, expect } from 'vitest'
import { applyMovementModifiers } from '~/composables/useGridMovement'
import type { Combatant } from '~/types'
import type { StatusCondition, StageModifiers } from '~/types/combat'

/**
 * Build a minimal Combatant stub for testing applyMovementModifiers.
 * Only the fields accessed by the function are populated.
 */
function makeCombatant(overrides: {
  statusConditions?: StatusCondition[]
  stageModifiers?: Partial<StageModifiers>
  tempConditions?: string[]
} = {}): Combatant {
  const defaultStageModifiers: StageModifiers = {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0
  }

  return {
    id: 'test-combatant',
    type: 'pokemon',
    entityId: 'test-entity',
    side: 'players',
    initiative: 0,
    initiativeBonus: 0,
    turnState: {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false
    },
    hasActed: false,
    actionsRemaining: 1,
    shiftActionsRemaining: 1,
    tempConditions: overrides.tempConditions ?? [],
    injuries: { count: 0, sources: [] },
    physicalEvasion: 0,
    specialEvasion: 0,
    speedEvasion: 0,
    tokenSize: 1,
    entity: {
      statusConditions: overrides.statusConditions ?? [],
      stageModifiers: {
        ...defaultStageModifiers,
        ...overrides.stageModifiers
      }
    } as Combatant['entity']
  }
}

describe('applyMovementModifiers', () => {
  describe('no conditions (baseline)', () => {
    it('should return base speed unchanged when no modifiers apply', () => {
      const combatant = makeCombatant()
      expect(applyMovementModifiers(combatant, 5)).toBe(5)
    })

    it('should return base speed unchanged for various speeds', () => {
      const combatant = makeCombatant()
      expect(applyMovementModifiers(combatant, 1)).toBe(1)
      expect(applyMovementModifiers(combatant, 3)).toBe(3)
      expect(applyMovementModifiers(combatant, 8)).toBe(8)
      expect(applyMovementModifiers(combatant, 10)).toBe(10)
    })

    it('should return 0 for base speed 0 (no minimum floor applies)', () => {
      const combatant = makeCombatant()
      expect(applyMovementModifiers(combatant, 0)).toBe(0)
    })
  })

  describe('Stuck condition', () => {
    it('should return 0 for Stuck combatant (PTU p.231)', () => {
      const combatant = makeCombatant({ statusConditions: ['Stuck'] })
      expect(applyMovementModifiers(combatant, 5)).toBe(0)
    })

    it('should return 0 regardless of base speed', () => {
      const combatant = makeCombatant({ statusConditions: ['Stuck'] })
      expect(applyMovementModifiers(combatant, 1)).toBe(0)
      expect(applyMovementModifiers(combatant, 10)).toBe(0)
      expect(applyMovementModifiers(combatant, 100)).toBe(0)
    })

    it('should override Speed CS +6 (Stuck wins)', () => {
      const combatant = makeCombatant({
        statusConditions: ['Stuck'],
        stageModifiers: { speed: 6 }
      })
      expect(applyMovementModifiers(combatant, 5)).toBe(0)
    })

    it('should override Sprint (Stuck wins)', () => {
      const combatant = makeCombatant({
        statusConditions: ['Stuck'],
        tempConditions: ['Sprint']
      })
      expect(applyMovementModifiers(combatant, 5)).toBe(0)
    })

    it('should override Speed CS +6 AND Sprint combined (Stuck wins)', () => {
      const combatant = makeCombatant({
        statusConditions: ['Stuck'],
        stageModifiers: { speed: 6 },
        tempConditions: ['Sprint']
      })
      expect(applyMovementModifiers(combatant, 5)).toBe(0)
    })

    it('should override negative Speed CS minimum floor (Stuck wins over floor of 2)', () => {
      const combatant = makeCombatant({
        statusConditions: ['Stuck'],
        stageModifiers: { speed: -6 }
      })
      expect(applyMovementModifiers(combatant, 5)).toBe(0)
    })
  })

  describe('Slowed condition', () => {
    it('should halve movement speed', () => {
      const combatant = makeCombatant({ statusConditions: ['Slowed'] })
      // floor(5 / 2) = 2
      expect(applyMovementModifiers(combatant, 5)).toBe(2)
    })

    it('should floor the halved speed (even base)', () => {
      const combatant = makeCombatant({ statusConditions: ['Slowed'] })
      // floor(6 / 2) = 3
      expect(applyMovementModifiers(combatant, 6)).toBe(3)
    })

    it('should floor the halved speed (odd base)', () => {
      const combatant = makeCombatant({ statusConditions: ['Slowed'] })
      // floor(7 / 2) = 3
      expect(applyMovementModifiers(combatant, 7)).toBe(3)
    })

    it('should enforce minimum speed of 1 for non-zero base speed', () => {
      const combatant = makeCombatant({ statusConditions: ['Slowed'] })
      // floor(1 / 2) = 0, but min floor raises to 1
      expect(applyMovementModifiers(combatant, 1)).toBe(1)
    })

    it('should return 0 for base speed 0 when Slowed', () => {
      const combatant = makeCombatant({ statusConditions: ['Slowed'] })
      expect(applyMovementModifiers(combatant, 0)).toBe(0)
    })
  })

  describe('Speed Combat Stage modifier', () => {
    it('should add +3 for Speed CS +6 (additive: floor(6/2))', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: 6 } })
      // 5 + 3 = 8
      expect(applyMovementModifiers(combatant, 5)).toBe(8)
    })

    it('should add +2 for Speed CS +4', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: 4 } })
      // 5 + 2 = 7
      expect(applyMovementModifiers(combatant, 5)).toBe(7)
    })

    it('should add +1 for Speed CS +2', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: 2 } })
      // 5 + 1 = 6
      expect(applyMovementModifiers(combatant, 5)).toBe(6)
    })

    it('should add 0 for Speed CS +1 (symmetric: trunc(1/2) = 0)', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: 1 } })
      // 5 + 0 = 5
      expect(applyMovementModifiers(combatant, 5)).toBe(5)
    })

    it('should subtract -3 for Speed CS -6 with minimum floor of 2', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: -6 } })
      // 5 + (-3) = 2, min floor 2 = 2
      expect(applyMovementModifiers(combatant, 5)).toBe(2)
    })

    it('should apply floor of 2 when negative CS would reduce below 2', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: -6 } })
      // 3 + (-3) = 0, but min floor applies = 2
      expect(applyMovementModifiers(combatant, 3)).toBe(2)
    })

    it('should subtract 0 for Speed CS -1 (symmetric with +1: trunc(-1/2) = 0)', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: -1 } })
      // 5 + 0 = 5 (symmetric with CS +1)
      expect(applyMovementModifiers(combatant, 5)).toBe(5)
    })

    it('should be symmetric: CS +1 and CS -1 produce equal magnitude bonus/penalty', () => {
      const combatantPos = makeCombatant({ stageModifiers: { speed: 1 } })
      const combatantNeg = makeCombatant({ stageModifiers: { speed: -1 } })
      const base = 5
      const posResult = applyMovementModifiers(combatantPos, base)
      const negResult = applyMovementModifiers(combatantNeg, base)
      // Both should give +0/-0 from base
      expect(posResult - base).toBe(0)
      expect(base - negResult).toBe(0)
    })

    it('should be symmetric: CS +3 and CS -3 produce equal magnitude', () => {
      const combatantPos = makeCombatant({ stageModifiers: { speed: 3 } })
      const combatantNeg = makeCombatant({ stageModifiers: { speed: -3 } })
      const base = 10
      const posBonus = applyMovementModifiers(combatantPos, base) - base  // +1
      const negPenalty = base - applyMovementModifiers(combatantNeg, base) // +1
      expect(posBonus).toBe(negPenalty)
    })

    it('should be symmetric: CS +5 and CS -5 produce equal magnitude', () => {
      const combatantPos = makeCombatant({ stageModifiers: { speed: 5 } })
      const combatantNeg = makeCombatant({ stageModifiers: { speed: -5 } })
      const base = 10
      const posBonus = applyMovementModifiers(combatantPos, base) - base  // +2
      const negPenalty = base - applyMovementModifiers(combatantNeg, base) // +2
      expect(posBonus).toBe(negPenalty)
    })

    it('should clamp stages beyond +6 to +6', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: 10 } })
      // clamped to +6, floor(6/2) = 3, so 5 + 3 = 8
      expect(applyMovementModifiers(combatant, 5)).toBe(8)
    })

    it('should clamp stages beyond -6 to -6', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: -10 } })
      // clamped to -6, trunc(-6/2) = -3, 5 + (-3) = 2, min floor 2 = 2
      expect(applyMovementModifiers(combatant, 5)).toBe(2)
    })
  })

  describe('Sprint', () => {
    it('should add +50% movement speed', () => {
      const combatant = makeCombatant({ tempConditions: ['Sprint'] })
      // floor(5 * 1.5) = 7
      expect(applyMovementModifiers(combatant, 5)).toBe(7)
    })

    it('should floor the result for odd-multiple speeds', () => {
      const combatant = makeCombatant({ tempConditions: ['Sprint'] })
      // floor(3 * 1.5) = floor(4.5) = 4
      expect(applyMovementModifiers(combatant, 3)).toBe(4)
    })

    it('should apply to a speed of 1', () => {
      const combatant = makeCombatant({ tempConditions: ['Sprint'] })
      // floor(1 * 1.5) = 1
      expect(applyMovementModifiers(combatant, 1)).toBe(1)
    })
  })

  describe('condition interactions', () => {
    it('Slowed + Speed CS positive: halve first, then add bonus', () => {
      const combatant = makeCombatant({
        statusConditions: ['Slowed'],
        stageModifiers: { speed: 6 }
      })
      // Slowed: floor(5/2) = 2, then CS +6: 2 + 3 = 5
      expect(applyMovementModifiers(combatant, 5)).toBe(5)
    })

    it('Slowed + Speed CS negative: halve first, then penalty with floor of 2', () => {
      const combatant = makeCombatant({
        statusConditions: ['Slowed'],
        stageModifiers: { speed: -6 }
      })
      // Slowed: floor(5/2) = 2, then CS -6: 2 + (-3) = -1, min floor 2
      expect(applyMovementModifiers(combatant, 5)).toBe(2)
    })

    it('Slowed + Sprint: halve first, then +50%', () => {
      const combatant = makeCombatant({
        statusConditions: ['Slowed'],
        tempConditions: ['Sprint']
      })
      // Slowed: floor(6/2) = 3, Sprint: floor(3 * 1.5) = 4
      expect(applyMovementModifiers(combatant, 6)).toBe(4)
    })

    it('Slowed + Speed CS + Sprint: all three in order', () => {
      const combatant = makeCombatant({
        statusConditions: ['Slowed'],
        stageModifiers: { speed: 4 },
        tempConditions: ['Sprint']
      })
      // Slowed: floor(8/2) = 4, CS +4: 4 + 2 = 6, Sprint: floor(6 * 1.5) = 9
      expect(applyMovementModifiers(combatant, 8)).toBe(9)
    })

    it('Stuck + Slowed: Stuck wins (returns 0 immediately)', () => {
      const combatant = makeCombatant({
        statusConditions: ['Stuck', 'Slowed']
      })
      expect(applyMovementModifiers(combatant, 5)).toBe(0)
    })

    it('Speed CS with no conditions on high-speed combatant', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: 6 } })
      // 10 + 3 = 13
      expect(applyMovementModifiers(combatant, 10)).toBe(13)
    })

    it('Speed CS negative with high base speed stays above floor', () => {
      const combatant = makeCombatant({ stageModifiers: { speed: -6 } })
      // 10 + (-3) = 7, above floor of 2
      expect(applyMovementModifiers(combatant, 10)).toBe(7)
    })
  })

  describe('minimum speed floor', () => {
    it('should enforce minimum of 1 when base speed > 0', () => {
      // Even with negative CS reducing speed, the final min floor ensures at least 1
      // (but CS min floor of 2 kicks in first for negative CS)
      const combatant = makeCombatant({ statusConditions: ['Slowed'] })
      // floor(1 / 2) = 0, min floor for speed > 0 = 1
      expect(applyMovementModifiers(combatant, 1)).toBe(1)
    })

    it('should NOT apply minimum to base speed of 0', () => {
      const combatant = makeCombatant({ statusConditions: ['Slowed'] })
      expect(applyMovementModifiers(combatant, 0)).toBe(0)
    })
  })
})
