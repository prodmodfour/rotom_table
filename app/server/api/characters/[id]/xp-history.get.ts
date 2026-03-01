/**
 * GET /api/characters/:id/xp-history
 *
 * Returns the current trainer XP state for display.
 * Lightweight endpoint — no server-side history stored in P0.
 *
 * Future enhancement: add a TrainerXpLog model for full history.
 */

import { prisma } from '~/server/utils/prisma'
import { TRAINER_XP_PER_LEVEL, TRAINER_MAX_LEVEL } from '~/utils/trainerExperience'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Character ID is required' })
  }

  const character = await prisma.humanCharacter.findUnique({
    where: { id },
    select: {
      trainerXp: true,
      level: true,
      capturedSpecies: true
    }
  })

  if (!character) {
    throw createError({ statusCode: 404, message: 'Character not found' })
  }

  const isMaxLevel = character.level >= TRAINER_MAX_LEVEL

  return {
    success: true,
    data: {
      trainerXp: character.trainerXp,
      level: character.level,
      xpToNextLevel: isMaxLevel ? null : TRAINER_XP_PER_LEVEL - character.trainerXp,
      capturedSpecies: JSON.parse(character.capturedSpecies || '[]')
    }
  }
})
