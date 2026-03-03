/**
 * POST /api/encounters/:id/recall
 *
 * Recall one or two Pokemon from the field as separate actions.
 * PTU p.229: "Recall and Release actions can also be taken individually
 * by a Trainer as Shift Actions."
 *
 * 1 Pokemon = Shift Action
 * 2 Pokemon = Standard Action
 *
 * P2 Section L: Tracks recall_only SwitchActions for Section N pair detection.
 */

import { prisma } from '~/server/utils/prisma'
import {
  loadEncounter,
  buildEncounterResponse,
  getEntityName
} from '~/server/services/encounter.service'
import {
  checkRecallRange,
  removeCombatantFromEncounter,
  markActionUsed,
  checkRecallReleasePair,
  canSwitchedPokemonBeCommanded,
  applyRecallSideEffects
} from '~/server/services/switching.service'
import { clearWieldOnRemoval } from '~/server/services/living-weapon.service'
import { reconstructWieldRelationships } from '~/server/services/living-weapon-state'
import { broadcastToEncounter } from '~/server/utils/websocket'
import type { SwitchAction } from '~/types/combat'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  const { trainerId, pokemonCombatantIds } = body

  if (!trainerId || !Array.isArray(pokemonCombatantIds) || pokemonCombatantIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'trainerId and pokemonCombatantIds (non-empty array) are required'
    })
  }

  if (pokemonCombatantIds.length > 2) {
    throw createError({
      statusCode: 400,
      message: 'Cannot recall more than 2 Pokemon at once'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const turnOrder: string[] = JSON.parse(record.turnOrder || '[]')
    const trainerTurnOrder: string[] = JSON.parse(record.trainerTurnOrder || '[]')
    const pokemonTurnOrder: string[] = JSON.parse(record.pokemonTurnOrder || '[]')
    const existingSwitchActions: SwitchAction[] = JSON.parse(record.switchActions || '[]')
    const isLeague = record.battleType === 'trainer'

    // ==============================
    // VALIDATION
    // ==============================

    // 1. Encounter must be active
    if (!record.isActive) {
      throw createError({ statusCode: 400, message: 'Encounter is not active' })
    }

    // 2. Trainer combatant exists (type = 'human')
    const trainer = combatants.find(c => c.id === trainerId)
    if (!trainer || trainer.type !== 'human') {
      throw createError({ statusCode: 404, message: 'Trainer combatant not found' })
    }

    // 2b. Turn validation: current combatant must be the trainer or one of their Pokemon
    // PTU p.229: recall can only be performed "on either the Trainer's or the Pokemon's Initiative"
    const currentTurnCombatantId = turnOrder[record.currentTurnIndex]
    if (currentTurnCombatantId) {
      const isTrainerTurn = currentTurnCombatantId === trainerId
      const isOwnedPokemonTurn = pokemonCombatantIds.includes(currentTurnCombatantId) ||
        combatants.some(c =>
          c.id === currentTurnCombatantId &&
          c.type === 'pokemon' &&
          (c.entity as { ownerId?: string }).ownerId === trainer.entityId
        )
      if (!isTrainerTurn && !isOwnedPokemonTurn) {
        throw createError({
          statusCode: 400,
          message: 'Recall can only be performed on the trainer\'s or their Pokemon\'s turn'
        })
      }
    }

    // 3-4. Validate each Pokemon
    for (const combatantId of pokemonCombatantIds) {
      const pokemon = combatants.find(c => c.id === combatantId)
      if (!pokemon || pokemon.type !== 'pokemon') {
        throw createError({ statusCode: 404, message: `Pokemon combatant ${combatantId} not found` })
      }

      // Must belong to trainer
      const entity = pokemon.entity as { ownerId?: string }
      if (entity.ownerId !== trainer.entityId) {
        throw createError({ statusCode: 400, message: 'Pokemon does not belong to this trainer' })
      }

      // Trapped check
      const statuses: string[] = (pokemon.entity as { statusConditions?: string[] })?.statusConditions || []
      const tempConditions: string[] = (pokemon.entity as { tempConditions?: string[] })?.tempConditions || []
      const allConditions = [...statuses, ...tempConditions]
      if (allConditions.includes('Trapped') || allConditions.includes('Bound')) {
        throw createError({ statusCode: 400, message: 'Pokemon is Trapped and cannot be recalled' })
      }

      // Range check (Full Contact only)
      const rangeResult = checkRecallRange(trainer.position, pokemon.position, isLeague)
      if (!rangeResult.inRange) {
        throw createError({
          statusCode: 400,
          message: `Pokemon is out of recall range (${rangeResult.distance}m, max 8m)`
        })
      }
    }

    // 5. Section N: Cannot recall a Pokemon that was released this round
    const pairCheck = checkRecallReleasePair(existingSwitchActions, trainerId, record.currentRound)
    for (const combatantId of pokemonCombatantIds) {
      const pokemon = combatants.find(c => c.id === combatantId)
      if (pokemon && pairCheck.releasedEntityIds.includes(pokemon.entityId)) {
        throw createError({
          statusCode: 400,
          message: 'Cannot recall a Pokemon that was released this same round'
        })
      }
    }

    // 6-8. Action availability
    const actionType = pokemonCombatantIds.length === 1 ? 'shift' : 'standard'
    if (actionType === 'shift' && trainer.turnState.shiftActionUsed) {
      throw createError({ statusCode: 400, message: 'No Shift Action available for recall' })
    }
    if (actionType === 'standard' && trainer.turnState.standardActionUsed) {
      throw createError({ statusCode: 400, message: 'No Standard Action available for double recall' })
    }

    // ==============================
    // EXECUTION
    // ==============================

    let currentCombatants = combatants
    let currentTurnOrder = turnOrder
    let currentTrainerOrder = trainerTurnOrder
    let currentPokemonOrder = pokemonTurnOrder
    let currentTurnIndex = record.currentTurnIndex
    const newSwitchActions: SwitchAction[] = []
    const recalledNames: string[] = []

    for (const combatantId of pokemonCombatantIds) {
      const pokemon = currentCombatants.find(c => c.id === combatantId)!

      recalledNames.push(getEntityName(pokemon))

      // Remove from encounter
      const removalResult = removeCombatantFromEncounter(
        currentCombatants,
        currentTurnOrder,
        currentTrainerOrder,
        currentPokemonOrder,
        currentTurnIndex,
        combatantId
      )

      currentCombatants = removalResult.combatants
      currentTurnOrder = removalResult.turnOrder
      currentTrainerOrder = removalResult.trainerTurnOrder
      currentPokemonOrder = removalResult.pokemonTurnOrder
      currentTurnIndex = removalResult.currentTurnIndex

      // Auto-disengage Living Weapon on recall (feature-005)
      const wieldRelationships = reconstructWieldRelationships(currentCombatants)
      const wieldResult = clearWieldOnRemoval(currentCombatants, wieldRelationships, combatantId)
      currentCombatants = wieldResult.combatants

      // Apply recall side-effects on DB record
      await applyRecallSideEffects(pokemon.entityId)

      // Build switch action record
      newSwitchActions.push({
        trainerId,
        recalledCombatantId: combatantId,
        recalledEntityId: pokemon.entityId,
        releasedCombatantId: null,
        releasedEntityId: null,
        actionType: 'recall_only',
        actionCost: actionType,
        round: record.currentRound,
        forced: false
      })
    }

    // Mark action as used on trainer
    const updatedTrainer = currentCombatants.find(c => c.id === trainerId)
    if (updatedTrainer) {
      markActionUsed(updatedTrainer, actionType)
    }

    // Build final switch actions array
    const updatedSwitchActions = [...existingSwitchActions, ...newSwitchActions]

    // Section N: Check if recall+release pair now forms a switch (recall after release)
    const pairCheckAfter = checkRecallReleasePair(updatedSwitchActions, trainerId, record.currentRound)
    if (pairCheckAfter.countsAsSwitch && isLeague) {
      // Apply League switch restriction to previously released Pokemon
      for (const releasedEntityId of pairCheckAfter.releasedEntityIds) {
        const released = currentCombatants.find(c => c.entityId === releasedEntityId)
        if (released) {
          const canBeCommanded = canSwitchedPokemonBeCommanded(true, false, false)
          released.turnState.canBeCommanded = canBeCommanded
        }
      }
    }

    // Persist to DB
    const updatedRecord = await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(currentCombatants),
        turnOrder: JSON.stringify(currentTurnOrder),
        trainerTurnOrder: JSON.stringify(currentTrainerOrder),
        pokemonTurnOrder: JSON.stringify(currentPokemonOrder),
        currentTurnIndex,
        switchActions: JSON.stringify(updatedSwitchActions)
      }
    })

    // Build response
    const trainerName = getEntityName(trainer)
    const responseEncounter = buildEncounterResponse(updatedRecord, currentCombatants, {
      turnOrder: currentTurnOrder,
      trainerTurnOrder: currentTrainerOrder,
      pokemonTurnOrder: currentPokemonOrder,
      currentTurnIndex,
      switchActions: updatedSwitchActions
    })

    // Broadcast
    broadcastToEncounter(id, {
      type: 'pokemon_recalled',
      data: {
        encounterId: id,
        trainerId,
        trainerName,
        recalledNames,
        actionCost: actionType,
        encounter: responseEncounter
      }
    })

    return {
      success: true,
      data: {
        encounter: responseEncounter,
        recallDetails: {
          trainerName,
          recalledNames,
          actionCost: actionType,
          count: pokemonCombatantIds.length
        }
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to recall Pokemon'
    throw createError({ statusCode: 500, message })
  }
})
