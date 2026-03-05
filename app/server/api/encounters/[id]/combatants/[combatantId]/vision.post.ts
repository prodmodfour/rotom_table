/**
 * Toggle a vision capability on a combatant.
 * POST /api/encounters/:id/combatants/:combatantId/vision
 *
 * Body: { capability: 'darkvision' | 'blindsense', enabled: boolean, source?: string }
 *
 * Per decree-048: Darkvision/Blindsense negate darkness accuracy penalties.
 * Vision state is combat-scoped (stored within the combatants JSON blob).
 */
import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import { notifyEncounterUpdate } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  const encounterId = getRouterParam(event, 'id')
  const combatantId = getRouterParam(event, 'combatantId')

  if (!encounterId || !combatantId) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID and Combatant ID are required'
    })
  }

  const body = await readBody(event)
  const { capability, enabled, source = 'manual' } = body

  // Validate capability
  if (!['darkvision', 'blindsense'].includes(capability)) {
    throw createError({
      statusCode: 400,
      message: `Invalid vision capability: ${capability}`
    })
  }

  try {
    // Load encounter
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    const combatants = JSON.parse(encounter.combatants as string || '[]')
    const combatant = combatants.find((c: any) => c.id === combatantId)

    if (!combatant) {
      throw createError({
        statusCode: 404,
        message: 'Combatant not found'
      })
    }

    // Initialize visionState if absent
    if (!combatant.visionState) {
      combatant.visionState = { capabilities: [], sources: {} }
    }

    if (enabled) {
      // Add capability if not already present
      if (!combatant.visionState.capabilities.includes(capability)) {
        combatant.visionState.capabilities.push(capability)
      }
      combatant.visionState.sources[capability] = source
    } else {
      // Remove capability
      combatant.visionState.capabilities = combatant.visionState.capabilities.filter(
        (c: string) => c !== capability
      )
      delete combatant.visionState.sources[capability]
    }

    // Clean up: remove visionState entirely if empty
    if (combatant.visionState.capabilities.length === 0) {
      delete combatant.visionState
    }

    // Persist
    const updatedRecord = await prisma.encounter.update({
      where: { id: encounterId },
      data: { combatants: JSON.stringify(combatants) }
    })

    // Return full encounter response (standard pattern)
    const response = buildEncounterResponse(updatedRecord, combatants)

    // Broadcast to connected clients (Group View, Player View)
    notifyEncounterUpdate(encounterId, response)

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to toggle vision capability'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
