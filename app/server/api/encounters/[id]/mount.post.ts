/**
 * POST /api/encounters/:id/mount
 *
 * Mount a trainer on an adjacent Pokemon with the Mountable capability.
 * Sets mount state on both the rider (trainer) and mount (Pokemon) combatants.
 *
 * PTU p.218: Mounting is a Standard Action with Acrobatics/Athletics DC 10.
 * Expert Acrobatics/Athletics: mount as Free Action during Shift (2m+ movement).
 * Mounted Prowess edge: auto-succeed the mounting check.
 */
import { loadEncounter, buildEncounterResponse, saveEncounterCombatants } from '~/server/services/encounter.service'
import { executeMount } from '~/server/services/mounting.service'
import { broadcastToEncounter } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  if (!body.riderId || !body.mountId) {
    throw createError({
      statusCode: 400,
      message: 'riderId and mountId are required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    if (!record.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter must be active to mount'
      })
    }

    // Execute mount (validates preconditions, returns new combatant array)
    const mountResult = executeMount(
      combatants,
      body.riderId,
      body.mountId,
      body.skipCheck,
      record.weather
    )

    // Persist updated combatants
    await saveEncounterCombatants(id, mountResult.updatedCombatants)

    const response = buildEncounterResponse(record, mountResult.updatedCombatants)

    // Broadcast mount event via WebSocket (send full encounter response)
    broadcastToEncounter(id, {
      type: 'encounter_update',
      data: response
    })

    return {
      success: true,
      data: {
        encounter: response,
        mountResult: {
          riderId: mountResult.riderId,
          mountId: mountResult.mountId,
          actionCost: mountResult.actionCost,
          checkRequired: mountResult.checkRequired,
          checkAutoSuccess: mountResult.checkAutoSuccess,
          mounted: true
        }
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to mount'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
