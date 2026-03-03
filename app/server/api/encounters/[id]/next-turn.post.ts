/**
 * POST /api/encounters/:id/next-turn
 *
 * Advances the encounter to the next combatant's turn.
 * For League Battles (decree-021): declaration -> resolution -> pokemon -> new round
 * For Full Contact: standard linear turn progression
 *
 * Also applies Heavily Injured HP penalty when a combatant ends their turn
 * IF they used a Standard Action this turn (PTU p.250).
 *
 * Tick damage (Burn, Poison, Badly Poisoned, Cursed) is processed at turn end
 * before advancing to the next combatant (PTU p.246-247, decree-032).
 *
 * Weather damage (Hail, Sandstorm) is processed at the START of the incoming
 * combatant's turn (PTU pp.341-342). Type and ability immunities apply.
 */
import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { calculateDamage, applyDamageToEntity, applyFaintStatus } from '~/server/services/combatant.service'
import { getTickDamageEntries, getCombatantName } from '~/server/services/status-automation.service'
import type { TickDamageResult } from '~/server/services/status-automation.service'
import { broadcastToEncounter } from '~/server/utils/websocket'
import { expirePendingActions, cleanupResolvedActions, checkHoldQueue } from '~/server/services/out-of-turn.service'
import { checkHeavilyInjured, applyHeavilyInjuredPenalty, checkDeath } from '~/utils/injuryMechanics'
import { clearMountOnFaint } from '~/server/services/mounting.service'
import { getWeatherTickForCombatant } from '~/server/services/weather-automation.service'
import type { WeatherTickResult } from '~/server/services/weather-automation.service'
import { isDamagingWeather } from '~/utils/weatherRules'
import {
  resetResolvingTrainerTurnState,
  resetAllTrainersForResolution,
  resetCombatantsForNewRound,
  skipFaintedTrainers,
  skipUndeclaredTrainers,
  skipUncommandablePokemon,
  decrementWeather
} from '~/server/utils/turn-helpers'
import type { TrainerDeclaration } from '~/types/combat'
import type { StatusCondition } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    if (!encounter.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter is not active'
      })
    }

    let combatants = JSON.parse(encounter.combatants)
    let turnOrder = JSON.parse(encounter.turnOrder)
    let currentTurnIndex = encounter.currentTurnIndex
    let currentRound = encounter.currentRound
    let currentPhase = encounter.currentPhase || 'pokemon'
    const trainerTurnOrder = JSON.parse(encounter.trainerTurnOrder || '[]')
    const pokemonTurnOrder = JSON.parse(encounter.pokemonTurnOrder || '[]')

    // Weather duration tracking
    let weather = encounter.weather
    let weatherDuration = encounter.weatherDuration ?? 0
    let weatherSource = encounter.weatherSource

    // Track whether to clear declarations (only on new round start)
    let clearDeclarations = false

    // Mark current combatant as having acted and clear temp conditions (Sprint, Tripped, etc.)
    // During declaration phase, trainers are just declaring — still mark as acted for turn progression
    const currentCombatantId = turnOrder[currentTurnIndex]
    const currentCombatant = combatants.find((c: any) => c.id === currentCombatantId)
    const isLeagueBattle = encounter.battleType === 'trainer'
    // Track heavily injured data for response
    let heavilyInjuredPenalty: { combatantId: string; hpLost: number; isDead: boolean; deathCause: string | null } | null = null

    if (currentCombatant) {
      currentCombatant.hasActed = true
      currentCombatant.actionsRemaining = 0
      currentCombatant.shiftActionsRemaining = 0
      // Clear temporary conditions that last "until next turn"
      // Skip during declaration phase — declaration is NOT the trainer's actual turn.
      // Temp conditions persist through declaration and are cleared during resolution.
      if (currentPhase !== 'trainer_declaration') {
        currentCombatant.tempConditions = []
      }

      // Clear Disengage flag at turn end (only lasts for the current turn's shift)
      // Section D2: disengaged cleared on turn end
      if (currentPhase !== 'trainer_declaration') {
        currentCombatant.disengaged = false
      }

      // --- Heavily Injured penalty on Standard Action (PTU p.250) ---
      // "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action
      // during combat... they lose HP equal to the number of Injuries they
      // currently have." Only applies when a Standard Action was actually used
      // this turn (not just any turn end). Skip declaration phase entirely.
      const standardActionUsed = currentCombatant.turnState?.standardActionUsed === true
      if (currentPhase !== 'trainer_declaration' && standardActionUsed) {
        const entity = currentCombatant.entity
        const injuries = entity?.injuries || 0
        const hiCheck = checkHeavilyInjured(injuries)

        if (hiCheck.isHeavilyInjured && entity && entity.currentHp > 0) {
          const penalty = applyHeavilyInjuredPenalty(entity.currentHp, injuries)
          entity.currentHp = penalty.newHp

          // Check if this caused fainting (decree-005: must clear persistent/volatile
          // conditions and reverse their CS effects)
          if (penalty.newHp === 0) {
            applyFaintStatus(currentCombatant)
          }

          // Death check after heavily injured penalty
          const deathResult = checkDeath(
            entity.currentHp,
            entity.maxHp,
            injuries,
            isLeagueBattle,
            penalty.unclampedHp
          )

          if (deathResult.isDead) {
            const conditions: StatusCondition[] = entity.statusConditions || []
            if (!conditions.includes('Dead')) {
              entity.statusConditions = ['Dead', ...conditions.filter((s: StatusCondition) => s !== 'Dead')]
            }
          }

          // Sync HP, status, and stage changes to database
          // Include stageModifiers when faint occurred (decree-005: CS effects reversed)
          if (penalty.hpLost > 0 && currentCombatant.entityId) {
            await syncEntityToDatabase(currentCombatant, {
              currentHp: entity.currentHp,
              statusConditions: entity.statusConditions,
              ...(penalty.newHp === 0 && entity.stageModifiers ? { stageModifiers: entity.stageModifiers } : {})
            })
          }

          heavilyInjuredPenalty = {
            combatantId: currentCombatantId,
            hpLost: penalty.hpLost,
            isDead: deathResult.isDead,
            deathCause: deathResult.cause
          }
        }
      }
    }

    // --- Tick damage processing at turn end (PTU p.246-247) ---
    // Burn/Poison: fire every turn (took or prevented from Standard Action).
    // Cursed: fire ONLY when Standard Action was actually taken (decree-032).
    // Badly Poisoned: escalating damage, supersedes Poisoned.
    // Skip during declaration phase (declaration is not a real turn).
    const tickResults: TickDamageResult[] = []

    if (currentCombatant && currentPhase !== 'trainer_declaration' && currentCombatant.entity.currentHp > 0) {
      const standardActionTaken = currentCombatant.turnState?.standardActionUsed ?? false
      const tickEntries = getTickDamageEntries(currentCombatant, standardActionTaken)

      for (const entry of tickEntries) {
        // Check again — a previous tick entry may have caused fainting (E2)
        if (currentCombatant.entity.currentHp <= 0) break

        const damageResult = calculateDamage(
          entry.damage,
          currentCombatant.entity.currentHp,
          currentCombatant.entity.maxHp,
          currentCombatant.entity.temporaryHp || 0,
          currentCombatant.entity.injuries || 0
        )

        applyDamageToEntity(currentCombatant, damageResult)

        tickResults.push({
          combatantId: currentCombatant.id,
          combatantName: getCombatantName(currentCombatant),
          condition: entry.condition,
          damage: entry.damage,
          formula: entry.formula,
          newHp: damageResult.newHp,
          injuryGained: damageResult.injuryGained,
          fainted: damageResult.fainted,
          escalationRound: entry.escalationRound
        })

        // Sync tick damage to database
        await syncEntityToDatabase(currentCombatant, {
          currentHp: currentCombatant.entity.currentHp,
          temporaryHp: currentCombatant.entity.temporaryHp,
          injuries: currentCombatant.entity.injuries,
          statusConditions: currentCombatant.entity.statusConditions,
          ...(damageResult.injuryGained ? { lastInjuryTime: new Date() } : {})
        })
      }

      // Increment Badly Poisoned escalation counter for next turn
      if (currentCombatant.entity.statusConditions?.includes('Badly Poisoned')) {
        currentCombatant.badlyPoisonedRound = (currentCombatant.badlyPoisonedRound || 1) + 1
      }
    }

    // Auto-dismount on faint from tick damage or heavily injured penalty (feature-004)
    if (currentCombatant && currentCombatant.entity.currentHp === 0 && currentCombatant.mountState) {
      const gridWidth = encounter.gridWidth || 20
      const gridHeight = encounter.gridHeight || 20
      const mountFaintResult = clearMountOnFaint(combatants, currentCombatantId, gridWidth, gridHeight)
      if (mountFaintResult.dismounted) {
        combatants = mountFaintResult.combatants
      }
    }

    // Move to next turn
    currentTurnIndex++

    // --- Hold Queue check (P1 — PTU p.227) ---
    // After each turn ends, check if any held combatant's target initiative has been reached.
    // If so, flag the hold release for response (the GM can call release-hold to insert them).
    let holdQueue = JSON.parse(encounter.holdQueue || '[]') as Array<{
      combatantId: string; holdUntilInitiative: number | null
    }>
    let holdReleaseTriggered: Array<{ combatantId: string }> = []

    if (holdQueue.length > 0 && currentTurnIndex < turnOrder.length) {
      const nextCombatantId = turnOrder[currentTurnIndex]
      const nextCombatant = combatants.find((c: any) => c.id === nextCombatantId)
      const nextInit = nextCombatant?.initiative ?? 0

      holdReleaseTriggered = checkHoldQueue(holdQueue, nextInit)
    }

    // Parse declarations for edge case handling (fainted trainers, missing declarations)
    const declarations: TrainerDeclaration[] = JSON.parse(encounter.declarations || '[]')

    if (isLeagueBattle) {
      // League Battle: three-phase turn progression (decree-021)
      // trainer_declaration (low→high) → trainer_resolution (high→low) → pokemon (high→low) → new round

      // Auto-skip fainted trainers during declaration phase (edge case H1)
      if (currentPhase === 'trainer_declaration') {
        currentTurnIndex = skipFaintedTrainers(currentTurnIndex, turnOrder, combatants)
      }
      // Auto-skip trainers with no declaration during resolution phase (edge case H1)
      if (currentPhase === 'trainer_resolution') {
        currentTurnIndex = skipUndeclaredTrainers(currentTurnIndex, turnOrder, declarations, currentRound)
      }
      // Auto-skip Pokemon that cannot be commanded this round (P1 Section G)
      // PTU p.229: switched-in Pokemon in League Battles cannot act unless forced/fainted switch
      if (currentPhase === 'pokemon') {
        currentTurnIndex = skipUncommandablePokemon(currentTurnIndex, turnOrder, combatants)
      }

      if (currentTurnIndex >= turnOrder.length) {
        if (currentPhase === 'trainer_declaration') {
          // Declaration phase done → transition to RESOLUTION phase
          if (trainerTurnOrder.length > 0) {
            // Resolution order: reverse of declaration order (high-to-low speed)
            const resolutionOrder = [...trainerTurnOrder].reverse()
            currentPhase = 'trainer_resolution'
            turnOrder = resolutionOrder
            currentTurnIndex = 0

            // Reset hasActed for ALL trainers entering resolution phase.
            // Declaration marked them as acted for turn progression, but resolution
            // is their actual turn — clear hasActed so UI doesn't show them as already acted.
            resetAllTrainersForResolution(combatants, resolutionOrder)

            // Skip trainers with no declaration at the start of resolution phase
            currentTurnIndex = skipUndeclaredTrainers(currentTurnIndex, turnOrder, declarations, currentRound)

            if (currentTurnIndex >= turnOrder.length) {
              // All trainers skipped (all fainted) → go straight to pokemon phase
              if (pokemonTurnOrder.length > 0) {
                currentPhase = 'pokemon'
                turnOrder = [...pokemonTurnOrder]
                currentTurnIndex = 0
                // Skip uncommandable Pokemon at start of pokemon phase (P1 Section G)
                currentTurnIndex = skipUncommandablePokemon(currentTurnIndex, turnOrder, combatants)
              } else {
                // No pokemon either → new round
                currentRound++
                currentTurnIndex = 0
                clearDeclarations = true
                resetCombatantsForNewRound(combatants)
                ;({ weather, weatherDuration, weatherSource } = decrementWeather(weather, weatherDuration, weatherSource))
              }
            } else {
              // Give the first resolving trainer full action economy
              resetResolvingTrainerTurnState(combatants, turnOrder[currentTurnIndex])
            }
          } else {
            // No trainers with declarations → skip to pokemon
            if (pokemonTurnOrder.length > 0) {
              currentPhase = 'pokemon'
              turnOrder = [...pokemonTurnOrder]
              currentTurnIndex = 0
              // Skip uncommandable Pokemon at start of pokemon phase (P1 Section G)
              currentTurnIndex = skipUncommandablePokemon(currentTurnIndex, turnOrder, combatants)
            } else {
              // No trainers, no pokemon → new round
              currentRound++
              currentTurnIndex = 0
              clearDeclarations = true
              resetCombatantsForNewRound(combatants)
              ;({ weather, weatherDuration, weatherSource } = decrementWeather(weather, weatherDuration, weatherSource))
            }
          }
        } else if (currentPhase === 'trainer_resolution') {
          // Resolution phase done → transition to Pokemon phase
          if (pokemonTurnOrder.length > 0) {
            currentPhase = 'pokemon'
            turnOrder = [...pokemonTurnOrder]
            currentTurnIndex = 0
            // Skip uncommandable Pokemon at start of pokemon phase (P1 Section G)
            currentTurnIndex = skipUncommandablePokemon(currentTurnIndex, turnOrder, combatants)
          } else {
            // No Pokemon → start new round with trainer declarations
            currentPhase = trainerTurnOrder.length > 0 ? 'trainer_declaration' : 'pokemon'
            turnOrder = trainerTurnOrder.length > 0 ? [...trainerTurnOrder] : [...pokemonTurnOrder]
            currentTurnIndex = 0
            currentRound++
            clearDeclarations = true
            resetCombatantsForNewRound(combatants)
            ;({ weather, weatherDuration, weatherSource } = decrementWeather(weather, weatherDuration, weatherSource))

            // If starting a new declaration phase, skip fainted trainers at the start
            if (currentPhase === 'trainer_declaration') {
              currentTurnIndex = skipFaintedTrainers(currentTurnIndex, turnOrder, combatants)
            }
          }
        } else {
          // Pokemon phase done → new round starts with trainer declarations
          currentTurnIndex = 0
          currentRound++
          clearDeclarations = true
          resetCombatantsForNewRound(combatants)

          if (trainerTurnOrder.length > 0) {
            currentPhase = 'trainer_declaration'
            turnOrder = [...trainerTurnOrder]
          } else {
            currentPhase = 'pokemon'
            turnOrder = [...pokemonTurnOrder]
          }

          // Skip fainted trainers at the start of a new declaration phase
          if (currentPhase === 'trainer_declaration') {
            currentTurnIndex = skipFaintedTrainers(currentTurnIndex, turnOrder, combatants)
          }

          ;({ weather, weatherDuration, weatherSource } = decrementWeather(weather, weatherDuration, weatherSource))
        }
      } else if (currentPhase === 'trainer_resolution') {
        // Mid-resolution: reset the next resolving trainer's turn state
        // so they can execute their declared action
        resetResolvingTrainerTurnState(combatants, turnOrder[currentTurnIndex])
      }
    } else {
      // Full Contact: standard linear turn progression
      if (currentTurnIndex >= turnOrder.length) {
        currentTurnIndex = 0
        currentRound++
        resetCombatantsForNewRound(combatants);
        ({ weather, weatherDuration, weatherSource } = decrementWeather(weather, weatherDuration, weatherSource))
      }
    }

    // Track defeated enemies for XP calculation
    let defeatedEnemies = JSON.parse(encounter.defeatedEnemies)
    const trackDefeated = (combatant: any) => {
      if (combatant.side === 'enemies') {
        const entityName = combatant.type === 'pokemon'
          ? (combatant.entity as { nickname?: string; species: string }).nickname || (combatant.entity as { species: string }).species
          : (combatant.entity as { name: string }).name
        defeatedEnemies = [
          ...defeatedEnemies,
          { species: entityName, level: combatant.entity.level, type: combatant.type }
        ]
      }
    }

    // Check if heavily injured penalty defeated the current combatant
    if (heavilyInjuredPenalty && currentCombatant) {
      const isFainted = currentCombatant.entity.currentHp === 0
      if (isFainted || heavilyInjuredPenalty.isDead) {
        trackDefeated(currentCombatant)
      }
    }

    // Check if tick damage defeated the current combatant
    for (const tick of tickResults) {
      if (tick.fainted) {
        const tickCombatant = combatants.find((c: any) => c.id === tick.combatantId)
        if (tickCombatant) {
          trackDefeated(tickCombatant)
        }
        break // Only one combatant takes tick damage per turn
      }
    }

    // P2 (feature-020): Consume action forfeit flags on the new current combatant's turn start.
    // PTU p.276: target of a healing item forfeits their next Standard + Shift Action.
    // The forfeit is applied here (turn start) so the combatant begins with those actions already used.
    let actionForfeitApplied = false
    if (currentTurnIndex < turnOrder.length) {
      const newCurrentId = turnOrder[currentTurnIndex]
      const newCurrent = combatants.find((c: any) => c.id === newCurrentId)
      if (newCurrent && newCurrent.turnState) {
        if (newCurrent.turnState.forfeitStandardAction) {
          newCurrent.turnState = {
            ...newCurrent.turnState,
            standardActionUsed: true,
            forfeitStandardAction: false
          }
          actionForfeitApplied = true
        }
        if (newCurrent.turnState.forfeitShiftAction) {
          newCurrent.turnState = {
            ...newCurrent.turnState,
            shiftActionUsed: true,
            forfeitShiftAction: false
          }
          actionForfeitApplied = true
        }
      }
    }

    // --- Weather tick damage at turn START (PTU pp.341-342) ---
    // Hail: 1 tick to non-Ice (immune: Ice Body, Snow Cloak, Snow Warning, Overcoat)
    // Sandstorm: 1 tick to non-Ground/Rock/Steel (immune: Sand Veil, Sand Rush, Sand Force, Desert Weather, Overcoat)
    // Skip during declaration phase (declaration is not a real turn).
    let weatherTickResult: WeatherTickResult | null = null

    if (currentPhase !== 'trainer_declaration' && weather && isDamagingWeather(weather) && currentTurnIndex < turnOrder.length) {
      const newCurrentId = turnOrder[currentTurnIndex]
      const newCurrent = combatants.find((c: any) => c.id === newCurrentId)

      if (newCurrent && newCurrent.entity.currentHp > 0) {
        const { shouldApply, tick } = getWeatherTickForCombatant(
          newCurrent,
          weather,
          combatants
        )

        if (shouldApply && tick) {
          // Apply damage using existing combatant.service functions
          const weatherDamageResult = calculateDamage(
            tick.amount,
            newCurrent.entity.currentHp,
            newCurrent.entity.maxHp,
            newCurrent.entity.temporaryHp || 0,
            newCurrent.entity.injuries || 0
          )

          applyDamageToEntity(newCurrent, weatherDamageResult)

          // Fill in post-damage fields
          tick.newHp = weatherDamageResult.newHp
          tick.injuryGained = weatherDamageResult.injuryGained
          tick.fainted = weatherDamageResult.fainted

          weatherTickResult = tick

          // Handle faint
          if (weatherDamageResult.fainted) {
            applyFaintStatus(newCurrent)
            // Auto-dismount if mounted
            if (newCurrent.mountState) {
              const gridWidth = encounter.gridWidth || 20
              const gridHeight = encounter.gridHeight || 20
              const mountFaintResult = clearMountOnFaint(combatants, newCurrentId, gridWidth, gridHeight)
              if (mountFaintResult.dismounted) {
                combatants = mountFaintResult.combatants
              }
            }
            // Track defeated
            trackDefeated(newCurrent)
          }

          // Sync to database
          await syncEntityToDatabase(newCurrent, {
            currentHp: newCurrent.entity.currentHp,
            temporaryHp: newCurrent.entity.temporaryHp,
            injuries: newCurrent.entity.injuries,
            statusConditions: newCurrent.entity.statusConditions,
            ...(weatherDamageResult.injuryGained ? { lastInjuryTime: new Date() } : {})
          })
        } else if (tick) {
          // Immune -- include in response for GM awareness
          weatherTickResult = tick
        }
      }
    }

    const updateData: Record<string, unknown> = {
      currentTurnIndex,
      currentRound,
      currentPhase,
      turnOrder: JSON.stringify(turnOrder),
      combatants: JSON.stringify(combatants),
      defeatedEnemies: JSON.stringify(defeatedEnemies),
      weather,
      weatherDuration,
      weatherSource
    }

    if (clearDeclarations) {
      updateData.declarations = JSON.stringify([])
      updateData.switchActions = JSON.stringify([])

      // Clear hold queue at round end (F5: unheld actions at round end are lost)
      holdQueue = []
      updateData.holdQueue = JSON.stringify([])

      // Expire pending out-of-turn actions from the previous round (Section D3)
      // and clean up resolved/declined/expired actions from past rounds (MED-004)
      const pendingActions = JSON.parse(encounter.pendingActions || '[]')
      if (pendingActions.length > 0) {
        const expiredActions = expirePendingActions(pendingActions, encounter.currentRound)
        const cleanedActions = cleanupResolvedActions(expiredActions, currentRound)
        updateData.pendingActions = JSON.stringify(cleanedActions)
      }
    }

    // Add tick damage events to move log
    if (tickResults.length > 0) {
      const moveLog = JSON.parse(encounter.moveLog || '[]')
      for (const tick of tickResults) {
        moveLog.push({
          id: uuidv4(),
          timestamp: new Date(),
          round: encounter.currentRound,
          actorId: tick.combatantId,
          actorName: tick.combatantName,
          moveName: `${tick.condition} Tick`,
          damageClass: 'Status',
          targets: [{
            id: tick.combatantId,
            name: tick.combatantName,
            hit: true,
            damage: tick.damage,
            injury: tick.injuryGained
          }],
          notes: tick.formula
        })
      }
      updateData.moveLog = JSON.stringify(moveLog)
    }

    // Add weather tick damage to move log
    if (weatherTickResult && weatherTickResult.effect === 'damage') {
      const moveLog = JSON.parse((updateData.moveLog as string) || encounter.moveLog || '[]')
      moveLog.push({
        id: uuidv4(),
        timestamp: new Date(),
        round: currentRound,
        actorId: weatherTickResult.combatantId,
        actorName: weatherTickResult.combatantName,
        moveName: `${weather === 'hail' ? 'Hail' : 'Sandstorm'} Damage`,
        damageClass: 'Status',
        targets: [{
          id: weatherTickResult.combatantId,
          name: weatherTickResult.combatantName,
          hit: true,
          damage: weatherTickResult.amount,
          injury: weatherTickResult.injuryGained
        }],
        notes: weatherTickResult.formula
      })
      updateData.moveLog = JSON.stringify(moveLog)
    }

    const updatedRecord = await prisma.encounter.update({
      where: { id },
      data: updateData
    })

    // Broadcast tick damage events via WebSocket
    for (const tick of tickResults) {
      broadcastToEncounter(id, {
        type: 'status_tick',
        data: {
          encounterId: id,
          combatantId: tick.combatantId,
          combatantName: tick.combatantName,
          condition: tick.condition,
          damage: tick.damage,
          newHp: tick.newHp,
          fainted: tick.fainted,
          formula: tick.formula
        }
      })
    }

    // Broadcast weather tick damage via WebSocket
    if (weatherTickResult && weatherTickResult.effect === 'damage') {
      broadcastToEncounter(id, {
        type: 'status_tick',
        data: {
          encounterId: id,
          combatantId: weatherTickResult.combatantId,
          combatantName: weatherTickResult.combatantName,
          condition: weather === 'hail' ? 'Hail' : 'Sandstorm',
          damage: weatherTickResult.amount,
          newHp: weatherTickResult.newHp,
          fainted: weatherTickResult.fainted,
          formula: weatherTickResult.formula
        }
      })
    }

    const response = buildEncounterResponse(updatedRecord, combatants, {
      ...(clearDeclarations && { declarations: [], switchActions: [] }),
      ...(updateData.moveLog && { moveLog: JSON.parse(updateData.moveLog as string) }),
      defeatedEnemies
    })

    return {
      success: true,
      data: response,
      ...(heavilyInjuredPenalty && { heavilyInjuredPenalty }),
      ...(tickResults.length > 0 && { tickDamage: tickResults }),
      ...(holdReleaseTriggered.length > 0 && { holdReleaseTriggered }),
      ...(actionForfeitApplied && { actionForfeitApplied }),
      ...(weatherTickResult && { weatherTick: weatherTickResult })
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to advance turn'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
