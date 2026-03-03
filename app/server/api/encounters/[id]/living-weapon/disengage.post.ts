/**
 * POST /api/encounters/:id/living-weapon/disengage
 *
 * Break a wield relationship between a trainer and a Living Weapon Pokemon.
 * PTU pp.305-306: Disengage is a Swift Action.
 *
 * Either the wielder or weapon combatant ID can be provided -- the endpoint
 * resolves the relationship from either side.
 */
import { loadEncounter, buildEncounterResponse, saveEncounterCombatants } from '~/server/services/encounter.service'
import { disengageLivingWeapon } from '~/server/services/living-weapon.service'
import { reconstructWieldRelationships } from '~/server/services/living-weapon-state'
import { broadcastToEncounter } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  if (!body.combatantId) {
    throw createError({
      statusCode: 400,
      message: 'combatantId is required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    if (!record.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter must be active to disengage a Living Weapon'
      })
    }

    // Reconstruct wield relationships from combatant flags
    const wieldRelationships = reconstructWieldRelationships(combatants)

    // Execute disengage (validates relationship exists, returns immutable updates)
    const result = disengageLivingWeapon(
      combatants,
      wieldRelationships,
      body.combatantId
    )

    // Mark Swift Action as used on the disengaging combatant
    const finalCombatants = result.combatants.map(c => {
      if (c.id === body.combatantId) {
        return {
          ...c,
          turnState: {
            ...c.turnState,
            swiftActionUsed: true,
          }
        }
      }
      return c
    })

    // Persist updated combatants
    await saveEncounterCombatants(id, finalCombatants)

    // Broadcast disengage event via WebSocket
    broadcastToEncounter(id, {
      type: 'living_weapon_disengage',
      data: {
        encounterId: id,
        wielderId: result.removedRelationship.wielderId,
        weaponId: result.removedRelationship.weaponId,
      }
    })

    // Also broadcast full encounter update for state sync
    broadcastToEncounter(id, {
      type: 'encounter_update',
      data: { encounterId: id }
    })

    const response = buildEncounterResponse(record, finalCombatants)

    return {
      success: true,
      data: {
        encounter: response,
        removedRelationship: result.removedRelationship,
        wielder: result.wielder,
        weapon: result.weapon,
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to disengage Living Weapon'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
