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
import type { LivingWeaponConfig } from '~/constants/livingWeapon'

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

// ============================================
// LIVING WEAPON EQUIPMENT OVERLAY (feature-005 P1)
// ============================================

/**
 * Compute the effective equipment slots for a trainer who is wielding a Living Weapon.
 * The Living Weapon occupies Main Hand (and Off-Hand for Doublade/Aegislash),
 * REPLACING any existing equipment in those slots.
 *
 * PTU pp.305-306: Living Weapon counts as equipment in the occupied slots.
 *
 * Returns a new EquipmentSlots object (immutable -- does not modify input).
 */
export function computeEffectiveEquipment(
  baseEquipment: EquipmentSlots,
  livingWeaponConfig: LivingWeaponConfig,
  isFainted: boolean
): EquipmentSlots {
  const effective = { ...baseEquipment }

  // Living Weapon always occupies Main Hand
  effective.mainHand = buildLivingWeaponEquippedItem(livingWeaponConfig, 'mainHand', isFainted)

  // Doublade and Aegislash also occupy Off-Hand
  if (livingWeaponConfig.occupiedSlots.includes('offHand')) {
    if (livingWeaponConfig.grantsShield) {
      // Aegislash: Off-Hand is a Light Shield
      effective.offHand = buildLivingWeaponShield(livingWeaponConfig, isFainted)
    } else {
      // Doublade: Off-Hand is the second weapon
      effective.offHand = buildLivingWeaponEquippedItem(livingWeaponConfig, 'offHand', isFainted)
    }
  }

  return effective
}

/**
 * Build an EquippedItem representing a Living Weapon in a hand slot.
 *
 * Doublade dual-wield bonus: +2 evasion applied on mainHand item only
 * to avoid double-counting (only mainHand carries the bonus).
 *
 * PTU p.305: Fainted Living Weapons take -2 penalty to all bonuses.
 */
function buildLivingWeaponEquippedItem(
  config: LivingWeaponConfig,
  slot: EquipmentSlot,
  isFainted: boolean
): EquippedItem {
  const baseDualWieldBonus = slot === 'mainHand' ? config.dualWieldEvasionBonus : 0
  // Fainted penalty: -2 to all bonuses from the Living Weapon
  const faintedPenalty = isFainted ? 2 : 0

  return {
    name: `Living Weapon: ${config.species}${isFainted ? ' (Fainted)' : ''}`,
    slot,
    description: config.equipmentDescription + (isFainted ? ' [Fainted: -2 penalty]' : ''),
    evasionBonus: Math.max(0, baseDualWieldBonus - faintedPenalty),
  }
}

/**
 * Build an EquippedItem representing Aegislash's Light Shield.
 * PTU p.294: Light Shield = +2 Evasion passively.
 * Readied: +4 Evasion, 10 DR, Slowed.
 *
 * PTU p.305: Fainted Living Weapons take -2 penalty. Cannot ready fainted shield.
 */
function buildLivingWeaponShield(
  config: LivingWeaponConfig,
  isFainted: boolean
): EquippedItem {
  const faintedPenalty = isFainted ? 2 : 0

  return {
    name: `Living Weapon Shield: ${config.species}${isFainted ? ' (Fainted)' : ''}`,
    slot: 'offHand',
    evasionBonus: Math.max(0, 2 - faintedPenalty), // Light Shield: +2, minus fainted penalty
    canReady: !isFainted, // Cannot ready a fainted Living Weapon shield
    readiedBonuses: !isFainted
      ? { evasionBonus: 4, damageReduction: 10, appliesSlowed: true }
      : undefined,
    description: 'Light Shield from Living Weapon (Aegislash)' +
      (isFainted ? ' [Fainted: -2 penalty]' : ''),
  }
}
