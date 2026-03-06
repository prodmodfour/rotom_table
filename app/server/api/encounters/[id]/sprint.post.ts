/**
 * Sprint Maneuver - PTU Standard Action (page 245)
 * - Adds 'Sprint' tempCondition for +50% movement speed until next turn
 * - Persists to database so state survives page refresh
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, findCombatant, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
import { applyFaintStatus } from '~/server/services/combatant.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { checkHeavilyInjured, applyHeavilyInjuredPenalty, checkDeath } from '~/utils/injuryMechanics'
import type { StatusCondition } from '~/types'

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

    // --- Heavily Injured penalty on Standard Action (PTU p.250, ptu-rule-151) ---
    const isLeagueBattle = record.battleType === 'trainer'
    let heavilyInjuredHpLoss = 0
    {
      let entity = combatant.entity
      const injuries = entity.injuries || 0
      const hiCheck = checkHeavilyInjured(injuries)

      if (hiCheck.isHeavilyInjured && entity.currentHp > 0) {
        const penalty = applyHeavilyInjuredPenalty(entity.currentHp, injuries)
        heavilyInjuredHpLoss = penalty.hpLost
        combatant.entity = { ...entity, currentHp: penalty.newHp }
        entity = combatant.entity

        if (penalty.newHp === 0) {
          applyFaintStatus(combatant)
          entity = combatant.entity
        }

        const deathResult = checkDeath(
          entity.currentHp, entity.maxHp, injuries,
          isLeagueBattle, penalty.unclampedHp
        )

        if (deathResult.isDead) {
          const conditions: StatusCondition[] = entity.statusConditions || []
          if (!conditions.includes('Dead')) {
            combatant.entity = { ...entity, statusConditions: ['Dead', ...conditions.filter((s: StatusCondition) => s !== 'Dead')] }
            entity = combatant.entity
          }
        }

        if (penalty.hpLost > 0 && combatant.entityId) {
          await syncEntityToDatabase(combatant, {
            currentHp: entity.currentHp,
            statusConditions: entity.statusConditions,
            ...(penalty.newHp === 0 && entity.stageModifiers ? { stageModifiers: entity.stageModifiers } : {})
          })
        }

        combatant.turnState = {
          ...combatant.turnState,
          heavilyInjuredPenaltyApplied: true
        }
      }
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
      },
      ...(heavilyInjuredHpLoss > 0 && {
        heavilyInjuredPenalty: {
          combatantId: body.combatantId,
          hpLost: heavilyInjuredHpLoss,
          fainted: combatant.entity.currentHp === 0
        }
      })
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
