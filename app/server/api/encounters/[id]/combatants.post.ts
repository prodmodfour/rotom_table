import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import { sizeToTokenSize, buildOccupiedCellsSet, findPlacementPosition } from '~/server/services/grid-placement.service'
import { buildPokemonEntityFromRecord, buildHumanEntityFromRecord } from '~/server/services/entity-builder.service'
import { buildCombatantFromEntity } from '~/server/services/combatant.service'
import type { Pokemon, HumanCharacter } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

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

    // Load and transform the entity from DB
    let entity: Pokemon | HumanCharacter
    let tokenSize = 1

    if (body.entityType === 'pokemon') {
      const record = await prisma.pokemon.findUnique({ where: { id: body.entityId } })
      if (!record) {
        throw createError({ statusCode: 404, message: 'Pokemon not found' })
      }
      entity = buildPokemonEntityFromRecord(record)
      const capabilities = record.capabilities ? JSON.parse(record.capabilities) : {}
      tokenSize = sizeToTokenSize(capabilities.size)
    } else {
      const record = await prisma.humanCharacter.findUnique({ where: { id: body.entityId } })
      if (!record) {
        throw createError({ statusCode: 404, message: 'Character not found' })
      }
      entity = buildHumanEntityFromRecord(record)
    }

    // Get existing combatants to calculate position
    const combatants = JSON.parse(encounter.combatants)
    const gridWidth = encounter.gridWidth || 20
    const gridHeight = encounter.gridHeight || 15

    // Auto-place on grid
    const occupiedCells = buildOccupiedCellsSet(combatants)
    const position = findPlacementPosition(occupiedCells, body.side, tokenSize, gridWidth, gridHeight)

    // Build the combatant wrapper with initiative, evasions, and position
    const newCombatant = buildCombatantFromEntity({
      entityType: body.entityType,
      entityId: body.entityId,
      entity,
      side: body.side,
      initiativeBonus: body.initiativeBonus || 0,
      position,
      tokenSize
    })

    combatants.push(newCombatant)

    await prisma.encounter.update({
      where: { id },
      data: { combatants: JSON.stringify(combatants) }
    })

    const response = buildEncounterResponse(encounter, combatants)

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to add combatant'
    throw createError({ statusCode: 500, message })
  }
})
