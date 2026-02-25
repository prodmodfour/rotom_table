import type { WebSocketEvent } from '~/types'

/**
 * Reconnect recovery composable for the player view.
 *
 * When the WebSocket reconnects after a disconnect, this composable
 * automatically re-identifies the player, requests full encounter state,
 * scene sync, and tab state to bring the client back to a consistent view.
 *
 * Usage: Call in the player page component. Requires the player identity
 * store to be populated and the WebSocket to be connected.
 */
export function useStateSync(options: {
  isConnected: Readonly<Ref<boolean>>
  send: (event: WebSocketEvent) => void
  identify: (role: 'gm' | 'group' | 'player', encounterId?: string, characterId?: string) => void
  joinEncounter: (encounterId: string) => void
  refreshCharacterData: () => Promise<void>
}) {
  const playerStore = usePlayerIdentityStore()
  const encounterStore = useEncounterStore()

  // Track if we've been connected before (to distinguish initial connect from reconnect)
  const hasConnectedBefore = ref(false)
  const isSyncing = ref(false)
  const lastSyncTimestamp = ref(0)

  // Minimum interval between syncs to avoid spamming
  const SYNC_COOLDOWN_MS = 5_000

  /**
   * Perform a full state sync after reconnection.
   * Re-identifies the player, requests encounter state, scene, and tab state.
   */
  const performSync = async (): Promise<void> => {
    const now = Date.now()
    if (now - lastSyncTimestamp.value < SYNC_COOLDOWN_MS) return
    if (!playerStore.characterId) return

    isSyncing.value = true
    lastSyncTimestamp.value = now

    try {
      // 1. Re-identify as player
      options.identify(
        'player',
        encounterStore.encounter?.id,
        playerStore.characterId
      )

      // 2. Rejoin encounter if active
      if (encounterStore.encounter?.id) {
        options.joinEncounter(encounterStore.encounter.id)
      }

      // 3. Request full encounter state
      options.send({ type: 'sync_request', data: null })

      // 4. Request active scene
      options.send({ type: 'scene_request', data: null as unknown as { sceneId?: string } })

      // 5. Request tab state
      options.send({ type: 'tab_sync_request', data: null })

      // 6. Re-fetch character data via REST as a safety net
      try {
        await options.refreshCharacterData()
      } catch {
        // Network may still be recovering — silently ignore
      }
    } finally {
      isSyncing.value = false
    }
  }

  // Watch for reconnections
  watch(
    () => options.isConnected.value,
    (connected) => {
      if (connected && hasConnectedBefore.value) {
        // This is a reconnection — perform full sync
        performSync()
      }
      if (connected) {
        hasConnectedBefore.value = true
      }
    }
  )

  return {
    isSyncing: readonly(isSyncing),
    performSync
  }
}
