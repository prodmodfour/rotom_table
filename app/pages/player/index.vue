<template>
  <div class="player-view">
    <!-- Identity Picker (overlay when not identified) -->
    <template v-if="!isIdentified">
      <div v-if="selectionError" class="player-error player-error--selection" role="alert">
        <PhWarningCircle :size="32" />
        <p>{{ selectionError }}</p>
      </div>
      <PlayerIdentityPicker @select="handleSelectCharacter" />
    </template>

    <!-- Main Player View (when identified) -->
    <template v-if="isIdentified">
      <!-- Top Bar -->
      <header class="player-top-bar">
        <div class="player-top-bar__info">
          <span class="player-top-bar__name">{{ characterName }}</span>
          <ConnectionStatus
            :is-connected="isConnected"
            :is-reconnecting="isReconnecting"
            :reconnect-attempt="reconnectAttempt"
            :max-reconnect-attempts="maxReconnectAttempts"
            :latency-ms="latencyMs"
            :last-error="wsError"
            @retry="resetAndReconnect"
          />
        </div>
        <button class="player-top-bar__switch" aria-label="Switch character" @click="handleSwitchCharacter">
          <PhSwap :size="18" />
        </button>
      </header>

      <!-- Connection Lost Banner -->
      <div v-if="isReconnecting" class="player-reconnect-banner" role="status" aria-live="polite">
        Connection lost. Reconnecting ({{ reconnectAttempt }}/{{ maxReconnectAttempts }})...
      </div>
      <div v-else-if="!isConnected && wsError" class="player-reconnect-banner player-reconnect-banner--failed" role="alert">
        Connection lost. <button class="player-reconnect-banner__retry" aria-label="Retry connection" @click="resetAndReconnect">Retry</button>
      </div>

      <!-- Loading State (skeleton screen) -->
      <PlayerSkeleton v-if="loading" />

      <!-- Error State -->
      <div v-else-if="error" class="player-error" role="alert">
        <PhWarningCircle :size="48" />
        <p>{{ error }}</p>
        <button class="btn btn--primary" aria-label="Retry loading character data" @click="refreshCharacterData">
          Retry
        </button>
      </div>

      <!-- Tab Content -->
      <main v-else-if="character" class="player-content">
        <Transition :name="tabTransitionName" mode="out-in">
          <PlayerCharacterSheet
            v-if="activeTab === 'character'"
            key="character"
            :character="character"
            @imported="refreshCharacterData"
          />
          <PlayerPokemonTeam
            v-else-if="activeTab === 'team'"
            key="team"
            :pokemon="pokemon"
            :active-pokemon-id="character.activePokemonId"
          />
          <PlayerEncounterView
            v-else-if="activeTab === 'encounter'"
            key="encounter"
            :my-character-id="character.id"
            :my-pokemon-ids="pokemonIds"
            :send="send"
            :on-message="onMessage"
          />
          <div v-else-if="activeTab === 'scene'" key="scene">
            <PlayerGroupControl
              :current-tab="groupViewTab"
              :send="send"
              :on-message="onMessage"
            />
            <PlayerSceneView :scene="playerActiveScene" />
          </div>
        </Transition>
      </main>

      <!-- Action Ack Toast (fixed overlay, auto-dismiss 3s) -->
      <Transition name="fade">
        <div
          v-if="lastActionAck"
          class="player-toast"
          :class="actionAckClass"
          role="status"
          aria-live="polite"
        >
          {{ actionAckMessage }}
          <span v-if="lastActionAck.reason" class="player-toast__reason">{{ lastActionAck.reason }}</span>
        </div>
      </Transition>

      <!-- Turn Notification Flash (fixed overlay) -->
      <Transition name="fade">
        <div v-if="turnNotification" class="player-turn-flash" role="alert" aria-live="assertive">
          <PhLightning :size="24" />
          <span>Your turn! {{ turnNotification.combatantName }}</span>
        </div>
      </Transition>

      <!-- Bottom Navigation -->
      <PlayerNavBar
        :active-tab="activeTab"
        :has-active-encounter="hasActiveEncounter"
        :has-active-scene="hasActiveScene"
        :has-pending-requests="pendingActionCount > 0"
        @change="activeTab = $event"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhSwap, PhWarningCircle, PhLightning } from '@phosphor-icons/vue'
import type { PlayerTab } from '~/types/player'

definePageMeta({
  layout: 'player'
})

useHead({
  title: 'PTU - Player View'
})

// Identity management
const {
  isIdentified,
  character,
  pokemon,
  loading,
  error,
  restoreIdentity,
  selectCharacter,
  clearIdentity,
  refreshCharacterData
} = usePlayerIdentity()

const playerStore = usePlayerIdentityStore()
const encounterStore = useEncounterStore()

// Single WebSocket connection via usePlayerWebSocket (scene sync, action tracking, identity)
const {
  isConnected,
  isReconnecting,
  reconnectAttempt,
  maxReconnectAttempts,
  latencyMs,
  lastError: wsError,
  identify,
  joinEncounter,
  send,
  resetAndReconnect,
  onMessage,
  activeScene: playerActiveScene,
  lastActionAck,
  turnNotification,
  pendingActionCount
} = usePlayerWebSocket()

// Provide the shared send function for child composables (usePlayerCombat)
provide(PLAYER_WS_SEND_KEY, send)

// Reconnect recovery
useStateSync({ isConnected, send, identify, joinEncounter, refreshCharacterData })

// Group View tab state (fetched from server for display in PlayerGroupControl)
const groupViewTab = ref('lobby')

// Active tab with slide direction tracking
const TAB_ORDER: Record<PlayerTab, number> = {
  character: 0,
  team: 1,
  encounter: 2,
  scene: 3
}

const activeTab = ref<PlayerTab>('character')
const tabTransitionName = ref('tab-slide-left')

watch(activeTab, (newTab, oldTab) => {
  if (!oldTab) return
  tabTransitionName.value = TAB_ORDER[newTab] > TAB_ORDER[oldTab]
    ? 'tab-slide-left'
    : 'tab-slide-right'
})

// Inline error for character selection failures (replaces alert())
const selectionError = ref<string | null>(null)

// Character name for top bar
const characterName = computed(() => playerStore.characterName ?? 'Player')

// Pokemon IDs for visibility checks
const pokemonIds = computed(() => playerStore.pokemonIds)

// Action ack toast computed properties
const isCaptureAckMiss = computed(() => {
  const ack = lastActionAck.value
  if (!ack || ack.status !== 'accepted' || !ack.result) return false
  const result = ack.result as Record<string, unknown>
  return result.accuracyHit === false
})

const actionAckClass = computed(() => {
  if (!lastActionAck.value) return ''
  if (isCaptureAckMiss.value) return 'player-toast--error'
  return lastActionAck.value.status === 'accepted'
    ? 'player-toast--success'
    : 'player-toast--error'
})

const actionAckMessage = computed(() => {
  if (!lastActionAck.value) return ''
  // Capture miss: show the reason from result instead of generic 'approved'
  if (isCaptureAckMiss.value) {
    const result = lastActionAck.value.result as Record<string, unknown>
    return (result.reason as string) || 'Ball missed!'
  }
  switch (lastActionAck.value.status) {
    case 'accepted': return 'Request approved by GM'
    case 'rejected': return 'Request rejected by GM'
    case 'pending': return 'Waiting for GM approval...'
    default: return 'Action acknowledged'
  }
})

// Active encounter detection
const hasActiveEncounter = computed(() => encounterStore.encounter?.isActive ?? false)

// Active scene detection (from WebSocket-pushed scene data)
const hasActiveScene = computed(() => playerActiveScene.value !== null)

// Auto-switch to encounter tab when turn notification arrives
watch(turnNotification, (notification) => {
  if (notification) {
    activeTab.value = 'encounter'
  }
})

// Track group view tab state via WebSocket
let removeTabListener: (() => void) | null = null
onMounted(() => {
  removeTabListener = onMessage((msg) => {
    if (msg.type === 'tab_state' || msg.type === 'tab_change') {
      const data = msg.data as { tab?: string; activeTab?: string }
      groupViewTab.value = data.tab ?? data.activeTab ?? 'lobby'
    }
  })
})

// Poll for active encounters with backoff on failure
const POLL_BASE_INTERVAL = 3000
const POLL_MAX_INTERVAL = 30000
const POLL_BACKOFF_THRESHOLD = 5

let pollInterval: ReturnType<typeof setInterval> | null = null
let pollFailureCount = 0

const getPollInterval = (): number => {
  if (pollFailureCount < POLL_BACKOFF_THRESHOLD) return POLL_BASE_INTERVAL
  const backoffFactor = Math.pow(2, pollFailureCount - POLL_BACKOFF_THRESHOLD)
  return Math.min(POLL_BASE_INTERVAL * backoffFactor, POLL_MAX_INTERVAL)
}

const restartPolling = () => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  const interval = getPollInterval()
  pollInterval = setInterval(checkForActiveEncounter, interval)
}

const checkForActiveEncounter = async () => {
  try {
    const response = await $fetch<{ data: any[] }>('/api/encounters')
    const activeEncounter = response.data?.find((e: any) => e.isActive)

    // Reset failure counter on success
    const wasBackedOff = pollFailureCount >= POLL_BACKOFF_THRESHOLD
    pollFailureCount = 0

    if (activeEncounter) {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }

      await encounterStore.loadEncounter(activeEncounter.id)

      if (isConnected.value && playerStore.characterId) {
        identify('player', activeEncounter.id, playerStore.characterId)
        joinEncounter(activeEncounter.id)
      }
    } else if (wasBackedOff) {
      // Restore normal polling speed after recovery from backoff
      restartPolling()
    }
  } catch {
    pollFailureCount++
    // If we just crossed the backoff threshold, restart with longer interval
    if (pollFailureCount === POLL_BACKOFF_THRESHOLD) {
      restartPolling()
    } else if (pollFailureCount > POLL_BACKOFF_THRESHOLD) {
      // Continue increasing backoff
      restartPolling()
    }
  }
}

// Handle character selection
const handleSelectCharacter = async (characterId: string, characterName: string) => {
  selectionError.value = null

  try {
    await selectCharacter(characterId, characterName)
    // usePlayerWebSocket watches characterId and auto-identifies on change

    // Start polling for encounters
    await checkForActiveEncounter()
    if (!encounterStore.encounter?.isActive) {
      pollInterval = setInterval(checkForActiveEncounter, POLL_BASE_INTERVAL)
    }
  } catch (err: any) {
    selectionError.value = 'Failed to select character: ' + (err.message || 'Unknown error')
  }
}

// Handle character switch
const handleSwitchCharacter = () => {
  clearIdentity()
  encounterStore.clearEncounter()
  activeTab.value = 'character'
}

// Initialize on mount
onMounted(async () => {
  // character_update handling is in usePlayerWebSocket (handleCharacterUpdate)

  const restored = await restoreIdentity()
  // usePlayerWebSocket watches characterId + isConnected and auto-identifies

  if (restored && playerStore.characterId) {
    // Check for active encounters
    await checkForActiveEncounter()
    if (!encounterStore.encounter?.isActive) {
      pollInterval = setInterval(checkForActiveEncounter, POLL_BASE_INTERVAL)
    }
  }
})

// Cleanup
onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  if (removeTabListener) {
    removeTabListener()
    removeTabListener = null
  }
})
</script>

<style lang="scss" scoped>
.player-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.player-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 $spacing-md;
  background: rgba($color-bg-primary, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid $border-color-default;
  position: sticky;
  top: 0;
  z-index: $z-index-sticky;

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    min-width: 0;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // ConnectionStatus component replaces the old status dot

  &__switch {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    color: $color-text-muted;
    cursor: pointer;
    border-radius: $border-radius-md;
    transition: all $transition-fast;

    &:hover {
      background: $color-bg-hover;
      color: $color-text;
    }
  }
}

.player-content {
  flex: 1;
  overflow-y: auto;
}

.player-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-xxl $spacing-md;
  color: $color-danger;
  text-align: center;
  flex: 1;

  &--selection {
    flex: 0;
    padding: $spacing-md;
    gap: $spacing-sm;
    font-size: $font-size-sm;
  }
}

.player-reconnect-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-md;
  background: rgba($color-warning, 0.15);
  color: $color-warning;
  font-size: $font-size-xs;
  font-weight: 500;
  text-align: center;
  border-bottom: 1px solid rgba($color-warning, 0.3);

  &--failed {
    background: rgba($color-danger, 0.15);
    color: $color-danger;
    border-bottom-color: rgba($color-danger, 0.3);
  }

  &__retry {
    padding: 2px $spacing-sm;
    font-size: $font-size-xs;
    font-weight: 600;
    color: inherit;
    background: transparent;
    border: 1px solid currentColor;
    border-radius: $border-radius-sm;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: rgba($color-warning, 0.1);
    }
  }

  &--failed &__retry:hover {
    background: rgba($color-danger, 0.1);
  }
}

.player-toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-index-toast;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-md;
  font-size: $font-size-sm;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

  &--success {
    background: rgba($color-success, 0.9);
    color: white;
  }

  &--error {
    background: rgba($color-danger, 0.9);
    color: white;
  }

  &__reason {
    font-weight: 400;
    opacity: 0.85;
  }
}

.player-turn-flash {
  position: fixed;
  top: 56px;
  left: 50%;
  transform: translateX(-50%);
  z-index: $z-index-toast;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-md;
  background: rgba($color-accent-scarlet, 0.95);
  color: white;
  font-size: $font-size-sm;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  box-shadow: 0 4px 16px rgba($color-accent-scarlet, 0.4);
  animation: flash-pulse 0.5s ease-in-out 3;
}

@keyframes flash-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Tab slide transitions (direction based on tab order)
.tab-slide-left-enter-active,
.tab-slide-left-leave-active,
.tab-slide-right-enter-active,
.tab-slide-right-leave-active {
  transition: all 0.2s ease;
}

.tab-slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.tab-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.tab-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.tab-slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

// 4K scaling
@media (min-width: $breakpoint-4k) {
  .player-top-bar {
    height: 72px;
    padding: 0 $spacing-4k-md;

    &__name {
      font-size: $font-size-4k-md;
    }

    &__switch {
      width: 56px;
      height: 56px;
    }
  }

  .player-reconnect-banner {
    padding: $spacing-4k-sm $spacing-4k-md;
    font-size: $font-size-4k-sm;
  }

  .player-toast {
    padding: $spacing-4k-sm $spacing-4k-md;
    font-size: $font-size-4k-sm;
  }

  .player-turn-flash {
    padding: $spacing-4k-sm $spacing-4k-md;
    font-size: $font-size-4k-sm;
  }
}
</style>
