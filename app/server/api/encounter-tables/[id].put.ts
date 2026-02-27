import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Table ID is required'
    })
  }

  try {
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
      : undefined // Don't update if not valid

    const table = await prisma.encounterTable.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
        levelMin,
        levelMax,
        ...(density && { density })
      },
      include: {
        entries: {
          include: {
            species: true
          }
        },
        modifications: {
          include: {
            entries: true
          }
        }
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
      entries: table.entries.map(entry => ({
        id: entry.id,
        speciesId: entry.speciesId,
        speciesName: entry.species.name,
        weight: entry.weight,
        levelRange: entry.levelMin && entry.levelMax ? {
          min: entry.levelMin,
          max: entry.levelMax
        } : undefined
      })),
      modifications: table.modifications.map(mod => ({
        id: mod.id,
        name: mod.name,
        description: mod.description,
        levelRange: mod.levelMin && mod.levelMax ? {
          min: mod.levelMin,
          max: mod.levelMax
        } : undefined,
        entries: mod.entries.map(e => ({
          id: e.id,
          speciesName: e.speciesName,
          weight: e.weight,
          remove: e.remove,
          levelRange: e.levelMin && e.levelMax ? {
            min: e.levelMin,
            max: e.levelMax
          } : undefined
        }))
      })),
      createdAt: table.createdAt,
      updatedAt: table.updatedAt
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update encounter table'
    })
  }
})
