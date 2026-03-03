/**
 * POST /api/encounters/:id/living-weapon/engage
 *
 * Establish a wield relationship between a trainer and a Living Weapon Pokemon.
 * PTU pp.305-306: Re-engaging is a Standard Action.
 *
 * Validates: capability, skill rank, adjacency, not already wielding/wielded.
 * Side effects: creates WieldRelationship, sets combatant flags,
 *   marks Standard Action as used, broadcasts WebSocket event.
 */
import { loadEncounter, buildEncounterResponse, saveEncounterCombatants } from '~/server/services/encounter.service'
import { engageLivingWeapon } from '~/server/services/living-weapon.service'
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

  if (!body.wielderId || !body.weaponId) {
    throw createError({
      statusCode: 400,
      message: 'wielderId and weaponId are required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    if (!record.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter must be active to engage a Living Weapon'
      })
    }

    // Reconstruct wield relationships from combatant flags
    const wieldRelationships = reconstructWieldRelationships(combatants)

    // Execute engage (validates all preconditions, returns immutable updates)
    const result = engageLivingWeapon(
      combatants,
      wieldRelationships,
      body.wielderId,
      body.weaponId
    )

    // Mark Standard Action as used on the wielder
    const finalCombatants = result.combatants.map(c => {
      if (c.id === body.wielderId) {
        return {
          ...c,
          turnState: {
            ...c.turnState,
            standardActionUsed: true,
          }
        }
      }
      return c
    })

    // Persist updated combatants
    await saveEncounterCombatants(id, finalCombatants)

    // Broadcast engage event via WebSocket
    broadcastToEncounter(id, {
      type: 'living_weapon_engage',
      data: {
        encounterId: id,
        wieldRelationship: result.wieldRelationship,
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
        wieldRelationship: result.wieldRelationship,
        wielder: result.wielder,
        weapon: result.weapon,
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to engage Living Weapon'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
