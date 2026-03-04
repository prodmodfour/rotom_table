/**
 * POST /api/encounters/:id/next-scene
 *
 * Advances to the next scene within an encounter, resetting all
 * scene-frequency move counters and EOT tracking on all combatants.
 * PTU: Scene-frequency moves (Scene, Scene x2, Scene x3) refresh
 * at each scene boundary. EOT cooldowns also reset.
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, buildEncounterResponse } from '~/server/services/encounter.service'
import { resetSceneUsage } from '~/utils/moveFrequency'
import type { Move, Pokemon } from '~/types/character'
import type { Combatant } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    // Reset scene-frequency usage on all Pokemon combatants
    const dbUpdates: Promise<unknown>[] = []

    const updatedCombatants = combatants.map((combatant: Combatant) => {
      // P2: Clear Rider class feature usage on scene transition
      let updatedCombatant = combatant
      if (combatant.featureUsage && Object.keys(combatant.featureUsage).length > 0) {
        updatedCombatant = {
          ...combatant,
          featureUsage: undefined
        }
      }

      if (updatedCombatant.type !== 'pokemon') {
        return updatedCombatant
      }

      const entity = updatedCombatant.entity as Pokemon
      const moves: Move[] = entity.moves || []
      const resetMoves = resetSceneUsage(moves)

      // Only create a new combatant if moves actually changed
      if (resetMoves.every((m, i) => m === moves[i]) && updatedCombatant === combatant) {
        return updatedCombatant
      }

      // Sync to database if the combatant has a DB record
      if (updatedCombatant.entityId) {
        dbUpdates.push(
          prisma.pokemon.update({
            where: { id: updatedCombatant.entityId },
            data: { moves: JSON.stringify(resetMoves) }
          })
        )
      }

      return {
        ...updatedCombatant,
        entity: {
          ...entity,
          moves: resetMoves
        }
      }
    })

    // Persist DB updates
    if (dbUpdates.length > 0) {
      await Promise.all(dbUpdates)
    }

    // Save updated combatants to encounter
    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(updatedCombatants)
      }
    })

    const response = buildEncounterResponse(record, updatedCombatants)

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to advance scene'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
