import { describe, it, expect } from 'vitest'
import {
  categorizeAbilities,
  getAbilityPool
} from '~/utils/abilityAssignment'
import type { CategorizedAbility } from '~/utils/abilityAssignment'

// ============================================
// categorizeAbilities
// ============================================

describe('categorizeAbilities', () => {
  it('classifies all abilities as Basic when numBasicAbilities equals array length', () => {
    // Species with only Basic abilities (e.g., 2 Basic, 0 Advanced, 0 High)
    const result = categorizeAbilities(['Overgrow', 'Chlorophyll'], 2)

    expect(result).toEqual([
      { name: 'Overgrow', category: 'Basic' },
      { name: 'Chlorophyll', category: 'Basic' }
    ])
  })

  it('classifies single Basic ability correctly', () => {
    const result = categorizeAbilities(['Blaze'], 1)

    expect(result).toEqual([
      { name: 'Blaze', category: 'Basic' }
    ])
  })

  it('classifies Basic + Advanced correctly when no High ability exists', () => {
    // Species with 1 Basic + 1 Advanced, no High
    // This was the C1 bug: the Advanced ability was misclassified as High
    const result = categorizeAbilities(['Overgrow', 'Chlorophyll'], 1)

    expect(result).toEqual([
      { name: 'Overgrow', category: 'Basic' },
      { name: 'Chlorophyll', category: 'Advanced' }
    ])
  })

  it('classifies 2 Basic + 1 Advanced correctly when no High ability exists', () => {
    // numBasicAbilities=2, length=3 => length == numBasicAbilities+1 => no High
    const result = categorizeAbilities(['Intimidate', 'Shed Skin', 'Moxie'], 2)

    expect(result).toEqual([
      { name: 'Intimidate', category: 'Basic' },
      { name: 'Shed Skin', category: 'Basic' },
      { name: 'Moxie', category: 'Advanced' }
    ])
  })

  it('classifies Basic + Advanced + High correctly', () => {
    // Standard species: 2 Basic + 1 Advanced + 1 High
    const result = categorizeAbilities(
      ['Overgrow', 'Chlorophyll', 'Leaf Guard', 'Harvest'],
      2
    )

    expect(result).toEqual([
      { name: 'Overgrow', category: 'Basic' },
      { name: 'Chlorophyll', category: 'Basic' },
      { name: 'Leaf Guard', category: 'Advanced' },
      { name: 'Harvest', category: 'High' }
    ])
  })

  it('classifies 1 Basic + multiple Advanced + 1 High correctly', () => {
    // 1 Basic + 2 Advanced + 1 High
    const result = categorizeAbilities(
      ['Blaze', 'Flash Fire', 'Flame Body', 'Magma Armor'],
      1
    )

    expect(result).toEqual([
      { name: 'Blaze', category: 'Basic' },
      { name: 'Flash Fire', category: 'Advanced' },
      { name: 'Flame Body', category: 'Advanced' },
      { name: 'Magma Armor', category: 'High' }
    ])
  })

  it('classifies 3 Basic + 2 Advanced + 1 High correctly', () => {
    const result = categorizeAbilities(
      ['A', 'B', 'C', 'D', 'E', 'F'],
      3
    )

    expect(result).toEqual([
      { name: 'A', category: 'Basic' },
      { name: 'B', category: 'Basic' },
      { name: 'C', category: 'Basic' },
      { name: 'D', category: 'Advanced' },
      { name: 'E', category: 'Advanced' },
      { name: 'F', category: 'High' }
    ])
  })

  it('handles empty ability list', () => {
    const result = categorizeAbilities([], 0)
    expect(result).toEqual([])
  })

  it('handles edge case: 0 Basic abilities with Advanced and High', () => {
    // Unusual but valid: numBasicAbilities=0, 2 entries => 1 Advanced + 1 High
    const result = categorizeAbilities(['Swift Swim', 'Rain Dish'], 0)

    expect(result).toEqual([
      { name: 'Swift Swim', category: 'Advanced' },
      { name: 'Rain Dish', category: 'High' }
    ])
  })

  it('handles edge case: 0 Basic abilities with only 1 ability', () => {
    // numBasicAbilities=0, length=1 => length == numBasicAbilities+1 => no High, all Advanced
    const result = categorizeAbilities(['Levitate'], 0)

    expect(result).toEqual([
      { name: 'Levitate', category: 'Advanced' }
    ])
  })
})

// ============================================
// getAbilityPool
// ============================================

describe('getAbilityPool', () => {
  describe('second ability milestone (Level 20)', () => {
    it('returns Basic + Advanced abilities excluding already held', () => {
      const result = getAbilityPool({
        speciesAbilities: ['Overgrow', 'Chlorophyll', 'Leaf Guard', 'Harvest'],
        numBasicAbilities: 2,
        currentAbilities: ['Overgrow'],
        milestone: 'second'
      })

      const availableNames = result.available.map(a => a.name)
      expect(availableNames).toContain('Chlorophyll')
      expect(availableNames).toContain('Leaf Guard')
      expect(availableNames).not.toContain('Overgrow') // already held
      expect(availableNames).not.toContain('Harvest')   // High ability excluded at Lv20
    })

    it('excludes High abilities from the pool', () => {
      const result = getAbilityPool({
        speciesAbilities: ['Blaze', 'Flash Fire', 'Magma Armor'],
        numBasicAbilities: 1,
        currentAbilities: ['Blaze'],
        milestone: 'second'
      })

      const categories = result.available.map(a => a.category)
      expect(categories).not.toContain('High')
      expect(result.available).toHaveLength(1)
      expect(result.available[0]).toEqual({ name: 'Flash Fire', category: 'Advanced' })
    })

    it('correctly identifies already-held abilities', () => {
      const result = getAbilityPool({
        speciesAbilities: ['Overgrow', 'Chlorophyll', 'Leaf Guard', 'Harvest'],
        numBasicAbilities: 2,
        currentAbilities: ['Overgrow'],
        milestone: 'second'
      })

      expect(result.alreadyHas).toContain('Overgrow')
      expect(result.alreadyHas).toHaveLength(1)
    })

    it('returns empty available when all eligible abilities are held', () => {
      const result = getAbilityPool({
        speciesAbilities: ['Overgrow', 'Chlorophyll'],
        numBasicAbilities: 2,
        currentAbilities: ['Overgrow', 'Chlorophyll'],
        milestone: 'second'
      })

      expect(result.available).toHaveLength(0)
    })

    it('works with species that have no High ability', () => {
      // C1 regression test: species with exactly numBasicAbilities + 1 entries
      const result = getAbilityPool({
        speciesAbilities: ['Intimidate', 'Shed Skin', 'Moxie'],
        numBasicAbilities: 2,
        currentAbilities: ['Intimidate'],
        milestone: 'second'
      })

      const availableNames = result.available.map(a => a.name)
      expect(availableNames).toContain('Shed Skin')
      expect(availableNames).toContain('Moxie')
      // Moxie should be Advanced, NOT High
      const moxie = result.available.find(a => a.name === 'Moxie')
      expect(moxie?.category).toBe('Advanced')
    })
  })

  describe('third ability milestone (Level 40)', () => {
    it('returns all categories including High', () => {
      const result = getAbilityPool({
        speciesAbilities: ['Overgrow', 'Chlorophyll', 'Leaf Guard', 'Harvest'],
        numBasicAbilities: 2,
        currentAbilities: ['Overgrow', 'Leaf Guard'],
        milestone: 'third'
      })

      const availableNames = result.available.map(a => a.name)
      expect(availableNames).toContain('Chlorophyll')
      expect(availableNames).toContain('Harvest') // High now included
      expect(availableNames).not.toContain('Overgrow')   // held
      expect(availableNames).not.toContain('Leaf Guard')  // held
    })

    it('includes High ability in the pool', () => {
      const result = getAbilityPool({
        speciesAbilities: ['Blaze', 'Flash Fire', 'Magma Armor'],
        numBasicAbilities: 1,
        currentAbilities: ['Blaze', 'Flash Fire'],
        milestone: 'third'
      })

      expect(result.available).toHaveLength(1)
      expect(result.available[0]).toEqual({ name: 'Magma Armor', category: 'High' })
    })

    it('still excludes already-held abilities', () => {
      const result = getAbilityPool({
        speciesAbilities: ['A', 'B', 'C', 'D'],
        numBasicAbilities: 2,
        currentAbilities: ['A', 'C'],
        milestone: 'third'
      })

      const availableNames = result.available.map(a => a.name)
      expect(availableNames).toEqual(['B', 'D'])
    })
  })

  describe('edge cases', () => {
    it('returns empty pool when species has no abilities', () => {
      const result = getAbilityPool({
        speciesAbilities: [],
        numBasicAbilities: 0,
        currentAbilities: [],
        milestone: 'second'
      })

      expect(result.available).toHaveLength(0)
      expect(result.alreadyHas).toHaveLength(0)
    })

    it('handles current abilities that are not in the species list', () => {
      // Pokemon could have an ability from a previous form
      const result = getAbilityPool({
        speciesAbilities: ['Overgrow', 'Chlorophyll'],
        numBasicAbilities: 2,
        currentAbilities: ['Run Away'],
        milestone: 'second'
      })

      // Run Away is not in the species list, so not in alreadyHas
      expect(result.alreadyHas).toHaveLength(0)
      expect(result.available).toHaveLength(2)
    })

    it('preserves category information in available abilities', () => {
      const result = getAbilityPool({
        speciesAbilities: ['Overgrow', 'Chlorophyll', 'Leaf Guard', 'Harvest'],
        numBasicAbilities: 2,
        currentAbilities: [],
        milestone: 'third'
      })

      const byCategory = (cat: string) =>
        result.available.filter(a => a.category === cat).map(a => a.name)

      expect(byCategory('Basic')).toEqual(['Overgrow', 'Chlorophyll'])
      expect(byCategory('Advanced')).toEqual(['Leaf Guard'])
      expect(byCategory('High')).toEqual(['Harvest'])
    })
  })
})
