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

  if (!body.speciesId) {
    throw createError({
      statusCode: 400,
      message: 'Species ID is required'
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

    // Verify species exists
    const species = await prisma.speciesData.findUnique({
      where: { id: body.speciesId }
    })

    if (!species) {
      throw createError({
        statusCode: 404,
        message: 'Species not found'
      })
    }

    // Validate weight
    if (body.weight !== undefined && (typeof body.weight !== 'number' || body.weight < 0.1)) {
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

    // Check if entry already exists for this species
    const existingEntry = await prisma.encounterTableEntry.findUnique({
      where: {
        tableId_speciesId: {
          tableId,
          speciesId: body.speciesId
        }
      }
    })

    if (existingEntry) {
      throw createError({
        statusCode: 409,
        message: 'Entry for this species already exists in the table'
      })
    }

    const entry = await prisma.encounterTableEntry.create({
      data: {
        tableId,
        speciesId: body.speciesId,
        weight: body.weight ?? 10,
        levelMin: body.levelRange?.min ?? null,
        levelMax: body.levelRange?.max ?? null
      },
      include: {
        species: true
      }
    })

    const parsed = {
      id: entry.id,
      speciesId: entry.speciesId,
      speciesName: entry.species.name,
      weight: entry.weight,
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
      message: error.message || 'Failed to add entry to encounter table'
    })
  }
})
