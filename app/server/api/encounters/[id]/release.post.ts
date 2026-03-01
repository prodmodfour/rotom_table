/**
 * POST /api/encounters/:id/release
 *
 * Release one or two Pokemon onto the field as separate actions.
 * PTU p.229: "Recall and Release actions can also be taken individually
 * by a Trainer as Shift Actions."
 *
 * 1 Pokemon = Shift Action
 * 2 Pokemon = Standard Action
 *
 * P2 Section L: Tracks release_only SwitchActions for Section N pair detection.
 * P2 Section K: Applies immediate-act logic for Full Contact battles.
 * P2 Section N: Detects recall+release pair for League restriction.
 */

import { prisma } from '~/server/utils/prisma'
import {
  loadEncounter,
  buildEncounterResponse,
  getEntityName
} from '~/server/services/encounter.service'
import { buildPokemonEntityFromRecord } from '~/server/services/entity-builder.service'
import { buildCombatantFromEntity } from '~/server/services/combatant.service'
import { sizeToTokenSize, buildOccupiedCellsSet } from '~/server/services/grid-placement.service'
import {
  insertIntoTurnOrder,
  hasInitiativeAlreadyPassed,
  findAdjacentPosition,
  markActionUsed,
  checkRecallReleasePair,
  canSwitchedPokemonBeCommanded
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

  const { trainerId, pokemonEntityIds, positions } = body

  if (!trainerId || !Array.isArray(pokemonEntityIds) || pokemonEntityIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'trainerId and pokemonEntityIds (non-empty array) are required'
    })
  }

  if (pokemonEntityIds.length > 2) {
    throw createError({
      statusCode: 400,
      message: 'Cannot release more than 2 Pokemon at once'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const turnOrder: string[] = JSON.parse(record.turnOrder || '[]')
    const trainerTurnOrder: string[] = JSON.parse(record.trainerTurnOrder || '[]')
    const pokemonTurnOrder: string[] = JSON.parse(record.pokemonTurnOrder || '[]')
    const existingSwitchActions: SwitchAction[] = JSON.parse(record.switchActions || '[]')
    const currentPhase = record.currentPhase || 'pokemon'
    const isLeague = record.battleType === 'trainer'
    const isFullContact = record.battleType === 'full_contact'

    // ==============================
    // VALIDATION
    // ==============================

    // 1. Encounter must be active
    if (!record.isActive) {
      throw createError({ statusCode: 400, message: 'Encounter is not active' })
    }

    // 2. Trainer combatant exists (type = 'human')
    const trainer = combatants.find(c => c.id === trainerId)
    if (!trainer || trainer.type !== 'human') {
      throw createError({ statusCode: 404, message: 'Trainer combatant not found' })
    }

    // 2b. Turn validation: current combatant must be the trainer or one of their Pokemon
    // PTU p.229: release can only be performed "on either the Trainer's or the Pokemon's Initiative"
    const currentTurnCombatantId = turnOrder[record.currentTurnIndex]
    if (currentTurnCombatantId) {
      const isTrainerTurn = currentTurnCombatantId === trainerId
      const isOwnedPokemonTurn = combatants.some(c =>
        c.id === currentTurnCombatantId &&
        c.type === 'pokemon' &&
        (c.entity as { ownerId?: string }).ownerId === trainer.entityId
      )
      if (!isTrainerTurn && !isOwnedPokemonTurn) {
        throw createError({
          statusCode: 400,
          message: 'Release can only be performed on the trainer\'s or their Pokemon\'s turn'
        })
      }
    }

    // 3. Section N: Cannot release a Pokemon that was recalled this round
    const pairCheckBefore = checkRecallReleasePair(existingSwitchActions, trainerId, record.currentRound)
    for (const entityId of pokemonEntityIds) {
      if (pairCheckBefore.recalledEntityIds.includes(entityId)) {
        throw createError({
          statusCode: 400,
          message: 'Cannot release a Pokemon that was recalled this same round'
        })
      }
    }

    // 4-6. Validate each Pokemon entity
    const pokemonRecords = []
    for (const entityId of pokemonEntityIds) {
      const pokemonRecord = await prisma.pokemon.findUnique({
        where: { id: entityId }
      })

      if (!pokemonRecord) {
        throw createError({ statusCode: 404, message: `Pokemon ${entityId} not found` })
      }

      // Must belong to trainer
      if (pokemonRecord.ownerId !== trainer.entityId) {
        throw createError({ statusCode: 400, message: 'Pokemon does not belong to this trainer' })
      }

      // Must not already be in encounter
      const alreadyIn = combatants.some(c => c.entityId === entityId)
      if (alreadyIn) {
        throw createError({ statusCode: 400, message: 'Pokemon is already in the encounter' })
      }

      // Must not be fainted
      if (pokemonRecord.currentHp <= 0) {
        throw createError({ statusCode: 400, message: 'Cannot release a fainted Pokemon' })
      }

      pokemonRecords.push(pokemonRecord)
    }

    // 7-9. Action availability
    const actionType = pokemonEntityIds.length === 1 ? 'shift' : 'standard'
    if (actionType === 'shift' && trainer.turnState.shiftActionUsed) {
      throw createError({ statusCode: 400, message: 'No Shift Action available for release' })
    }
    if (actionType === 'standard' && trainer.turnState.standardActionUsed) {
      throw createError({ statusCode: 400, message: 'No Standard Action available for double release' })
    }

    // ==============================
    // EXECUTION
    // ==============================

    let currentCombatants = [...combatants]
    let currentTurnOrder = [...turnOrder]
    let currentTrainerOrder = [...trainerTurnOrder]
    let currentPokemonOrder = [...pokemonTurnOrder]
    let currentTurnIndex = record.currentTurnIndex
    const newSwitchActions: SwitchAction[] = []
    const releasedNames: string[] = []
    const releasedCombatantIds: string[] = []

    // Build occupied cells set for placement
    const occupiedCells = buildOccupiedCellsSet(currentCombatants)

    for (let i = 0; i < pokemonRecords.length; i++) {
      const pokemonRecord = pokemonRecords[i]
      const entityId = pokemonEntityIds[i]

      // Build entity and combatant
      const releasedEntity = buildPokemonEntityFromRecord(pokemonRecord)
      const capabilities = pokemonRecord.capabilities
        ? JSON.parse(pokemonRecord.capabilities)
        : {}
      const tokenSize = sizeToTokenSize(capabilities.size)

      // Determine placement position
      let releasePosition = positions?.[i] ?? null
      if (!releasePosition && trainer.position) {
        // Auto-place adjacent to trainer (falls back to grid-wide search)
        releasePosition = findAdjacentPosition(
          trainer.position,
          occupiedCells,
          tokenSize,
          record.gridWidth,
          record.gridHeight,
          trainer.side
        )
      }

      const newCombatant = buildCombatantFromEntity({
        entityType: 'pokemon',
        entityId,
        entity: releasedEntity,
        side: trainer.side,
        position: releasePosition,
        tokenSize
      })

      releasedNames.push(releasedEntity.nickname || releasedEntity.species)
      releasedCombatantIds.push(newCombatant.id)

      // Mark position as occupied for subsequent placements
      if (releasePosition) {
        for (let dx = 0; dx < tokenSize; dx++) {
          for (let dy = 0; dy < tokenSize; dy++) {
            occupiedCells.add(`${releasePosition.x + dx},${releasePosition.y + dy}`)
          }
        }
      }

      // Add to combatants
      currentCombatants = [...currentCombatants, newCombatant]

      // Section K: Determine immediate-act eligibility (Full Contact only)
      const currentCombatantForInit = currentTurnOrder[currentTurnIndex]
        ? currentCombatants.find(c => c.id === currentTurnOrder[currentTurnIndex])
        : null
      const canActImmediately = isFullContact
        && hasInitiativeAlreadyPassed(newCombatant, currentCombatantForInit ?? null)

      // Insert into turn order
      const insertResult = insertIntoTurnOrder(
        newCombatant,
        currentCombatants,
        currentTurnOrder,
        currentTrainerOrder,
        currentPokemonOrder,
        currentTurnIndex,
        record.battleType,
        currentPhase,
        canActImmediately
      )

      currentTurnOrder = insertResult.turnOrder
      currentTrainerOrder = insertResult.trainerTurnOrder.length > 0
        ? insertResult.trainerTurnOrder
        : currentTrainerOrder
      currentPokemonOrder = insertResult.pokemonTurnOrder.length > 0
        ? insertResult.pokemonTurnOrder
        : currentPokemonOrder
      currentTurnIndex = insertResult.currentTurnIndex

      // Build switch action record
      newSwitchActions.push({
        trainerId,
        recalledCombatantId: null,
        recalledEntityId: null,
        releasedCombatantId: newCombatant.id,
        releasedEntityId: entityId,
        actionType: 'release_only',
        actionCost: actionType,
        round: record.currentRound,
        forced: false
      })
    }

    // Mark action as used on trainer
    const updatedTrainer = currentCombatants.find(c => c.id === trainerId)
    if (updatedTrainer) {
      markActionUsed(updatedTrainer, actionType)
    }

    // Build final switch actions array
    const updatedSwitchActions = [...existingSwitchActions, ...newSwitchActions]

    // Section N: Check if recall+release pair now forms a switch
    const pairCheckAfter = checkRecallReleasePair(updatedSwitchActions, trainerId, record.currentRound)
    if (pairCheckAfter.countsAsSwitch && isLeague) {
      // Apply League switch restriction to newly released Pokemon
      for (const releasedEntityId of pairCheckAfter.releasedEntityIds) {
        const released = currentCombatants.find(c => c.entityId === releasedEntityId)
        if (released) {
          const canBeCommanded = canSwitchedPokemonBeCommanded(
            true, // isLeagueBattle
            false, // not fainted switch
            false  // not forced switch
          )
          released.turnState.canBeCommanded = canBeCommanded
        }
      }
    }

    // Persist to DB
    const updatedRecord = await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(currentCombatants),
        turnOrder: JSON.stringify(currentTurnOrder),
        trainerTurnOrder: JSON.stringify(currentTrainerOrder),
        pokemonTurnOrder: JSON.stringify(currentPokemonOrder),
        currentTurnIndex,
        switchActions: JSON.stringify(updatedSwitchActions)
      }
    })

    // Build response
    const trainerName = getEntityName(trainer)
    const responseEncounter = buildEncounterResponse(updatedRecord, currentCombatants, {
      turnOrder: currentTurnOrder,
      trainerTurnOrder: currentTrainerOrder,
      pokemonTurnOrder: currentPokemonOrder,
      currentTurnIndex,
      switchActions: updatedSwitchActions
    })

    // Broadcast
    broadcastToEncounter(id, {
      type: 'pokemon_released',
      data: {
        encounterId: id,
        trainerId,
        trainerName,
        releasedNames,
        releasedCombatantIds,
        actionCost: actionType,
        countsAsSwitch: pairCheckAfter.countsAsSwitch,
        encounter: responseEncounter
      }
    })

    return {
      success: true,
      data: {
        encounter: responseEncounter,
        releaseDetails: {
          trainerName,
          releasedNames,
          releasedCombatantIds,
          actionCost: actionType,
          count: pokemonEntityIds.length,
          countsAsSwitch: pairCheckAfter.countsAsSwitch
        }
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to release Pokemon'
    throw createError({ statusCode: 500, message })
  }
})
