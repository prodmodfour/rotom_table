/**
 * POST /api/encounters/:id/priority
 *
 * Declare a Priority action for a combatant.
 * PTU p.228: Priority actions are declared between turns.
 *
 * Variants:
 * - Standard: full turn immediately, must not have acted, 1/round.
 *   The combatant is inserted into the turn order and takes a full turn.
 *   Their original position in the turn order is skipped (hasActed=true after).
 *
 * - Limited: only the Priority action (Standard Action consumed),
 *   rest of turn at normal initiative. Must not have acted, 1/round.
 *
 * - Advanced: only the Priority action. Can be used even if already acted.
 *   If the combatant had already acted, they forfeit their next round turn
 *   (skipNextRound = true). 1/round.
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
import {
  canUsePriority,
  applyStandardPriority,
  applyLimitedPriority,
  applyAdvancedPriority
} from '~/server/services/out-of-turn.service'
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
  const { combatantId, variant, actionDescription } = body as {
    combatantId: string
    variant: 'standard' | 'limited' | 'advanced'
    actionDescription?: string
  }

  if (!combatantId) {
    throw createError({
      statusCode: 400,
      message: 'combatantId is required'
    })
  }

  if (!variant || !['standard', 'limited', 'advanced'].includes(variant)) {
    throw createError({
      statusCode: 400,
      message: 'variant must be "standard", "limited", or "advanced"'
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

    // Validate eligibility
    const eligibility = canUsePriority(combatant, variant)
    if (!eligibility.allowed) {
      throw createError({
        statusCode: 400,
        message: `Cannot use Priority: ${eligibility.reason}`
      })
    }

    // Apply the Priority action based on variant
    let updatedCombatant: typeof combatant
    let turnInserted = false
    let skipNextRound = false
    const turnOrder: string[] = JSON.parse(record.turnOrder)
    let currentTurnIndex = record.currentTurnIndex

    switch (variant) {
      case 'standard': {
        updatedCombatant = applyStandardPriority(combatant)
        // Insert the combatant's full turn at the current position
        turnOrder.splice(currentTurnIndex, 0, combatantId)
        turnInserted = true
        break
      }
      case 'limited': {
        updatedCombatant = applyLimitedPriority(combatant)
        // No turn insertion — Standard Action consumed, rest of turn at normal initiative
        break
      }
      case 'advanced': {
        updatedCombatant = applyAdvancedPriority(combatant)
        skipNextRound = updatedCombatant.skipNextRound === true
        break
      }
      default:
        throw createError({ statusCode: 400, message: 'Invalid variant' })
    }

    // Update combatants array immutably
    const updatedCombatants = combatants.map(c =>
      c.id === combatantId ? updatedCombatant : c
    )

    const combatantName = getEntityName(combatant)

    // Add move log entry for the Priority declaration
    const moveLog = JSON.parse(record.moveLog || '[]')
    const { v4: uuidv4 } = await import('uuid')
    moveLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      round: record.currentRound,
      actorId: combatant.id,
      actorName: combatantName,
      moveName: `Priority (${variant.charAt(0).toUpperCase() + variant.slice(1)})`,
      damageClass: 'Status',
      actionType: 'priority',
      targets: [],
      notes: actionDescription || `${combatantName} declared a ${variant} Priority action`
    })

    // Save to database
    const updateData: Record<string, unknown> = {
      combatants: JSON.stringify(updatedCombatants),
      moveLog: JSON.stringify(moveLog)
    }
    if (turnInserted) {
      updateData.turnOrder = JSON.stringify(turnOrder)
      updateData.currentTurnIndex = currentTurnIndex
    }

    await prisma.encounter.update({
      where: { id },
      data: updateData
    })

    // Broadcast priority declared via WebSocket
    broadcastToEncounter(id, {
      type: 'priority_declared',
      data: {
        encounterId: id,
        combatantId,
        combatantName,
        variant,
        turnInserted,
        skipNextRound,
        actionDescription
      }
    })

    const response = buildEncounterResponse(record, updatedCombatants, {
      moveLog,
      ...(turnInserted && { turnOrder, currentTurnIndex })
    })

    return {
      success: true,
      data: {
        encounter: response,
        turnInserted,
        skipNextRound
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to declare Priority action'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
