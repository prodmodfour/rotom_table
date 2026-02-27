import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!tableId) {
    throw createError({
      statusCode: 400,
      message: 'Table ID is required'
    })
  }

  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: 'Modification name is required'
    })
  }

  try {
    // Verify table exists
    const table = await prisma.encounterTable.findUnique({
      where: { id: tableId }
    })

    if (!table) {
      throw createError({
        statusCode: 404,
        message: 'Encounter table not found'
      })
    }

    // Validate level range: levelMin must be <= levelMax
    const modLevelMin = body.levelRange?.min ?? null
    const modLevelMax = body.levelRange?.max ?? null
    if (modLevelMin !== null && modLevelMax !== null && modLevelMin > modLevelMax) {
      throw createError({
        statusCode: 400,
        message: 'levelMin must be less than or equal to levelMax'
      })
    }

    const modification = await prisma.tableModification.create({
      data: {
        parentTableId: tableId,
        name: body.name,
        description: body.description ?? null,
        levelMin: body.levelRange?.min ?? null,
        levelMax: body.levelRange?.max ?? null
      },
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
      entries: []
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create modification'
    })
  }
})
