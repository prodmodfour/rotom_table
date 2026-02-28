import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse, sortByInitiativeWithRollOff } from '~/server/services/encounter.service'
import { resetSceneUsage } from '~/utils/moveFrequency'
import type { Combatant } from '~/types'
import type { Move, Pokemon } from '~/types/character'

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

    const combatants: Combatant[] = JSON.parse(encounter.combatants)

    if (combatants.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Cannot start encounter with no combatants'
      })
    }

    // Reset turn state and scene-frequency moves for all combatants (immutable)
    const dbUpdates: Promise<unknown>[] = []
    const readyCombatants = combatants.map((c) => {
      const baseTurnState = {
        hasActed: false,
        standardActionUsed: false,
        shiftActionUsed: false,
        swiftActionUsed: false,
        canBeCommanded: true,
        isHolding: false
      }

      const baseUpdates = {
        ...c,
        hasActed: false,
        actionsRemaining: 2,
        shiftActionsRemaining: 1,
        turnState: baseTurnState
      }

      // Reset scene-frequency usage for Pokemon (new encounter = new scene)
      if (c.type === 'pokemon') {
        const entity = c.entity as Pokemon
        const moves: Move[] = entity.moves || []
        const resetMoves = resetSceneUsage(moves)
        const movesChanged = !resetMoves.every((m, i) => m === moves[i])

        if (movesChanged && c.entityId) {
          dbUpdates.push(
            prisma.pokemon.update({
              where: { id: c.entityId },
              data: { moves: JSON.stringify(resetMoves) }
            })
          )
        }

        return {
          ...baseUpdates,
          entity: movesChanged
            ? { ...entity, moves: resetMoves }
            : entity
        }
      }

      return baseUpdates
    })

    let turnOrder: string[] = []
    let trainerTurnOrder: string[] = []
    let pokemonTurnOrder: string[] = []
    let currentPhase: 'trainer_declaration' | 'trainer_resolution' | 'pokemon' = 'pokemon'

    if (encounter.battleType === 'trainer') {
      // League Battle (PTU): Declaration phase then Pokemon phase
      // Declaration: trainers declare low→high speed (slowest first, fastest reacts)
      // Pokemon: act high→low speed

      const trainers = readyCombatants.filter((c) => c.type === 'human')
      const pokemon = readyCombatants.filter((c) => c.type === 'pokemon')

      // Sort trainers by initiative (low→high for declaration order)
      const sortedTrainersDeclaration = sortByInitiativeWithRollOff(trainers, false)
      // Sort pokemon by initiative (high→low for action order)
      const sortedPokemon = sortByInitiativeWithRollOff(pokemon, true)

      trainerTurnOrder = sortedTrainersDeclaration.map((c) => c.id)
      pokemonTurnOrder = sortedPokemon.map((c) => c.id)

      if (trainers.length > 0) {
        // Start with trainer declaration phase (low→high speed)
        turnOrder = [...trainerTurnOrder]
        currentPhase = 'trainer_declaration'
      } else {
        // No trainers — skip straight to pokemon phase
        turnOrder = [...pokemonTurnOrder]
        currentPhase = 'pokemon'
      }

    } else {
      // Full Contact / Wild Encounter: Everyone in initiative order (high→low)
      const sortedCombatants = sortByInitiativeWithRollOff(readyCombatants, true)
      turnOrder = sortedCombatants.map((c) => c.id)
      currentPhase = 'pokemon' // Phase doesn't matter for full contact
    }

    // Persist any scene-frequency move resets
    if (dbUpdates.length > 0) {
      await Promise.all(dbUpdates)
    }

    await prisma.encounter.update({
      where: { id },
      data: {
        isActive: true,
        isPaused: false,
        currentRound: 1,
        currentTurnIndex: 0,
        turnOrder: JSON.stringify(turnOrder),
        currentPhase,
        trainerTurnOrder: JSON.stringify(trainerTurnOrder),
        pokemonTurnOrder: JSON.stringify(pokemonTurnOrder),
        combatants: JSON.stringify(readyCombatants),
        declarations: JSON.stringify([]),
        switchActions: JSON.stringify([])
      }
    })

    const response = buildEncounterResponse(encounter, readyCombatants, {
      isActive: true,
      isPaused: false,
      currentRound: 1,
      currentTurnIndex: 0,
      turnOrder,
      trainerTurnOrder,
      pokemonTurnOrder,
      currentPhase,
      declarations: [],
      switchActions: []
    })

    return { success: true, data: response }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to start encounter'
    })
  }
})
