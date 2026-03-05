import type { Encounter, TrainerDeclaration, StatusCondition } from '~/types'

/**
 * Composable for encounter combat actions.
 * Handles turn progression, declarations, move execution,
 * damage, healing, items, ready actions, and action usage.
 */

interface EncounterCombatActionsContext {
  getEncounter: () => Encounter | null
  setEncounter: (enc: Encounter) => void
  setError: (msg: string) => void
  setBetweenTurns: (val: boolean) => void
}

export function useEncounterCombatActions(ctx: EncounterCombatActionsContext) {

  // Next turn
  // Returns heavily injured penalty and tick damage data for GM alerts
  async function nextTurn(): Promise<{
    heavilyInjuredPenalty: { combatantId: string; hpLost: number; isDead: boolean; deathCause: string | null } | null
    holdReleaseTriggered: Array<{ combatantId: string }>
  } | null> {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: Encounter
        heavilyInjuredPenalty?: { combatantId: string; hpLost: number; isDead: boolean; deathCause: string | null }
        holdReleaseTriggered?: Array<{ combatantId: string }>
      }>(`/api/encounters/${encounter.id}/next-turn`, {
        method: 'POST'
      })
      ctx.setEncounter(response.data)
      // Enter between-turns state for Priority declaration window (Section B6)
      ctx.setBetweenTurns(true)
      return {
        heavilyInjuredPenalty: response.heavilyInjuredPenalty ?? null,
        holdReleaseTriggered: response.holdReleaseTriggered ?? []
      }
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to advance turn')
      throw e
    }
  }

  /** Submit a trainer declaration during League Battle declaration phase (decree-021) */
  async function submitDeclaration(
    combatantId: string,
    actionType: TrainerDeclaration['actionType'],
    description: string,
    targetIds?: string[]
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return

    try {
      const response = await $fetch<{ data: Encounter }>(
        `/api/encounters/${encounter.id}/declare`,
        {
          method: 'POST',
          body: { combatantId, actionType, description, targetIds }
        }
      )
      ctx.setEncounter(response.data)
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to submit declaration')
      throw e
    }
  }

  // Execute move
  // Returns target injury/death results for GM alerts (null if no damage targets)
  async function executeMove(
    actorId: string,
    moveId: string,
    targetIds: string[],
    damage?: number,
    targetDamages?: Record<string, number>,
    notes?: string
  ): Promise<Array<{
    targetId: string
    targetName: string
    heavilyInjured: boolean
    heavilyInjuredHpLoss: number
    fainted: boolean
    isDead: boolean
    deathCause: string | null
    leagueSuppressed: boolean
  }> | null> {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: Encounter
        targetResults?: Array<{
          targetId: string
          targetName: string
          heavilyInjured: boolean
          heavilyInjuredHpLoss: number
          fainted: boolean
          isDead: boolean
          deathCause: string | null
          leagueSuppressed: boolean
        }>
      }>(`/api/encounters/${encounter.id}/move`, {
        method: 'POST',
        body: { actorId, moveId, targetIds, damage, targetDamages, notes }
      })
      ctx.setEncounter(response.data)
      return response.targetResults ?? null
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to execute move')
      throw e
    }
  }

  // Apply damage to combatant
  // Returns damage result with heavily injured and death check info
  async function applyDamage(combatantId: string, damage: number, suppressDeath: boolean = false) {
    const encounter = ctx.getEncounter()
    if (!encounter) return null

    try {
      const response = await $fetch<{
        data: Encounter
        damageResult?: {
          heavilyInjured?: boolean
          heavilyInjuredHpLoss?: number
          deathCheck?: {
            isDead: boolean
            cause: string | null
            leagueSuppressed: boolean
          }
          mountDismounted?: boolean
          dismountCheck?: {
            triggered: boolean
            riderId: string
            mountId: string
            dc: number
            mountedProwessBonus: number
            reason: 'damage' | 'push' | 'confusion'
          }
        }
      }>(`/api/encounters/${encounter.id}/damage`, {
        method: 'POST',
        body: { combatantId, damage, suppressDeath }
      })
      ctx.setEncounter(response.data)
      return response.damageResult ?? null
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to apply damage')
      throw e
    }
  }

  // Heal combatant (supports HP, temp HP, and injury healing)
  async function healCombatant(
    combatantId: string,
    amount: number = 0,
    tempHp: number = 0,
    healInjuries: number = 0
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return

    try {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounter.id}/heal`, {
        method: 'POST',
        body: { combatantId, amount, tempHp, healInjuries }
      })
      ctx.setEncounter(response.data)
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to heal combatant')
      throw e
    }
  }

  /** Use a healing item on a combatant (P2: action economy + inventory) */
  async function useItem(
    itemName: string,
    userId: string,
    targetId: string,
    options?: {
      targetAccepts?: boolean
      /** GM override: skip inventory check/consumption */
      skipInventory?: boolean
    }
  ) {
    const encounter = ctx.getEncounter()
    if (!encounter) return

    try {
      const response = await $fetch<{
        success: boolean
        data: Encounter
        itemResult: {
          itemName: string
          userName: string
          targetName: string
          hpHealed?: number
          conditionsCured?: StatusCondition[]
          revived?: boolean
          repulsive?: boolean
          refused: boolean
          actionCost?: 'standard' | 'full_round'
          targetForfeitsActions?: boolean
          inventoryConsumed?: boolean
          remainingQuantity?: number
        }
      }>(`/api/encounters/${encounter.id}/use-item`, {
        method: 'POST',
        body: {
          itemName,
          userId,
          targetId,
          targetAccepts: options?.targetAccepts ?? true,
          ...(options?.skipInventory && { skipInventory: true })
        }
      })

      if (response.data) {
        ctx.setEncounter(response.data)
      }
      return response.itemResult
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to use item')
      throw e
    }
  }

  // Set ready action
  async function setReadyAction(combatantId: string, readyAction: string) {
    const encounter = ctx.getEncounter()
    if (!encounter) return

    try {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounter.id}/ready`, {
        method: 'POST',
        body: { combatantId, readyAction }
      })
      ctx.setEncounter(response.data)
    } catch (e: any) {
      ctx.setError(e.message || 'Failed to set ready action')
      throw e
    }
  }

  // Use an action for a combatant (standard, shift, or swift)
  async function useAction(combatantId: string, actionType: 'standard' | 'shift' | 'swift') {
    const encounter = ctx.getEncounter()
    if (!encounter) return

    try {
      const response = await $fetch<{ data: Encounter }>(`/api/encounters/${encounter.id}/action`, {
        method: 'POST',
        body: { combatantId, actionType }
      })
      ctx.setEncounter(response.data)
    } catch (e: any) {
      ctx.setError(e.message || `Failed to use ${actionType} action`)
      throw e
    }
  }

  return {
    nextTurn,
    submitDeclaration,
    executeMove,
    applyDamage,
    healCombatant,
    useItem,
    setReadyAction,
    useAction
  }
}
