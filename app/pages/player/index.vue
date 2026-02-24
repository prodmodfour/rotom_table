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
          <span
            class="player-top-bar__status"
            :class="isConnected ? 'player-top-bar__status--connected' : 'player-top-bar__status--disconnected'"
          ></span>
        </div>
        <button class="player-top-bar__switch" aria-label="Switch character" @click="handleSwitchCharacter">
          <PhSwap :size="18" />
        </button>
      </header>

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
const { isConnected, identify, joinEncounter, onMessage, send, activeScene: playerActiveScene } = usePlayerWebSocket()

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

    // Identify as player via WebSocket
    if (isConnected.value) {
      identify('player', encounterStore.encounter?.id, characterId)
    }

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

// WebSocket listener for real-time character/Pokemon updates
let removeWsListener: (() => void) | null = null

// Initialize on mount
onMounted(async () => {
  // Register WebSocket listener for character_update events
  removeWsListener = onMessage((message) => {
    if (message.type === 'character_update' && playerStore.characterId) {
      const data = message.data as { id?: string }
      const entityId = data?.id
      if (entityId === playerStore.characterId || playerStore.pokemonIds.includes(entityId ?? '')) {
        refreshCharacterData()
      }
    }
  })

  const restored = await restoreIdentity()

  if (restored && playerStore.characterId) {
    // Re-identify on WebSocket connection
    if (isConnected.value) {
      identify('player', undefined, playerStore.characterId)
    }

    // Check for active encounters
    await checkForActiveEncounter()
    if (!encounterStore.encounter?.isActive) {
      pollInterval = setInterval(checkForActiveEncounter, POLL_BASE_INTERVAL)
    }
  }
})

// Watch for WebSocket reconnection
watch(isConnected, (connected) => {
  if (connected && playerStore.characterId) {
    identify('player', encounterStore.encounter?.id, playerStore.characterId)
    if (encounterStore.encounter?.id) {
      joinEncounter(encounterStore.encounter.id)
    }
  }
})

// Cleanup
onUnmounted(() => {
  if (removeWsListener) {
    removeWsListener()
    removeWsListener = null
  }
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

  &__status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--connected {
      background: $color-success;
      box-shadow: 0 0 4px rgba($color-success, 0.5);
    }

    &--disconnected {
      background: $color-danger;
    }
  }

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
</style>
