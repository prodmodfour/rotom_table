import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')
  const modId = getRouterParam(event, 'modId')
  const body = await readBody(event)

  if (!tableId) {
    throw createError({
      statusCode: 400,
      message: 'Table ID is required'
    })
  }

  if (!modId) {
    throw createError({
      statusCode: 400,
      message: 'Modification ID is required'
    })
  }

  try {
    // Verify modification exists and belongs to this table
    const existing = await prisma.tableModification.findUnique({
      where: { id: modId }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Modification not found'
      })
    }

    if (existing.parentTableId !== tableId) {
      throw createError({
        statusCode: 400,
        message: 'Modification does not belong to this table'
      })
    }

    // Validate level range cross-field: levelMin must be <= levelMax
    // Merge provided values with existing DB values to catch partial updates
    const modLevelMin = body.levelRange?.min !== undefined ? body.levelRange.min : existing.levelMin
    const modLevelMax = body.levelRange?.max !== undefined ? body.levelRange.max : existing.levelMax
    if (modLevelMin !== null && modLevelMax !== null &&
        typeof modLevelMin === 'number' && typeof modLevelMax === 'number' &&
        modLevelMin > modLevelMax) {
      throw createError({
        statusCode: 400,
        message: 'levelMin must be less than or equal to levelMax'
      })
    }

    // Build update data — only include fields that were provided
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) {
      updateData.name = body.name
    }
    if (body.description !== undefined) {
      updateData.description = body.description ?? null
    }
    if (body.levelRange?.min !== undefined) {
      updateData.levelMin = body.levelRange.min
    }
    if (body.levelRange?.max !== undefined) {
      updateData.levelMax = body.levelRange.max
    }

    const modification = await prisma.tableModification.update({
      where: { id: modId },
      data: updateData,
      include: {
        entries: true
      }
    })

    const parsed = {
      id: modification.id,
      name: modification.name,
      description: modification.description,
      levelRange: modification.levelMin && modification.levelMax ? {
        min: modification.levelMin,
        max: modification.levelMax
      } : undefined,
      entries: modification.entries.map(e => ({
        id: e.id,
        speciesName: e.speciesName,
        weight: e.weight,
        remove: e.remove,
        levelRange: e.levelMin && e.levelMax ? {
          min: e.levelMin,
          max: e.levelMax
        } : undefined
      }))
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update modification'
    })
  }
})
