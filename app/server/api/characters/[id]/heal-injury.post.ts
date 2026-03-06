import { prisma } from '~/server/utils/prisma'
import {
  canHealInjuryNaturally,
  shouldResetDailyCounters
} from '~/utils/restHealing'

interface HealInjuryRequest {
  method?: 'natural' | 'drain_ap'
}

/**
 * Heal one injury
 * - Natural: 24 hours since last injury
 * - Drain AP: Drain 2 AP to heal 1 injury (trainers only)
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<HealInjuryRequest>(event)
  const method = body?.method || 'natural'

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  const character = await prisma.humanCharacter.findUnique({
    where: { id }
  })

  if (!character) {
    throw createError({
      statusCode: 404,
      message: 'Character not found'
    })
  }

  if (character.injuries <= 0) {
    return {
      success: false,
      message: 'No injuries to heal',
      data: { injuries: 0 }
    }
  }

  // Check daily injury healing limit
  let injuriesHealedToday = character.injuriesHealedToday
  if (shouldResetDailyCounters(character.lastRestReset)) {
    injuriesHealedToday = 0
  }

  if (injuriesHealedToday >= 3) {
    return {
      success: false,
      message: 'Daily injury healing limit reached (3/day)',
      data: {
        injuries: character.injuries,
        injuriesHealedToday
      }
    }
  }

  if (method === 'drain_ap') {
    // Validate character has enough AP to drain
    if (character.currentAp < 2) {
      return {
        success: false,
        message: `Not enough AP to drain. Need 2 AP but only have ${character.currentAp}.`,
        data: {
          injuries: character.injuries,
          currentAp: character.currentAp
        }
      }
    }

    // Drain 2 AP to heal 1 injury
    const newDrainedAp = character.drainedAp + 2
    const newCurrentAp = Math.max(0, character.currentAp - 2)
    const newInjuries = character.injuries - 1

    const updated = await prisma.humanCharacter.update({
      where: { id },
      data: {
        injuries: newInjuries,
        drainedAp: newDrainedAp,
        currentAp: newCurrentAp,
        injuriesHealedToday: injuriesHealedToday + 1,
        lastRestReset: new Date(),
        ...(newInjuries === 0 ? { lastInjuryTime: null } : {})
      }
    })

    return {
      success: true,
      message: 'Drained 2 AP to heal 1 injury.',
      data: {
        injuriesHealed: 1,
        injuries: updated.injuries,
        drainedAp: updated.drainedAp,
        currentAp: updated.currentAp,
        injuriesHealedToday: injuriesHealedToday + 1
      }
    }
  }

  // Natural healing - check if 24 hours have passed
  if (!canHealInjuryNaturally(character.lastInjuryTime)) {
    const hoursSince = character.lastInjuryTime
      ? Math.floor((new Date().getTime() - new Date(character.lastInjuryTime).getTime()) / (1000 * 60 * 60))
      : 0
    const hoursRemaining = 24 - hoursSince

    return {
      success: false,
      message: `Cannot heal naturally yet. ${hoursRemaining} hours remaining.`,
      data: {
        injuries: character.injuries,
        hoursSinceLastInjury: hoursSince,
        hoursRemaining
      }
    }
  }

  const newInjuries = character.injuries - 1

  const updated = await prisma.humanCharacter.update({
    where: { id },
    data: {
      injuries: newInjuries,
      injuriesHealedToday: injuriesHealedToday + 1,
      lastRestReset: new Date(),
      // Only clear timer when all injuries gone — healing is not gaining an injury
      ...(newInjuries === 0 ? { lastInjuryTime: null } : {})
    }
  })

  return {
    success: true,
    message: 'Healed 1 injury naturally.',
    data: {
      injuriesHealed: 1,
      injuries: updated.injuries,
      injuriesHealedToday: injuriesHealedToday + 1
    }
  }
})
