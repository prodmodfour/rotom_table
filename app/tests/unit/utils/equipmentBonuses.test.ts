import { describe, it, expect } from 'vitest'
import type { EquipmentSlots, EquippedItem } from '~/types/character'
import { getEquipmentGrantedCapabilities } from '~/utils/equipmentBonuses'

/**
 * Unit tests for getEquipmentGrantedCapabilities.
 *
 * PTU Reference: 09-gear-and-items.md p.293 (Snow Boots, Jungle Boots).
 * Equipment can grant capabilities via the grantedCapabilities field.
 * This function collects and deduplicates all capabilities from all equipped items.
 */

describe('getEquipmentGrantedCapabilities', () => {
  it('should return empty array for empty equipment object', () => {
    const equipment: EquipmentSlots = {}
    expect(getEquipmentGrantedCapabilities(equipment)).toEqual([])
  })

  it('should return empty array when all slots are undefined', () => {
    const equipment: EquipmentSlots = {
      head: undefined,
      body: undefined,
      mainHand: undefined,
      offHand: undefined,
      feet: undefined,
      accessory: undefined,
    }
    expect(getEquipmentGrantedCapabilities(equipment)).toEqual([])
  })

  it('should return empty array for equipped items without grantedCapabilities', () => {
    const equipment: EquipmentSlots = {
      body: {
        name: 'Light Armor',
        slot: 'body',
        damageReduction: 5,
      },
      offHand: {
        name: 'Light Shield',
        slot: 'offHand',
        evasionBonus: 2,
      },
    }
    expect(getEquipmentGrantedCapabilities(equipment)).toEqual([])
  })

  it('should return capabilities from a single item with grantedCapabilities', () => {
    const equipment: EquipmentSlots = {
      feet: {
        name: 'Snow Boots',
        slot: 'feet',
        grantedCapabilities: ['Naturewalk (Tundra)'],
      },
    }
    const result = getEquipmentGrantedCapabilities(equipment)
    expect(result).toEqual(['Naturewalk (Tundra)'])
  })

  it('should return capabilities from multiple items in different slots', () => {
    const equipment: EquipmentSlots = {
      feet: {
        name: 'Jungle Boots',
        slot: 'feet',
        grantedCapabilities: ['Naturewalk (Forest)'],
      },
      head: {
        name: 'Custom Goggles',
        slot: 'head',
        grantedCapabilities: ['Darkvision'],
      },
    }
    const result = getEquipmentGrantedCapabilities(equipment)
    expect(result).toContain('Naturewalk (Forest)')
    expect(result).toContain('Darkvision')
    expect(result).toHaveLength(2)
  })

  it('should return multiple capabilities from a single item', () => {
    const equipment: EquipmentSlots = {
      feet: {
        name: 'Multi-Terrain Boots',
        slot: 'feet',
        grantedCapabilities: ['Naturewalk (Tundra)', 'Naturewalk (Forest)'],
      },
    }
    const result = getEquipmentGrantedCapabilities(equipment)
    expect(result).toContain('Naturewalk (Tundra)')
    expect(result).toContain('Naturewalk (Forest)')
    expect(result).toHaveLength(2)
  })

  it('should deduplicate capabilities across multiple items', () => {
    const equipment: EquipmentSlots = {
      feet: {
        name: 'Snow Boots',
        slot: 'feet',
        grantedCapabilities: ['Naturewalk (Tundra)'],
      },
      accessory: {
        name: 'Tundra Charm',
        slot: 'accessory',
        grantedCapabilities: ['Naturewalk (Tundra)'],
      },
    }
    const result = getEquipmentGrantedCapabilities(equipment)
    expect(result).toEqual(['Naturewalk (Tundra)'])
  })

  it('should deduplicate capabilities within a single item', () => {
    const equipment: EquipmentSlots = {
      feet: {
        name: 'Buggy Boots',
        slot: 'feet',
        grantedCapabilities: ['Naturewalk (Forest)', 'Naturewalk (Forest)'],
      },
    }
    const result = getEquipmentGrantedCapabilities(equipment)
    expect(result).toEqual(['Naturewalk (Forest)'])
  })

  it('should collect capabilities from items with mixed fields', () => {
    const equipment: EquipmentSlots = {
      body: {
        name: 'Heavy Armor',
        slot: 'body',
        damageReduction: 10,
        speedDefaultCS: -1,
        // no grantedCapabilities
      },
      feet: {
        name: 'Snow Boots',
        slot: 'feet',
        grantedCapabilities: ['Naturewalk (Tundra)'],
      },
      accessory: {
        name: 'Focus (Attack)',
        slot: 'accessory',
        statBonus: { stat: 'attack', value: 5 },
        // no grantedCapabilities
      },
    }
    const result = getEquipmentGrantedCapabilities(equipment)
    expect(result).toEqual(['Naturewalk (Tundra)'])
  })

  it('should handle items with empty grantedCapabilities array', () => {
    const equipment: EquipmentSlots = {
      feet: {
        name: 'Plain Boots',
        slot: 'feet',
        grantedCapabilities: [],
      },
    }
    expect(getEquipmentGrantedCapabilities(equipment)).toEqual([])
  })

  it('should handle non-Naturewalk capabilities', () => {
    const equipment: EquipmentSlots = {
      head: {
        name: 'Night Goggles',
        slot: 'head',
        grantedCapabilities: ['Darkvision'],
      },
      feet: {
        name: 'Jungle Boots',
        slot: 'feet',
        grantedCapabilities: ['Naturewalk (Forest)'],
      },
    }
    const result = getEquipmentGrantedCapabilities(equipment)
    expect(result).toContain('Darkvision')
    expect(result).toContain('Naturewalk (Forest)')
    expect(result).toHaveLength(2)
  })

  it('should iterate slots in deterministic order (FOCUS_SLOT_PRIORITY)', () => {
    // The function iterates: accessory, head, mainHand, offHand, feet, body
    // The order of output items should be stable
    const equipment: EquipmentSlots = {
      feet: {
        name: 'Jungle Boots',
        slot: 'feet',
        grantedCapabilities: ['Naturewalk (Forest)'],
      },
      accessory: {
        name: 'Tundra Charm',
        slot: 'accessory',
        grantedCapabilities: ['Naturewalk (Tundra)'],
      },
    }
    const result = getEquipmentGrantedCapabilities(equipment)
    // Accessory is processed before feet in FOCUS_SLOT_PRIORITY
    expect(result[0]).toBe('Naturewalk (Tundra)')
    expect(result[1]).toBe('Naturewalk (Forest)')
  })
})
