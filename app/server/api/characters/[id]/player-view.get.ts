import { prisma } from '~/server/utils/prisma'
import { serializeCharacter } from '~/server/utils/serializers'

/**
 * GET /api/characters/:id/player-view
 *
 * Returns a full character with all linked Pokemon data.
 * Used by the Player View to load the player's character sheet
 * and Pokemon team in a single request.
 */
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
      include: { pokemon: true }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: 'Character not found'
      })
    }

    const serialized = serializeCharacter(character)

    return {
      success: true,
      data: {
        character: {
          ...serialized,
          pokemon: undefined,
          pokemonIds: serialized.pokemonIds
        },
        pokemon: serialized.pokemon
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch player view data'
    })
  }
})
