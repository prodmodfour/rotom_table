import type { Ref } from 'vue'
import type { Encounter, WebSocketEvent } from '~/types'
import type { BreatherShiftResult } from '~/composables/useEncounterActions'

interface PlayerRequestHandlersOptions {
  encounter: Ref<Encounter | null>
  send: (event: WebSocketEvent) => void
  refreshUndoRedoState: () => void
  pendingBreatherShift: Ref<BreatherShiftResult | null>
  activeView: Ref<'list' | 'grid'>
}

/**
 * Composable for handling player action requests on the GM side.
 * Provides approve/deny handlers for capture, breather, healing item,
 * and generic player action requests.
 *
 * Extracted from the GM encounter page to keep it under the 800-line limit.
 */
export function usePlayerRequestHandlers(options: PlayerRequestHandlersOptions) {
  const {
    encounter,
    send,
    refreshUndoRedoState,
    pendingBreatherShift,
    activeView
  } = options

  const encounterStore = useEncounterStore()
  const { rollAccuracyCheck, attemptCapture } = useCapture()

  /**
   * GM approves a player's capture request.
   * Rolls accuracy (AC 6), attempts capture, sends ack to player.
   */
  const handleApproveCapture = async (data: {
    requestId: string
    targetPokemonId: string
    trainerCombatantId: string
    ballType: string
  }): Promise<void> => {
    if (!encounter.value) return

    try {
      // Capture undo snapshot before modifying encounter state
      encounterStore.captureSnapshot('Capture Attempt')

      // Find the trainer combatant to get the trainer entity ID
      const trainerCombatant = encounter.value.combatants.find(
        c => c.id === data.trainerCombatantId
      )
      if (!trainerCombatant) {
        alert('Could not find the trainer combatant for this capture request.')
        return
      }

      const accuracyResult = rollAccuracyCheck()
      const result = await attemptCapture({
        pokemonId: data.targetPokemonId,
        trainerId: trainerCombatant.entityId,
        accuracyRoll: accuracyResult.roll,
        ballType: data.ballType,
        encounterContext: {
          encounterId: encounter.value.id,
          trainerCombatantId: data.trainerCombatantId
        }
      })

      // Refresh encounter state after action economy change
      await encounterStore.loadEncounter(encounter.value.id)
      refreshUndoRedoState()

      // Broadcast updated encounter
      await nextTick()
      if (encounterStore.encounter) {
        send({
          type: 'encounter_update',
          data: encounterStore.encounter
        })
      }

      // Send ack to player
      send({
        type: 'player_action_ack',
        data: {
          requestId: data.requestId,
          status: 'accepted',
          result: {
            accuracyRoll: accuracyResult.roll,
            captured: result?.captured ?? false,
            captureRate: result?.captureRate,
            roll: result?.roll,
            reason: result?.reason
          }
        }
      })
    } catch (e: any) {
      alert(`Capture approval failed: ${e.message || 'Unknown error'}`)
    }
  }

  /**
   * GM approves a player's Take a Breather request.
   * Calls existing breather endpoint, refreshes state, sends ack.
   */
  const handleApproveBreather = async (data: {
    requestId: string
    combatantId: string
    assisted: boolean
  }): Promise<void> => {
    if (!encounter.value) return

    try {
      // Capture undo snapshot before modifying encounter state
      encounterStore.captureSnapshot('Take a Breather')

      const result = await $fetch(`/api/encounters/${encounter.value.id}/breather`, {
        method: 'POST',
        body: {
          combatantId: data.combatantId,
          assisted: data.assisted
        }
      })

      // Refresh encounter state
      await encounterStore.loadEncounter(encounter.value.id)
      refreshUndoRedoState()

      // Broadcast updated encounter
      await nextTick()
      if (encounterStore.encounter) {
        send({
          type: 'encounter_update',
          data: encounterStore.encounter
        })
      }

      // Show breather shift banner if applicable
      const breatherResult = (result as any)?.breatherResult
      if (breatherResult) {
        const combatant = encounterStore.encounter?.combatants.find(
          c => c.id === data.combatantId
        )
        if (combatant) {
          const name = combatant.type === 'pokemon'
            ? ((combatant.entity as { nickname?: string; species: string }).nickname
              || (combatant.entity as { species: string }).species)
            : (combatant.entity as { name: string }).name

          pendingBreatherShift.value = {
            combatantId: data.combatantId,
            combatantName: name
          }
          activeView.value = 'grid'
        }
      }

      // Send ack to player
      send({
        type: 'player_action_ack',
        data: {
          requestId: data.requestId,
          status: 'accepted',
          result: breatherResult
        }
      })
    } catch (e: any) {
      alert(`Breather approval failed: ${e.message || 'Unknown error'}`)
    }
  }

  /**
   * GM approves a player's healing item request.
   * Calls existing useItem via encounterStore, sends ack.
   */
  const handleApproveHealingItem = async (data: {
    requestId: string
    healingItemName: string
    healingTargetId: string
    trainerCombatantId: string
  }): Promise<void> => {
    if (!encounter.value) return

    try {
      // Capture undo snapshot before modifying encounter state
      encounterStore.captureSnapshot('Use Healing Item')

      // Find the trainer combatant to get the user entity ID
      const trainerCombatant = encounter.value.combatants.find(
        c => c.id === data.trainerCombatantId
      )
      if (!trainerCombatant) {
        alert('Could not find the trainer combatant for this healing request.')
        return
      }

      const itemResult = await encounterStore.useItem(
        data.healingItemName,
        trainerCombatant.entityId,
        data.healingTargetId
      )

      refreshUndoRedoState()

      // Broadcast updated encounter
      await nextTick()
      if (encounterStore.encounter) {
        send({
          type: 'encounter_update',
          data: encounterStore.encounter
        })
      }

      // Send ack to player
      send({
        type: 'player_action_ack',
        data: {
          requestId: data.requestId,
          status: 'accepted',
          result: itemResult
        }
      })
    } catch (e: any) {
      alert(`Healing item approval failed: ${e.message || 'Unknown error'}`)
    }
  }

  /**
   * GM approves a generic player action request (use_item, switch_pokemon, maneuver).
   * Sends ack without executing -- GM will handle the action manually through existing UI.
   */
  const handleApproveGeneric = (data: {
    requestId: string
    request: unknown
  }): void => {
    send({
      type: 'player_action_ack',
      data: {
        requestId: data.requestId,
        status: 'accepted'
      }
    })
  }

  /**
   * GM denies a player action request. Sends rejection ack.
   */
  const handleDenyRequest = (data: {
    requestId: string
    reason: string
  }): void => {
    send({
      type: 'player_action_ack',
      data: {
        requestId: data.requestId,
        status: 'rejected',
        reason: data.reason || 'GM declined the request'
      }
    })
  }

  return {
    handleApproveCapture,
    handleApproveBreather,
    handleApproveHealingItem,
    handleApproveGeneric,
    handleDenyRequest
  }
}
