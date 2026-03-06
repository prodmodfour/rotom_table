import { prisma } from '~/server/utils/prisma'
import { broadcastToGroupAndPlayers } from '~/server/utils/websocket'
import { restoreSceneAp, resetScenePokemonMoves } from '~/server/services/scene.service'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Scene ID is required'
      })
    }

    // Restore AP for characters in any currently active scenes before deactivating
    // Per PTU Core (p221): AP is completely regained at scene end (minus drained AP)
    const activeScenes = await prisma.scene.findMany({
      where: { isActive: true }
    })

    for (const activeScene of activeScenes) {
      await restoreSceneAp(activeScene.characters)
      await resetScenePokemonMoves(activeScene.pokemon)
    }

    // Deactivate all other scenes
    await prisma.scene.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Activate this scene
    const scene = await prisma.scene.update({
      where: { id },
      data: { isActive: true }
    })

    // Update GroupViewState to point to this scene
    await prisma.groupViewState.upsert({
      where: { id: 'singleton' },
      update: { activeSceneId: scene.id },
      create: { id: 'singleton', activeSceneId: scene.id }
    })

    const parsed = {
      id: scene.id,
      name: scene.name,
      description: scene.description,
      locationName: scene.locationName,
      locationImage: scene.locationImage,
      pokemon: JSON.parse(scene.pokemon),
      characters: JSON.parse(scene.characters),
      groups: JSON.parse(scene.groups),
      weather: scene.weather,
      terrains: JSON.parse(scene.terrains),
      modifiers: JSON.parse(scene.modifiers),
      habitatId: scene.habitatId,
      isActive: scene.isActive,
      createdAt: scene.createdAt,
      updatedAt: scene.updatedAt
    }

    // Broadcast scene activation to group and player clients
    broadcastToGroupAndPlayers('scene_activated', { scene: parsed })

    return {
      success: true,
      data: parsed
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to activate scene'
    console.error('Error activating scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
