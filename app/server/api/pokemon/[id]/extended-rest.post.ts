import { prisma } from '~/server/utils/prisma'
import {
  calculateRestHealing,
  shouldResetDailyCounters,
  clearPersistentStatusConditions,
  getStatusesToClear,
  isDailyMoveRefreshable
} from '~/utils/restHealing'

/**
 * Apply extended rest to a Pokemon (decree-018: configurable duration)
 * - Duration: 4-8 hours (default 4), each 30-min period heals 1/16th max HP
 * - Clears all persistent status conditions
 * - Restores daily-frequency moves
 * - Respects daily 8h rest cap via restMinutesToday
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  // Parse optional duration parameter (decree-018: 4-8 hours, default 4)
  const body = await readBody(event).catch(() => ({}))
  const rawDuration = body?.duration ?? 4
  const duration = Math.min(8, Math.max(4, Number(rawDuration) || 4))

  const pokemon = await prisma.pokemon.findUnique({
    where: { id }
  })

  if (!pokemon) {
    throw createError({
      statusCode: 404,
      message: 'Pokemon not found'
    })
  }

  // Reset daily counters if new day
  let restMinutesToday = pokemon.restMinutesToday
  let injuriesHealedToday = pokemon.injuriesHealedToday

  if (shouldResetDailyCounters(pokemon.lastRestReset)) {
    restMinutesToday = 0
    injuriesHealedToday = 0
  }

  // Calculate rest periods from duration (each period = 30 min)
  const requestedPeriods = Math.floor(duration * 60 / 30)

  // Calculate HP healing
  let totalHpHealed = 0
  let currentHp = pokemon.currentHp
  let currentRestMinutes = restMinutesToday

  for (let i = 0; i < requestedPeriods; i++) {
    const result = calculateRestHealing({
      currentHp,
      maxHp: pokemon.maxHp,
      injuries: pokemon.injuries,
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
  const statusConditions: string[] = JSON.parse(pokemon.statusConditions || '[]')
  const clearedStatuses = getStatusesToClear(statusConditions)
  const newStatusConditions = clearPersistentStatusConditions(statusConditions)

  // Reset daily move usage (rolling window: PTU Core p.252)
  // Daily-frequency moves are only refreshed if they haven't been used since the previous day.
  // A move used today cannot be refreshed by tonight's Extended Rest.
  const moves = JSON.parse(pokemon.moves || '[]')
  const restoredMoves: string[] = []
  const skippedMoves: string[] = []

  for (const move of moves) {
    const isDailyMove = move.frequency?.startsWith('Daily')

    if (isDailyMove && move.usedToday && move.usedToday > 0) {
      // Rolling window (PTU Core p.252): only refresh if not used today
      if (isDailyMoveRefreshable(move.lastUsedAt)) {
        restoredMoves.push(move.name)
        move.usedToday = 0
        move.lastUsedAt = undefined
      } else {
        skippedMoves.push(move.name)
      }
    } else if (!isDailyMove && move.usedToday && move.usedToday > 0) {
      // Non-daily moves: reset usage counter (no rolling window applies)
      move.usedToday = 0
      move.lastUsedAt = undefined
    }

    // Also reset scene usage if frequency is daily and the move was refreshed
    if (isDailyMove && move.usedThisScene && !skippedMoves.includes(move.name)) {
      move.usedThisScene = 0
    }
  }

  const updated = await prisma.pokemon.update({
    where: { id },
    data: {
      currentHp,
      restMinutesToday: currentRestMinutes,
      injuriesHealedToday,
      lastRestReset: new Date(),
      statusConditions: JSON.stringify(newStatusConditions),
      moves: JSON.stringify(moves)
    }
  })

  return {
    success: true,
    message: `Extended rest complete (${duration} hours).`,
    data: {
      duration,
      hpHealed: totalHpHealed,
      newHp: updated.currentHp,
      maxHp: updated.maxHp,
      clearedStatuses,
      restoredMoves,
      skippedMoves,
      restMinutesToday: currentRestMinutes,
      restMinutesRemaining: Math.max(0, 480 - currentRestMinutes)
    }
  }
})
