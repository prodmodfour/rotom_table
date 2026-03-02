/**
 * PTU 1.05 Healing Item Catalog
 * Standard healing items from 09-gear-and-items.md (p.276)
 *
 * Items are keyed by name. The catalog is read-only and shared
 * between client and server.
 *
 * P0: Only 'restorative' category items are processed.
 * P1: Adds 'cure', 'combined', 'revive' processing.
 */

import type { StatusCondition } from '~/types'

/**
 * Category of healing item.
 * - 'restorative': heals HP (Potion, Super Potion, etc.)
 * - 'cure': removes status conditions (Antidote, Burn Heal, etc.)
 * - 'combined': heals HP AND cures status (Full Restore)
 * - 'revive': restores from Fainted status
 */
export type HealingItemCategory = 'restorative' | 'cure' | 'combined' | 'revive'

/**
 * Definition for a single healing item from the PTU catalog.
 * Follows the same constant-catalog pattern as EQUIPMENT_CATALOG.
 */
export interface HealingItemDef {
  /** Display name (matches PTU book exactly) */
  readonly name: string
  /** Item category */
  readonly category: HealingItemCategory
  /** HP healed (undefined for pure cure items) */
  readonly hpAmount?: number
  /** Whether this heals to full HP (Max Potion behavior) */
  readonly healToFull?: boolean
  /** Whether this heals to a percentage of max HP */
  readonly healToPercent?: number
  /** Status conditions this item cures (undefined for pure restorative) */
  readonly curesConditions?: readonly StatusCondition[]
  /** Whether this cures ALL persistent status conditions */
  readonly curesAllPersistent?: boolean
  /** Whether this cures ALL status conditions (persistent + volatile) */
  readonly curesAllStatus?: boolean
  /** Whether this item can revive from Fainted */
  readonly canRevive?: boolean
  /** Whether this item is repulsive (may lower Pokemon loyalty) */
  readonly repulsive?: boolean
  /** Cost in PokeDollars */
  readonly cost: number
  /** PTU rulebook description */
  readonly description: string
}

export const HEALING_ITEM_CATALOG: Record<string, HealingItemDef> = {
  // === Basic Restoratives (HP healing) ===
  'Potion': {
    name: 'Potion',
    category: 'restorative',
    hpAmount: 20,
    cost: 200,
    description: 'Heals 20 Hit Points.',
  },
  'Super Potion': {
    name: 'Super Potion',
    category: 'restorative',
    hpAmount: 35,
    cost: 380,
    description: 'Heals 35 Hit Points.',
  },
  'Hyper Potion': {
    name: 'Hyper Potion',
    category: 'restorative',
    hpAmount: 70,
    cost: 800,
    description: 'Heals 70 Hit Points.',
  },

  // === Status Cure Items (P1) ===
  'Antidote': {
    name: 'Antidote',
    category: 'cure',
    curesConditions: ['Poisoned', 'Badly Poisoned'] as const,
    cost: 200,
    description: 'Cures Poison.',
  },
  'Paralyze Heal': {
    name: 'Paralyze Heal',
    category: 'cure',
    curesConditions: ['Paralyzed'] as const,
    cost: 200,
    description: 'Cures Paralysis.',
  },
  'Burn Heal': {
    name: 'Burn Heal',
    category: 'cure',
    curesConditions: ['Burned'] as const,
    cost: 200,
    description: 'Cures Burns.',
  },
  'Ice Heal': {
    name: 'Ice Heal',
    category: 'cure',
    curesConditions: ['Frozen'] as const,
    cost: 200,
    description: 'Cures Freezing.',
  },
  'Awakening': {
    name: 'Awakening',
    category: 'cure',
    curesConditions: ['Asleep', 'Bad Sleep'] as const,
    cost: 200,
    description: 'Cures Sleep.',
  },
  'Full Heal': {
    name: 'Full Heal',
    category: 'cure',
    curesAllPersistent: true,
    cost: 450,
    description: 'Cures all Persistent Status Afflictions.',
  },

  // === Combined Items (P1) ===
  'Full Restore': {
    name: 'Full Restore',
    category: 'combined',
    hpAmount: 80,
    curesAllStatus: true,
    cost: 1450,
    description: 'Heals 80 Hit Points and cures any Status Afflictions.',
  },

  // === Revive Items (P1) ===
  'Revive': {
    name: 'Revive',
    category: 'revive',
    hpAmount: 20,
    canRevive: true,
    cost: 300,
    description: 'Revives fainted Pokemon and sets to 20 Hit Points.',
  },

  // === Repulsive Variants (P1) ===
  'Energy Powder': {
    name: 'Energy Powder',
    category: 'restorative',
    hpAmount: 25,
    repulsive: true,
    cost: 150,
    description: 'Heals 25 Hit Points. Repulsive.',
  },
  'Energy Root': {
    name: 'Energy Root',
    category: 'restorative',
    hpAmount: 70,
    repulsive: true,
    cost: 500,
    description: 'Heals 70 Hit Points. Repulsive.',
  },
  'Heal Powder': {
    name: 'Heal Powder',
    category: 'cure',
    curesAllPersistent: true,
    repulsive: true,
    cost: 350,
    description: 'Cures all Persistent Status Afflictions. Repulsive.',
  },
  'Revival Herb': {
    name: 'Revival Herb',
    category: 'revive',
    healToPercent: 50,
    canRevive: true,
    repulsive: true,
    cost: 350,
    description: 'Revives fainted Pokemon and sets to 50% Hit Points. Repulsive.',
  },
} as const

/**
 * Get all restorative items (HP healing only, no status cure).
 * Used by P0 for filtering the item list to HP-only items.
 */
export function getRestorativeItems(): HealingItemDef[] {
  return Object.values(HEALING_ITEM_CATALOG).filter(
    item => item.category === 'restorative'
  )
}

/**
 * Get all cure items (status removal only).
 */
export function getCureItems(): HealingItemDef[] {
  return Object.values(HEALING_ITEM_CATALOG).filter(
    item => item.category === 'cure'
  )
}

/** Item category labels for UI display */
export const ITEM_CATEGORY_LABELS: Record<HealingItemCategory, string> = {
  restorative: 'Restorative',
  cure: 'Status Cure',
  combined: 'Full Restore',
  revive: 'Revive',
}

// ============================================
// CURE RESOLUTION (shared between client + server)
// ============================================

/**
 * Resolve which conditions an item cures on a specific target.
 * Returns the list of StatusCondition values to remove.
 *
 * This is a pure function with no server dependencies, safe to use
 * in both client composables and server services.
 *
 * Priority order:
 * 1. curesAllStatus — clears all conditions except Fainted and Dead
 * 2. curesAllPersistent — clears all persistent conditions
 * 3. curesConditions — clears specific named conditions
 */
export function resolveConditionsToCure(
  item: HealingItemDef,
  targetConditions: StatusCondition[]
): StatusCondition[] {
  if (!targetConditions || targetConditions.length === 0) return []

  // Import-free persistent condition list (avoids circular dependency with statusConditions.ts)
  const PERSISTENT: readonly string[] = ['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']

  // curesAllStatus: clear all persistent + volatile (but not Fainted/Dead)
  if (item.curesAllStatus) {
    return targetConditions.filter(c => c !== 'Fainted' && c !== 'Dead')
  }

  // curesAllPersistent: clear all persistent conditions
  if (item.curesAllPersistent) {
    const persistentSet = new Set<string>(PERSISTENT)
    return targetConditions.filter(c => persistentSet.has(c))
  }

  // curesConditions: clear specific named conditions
  if (item.curesConditions && item.curesConditions.length > 0) {
    const cureSet = new Set<string>(item.curesConditions)
    return targetConditions.filter(c => cureSet.has(c))
  }

  return []
}
