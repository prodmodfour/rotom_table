<template>
  <div class="player-view">
    <!-- Identity Picker (overlay when not identified) -->
    <PlayerIdentityPicker
      v-if="!isIdentified"
      @select="handleSelectCharacter"
    />

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
        <button class="player-top-bar__switch" @click="handleSwitchCharacter">
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
      </main>

      <!-- Bottom Navigation -->
      <PlayerNavBar
        :active-tab="activeTab"
        :has-active-encounter="hasActiveEncounter"
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
const { isConnected, identify, joinEncounter } = useWebSocket()

// Active tab
const activeTab = ref<PlayerTab>('character')

// Character name for top bar
const characterName = computed(() => playerStore.characterName ?? 'Player')

// Pokemon IDs for visibility checks
const pokemonIds = computed(() => playerStore.pokemonIds)

// Active encounter detection
const hasActiveEncounter = computed(() => encounterStore.encounter?.isActive ?? false)

// Poll for active encounters
let pollInterval: ReturnType<typeof setInterval> | null = null

const checkForActiveEncounter = async () => {
  try {
    const response = await $fetch<{ data: any[] }>('/api/encounters')
    const activeEncounter = response.data?.find((e: any) => e.isActive)

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
    }
  } catch {
    // Silently continue polling
  }
}

// Handle character selection
const handleSelectCharacter = async (characterId: string, characterName: string) => {
  try {
    await selectCharacter(characterId, characterName)

    // Identify as player via WebSocket
    if (isConnected.value) {
      identify('player', encounterStore.encounter?.id, characterId)
    }

    // Start polling for encounters
    await checkForActiveEncounter()
    if (!encounterStore.encounter?.isActive) {
      pollInterval = setInterval(checkForActiveEncounter, 3000)
    }
  } catch (err: any) {
    alert('Failed to select character: ' + (err.message || 'Unknown error'))
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
  const restored = await restoreIdentity()

  if (restored && playerStore.characterId) {
    // Re-identify on WebSocket connection
    if (isConnected.value) {
      identify('player', undefined, playerStore.characterId)
    }

    // Check for active encounters
    await checkForActiveEncounter()
    if (!encounterStore.encounter?.isActive) {
      pollInterval = setInterval(checkForActiveEncounter, 3000)
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
}
</style>
