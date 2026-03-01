/**
 * POST /api/pokemon/:id/evolution-check
 *
 * Check which evolutions are available for a Pokemon based on its
 * current state (level, held item) and species evolution triggers.
 *
 * Returns available and ineligible evolutions with reasons,
 * plus P1 data for ability remapping and move learning:
 * - Current Pokemon's abilities and moves
 * - Old species ability list and learnset
 * - Target species ability list and learnset (per available evolution)
 *
 * No side effects — read-only check.
 *
 * PTU Core Chapter 5, p.202
 */
import { prisma } from '~/server/utils/prisma'
import { checkEvolutionEligibility } from '~/utils/evolutionCheck'
import { remapAbilities } from '~/server/services/evolution.service'
import { getEvolutionMoves } from '~/utils/evolutionCheck'
import type { EvolutionTrigger } from '~/types/species'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  try {
    // Fetch Pokemon with P1-relevant fields
    const pokemon = await prisma.pokemon.findUnique({
      where: { id },
      select: {
        id: true,
        species: true,
        level: true,
        heldItem: true,
        abilities: true,
        moves: true
      }
    })

    if (!pokemon) {
      throw createError({
        statusCode: 404,
        message: 'Pokemon not found'
      })
    }

    // Fetch full SpeciesData for current species (triggers + abilities + learnset)
    const speciesData = await prisma.speciesData.findUnique({
      where: { name: pokemon.species },
      select: {
        evolutionTriggers: true,
        abilities: true,
        numBasicAbilities: true,
        learnset: true
      }
    })

    if (!speciesData) {
      throw createError({
        statusCode: 404,
        message: `Species data not found for ${pokemon.species}`
      })
    }

    // Parse triggers
    let triggers: EvolutionTrigger[] = []
    try {
      triggers = JSON.parse(speciesData.evolutionTriggers || '[]')
    } catch {
      triggers = []
    }

    // Check eligibility
    const result = checkEvolutionEligibility({
      currentLevel: pokemon.level,
      heldItem: pokemon.heldItem,
      evolutionTriggers: triggers
    })

    // Parse current Pokemon abilities and moves
    const currentAbilities: Array<{ name: string; effect: string }> = JSON.parse(pokemon.abilities || '[]')
    const currentMoves: Array<{ name: string }> = JSON.parse(pokemon.moves || '[]')
    const currentMoveNames = currentMoves.map(m => m.name)

    // Parse old species data
    const oldSpeciesAbilities: string[] = JSON.parse(speciesData.abilities || '[]')
    const oldLearnset: Array<{ level: number; move: string }> = JSON.parse(speciesData.learnset || '[]')

    // Fetch target species data for available evolutions (extended for P1)
    const targetSpeciesNames = [
      ...result.available.map(a => a.toSpecies),
      ...result.ineligible.map(i => i.toSpecies)
    ]
    const targetSpeciesRecords = targetSpeciesNames.length > 0
      ? await prisma.speciesData.findMany({
          where: { name: { in: targetSpeciesNames } },
          select: {
            name: true, type1: true, type2: true,
            baseHp: true, baseAttack: true, baseDefense: true,
            baseSpAtk: true, baseSpDef: true, baseSpeed: true,
            abilities: true, numBasicAbilities: true,
            learnset: true
          }
        })
      : []
    const targetSpeciesMap = new Map(targetSpeciesRecords.map(s => [s.name, s]))

    return {
      success: true,
      data: {
        pokemonId: pokemon.id,
        currentSpecies: pokemon.species,
        currentLevel: pokemon.level,
        heldItem: pokemon.heldItem,
        // P1: current Pokemon state for modal
        currentAbilities,
        currentMoves,
        // P1: old species data for ability remapping and move learning
        oldSpeciesAbilities,
        available: result.available.map(a => {
          const target = targetSpeciesMap.get(a.toSpecies)
          const targetAbilities: string[] = target ? JSON.parse(target.abilities || '[]') : []
          const targetLearnset: Array<{ level: number; move: string }> = target
            ? JSON.parse(target.learnset || '[]')
            : []

          // Pre-compute ability remapping for the modal
          const abilityRemap = remapAbilities(currentAbilities, oldSpeciesAbilities, targetAbilities)

          // Pre-compute evolution moves
          const evolutionMovesResult = getEvolutionMoves({
            oldLearnset,
            newLearnset: targetLearnset,
            evolutionMinLevel: a.trigger.minimumLevel,
            currentLevel: pokemon.level,
            currentMoves: currentMoveNames
          })

          // Fetch full MoveData for each available evolution move
          const evoMoveNames = evolutionMovesResult.availableMoves.map(m => m.name)
          const moveDataRecords = evoMoveNames.length > 0
            ? await prisma.moveData.findMany({
                where: { name: { in: evoMoveNames } },
                select: {
                  name: true, type: true, damageClass: true, frequency: true,
                  ac: true, damageBase: true, range: true, effect: true
                }
              })
            : []
          const moveDataMap = new Map(moveDataRecords.map(m => [m.name, m]))

          // Enrich evolution moves with MoveData details
          const evolutionMoves = {
            ...evolutionMovesResult,
            availableMoves: evolutionMovesResult.availableMoves.map(m => ({
              ...m,
              detail: moveDataMap.get(m.name) || null
            }))
          }

          return {
            toSpecies: a.toSpecies,
            targetStage: a.trigger.targetStage,
            minimumLevel: a.trigger.minimumLevel,
            requiredItem: a.trigger.requiredItem,
            itemMustBeHeld: a.trigger.itemMustBeHeld,
            targetBaseStats: target ? {
              hp: target.baseHp, attack: target.baseAttack, defense: target.baseDefense,
              specialAttack: target.baseSpAtk, specialDefense: target.baseSpDef, speed: target.baseSpeed
            } : null,
            targetTypes: target ? [target.type1, target.type2].filter(Boolean) : [],
            // P1: ability remapping data
            targetAbilities,
            abilityRemap,
            // P1: evolution move data
            evolutionMoves
          }
        }),
        ineligible: result.ineligible.map(i => ({
          toSpecies: i.toSpecies,
          reason: i.reason
        }))
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to check evolution eligibility'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
