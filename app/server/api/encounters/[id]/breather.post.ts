/**
 * Take a Breather - PTU Full Action (page 245)
 * - Reset all combat stages to 0
 * - Remove Temporary HP
 * - Cure all Volatile status conditions + Slowed and Stuck (except Cursed — requires GM adjudication)
 * - Apply Tripped + Vulnerable until next turn (stored as tempConditions)
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, findCombatant, buildEncounterResponse, getEntityName } from '~/server/services/encounter.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { createDefaultStageModifiers } from '~/server/services/combatant.service'
import { computeEquipmentBonuses } from '~/utils/equipmentBonuses'
import { VOLATILE_CONDITIONS } from '~/constants/statusConditions'
import type { StatusCondition, HumanCharacter } from '~/types'

// Take a Breather cures all volatile conditions + Slowed and Stuck (PTU 1.05 p.245)
// Exception: Cursed requires the curse source to be KO'd or >12m away (p.245).
// Since the app does not track curse sources, Cursed is excluded from auto-clearing
// and left for the GM to remove manually when the prerequisite is met.
const BREATHER_CURED_CONDITIONS: StatusCondition[] = [
  ...VOLATILE_CONDITIONS.filter(c => c !== 'Cursed'),
  'Slowed',
  'Stuck'
]

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
    const entity = combatant.entity

    const result = {
      stagesReset: false,
      tempHpRemoved: 0,
      conditionsCured: [] as string[],
      trippedApplied: false,
      vulnerableApplied: false
    }

    // Reset combat stages to defaults
    // Heavy Armor: speed CS resets to -1 instead of 0 (PTU p.293)
    const defaultStages = createDefaultStageModifiers()
    if (combatant.type === 'human') {
      const human = entity as HumanCharacter
      const equipBonuses = computeEquipmentBonuses(human.equipment ?? {})
      if (equipBonuses.speedDefaultCS !== 0) {
        defaultStages.speed = equipBonuses.speedDefaultCS
      }
    }
    const stages = entity.stageModifiers || createDefaultStageModifiers()
    const hadStages = Object.entries(stages).some(
      ([key, val]) => val !== (defaultStages[key as keyof typeof defaultStages] ?? 0)
    )
    if (hadStages) {
      entity.stageModifiers = defaultStages
      result.stagesReset = true
    }

    // Remove Temporary HP
    if (entity.temporaryHp && entity.temporaryHp > 0) {
      result.tempHpRemoved = entity.temporaryHp
      entity.temporaryHp = 0
    }

    // Cure volatile status conditions
    const currentStatuses: StatusCondition[] = entity.statusConditions || []
    const remainingStatuses: StatusCondition[] = []

    for (const status of currentStatuses) {
      if (BREATHER_CURED_CONDITIONS.includes(status)) {
        result.conditionsCured.push(status)
      } else {
        remainingStatuses.push(status)
      }
    }

    entity.statusConditions = remainingStatuses

    // Apply Tripped and Vulnerable (temporary until next turn)
    if (!combatant.tempConditions) {
      combatant.tempConditions = []
    }
    if (!combatant.tempConditions.includes('Tripped')) {
      combatant.tempConditions = [...combatant.tempConditions, 'Tripped']
      result.trippedApplied = true
    }
    if (!combatant.tempConditions.includes('Vulnerable')) {
      combatant.tempConditions = [...combatant.tempConditions, 'Vulnerable']
      result.vulnerableApplied = true
    }

    // Mark as having used their full action (standard + shift) — PTU p.245
    combatant.turnState = {
      ...combatant.turnState,
      standardActionUsed: true,
      shiftActionUsed: true,
      hasActed: true
    }

    // Sync to database if entity has a record
    await syncEntityToDatabase(combatant, {
      temporaryHp: entity.temporaryHp,
      stageModifiers: entity.stageModifiers,
      statusConditions: entity.statusConditions
    })

    // Add to move log
    const moveLog = JSON.parse(record.moveLog)
    const entityName = getEntityName(combatant)
    moveLog.push({
      id: crypto.randomUUID(),
      round: record.currentRound,
      actorId: body.combatantId,
      actorName: entityName,
      moveName: 'Take a Breather',
      targets: [],
      notes: `Reset stages, removed ${result.tempHpRemoved} temp HP, cured: ${result.conditionsCured.join(', ') || 'none'}. SHIFT REQUIRED: Move away from all enemies using full movement.`
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
      breatherResult: {
        combatantId: body.combatantId,
        ...result
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to take a breather'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
