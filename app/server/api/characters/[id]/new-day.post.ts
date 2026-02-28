import { prisma } from '~/server/utils/prisma'
import { calculateMaxAp } from '~/utils/restHealing'
import { resetDailyUsage } from '~/utils/moveFrequency'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  try {
    const character = await prisma.humanCharacter.findUnique({
      where: { id },
      include: { pokemon: { select: { id: true, moves: true } } }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: 'Character not found'
      })
    }

    const now = new Date()

    // Reset daily healing counters — drainedAp is a daily counter, boundAp is NOT
    // Bound AP persists until the binding effect ends (decree-016, decree-019)
    const maxAp = calculateMaxAp(character.level)
    const updated = await prisma.humanCharacter.update({
      where: { id },
      data: {
        restMinutesToday: 0,
        injuriesHealedToday: 0,
        drainedAp: 0,
        // boundAp intentionally NOT reset — persists until binding effect ends (decree-016)
        currentAp: maxAp - character.boundAp,
        lastRestReset: now
      }
    })

    // Reset daily counters and move usage for this character's Pokemon
    let pokemonReset = 0
    for (const pokemon of character.pokemon) {
      const moves = JSON.parse(pokemon.moves || '[]')
      const resetMoves = resetDailyUsage(moves)
      const movesChanged = JSON.stringify(moves) !== JSON.stringify(resetMoves)

      await prisma.pokemon.update({
        where: { id: pokemon.id },
        data: {
          restMinutesToday: 0,
          injuriesHealedToday: 0,
          lastRestReset: now,
          ...(movesChanged ? { moves: JSON.stringify(resetMoves) } : {})
        }
      })
      pokemonReset++
    }

    return {
      success: true,
      message: 'Daily healing counters reset',
      data: {
        restMinutesToday: updated.restMinutesToday,
        injuriesHealedToday: updated.injuriesHealedToday,
        drainedAp: updated.drainedAp,
        boundAp: updated.boundAp,
        currentAp: updated.currentAp,
        lastRestReset: updated.lastRestReset,
        pokemonReset
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to reset daily counters'
    })
  }
})
