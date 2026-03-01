/**
 * POST /api/pokemon/:id/evolution-undo
 *
 * Revert a Pokemon to its pre-evolution state using a snapshot.
 * Used immediately after an evolution to undo a mistake (wrong species,
 * wrong branching choice, etc.).
 *
 * Input:
 * {
 *   snapshot: PokemonSnapshot  // Pre-evolution state captured during evolve
 * }
 *
 * P2 feature: Evolution undo/cancellation
 */
import type { PokemonSnapshot } from '~/server/services/evolution.service'
import { restoreStoneToInventory } from '~/server/services/evolution.service'
import { prisma } from '~/server/utils/prisma'
import { notifyPokemonEvolved } from '~/server/utils/websocket'

const SNAPSHOT_FIELDS = [
  'species', 'type1', 'type2',
  'baseHp', 'baseAttack', 'baseDefense', 'baseSpAtk', 'baseSpDef', 'baseSpeed',
  'currentAttack', 'currentDefense', 'currentSpAtk', 'currentSpDef', 'currentSpeed',
  'maxHp', 'currentHp', 'spriteUrl', 'abilities', 'moves', 'capabilities', 'skills', 'heldItem',
  'notes'
] as const

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  if (!body.snapshot || typeof body.snapshot !== 'object') {
    throw createError({
      statusCode: 400,
      message: 'snapshot object is required'
    })
  }

  // Validate snapshot has required fields
  const snapshot = body.snapshot as PokemonSnapshot
  for (const field of SNAPSHOT_FIELDS) {
    if (field === 'type2' || field === 'spriteUrl' || field === 'heldItem' || field === 'notes') continue // nullable
    if (snapshot[field] === undefined || snapshot[field] === null) {
      throw createError({
        statusCode: 400,
        message: `snapshot.${field} is required`
      })
    }
  }

  try {
    // Fetch current Pokemon to get the species we're reverting FROM
    const currentPokemon = await prisma.pokemon.findUnique({
      where: { id },
      select: { species: true, ownerId: true }
    })

    if (!currentPokemon) {
      throw createError({
        statusCode: 404,
        message: 'Pokemon not found'
      })
    }

    // Guard: reject undo if Pokemon is in an active encounter
    const activeEncounters = await prisma.encounter.findMany({
      where: { isActive: true },
      select: { combatants: true }
    })

    for (const encounter of activeEncounters) {
      const combatants = JSON.parse(encounter.combatants) as Array<{ entityId?: string }>
      if (combatants.some(c => c.entityId === id)) {
        throw createError({
          statusCode: 409,
          message: 'Cannot undo evolution for a Pokemon in an active encounter.'
        })
      }
    }

    // Restore the Pokemon to pre-evolution state (including notes for history revert)
    const restored = await prisma.pokemon.update({
      where: { id },
      data: {
        species: snapshot.species,
        type1: snapshot.type1,
        type2: snapshot.type2,
        baseHp: snapshot.baseHp,
        baseAttack: snapshot.baseAttack,
        baseDefense: snapshot.baseDefense,
        baseSpAtk: snapshot.baseSpAtk,
        baseSpDef: snapshot.baseSpDef,
        baseSpeed: snapshot.baseSpeed,
        currentAttack: snapshot.currentAttack,
        currentDefense: snapshot.currentDefense,
        currentSpAtk: snapshot.currentSpAtk,
        currentSpDef: snapshot.currentSpDef,
        currentSpeed: snapshot.currentSpeed,
        maxHp: snapshot.maxHp,
        currentHp: snapshot.currentHp,
        spriteUrl: snapshot.spriteUrl,
        abilities: snapshot.abilities,
        moves: snapshot.moves,
        capabilities: snapshot.capabilities,
        skills: snapshot.skills,
        heldItem: snapshot.heldItem,
        notes: snapshot.notes ?? null
      }
    })

    // Restore consumed stone to trainer inventory if tracked in snapshot
    if (snapshot.consumedStone?.ownerId && snapshot.consumedStone?.itemName) {
      await restoreStoneToInventory(snapshot.consumedStone.ownerId, snapshot.consumedStone.itemName)
    }

    // Broadcast the revert
    notifyPokemonEvolved({
      pokemonId: id,
      previousSpecies: currentPokemon.species,
      newSpecies: snapshot.species,
      ownerId: currentPokemon.ownerId,
      changes: {
        previousSpecies: currentPokemon.species,
        newSpecies: snapshot.species,
        undone: true
      }
    })

    return {
      success: true,
      data: {
        pokemon: restored,
        revertedFrom: currentPokemon.species,
        revertedTo: snapshot.species
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to undo evolution'
    throw createError({
      statusCode: 400,
      message
    })
  }
})
