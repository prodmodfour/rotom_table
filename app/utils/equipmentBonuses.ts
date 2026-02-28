/**
 * Equipment Bonuses Utility
 *
 * Pure functions for computing aggregate combat bonuses from equipped items.
 * Zero DB access. This is the single source of truth for
 * "what do my equipped items give me?"
 *
 * PTU Reference: 09-gear-and-items.md (p.286-295)
 */

import type { EquipmentSlots, EquipmentSlot, EquippedItem } from '~/types/character'

/**
 * Explicit slot priority for Focus item selection.
 * When a character has Focus items in multiple slots,
 * the one in the highest-priority slot wins.
 * PTU p.295: "a Trainer may only benefit from one Focus at a time."
 */
const FOCUS_SLOT_PRIORITY: readonly EquipmentSlot[] = [
  'accessory',
  'head',
  'mainHand',
  'offHand',
  'feet',
  'body',
] as const

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
  // Iterate slots in deterministic priority order for Focus selection.
  // Non-Focus bonuses (DR, evasion, speed CS, conditional DR) accumulate from all slots.
  const items = FOCUS_SLOT_PRIORITY
    .map(slot => equipment[slot])
    .filter(Boolean) as EquippedItem[]

  let damageReduction = 0
  let evasionBonus = 0
  const statBonuses: Record<string, number> = {}
  let speedDefaultCS = 0
  const conditionalDR: { amount: number; condition: string }[] = []
  // PTU p.295: "a Trainer may only benefit from one Focus at a time,
  // regardless of the Equipment Slot." The first Focus found in
  // FOCUS_SLOT_PRIORITY order wins (accessory > head > mainHand > ...).
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

/**
 * Collect all capabilities granted by equipped items.
 *
 * Equipment can grant capabilities via the `grantedCapabilities` field
 * (e.g., Snow Boots → "Naturewalk (Tundra)", Jungle Boots → "Naturewalk (Forest)").
 * PTU Reference: 09-gear-and-items.md p.293.
 *
 * Returns deduplicated array of capability strings.
 * Pure function. No side effects.
 */
export function getEquipmentGrantedCapabilities(equipment: EquipmentSlots): string[] {
  const capabilities = new Set<string>()

  for (const slot of FOCUS_SLOT_PRIORITY) {
    const item = equipment[slot]
    if (!item?.grantedCapabilities) continue

    for (const cap of item.grantedCapabilities) {
      capabilities.add(cap)
    }
  }

  return Array.from(capabilities)
}
