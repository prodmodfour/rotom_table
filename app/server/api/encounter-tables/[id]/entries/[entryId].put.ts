import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')
  const entryId = getRouterParam(event, 'entryId')

  if (!tableId || !entryId) {
    throw createError({
      statusCode: 400,
      message: 'Table ID and Entry ID are required'
    })
  }

  const body = await readBody(event)

  // Validate body
  if (body.weight !== undefined && (typeof body.weight !== 'number' || body.weight < 0.1)) {
    throw createError({
      statusCode: 400,
      message: 'Weight must be a number >= 0.1'
    })
  }

  if (body.levelMin !== undefined && body.levelMin !== null) {
    if (typeof body.levelMin !== 'number' || body.levelMin < 1 || body.levelMin > 100) {
      throw createError({
        statusCode: 400,
        message: 'Level min must be a number between 1 and 100'
      })
    }
  }

  if (body.levelMax !== undefined && body.levelMax !== null) {
    if (typeof body.levelMax !== 'number' || body.levelMax < 1 || body.levelMax > 100) {
      throw createError({
        statusCode: 400,
        message: 'Level max must be a number between 1 and 100'
      })
    }
  }

  try {
    // Verify the entry exists and belongs to this table
    const existing = await prisma.encounterTableEntry.findFirst({
      where: {
        id: entryId,
        tableId: tableId
      }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Entry not found'
      })
    }

    // Validate level range cross-field: levelMin must be <= levelMax
    // Merge provided values with existing values to catch partial updates
    const effectiveLevelMin = body.levelMin !== undefined ? body.levelMin : existing.levelMin
    const effectiveLevelMax = body.levelMax !== undefined ? body.levelMax : existing.levelMax
    if (effectiveLevelMin !== null && effectiveLevelMax !== null &&
        typeof effectiveLevelMin === 'number' && typeof effectiveLevelMax === 'number' &&
        effectiveLevelMin > effectiveLevelMax) {
      throw createError({
        statusCode: 400,
        message: 'levelMin must be less than or equal to levelMax'
      })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (body.weight !== undefined) {
      updateData.weight = body.weight
    }
    if (body.levelMin !== undefined) {
      updateData.levelMin = body.levelMin
    }
    if (body.levelMax !== undefined) {
      updateData.levelMax = body.levelMax
    }

    // Update the entry
    const updated = await prisma.encounterTableEntry.update({
      where: { id: entryId },
      data: updateData,
      include: {
        species: {
          select: {
            id: true,
            name: true,
            type1: true,
            type2: true
          }
        }
      }
    })

    return {
      success: true,
      data: {
        id: updated.id,
        speciesId: updated.speciesId,
        speciesName: updated.species.name,
        weight: updated.weight,
        levelRange: updated.levelMin && updated.levelMax
          ? { min: updated.levelMin, max: updated.levelMax }
          : null
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to update entry'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
