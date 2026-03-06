import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const tableId = getRouterParam(event, 'id')

  if (!tableId) {
    throw createError({
      statusCode: 400,
      message: 'Table ID is required'
    })
  }

  try {
    const table = await prisma.encounterTable.findUnique({
      where: { id: tableId },
      include: {
        entries: {
          include: {
            species: {
              select: {
                name: true
              }
            }
          }
        },
        modifications: {
          include: {
            entries: true
          }
        }
      }
    })

    if (!table) {
      throw createError({
        statusCode: 404,
        message: 'Encounter table not found'
      })
    }

    // Transform to export format (without internal IDs)
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      table: {
        name: table.name,
        description: table.description,
        imageUrl: table.imageUrl,
        density: table.density,
        levelRange: {
          min: table.levelMin,
          max: table.levelMax
        },
        entries: table.entries.map(entry => ({
          speciesName: entry.species.name,
          weight: entry.weight,
          levelRange: entry.levelMin && entry.levelMax
            ? { min: entry.levelMin, max: entry.levelMax }
            : null
        })),
        modifications: table.modifications.map(mod => ({
          name: mod.name,
          description: mod.description,
          levelRange: mod.levelMin && mod.levelMax
            ? { min: mod.levelMin, max: mod.levelMax }
            : null,
          entries: mod.entries.map(entry => ({
            speciesName: entry.speciesName,
            weight: entry.weight,
            remove: entry.remove,
            levelRange: entry.levelMin && entry.levelMax
              ? { min: entry.levelMin, max: entry.levelMax }
              : null
          }))
        }))
      }
    }

    // Set headers for download
    setHeader(event, 'Content-Type', 'application/json')
    setHeader(event, 'Content-Disposition', `attachment; filename="${table.name.replace(/[^a-z0-9]/gi, '_')}_export.json"`)

    return exportData
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to export table'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
