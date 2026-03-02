/**
 * Composable for healing item selection and application.
 * Provides filtered item lists and validation for the UseItemModal.
 *
 * P0: Only restorative items (HP healing).
 * P1: Adds cure, revive, combined items with category-aware filtering.
 */

import {
  HEALING_ITEM_CATALOG, resolveConditionsToCure,
  type HealingItemDef, type HealingItemCategory
} from '~/constants/healingItems'
import { getEffectiveMaxHp } from '~/utils/restHealing'
import type { Combatant } from '~/types'

/** All P1 categories */
const ALL_CATEGORIES: HealingItemCategory[] = ['restorative', 'cure', 'combined', 'revive']

export function useHealingItems() {
  const encounterStore = useEncounterStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Get items that would have an effect on the target.
   * Filters by target state: fainted targets only see revives,
   * active targets see restoratives/cures/combined based on their HP and conditions.
   */
  function getApplicableItems(
    target: Combatant,
    allowedCategories: HealingItemCategory[] = ALL_CATEGORIES
  ): HealingItemDef[] {
    const entity = target.entity
    const isFainted = (entity.statusConditions || []).includes('Fainted')
    const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
    const isFullHp = entity.currentHp >= effectiveMax

    return Object.values(HEALING_ITEM_CATALOG).filter(item => {
      // Category filter
      if (!allowedCategories.includes(item.category)) return false

      // Restorative: only if not at full HP and not fainted
      if (item.category === 'restorative') {
        return !isFullHp && !isFainted
      }

      // Cure: only if target has a matching condition and is not fainted
      if (item.category === 'cure') {
        if (isFainted) return false
        const curableConditions = resolveConditionsToCure(item, entity.statusConditions || [])
        return curableConditions.length > 0
      }

      // Combined: if not fainted and (not full HP or has curable conditions)
      if (item.category === 'combined') {
        if (isFainted) return false
        const curableConditions = resolveConditionsToCure(item, entity.statusConditions || [])
        return !isFullHp || curableConditions.length > 0
      }

      // Revive: only if fainted
      if (item.category === 'revive') {
        return isFainted
      }

      return false
    })
  }

  /**
   * Execute item use via the encounter store.
   */
  async function useItem(
    itemName: string,
    userId: string,
    targetId: string,
    targetAccepts: boolean = true
  ) {
    loading.value = true
    error.value = null
    try {
      const result = await encounterStore.useItem(itemName, userId, targetId, { targetAccepts })
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to use item'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Get all items in the catalog, grouped by category.
   */
  function getItemsByCategory(): Record<HealingItemCategory, HealingItemDef[]> {
    const grouped: Record<HealingItemCategory, HealingItemDef[]> = {
      restorative: [],
      cure: [],
      combined: [],
      revive: [],
    }
    for (const item of Object.values(HEALING_ITEM_CATALOG)) {
      grouped[item.category].push(item)
    }
    return grouped
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    getApplicableItems,
    getItemsByCategory,
    useItem,
  }
}
