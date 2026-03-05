/**
 * POST /api/encounters/:id/aoo-resolve
 *
 * Resolve a pending AoO action (accept or decline).
 *
 * When accepted:
 * - The reactor's outOfTurnUsage.aooUsed is set to true
 * - If damageRoll is provided, the Struggle Attack is applied to the trigger
 * - A MoveLogEntry is created for the AoO Struggle Attack
 *
 * When declined:
 * - The pending action is marked as declined
 * - No other effects
 *
 * PTU p.241: Struggle Attack is AC 4, 1d8+6, Physical, Typeless, Melee.
 * The triggering action is NOT cancelled regardless of AoO result.
 */
import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { loadEncounter, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
import { resolveAoOAction, canUseAoO, getStruggleAttackStats } from '~/server/services/out-of-turn.service'
import { calculateDamage, applyDamageToEntity, applyFaintStatus } from '~/server/services/combatant.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { checkSoulstealer, applySoulstealerHealing } from '~/server/services/living-weapon.service'
import { broadcastToEncounter } from '~/server/utils/websocket'
import { checkDeath } from '~/utils/injuryMechanics'
import type { OutOfTurnAction, StatusCondition } from '~/types/combat'
import type { MoveLogEntry } from '~/types/encounter'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  const body = await readBody(event)
  const { actionId, resolution, damageRoll } = body as {
    actionId: string
    resolution: 'accept' | 'decline'
    damageRoll?: number
  }

  if (!actionId || !resolution) {
    throw createError({
      statusCode: 400,
      message: 'actionId and resolution are required'
    })
  }

  if (resolution !== 'accept' && resolution !== 'decline') {
    throw createError({
      statusCode: 400,
      message: 'resolution must be "accept" or "decline"'
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

    const pendingActions: OutOfTurnAction[] = JSON.parse(record.pendingActions || '[]')

    // Find the action to resolve
    const action = pendingActions.find(a => a.id === actionId)
    if (!action) {
      throw createError({
        statusCode: 404,
        message: 'Pending AoO action not found'
      })
    }

    if (action.status !== 'pending') {
      throw createError({
        statusCode: 400,
        message: `Action is already ${action.status}`
      })
    }

    // Re-validate reactor eligibility before accepting (CRIT-001)
    // The reactor may have fainted or gained a blocking condition since the AoO was triggered
    const accepted = resolution === 'accept'
    if (accepted) {
      const reactor = combatants.find(c => c.id === action.actorId)
      if (reactor) {
        const eligibility = canUseAoO(reactor)
        if (!eligibility.allowed) {
          throw createError({
            statusCode: 400,
            message: `Cannot execute AoO: ${eligibility.reason}`
          })
        }
      }
    }

    // Resolve the action (updates pending actions and combatant usage)
    let { updatedActions, updatedCombatants } = resolveAoOAction(
      pendingActions,
      combatants,
      actionId,
      accepted
    )

    // Build the response data
    const responseData: Record<string, unknown> = {
      resolution
    }

    const moveLog = JSON.parse(record.moveLog || '[]')

    // If accepted, process the Struggle Attack
    if (accepted) {
      const reactor = updatedCombatants.find(c => c.id === action.actorId)
      const trigger = updatedCombatants.find(c => c.id === action.triggerId)

      if (reactor && trigger) {
        const reactorName = getEntityName(reactor)
        const triggerName = getEntityName(trigger)
        const isLeagueBattle = record.battleType === 'trainer'

        // Apply damage if provided
        let hitResult = true
        let damageAmount = 0

        if (damageRoll !== undefined && damageRoll > 0) {
          damageAmount = damageRoll

          const damageResult = calculateDamage(
            damageAmount,
            trigger.entity.currentHp,
            trigger.entity.maxHp,
            trigger.entity.temporaryHp || 0,
            trigger.entity.injuries || 0
          )

          applyDamageToEntity(trigger, damageResult)

          // Death check after AoO damage
          const deathResult = checkDeath(
            trigger.entity.currentHp,
            trigger.entity.maxHp,
            trigger.entity.injuries || 0,
            isLeagueBattle
          )

          if (deathResult.isDead) {
            const conditions: StatusCondition[] = trigger.entity.statusConditions || []
            if (!conditions.includes('Dead')) {
              trigger.entity.statusConditions = ['Dead', ...conditions.filter((s: StatusCondition) => s !== 'Dead')]
            }
          }

          // Sync damage to database
          await syncEntityToDatabase(trigger, {
            currentHp: trigger.entity.currentHp,
            temporaryHp: trigger.entity.temporaryHp,
            injuries: trigger.entity.injuries,
            statusConditions: trigger.entity.statusConditions
          })

          responseData.struggleAttack = {
            actorId: reactor.id,
            targetId: trigger.id,
            damage: damageAmount,
            hit: hitResult,
            fainted: damageResult.fainted,
            isDead: deathResult.isDead
          }

          // Apply faint status if trigger target fainted (MED-002)
          if (damageResult.fainted) {
            applyFaintStatus(trigger)

            // P2: Soulstealer healing for the reactor (PTU p.2417, feature-005)
            const soulstealCheck = checkSoulstealer(reactor, true)
            if (soulstealCheck?.triggered) {
              const healing = applySoulstealerHealing(reactor, soulstealCheck.isKill)
              responseData.soulstealer = {
                actorId: reactor.id,
                hpHealed: healing.hpHealed,
                injuriesRemoved: healing.injuriesRemoved,
              }
              await syncEntityToDatabase(reactor, {
                currentHp: reactor.entity.currentHp,
                injuries: reactor.entity.injuries,
              })
            }
          }
        }

        // Auto-decline remaining pending AoOs for fainted trigger target (MED-002)
        // If the trigger target fainted from this Struggle Attack, other reactors
        // with pending AoOs targeting the same trigger should be auto-declined
        if (trigger.entity.currentHp <= 0) {
          const faintedTriggerId = trigger.id
          const hasPendingForFainted = updatedActions.some(
            a => a.triggerId === faintedTriggerId && a.status === 'pending'
          )
          if (hasPendingForFainted) {
            updatedActions = updatedActions.map(a => {
              if (a.triggerId === faintedTriggerId && a.status === 'pending') {
                return { ...a, status: 'declined' as const }
              }
              return a
            })
          }
        }

        // Determine Struggle Attack stats based on Combat skill (PTU p.240)
        const struggleStats = getStruggleAttackStats(reactor)
        const statsNote = struggleStats.isExpert
          ? 'AC 3, DB 5 (Expert+ Combat)'
          : 'AC 4, DB 4'

        // Add move log entry for the AoO
        const logEntry: MoveLogEntry = {
          id: uuidv4(),
          timestamp: new Date(),
          round: record.currentRound,
          actorId: reactor.id,
          actorName: reactorName,
          moveName: 'Attack of Opportunity',
          damageClass: 'Physical',
          actionType: 'free',
          targets: [{
            id: trigger.id,
            name: triggerName,
            hit: hitResult,
            damage: damageAmount > 0 ? damageAmount : undefined,
            injury: damageAmount > 0 ? undefined : undefined
          }],
          notes: `Struggle Attack (${statsNote}). Triggered by: ${action.triggerDescription}`
        }

        moveLog.push(logEntry)
      }
    }

    // Save to database
    await prisma.encounter.update({
      where: { id },
      data: {
        pendingActions: JSON.stringify(updatedActions),
        combatants: JSON.stringify(updatedCombatants),
        moveLog: JSON.stringify(moveLog)
      }
    })

    // Broadcast resolution via WebSocket
    broadcastToEncounter(id, {
      type: 'aoo_resolved',
      data: {
        encounterId: id,
        actionId,
        resolution,
        ...responseData
      }
    })

    const response = buildEncounterResponse(record, updatedCombatants, {
      pendingOutOfTurnActions: updatedActions,
      moveLog
    })

    return {
      success: true,
      data: {
        encounter: response,
        ...responseData
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to resolve AoO action'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
