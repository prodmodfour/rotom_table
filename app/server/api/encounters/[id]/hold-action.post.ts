/**
 * POST /api/encounters/:id/hold-action
 *
 * Declare a Hold Action for the current combatant.
 * PTU p.227: "Combatants can choose to hold their action until a specified
 * lower Initiative value once per round."
 *
 * The combatant's turn is skipped and they are added to the hold queue.
 * When the target initiative is reached (checked in next-turn.post.ts),
 * they get a full turn via release-hold.
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, buildEncounterResponse } from '~/server/services/encounter.service'
import { canHoldAction, applyHoldAction } from '~/server/services/out-of-turn.service'
import { broadcastToEncounter } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  const body = await readBody(event)
  const { combatantId, holdUntilInitiative } = body as {
    combatantId: string
    holdUntilInitiative: number | null
  }

  if (!combatantId) {
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

    // Find the combatant
    const combatant = combatants.find(c => c.id === combatantId)
    if (!combatant) {
      throw createError({
        statusCode: 404,
        message: 'Combatant not found'
      })
    }

    // Validate the combatant is the current turn's combatant
    const turnOrder = JSON.parse(record.turnOrder)
    const currentCombatantId = turnOrder[record.currentTurnIndex]
    if (combatantId !== currentCombatantId) {
      throw createError({
        statusCode: 400,
        message: 'Can only hold action on your own turn'
      })
    }

    // Validate eligibility
    const eligibility = canHoldAction(combatant)
    if (!eligibility.allowed) {
      throw createError({
        statusCode: 400,
        message: `Cannot hold action: ${eligibility.reason}`
      })
    }

    // Apply the hold action
    const { updatedCombatant, holdQueueEntry } = applyHoldAction(
      combatant,
      holdUntilInitiative ?? null
    )

    // Update combatants array immutably
    const updatedCombatants = combatants.map(c =>
      c.id === combatantId ? updatedCombatant : c
    )

    // Add to hold queue
    const holdQueue = JSON.parse(record.holdQueue || '[]')
    const updatedHoldQueue = [...holdQueue, holdQueueEntry]

    // Advance the turn — the holding combatant's turn is skipped (spec A2 step 5)
    let currentTurnIndex = record.currentTurnIndex + 1
    const currentRound = record.currentRound

    // Handle round wrap-around for Full Contact battles
    if (currentTurnIndex >= turnOrder.length && record.battleType !== 'trainer') {
      currentTurnIndex = 0
    }

    // Save to database
    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(updatedCombatants),
        holdQueue: JSON.stringify(updatedHoldQueue),
        currentTurnIndex
      }
    })

    // Broadcast hold action via WebSocket
    broadcastToEncounter(id, {
      type: 'hold_action',
      data: {
        encounterId: id,
        combatantId,
        holdUntilInitiative: holdUntilInitiative ?? null
      }
    })

    const response = buildEncounterResponse(record, updatedCombatants, {
      holdQueue: updatedHoldQueue,
      currentTurnIndex
    })

    return {
      success: true,
      data: response
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to hold action'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
