/**
 * Update combat stage modifiers on a combatant
 */
import {
  loadEncounter, findCombatant, saveEncounterCombatants,
  buildEncounterResponse, reorderInitiativeAfterSpeedChange, saveInitiativeReorder
} from '~/server/services/encounter.service'
import { updateStageModifiers, validateStageStats } from '~/server/services/combatant.service'
import { syncStagesToDatabase } from '~/server/services/entity-update.service'

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

  if (!body.changes || typeof body.changes !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'changes object is required with stat modifications'
    })
  }

  // Validate stat names
  validateStageStats(Object.keys(body.changes))

  try {
    const { record, combatants } = await loadEncounter(id)
    const combatant = findCombatant(combatants, body.combatantId)

    // Update stage modifiers using service
    const stageResult = updateStageModifiers(combatant, body.changes, body.absolute || false)

    // Sync to database if entity has a record
    await syncStagesToDatabase(combatant, stageResult.currentStages)

    // Decree-006: If speed CS actually changed value and encounter is active, reorder initiative
    const speedChanged = stageResult.changes.speed?.change !== 0
    let initiativeReorder = null

    if (speedChanged && record.isActive) {
      const turnOrder = JSON.parse(record.turnOrder) as string[]
      const trainerTurnOrder = JSON.parse(record.trainerTurnOrder || '[]') as string[]
      const pokemonTurnOrder = JSON.parse(record.pokemonTurnOrder || '[]') as string[]

      const reorder = reorderInitiativeAfterSpeedChange(
        combatants,
        turnOrder,
        record.currentTurnIndex,
        record.battleType,
        trainerTurnOrder,
        pokemonTurnOrder
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
      stageChanges: {
        combatantId: body.combatantId,
        changes: stageResult.changes,
        currentStages: stageResult.currentStages
      },
      initiativeReorder: initiativeReorder ? {
        changed: true,
        turnOrder: initiativeReorder.turnOrder,
        currentTurnIndex: initiativeReorder.currentTurnIndex
      } : null
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to update combat stages'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
