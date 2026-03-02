/**
 * Healing Item Service
 * Encapsulates all healing item logic: validation and application.
 *
 * P0: HP restoration only (restorative category).
 * P1: Status cure, revive, combined, repulsive handling.
 * P2: Action economy, inventory consumption.
 */

import { HEALING_ITEM_CATALOG, type HealingItemDef } from '~/constants/healingItems'
import { applyHealingToEntity } from '~/server/services/combatant.service'
import { getEffectiveMaxHp } from '~/utils/restHealing'
import type { Combatant, StatusCondition, Pokemon, HumanCharacter } from '~/types'

export interface ItemApplicationResult {
  success: boolean
  itemName: string
  effects: {
    hpHealed?: number
    conditionsCured?: StatusCondition[]
    revived?: boolean
    repulsive?: boolean
  }
  error?: string
}

/**
 * Validate that an item can be applied to a target combatant.
 * Returns an error message if invalid, undefined if valid.
 */
export function validateItemApplication(
  itemName: string,
  target: Combatant
): string | undefined {
  const item = HEALING_ITEM_CATALOG[itemName]
  if (!item) {
    return `Unknown item: ${itemName}`
  }

  const entity = target.entity
  const isFainted = (entity.statusConditions || []).includes('Fainted')

  // Revive items: target must be Fainted
  if (item.canRevive && !isFainted) {
    return `${item.name} can only be used on fainted targets`
  }

  // Non-revive items: target must NOT be Fainted (except Full Restore cures all status)
  if (!item.canRevive && isFainted && !item.curesAllStatus) {
    return `Cannot use ${item.name} on a fainted target`
  }

  // HP items: check if target is already at effective max HP
  if (item.hpAmount || item.healToFull || item.healToPercent) {
    if (!isFainted && !item.canRevive) {
      const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
      if (entity.currentHp >= effectiveMax) {
        return `${getEntityDisplayName(target)} is already at full HP`
      }
    }
  }

  // Cure items: check if target has any curable condition (P1 -- skip in P0)
  // This validation is intentionally lenient in P0; P1 adds stricter checks.

  return undefined
}

/**
 * Apply a healing item's effects to a target combatant.
 *
 * P0: Only processes HP restoration (restorative category).
 * P1: Adds status cure, revive, combined, repulsive handling.
 * P2: Adds action economy, inventory consumption.
 *
 * Mutates the combatant's entity (same pattern as applyDamageToEntity).
 * The caller is responsible for persisting the state.
 */
export function applyHealingItem(
  itemName: string,
  target: Combatant
): ItemApplicationResult {
  const item = HEALING_ITEM_CATALOG[itemName]
  if (!item) {
    return { success: false, itemName, effects: {}, error: `Unknown item: ${itemName}` }
  }

  const validationError = validateItemApplication(itemName, target)
  if (validationError) {
    return { success: false, itemName, effects: {}, error: validationError }
  }

  const effects: ItemApplicationResult['effects'] = {}

  // --- HP Restoration ---
  if (item.hpAmount) {
    const healResult = applyHealingToEntity(target, { amount: item.hpAmount })
    effects.hpHealed = healResult.hpHealed
  }

  if (item.healToFull) {
    const effectiveMax = getEffectiveMaxHp(target.entity.maxHp, target.entity.injuries || 0)
    const amount = Math.max(0, effectiveMax - target.entity.currentHp)
    if (amount > 0) {
      const healResult = applyHealingToEntity(target, { amount })
      effects.hpHealed = healResult.hpHealed
    }
  }

  if (item.healToPercent) {
    const effectiveMax = getEffectiveMaxHp(target.entity.maxHp, target.entity.injuries || 0)
    const targetHp = Math.floor(effectiveMax * item.healToPercent / 100)
    const amount = Math.max(0, targetHp - target.entity.currentHp)
    if (amount > 0) {
      const healResult = applyHealingToEntity(target, { amount })
      effects.hpHealed = healResult.hpHealed
    }
  }

  // --- Repulsive flag (for UI display, no mechanical effect in P0-P1) ---
  if (item.repulsive) {
    effects.repulsive = true
  }

  return {
    success: true,
    itemName,
    effects
  }
}

/**
 * Get the display name for a Pokemon entity.
 */
function getPokemonDisplayName(pokemon: Pokemon): string {
  return pokemon.nickname || pokemon.species || 'Pokemon'
}

/**
 * Get the display name for an entity (Pokemon name/nickname or Human name).
 */
export function getEntityDisplayName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    return getPokemonDisplayName(combatant.entity as Pokemon)
  }
  return (combatant.entity as HumanCharacter).name || 'Character'
}
