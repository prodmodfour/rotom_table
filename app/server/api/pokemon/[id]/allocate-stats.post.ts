/**
 * POST /api/pokemon/:id/allocate-stats
 *
 * Allocate stat points to a Pokemon, enforcing the Base Relations Rule.
 *
 * Body (incremental mode):
 *   { stat: 'attack', points: 1 }
 *
 * Body (batch mode):
 *   { statPoints: { hp: 5, attack: 8, defense: 4, ... } }
 *
 * Both modes validate Base Relations before applying.
 * Pass skipBaseRelations: true to bypass validation (for Features that break it).
 *
 * Returns: updated stats + validation result.
 *
 * PTU Core p.198: Base Relations Rule
 * PTU Core p.198: HP formula = Level + (HP stat * 3) + 10
 * Decree-035: Uses nature-adjusted base stats for ordering
 */

import { prisma } from '~/server/utils/prisma'
import { validateBaseRelations, extractStatPoints } from '~/utils/baseRelations'
import type { Stats } from '~/types/character'

const VALID_STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const

function isValidStatKey(key: string): key is typeof VALID_STAT_KEYS[number] {
  return (VALID_STAT_KEYS as readonly string[]).includes(key)
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  // Load the Pokemon
  const pokemon = await prisma.pokemon.findUnique({
    where: { id }
  })

  if (!pokemon) {
    throw createError({
      statusCode: 404,
      message: 'Pokemon not found'
    })
  }

  // Build nature-adjusted base stats from DB fields
  const natureAdjustedBase: Stats = {
    hp: pokemon.baseHp,
    attack: pokemon.baseAttack,
    defense: pokemon.baseDefense,
    specialAttack: pokemon.baseSpAtk,
    specialDefense: pokemon.baseSpDef,
    speed: pokemon.baseSpeed
  }

  // Build current stats from DB fields
  // For currentStats, HP uses the effective HP stat derived from maxHp
  const currentHpStat = Math.round((pokemon.maxHp - pokemon.level - 10) / 3)
  const currentStats: Stats = {
    hp: currentHpStat,
    attack: pokemon.currentAttack,
    defense: pokemon.currentDefense,
    specialAttack: pokemon.currentSpAtk,
    specialDefense: pokemon.currentSpDef,
    speed: pokemon.currentSpeed
  }

  // Extract current allocation
  const currentAllocation = extractStatPoints({
    level: pokemon.level,
    maxHp: pokemon.maxHp,
    baseStats: natureAdjustedBase,
    currentStats
  })

  // Determine proposed allocation
  let proposedStatPoints: Stats

  if (body.stat && typeof body.points === 'number') {
    // Incremental mode: add N points to one stat
    if (!isValidStatKey(body.stat)) {
      throw createError({
        statusCode: 400,
        message: `Invalid stat key: ${body.stat}. Must be one of: ${VALID_STAT_KEYS.join(', ')}`
      })
    }
    if (!Number.isInteger(body.points) || body.points < 1) {
      throw createError({
        statusCode: 400,
        message: 'points must be a positive integer'
      })
    }
    proposedStatPoints = {
      ...currentAllocation.statPoints,
      [body.stat]: currentAllocation.statPoints[body.stat] + body.points
    }
  } else if (body.statPoints) {
    // Batch mode: full allocation
    proposedStatPoints = { ...body.statPoints }

    // Validate all keys are valid and values are non-negative integers
    for (const key of VALID_STAT_KEYS) {
      if (typeof proposedStatPoints[key] !== 'number') {
        throw createError({
          statusCode: 400,
          message: `statPoints.${key} must be a number`
        })
      }
      if (!Number.isInteger(proposedStatPoints[key]) || proposedStatPoints[key] < 0) {
        throw createError({
          statusCode: 400,
          message: `statPoints.${key} must be a non-negative integer`
        })
      }
    }
  } else {
    throw createError({
      statusCode: 400,
      message: 'Body must contain either { stat, points } or { statPoints }'
    })
  }

  // Validate total does not exceed budget
  const proposedTotal = VALID_STAT_KEYS.reduce(
    (sum, key) => sum + proposedStatPoints[key], 0
  )
  const budget = pokemon.level + 10

  if (proposedTotal > budget) {
    throw createError({
      statusCode: 400,
      message: `Stat points (${proposedTotal}) exceed budget (${budget})`
    })
  }

  // Validate Base Relations
  const validation = validateBaseRelations(natureAdjustedBase, proposedStatPoints)

  if (!validation.valid && !body.skipBaseRelations) {
    throw createError({
      statusCode: 400,
      message: `Base Relations violated: ${validation.violations.join('; ')}`
    })
  }

  // Calculate new stats
  const newCalculatedAttack = natureAdjustedBase.attack + proposedStatPoints.attack
  const newCalculatedDefense = natureAdjustedBase.defense + proposedStatPoints.defense
  const newCalculatedSpAtk = natureAdjustedBase.specialAttack + proposedStatPoints.specialAttack
  const newCalculatedSpDef = natureAdjustedBase.specialDefense + proposedStatPoints.specialDefense
  const newCalculatedSpeed = natureAdjustedBase.speed + proposedStatPoints.speed

  const newHpStat = natureAdjustedBase.hp + proposedStatPoints.hp
  const newMaxHp = pokemon.level + (newHpStat * 3) + 10

  // Preserve HP ratio: if at full HP, stay at full HP
  const wasAtFullHp = pokemon.currentHp >= pokemon.maxHp
  const newCurrentHp = wasAtFullHp ? newMaxHp : Math.min(pokemon.currentHp, newMaxHp)

  // Write to DB
  const updated = await prisma.pokemon.update({
    where: { id },
    data: {
      currentAttack: newCalculatedAttack,
      currentDefense: newCalculatedDefense,
      currentSpAtk: newCalculatedSpAtk,
      currentSpDef: newCalculatedSpDef,
      currentSpeed: newCalculatedSpeed,
      maxHp: newMaxHp,
      currentHp: newCurrentHp
    }
  })

  return {
    success: true,
    data: {
      id: updated.id,
      statPoints: proposedStatPoints,
      totalAllocated: proposedTotal,
      budget,
      remainingUnallocated: budget - proposedTotal,
      validation: {
        valid: validation.valid,
        violations: validation.violations,
        tiers: validation.tiers
      },
      newStats: {
        attack: newCalculatedAttack,
        defense: newCalculatedDefense,
        specialAttack: newCalculatedSpAtk,
        specialDefense: newCalculatedSpDef,
        speed: newCalculatedSpeed,
        maxHp: newMaxHp,
        currentHp: newCurrentHp
      }
    }
  }
})
