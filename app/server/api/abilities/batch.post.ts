/**
 * POST /api/abilities/batch
 *
 * Fetch multiple ability details by name from AbilityData.
 *
 * Body: { names: string[] }
 * Returns: { success: true, data: AbilityData[] }
 */

import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.names || !Array.isArray(body.names)) {
    throw createError({
      statusCode: 400,
      message: 'Body must contain a names array'
    })
  }

  if (body.names.length === 0) {
    return { success: true, data: [] }
  }

  if (body.names.length > 50) {
    throw createError({
      statusCode: 400,
      message: 'Maximum 50 ability names per batch request'
    })
  }

  // Validate all entries are strings
  const names = body.names.filter((n: unknown) => typeof n === 'string') as string[]

  try {
    const abilities = await prisma.abilityData.findMany({
      where: { name: { in: names } }
    })

    return { success: true, data: abilities }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch abilities'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
