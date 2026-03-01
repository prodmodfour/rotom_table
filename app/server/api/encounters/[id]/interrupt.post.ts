/**
 * POST /api/encounters/:id/interrupt
 *
 * Declare an Interrupt action for a combatant.
 * PTU p.228: "Interrupt Moves may be declared in the middle of another
 * combatant's turn to allow the user to take an action."
 *
 * P1 provides the generic framework. Specific interrupt actions
 * (Intercept Melee/Ranged) are implemented in P2.
 *
 * The Interrupt is created as a pending OutOfTurnAction for GM resolution
 * (similar to AoO from P0). Once resolved:
 * - If accepted: the reactor's interruptUsed is set to true
 * - If declined: no effect
 *
 * Per spec F3: In League Battles, Pokemon using Interrupt forfeit
 * their next round turn (skipNextRound = true).
 */
import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { loadEncounter, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
import {
  canUseInterrupt,
  createInterruptAction,
  applyInterruptUsage
} from '~/server/services/out-of-turn.service'
import { broadcastToEncounter } from '~/server/utils/websocket'
import type { InterruptTrigger, OutOfTurnAction } from '~/types/combat'

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
    combatantId,
    interruptAction,
    triggerId,
    triggerType,
    resolution,
    context
  } = body as {
    combatantId: string
    interruptAction?: string
    triggerId: string
    triggerType: InterruptTrigger
    resolution?: 'accept' | 'decline'
    context?: {
      moveName?: string
      originalTargetId?: string
      attackerId?: string
    }
  }

  if (!combatantId || !triggerId || !triggerType) {
    throw createError({
      statusCode: 400,
      message: 'combatantId, triggerId, and triggerType are required'
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

    // Find the reactor (interrupting combatant)
    const reactor = combatants.find(c => c.id === combatantId)
    if (!reactor) {
      throw createError({
        statusCode: 404,
        message: 'Reactor combatant not found'
      })
    }

    // Find the trigger combatant
    const trigger = combatants.find(c => c.id === triggerId)
    if (!trigger) {
      throw createError({
        statusCode: 404,
        message: 'Trigger combatant not found'
      })
    }

    // Handle decline before eligibility check (MED-003)
    // Declining an interrupt doesn't require eligibility — it just acknowledges the decline
    if (resolution === 'decline') {
      return {
        success: true,
        data: {
          encounter: buildEncounterResponse(record, combatants),
          interruptResolved: true
        }
      }
    }

    // Validate eligibility (only needed for accept or new pending)
    const eligibility = canUseInterrupt(reactor)
    if (!eligibility.allowed) {
      throw createError({
        statusCode: 400,
        message: `Cannot use Interrupt: ${eligibility.reason}`
      })
    }

    const reactorName = getEntityName(reactor)
    const triggerName = getEntityName(trigger)
    const isLeagueBattle = record.battleType === 'trainer'

    // If resolution is provided directly, this is a direct resolve (GM already decided)
    if (resolution === 'accept') {
      // Apply interrupt usage
      const updatedReactor = applyInterruptUsage(reactor, isLeagueBattle)
      const updatedCombatants = combatants.map(c =>
        c.id === combatantId ? updatedReactor : c
      )

      // Add move log entry
      const moveLog = JSON.parse(record.moveLog || '[]')
      moveLog.push({
        id: uuidv4(),
        timestamp: new Date(),
        round: record.currentRound,
        actorId: reactor.id,
        actorName: reactorName,
        moveName: interruptAction || 'Interrupt',
        damageClass: 'Status',
        actionType: 'interrupt',
        targets: [{
          id: trigger.id,
          name: triggerName,
          hit: true
        }],
        notes: `Interrupt triggered by ${triggerName}${updatedReactor.skipNextRound ? ' (forfeits next round turn)' : ''}`
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
        type: 'interrupt_triggered',
        data: {
          encounterId: id,
          combatantId,
          reactorName,
          triggerId,
          triggerName,
          interruptAction,
          resolved: true,
          accepted: true
        }
      })

      const response = buildEncounterResponse(record, updatedCombatants, { moveLog })

      return {
        success: true,
        data: {
          encounter: response,
          interruptResolved: true
        }
      }
    }

    // No resolution provided — create a pending interrupt action for GM to resolve
    const triggerDescription = interruptAction
      ? `${reactorName} wants to use ${interruptAction} (triggered by ${triggerName})`
      : `${reactorName} wants to interrupt (triggered by ${triggerName})`

    const pendingAction = createInterruptAction(
      combatantId,
      triggerId,
      triggerType,
      triggerDescription,
      record.currentRound,
      context
    )

    // Add to pending actions
    const pendingActions: OutOfTurnAction[] = JSON.parse(record.pendingActions || '[]')
    const updatedPendingActions = [...pendingActions, pendingAction]

    // Save to database
    await prisma.encounter.update({
      where: { id },
      data: {
        pendingActions: JSON.stringify(updatedPendingActions)
      }
    })

    // Broadcast
    broadcastToEncounter(id, {
      type: 'interrupt_triggered',
      data: {
        encounterId: id,
        combatantId,
        reactorName,
        triggerId,
        triggerName,
        interruptAction,
        resolved: false,
        pendingActionId: pendingAction.id
      }
    })

    const response = buildEncounterResponse(record, combatants, {
      pendingOutOfTurnActions: updatedPendingActions
    })

    return {
      success: true,
      data: {
        encounter: response,
        interruptResolved: false,
        pendingActionId: pendingAction.id
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to declare Interrupt'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
