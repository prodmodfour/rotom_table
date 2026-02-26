/**
 * POST /api/pokemon/:id/add-experience
 *
 * Standalone endpoint for manual XP grants and training XP (separate from
 * combat XP distribution which goes through encounters/:id/xp-distribute).
 *
 * Accepts { amount: number }, validates, applies to Pokemon, and returns
 * updated experience + any level-up results.
 *
 * PTU Core p.202: Daily training XP = half Pokemon level + Command Rank bonus.
 * PTU Core p.202-203: Level-up effects and experience chart.
 */
import { prisma } from '~/server/utils/prisma'
import {
  calculateLevelUps,
  MAX_EXPERIENCE
} from '~/utils/experienceCalculation'
import type { XpApplicationResult } from '~/utils/experienceCalculation'
import type { LearnsetEntry } from '~/utils/levelUpCheck'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  // Validate amount
  if (typeof body.amount !== 'number' || !Number.isInteger(body.amount) || body.amount < 1) {
    throw createError({
      statusCode: 400,
      message: 'amount must be a positive integer'
    })
  }

  if (body.amount > MAX_EXPERIENCE) {
    throw createError({
      statusCode: 400,
      message: `amount must not exceed ${MAX_EXPERIENCE} (max total XP for level 100)`
    })
  }

  try {
    // Load the Pokemon
    const pokemon = await prisma.pokemon.findUnique({
      where: { id },
      select: {
        id: true,
        species: true,
        level: true,
        experience: true,
        tutorPoints: true,
        currentHp: true,
        maxHp: true
      }
    })

    if (!pokemon) {
      throw createError({
        statusCode: 404,
        message: 'Pokemon not found'
      })
    }

    // Load learnset from SpeciesData for level-up move detection
    const speciesData = await prisma.speciesData.findUnique({
      where: { name: pokemon.species },
      select: { learnset: true }
    })

    let learnset: LearnsetEntry[] = []
    if (speciesData?.learnset) {
      try {
        learnset = JSON.parse(speciesData.learnset) as LearnsetEntry[]
      } catch {
        learnset = []
      }
    }

    // Calculate level-ups from the XP gain
    const levelResult = calculateLevelUps(
      pokemon.experience,
      pokemon.level,
      body.amount,
      learnset
    )

    // Calculate tutor points gained (levels divisible by 5)
    const tutorPointsGained = levelResult.levelUps.filter(
      lu => lu.tutorPointGained
    ).length

    // Cap experience at max
    const cappedExperience = Math.min(levelResult.newExperience, MAX_EXPERIENCE)

    // PTU Core p.198: maxHp = Level + (HP * 3) + 10
    // When leveling up, the level component increases by 1 per level gained.
    // The HP stat component only changes when stat points are allocated manually.
    const maxHpIncrease = levelResult.levelsGained

    // Preserve "full HP" visual state: if the Pokemon was at full HP before
    // leveling, increase currentHp alongside maxHp so it doesn't appear damaged.
    const wasAtFullHp = pokemon.currentHp >= pokemon.maxHp
    const newMaxHp = pokemon.maxHp + maxHpIncrease

    // Update Pokemon record in DB
    await prisma.pokemon.update({
      where: { id },
      data: {
        experience: cappedExperience,
        level: levelResult.newLevel,
        tutorPoints: pokemon.tutorPoints + tutorPointsGained,
        ...(maxHpIncrease > 0 ? {
          maxHp: newMaxHp,
          ...(wasAtFullHp ? { currentHp: newMaxHp } : {})
        } : {})
      }
    })

    const result: XpApplicationResult = {
      pokemonId: pokemon.id,
      species: pokemon.species,
      ...levelResult
    }

    return {
      success: true,
      data: result
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to add experience'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
