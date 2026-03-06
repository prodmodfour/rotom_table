/**
 * POST /api/encounters/:id/switch
 *
 * Perform a Pokemon switch (recall one, release another).
 *
 * Three switch modes (P0 + P1):
 * - Standard Switch: costs a Standard Action (P0)
 * - Fainted Switch:  costs a Shift Action, recalled must be fainted (P1, Section H)
 * - Forced Switch:   no action cost, GM-triggered by move effects (P1, Section I)
 *
 * League Battle restriction (P1, Section G):
 * Switched-in Pokemon cannot be commanded for the remainder of the round,
 * UNLESS the switch was forced or was a fainted replacement.
 *
 * PTU p.229: "A Trainer may recall a Pokemon to its Poke Ball or release a Pokemon
 * from its Poke Ball as a Standard Action."
 */

import { prisma } from '~/server/utils/prisma'
import {
  loadEncounter,
  buildEncounterResponse,
  getEntityName
} from '~/server/services/encounter.service'
import { buildPokemonEntityFromRecord } from '~/server/services/entity-builder.service'
import { buildCombatantFromEntity, applyFaintStatus } from '~/server/services/combatant.service'
import { sizeToTokenSize } from '~/server/services/grid-placement.service'
import {
  validateSwitch,
  validateActionAvailability,
  validateFaintedSwitch,
  validateForcedSwitch,
  checkRecallRange,
  removeCombatantFromEncounter,
  insertIntoTurnOrder,
  hasInitiativeAlreadyPassed,
  markActionUsed,
  buildSwitchAction,
  canSwitchedPokemonBeCommanded,
  applyRecallSideEffects
} from '~/server/services/switching.service'
import { clearWieldOnRemoval } from '~/server/services/living-weapon.service'
import { reconstructWieldRelationships } from '~/server/services/living-weapon-state'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { checkHeavilyInjured, applyHeavilyInjuredPenalty, checkDeath } from '~/utils/injuryMechanics'
import { broadcastToEncounter } from '~/server/utils/websocket'
import type { SwitchAction } from '~/types/combat'
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

  const { trainerId, recallCombatantId, releaseEntityId } = body
  const isFaintedSwitch = body.faintedSwitch === true
  const isForcedSwitch = body.forced === true

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
    const isLeague = record.battleType === 'trainer'

    // Load released Pokemon from DB for validation
    const releasedPokemonRecord = await prisma.pokemon.findUnique({
      where: { id: releaseEntityId }
    })

    // ==============================
    // VALIDATION (mode-dependent)
    // ==============================

    if (isForcedSwitch) {
      // Forced switch: separate validation chain (skips action and turn checks, but checks Trapped per decree-039)
      const forcedValidation = validateForcedSwitch({
        encounter: {
          isActive: record.isActive,
          combatants,
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

      if (!forcedValidation.valid) {
        throw createError({
          statusCode: forcedValidation.statusCode || 400,
          message: forcedValidation.error || 'Forced switch validation failed'
        })
      }

      // Range check still applies in Full Contact mode (decree-034)
      const trainerCombatant = combatants.find(c => c.id === trainerId)!
      const recalledCombatant = combatants.find(c => c.id === recallCombatantId)!
      const rangeResult = checkRecallRange(
        trainerCombatant.position,
        recalledCombatant.position,
        isLeague
      )
      if (!rangeResult.inRange) {
        throw createError({
          statusCode: 400,
          message: `Pokemon is out of recall range (${rangeResult.distance}m, max 8m) — forced switch failed`
        })
      }
    } else {
      // Standard or fainted switch: use the P0 validation chain
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

      const trainerCombatant = combatants.find(c => c.id === trainerId)!
      const recalledCombatant = combatants.find(c => c.id === recallCombatantId)!

      // Range check
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

      if (isFaintedSwitch) {
        // Fainted switch: validate shift action availability and fainted state
        const faintedCheck = validateFaintedSwitch(
          recalledCombatant,
          trainerCombatant,
          { turnOrder, currentTurnIndex: record.currentTurnIndex },
          trainerId
        )
        if (!faintedCheck.valid) {
          throw createError({
            statusCode: faintedCheck.statusCode || 400,
            message: faintedCheck.error || 'Fainted switch validation failed'
          })
        }
      } else {
        // Standard switch: validate Standard Action availability
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
      }
    }

    // Re-find combatants after validation (needed for execution)
    const trainerCombatant = combatants.find(c => c.id === trainerId)!
    const recalledCombatant = combatants.find(c => c.id === recallCombatantId)!

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

    // 2b. Auto-disengage Living Weapon on switch recall (feature-005)
    const wieldRelationships = reconstructWieldRelationships(removalResult.combatants)
    const wieldCleanup = clearWieldOnRemoval(removalResult.combatants, wieldRelationships, recallCombatantId)
    // Replace combatants with wield-cleaned version
    const cleanedRemovalResult = { ...removalResult, combatants: wieldCleanup.combatants }

    // 2c. Apply recall side-effects on the recalled Pokemon's DB record
    // PTU p.247-248: volatile conditions cleared, temp HP lost, combat stages reset
    // Source-aware clearing for Other conditions (decree-047)
    await applyRecallSideEffects(recalledCombatant.entityId, recalledCombatant.conditionInstances)

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

    // 4. Apply League Battle switch restriction (P1 — Section G)
    // PTU p.229: switched-in Pokemon cannot be commanded this round
    // unless the switch was forced or was a fainted replacement
    const canBeCommanded = canSwitchedPokemonBeCommanded(isLeague, isFaintedSwitch, isForcedSwitch)
    newCombatant.turnState.canBeCommanded = canBeCommanded

    // 5. Add new combatant to combatants array
    const updatedCombatants = [...cleanedRemovalResult.combatants, newCombatant]

    // 5b. Section K: Determine immediate-act eligibility (Full Contact only)
    // PTU p.229: Released Pokemon whose initiative has already passed may act immediately.
    // Does NOT apply to: fainted switches, League battles, or forced switches.
    const isFullContact = record.battleType === 'full_contact'
    const currentCombatantForInit = cleanedRemovalResult.turnOrder[cleanedRemovalResult.currentTurnIndex]
      ? updatedCombatants.find(c => c.id === cleanedRemovalResult.turnOrder[cleanedRemovalResult.currentTurnIndex])
      : null
    const canActImmediately = isFullContact
      && !isFaintedSwitch
      && hasInitiativeAlreadyPassed(newCombatant, currentCombatantForInit ?? null)

    // 6. Insert into turn order at correct initiative position
    const insertResult = insertIntoTurnOrder(
      newCombatant,
      updatedCombatants,
      cleanedRemovalResult.turnOrder,
      cleanedRemovalResult.trainerTurnOrder,
      cleanedRemovalResult.pokemonTurnOrder,
      cleanedRemovalResult.currentTurnIndex,
      record.battleType,
      currentPhase,
      canActImmediately
    )

    // 7. Build switch action record
    const switchAction = buildSwitchAction({
      trainerId,
      recalledCombatantId,
      recalledEntityId: recalledCombatant.entityId,
      releasedCombatantId: newCombatant.id,
      releasedEntityId: releaseEntityId,
      round: record.currentRound,
      forced: isForcedSwitch,
      faintedSwitch: isFaintedSwitch
    })

    // 8. Mark action as used (mode-dependent)
    let heavilyInjuredHpLoss = 0
    let heavilyInjuredCombatantId: string | null = null
    if (isForcedSwitch) {
      // Forced switch: no action cost — do NOT mark any action as used
    } else if (isFaintedSwitch) {
      // Fainted switch: consume Shift Action on the trainer
      const updatedTrainer = updatedCombatants.find(c => c.id === trainerId)
      if (updatedTrainer) {
        markActionUsed(updatedTrainer, 'shift')
      }
    } else {
      // Standard switch: consume Standard Action on the initiating combatant
      const currentTurnCombatantId = turnOrder[record.currentTurnIndex]
      const isTrainerTurn = currentTurnCombatantId === trainerId
      const initiatingCombatantId = isTrainerTurn ? trainerId : recallCombatantId
      const updatedInitiator = updatedCombatants.find(c => c.id === initiatingCombatantId)
      if (updatedInitiator) {
        markActionUsed(updatedInitiator, 'standard')

        // --- Heavily Injured penalty on Standard Action (PTU p.250, ptu-rule-151) ---
        // "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat,
        // ...they lose Hit Points equal to the number of Injuries they currently have."
        let entity = updatedInitiator.entity
        const injuries = entity.injuries || 0
        const hiCheck = checkHeavilyInjured(injuries)

        if (hiCheck.isHeavilyInjured && entity.currentHp > 0) {
          const penalty = applyHeavilyInjuredPenalty(entity.currentHp, injuries)
          heavilyInjuredHpLoss = penalty.hpLost
          heavilyInjuredCombatantId = initiatingCombatantId
          updatedInitiator.entity = { ...entity, currentHp: penalty.newHp }
          entity = updatedInitiator.entity

          if (penalty.newHp === 0) {
            applyFaintStatus(updatedInitiator)
            entity = updatedInitiator.entity
          }

          const deathResult = checkDeath(
            entity.currentHp, entity.maxHp, injuries,
            isLeague, penalty.unclampedHp
          )

          if (deathResult.isDead) {
            const conditions: StatusCondition[] = entity.statusConditions || []
            if (!conditions.includes('Dead')) {
              updatedInitiator.entity = { ...entity, statusConditions: ['Dead', ...conditions.filter((s: StatusCondition) => s !== 'Dead')] }
              entity = updatedInitiator.entity
            }
          }

          if (penalty.hpLost > 0 && updatedInitiator.entityId) {
            await syncEntityToDatabase(updatedInitiator, {
              currentHp: entity.currentHp,
              statusConditions: entity.statusConditions,
              ...(penalty.newHp === 0 && entity.stageModifiers ? { stageModifiers: entity.stageModifiers } : {})
            })
          }

          updatedInitiator.turnState = {
            ...updatedInitiator.turnState,
            heavilyInjuredPenaltyApplied: true
          }
        }
      }
    }

    // 9. Build final switch actions array
    const updatedSwitchActions = [...existingSwitchActions, switchAction]

    // 10. Persist to DB
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

    // 11. Build response
    const trainerName = getEntityName(trainerCombatant)
    const recalledName = getEntityName(recalledCombatant)
    const releasedName = releasedEntity.nickname || releasedEntity.species

    // Determine the action cost for the response
    const actionCost = isForcedSwitch ? 'none' as const
      : isFaintedSwitch ? 'shift' as const
      : 'standard' as const

    const responseEncounter = buildEncounterResponse(updatedRecord, updatedCombatants, {
      turnOrder: insertResult.turnOrder,
      trainerTurnOrder: insertResult.trainerTurnOrder,
      pokemonTurnOrder: insertResult.pokemonTurnOrder,
      currentTurnIndex: insertResult.currentTurnIndex
    })

    // Section K: canActThisRound combines League command permission with immediate-act
    // Full Contact: canActImmediately means the Pokemon acts right away this round
    // League: canBeCommanded determines if the Pokemon can act during pokemon phase
    const canActThisRound = canBeCommanded || canActImmediately

    // 12. Broadcast WebSocket event
    broadcastToEncounter(id, {
      type: 'pokemon_switched',
      data: {
        encounterId: id,
        trainerId,
        trainerName,
        recalledName,
        releasedName,
        releasedCombatantId: newCombatant.id,
        actionCost,
        canActThisRound,
        canActImmediately,
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
          actionCost,
          rangeToRecalled: 0, // Range already validated above
          releasedInitiative: newCombatant.initiative,
          canActThisRound,
          canActImmediately
        }
      },
      ...(heavilyInjuredHpLoss > 0 && {
        heavilyInjuredPenalty: {
          combatantId: heavilyInjuredCombatantId,
          hpLost: heavilyInjuredHpLoss,
          fainted: updatedCombatants.find(c => c.id === heavilyInjuredCombatantId)?.entity.currentHp === 0
        }
      })
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
