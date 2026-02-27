/**
 * POST /api/encounters/:id/next-turn
 *
 * Advances the encounter to the next combatant's turn.
 * For League Battles (decree-021): declaration -> resolution -> pokemon -> new round
 * For Full Contact: standard linear turn progression
 */
import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'

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
    }

    // Move to next turn
    currentTurnIndex++

    const isLeagueBattle = encounter.battleType === 'trainer'

    if (isLeagueBattle) {
      // League Battle: three-phase turn progression (decree-021)
      // trainer_declaration (low→high) → trainer_resolution (high→low) → pokemon (high→low) → new round
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

            // Give the first resolving trainer full action economy
            resetResolvingTrainerTurnState(combatants, turnOrder[0])
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

    const updatedRecord = await prisma.encounter.update({
      where: { id },
      data: updateData
    })

    const response = buildEncounterResponse(updatedRecord, combatants, {
      ...(clearDeclarations && { declarations: [] })
    })

    return { success: true, data: response }
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
