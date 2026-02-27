import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import { validateSignificanceTier } from '~/server/utils/significance-validation'
import type { Combatant } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  // Validate significance tier if provided
  validateSignificanceTier(body.significanceTier)

  try {
    // Update the encounter with the full state
    const encounter = await prisma.encounter.update({
      where: { id },
      data: {
        name: body.name,
        battleType: body.battleType,
        weather: body.weather ?? null,
        weatherDuration: body.weatherDuration ?? 0,
        weatherSource: body.weatherSource ?? null,
        combatants: JSON.stringify(body.combatants ?? []),
        currentRound: body.currentRound ?? 1,
        currentTurnIndex: body.currentTurnIndex ?? 0,
        turnOrder: JSON.stringify(body.turnOrder ?? []),
        currentPhase: body.currentPhase ?? 'pokemon',
        trainerTurnOrder: JSON.stringify(body.trainerTurnOrder ?? []),
        pokemonTurnOrder: JSON.stringify(body.pokemonTurnOrder ?? []),
        isActive: body.isActive ?? true,
        isPaused: body.isPaused ?? false,
        isServed: body.isServed ?? false,
        gridEnabled: body.gridConfig?.enabled ?? false,
        gridWidth: body.gridConfig?.width ?? 20,
        gridHeight: body.gridConfig?.height ?? 15,
        gridCellSize: body.gridConfig?.cellSize ?? 40,
        gridBackground: body.gridConfig?.background ?? null,
        moveLog: JSON.stringify(body.moveLog ?? []),
        defeatedEnemies: JSON.stringify(body.defeatedEnemies ?? []),
        declarations: JSON.stringify(body.declarations ?? []),
        significanceMultiplier: body.significanceMultiplier ?? 1.0,
        significanceTier: body.significanceTier ?? 'insignificant'
      }
    })

    const combatants = JSON.parse(encounter.combatants) as Combatant[]
    const response = buildEncounterResponse(encounter, combatants)

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to update encounter'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
