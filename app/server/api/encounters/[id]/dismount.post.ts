/**
 * POST /api/encounters/:id/dismount
 *
 * Dismount a trainer from their mounted Pokemon.
 * Clears the mount relationship on both combatants and places
 * the rider in the nearest unoccupied adjacent cell.
 *
 * PTU p.218: Voluntary dismount or forced dismount on failed check.
 * When mount faints, auto-dismount is handled separately in the
 * clearMountOnFaint service function.
 */
import { loadEncounter, buildEncounterResponse, saveEncounterCombatants } from '~/server/services/encounter.service'
import { executeDismount } from '~/server/services/mounting.service'
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

  if (!body.riderId) {
    throw createError({
      statusCode: 400,
      message: 'riderId is required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    if (!record.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter must be active to dismount'
      })
    }

    // Grid dimensions for position placement
    const gridWidth = record.gridWidth || 20
    const gridHeight = record.gridHeight || 20

    // Execute dismount (validates preconditions, returns new combatant array)
    const dismountResult = executeDismount(
      combatants,
      body.riderId,
      body.forced ?? false,
      gridWidth,
      gridHeight
    )

    // Persist updated combatants
    await saveEncounterCombatants(id, dismountResult.updatedCombatants)

    // Broadcast dismount event via WebSocket
    broadcastToEncounter(id, {
      type: 'encounter_update',
      data: { encounterId: id }
    })

    const response = buildEncounterResponse(record, dismountResult.updatedCombatants)

    return {
      success: true,
      data: {
        encounter: response,
        dismountResult: {
          riderId: dismountResult.riderId,
          mountId: dismountResult.mountId,
          riderPosition: dismountResult.riderPosition,
          forced: dismountResult.forced,
          dismounted: true
        }
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to dismount'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
