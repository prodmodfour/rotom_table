/**
 * POST /api/encounters/:id/trainer-xp-distribute
 *
 * Batch-awards trainer XP to multiple trainers after an encounter.
 * Each trainer's XP is applied sequentially to prevent race conditions.
 *
 * Body: {
 *   distribution: Array<{ characterId: string, xpAmount: number }>
 * }
 *
 * PTU Core p.461: Trainer XP is GM-decided, not formula-based.
 */

import { prisma } from '~/server/utils/prisma'
import { broadcast } from '~/server/utils/websocket'
import { applyTrainerXp } from '~/utils/trainerExperience'

export default defineEventHandler(async (event) => {
  const encounterId = getRouterParam(event, 'id')
  const body = await readBody(event)

  // Validate encounter exists
  if (!encounterId) {
    throw createError({ statusCode: 400, message: 'Encounter ID is required' })
  }

  // Validate distribution array
  if (!Array.isArray(body.distribution) || body.distribution.length === 0) {
    throw createError({ statusCode: 400, message: 'distribution must be a non-empty array' })
  }

  // Validate each entry
  for (const entry of body.distribution) {
    if (!entry.characterId || typeof entry.characterId !== 'string') {
      throw createError({ statusCode: 400, message: 'Each distribution entry must have a characterId string' })
    }
    if (typeof entry.xpAmount !== 'number' || !Number.isInteger(entry.xpAmount) || entry.xpAmount < 0) {
      throw createError({ statusCode: 400, message: 'Each distribution entry must have a non-negative integer xpAmount' })
    }
  }

  // Process each trainer sequentially
  const results: Array<{
    characterId: string
    characterName: string
    previousXp: number
    previousLevel: number
    newXp: number
    newLevel: number
    levelsGained: number
  }> = []
  let totalXpDistributed = 0

  for (const entry of body.distribution) {
    // Skip zero-XP entries
    if (entry.xpAmount === 0) continue

    const character = await prisma.humanCharacter.findUnique({
      where: { id: entry.characterId },
      select: { id: true, name: true, trainerXp: true, level: true }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: `Character not found: ${entry.characterId}`
      })
    }

    const xpCalc = applyTrainerXp({
      currentXp: character.trainerXp,
      currentLevel: character.level,
      xpToAdd: entry.xpAmount
    })

    await prisma.humanCharacter.update({
      where: { id: entry.characterId },
      data: {
        trainerXp: xpCalc.newXp,
        level: xpCalc.newLevel
      }
    })

    if (xpCalc.levelsGained > 0) {
      broadcast({ type: 'character_update', data: { characterId: entry.characterId } })
    }

    results.push({
      characterId: character.id,
      characterName: character.name,
      previousXp: xpCalc.previousXp,
      previousLevel: xpCalc.previousLevel,
      newXp: xpCalc.newXp,
      newLevel: xpCalc.newLevel,
      levelsGained: xpCalc.levelsGained
    })

    totalXpDistributed += entry.xpAmount
  }

  return {
    success: true,
    data: {
      results,
      totalXpDistributed
    }
  }
})
