import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { serializeCharacter } from '~/server/utils/serializers'

/**
 * Zod schema for the import payload.
 * Only validates the fields that players are allowed to edit offline:
 * - Character: background, personality, goals, notes
 * - Pokemon: nicknames, held items, move order/selection from known moves
 */
const pokemonImportSchema = z.object({
  id: z.string().min(1),
  nickname: z.string().nullable().optional(),
  heldItem: z.string().nullable().optional(),
  moves: z.array(z.object({
    id: z.string(),
    name: z.string()
  })).optional()
})

const importPayloadSchema = z.object({
  exportVersion: z.number().int().min(1),
  exportedAt: z.string().datetime(),
  character: z.object({
    id: z.string().min(1),
    background: z.string().nullable().optional(),
    personality: z.string().nullable().optional(),
    goals: z.string().nullable().optional(),
    notes: z.string().nullable().optional()
  }),
  pokemon: z.array(pokemonImportSchema).optional()
})

interface FieldConflict {
  entityType: 'character' | 'pokemon'
  entityId: string
  entityName: string
  field: string
  importValue: unknown
  serverValue: unknown
  resolution: 'server_wins'
}

/**
 * POST /api/player/import/:characterId
 *
 * Accepts an exported JSON payload and merges safe offline edits.
 * Only updates fields that players can change offline:
 * - Character: background, personality, goals, notes
 * - Pokemon: nicknames, held items, move order/selection
 *
 * Includes conflict detection: if the server-side updatedAt is newer
 * than the export's exportedAt for a given entity, any differing fields
 * are flagged as conflicts (server wins).
 */
export default defineEventHandler(async (event) => {
  const characterId = getRouterParam(event, 'characterId')

  if (!characterId) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  const body = await readBody(event)

  // Validate payload structure
  const parseResult = importPayloadSchema.safeParse(body)
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map((i: any) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw createError({
      statusCode: 400,
      message: `Invalid import payload: ${issues}`
    })
  }

  const payload = parseResult.data

  // Validate character ID matches route
  if (payload.character.id !== characterId) {
    throw createError({
      statusCode: 400,
      message: 'Character ID in payload does not match route parameter'
    })
  }

  try {
    const character = await prisma.humanCharacter.findUnique({
      where: { id: characterId },
      include: { pokemon: true }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: 'Character not found'
      })
    }

    const exportedAt = new Date(payload.exportedAt)
    const conflicts: FieldConflict[] = []

    // --- Character field updates ---
    const charEditableFields = ['background', 'personality', 'goals', 'notes'] as const
    const characterUpdate: Record<string, string | null> = {}

    for (const field of charEditableFields) {
      const importValue = payload.character[field] ?? undefined
      if (importValue === undefined) continue

      const serverValue = character[field]

      // Check for conflict: server was modified after the export
      if (character.updatedAt > exportedAt && serverValue !== importValue) {
        conflicts.push({
          entityType: 'character',
          entityId: characterId,
          entityName: character.name,
          field,
          importValue,
          serverValue,
          resolution: 'server_wins'
        })
        continue
      }

      // No conflict or server hasn't changed — apply the import value
      if (serverValue !== importValue) {
        characterUpdate[field] = importValue ?? null
      }
    }

    // --- Pokemon field updates ---
    const pokemonUpdates: Array<{ id: string; data: Record<string, unknown> }> = []

    if (payload.pokemon) {
      const ownedPokemonMap = new Map(
        character.pokemon.map(p => [p.id, p])
      )

      for (const importPokemon of payload.pokemon) {
        const serverPokemon = ownedPokemonMap.get(importPokemon.id)
        if (!serverPokemon) continue // Skip pokemon not owned by this character

        const pokemonUpdate: Record<string, unknown> = {}

        // Nickname
        if (importPokemon.nickname !== undefined) {
          const importNickname = importPokemon.nickname
          const serverNickname = serverPokemon.nickname

          if (serverPokemon.updatedAt > exportedAt && serverNickname !== importNickname) {
            conflicts.push({
              entityType: 'pokemon',
              entityId: serverPokemon.id,
              entityName: serverPokemon.nickname || serverPokemon.species,
              field: 'nickname',
              importValue: importNickname,
              serverValue: serverNickname,
              resolution: 'server_wins'
            })
          } else if (serverNickname !== importNickname) {
            pokemonUpdate.nickname = importNickname
          }
        }

        // Held item
        if (importPokemon.heldItem !== undefined) {
          const importHeldItem = importPokemon.heldItem
          const serverHeldItem = serverPokemon.heldItem

          if (serverPokemon.updatedAt > exportedAt && serverHeldItem !== importHeldItem) {
            conflicts.push({
              entityType: 'pokemon',
              entityId: serverPokemon.id,
              entityName: serverPokemon.nickname || serverPokemon.species,
              field: 'heldItem',
              importValue: importHeldItem,
              serverValue: serverHeldItem,
              resolution: 'server_wins'
            })
          } else if (serverHeldItem !== importHeldItem) {
            pokemonUpdate.heldItem = importHeldItem
          }
        }

        // Move order/selection (reorder or toggle from known moves only)
        if (importPokemon.moves) {
          const serverMoves = JSON.parse(serverPokemon.moves)
          const serverMoveIds = new Set(serverMoves.map((m: any) => m.id))

          // Only accept moves that already exist on the server (no new moves)
          const validImportMoves = importPokemon.moves.filter(
            (m: any) => serverMoveIds.has(m.id)
          )

          // Reorder server moves to match the import order
          const reorderedMoves = validImportMoves.map((importMove: any) =>
            serverMoves.find((sm: any) => sm.id === importMove.id)
          ).filter(Boolean)

          // Append any server moves not in the import (player may have deselected them)
          const importMoveIds = new Set(validImportMoves.map((m: any) => m.id))
          const remainingMoves = serverMoves.filter(
            (sm: any) => !importMoveIds.has(sm.id)
          )
          const finalMoves = [...reorderedMoves, ...remainingMoves]

          const serverMovesJson = JSON.stringify(serverMoves)
          const finalMovesJson = JSON.stringify(finalMoves)

          if (serverPokemon.updatedAt > exportedAt && serverMovesJson !== finalMovesJson) {
            conflicts.push({
              entityType: 'pokemon',
              entityId: serverPokemon.id,
              entityName: serverPokemon.nickname || serverPokemon.species,
              field: 'moves',
              importValue: `${validImportMoves.length} moves reordered`,
              serverValue: `${serverMoves.length} moves on server`,
              resolution: 'server_wins'
            })
          } else if (serverMovesJson !== finalMovesJson) {
            pokemonUpdate.moves = finalMovesJson
          }
        }

        if (Object.keys(pokemonUpdate).length > 0) {
          pokemonUpdates.push({ id: serverPokemon.id, data: pokemonUpdate })
        }
      }
    }

    // Apply all updates in a single transaction for atomicity
    const hasCharacterUpdates = Object.keys(characterUpdate).length > 0
    const hasPokemonUpdates = pokemonUpdates.length > 0

    if (hasCharacterUpdates || hasPokemonUpdates) {
      await prisma.$transaction(async (tx) => {
        if (hasCharacterUpdates) {
          await tx.humanCharacter.update({
            where: { id: characterId },
            data: characterUpdate
          })
        }
        for (const { id, data } of pokemonUpdates) {
          await tx.pokemon.update({ where: { id }, data })
        }
      })
    }

    // Re-fetch the updated character for response
    const updatedCharacter = await prisma.humanCharacter.findUnique({
      where: { id: characterId },
      include: { pokemon: true }
    })

    const characterFieldsUpdated = Object.keys(characterUpdate).length
    const pokemonUpdated = pokemonUpdates.length

    return {
      success: true,
      data: {
        character: updatedCharacter ? serializeCharacter(updatedCharacter) : null,
        characterFieldsUpdated,
        pokemonUpdated,
        conflicts,
        hasConflicts: conflicts.length > 0
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to import character data'
    })
  }
})
