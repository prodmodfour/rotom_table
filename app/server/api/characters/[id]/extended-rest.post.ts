import { prisma } from '~/server/utils/prisma'
import {
  calculateRestHealing,
  shouldResetDailyCounters,
  clearPersistentStatusConditions,
  getStatusesToClear,
  calculateMaxAp
} from '~/utils/restHealing'
import { refreshDailyMovesForOwnedPokemon } from '~/server/services/rest-healing.service'

/**
 * Apply extended rest to a human character (decree-018: configurable duration)
 * - Duration: 4-8 hours (default 4), each 30-min period heals 1/16th max HP
 * - Clears all persistent status conditions
 * - Restores drained AP (bound AP preserved per decree-016)
 * - Refreshes daily-frequency moves on owned Pokemon (PTU Core p.252)
 * - Respects daily 8h rest cap via restMinutesToday
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  // Parse optional duration parameter (decree-018: 4-8 hours, default 4)
  const body = await readBody(event).catch(() => ({}))
  const rawDuration = body?.duration ?? 4
  const duration = Math.min(8, Math.max(4, Number(rawDuration) || 4))

  const character = await prisma.humanCharacter.findUnique({
    where: { id }
  })

  if (!character) {
    throw createError({
      statusCode: 404,
      message: 'Character not found'
    })
  }

  // Reset daily counters if new day
  let restMinutesToday = character.restMinutesToday
  let injuriesHealedToday = character.injuriesHealedToday

  if (shouldResetDailyCounters(character.lastRestReset)) {
    restMinutesToday = 0
    injuriesHealedToday = 0
  }

  // Calculate rest periods from duration (each period = 30 min)
  const requestedPeriods = Math.floor(duration * 60 / 30)

  // Calculate HP healing
  let totalHpHealed = 0
  let currentHp = character.currentHp
  let currentRestMinutes = restMinutesToday

  for (let i = 0; i < requestedPeriods; i++) {
    const result = calculateRestHealing({
      currentHp,
      maxHp: character.maxHp,
      injuries: character.injuries,
      restMinutesToday: currentRestMinutes
    })

    if (result.canHeal) {
      totalHpHealed += result.hpHealed
      currentHp += result.hpHealed
      currentRestMinutes += 30
    } else {
      break // Stop if can't heal anymore (daily cap or 5+ injuries)
    }
  }

  // Clear persistent status conditions
  const statusConditions: string[] = JSON.parse(character.statusConditions || '[]')
  const clearedStatuses = getStatusesToClear(statusConditions)
  const newStatusConditions = clearPersistentStatusConditions(statusConditions)

  // Restore drained AP only — Bound AP persists until binding effect ends (decree-016)
  const apRestored = character.drainedAp
  const maxAp = calculateMaxAp(character.level)

  const updated = await prisma.humanCharacter.update({
    where: { id },
    data: {
      currentHp,
      restMinutesToday: currentRestMinutes,
      injuriesHealedToday,
      lastRestReset: new Date(),
      statusConditions: JSON.stringify(newStatusConditions),
      drainedAp: 0, // Restore all drained AP
      currentAp: Math.max(0, maxAp - character.boundAp) // Bound AP remains off-limits (decree-016)
    }
  })

  // PTU Core p.252: Refresh daily-frequency moves on owned Pokemon
  // Rolling window: moves used today are NOT refreshed; only yesterday's are eligible
  const pokemonMoveRefresh = await refreshDailyMovesForOwnedPokemon(id)

  return {
    success: true,
    message: `Extended rest complete (${duration} hours).`,
    data: {
      duration,
      hpHealed: totalHpHealed,
      newHp: updated.currentHp,
      maxHp: updated.maxHp,
      clearedStatuses,
      apRestored,
      boundAp: updated.boundAp,
      restMinutesToday: currentRestMinutes,
      restMinutesRemaining: Math.max(0, 480 - currentRestMinutes),
      pokemonMoveRefresh
    }
  }
})
