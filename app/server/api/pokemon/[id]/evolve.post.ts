/**
 * POST /api/pokemon/:id/evolve
 *
 * Perform a Pokemon evolution. Changes species, types, base stats,
 * calculated stats, maxHp, and currentHp.
 *
 * Input:
 * {
 *   targetSpecies: string,
 *   statPoints: { hp, attack, defense, specialAttack, specialDefense, speed },
 *   skipBaseRelations?: boolean  // GM override
 * }
 *
 * Validation:
 * - Pokemon must exist
 * - Target species must be in evolution triggers for current species
 * - Stat points must total level + 10
 * - Base Relations must be satisfied (unless skipBaseRelations)
 * - Level/held-item requirements must be met
 *
 * PTU Core Chapter 5, p.202
 */
import { performEvolution } from '~/server/services/evolution.service'
import type { Stats } from '~/server/services/evolution.service'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  // Validate targetSpecies
  if (!body.targetSpecies || typeof body.targetSpecies !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'targetSpecies is required and must be a string'
    })
  }

  // Validate statPoints
  if (!body.statPoints || typeof body.statPoints !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'statPoints object is required'
    })
  }

  const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
  for (const key of statKeys) {
    if (typeof body.statPoints[key] !== 'number' || !Number.isInteger(body.statPoints[key])) {
      throw createError({
        statusCode: 400,
        message: `statPoints.${key} must be an integer`
      })
    }
    if (body.statPoints[key] < 0) {
      throw createError({
        statusCode: 400,
        message: `statPoints.${key} cannot be negative`
      })
    }
  }

  const statPoints: Stats = {
    hp: body.statPoints.hp,
    attack: body.statPoints.attack,
    defense: body.statPoints.defense,
    specialAttack: body.statPoints.specialAttack,
    specialDefense: body.statPoints.specialDefense,
    speed: body.statPoints.speed
  }

  try {
    const result = await performEvolution({
      pokemonId: id,
      targetSpecies: body.targetSpecies,
      statPoints,
      skipBaseRelations: body.skipBaseRelations === true
    })

    return {
      success: true,
      data: {
        pokemon: result.pokemon,
        changes: result.changes
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to evolve Pokemon'
    throw createError({
      statusCode: 400,
      message
    })
  }
})
