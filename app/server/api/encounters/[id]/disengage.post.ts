/**
 * POST /api/encounters/:id/disengage
 *
 * Disengage Maneuver - PTU p.241 (ptu-rule-095)
 *
 * Shift Action: The combatant may Shift 1 Meter. Shifting this way
 * does not provoke an Attack of Opportunity.
 *
 * Sets disengaged=true and consumes the Shift Action.
 * The 1m movement limit is enforced client-side via useGridMovement
 * (disengaged flag clamps speed to 1m).
 */
import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { loadEncounter, findCombatant, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
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

  if (!body.combatantId) {
    throw createError({
      statusCode: 400,
      message: 'combatantId is required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    if (!record.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter is not active'
      })
    }

    const combatant = findCombatant(combatants, body.combatantId)

    // Validate shift action is available
    if (combatant.turnState.shiftActionUsed) {
      throw createError({
        statusCode: 400,
        message: 'Shift Action already used this turn'
      })
    }

    // Set disengaged flag and consume Shift Action
    // Using immutable update pattern for the combatant within the array
    const updatedCombatants = combatants.map(c => {
      if (c.id !== body.combatantId) return c
      return {
        ...c,
        disengaged: true,
        turnState: {
          ...c.turnState,
          shiftActionUsed: true
        }
      }
    })

    // Build move log entry
    const entityName = getEntityName(combatant)
    const moveLog = JSON.parse(record.moveLog || '[]')
    moveLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      round: record.currentRound,
      actorId: body.combatantId,
      actorName: entityName,
      moveName: 'Disengage',
      damageClass: 'Status',
      actionType: 'shift',
      targets: [],
      notes: `${entityName} disengaged -- may shift 1m without provoking AoO.`
    })

    // Save to database
    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(updatedCombatants),
        moveLog: JSON.stringify(moveLog)
      }
    })

    // Broadcast
    broadcastToEncounter(id, {
      type: 'encounter_update',
      data: {
        encounterId: id,
        action: 'disengage',
        combatantId: body.combatantId,
        combatantName: entityName
      }
    })

    const response = buildEncounterResponse(record, updatedCombatants, { moveLog })

    return {
      success: true,
      data: response,
      disengageResult: {
        combatantId: body.combatantId,
        combatantName: entityName,
        disengaged: true
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to disengage'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
