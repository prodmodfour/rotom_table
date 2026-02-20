/**
 * POST /api/encounters/:id/xp-calculate
 *
 * Preview XP calculation for a completed encounter without applying it.
 * Read-only endpoint — the GM uses this to see the XP breakdown before
 * approving distribution via xp-distribute.
 *
 * PTU Core p.460: total defeated levels, apply significance, divide by players.
 */
import { loadEncounter } from '~/server/services/encounter.service'
import { calculateEncounterXp } from '~/utils/experienceCalculation'
import type { DefeatedEnemy } from '~/utils/experienceCalculation'
import type { Combatant } from '~/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  // Validate required fields
  if (typeof body.significanceMultiplier !== 'number' || body.significanceMultiplier < 0.5 || body.significanceMultiplier > 10) {
    throw createError({
      statusCode: 400,
      message: 'significanceMultiplier must be a number between 0.5 and 10'
    })
  }

  if (typeof body.playerCount !== 'number' || !Number.isInteger(body.playerCount) || body.playerCount < 1) {
    throw createError({
      statusCode: 400,
      message: 'playerCount must be a positive integer'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    // Parse defeated enemies from encounter record
    const rawDefeatedEnemies: { species: string; level: number; type?: 'pokemon' | 'human' }[] =
      JSON.parse(record.defeatedEnemies)

    // Build trainer ID set for override (if client provides explicit trainer IDs)
    const trainerEnemyIds: string[] = body.trainerEnemyIds ?? []

    // Enrich with isTrainer flag:
    // - Use the 'type' field if present (new entries from damage.post.ts)
    // - Fall back to trainerEnemyIds from the request body
    // - Default to false for legacy entries without type
    const defeatedEnemies: DefeatedEnemy[] = rawDefeatedEnemies.map((entry, index) => ({
      species: entry.species,
      level: entry.level,
      isTrainer: entry.type === 'human' || trainerEnemyIds.includes(String(index))
    }))

    // Calculate XP
    const result = calculateEncounterXp({
      defeatedEnemies,
      significanceMultiplier: body.significanceMultiplier,
      playerCount: body.playerCount,
      isBossEncounter: body.isBossEncounter ?? false
    })

    // Collect participating player-side Pokemon
    const participatingPokemon = combatants
      .filter((c: Combatant) => c.side === 'players' && c.type === 'pokemon')
      .map((c: Combatant) => {
        const entity = c.entity as {
          species: string
          nickname?: string | null
          level: number
          experience: number
          ownerId?: string | null
        }

        // Try to find the owner's name from human combatants
        let ownerName: string | null = null
        if (entity.ownerId) {
          const ownerCombatant = combatants.find(
            (oc: Combatant) => oc.type === 'human' && oc.entityId === entity.ownerId
          )
          if (ownerCombatant) {
            ownerName = (ownerCombatant.entity as { name: string }).name
          }
        }

        return {
          id: c.entityId,
          species: entity.species,
          nickname: entity.nickname ?? null,
          currentLevel: entity.level,
          currentExperience: entity.experience ?? 0,
          ownerId: entity.ownerId ?? null,
          ownerName
        }
      })

    return {
      success: true,
      data: {
        totalXpPerPlayer: result.totalXpPerPlayer,
        breakdown: result.breakdown,
        participatingPokemon
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to calculate XP'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
