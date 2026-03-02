/**
 * Healing Item Service
 * Encapsulates all healing item logic: validation and application.
 *
 * P0: HP restoration only (restorative category).
 * P1: Status cure, revive, combined, repulsive handling.
 * P2: Action economy, inventory consumption.
 */

import { HEALING_ITEM_CATALOG, resolveConditionsToCure, type HealingItemDef } from '~/constants/healingItems'
import { applyHealingToEntity, updateStatusConditions } from '~/server/services/combatant.service'
import { getEffectiveMaxHp } from '~/utils/restHealing'
import { ptuDistanceTokensBBox } from '~/utils/gridDistance'
import type { Combatant, StatusCondition, Pokemon, HumanCharacter } from '~/types'
import type { GridPosition } from '~/types/spatial'

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

// Re-export for backwards compatibility with tests and callers
export { resolveConditionsToCure } from '~/constants/healingItems'

// ============================================
// VALIDATION
// ============================================

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
  if (item.canRevive) {
    if (!isFainted) {
      return `${item.name} can only be used on fainted targets`
    }
    // Revive items are always valid on fainted targets
    return undefined
  }

  // Non-revive items: target must NOT be Fainted
  if (isFainted) {
    return `Cannot use ${item.name} on a fainted target`
  }

  // Combined items (Full Restore): valid if HP below max OR has curable conditions
  if (item.category === 'combined') {
    const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
    const isFullHp = entity.currentHp >= effectiveMax
    const curableConditions = resolveConditionsToCure(
      item,
      entity.statusConditions || []
    )
    if (isFullHp && curableConditions.length === 0) {
      return `${item.name} would have no effect (full HP, no curable conditions)`
    }
    return undefined
  }

  // Cure items: target must have at least one curable condition
  if (item.category === 'cure') {
    const curableConditions = resolveConditionsToCure(
      item,
      entity.statusConditions || []
    )
    if (curableConditions.length === 0) {
      if (item.curesAllPersistent) {
        return `Target has no persistent status conditions to cure`
      }
      const conditionNames = (item.curesConditions || []).join(', ')
      return `Target is not affected by ${conditionNames}`
    }
    return undefined
  }

  // HP-only items: check if target is already at effective max HP
  if (item.hpAmount || item.healToFull || item.healToPercent) {
    const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
    if (entity.currentHp >= effectiveMax) {
      return `${getEntityDisplayName(target)} is already at full HP`
    }
  }

  return undefined
}

// ============================================
// ADJACENCY CHECK (P2 — PTU p.276)
// ============================================

/**
 * Check if the user is adjacent to the target for item use.
 * PTU p.276: Items are applied by physical contact (adjacency = within 1m).
 *
 * Uses ptuDistanceTokensBBox for multi-cell token support (decree-002).
 *
 * Special cases:
 * - Self-use: always adjacent (distance 0)
 * - No grid/positions: always adjacent (gridless play)
 */
export function checkItemRange(
  userPosition: GridPosition | undefined,
  userTokenSize: number,
  targetPosition: GridPosition | undefined,
  targetTokenSize: number,
  isSelfUse: boolean
): { adjacent: boolean; distance: number } {
  if (isSelfUse) return { adjacent: true, distance: 0 }
  if (!userPosition || !targetPosition) return { adjacent: true, distance: 0 }

  const distance = ptuDistanceTokensBBox(
    { position: userPosition, size: userTokenSize },
    { position: targetPosition, size: targetTokenSize }
  )

  return {
    adjacent: distance <= 1,
    distance
  }
}

/**
 * Find the trainer combatant who owns a Pokemon combatant.
 * Used for inventory resolution when a Pokemon receives/uses an item.
 */
export function findTrainerForPokemon(
  combatants: Combatant[],
  pokemonCombatant: Combatant
): Combatant | undefined {
  const pokemon = pokemonCombatant.entity as Pokemon
  const ownerId = pokemon.ownerId

  if (!ownerId) return undefined

  return combatants.find(
    c => c.type === 'human' && c.entityId === ownerId
  )
}

// ============================================
// APPLICATION
// ============================================

/**
 * Apply a healing item's effects to a target combatant.
 *
 * Handles all item categories:
 * - restorative: HP restoration
 * - cure: status condition removal via updateStatusConditions()
 * - combined: cure conditions first, then heal HP
 * - revive: remove Fainted, set HP to item-specified amount
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

  // --- Revive handling (P1) ---
  if (item.canRevive) {
    return applyReviveItem(item, itemName, target)
  }

  // --- Combined handling (P1): cure conditions first, then heal HP ---
  if (item.category === 'combined') {
    return applyCombinedItem(item, itemName, target)
  }

  // --- Status Cure (P1) ---
  if (item.category === 'cure') {
    applyCureEffects(item, target, effects)
  }

  // --- HP Restoration ---
  if (item.hpAmount && item.category !== 'cure') {
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

  if (item.healToPercent && !item.canRevive) {
    const effectiveMax = getEffectiveMaxHp(target.entity.maxHp, target.entity.injuries || 0)
    const targetHp = Math.floor(effectiveMax * item.healToPercent / 100)
    const amount = Math.max(0, targetHp - target.entity.currentHp)
    if (amount > 0) {
      const healResult = applyHealingToEntity(target, { amount })
      effects.hpHealed = healResult.hpHealed
    }
  }

  // --- Repulsive flag ---
  if (item.repulsive) {
    effects.repulsive = true
  }

  return {
    success: true,
    itemName,
    effects
  }
}

// ============================================
// INTERNAL HELPERS
// ============================================

/**
 * Apply status cure effects from an item.
 * Uses updateStatusConditions() which handles CS reversal (decree-005).
 * Resets badlyPoisonedRound when Badly Poisoned is cured.
 */
function applyCureEffects(
  item: HealingItemDef,
  target: Combatant,
  effects: ItemApplicationResult['effects']
): void {
  const conditionsToCure = resolveConditionsToCure(
    item,
    target.entity.statusConditions || []
  )
  if (conditionsToCure.length > 0) {
    const statusResult = updateStatusConditions(target, [], conditionsToCure)
    effects.conditionsCured = statusResult.removed

    // Reset Badly Poisoned counter if cured
    if (conditionsToCure.includes('Badly Poisoned')) {
      target.badlyPoisonedRound = 0
    }
  }
}

/**
 * Apply a revive item to a fainted target.
 * Removes Fainted status and sets HP to the item-specified amount.
 *
 * Does NOT go through applyHealingToEntity because that function has
 * Fainted-removal logic at the 0-to-positive HP transition. For revives,
 * we handle Fainted removal explicitly before setting HP.
 */
function applyReviveItem(
  item: HealingItemDef,
  itemName: string,
  target: Combatant
): ItemApplicationResult {
  const entity = target.entity
  const effects: ItemApplicationResult['effects'] = {}

  // Remove Fainted status
  entity.statusConditions = (entity.statusConditions || []).filter(
    (s: StatusCondition) => s !== 'Fainted'
  )
  effects.revived = true

  const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)

  // Set HP based on item type
  if (item.hpAmount) {
    // Revive: sets to fixed amount (e.g., 20 HP), capped at effective max, minimum 1
    entity.currentHp = Math.max(1, Math.min(item.hpAmount, effectiveMax))
    effects.hpHealed = entity.currentHp
  } else if (item.healToPercent) {
    // Revival Herb: sets to percentage of effective max HP (e.g., 50%)
    entity.currentHp = Math.max(1, Math.floor(effectiveMax * item.healToPercent / 100))
    effects.hpHealed = entity.currentHp
  }

  // Repulsive flag
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
 * Apply a combined item (e.g., Full Restore).
 * Order: cure all status conditions first, then heal HP.
 * This ensures CS effects are reversed before HP healing.
 */
function applyCombinedItem(
  item: HealingItemDef,
  itemName: string,
  target: Combatant
): ItemApplicationResult {
  const effects: ItemApplicationResult['effects'] = {}

  // Step 1: Cure conditions
  applyCureEffects(item, target, effects)

  // Step 2: Heal HP
  if (item.hpAmount) {
    const healResult = applyHealingToEntity(target, { amount: item.hpAmount })
    effects.hpHealed = healResult.hpHealed
  }

  // Repulsive flag
  if (item.repulsive) {
    effects.repulsive = true
  }

  return {
    success: true,
    itemName,
    effects
  }
}

// ============================================
// DISPLAY HELPERS
// ============================================

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
