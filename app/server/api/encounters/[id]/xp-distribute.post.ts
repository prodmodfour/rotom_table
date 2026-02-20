/**
 * POST /api/encounters/:id/xp-distribute
 *
 * Apply XP to Pokemon after GM approval. This is the write endpoint.
 * Recalculates XP from encounter data to verify client values, validates
 * distribution totals, then updates Pokemon records (experience, level,
 * tutorPoints).
 *
 * Stat points from leveling are NOT auto-applied — the GM/player must
 * manually allocate them. This endpoint only updates experience, level,
 * and tutor points.
 *
 * PTU Core p.460 (XP calculation), p.202-203 (level-up effects).
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter } from '~/server/services/encounter.service'
import {
  calculateEncounterXp,
  calculateLevelUps,
  MAX_EXPERIENCE
} from '~/utils/experienceCalculation'
import type { DefeatedEnemy, XpApplicationResult } from '~/utils/experienceCalculation'
import type { LearnsetEntry } from '~/utils/levelUpCheck'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  // Validate required fields
  if (typeof body.significanceMultiplier !== 'number' || body.significanceMultiplier < 0.5 || body.significanceMultiplier > 10) {
    throw createError({
      statusCode: 400,
      message: 'significanceMultiplier must be a number between 0.5 and 10'
    })
  }

  if (typeof body.playerCount !== 'number' || !Number.isInteger(body.playerCount) || body.playerCount < 1) {
    throw createError({
      statusCode: 400,
      message: 'playerCount must be a positive integer'
    })
  }

  if (!Array.isArray(body.distribution) || body.distribution.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'distribution must be a non-empty array of { pokemonId, xpAmount }'
    })
  }

  // Validate each distribution entry
  for (const entry of body.distribution) {
    if (!entry.pokemonId || typeof entry.pokemonId !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Each distribution entry must have a valid pokemonId'
      })
    }
    if (typeof entry.xpAmount !== 'number' || !Number.isInteger(entry.xpAmount) || entry.xpAmount < 0) {
      throw createError({
        statusCode: 400,
        message: 'Each distribution entry must have a non-negative integer xpAmount'
      })
    }
  }

  try {
    const { record } = await loadEncounter(id)

    // Recalculate XP from encounter data to verify
    const rawDefeatedEnemies: { species: string; level: number; type?: 'pokemon' | 'human' }[] =
      JSON.parse(record.defeatedEnemies)

    const trainerEnemyIds: string[] = body.trainerEnemyIds ?? []

    const defeatedEnemies: DefeatedEnemy[] = rawDefeatedEnemies.map((entry, index) => ({
      species: entry.species,
      level: entry.level,
      isTrainer: entry.type === 'human' || trainerEnemyIds.includes(String(index))
    }))

    const xpResult = calculateEncounterXp({
      defeatedEnemies,
      significanceMultiplier: body.significanceMultiplier,
      playerCount: body.playerCount,
      isBossEncounter: body.isBossEncounter ?? false
    })

    // Validate total distribution does not exceed available XP
    // Sum all xpAmounts — should not exceed totalXpPerPlayer * playerCount
    const totalDistributed = body.distribution.reduce(
      (sum: number, entry: { xpAmount: number }) => sum + entry.xpAmount, 0
    )
    const maxDistributable = xpResult.totalXpPerPlayer * body.playerCount

    if (totalDistributed > maxDistributable) {
      throw createError({
        statusCode: 400,
        message: `Total XP distributed (${totalDistributed}) exceeds maximum available (${maxDistributable}). Per-player XP: ${xpResult.totalXpPerPlayer}, players: ${body.playerCount}.`
      })
    }

    // Load all target Pokemon from DB
    const pokemonIds: string[] = body.distribution.map(
      (d: { pokemonId: string }) => d.pokemonId
    )
    const pokemonRecords = await prisma.pokemon.findMany({
      where: { id: { in: pokemonIds } },
      select: {
        id: true,
        species: true,
        level: true,
        experience: true,
        tutorPoints: true
      }
    })

    // Build lookup map
    const pokemonMap = new Map(pokemonRecords.map(p => [p.id, p]))

    // Validate all Pokemon exist
    for (const entry of body.distribution) {
      if (!pokemonMap.has(entry.pokemonId)) {
        throw createError({
          statusCode: 404,
          message: `Pokemon not found: ${entry.pokemonId}`
        })
      }
    }

    // Load SpeciesData learnsets for level-up detection
    const speciesNames = [...new Set(pokemonRecords.map(p => p.species))]
    const speciesDataRecords = await prisma.speciesData.findMany({
      where: { name: { in: speciesNames } },
      select: { name: true, learnset: true }
    })

    const learnsetMap = new Map<string, LearnsetEntry[]>()
    for (const sd of speciesDataRecords) {
      try {
        learnsetMap.set(sd.name, JSON.parse(sd.learnset) as LearnsetEntry[])
      } catch {
        learnsetMap.set(sd.name, [])
      }
    }

    // Apply XP to each Pokemon
    const results: XpApplicationResult[] = []
    const updatePromises: Promise<unknown>[] = []

    for (const entry of body.distribution) {
      const pokemon = pokemonMap.get(entry.pokemonId)!
      const learnset = learnsetMap.get(pokemon.species) ?? []

      // Calculate level-ups
      const levelResult = calculateLevelUps(
        pokemon.experience,
        pokemon.level,
        entry.xpAmount,
        learnset
      )

      // Calculate tutor points gained (levels divisible by 5)
      const tutorPointsGained = levelResult.levelUps.filter(
        lu => lu.tutorPointGained
      ).length

      // Cap experience at max
      const cappedExperience = Math.min(levelResult.newExperience, MAX_EXPERIENCE)

      // Update Pokemon record in DB
      updatePromises.push(
        prisma.pokemon.update({
          where: { id: entry.pokemonId },
          data: {
            experience: cappedExperience,
            level: levelResult.newLevel,
            tutorPoints: pokemon.tutorPoints + tutorPointsGained
          }
        })
      )

      results.push({
        pokemonId: entry.pokemonId,
        species: pokemon.species,
        ...levelResult
      })
    }

    // Execute all DB updates
    await Promise.all(updatePromises)

    return {
      success: true,
      data: {
        results,
        totalXpDistributed: totalDistributed
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to distribute XP'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
