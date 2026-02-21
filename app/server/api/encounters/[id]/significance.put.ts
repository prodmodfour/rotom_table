/**
 * PUT /api/encounters/:id/significance
 *
 * Persist the GM-set significance multiplier on an encounter record.
 * PTU Core p.460: GM assigns a multiplier (typically 1-5) based on
 * the narrative significance of the encounter.
 */
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  // Validate significance multiplier (allow 0.5 to 10 per PTU guidelines)
  if (
    typeof body.significanceMultiplier !== 'number' ||
    body.significanceMultiplier < 0.5 ||
    body.significanceMultiplier > 10
  ) {
    throw createError({
      statusCode: 400,
      message: 'significanceMultiplier must be a number between 0.5 and 10'
    })
  }

  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    const updated = await prisma.encounter.update({
      where: { id },
      data: {
        significanceMultiplier: body.significanceMultiplier
      }
    })

    return {
      success: true,
      data: {
        significanceMultiplier: updated.significanceMultiplier
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to update significance'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
