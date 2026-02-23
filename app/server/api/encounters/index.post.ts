import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const encounter = await prisma.encounter.create({
      data: {
        name: body.name || 'New Encounter',
        battleType: body.battleType || 'trainer',
        weather: body.weather ?? null,
        combatants: '[]',
        currentRound: 1,
        currentTurnIndex: 0,
        turnOrder: '[]',
        isActive: false,
        isPaused: false,
        isServed: false,
        gridEnabled: body.gridEnabled ?? true,
        gridWidth: body.gridWidth ?? 20,
        gridHeight: body.gridHeight ?? 15,
        gridCellSize: body.gridCellSize ?? 40,
        gridBackground: body.gridBackground ?? null,
        moveLog: '[]',
        defeatedEnemies: '[]',
        significanceMultiplier: body.significanceMultiplier ?? 1.0,
        significanceTier: body.significanceTier ?? 'insignificant'
      }
    })

    const response = buildEncounterResponse(encounter, [])

    return { success: true, data: response }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create encounter'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
