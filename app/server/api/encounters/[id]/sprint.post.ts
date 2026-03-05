/**
 * Sprint Maneuver - PTU Standard Action (page 245)
 * - Adds 'Sprint' tempCondition for +50% movement speed until next turn
 * - Persists to database so state survives page refresh
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, findCombatant, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'

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
    const combatant = findCombatant(combatants, body.combatantId)

    let sprintApplied = false

    // Add Sprint tempCondition if not already present
    if (!combatant.tempConditions) {
      combatant.tempConditions = []
    }
    if (!combatant.tempConditions.includes('Sprint')) {
      combatant.tempConditions = [...combatant.tempConditions, 'Sprint']
      sprintApplied = true
    }

    // Mark as having used standard + shift actions — PTU p.245:
    // Sprint uses the Standard Action, and the Sprint movement IS the shift
    combatant.turnState = {
      ...combatant.turnState,
      standardActionUsed: true,
      shiftActionUsed: true,
      hasActed: true
    }

    // Add to move log
    const moveLog = JSON.parse(record.moveLog)
    const entityName = getEntityName(combatant)
    moveLog.push({
      id: crypto.randomUUID(),
      round: record.currentRound,
      actorId: body.combatantId,
      actorName: entityName,
      moveName: 'Sprint',
      targets: [],
      notes: sprintApplied ? '+50% movement speed until next turn' : 'Sprint already active'
    })

    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(combatants),
        moveLog: JSON.stringify(moveLog)
      }
    })

    const response = buildEncounterResponse(record, combatants, { moveLog })

    return {
      success: true,
      data: response,
      sprintResult: {
        combatantId: body.combatantId,
        sprintApplied
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to apply sprint'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
