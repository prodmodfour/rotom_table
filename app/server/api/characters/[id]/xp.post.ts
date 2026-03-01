/**
 * POST /api/characters/:id/xp
 *
 * Award or deduct trainer XP. Handles auto-level-up when bank >= 10.
 * Returns the updated character with level change info.
 *
 * Body: { amount: number, reason?: string }
 * - Positive amount = award XP
 * - Negative amount = deduct XP (bank cannot go below 0)
 *
 * PTU Core p.461: Trainer Experience Bank
 */

import { prisma } from '~/server/utils/prisma'
import { serializeCharacter } from '~/server/utils/serializers'
import { broadcast } from '~/server/utils/websocket'
import { applyTrainerXp } from '~/utils/trainerExperience'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  // Validation
  if (!id) {
    throw createError({ statusCode: 400, message: 'Character ID is required' })
  }
  if (typeof body.amount !== 'number' || !Number.isInteger(body.amount)) {
    throw createError({ statusCode: 400, message: 'amount must be an integer' })
  }
  if (body.amount === 0) {
    throw createError({ statusCode: 400, message: 'amount must be non-zero' })
  }
  if (body.amount < -100 || body.amount > 100) {
    throw createError({ statusCode: 400, message: 'amount must be between -100 and 100' })
  }

  // Load character
  const character = await prisma.humanCharacter.findUnique({
    where: { id },
    include: { pokemon: true }
  })
  if (!character) {
    throw createError({ statusCode: 404, message: 'Character not found' })
  }

  // Apply XP (pure function)
  const result = applyTrainerXp({
    currentXp: character.trainerXp,
    currentLevel: character.level,
    xpToAdd: body.amount
  })

  // Update DB
  const updated = await prisma.humanCharacter.update({
    where: { id },
    data: {
      trainerXp: result.newXp,
      level: result.newLevel
    },
    include: { pokemon: true }
  })

  // Broadcast character update via WebSocket (for Group/Player View sync)
  if (result.levelsGained > 0) {
    broadcast({ type: 'character_update', data: { characterId: id } })
  }

  return {
    success: true,
    data: {
      previousXp: result.previousXp,
      previousLevel: result.previousLevel,
      xpAdded: result.xpAdded,
      newXp: result.newXp,
      newLevel: result.newLevel,
      levelsGained: result.levelsGained,
      character: serializeCharacter(updated)
    }
  }
})
