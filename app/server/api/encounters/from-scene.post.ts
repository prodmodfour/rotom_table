/**
 * Create a new encounter from a scene.
 * Scene Pokemon become wild enemy combatants with full DB sheets.
 * Scene characters become player combatants referencing existing DB records.
 */

import { prisma } from '~/server/utils/prisma'
import { generateAndCreatePokemon, buildPokemonCombatant } from '~/server/services/pokemon-generator.service'
import { sizeToTokenSize, buildOccupiedCellsSet, findPlacementPosition } from '~/server/services/grid-placement.service'
import { buildHumanEntityFromRecord } from '~/server/services/entity-builder.service'
import { buildCombatantFromEntity } from '~/server/services/combatant.service'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import { validateSignificanceTier } from '~/server/utils/significance-validation'
import type { Combatant } from '~/types'

interface ScenePokemonEntry {
  id: string
  speciesId?: string
  species: string
  level: number
  nickname?: string | null
}

interface SceneCharacterEntry {
  id: string
  characterId: string
  name: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { sceneId, battleType, significanceMultiplier, significanceTier } = body

  if (!sceneId) {
    throw createError({ statusCode: 400, message: 'sceneId is required' })
  }

  // Validate significance tier if provided
  validateSignificanceTier(significanceTier)

  try {
    // Fetch the scene
    const scene = await prisma.scene.findUnique({ where: { id: sceneId } })
    if (!scene) {
      throw createError({ statusCode: 404, message: 'Scene not found' })
    }

    // Create the encounter
    const encounter = await prisma.encounter.create({
      data: {
        name: scene.name,
        battleType: battleType || 'full_contact',
        weather: scene.weather ?? null,
        combatants: '[]',
        currentRound: 1,
        currentTurnIndex: 0,
        turnOrder: '[]',
        isActive: false,
        isPaused: false,
        isServed: false,
        gridEnabled: true,
        gridWidth: 20,
        gridHeight: 15,
        gridCellSize: 40,
        gridBackground: null,
        moveLog: '[]',
        defeatedEnemies: '[]',
        significanceMultiplier: significanceMultiplier ?? 1.0,
        significanceTier: significanceTier ?? 'insignificant'
      }
    })

    const combatants: Combatant[] = []
    const gridWidth = encounter.gridWidth
    const gridHeight = encounter.gridHeight

    // Track occupied cells for auto-placement
    const occupiedCells = buildOccupiedCellsSet([])

    // --- Process scene Pokemon (as wild enemies) ---
    const scenePokemon: ScenePokemonEntry[] = JSON.parse(scene.pokemon)

    for (const wild of scenePokemon) {
      const created = await generateAndCreatePokemon({
        speciesName: wild.species,
        level: wild.level,
        nickname: wild.nickname,
        origin: 'wild',
        originLabel: `Wild Pokemon - created from scene "${scene.name}"`
      })

      const tokenSize = sizeToTokenSize(created.data.size)
      const position = findPlacementPosition(occupiedCells, 'enemies', tokenSize, gridWidth, gridHeight)
      const combatant = buildPokemonCombatant(created, 'enemies', position)
      combatants.push(combatant)
    }

    // --- Process scene characters (as player combatants) ---
    const sceneCharacters: SceneCharacterEntry[] = JSON.parse(scene.characters)

    for (const sceneChar of sceneCharacters) {
      if (!sceneChar.characterId) continue

      const record = await prisma.humanCharacter.findUnique({
        where: { id: sceneChar.characterId }
      })
      if (!record) continue

      const entity = buildHumanEntityFromRecord(record)
      const position = findPlacementPosition(occupiedCells, 'players', 1, gridWidth, gridHeight)

      combatants.push(buildCombatantFromEntity({
        entityType: 'human',
        entityId: record.id,
        entity,
        side: 'players',
        position
      }))
    }

    // Save combatants to encounter
    const updatedEncounter = await prisma.encounter.update({
      where: { id: encounter.id },
      data: { combatants: JSON.stringify(combatants) }
    })

    const response = buildEncounterResponse(updatedEncounter, combatants)

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to create encounter from scene'
    throw createError({ statusCode: 500, message })
  }
})
