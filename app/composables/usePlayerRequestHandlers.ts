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
  const { getStageModifiers } = useEntityStats()

  /**
   * Reactive error state for handler failures.
   * Auto-clears after 8 seconds. Non-blocking alternative to alert().
   */
  const handlerError = ref<string | null>(null)
  let errorTimer: ReturnType<typeof setTimeout> | null = null

  const setHandlerError = (message: string): void => {
    console.error('Player request handler error:', message)
    handlerError.value = message
    if (errorTimer) clearTimeout(errorTimer)
    errorTimer = setTimeout(() => {
      handlerError.value = null
    }, 8000)
  }

  const clearHandlerError = (): void => {
    handlerError.value = null
    if (errorTimer) {
      clearTimeout(errorTimer)
      errorTimer = null
    }
  }

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
        setHandlerError('Could not find the trainer combatant for this capture request.')
        return
      }

      // Compute accuracy params from encounter combatant data (decree-042)
      const trainerStages = getStageModifiers(trainerCombatant.entity)
      const pokemonCombatant = encounter.value.combatants.find(
        c => c.type === 'pokemon' && c.entityId === data.targetPokemonId
      )
      const accuracyResult = rollAccuracyCheck({
        throwerAccuracyStage: trainerStages.accuracy || 0,
        targetSpeedEvasion: pokemonCombatant?.speedEvasion || 0,
      })

      // PTU p.214: AC 6 gate — ball must hit before capture attempt occurs
      if (!accuracyResult.hits) {
        // Ball missed — no capture attempt, but Standard Action is still consumed
        try {
          await $fetch(`/api/encounters/${encounter.value.id}/action`, {
            method: 'POST',
            body: {
              combatantId: data.trainerCombatantId,
              actionType: 'standard'
            }
          })
        } catch (actionError: any) {
          setHandlerError('Ball missed but Standard Action could not be consumed — adjust action economy manually')
        }

        // Refresh encounter state after action economy change
        await encounterStore.loadEncounter(encounter.value.id)
        refreshUndoRedoState()

        await nextTick()
        if (encounterStore.encounter) {
          send({
            type: 'encounter_update',
            data: encounterStore.encounter
          })
        }

        send({
          type: 'player_action_ack',
          data: {
            requestId: data.requestId,
            status: 'accepted',
            result: {
              accuracyRoll: accuracyResult.roll,
              accuracyHit: false,
              captured: false,
              reason: accuracyResult.isNat1
                ? 'Natural 1 — ball missed! (auto-miss)'
                : `Rolled ${accuracyResult.roll} vs ${accuracyResult.threshold} — ball missed!`
            }
          }
        })
        return
      }

      const result = await attemptCapture({
        pokemonId: data.targetPokemonId,
        trainerId: trainerCombatant.entityId,
        accuracyRoll: accuracyResult.roll,
        accuracyThreshold: accuracyResult.threshold,
        ballType: data.ballType,
        encounterContext: {
          encounterId: encounter.value.id,
          trainerCombatantId: data.trainerCombatantId
        }
      })

      // Handle null result (capture failed to execute)
      if (!result) {
        send({
          type: 'player_action_ack',
          data: {
            requestId: data.requestId,
            status: 'rejected',
            reason: 'Capture attempt failed to execute'
          }
        })
        setHandlerError('Capture attempt failed to execute. Player has been notified.')
        return
      }

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
            accuracyHit: true,
            captured: result.captured,
            captureRate: result.captureRate,
            roll: result.roll,
            reason: result.reason
          }
        }
      })
    } catch (e: any) {
      setHandlerError(`Capture approval failed: ${e.message || 'Unknown error'}`)
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
      setHandlerError(`Breather approval failed: ${e.message || 'Unknown error'}`)
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

      const itemResult = await encounterStore.useItem(
        data.healingItemName,
        data.trainerCombatantId,
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
      setHandlerError(`Healing item approval failed: ${e.message || 'Unknown error'}`)
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
        reason: data.reason || 'Request denied by GM'
      }
    })
  }

  return {
    handlerError: readonly(handlerError),
    clearHandlerError,
    handleApproveCapture,
    handleApproveBreather,
    handleApproveHealingItem,
    handleApproveGeneric,
    handleDenyRequest
  }
}
