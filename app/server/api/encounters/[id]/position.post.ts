import { prisma } from '~/server/utils/prisma'
import { ptuDiagonalDistance } from '~/utils/gridDistance'
import { reconstructWieldRelationships } from '~/server/services/living-weapon-state'
import type { GridConfig, GridPosition, Combatant } from '~/types'

interface PositionUpdateBody {
  combatantId: string
  position: GridPosition
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody<PositionUpdateBody>(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  if (!body.combatantId || !body.position) {
    throw createError({
      statusCode: 400,
      message: 'combatantId and position are required'
    })
  }

  if (typeof body.position.x !== 'number' || typeof body.position.y !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'Position must have numeric x and y values'
    })
  }

  try {
    // Get current encounter
    const encounter = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Parse combatants
    const combatants: Combatant[] = JSON.parse(encounter.combatants)

    // Find and update the combatant's position
    const combatantIndex = combatants.findIndex(c => c.id === body.combatantId)
    if (combatantIndex === -1) {
      throw createError({
        statusCode: 404,
        message: 'Combatant not found'
      })
    }

    // Validate position is within grid bounds
    if (encounter.gridEnabled) {
      if (body.position.x < 0 || body.position.x >= encounter.gridWidth ||
          body.position.y < 0 || body.position.y >= encounter.gridHeight) {
        throw createError({
          statusCode: 400,
          message: 'Position is outside grid bounds'
        })
      }
    }

    // Calculate movement distance for mount movement tracking (feature-004)
    const movingCombatant = combatants[combatantIndex]
    const oldPosition = movingCombatant.position
    let distanceMoved = 0
    if (oldPosition) {
      distanceMoved = ptuDiagonalDistance(
        body.position.x - oldPosition.x,
        body.position.y - oldPosition.y
      )
    }

    // Linked movement for mounted pairs (feature-004, PTU p.218)
    // When a mounted combatant moves, their partner moves too and
    // movementRemaining is decremented on both mount states.
    if (movingCombatant.mountState) {
      const partnerId = movingCombatant.mountState.partnerId
      const partnerIndex = combatants.findIndex(c => c.id === partnerId)

      // Update moving combatant with new position and decremented movement
      const newMovementRemaining = Math.max(0, movingCombatant.mountState.movementRemaining - distanceMoved)
      combatants[combatantIndex] = {
        ...movingCombatant,
        position: body.position,
        mountState: {
          ...movingCombatant.mountState,
          movementRemaining: newMovementRemaining
        }
      }

      // Update partner with same position and synced movement
      if (partnerIndex !== -1) {
        const partner = combatants[partnerIndex]
        combatants[partnerIndex] = {
          ...partner,
          position: { ...body.position },
          ...(partner.mountState ? {
            mountState: {
              ...partner.mountState,
              movementRemaining: newMovementRemaining
            }
          } : {})
        }
      }
    } else {
      // Check for Living Weapon linked movement (feature-005 P2, PTU p.306)
      // Wielder and weapon share position; when one moves, the other follows.
      const wieldRelationships = reconstructWieldRelationships(combatants)
      const wieldRel = wieldRelationships.find(
        r => r.wielderId === body.combatantId || r.weaponId === body.combatantId
      )

      if (wieldRel) {
        const partnerId = wieldRel.wielderId === body.combatantId
          ? wieldRel.weaponId
          : wieldRel.wielderId
        const partnerIndex = combatants.findIndex(c => c.id === partnerId)

        // Update moving combatant position
        combatants[combatantIndex] = {
          ...movingCombatant,
          position: body.position
        }

        // Sync partner position
        if (partnerIndex !== -1) {
          combatants[partnerIndex] = {
            ...combatants[partnerIndex],
            position: { ...body.position }
          }
        }
      } else {
        // Non-mounted, non-wielded: standard single-combatant position update
        combatants[combatantIndex] = {
          ...movingCombatant,
          position: body.position
        }
      }
    }

    // Save to database
    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(combatants)
      }
    })

    return {
      success: true,
      data: {
        combatantId: body.combatantId,
        position: body.position
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update position'
    })
  }
})
