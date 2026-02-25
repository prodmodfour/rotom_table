<template>
  <div class="player-view">
    <!-- Identity Picker (overlay when not identified) -->
    <template v-if="!isIdentified">
      <div v-if="selectionError" class="player-error player-error--selection">
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
      <div v-if="isReconnecting" class="player-reconnect-banner">
        Connection lost. Reconnecting ({{ reconnectAttempt }}/{{ maxReconnectAttempts }})...
      </div>
      <div v-else-if="!isConnected && wsError" class="player-reconnect-banner player-reconnect-banner--failed">
        Connection lost. <button class="player-reconnect-banner__retry" @click="resetAndReconnect">Retry</button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="player-loading">
        <div class="player-spinner"></div>
        <p>Loading character data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="player-error">
        <PhWarningCircle :size="48" />
        <p>{{ error }}</p>
        <button class="btn btn--primary" @click="refreshCharacterData">
          Retry
        </button>
      </div>

      <!-- Tab Content -->
      <main v-else-if="character" class="player-content">
        <PlayerCharacterSheet
          v-if="activeTab === 'character'"
          :character="character"
          @imported="refreshCharacterData"
        />
        <PlayerPokemonTeam
          v-else-if="activeTab === 'team'"
          :pokemon="pokemon"
          :active-pokemon-id="character.activePokemonId"
        />
        <PlayerEncounterView
          v-else-if="activeTab === 'encounter'"
          :my-character-id="character.id"
          :my-pokemon-ids="pokemonIds"
        />
        <PlayerSceneView
          v-else-if="activeTab === 'scene'"
          :scene="playerActiveScene"
        />
      </main>

      <!-- Bottom Navigation -->
      <PlayerNavBar
        :active-tab="activeTab"
        :has-active-encounter="hasActiveEncounter"
        :has-active-scene="hasActiveScene"
        @change="activeTab = $event"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhSwap, PhWarningCircle } from '@phosphor-icons/vue'
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
  activeScene: playerActiveScene
} = usePlayerWebSocket()

// Provide the shared send function for child composables (usePlayerCombat)
provide(PLAYER_WS_SEND_KEY, send)

// Active tab
const activeTab = ref<PlayerTab>('character')

// Inline error for character selection failures (replaces alert())
const selectionError = ref<string | null>(null)

// Character name for top bar
const characterName = computed(() => playerStore.characterName ?? 'Player')

// Pokemon IDs for visibility checks
const pokemonIds = computed(() => playerStore.pokemonIds)

// Active encounter detection
const hasActiveEncounter = computed(() => encounterStore.encounter?.isActive ?? false)

// Active scene detection (from WebSocket-pushed scene data)
const hasActiveScene = computed(() => playerActiveScene.value !== null)

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
    width: 36px;
    height: 36px;
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

.player-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
  padding: $spacing-xxl $spacing-md;
  color: $color-text-muted;
  flex: 1;
}

.player-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $glass-border;
  border-top-color: $color-accent-scarlet;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
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
      background: rgba(currentColor, 0.1);
    }
  }
}
</style>
