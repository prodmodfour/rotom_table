import type { SceneSyncPayload } from '~/types/player-sync'

/**
 * Player view of a scene — stripped to player-visible fields.
 * No terrains, modifiers, or GM-only metadata.
 */
export interface PlayerSceneData {
  id: string
  name: string
  description: string | null
  locationName: string | null
  locationImage: string | null
  weather: string | null
  isActive: boolean
  characters: Array<{ id: string; name: string; isPlayerCharacter: boolean }>
  pokemon: Array<{ id: string; nickname: string | null; species: string; ownerId: string | null }>
  groups: Array<{ id: string; name: string }>
}

/**
 * Composable for player scene state management.
 * Receives scene data via WebSocket (scene_sync) and provides
 * REST fallback for reconnection recovery.
 */
export function usePlayerScene() {
  const activeScene = ref<PlayerSceneData | null>(null)

  /**
   * Handle scene_sync WebSocket event.
   * Maps the payload to PlayerSceneData.
   */
  const handleSceneSync = (payload: SceneSyncPayload): void => {
    activeScene.value = mapSceneToPlayerView(payload)
  }

  /**
   * Handle scene deactivation — clear the active scene.
   */
  const handleSceneDeactivated = (): void => {
    activeScene.value = null
  }

  /**
   * REST fallback: fetch the active scene from the server.
   * Used when WebSocket is unavailable or on initial reconnect.
   */
  const fetchActiveScene = async (): Promise<void> => {
    try {
      const response = await $fetch<{ success: boolean; data: unknown | null }>('/api/scenes/active')

      if (!response.success || !response.data) {
        activeScene.value = null
        return
      }

      const scene = response.data as {
        id: string
        name: string
        description?: string | null
        locationName?: string | null
        locationImage?: string | null
        weather?: string | null
        isActive: boolean
        characters: Array<{
          id: string
          characterId: string
          name: string
        }>
        pokemon: Array<{
          id: string
          species: string
          nickname?: string | null
        }>
        groups: Array<{
          id: string
          name: string
        }>
      }

      // REST response has full scene data — map to player view
      activeScene.value = {
        id: scene.id,
        name: scene.name,
        description: scene.description ?? null,
        locationName: scene.locationName ?? null,
        locationImage: scene.locationImage ?? null,
        weather: scene.weather ?? null,
        isActive: scene.isActive,
        characters: scene.characters.map(c => ({
          id: c.characterId ?? c.id,
          name: c.name,
          isPlayerCharacter: true // Cannot determine from REST; assume visible characters are PCs
        })),
        pokemon: scene.pokemon.map(p => ({
          id: p.id,
          nickname: p.nickname ?? null,
          species: p.species,
          ownerId: null // Not available from REST active endpoint
        })),
        groups: scene.groups.map(g => ({
          id: g.id,
          name: g.name
        }))
      }
    } catch {
      // Failed to fetch active scene — leave current state unchanged
    }
  }

  /**
   * Map a SceneSyncPayload to the PlayerSceneData shape.
   * Creates a new object (immutable pattern).
   */
  const mapSceneToPlayerView = (payload: SceneSyncPayload): PlayerSceneData => ({
    id: payload.scene.id,
    name: payload.scene.name,
    description: payload.scene.description,
    locationName: payload.scene.locationName,
    locationImage: payload.scene.locationImage,
    weather: payload.scene.weather,
    isActive: payload.scene.isActive,
    characters: payload.scene.characters.map(c => ({ ...c })),
    pokemon: payload.scene.pokemon.map(p => ({ ...p })),
    groups: payload.scene.groups.map(g => ({ ...g }))
  })

  return {
    activeScene: readonly(activeScene),
    handleSceneSync,
    handleSceneDeactivated,
    fetchActiveScene
  }
}
