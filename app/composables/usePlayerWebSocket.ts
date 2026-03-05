import type { WebSocketEvent } from '~/types'
import type {
  PlayerActionRequest,
  PlayerActionAck,
  PlayerTurnNotification,
  SceneSyncPayload
} from '~/types/player-sync'

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
  const {
    isConnected,
    isReconnecting,
    reconnectAttempt,
    maxReconnectAttempts,
    lastError,
    latencyMs,
    identify,
    joinEncounter,
    send,
    onMessage,
    resetAndReconnect,
    receivedFlankingMap
  } = useWebSocket()
  const playerStore = usePlayerIdentityStore()
  const encounterStore = useEncounterStore()
  const { refreshCharacterData } = usePlayerIdentity()
  const { handleSceneSync, handleSceneDeactivated, fetchActiveScene, activeScene } = usePlayerScene()
  const { vibrateOnTurnStart, vibrateOnDamageTaken, vibrateOnMoveExecute } = useHapticFeedback()

  // Pending action requests: requestId -> { resolve, reject, timestamp }
  const pendingActions = ref<Map<string, {
    resolve: (ack: PlayerActionAck) => void
    reject: (reason: string) => void
    timestamp: number
  }>>(new Map())

  const ACTION_TIMEOUT_MS = 60_000

  // Action acknowledgment notifications (for toast display)
  const lastActionAck = ref<PlayerActionAck | null>(null)

  // Turn notification state (for visual flash + tab switch)
  const turnNotification = ref<PlayerTurnNotification | null>(null)
  const TURN_NOTIFY_DURATION_MS = 5_000

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
   * Handle incoming player_action_ack — resolve the matching pending action
   * and set the toast notification state.
   */
  const handleActionAck = (ack: PlayerActionAck): void => {
    // Set toast state for UI display
    lastActionAck.value = { ...ack }
    setTimeout(() => {
      if (lastActionAck.value?.requestId === ack.requestId) {
        lastActionAck.value = null
      }
    }, 4000)

    // Resolve the pending promise
    const pending = pendingActions.value.get(ack.requestId)
    if (!pending) return

    const cleaned = new Map(pendingActions.value)
    cleaned.delete(ack.requestId)
    pendingActions.value = cleaned

    pending.resolve(ack)
  }

  /**
   * Handle player_turn_notify — trigger vibration, visual flash,
   * and expose state for the page to auto-switch to Encounter tab.
   */
  const handleTurnNotify = (notification: PlayerTurnNotification): void => {
    turnNotification.value = { ...notification }

    // Haptic feedback (mobile)
    vibrateOnTurnStart()

    // Auto-clear after 5 seconds
    setTimeout(() => {
      if (turnNotification.value?.combatantId === notification.combatantId) {
        turnNotification.value = null
      }
    }, TURN_NOTIFY_DURATION_MS)
  }

  /**
   * Handle damage_applied events — vibrate if the damaged entity
   * belongs to the player (their character or one of their pokemon).
   */
  const handleDamageApplied = (data: { targetId?: string }): void => {
    if (!playerStore.characterId) return
    const targetId = data?.targetId
    if (targetId === playerStore.characterId || playerStore.pokemonIds.includes(targetId ?? '')) {
      vibrateOnDamageTaken()
    }
  }

  /**
   * Handle move_executed events — vibrate if the player's combatant
   * was the one who executed the move.
   */
  const handleMoveExecuted = (data: { combatantId?: string; entityId?: string }): void => {
    if (!playerStore.characterId) return
    const entityId = data?.entityId
    if (entityId === playerStore.characterId || playerStore.pokemonIds.includes(entityId ?? '')) {
      vibrateOnMoveExecute()
    }
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

      case 'player_turn_notify':
        handleTurnNotify(message.data as PlayerTurnNotification)
        break

      case 'character_update':
        handleCharacterUpdate(message.data as { id?: string })
        break

      case 'damage_applied':
        handleDamageApplied(message.data as { targetId?: string })
        break

      case 'move_executed':
        handleMoveExecuted(message.data as { combatantId?: string; entityId?: string })
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
    isReconnecting,
    reconnectAttempt,
    maxReconnectAttempts,
    lastError,
    latencyMs,
    identify,
    joinEncounter,
    onMessage,
    send,
    resetAndReconnect,
    // Player-specific state
    activeScene,
    sendAction,
    generateRequestId,
    pendingActionCount: computed(() => pendingActions.value.size),
    // Action acknowledgment (for toast display)
    lastActionAck: readonly(lastActionAck),
    // Turn notification (for tab switch + visual flash)
    turnNotification: readonly(turnNotification),
    // P2: Flanking map received from GM broadcast
    receivedFlankingMap
  }
}
