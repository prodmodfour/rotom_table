/**
 * POST /api/pokemon/:id/evolve
 *
 * Perform a Pokemon evolution. Changes species, types, base stats,
 * calculated stats, maxHp, currentHp, abilities, moves, capabilities, and skills.
 *
 * Input:
 * {
 *   targetSpecies: string,
 *   statPoints: { hp, attack, defense, specialAttack, specialDefense, speed },
 *   skipBaseRelations?: boolean,  // GM override
 *   abilities?: Array<{ name: string; effect: string }>,  // GM-resolved ability selection
 *   moves?: Array<MoveDetail>,  // Final move list after learning/replacing (max 6)
 *   consumeItem?: { ownerId, itemName, skipInventoryCheck? },  // P2: stone consumption
 *   consumeHeldItem?: boolean  // P2: consume held item (default true for held-item triggers)
 * }
 *
 * Validation:
 * - Pokemon must exist
 * - Target species must be in evolution triggers for current species
 * - Stat points must total level + 10
 * - Base Relations must be satisfied (unless skipBaseRelations)
 * - Level/held-item requirements must be met
 * - Moves array max length 6
 *
 * PTU Core Chapter 5, p.202
 */
import { performEvolution } from '~/server/services/evolution.service'
import type { Stats } from '~/server/services/evolution.service'
import { prisma } from '~/server/utils/prisma'
import { notifyPokemonEvolved, broadcast } from '~/server/utils/websocket'
import { applyTrainerXp, isNewSpecies } from '~/utils/trainerExperience'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  // Validate targetSpecies
  if (!body.targetSpecies || typeof body.targetSpecies !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'targetSpecies is required and must be a string'
    })
  }

  // Validate statPoints
  if (!body.statPoints || typeof body.statPoints !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'statPoints object is required'
    })
  }

  const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
  for (const key of statKeys) {
    if (typeof body.statPoints[key] !== 'number' || !Number.isInteger(body.statPoints[key])) {
      throw createError({
        statusCode: 400,
        message: `statPoints.${key} must be an integer`
      })
    }
    if (body.statPoints[key] < 0) {
      throw createError({
        statusCode: 400,
        message: `statPoints.${key} cannot be negative`
      })
    }
  }

  const statPoints: Stats = {
    hp: body.statPoints.hp,
    attack: body.statPoints.attack,
    defense: body.statPoints.defense,
    specialAttack: body.statPoints.specialAttack,
    specialDefense: body.statPoints.specialDefense,
    speed: body.statPoints.speed
  }

  // Validate optional abilities array
  let abilities: Array<{ name: string; effect: string }> | undefined
  if (body.abilities !== undefined) {
    if (!Array.isArray(body.abilities)) {
      throw createError({
        statusCode: 400,
        message: 'abilities must be an array'
      })
    }
    for (const ability of body.abilities) {
      if (!ability.name || typeof ability.name !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'Each ability must have a name string'
        })
      }
    }
    abilities = body.abilities.map((a: { name: string; effect?: string }) => ({
      name: a.name,
      effect: a.effect ?? ''
    }))
  }

  // Validate optional moves array
  let moves: Array<Record<string, unknown>> | undefined
  if (body.moves !== undefined) {
    if (!Array.isArray(body.moves)) {
      throw createError({
        statusCode: 400,
        message: 'moves must be an array'
      })
    }
    if (body.moves.length > 6) {
      throw createError({
        statusCode: 400,
        message: 'Pokemon cannot know more than 6 moves'
      })
    }
    for (const move of body.moves) {
      if (!move.name || typeof move.name !== 'string') {
        throw createError({
          statusCode: 400,
          message: 'Each move must have a name string'
        })
      }
    }
    moves = body.moves
  }

  // Validate optional consumeItem
  let consumeItem: { ownerId: string; itemName: string; skipInventoryCheck?: boolean } | undefined
  if (body.consumeItem !== undefined) {
    if (typeof body.consumeItem !== 'object' || !body.consumeItem) {
      throw createError({
        statusCode: 400,
        message: 'consumeItem must be an object'
      })
    }
    if (!body.consumeItem.ownerId || typeof body.consumeItem.ownerId !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'consumeItem.ownerId is required'
      })
    }
    if (!body.consumeItem.itemName || typeof body.consumeItem.itemName !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'consumeItem.itemName is required'
      })
    }
    consumeItem = {
      ownerId: body.consumeItem.ownerId,
      itemName: body.consumeItem.itemName,
      skipInventoryCheck: body.consumeItem.skipInventoryCheck === true
    }
  }

  // Parse optional consumeHeldItem (boolean)
  const consumeHeldItem = body.consumeHeldItem !== undefined
    ? body.consumeHeldItem === true
    : undefined

  try {
    // Guard: reject evolution if Pokemon is in an active encounter
    const activeEncounters = await prisma.encounter.findMany({
      where: { isActive: true },
      select: { combatants: true, id: true }
    })

    for (const encounter of activeEncounters) {
      const combatants = JSON.parse(encounter.combatants) as Array<{ entityId?: string }>
      const isInEncounter = combatants.some(c => c.entityId === id)
      if (isInEncounter) {
        throw createError({
          statusCode: 409,
          message: 'Cannot evolve a Pokemon that is in an active encounter. End the encounter first.'
        })
      }
    }

    const result = await performEvolution({
      pokemonId: id,
      targetSpecies: body.targetSpecies,
      statPoints,
      skipBaseRelations: body.skipBaseRelations === true,
      abilities,
      moves,
      consumeItem,
      consumeHeldItem
    })

    // Broadcast evolution to all connected clients
    const ownerId = (result.pokemon as Record<string, unknown>).ownerId as string | null
    notifyPokemonEvolved({
      pokemonId: id,
      previousSpecies: result.changes.previousSpecies,
      newSpecies: result.changes.newSpecies,
      ownerId: ownerId ?? null,
      changes: result.changes
    })

    // Check for new species -> +1 trainer XP (PTU Core p.461)
    // "Whenever a Trainer catches, hatches, or evolves a Pokemon species
    // they did not previously own, they gain +1 Experience."
    let speciesXpAwarded = false
    let speciesXpResult = null

    if (ownerId) {
      const trainerRecord = await prisma.humanCharacter.findUnique({
        where: { id: ownerId },
        select: { capturedSpecies: true, trainerXp: true, level: true, name: true }
      })

      if (trainerRecord) {
        const existingSpecies: string[] = JSON.parse(trainerRecord.capturedSpecies || '[]')
        const evolvedSpecies = result.changes.newSpecies
        const normalizedSpecies = evolvedSpecies.toLowerCase().trim()

        if (isNewSpecies(evolvedSpecies, existingSpecies)) {
          const updatedSpecies = [...existingSpecies, normalizedSpecies]

          const xpCalc = applyTrainerXp({
            currentXp: trainerRecord.trainerXp,
            currentLevel: trainerRecord.level,
            xpToAdd: 1
          })

          await prisma.humanCharacter.update({
            where: { id: ownerId },
            data: {
              capturedSpecies: JSON.stringify(updatedSpecies),
              trainerXp: xpCalc.newXp,
              level: xpCalc.newLevel
            }
          })

          speciesXpAwarded = true
          speciesXpResult = xpCalc

          if (xpCalc.levelsGained > 0) {
            broadcast({ type: 'character_update', data: { characterId: ownerId } })
          }
        }
      }
    }

    return {
      success: true,
      data: {
        pokemon: result.pokemon,
        changes: result.changes,
        undoSnapshot: result.undoSnapshot,
        speciesXp: ownerId ? {
          awarded: speciesXpAwarded,
          species: result.changes.newSpecies,
          xpResult: speciesXpResult
        } : undefined
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to evolve Pokemon'
    throw createError({
      statusCode: 400,
      message
    })
  }
})
