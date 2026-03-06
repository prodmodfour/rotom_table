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

    // Read scene before deactivating to get character list
    const sceneData = await prisma.scene.findUnique({ where: { id } })
    if (!sceneData) {
      throw createError({
        statusCode: 404,
        message: 'Scene not found'
      })
    }

    // Deactivate the scene
    const scene = await prisma.scene.update({
      where: { id },
      data: { isActive: false }
    })

    // Restore AP for all characters in the scene
    const apRestoredCount = await restoreSceneAp(sceneData.characters)

    // Reset scene-frequency move counters for all Pokemon in the scene
    await resetScenePokemonMoves(sceneData.pokemon)

    // Clear GroupViewState if it was pointing to this scene
    await prisma.groupViewState.updateMany({
      where: { activeSceneId: id },
      data: { activeSceneId: null }
    })

    // Broadcast scene deactivation to group and player clients
    broadcastToGroupAndPlayers('scene_deactivated', { sceneId: scene.id })

    return {
      success: true,
      message: `Scene deactivated successfully. AP restored for ${apRestoredCount} character(s).`
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Failed to deactivate scene'
    console.error('Error deactivating scene:', error)
    throw createError({
      statusCode: 500,
      message
    })
  }
})
