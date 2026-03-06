import { prisma } from '~/server/utils/prisma'

interface ImportLevelRange {
  min: number
  max: number
}

interface ImportEntry {
  speciesName: string
  weight: number
  levelRange?: ImportLevelRange | null
}

interface ImportModEntry {
  speciesName: string
  weight?: number | null
  remove?: boolean
  levelRange?: ImportLevelRange | null
}

interface ImportModification {
  name: string
  description?: string | null
  densityMultiplier?: number | null
  levelRange?: ImportLevelRange | null
  entries?: ImportModEntry[]
}

interface ImportData {
  version: string
  table: {
    name: string
    description?: string | null
    imageUrl?: string | null
    density?: string | null
    levelRange: ImportLevelRange
    entries?: ImportEntry[]
    modifications?: ImportModification[]
  }
}

function validateImportData(data: unknown): ImportData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid import data: expected an object')
  }

  const d = data as Record<string, unknown>

  if (!d.version || typeof d.version !== 'string') {
    throw new Error('Invalid import data: missing or invalid version')
  }

  if (!d.table || typeof d.table !== 'object') {
    throw new Error('Invalid import data: missing or invalid table')
  }

  const table = d.table as Record<string, unknown>

  if (!table.name || typeof table.name !== 'string') {
    throw new Error('Invalid import data: missing or invalid table name')
  }

  if (!table.levelRange || typeof table.levelRange !== 'object') {
    throw new Error('Invalid import data: missing or invalid level range')
  }

  const levelRange = table.levelRange as Record<string, unknown>
  if (typeof levelRange.min !== 'number' || typeof levelRange.max !== 'number') {
    throw new Error('Invalid import data: level range must have min and max numbers')
  }

  if (levelRange.min > levelRange.max) {
    throw new Error('Invalid import data: levelMin must be less than or equal to levelMax')
  }

  // Validate entry-level and modification-level ranges
  const entries = (table.entries || []) as Array<Record<string, unknown>>
  for (const entry of entries) {
    const entryRange = entry.levelRange as Record<string, unknown> | null | undefined
    if (entryRange && typeof entryRange.min === 'number' && typeof entryRange.max === 'number') {
      if (entryRange.min > entryRange.max) {
        throw new Error(`Invalid import data: entry levelMin must be less than or equal to levelMax`)
      }
    }
  }

  const modifications = (table.modifications || []) as Array<Record<string, unknown>>
  for (const mod of modifications) {
    const modRange = mod.levelRange as Record<string, unknown> | null | undefined
    if (modRange && typeof modRange.min === 'number' && typeof modRange.max === 'number') {
      if (modRange.min > modRange.max) {
        throw new Error(`Invalid import data: modification levelMin must be less than or equal to levelMax`)
      }
    }
    const modEntries = (mod.entries || []) as Array<Record<string, unknown>>
    for (const modEntry of modEntries) {
      const meRange = modEntry.levelRange as Record<string, unknown> | null | undefined
      if (meRange && typeof meRange.min === 'number' && typeof meRange.max === 'number') {
        if (meRange.min > meRange.max) {
          throw new Error(`Invalid import data: modification entry levelMin must be less than or equal to levelMax`)
        }
      }
    }
  }

  return data as ImportData
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  let importData: ImportData
  try {
    importData = validateImportData(body)
  } catch (err) {
    throw createError({
      statusCode: 400,
      message: err instanceof Error ? err.message : 'Invalid import data format'
    })
  }

  const tableData = importData.table

  // Validate density if provided, fall back to 'moderate'
  const validDensities = ['sparse', 'moderate', 'dense', 'abundant']
  const density = tableData.density && validDensities.includes(tableData.density)
    ? tableData.density
    : 'moderate'

  try {
    // Check if table with same name exists, append number if so
    let finalName = tableData.name
    const existingTables = await prisma.encounterTable.findMany({
      where: {
        name: {
          startsWith: tableData.name
        }
      },
      select: { name: true }
    })

    if (existingTables.some((t: { name: string }) => t.name === tableData.name)) {
      let counter = 1
      while (existingTables.some((t: { name: string }) => t.name === `${tableData.name} (${counter})`)) {
        counter++
      }
      finalName = `${tableData.name} (${counter})`
    }

    // Lookup species IDs for entries
    const speciesNames = (tableData.entries || []).map((e: ImportEntry) => e.speciesName)
    const speciesLookup = await prisma.speciesData.findMany({
      where: {
        name: { in: speciesNames }
      },
      select: { id: true, name: true }
    })
    const speciesMap = new Map(speciesLookup.map((s: { id: string; name: string }) => [s.name.toLowerCase(), s.id]))

    // Create the table with entries and modifications
    const newTable = await prisma.encounterTable.create({
      data: {
        name: finalName,
        description: tableData.description,
        imageUrl: tableData.imageUrl,
        density,
        levelMin: tableData.levelRange.min,
        levelMax: tableData.levelRange.max,
        entries: {
          create: (tableData.entries || [])
            .filter((entry: ImportEntry) => speciesMap.has(entry.speciesName.toLowerCase()))
            .map((entry: ImportEntry) => ({
              speciesId: speciesMap.get(entry.speciesName.toLowerCase())!,
              weight: entry.weight,
              levelMin: entry.levelRange?.min ?? null,
              levelMax: entry.levelRange?.max ?? null
            }))
        },
        modifications: {
          create: (tableData.modifications || []).map((mod: ImportModification) => ({
            name: mod.name,
            description: mod.description,
            densityMultiplier: typeof mod.densityMultiplier === 'number' && mod.densityMultiplier > 0
              ? mod.densityMultiplier
              : 1.0,
            levelMin: mod.levelRange?.min ?? null,
            levelMax: mod.levelRange?.max ?? null,
            entries: {
              create: (mod.entries || []).map((entry: ImportModEntry) => ({
                speciesName: entry.speciesName,
                weight: entry.weight ?? null,
                remove: entry.remove ?? false,
                levelMin: entry.levelRange?.min ?? null,
                levelMax: entry.levelRange?.max ?? null
              }))
            }
          }))
        }
      },
      include: {
        entries: {
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
        },
        modifications: {
          include: {
            entries: true
          }
        }
      }
    })

    // Count entries that couldn't be matched
    const unmatchedEntries = (tableData.entries || []).filter(
      (e: ImportEntry) => !speciesMap.has(e.speciesName.toLowerCase())
    )

    return {
      success: true,
      data: {
        id: newTable.id,
        name: newTable.name,
        description: newTable.description,
        imageUrl: newTable.imageUrl,
        density: newTable.density,
        levelRange: {
          min: newTable.levelMin,
          max: newTable.levelMax
        },
        entries: newTable.entries.map((e: typeof newTable.entries[0]) => ({
          id: e.id,
          speciesId: e.speciesId,
          speciesName: e.species.name,
          weight: e.weight,
          levelRange: e.levelMin && e.levelMax
            ? { min: e.levelMin, max: e.levelMax }
            : null
        })),
        modifications: newTable.modifications.map((m: typeof newTable.modifications[0]) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          parentTableId: m.parentTableId,
          levelRange: m.levelMin && m.levelMax
            ? { min: m.levelMin, max: m.levelMax }
            : null,
          entries: m.entries.map((e: typeof m.entries[0]) => ({
            id: e.id,
            speciesName: e.speciesName,
            weight: e.weight,
            remove: e.remove,
            levelRange: e.levelMin && e.levelMax
              ? { min: e.levelMin, max: e.levelMax }
              : null
          })),
          createdAt: m.createdAt,
          updatedAt: m.updatedAt
        })),
        createdAt: newTable.createdAt,
        updatedAt: newTable.updatedAt
      },
      warnings: unmatchedEntries.length > 0
        ? `${unmatchedEntries.length} species could not be found: ${unmatchedEntries.map((e: ImportEntry) => e.speciesName).join(', ')}`
        : null
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to import table'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
