import type { WebSocketEvent } from '~/types'
import type { PlayerActionRequest, PlayerActionAck, SceneSyncPayload } from '~/types/player-sync'

/**
 * Orchestrates all player-specific WebSocket behavior.
 *
 * Responsibilities:
 * - Watches isConnected + characterId to auto-identify as player
 * - Handles scene_sync, scene_deactivated, character_update events
 * - Exposes sendAction() with requestId tracking
 * - Manages pending action request tracking
 */
export function usePlayerWebSocket() {
  const { isConnected, identify, joinEncounter, send, onMessage } = useWebSocket()
  const playerStore = usePlayerIdentityStore()
  const encounterStore = useEncounterStore()
  const { refreshCharacterData } = usePlayerIdentity()
  const { handleSceneSync, handleSceneDeactivated, fetchActiveScene, activeScene } = usePlayerScene()

  // Pending action requests: requestId -> { resolve, reject, timestamp }
  const pendingActions = ref<Map<string, {
    resolve: (ack: PlayerActionAck) => void
    reject: (reason: string) => void
    timestamp: number
  }>>(new Map())

  const ACTION_TIMEOUT_MS = 60_000

  /**
   * Generate a unique request ID for action tracking.
   */
  const generateRequestId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  /**
   * Send a player action with requestId tracking.
   * Returns a promise that resolves when the GM acknowledges.
   * Times out after 60 seconds.
   */
  const sendAction = (action: Omit<PlayerActionRequest, 'requestId' | 'playerId' | 'playerName'>): Promise<PlayerActionAck> => {
    const requestId = generateRequestId()

    const request: PlayerActionRequest = {
      requestId,
      playerId: playerStore.characterId ?? '',
      playerName: playerStore.characterName ?? 'Player',
      ...action
    }

    return new Promise((resolve, reject) => {
      // Register the pending action
      const newMap = new Map(pendingActions.value)
      newMap.set(requestId, {
        resolve,
        reject,
        timestamp: Date.now()
      })
      pendingActions.value = newMap

      // Send via WebSocket
      send({ type: 'player_action', data: request })

      // Auto-timeout after 60 seconds
      setTimeout(() => {
        const current = pendingActions.value.get(requestId)
        if (current) {
          const cleaned = new Map(pendingActions.value)
          cleaned.delete(requestId)
          pendingActions.value = cleaned
          reject('Action request timed out')
        }
      }, ACTION_TIMEOUT_MS)
    })
  }

  /**
   * Handle incoming player_action_ack — resolve the matching pending action.
   */
  const handleActionAck = (ack: PlayerActionAck): void => {
    const pending = pendingActions.value.get(ack.requestId)
    if (!pending) return

    const cleaned = new Map(pendingActions.value)
    cleaned.delete(ack.requestId)
    pendingActions.value = cleaned

    pending.resolve(ack)
  }

  /**
   * Handle character_update events for the player's own character/pokemon.
   * Refreshes character data from the server when the updated entity
   * matches the player's character or any of their pokemon.
   */
  const handleCharacterUpdate = (data: { id?: string }): void => {
    if (!playerStore.characterId) return

    const entityId = data?.id
    if (entityId === playerStore.characterId || playerStore.pokemonIds.includes(entityId ?? '')) {
      refreshCharacterData()
    }
  }

  /**
   * Core WebSocket message handler for player-specific events.
   */
  const handlePlayerMessage = (message: WebSocketEvent): void => {
    switch (message.type) {
      case 'scene_sync':
        handleSceneSync(message.data as SceneSyncPayload)
        break

      case 'scene_deactivated':
        handleSceneDeactivated()
        break

      case 'player_action_ack':
        handleActionAck(message.data as PlayerActionAck)
        break

      case 'character_update':
        handleCharacterUpdate(message.data as { id?: string })
        break

      case 'scene_activated':
        // Fetch fresh scene data from REST to get correct isPlayerCharacter
        // values and pokemon ownership (scene_activated payload lacks enrichment)
        fetchActiveScene()
        break

      // Granular scene events — refresh the full scene from REST rather than
      // attempting incremental patching, which keeps the code simple and ensures
      // the player view stays consistent with the GM's scene state.
      case 'scene_update':
      case 'scene_character_added':
      case 'scene_character_removed':
      case 'scene_pokemon_added':
      case 'scene_pokemon_removed':
      case 'scene_group_created':
      case 'scene_group_updated':
      case 'scene_group_deleted':
      case 'scene_positions_updated':
        fetchActiveScene()
        break
    }
  }

  // Register the WebSocket message listener
  let removeListener: (() => void) | null = null

  onMounted(() => {
    removeListener = onMessage(handlePlayerMessage)
  })

  onUnmounted(() => {
    if (removeListener) {
      removeListener()
      removeListener = null
    }
  })

  // Watch for connection + identity to auto-identify
  watch(
    () => ({
      connected: isConnected.value,
      characterId: playerStore.characterId
    }),
    ({ connected, characterId }) => {
      if (connected && characterId) {
        identify('player', encounterStore.encounter?.id, characterId)

        if (encounterStore.encounter?.id) {
          joinEncounter(encounterStore.encounter.id)
        }
      }
    },
    { immediate: false }
  )

  return {
    // Expose underlying WebSocket utilities so the page uses a single connection
    isConnected,
    identify,
    joinEncounter,
    onMessage,
    send,
    // Player-specific state
    activeScene,
    sendAction,
    generateRequestId,
    pendingActionCount: computed(() => pendingActions.value.size)
  }
}
