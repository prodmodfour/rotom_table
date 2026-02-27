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

  if (!body.speciesName) {
    throw createError({
      statusCode: 400,
      message: 'Species name is required'
    })
  }

  try {
    // Verify modification exists and belongs to this table
    const modification = await prisma.tableModification.findUnique({
      where: { id: modId }
    })

    if (!modification) {
      throw createError({
        statusCode: 404,
        message: 'Modification not found'
      })
    }

    if (modification.parentTableId !== tableId) {
      throw createError({
        statusCode: 400,
        message: 'Modification does not belong to this table'
      })
    }

    // Validate weight (skip for remove entries which have null weight)
    if (!body.remove && body.weight !== undefined && (typeof body.weight !== 'number' || body.weight < 0.1)) {
      throw createError({
        statusCode: 400,
        message: 'Weight must be a number >= 0.1'
      })
    }

    // Validate level range: levelMin must be <= levelMax
    const entryLevelMin = body.levelRange?.min ?? null
    const entryLevelMax = body.levelRange?.max ?? null
    if (entryLevelMin !== null && entryLevelMax !== null && entryLevelMin > entryLevelMax) {
      throw createError({
        statusCode: 400,
        message: 'levelMin must be less than or equal to levelMax'
      })
    }

    // Check if entry already exists for this species in this modification
    const existingEntry = await prisma.modificationEntry.findFirst({
      where: {
        modificationId: modId,
        speciesName: body.speciesName
      }
    })

    if (existingEntry) {
      throw createError({
        statusCode: 409,
        message: 'Entry for this species already exists in the modification'
      })
    }

    const entry = await prisma.modificationEntry.create({
      data: {
        modificationId: modId,
        speciesName: body.speciesName,
        weight: body.remove ? null : (body.weight ?? 10),
        remove: body.remove ?? false,
        levelMin: body.levelRange?.min ?? null,
        levelMax: body.levelRange?.max ?? null
      }
    })

    const parsed = {
      id: entry.id,
      speciesName: entry.speciesName,
      weight: entry.weight,
      remove: entry.remove,
      levelRange: entry.levelMin && entry.levelMax ? {
        min: entry.levelMin,
        max: entry.levelMax
      } : undefined
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to add entry to modification'
    })
  }
})
