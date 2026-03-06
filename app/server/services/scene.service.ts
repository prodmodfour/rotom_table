import { prisma } from '~/server/utils/prisma'
import { calculateSceneEndAp } from '~/utils/restHealing'
import { resetSceneUsage } from '~/utils/moveFrequency'
import type { Move } from '~/types/character'

/**
 * Restore AP for all characters in a scene at scene end.
 *
 * Per PTU Core (p221):
 * - Action Points are completely regained at the end of each Scene.
 * - Drained AP remains unavailable until Extended Rest.
 * - Bound AP is released at scene end (Stratagems auto-unbind).
 *
 * Groups characters by (level, drainedAp) to batch identical updates
 * into fewer updateMany calls within a single transaction.
 *
 * @param charactersJson - The raw JSON string from scene.characters
 * @returns The number of characters whose AP was restored
 */
export async function restoreSceneAp(charactersJson: string): Promise<number> {
  let characters: Array<{ characterId?: string; id?: string }>
  try {
    characters = JSON.parse(charactersJson || '[]')
  } catch {
    console.error('restoreSceneAp: failed to parse characters JSON, skipping AP restore')
    return 0
  }

  const characterIds = characters
    .map(c => c.characterId || c.id)
    .filter((cid): cid is string => !!cid)

  if (characterIds.length === 0) {
    return 0
  }

  const dbCharacters = await prisma.humanCharacter.findMany({
    where: { id: { in: characterIds } },
    select: { id: true, level: true, drainedAp: true }
  })

  if (dbCharacters.length === 0) {
    return 0
  }

  // Group by (level, drainedAp) so each group gets the same restoredAp value.
  // This reduces N individual updates to G updateMany calls (G <= N).
  const groupKey = (level: number, drainedAp: number) => `${level}:${drainedAp}`
  const groups = new Map<string, { ids: string[]; restoredAp: number }>()

  for (const char of dbCharacters) {
    const key = groupKey(char.level, char.drainedAp)
    const existing = groups.get(key)
    if (existing) {
      groups.set(key, { ...existing, ids: [...existing.ids, char.id] })
    } else {
      const restoredAp = calculateSceneEndAp(char.level, char.drainedAp)
      groups.set(key, { ids: [char.id], restoredAp })
    }
  }

  // Scene end: unbind all bound AP and restore to max minus drained
  await prisma.$transaction(
    [...groups.values()].map(({ ids, restoredAp }) =>
      prisma.humanCharacter.updateMany({
        where: { id: { in: ids } },
        data: {
          boundAp: 0,
          currentAp: restoredAp
        }
      })
    )
  )

  return dbCharacters.length
}

/**
 * Reset scene-frequency move counters for all Pokemon in a scene.
 *
 * Scene-frequency moves (Scene, Scene x2, Scene x3) and EOT cooldowns
 * must reset at scene boundaries. This reads each Pokemon's moves from
 * the database, applies resetSceneUsage(), and persists any changes.
 *
 * @param pokemonJson - The raw JSON string from scene.pokemon
 * @returns The number of Pokemon whose moves were reset
 */
export async function resetScenePokemonMoves(pokemonJson: string): Promise<number> {
  let pokemonRefs: Array<{ id?: string }>
  try {
    pokemonRefs = JSON.parse(pokemonJson || '[]')
  } catch {
    console.error('resetScenePokemonMoves: failed to parse pokemon JSON, skipping move reset')
    return 0
  }

  const pokemonIds = pokemonRefs
    .map(p => p.id)
    .filter((pid): pid is string => !!pid)

  if (pokemonIds.length === 0) {
    return 0
  }

  const dbPokemon = await prisma.pokemon.findMany({
    where: { id: { in: pokemonIds } },
    select: { id: true, moves: true }
  })

  if (dbPokemon.length === 0) {
    return 0
  }

  const updates: Promise<unknown>[] = []

  for (const poke of dbPokemon) {
    let moves: Move[]
    try {
      moves = JSON.parse(poke.moves || '[]')
    } catch {
      continue
    }

    const resetMoves = resetSceneUsage(moves)
    const movesChanged = !resetMoves.every((m, i) => m === moves[i])

    if (movesChanged) {
      updates.push(
        prisma.pokemon.update({
          where: { id: poke.id },
          data: { moves: JSON.stringify(resetMoves) }
        })
      )
    }
  }

  if (updates.length > 0) {
    await Promise.all(updates)
  }

  return updates.length
}
