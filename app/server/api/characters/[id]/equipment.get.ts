import { prisma } from '~/server/utils/prisma'
import { computeEquipmentBonuses } from '~/utils/equipmentBonuses'
import type { EquipmentSlots } from '~/types/character'

/**
 * GET /api/characters/:id/equipment
 * Returns the character's current equipment slots and aggregate bonuses.
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
      select: { equipment: true }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: 'Character not found'
      })
    }

    const slots: EquipmentSlots = JSON.parse(character.equipment || '{}')
    const aggregateBonuses = computeEquipmentBonuses(slots)

    return {
      success: true,
      data: {
        slots,
        aggregateBonuses
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch equipment'
    })
  }
})
