/**
 * Update status conditions on a combatant
 */
import {
  loadEncounter, findCombatant, saveEncounterCombatants,
  buildEncounterResponse, reorderInitiativeAfterSpeedChange, saveInitiativeReorder
} from '~/server/services/encounter.service'
import { updateStatusConditions, validateStatusConditions } from '~/server/services/combatant.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { getStatusCsEffect } from '~/constants/statusConditions'
import { findImmuneStatuses } from '~/utils/typeStatusImmunity'
import type { StatusCondition, Pokemon } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  if (!body.combatantId) {
    throw createError({
      statusCode: 400,
      message: 'combatantId is required'
    })
  }

  // Must have add or remove array
  if (!body.add && !body.remove) {
    throw createError({
      statusCode: 400,
      message: 'Either add or remove array is required'
    })
  }

  // Validate status conditions
  const addStatuses: StatusCondition[] = body.add || []
  const removeStatuses: StatusCondition[] = body.remove || []

  validateStatusConditions([...addStatuses, ...removeStatuses])

  try {
    const { record, combatants } = await loadEncounter(id)
    const combatant = findCombatant(combatants, body.combatantId)

    // Decree-012: Check type-based status immunities for Pokemon targets
    // Reject immune statuses unless override: true is passed
    if (addStatuses.length > 0 && combatant.type === 'pokemon') {
      const pokemonEntity = combatant.entity as Pokemon
      const entityTypes = pokemonEntity.types as string[]
      const immuneStatuses = findImmuneStatuses(entityTypes, addStatuses)

      if (immuneStatuses.length > 0 && !body.override) {
        const messages = immuneStatuses.map(({ status, immuneType }) =>
          `${immuneType}-type Pokemon are immune to ${status}`
        )
        throw createError({
          statusCode: 409,
          message: messages.join('; '),
          data: {
            immune: immuneStatuses,
            hint: 'Send override: true to force application (GM override)'
          }
        })
      }
    }

    // Update status conditions using service (auto-applies/reverses CS per decree-005)
    const statusResult = updateStatusConditions(combatant, addStatuses, removeStatuses)

    // Sync both status conditions AND stage modifiers to database
    // (stages may have changed due to auto-CS from status conditions)
    await syncEntityToDatabase(combatant, {
      statusConditions: statusResult.current,
      stageModifiers: combatant.entity.stageModifiers
    })

    // Decree-006: Check if any added/removed status affects Speed CS
    // If so, trigger initiative reorder on the active encounter
    const allChangedStatuses = [...statusResult.added, ...statusResult.removed]
    const speedCsAffected = allChangedStatuses.some(s => {
      const effect = getStatusCsEffect(s)
      return effect?.stat === 'speed'
    })

    let initiativeReorder = null

    if (speedCsAffected && record.isActive) {
      const turnOrder = JSON.parse(record.turnOrder) as string[]
      const trainerTurnOrder = JSON.parse(record.trainerTurnOrder || '[]') as string[]
      const pokemonTurnOrder = JSON.parse(record.pokemonTurnOrder || '[]') as string[]

      const reorder = reorderInitiativeAfterSpeedChange(
        combatants,
        turnOrder,
        record.currentTurnIndex,
        record.battleType,
        trainerTurnOrder,
        pokemonTurnOrder,
        record.currentPhase
      )

      if (reorder.changed) {
        await saveInitiativeReorder(id, combatants, reorder)
        initiativeReorder = reorder
      } else {
        await saveEncounterCombatants(id, combatants)
      }
    } else {
      await saveEncounterCombatants(id, combatants)
    }

    const response = buildEncounterResponse(record, combatants, initiativeReorder ? {
      turnOrder: initiativeReorder.turnOrder,
      trainerTurnOrder: initiativeReorder.trainerTurnOrder,
      pokemonTurnOrder: initiativeReorder.pokemonTurnOrder,
      currentTurnIndex: initiativeReorder.currentTurnIndex
    } : undefined)

    return {
      success: true,
      data: response,
      statusChange: {
        combatantId: body.combatantId,
        added: statusResult.added,
        removed: statusResult.removed,
        current: statusResult.current,
        stageChanges: statusResult.stageChanges
      },
      initiativeReorder: initiativeReorder ? {
        changed: true,
        turnOrder: initiativeReorder.turnOrder,
        currentTurnIndex: initiativeReorder.currentTurnIndex
      } : null
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to update status conditions'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
