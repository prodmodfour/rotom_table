/**
 * POST /api/encounters/:id/switch
 *
 * Perform a full Pokemon switch (recall one, release another) as a Standard Action.
 * PTU p.229: "A Trainer may recall a Pokemon to its Poke Ball or release a Pokemon
 * from its Poke Ball as a Standard Action."
 *
 * 10-step validation chain, then execution:
 * 1. Record SwitchAction
 * 2. Capture recalled position
 * 3. Remove recalled from combatants/turn orders
 * 4. Build new combatant from DB entity
 * 5. Place at recalled position
 * 6. Insert into turn order by initiative
 * 7. Mark Standard Action used
 * 8. Persist
 * 9. Broadcast WebSocket event
 */

import { prisma } from '~/server/utils/prisma'
import {
  loadEncounter,
  buildEncounterResponse,
  getEntityName
} from '~/server/services/encounter.service'
import { buildPokemonEntityFromRecord } from '~/server/services/entity-builder.service'
import { buildCombatantFromEntity } from '~/server/services/combatant.service'
import { sizeToTokenSize } from '~/server/services/grid-placement.service'
import {
  validateSwitch,
  validateActionAvailability,
  checkRecallRange,
  removeCombatantFromEncounter,
  insertIntoTurnOrder,
  markActionUsed,
  buildSwitchAction
} from '~/server/services/switching.service'
import { broadcastToEncounter } from '~/server/utils/websocket'
import type { SwitchAction } from '~/types/combat'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  const { trainerId, recallCombatantId, releaseEntityId } = body

  if (!trainerId || !recallCombatantId || !releaseEntityId) {
    throw createError({
      statusCode: 400,
      message: 'trainerId, recallCombatantId, and releaseEntityId are required'
    })
  }

  try {
    // Load encounter from DB
    const { record, combatants } = await loadEncounter(id)
    const turnOrder: string[] = JSON.parse(record.turnOrder || '[]')
    const trainerTurnOrder: string[] = JSON.parse(record.trainerTurnOrder || '[]')
    const pokemonTurnOrder: string[] = JSON.parse(record.pokemonTurnOrder || '[]')
    const existingSwitchActions: SwitchAction[] = JSON.parse(record.switchActions || '[]')
    const currentPhase = record.currentPhase || 'pokemon'

    // Load released Pokemon from DB for validation (step 5)
    const releasedPokemonRecord = await prisma.pokemon.findUnique({
      where: { id: releaseEntityId }
    })

    // Steps 1-8: validation chain
    const validation = validateSwitch({
      encounter: {
        isActive: record.isActive,
        combatants,
        turnOrder,
        currentTurnIndex: record.currentTurnIndex,
        battleType: record.battleType
      },
      trainerId,
      recallCombatantId,
      releaseEntityId,
      releasedPokemonRecord: releasedPokemonRecord ? {
        id: releasedPokemonRecord.id,
        ownerId: releasedPokemonRecord.ownerId,
        currentHp: releasedPokemonRecord.currentHp
      } : null
    })

    if (!validation.valid) {
      throw createError({
        statusCode: validation.statusCode || 400,
        message: validation.error || 'Switch validation failed'
      })
    }

    // Find combatants for further validation
    const trainerCombatant = combatants.find(c => c.id === trainerId)!
    const recalledCombatant = combatants.find(c => c.id === recallCombatantId)!

    // Step 9: Range check
    const isLeague = record.battleType === 'trainer'
    const rangeResult = checkRecallRange(
      trainerCombatant.position,
      recalledCombatant.position,
      isLeague
    )

    if (!rangeResult.inRange) {
      throw createError({
        statusCode: 400,
        message: `Pokemon is out of recall range (${rangeResult.distance}m, max 8m)`
      })
    }

    // Step 10: Action availability
    const actionCheck = validateActionAvailability(
      { turnOrder, currentTurnIndex: record.currentTurnIndex },
      trainerId,
      recallCombatantId,
      trainerCombatant,
      recalledCombatant
    )

    if (!actionCheck.valid) {
      throw createError({
        statusCode: actionCheck.statusCode || 400,
        message: actionCheck.error || 'Action not available'
      })
    }

    // Determine initiating combatant (trainer or pokemon, whoever's turn it is)
    const currentTurnCombatantId = turnOrder[record.currentTurnIndex]
    const isTrainerTurn = currentTurnCombatantId === trainerId
    const initiatingCombatant = isTrainerTurn ? trainerCombatant : recalledCombatant

    // ==============================
    // EXECUTION
    // ==============================

    // 1. Capture recalled Pokemon's grid position for placement
    const recalledPosition = recalledCombatant.position
    const recalledSide = recalledCombatant.side

    // 2. Remove recalled Pokemon from combatants and turn orders
    const removalResult = removeCombatantFromEncounter(
      combatants,
      turnOrder,
      trainerTurnOrder,
      pokemonTurnOrder,
      record.currentTurnIndex,
      recallCombatantId
    )

    // 3. Build new combatant from DB entity
    const releasedEntity = buildPokemonEntityFromRecord(releasedPokemonRecord!)
    const capabilities = releasedPokemonRecord!.capabilities
      ? JSON.parse(releasedPokemonRecord!.capabilities)
      : {}
    const tokenSize = sizeToTokenSize(capabilities.size)

    const releasePosition = body.releasePosition ?? recalledPosition
    const newCombatant = buildCombatantFromEntity({
      entityType: 'pokemon',
      entityId: releaseEntityId,
      entity: releasedEntity,
      side: recalledSide,
      position: releasePosition,
      tokenSize
    })

    // 4. Add new combatant to combatants array
    const updatedCombatants = [...removalResult.combatants, newCombatant]

    // 5. Insert into turn order at correct initiative position
    const insertResult = insertIntoTurnOrder(
      newCombatant,
      updatedCombatants,
      removalResult.turnOrder,
      removalResult.trainerTurnOrder,
      removalResult.pokemonTurnOrder,
      removalResult.currentTurnIndex,
      record.battleType,
      currentPhase
    )

    // 6. Build switch action record
    const switchAction = buildSwitchAction({
      trainerId,
      recalledCombatantId,
      recalledEntityId: recalledCombatant.entityId,
      releasedCombatantId: newCombatant.id,
      releasedEntityId: releaseEntityId,
      round: record.currentRound,
      forced: body.forced ?? false
    })

    // 7. Mark action as used on initiating combatant
    // Find the initiating combatant in the updated array
    const updatedInitiator = updatedCombatants.find(c => c.id === initiatingCombatant.id)
    if (updatedInitiator) {
      markActionUsed(updatedInitiator, 'standard')
    }

    // 8. Build final switch actions array
    const updatedSwitchActions = [...existingSwitchActions, switchAction]

    // 9. Persist to DB
    const updatedRecord = await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(updatedCombatants),
        turnOrder: JSON.stringify(insertResult.turnOrder),
        trainerTurnOrder: JSON.stringify(insertResult.trainerTurnOrder),
        pokemonTurnOrder: JSON.stringify(insertResult.pokemonTurnOrder),
        currentTurnIndex: insertResult.currentTurnIndex,
        switchActions: JSON.stringify(updatedSwitchActions)
      }
    })

    // 10. Build response
    const trainerName = getEntityName(trainerCombatant)
    const recalledName = getEntityName(recalledCombatant)
    const releasedName = releasedEntity.nickname || releasedEntity.species

    // Determine if the new Pokemon can act this round
    const releasedIndex = insertResult.turnOrder.indexOf(newCombatant.id)
    const canActThisRound = releasedIndex > insertResult.currentTurnIndex

    const responseEncounter = buildEncounterResponse(updatedRecord, updatedCombatants, {
      turnOrder: insertResult.turnOrder,
      trainerTurnOrder: insertResult.trainerTurnOrder,
      pokemonTurnOrder: insertResult.pokemonTurnOrder,
      currentTurnIndex: insertResult.currentTurnIndex
    })

    // 11. Broadcast WebSocket event
    broadcastToEncounter(id, {
      type: 'pokemon_switched',
      data: {
        encounterId: id,
        trainerId,
        trainerName,
        recalledName,
        releasedName,
        releasedCombatantId: newCombatant.id,
        actionCost: 'standard',
        encounter: responseEncounter
      }
    })

    return {
      success: true,
      data: {
        encounter: responseEncounter,
        switchDetails: {
          trainerName,
          recalledName,
          releasedName,
          actionCost: 'standard' as const,
          rangeToRecalled: rangeResult.distance,
          releasedInitiative: newCombatant.initiative,
          canActThisRound
        }
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to switch Pokemon'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
