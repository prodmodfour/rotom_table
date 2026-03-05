/**
 * Update status conditions on a combatant
 */
import {
  loadEncounter, findCombatant, saveEncounterCombatants,
  buildEncounterResponse, reorderInitiativeAfterSpeedChange, saveInitiativeReorder
} from '~/server/services/encounter.service'
import { updateStatusConditions, validateStatusConditions, type ConditionSource } from '~/server/services/combatant.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { getStatusCsEffect } from '~/constants/statusConditions'
import { findImmuneStatuses } from '~/utils/typeStatusImmunity'
import { findNaturewalkImmuneStatuses, getCombatantNaturewalks } from '~/utils/combatantCapabilities'
import type { StatusCondition, ConditionSourceType, Pokemon, TerrainCell } from '~/types'

const VALID_SOURCE_TYPES: ConditionSourceType[] = [
  'move', 'ability', 'terrain', 'weather', 'item', 'environment', 'manual', 'system', 'unknown'
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

  // Must have add or remove array
  if (!body.add && !body.remove) {
    throw createError({
      statusCode: 400,
      message: 'Either add or remove array is required'
    })
  }

  // Validate status conditions
  const addStatuses: StatusCondition[] = body.add || []
  const removeStatuses: StatusCondition[] = body.remove || []

  validateStatusConditions([...addStatuses, ...removeStatuses])

  try {
    const { record, combatants } = await loadEncounter(id)
    const combatant = findCombatant(combatants, body.combatantId)

    // Decree-012: Check type-based status immunities for Pokemon targets
    // Reject immune statuses unless override: true is passed
    if (addStatuses.length > 0 && combatant.type === 'pokemon') {
      const pokemonEntity = combatant.entity as Pokemon
      const entityTypes = pokemonEntity.types as string[]
      const immuneStatuses = findImmuneStatuses(entityTypes, addStatuses)

      if (immuneStatuses.length > 0 && !body.override) {
        const messages = immuneStatuses.map(({ status, immuneType }) =>
          `${immuneType}-type Pokemon are immune to ${status}`
        )
        throw createError({
          statusCode: 409,
          message: messages.join('; '),
          data: {
            immune: immuneStatuses,
            hint: 'Send override: true to force application (GM override)'
          }
        })
      }
    }

    // PTU p.276: Naturewalk grants immunity to Slowed/Stuck on matching terrain.
    // Check if the combatant is on terrain that matches their Naturewalk.
    // Applies to both Pokemon (species Naturewalk) and trainers (Survivalist class
    // feature PTU p.149, or equipment-granted Naturewalk like Snow Boots/Jungle Boots).
    // Like type immunity, this can be overridden by the GM.
    if (addStatuses.length > 0) {
      const terrainCells: TerrainCell[] = record.terrainEnabled
        ? (JSON.parse(record.terrainState || '{}').cells ?? [])
        : []
      const naturewalkImmune = findNaturewalkImmuneStatuses(
        combatant, addStatuses, terrainCells, record.terrainEnabled
      )

      if (naturewalkImmune.length > 0 && !body.override) {
        const naturewalks = getCombatantNaturewalks(combatant)
        const nwLabel = naturewalks.length > 0 ? naturewalks.join(', ') : 'matching terrain'
        const messages = naturewalkImmune.map(s =>
          `Naturewalk (${nwLabel}) grants immunity to ${s} on this terrain`
        )
        throw createError({
          statusCode: 409,
          message: messages.join('; '),
          data: {
            naturewalkImmune,
            hint: 'Send override: true to force application (GM override)'
          }
        })
      }
    }

    // Extract optional condition source metadata (decree-047)
    let conditionSource: ConditionSource | undefined
    if (body.source) {
      if (!body.source.type || !VALID_SOURCE_TYPES.includes(body.source.type)) {
        throw createError({
          statusCode: 400,
          message: `Invalid source type: ${body.source.type}. Valid types: ${VALID_SOURCE_TYPES.join(', ')}`
        })
      }
      if (!body.source.label || typeof body.source.label !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'source.label must be a non-empty string'
        })
      }
      conditionSource = { type: body.source.type, label: body.source.label }
    }

    // Update status conditions using service (auto-applies/reverses CS per decree-005)
    const statusResult = updateStatusConditions(combatant, addStatuses, removeStatuses, conditionSource)

    // Track Badly Poisoned escalation round (P0 tick damage)
    // Initialize to 1 when adding, reset to 0 when removing
    if (statusResult.added.includes('Badly Poisoned')) {
      combatant.badlyPoisonedRound = 1
    }
    if (statusResult.removed.includes('Badly Poisoned')) {
      combatant.badlyPoisonedRound = 0
    }

    // Sync both status conditions AND stage modifiers to database
    // (stages may have changed due to auto-CS from status conditions)
    await syncEntityToDatabase(combatant, {
      statusConditions: statusResult.current,
      stageModifiers: combatant.entity.stageModifiers
    })

    // Decree-006: Check if any added/removed status affects Speed CS
    // If so, trigger initiative reorder on the active encounter
    const allChangedStatuses = [...statusResult.added, ...statusResult.removed]
    const speedCsAffected = allChangedStatuses.some(s => {
      const effect = getStatusCsEffect(s)
      return effect?.stat === 'speed'
    })

    let initiativeReorder = null

    if (speedCsAffected && record.isActive) {
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
        await saveInitiativeReorder(id, combatants, reorder)
        initiativeReorder = reorder
      } else {
        await saveEncounterCombatants(id, combatants)
      }
    } else {
      await saveEncounterCombatants(id, combatants)
    }

    const response = buildEncounterResponse(record, combatants, initiativeReorder ? {
      turnOrder: initiativeReorder.turnOrder,
      trainerTurnOrder: initiativeReorder.trainerTurnOrder,
      pokemonTurnOrder: initiativeReorder.pokemonTurnOrder,
      currentTurnIndex: initiativeReorder.currentTurnIndex
    } : undefined)

    return {
      success: true,
      data: response,
      statusChange: {
        combatantId: body.combatantId,
        added: statusResult.added,
        removed: statusResult.removed,
        current: statusResult.current,
        stageChanges: statusResult.stageChanges
      },
      initiativeReorder: initiativeReorder ? {
        changed: true,
        turnOrder: initiativeReorder.turnOrder,
        currentTurnIndex: initiativeReorder.currentTurnIndex
      } : null
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to update status conditions'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
