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
 */
import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { calculateDamage, applyDamageToEntity } from '~/server/services/combatant.service'
import { getTickDamageEntries, getCombatantName } from '~/server/services/status-automation.service'
import type { TickDamageResult } from '~/server/services/status-automation.service'
import { broadcastToEncounter } from '~/server/utils/websocket'
import { checkHeavilyInjured, applyHeavilyInjuredPenalty, checkDeath } from '~/utils/injuryMechanics'
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

    const combatants = JSON.parse(encounter.combatants)
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

          // Check if this caused fainting
          if (penalty.newHp === 0) {
            const conditions: StatusCondition[] = entity.statusConditions || []
            if (!conditions.includes('Fainted')) {
              entity.statusConditions = ['Fainted', ...conditions]
            }
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

          // Sync HP and status changes to database
          if (penalty.hpLost > 0 && currentCombatant.entityId) {
            await syncEntityToDatabase(currentCombatant, {
              currentHp: entity.currentHp,
              statusConditions: entity.statusConditions
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

    // Move to next turn
    currentTurnIndex++

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

    const updateData: Record<string, unknown> = {
      currentTurnIndex,
      currentRound,
      currentPhase,
      turnOrder: JSON.stringify(turnOrder),
      combatants: JSON.stringify(combatants),
      weather,
      weatherDuration,
      weatherSource
    }

    if (clearDeclarations) {
      updateData.declarations = JSON.stringify([])
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

    const response = buildEncounterResponse(updatedRecord, combatants, {
      ...(clearDeclarations && { declarations: [] }),
      ...(tickResults.length > 0 && { moveLog: JSON.parse(updateData.moveLog as string) })
    })

    return {
      success: true,
      data: response,
      ...(heavilyInjuredPenalty && { heavilyInjuredPenalty }),
      ...(tickResults.length > 0 && { tickDamage: tickResults })
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

/**
 * Reset a trainer's turn state during resolution phase so they can execute
 * their declared action. Trainers get fresh action economy during resolution.
 * Acceptable mutation here because combatants are freshly parsed from JSON.
 */
function resetResolvingTrainerTurnState(combatants: any[], combatantId: string) {
  const trainer = combatants.find((c: any) => c.id === combatantId)
  if (trainer) {
    trainer.hasActed = false
    trainer.actionsRemaining = 2
    trainer.shiftActionsRemaining = 1
    // Clear temporary conditions (Sprint, Tripped, etc.) that last "until next turn".
    // These were skipped during declaration phase — the resolution turn is the trainer's actual turn.
    trainer.tempConditions = []
    trainer.turnState = {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false
    }
  }
}

/**
 * Reset hasActed for all trainers entering the resolution phase.
 * Declaration phase marked them as acted for turn progression purposes,
 * but their actual turn is in resolution — clear hasActed so the UI
 * doesn't show them as already acted.
 * Acceptable mutation here because combatants are freshly parsed from JSON.
 */
function resetAllTrainersForResolution(combatants: any[], resolutionOrder: string[]) {
  const trainerIds = new Set(resolutionOrder)
  combatants.forEach((c: any) => {
    if (trainerIds.has(c.id)) {
      c.hasActed = false
    }
  })
}

/**
 * Reset all combatants for a new round by mutating each object in the array.
 * Acceptable here because combatants are freshly parsed from JSON (no shared references).
 */
function resetCombatantsForNewRound(combatants: any[]) {
  combatants.forEach((c: any) => {
    c.hasActed = false
    c.actionsRemaining = 2
    c.shiftActionsRemaining = 1
    c.readyAction = null
    c.turnState = {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false
    }
  })
}

/**
 * Auto-skip fainted trainers during declaration phase (edge case H1).
 * A fainted trainer cannot declare actions. Advances currentTurnIndex
 * past any fainted trainers. Returns the updated index.
 */
function skipFaintedTrainers(
  startIndex: number,
  turnOrder: string[],
  combatants: any[]
): number {
  let index = startIndex
  while (index < turnOrder.length) {
    const combatantId = turnOrder[index]
    const combatant = combatants.find((c: any) => c.id === combatantId)
    // Stop at the first non-fainted trainer (HP > 0)
    if (combatant && combatant.entity.currentHp > 0) break
    index++
  }
  return index
}

/**
 * Auto-skip trainers with no declaration during resolution phase (edge case H1).
 * If a trainer was fainted during declaration (or otherwise has no declaration),
 * they have nothing to resolve. Advances currentTurnIndex past them.
 * Returns the updated index.
 */
function skipUndeclaredTrainers(
  startIndex: number,
  turnOrder: string[],
  declarations: TrainerDeclaration[],
  currentRound: number
): number {
  let index = startIndex
  while (index < turnOrder.length) {
    const combatantId = turnOrder[index]
    const hasDeclaration = declarations.some(
      d => d.combatantId === combatantId && d.round === currentRound
    )
    if (hasDeclaration) break
    index++
  }
  return index
}

/**
 * Decrement weather duration at end of round (PTU: weather lasts N rounds).
 * Returns new weather state without mutating inputs.
 */
function decrementWeather(
  weather: string | null,
  weatherDuration: number,
  weatherSource: string | null
): { weather: string | null; weatherDuration: number; weatherSource: string | null } {
  if (weather && weatherDuration > 0 && weatherSource !== 'manual') {
    const newDuration = weatherDuration - 1
    if (newDuration <= 0) {
      return { weather: null, weatherDuration: 0, weatherSource: null }
    }
    return { weather, weatherDuration: newDuration, weatherSource }
  }
  return { weather, weatherDuration, weatherSource }
}
