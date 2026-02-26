import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'

// Valid terrain types for cell data
const VALID_TERRAIN_TYPES = ['normal', 'difficult', 'blocking', 'water', 'earth', 'rough', 'hazard', 'elevated'] as const

// Zod schema for terrain flags — strict: only rough and slow booleans allowed
const terrainFlagsSchema = z.object({
  rough: z.boolean(),
  slow: z.boolean(),
}).strict()

// Zod schema for a single terrain cell
const terrainCellSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number().optional(),
  }),
  type: z.enum(VALID_TERRAIN_TYPES),
  elevation: z.number(),
  note: z.string().optional(),
  flags: terrainFlagsSchema.optional(),
})

// Zod schema for the request body
const terrainStateBodySchema = z.object({
  enabled: z.boolean().optional(),
  cells: z.array(terrainCellSchema).optional(),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const rawBody = await readBody(event)

  // Validate request body
  const parseResult = terrainStateBodySchema.safeParse(rawBody)
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: `Invalid terrain data: ${parseResult.error.issues.map(i => i.message).join(', ')}`,
    })
  }

  const body = parseResult.data

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    // Verify encounter exists
    const existing = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Build terrain state object
    const currentState = JSON.parse(existing.terrainState || '{}')
    const newState = {
      cells: body.cells ?? currentState.cells ?? []
    }

    // Update encounter
    const updated = await prisma.encounter.update({
      where: { id },
      data: {
        terrainEnabled: body.enabled ?? existing.terrainEnabled,
        terrainState: JSON.stringify(newState)
      },
      select: {
        id: true,
        terrainEnabled: true,
        terrainState: true
      }
    })

    const parsedState = JSON.parse(updated.terrainState)

    return {
      success: true,
      data: {
        enabled: updated.terrainEnabled,
        cells: parsedState.cells
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to update terrain state'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
