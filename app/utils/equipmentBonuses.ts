/**
 * Equipment Bonuses Utility
 *
 * Pure functions for computing aggregate combat bonuses from equipped items.
 * Zero DB access. This is the single source of truth for
 * "what do my equipped items give me?"
 *
 * PTU Reference: 09-gear-and-items.md (p.286-295)
 */

import type { EquipmentSlots, EquippedItem } from '~/types/character'

export interface EquipmentCombatBonuses {
  /** Total flat Damage Reduction from all equipped items */
  damageReduction: number
  /** Total evasion bonus from all equipped items (shields, etc.) */
  evasionBonus: number
  /** Stat bonuses applied after combat stages (Focus items) */
  statBonuses: Record<string, number>
  /** Speed default combat stage override (Heavy Armor = -1) */
  speedDefaultCS: number
  /** Conditional DR entries (e.g., Helmet: 15 DR vs crits) */
  conditionalDR: { amount: number; condition: string }[]
}

/**
 * Compute aggregate combat bonuses from all equipped items.
 * Pure function. No side effects.
 */
export function computeEquipmentBonuses(equipment: EquipmentSlots): EquipmentCombatBonuses {
  const items = Object.values(equipment).filter(Boolean) as EquippedItem[]

  let damageReduction = 0
  let evasionBonus = 0
  const statBonuses: Record<string, number> = {}
  let speedDefaultCS = 0
  const conditionalDR: { amount: number; condition: string }[] = []
  // PTU p.295: "a Trainer may only benefit from one Focus at a time,
  // regardless of the Equipment Slot." Only apply the first Focus found.
  let focusApplied = false

  for (const item of items) {
    if (item.damageReduction) {
      damageReduction += item.damageReduction
    }
    if (item.evasionBonus) {
      evasionBonus += item.evasionBonus
    }
    if (item.statBonus && !focusApplied) {
      const key = item.statBonus.stat
      statBonuses[key] = (statBonuses[key] ?? 0) + item.statBonus.value
      focusApplied = true
    }
    if (item.speedDefaultCS !== undefined) {
      speedDefaultCS = Math.min(speedDefaultCS, item.speedDefaultCS)
    }
    if (item.conditionalDR) {
      conditionalDR.push({ ...item.conditionalDR })
    }
  }

  return { damageReduction, evasionBonus, statBonuses, speedDefaultCS, conditionalDR }
}
