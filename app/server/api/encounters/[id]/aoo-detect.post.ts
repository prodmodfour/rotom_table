/**
 * POST /api/encounters/:id/aoo-detect
 *
 * Detect AoO opportunities triggered by a specific action.
 * Called when a potentially triggering action occurs (movement, ranged attack,
 * standing up, maneuver, or item retrieval).
 *
 * Returns any detected AoO opportunities as pending OutOfTurnAction objects.
 * These are stored on the encounter for GM resolution via /aoo-resolve.
 *
 * PTU p.241: Attacks of Opportunity
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, buildEncounterResponse } from '~/server/services/encounter.service'
import { detectAoOTriggers } from '~/server/services/out-of-turn.service'
import { broadcastToEncounter } from '~/server/utils/websocket'
import { AOO_TRIGGER_MAP } from '~/constants/aooTriggers'
import type { AoOTrigger } from '~/types/combat'
import type { GridPosition } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  const body = await readBody(event)
  const {
    actorId,
    triggerType,
    previousPosition,
    newPosition,
    maneuverTargetIds,
    hasAdjacentTarget
  } = body as {
    actorId: string
    triggerType: AoOTrigger
    previousPosition?: GridPosition
    newPosition?: GridPosition
    maneuverTargetIds?: string[]
    hasAdjacentTarget?: boolean
  }

  if (!actorId || !triggerType) {
    throw createError({
      statusCode: 400,
      message: 'actorId and triggerType are required'
    })
  }

  // Validate triggerType against known AoO triggers (HIGH-001)
  const validTriggerTypes = Object.keys(AOO_TRIGGER_MAP)
  if (!validTriggerTypes.includes(triggerType)) {
    throw createError({
      statusCode: 400,
      message: `Invalid triggerType "${triggerType}". Must be one of: ${validTriggerTypes.join(', ')}`
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

    // Find the triggering actor
    const actor = combatants.find(c => c.id === actorId)
    if (!actor) {
      throw createError({
        statusCode: 404,
        message: 'Actor combatant not found'
      })
    }

    // Detect AoO triggers
    const triggeredActions = detectAoOTriggers({
      actor,
      triggerType,
      combatants,
      round: record.currentRound,
      previousPosition,
      newPosition,
      maneuverTargetIds,
      hasAdjacentTarget
    })

    if (triggeredActions.length === 0) {
      // No AoO opportunities detected
      const response = buildEncounterResponse(record, combatants)
      return {
        success: true,
        data: {
          triggeredActions: [],
          encounter: response
        }
      }
    }

    // Append new pending actions to existing ones
    const existingPending = JSON.parse(record.pendingActions || '[]')
    const allPending = [...existingPending, ...triggeredActions]

    // Save to database
    await prisma.encounter.update({
      where: { id },
      data: {
        pendingActions: JSON.stringify(allPending)
      }
    })

    // Broadcast AoO triggered event via WebSocket
    broadcastToEncounter(id, {
      type: 'aoo_triggered',
      data: {
        encounterId: id,
        triggeredActions,
        actorId,
        triggerType
      }
    })

    const response = buildEncounterResponse(record, combatants, {
      pendingOutOfTurnActions: allPending
    })

    return {
      success: true,
      data: {
        triggeredActions,
        encounter: response
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to detect AoO triggers'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
