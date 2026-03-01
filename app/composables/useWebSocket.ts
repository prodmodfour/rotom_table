import type { WebSocketEvent, Encounter, Pokemon, HumanCharacter, MoveLogEntry, MovementPreview } from '~/types'
import { isPokemon } from '~/types'
import { getConnectionType } from '~/utils/connectionType'

// WebSocket configuration constants
const MAX_RECONNECT_ATTEMPTS_LOCAL = 5
const MAX_RECONNECT_ATTEMPTS_TUNNEL = 10
const BASE_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 30000
const KEEPALIVE_INTERVAL_MS = 45_000

// Lazy getters for stores to avoid initialization issues
const getEncounterStore = () => useEncounterStore()
const getLibraryStore = () => useLibraryStore()
const getGroupViewStore = () => useGroupViewStore()

/**
 * Determine if the current connection is through a tunnel (non-localhost/non-LAN).
 * Tunnel connections get more reconnect attempts since recovery may take longer.
 */
const isTunnelConnection = (): boolean => {
  return getConnectionType() === 'tunnel'
}

export function useWebSocket() {

  let ws: WebSocket | null = null
  let keepaliveTimer: ReturnType<typeof setInterval> | null = null
  let lastKeepaliveSent = 0
  const isConnected = ref(false)
  const isReconnecting = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = ref(MAX_RECONNECT_ATTEMPTS_LOCAL)
  const lastError = ref<string | null>(null)
  const latencyMs = ref<number | null>(null)
  const movementPreview = ref<MovementPreview | null>(null)
  const messageListeners = new Set<(message: WebSocketEvent) => void>()

  // Stored identity for auto re-identification on reconnect
  let storedRole: 'gm' | 'group' | 'player' | null = null
  let storedEncounterId: string | undefined = undefined
  let storedCharacterId: string | undefined = undefined

  const startKeepalive = () => {
    stopKeepalive()
    keepaliveTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        lastKeepaliveSent = Date.now()
        ws.send(JSON.stringify({
          type: 'keepalive',
          data: { timestamp: lastKeepaliveSent }
        }))
      }
    }, KEEPALIVE_INTERVAL_MS)
  }

  const stopKeepalive = () => {
    if (keepaliveTimer) {
      clearInterval(keepaliveTimer)
      keepaliveTimer = null
    }
  }

  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
      return
    }

    // Set max reconnect attempts based on connection type
    maxReconnectAttempts.value = isTunnelConnection()
      ? MAX_RECONNECT_ATTEMPTS_TUNNEL
      : MAX_RECONNECT_ATTEMPTS_LOCAL

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        isConnected.value = true
        isReconnecting.value = false
        reconnectAttempts.value = 0
        lastError.value = null
        startKeepalive()

        // Auto re-identify on reconnect if identity was stored
        if (storedRole) {
          send({ type: 'identify', data: {
            role: storedRole,
            encounterId: storedEncounterId,
            characterId: storedCharacterId
          } })

          // Rejoin encounter if applicable
          if (storedEncounterId) {
            send({ type: 'join_encounter', data: { encounterId: storedEncounterId } })
          }
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data)
          handleMessage(message)
          messageListeners.forEach(l => l(message))
        } catch (e) {
          lastError.value = 'Failed to parse WebSocket message'
        }
      }

      ws.onclose = () => {
        isConnected.value = false
        stopKeepalive()
        attemptReconnect()
      }

      ws.onerror = () => {
        lastError.value = 'WebSocket connection error'
      }
    } catch (e) {
      lastError.value = 'Failed to create WebSocket connection'
    }
  }

  const attemptReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts.value) {
      isReconnecting.value = false
      lastError.value = 'Max reconnect attempts reached'
      return
    }

    isReconnecting.value = true

    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts.value),
      MAX_RECONNECT_DELAY_MS
    )
    reconnectAttempts.value++

    setTimeout(() => {
      connect()
    }, delay)
  }

  /**
   * Manually reset reconnection state and attempt a fresh connection.
   * Useful for "Retry" buttons after max reconnect attempts are exhausted.
   */
  const resetAndReconnect = () => {
    reconnectAttempts.value = 0
    isReconnecting.value = false
    lastError.value = null
    latencyMs.value = null
    disconnect()
    connect()
  }

  const handleMessage = (message: WebSocketEvent) => {
    switch (message.type) {
      case 'encounter_update':
        getEncounterStore().updateFromWebSocket(message.data)
        break

      case 'character_update':
        if (isPokemon(message.data)) {
          const pokemon = message.data as Pokemon
          const store = getLibraryStore()
          const index = store.pokemon.findIndex(p => p.id === pokemon.id)
          if (index !== -1) {
            store.pokemon[index] = pokemon
          }
        } else {
          const human = message.data as HumanCharacter
          const store = getLibraryStore()
          const index = store.humans.findIndex(h => h.id === human.id)
          if (index !== -1) {
            store.humans[index] = human
          }
        }
        break

      case 'turn_change':
        // Trigger any turn change effects/sounds
        break

      case 'move_executed':
        // Could trigger animations or sounds
        break

      case 'sync_request':
        requestSync()
        break

      case 'pokemon_switched':
        getEncounterStore().updateFromWebSocket(message.data.encounter)
        break

      case 'pokemon_recalled':
        getEncounterStore().updateFromWebSocket(message.data.encounter)
        break

      case 'pokemon_released':
        getEncounterStore().updateFromWebSocket(message.data.encounter)
        break

      case 'encounter_served':
        getEncounterStore().updateFromWebSocket(message.data.encounter)
        break

      case 'encounter_unserved':
        getEncounterStore().clearEncounter()
        break

      case 'movement_preview':
        movementPreview.value = message.data
        break

      case 'serve_map':
        getGroupViewStore().setServedMap(message.data)
        break

      case 'clear_map':
        getGroupViewStore().setServedMap(null)
        break

      case 'clear_wild_spawn':
        getGroupViewStore().setWildSpawnPreview(null)
        break

      case 'keepalive_ack':
        // Calculate round-trip latency from keepalive
        if (lastKeepaliveSent > 0) {
          latencyMs.value = Date.now() - lastKeepaliveSent
        }
        break
    }
  }

  const send = (event: WebSocketEvent) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event))
    } else {
      lastError.value = 'Cannot send - WebSocket not connected'
    }
  }

  const identify = (role: 'gm' | 'group' | 'player', encounterId?: string, characterId?: string) => {
    // Store identity for auto re-identification on reconnect
    storedRole = role
    storedEncounterId = encounterId
    storedCharacterId = characterId
    send({ type: 'identify', data: { role, encounterId, characterId } })
  }

  const joinEncounter = (encounterId: string) => {
    // Update stored encounterId so reconnect rejoins
    storedEncounterId = encounterId
    send({ type: 'join_encounter', data: { encounterId } })
  }

  const leaveEncounter = () => {
    storedEncounterId = undefined
    send({ type: 'leave_encounter', data: null })
  }

  const requestSync = () => {
    send({ type: 'sync_request', data: null })
  }

  const onMessage = (listener: (message: WebSocketEvent) => void) => {
    messageListeners.add(listener)
    return () => { messageListeners.delete(listener) }
  }

  const disconnect = () => {
    stopKeepalive()
    if (ws) {
      // Null out handlers before close to prevent onclose from triggering
      // attemptReconnect(), which would race with any subsequent connect() call
      ws.onclose = null
      ws.onerror = null
      ws.onmessage = null
      ws.onopen = null
      ws.close()
      ws = null
    }
  }

  // Auto-connect on mount
  onMounted(() => {
    connect()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected: readonly(isConnected),
    isReconnecting: readonly(isReconnecting),
    reconnectAttempt: readonly(reconnectAttempts),
    maxReconnectAttempts: readonly(maxReconnectAttempts),
    lastError: readonly(lastError),
    latencyMs: readonly(latencyMs),
    movementPreview: readonly(movementPreview),
    connect,
    disconnect,
    resetAndReconnect,
    send,
    onMessage,
    identify,
    joinEncounter,
    leaveEncounter,
    requestSync
  }
}
