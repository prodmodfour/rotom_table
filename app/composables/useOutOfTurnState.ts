import type { Combatant } from '~/types'
import type { OutOfTurnAction } from '~/types/combat'

/**
 * Composable for out-of-turn reactive state derived from the encounter store.
 *
 * Extracted from encounter.ts store getters (refactoring-117) to reduce
 * store size and improve cohesion. All values are computed refs that
 * react to encounter store changes.
 */
export function useOutOfTurnState() {
  const encounterStore = useEncounterStore()

  const pendingAoOs = computed((): OutOfTurnAction[] => {
    return (encounterStore.encounter?.pendingOutOfTurnActions ?? [])
      .filter(a => a.category === 'aoo' && a.status === 'pending')
  })

  const pendingOutOfTurnActions = computed((): OutOfTurnAction[] => {
    return (encounterStore.encounter?.pendingOutOfTurnActions ?? [])
      .filter(a => a.status === 'pending')
  })

  const hasAoOPrompts = computed((): boolean => {
    return (encounterStore.encounter?.pendingOutOfTurnActions ?? [])
      .some(a => a.category === 'aoo' && a.status === 'pending')
  })

  const holdQueue = computed(() => {
    return encounterStore.encounter?.holdQueue ?? []
  })

  const isBetweenTurns = computed((): boolean => {
    return encounterStore.betweenTurns
  })

  const holdingCombatants = computed((): Combatant[] => {
    if (!encounterStore.encounter) return []
    return encounterStore.encounter.combatants.filter(c =>
      c.holdAction?.isHolding === true
    )
  })

  const pendingInterrupts = computed((): OutOfTurnAction[] => {
    return (encounterStore.encounter?.pendingOutOfTurnActions ?? [])
      .filter(a => a.category === 'interrupt' && a.status === 'pending')
  })

  const pendingInterceptMelee = computed((): OutOfTurnAction[] => {
    return (encounterStore.encounter?.pendingOutOfTurnActions ?? [])
      .filter(a => a.triggerType === 'ally_hit_melee' && a.status === 'pending')
  })

  const pendingInterceptRanged = computed((): OutOfTurnAction[] => {
    return (encounterStore.encounter?.pendingOutOfTurnActions ?? [])
      .filter(a => a.triggerType === 'ranged_in_range' && a.status === 'pending')
  })

  const hasInterceptPrompts = computed((): boolean => {
    return (encounterStore.encounter?.pendingOutOfTurnActions ?? [])
      .some(a =>
        (a.triggerType === 'ally_hit_melee' || a.triggerType === 'ranged_in_range')
        && a.status === 'pending'
      )
  })

  const priorityEligibleCombatants = computed((): Combatant[] => {
    if (!encounterStore.encounter) return []
    return encounterStore.encounter.combatants.filter(c => {
      if (c.entity.currentHp <= 0) return false
      if (c.outOfTurnUsage?.priorityUsed) return false
      if (c.holdAction?.isHolding) return false
      return true
    })
  })

  return {
    pendingAoOs,
    pendingOutOfTurnActions,
    hasAoOPrompts,
    holdQueue,
    isBetweenTurns,
    holdingCombatants,
    pendingInterrupts,
    pendingInterceptMelee,
    pendingInterceptRanged,
    hasInterceptPrompts,
    priorityEligibleCombatants,
  }
}
