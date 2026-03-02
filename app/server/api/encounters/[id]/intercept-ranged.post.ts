/**
 * POST /api/encounters/:id/intercept-ranged
 *
 * Resolve an Intercept Ranged maneuver (PTU p.242, R117).
 *
 * Trigger: A Ranged single-target attack passes within the interceptor's
 * movement range.
 *
 * The interceptor selects a target square on the line of attack and makes
 * an Acrobatics or Athletics check. They shift floor(check/2) meters
 * toward the target square. If they reach it, they take the attack instead.
 *
 * Consumes Full Action (Standard + Shift) and Interrupt for the round.
 */
import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { loadEncounter, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
import {
  canIntercept,
  checkInterceptLoyalty,
  resolveInterceptRanged,
  getDefaultOutOfTurnUsage
} from '~/server/services/out-of-turn.service'
import { getLineOfAttackCellsMultiTile } from '~/utils/lineOfAttack'
import { broadcastToEncounter } from '~/server/utils/websocket'
import type { OutOfTurnAction } from '~/types/combat'
import type { GridPosition } from '~/types/spatial'

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
    interceptorId,
    targetSquare,
    attackerId,
    actionId,
    skillCheck
  } = body as {
    interceptorId: string
    targetSquare: GridPosition
    attackerId: string
    actionId: string
    skillCheck: number
  }

  if (!interceptorId || !targetSquare || !attackerId || !actionId || skillCheck === undefined) {
    throw createError({
      statusCode: 400,
      message: 'interceptorId, targetSquare, attackerId, actionId, and skillCheck are required'
    })
  }

  if (typeof skillCheck !== 'number' || skillCheck < 0) {
    throw createError({
      statusCode: 400,
      message: 'skillCheck must be a non-negative number'
    })
  }

  if (typeof targetSquare.x !== 'number' || typeof targetSquare.y !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'targetSquare must have numeric x and y coordinates'
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

    // Find participants
    const interceptor = combatants.find(c => c.id === interceptorId)
    const attacker = combatants.find(c => c.id === attackerId)

    if (!interceptor) {
      throw createError({ statusCode: 404, message: 'Interceptor combatant not found' })
    }
    if (!attacker) {
      throw createError({ statusCode: 404, message: 'Attacker combatant not found' })
    }

    // Validate eligibility
    const eligibility = canIntercept(interceptor)
    if (!eligibility.allowed) {
      throw createError({
        statusCode: 400,
        message: `Cannot Intercept Ranged: ${eligibility.reason}`
      })
    }

    // Find the original target from the pending action context
    let pendingActions: OutOfTurnAction[] = JSON.parse(record.pendingActions || '[]')
    const pendingAction = actionId ? pendingActions.find(a => a.id === actionId) : null
    const originalTargetId = pendingAction?.triggerContext?.originalTargetId
    const originalTarget = originalTargetId ? combatants.find(c => c.id === originalTargetId) : null

    // Validate loyalty for Pokemon (if we know the original target)
    if (originalTarget) {
      const loyaltyCheck = checkInterceptLoyalty(interceptor, originalTarget)
      if (!loyaltyCheck.allowed) {
        throw createError({
          statusCode: 400,
          message: `Cannot Intercept Ranged: ${loyaltyCheck.reason}`
        })
      }
    }

    // Validate target square is on the line of attack (G2, center-to-center for multi-tile)
    if (attacker.position && originalTarget?.position) {
      const attackLine = getLineOfAttackCellsMultiTile(
        attacker.position, attacker.tokenSize || 1,
        originalTarget.position, originalTarget.tokenSize || 1
      )
      const isOnLine = attackLine.some(c => c.x === targetSquare.x && c.y === targetSquare.y)
      if (!isOnLine) {
        throw createError({
          statusCode: 400,
          message: 'Target square is not on the line of attack'
        })
      }
    }

    // Resolve the Intercept
    const resolution = resolveInterceptRanged(
      combatants,
      interceptorId,
      targetSquare,
      skillCheck
    )

    const interceptorName = getEntityName(interceptor)
    const attackerName = getEntityName(attacker)
    const originalTargetName = originalTarget ? getEntityName(originalTarget) : 'target'

    // Update pending actions (mark as accepted if actionId provided)
    if (actionId) {
      pendingActions = pendingActions.map(a => {
        if (a.id === actionId) {
          return { ...a, status: 'accepted' as const }
        }
        return a
      })
    }

    // Build move log entry
    const moveLog = JSON.parse(record.moveLog || '[]')
    const successText = resolution.reachedTarget
      ? 'Success -- intercepted the attack.'
      : 'Failed -- did not reach target square.'

    moveLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      round: record.currentRound,
      actorId: interceptorId,
      actorName: interceptorName,
      moveName: 'Intercept Ranged',
      damageClass: 'Status',
      actionType: 'interrupt',
      targets: [{
        id: attackerId,
        name: attackerName,
        hit: resolution.reachedTarget
      }],
      notes: `${interceptorName} attempted to block ranged attack on ${originalTargetName}. Check ${skillCheck}, moved ${resolution.distanceMoved}m. ${successText}`
    })

    // Save to database
    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(resolution.updatedCombatants),
        pendingActions: JSON.stringify(pendingActions),
        moveLog: JSON.stringify(moveLog)
      }
    })

    // Broadcast
    broadcastToEncounter(id, {
      type: 'interrupt_resolved',
      data: {
        encounterId: id,
        maneuver: 'intercept-ranged',
        interceptorId,
        interceptorName,
        attackerId,
        attackerName,
        success: resolution.reachedTarget,
        distanceMoved: resolution.distanceMoved
      }
    })

    const response = buildEncounterResponse(record, resolution.updatedCombatants, {
      moveLog,
      pendingOutOfTurnActions: pendingActions
    })

    return {
      success: true,
      data: {
        encounter: response,
        interceptSuccess: resolution.interceptSuccess,
        distanceMoved: resolution.distanceMoved,
        interceptorNewPosition: resolution.interceptorNewPosition,
        reachedTarget: resolution.reachedTarget
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to resolve Intercept Ranged'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
