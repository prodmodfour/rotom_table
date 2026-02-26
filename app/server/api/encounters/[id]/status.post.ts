/**
 * Update status conditions on a combatant
 */
import { loadEncounter, findCombatant, saveEncounterCombatants, buildEncounterResponse } from '~/server/services/encounter.service'
import { updateStatusConditions, validateStatusConditions } from '~/server/services/combatant.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import type { StatusCondition } from '~/types'

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

    // Update status conditions using service (auto-applies/reverses CS per decree-005)
    const statusResult = updateStatusConditions(combatant, addStatuses, removeStatuses)

    // Sync both status conditions AND stage modifiers to database
    // (stages may have changed due to auto-CS from status conditions)
    await syncEntityToDatabase(combatant, {
      statusConditions: statusResult.current,
      stageModifiers: combatant.entity.stageModifiers
    })

    await saveEncounterCombatants(id, combatants)

    const response = buildEncounterResponse(record, combatants)

    return {
      success: true,
      data: response,
      statusChange: {
        combatantId: body.combatantId,
        added: statusResult.added,
        removed: statusResult.removed,
        current: statusResult.current,
        stageChanges: statusResult.stageChanges
      }
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
