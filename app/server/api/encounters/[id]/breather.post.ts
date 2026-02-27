/**
 * Take a Breather - PTU Full Action (page 245)
 * - Reset all combat stages to 0
 * - Remove Temporary HP
 * - Cure all Volatile status conditions + Slowed and Stuck (except Cursed — requires GM adjudication)
 * - Standard: Apply Tripped + Vulnerable until next turn (stored as tempConditions)
 * - Assisted: Another character uses their Standard Action to help — breather character
 *   becomes Tripped with 0 Evasion (via Tripped + ZeroEvasion tempConditions) instead
 *   of Tripped+Vulnerable. The assistant's Standard Action must be consumed separately by the GM.
 */
import { prisma } from '~/server/utils/prisma'
import {
  loadEncounter, findCombatant, buildEncounterResponse, getEntityName,
  reorderInitiativeAfterSpeedChange, saveInitiativeReorder
} from '~/server/services/encounter.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { createDefaultStageModifiers, reapplyActiveStatusCsEffects } from '~/server/services/combatant.service'
import { computeEquipmentBonuses } from '~/utils/equipmentBonuses'
import { VOLATILE_CONDITIONS } from '~/constants/statusConditions'
import type { StatusCondition, StageSource, HumanCharacter } from '~/types'

// Take a Breather cures all volatile conditions + Slowed and Stuck (PTU 1.05 p.245)
// Exception: Cursed requires the curse source to be KO'd or >12m away (p.245).
// Since the app does not track curse sources, Cursed is excluded from auto-clearing
// and left for the GM to remove manually when the prerequisite is met.
const BREATHER_CURED_CONDITIONS: StatusCondition[] = [
  ...VOLATILE_CONDITIONS.filter(c => c !== 'Cursed'),
  'Slowed',
  'Stuck'
]

/**
 * Build descriptive notes for the breather move log entry.
 */
function buildBreatherNotes(
  result: { tempHpRemoved: number; conditionsCured: string[]; assisted: boolean },
  reappliedSources: StageSource[]
): string {
  const parts = [
    `Reset stages, removed ${result.tempHpRemoved} temp HP`,
    `cured: ${result.conditionsCured.join(', ') || 'none'}`
  ]
  if (reappliedSources.length > 0) {
    const sourceDescs = reappliedSources.map(s => `${s.source} (${s.value >= 0 ? '+' : ''}${s.value} ${s.stat})`)
    parts.push(`re-applied CS: ${sourceDescs.join(', ')}`)
  }
  if (result.assisted) {
    parts.push('ASSISTED: Tripped + Evasion set to 0 (no Vulnerable)')
  } else {
    parts.push('SHIFT REQUIRED: Move away from all enemies using full movement.')
  }
  return parts.join('. ')
}

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

    const assisted = body.assisted === true

    const result = {
      stagesReset: false,
      tempHpRemoved: 0,
      conditionsCured: [] as string[],
      trippedApplied: false,
      vulnerableApplied: false,
      assisted,
      zeroEvasionApplied: false
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
    const speedCsBefore = stages.speed ?? 0
    const hadStages = Object.entries(stages).some(
      ([key, val]) => val !== (defaultStages[key as keyof typeof defaultStages] ?? 0)
    )
    // Always reset stages to defaults (needed for stageSources cleanup even if values happen to match)
    entity.stageModifiers = { ...defaultStages }
    if (hadStages) {
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

    // Re-apply CS effects from surviving status conditions (decree-005)
    // Burn/Paralysis/Poison are persistent and survive Take a Breather.
    // Their inherent CS effects must be re-applied after the stage reset.
    reapplyActiveStatusCsEffects(combatant)

    // Track whether speed CS actually changed after reset+reapply (for initiative reorder)
    const speedCsAfter = entity.stageModifiers?.speed ?? 0
    const speedCsChanged = speedCsBefore !== speedCsAfter

    // Apply penalties (temporary until next turn)
    if (!combatant.tempConditions) {
      combatant.tempConditions = []
    }

    if (assisted) {
      // Assisted breather: Tripped + 0 Evasion instead of Tripped+Vulnerable (PTU p.245)
      // "They then both become Tripped and are treated as having 0 Evasion"
      // ZeroEvasion is a synthetic tempCondition recognized by evasionCalculation.ts
      if (!combatant.tempConditions.includes('Tripped')) {
        combatant.tempConditions = [...combatant.tempConditions, 'Tripped']
        result.trippedApplied = true
      }
      if (!combatant.tempConditions.includes('ZeroEvasion')) {
        combatant.tempConditions = [...combatant.tempConditions, 'ZeroEvasion']
        result.zeroEvasionApplied = true
      }
    } else {
      // Standard breather: Tripped + Vulnerable
      if (!combatant.tempConditions.includes('Tripped')) {
        combatant.tempConditions = [...combatant.tempConditions, 'Tripped']
        result.trippedApplied = true
      }
      if (!combatant.tempConditions.includes('Vulnerable')) {
        combatant.tempConditions = [...combatant.tempConditions, 'Vulnerable']
        result.vulnerableApplied = true
      }
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
      moveName: assisted ? 'Take a Breather (Assisted)' : 'Take a Breather',
      targets: [],
      notes: buildBreatherNotes(result, combatant.stageSources || [])
    })

    // Decree-006: Only reorder initiative if speed CS actually changed
    // after the reset+reapply cycle (avoids spurious tie-breaker re-rolls
    // when only non-speed stages were reset)
    let initiativeReorder = null
    if (speedCsChanged && record.isActive) {
      const turnOrder = JSON.parse(record.turnOrder) as string[]
      const trainerTurnOrder = JSON.parse(record.trainerTurnOrder || '[]') as string[]
      const pokemonTurnOrder = JSON.parse(record.pokemonTurnOrder || '[]') as string[]

      const reorder = reorderInitiativeAfterSpeedChange(
        combatants,
        turnOrder,
        record.currentTurnIndex,
        record.battleType,
        trainerTurnOrder,
        pokemonTurnOrder,
        record.currentPhase
      )

      if (reorder.changed) {
        // Save combatants, move log, AND turn order together
        await prisma.encounter.update({
          where: { id },
          data: {
            combatants: JSON.stringify(combatants),
            moveLog: JSON.stringify(moveLog),
            turnOrder: JSON.stringify(reorder.turnOrder),
            trainerTurnOrder: JSON.stringify(reorder.trainerTurnOrder),
            pokemonTurnOrder: JSON.stringify(reorder.pokemonTurnOrder),
            currentTurnIndex: reorder.currentTurnIndex
          }
        })
        initiativeReorder = reorder
      } else {
        await prisma.encounter.update({
          where: { id },
          data: {
            combatants: JSON.stringify(combatants),
            moveLog: JSON.stringify(moveLog)
          }
        })
      }
    } else {
      await prisma.encounter.update({
        where: { id },
        data: {
          combatants: JSON.stringify(combatants),
          moveLog: JSON.stringify(moveLog)
        }
      })
    }

    const response = buildEncounterResponse(record, combatants, {
      moveLog,
      ...(initiativeReorder ? {
        turnOrder: initiativeReorder.turnOrder,
        trainerTurnOrder: initiativeReorder.trainerTurnOrder,
        pokemonTurnOrder: initiativeReorder.pokemonTurnOrder,
        currentTurnIndex: initiativeReorder.currentTurnIndex
      } : {})
    })

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
