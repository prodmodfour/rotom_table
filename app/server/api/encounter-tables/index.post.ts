import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.name) {
      throw createError({
        statusCode: 400,
        message: 'Table name is required'
      })
    }

    // Validate level range: levelMin must be <= levelMax
    const levelMin = body.levelRange?.min ?? 1
    const levelMax = body.levelRange?.max ?? 10
    if (typeof levelMin === 'number' && typeof levelMax === 'number' && levelMin > levelMax) {
      throw createError({
        statusCode: 400,
        message: 'levelMin must be less than or equal to levelMax'
      })
    }

    // Validate density if provided
    const validDensities = ['sparse', 'moderate', 'dense', 'abundant']
    const density = body.density && validDensities.includes(body.density)
      ? body.density
      : 'moderate'

    const table = await prisma.encounterTable.create({
      data: {
        name: body.name,
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
        levelMin,
        levelMax,
        density
      },
      include: {
        entries: {
          include: {
            species: true
          }
        },
        modifications: true
      }
    })

    const parsed = {
      id: table.id,
      name: table.name,
      description: table.description,
      imageUrl: table.imageUrl,
      levelRange: {
        min: table.levelMin,
        max: table.levelMax
      },
      density: table.density,
      entries: [],
      modifications: [],
      createdAt: table.createdAt,
      updatedAt: table.updatedAt
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create encounter table'
    })
  }
})
