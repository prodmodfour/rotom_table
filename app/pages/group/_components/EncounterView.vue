<template>
  <div class="encounter-view">
    <!-- Wild Spawn Overlay -->
    <WildSpawnOverlay :wild-spawn="wildSpawnPreview" />

    <!-- No Served Encounter - Show waiting message -->
    <div v-if="!encounter || !encounter.isServed" class="encounter-view__waiting">
      <div class="waiting-card">
        <PhSpinner class="waiting-spinner" :size="48" />
        <h2>Waiting for Encounter</h2>
        <p>The GM will serve an encounter when combat begins.</p>
      </div>
    </div>

    <!-- Active Encounter -->
    <div v-else class="encounter-view__active">
      <!-- Header -->
      <header class="encounter-header">
        <div class="encounter-header__info">
          <h1>{{ encounter.name }}</h1>
          <span class="round-badge">Round {{ encounter.currentRound }}</span>
          <span v-if="encounter.weather" class="weather-badge" :title="weatherTooltip">
            {{ weatherLabel }}
            <span v-if="encounter.weatherDuration > 0" class="weather-rounds">
              {{ encounter.weatherDuration }}r
            </span>
          </span>
        </div>
        <div class="encounter-header__turn" v-if="currentCombatant">
          <span class="turn-label">Current Turn:</span>
          <span class="turn-name">{{ getCombatantName(currentCombatant) }}</span>
        </div>
      </header>

      <!-- Main Content -->
      <main class="encounter-main">
        <!-- Initiative Tracker -->
        <div class="initiative-sidebar">
          <InitiativeTracker
            :combatants="sortedCombatants"
            :current-turn-id="currentCombatant?.id"
            :current-phase="encounter?.battleType === 'trainer' ? encounter?.currentPhase : undefined"
          />

          <!-- League Battle: Declaration Summary (visible when declarations exist) -->
          <DeclarationSummary />
        </div>

        <!-- Grid View -->
        <div class="grid-view-panel" data-testid="group-grid-panel">
          <GroupGridCanvas
            :config="gridConfig"
            :combatants="encounter.combatants"
            :current-turn-id="currentCombatant?.id"
            :movement-preview="movementPreview"
          />
        </div>

        <!-- Current Combatant Details -->
        <CombatantDetailsPanel :combatant="currentCombatant" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSpinner } from '@phosphor-icons/vue'
import type { GridConfig } from '~/types'
import { useFogOfWarStore } from '~/stores/fogOfWar'
import { useTerrainStore } from '~/stores/terrain'

const WEATHER_LABELS: Record<string, string> = {
  sunny: 'Sunny',
  rain: 'Rain',
  sandstorm: 'Sandstorm',
  hail: 'Hail',
  snow: 'Snow',
  fog: 'Fog',
  harsh_sunlight: 'Harsh Sunlight',
  heavy_rain: 'Heavy Rain',
  strong_winds: 'Strong Winds'
}

const { getCombatantName } = useCombatantDisplay()

const encounterStore = useEncounterStore()
const fogOfWarStore = useFogOfWarStore()
const terrainStore = useTerrainStore()
const groupViewStore = useGroupViewStore()
const { isConnected, identify, joinEncounter, movementPreview } = useWebSocket()

// Wild spawn preview from store
const wildSpawnPreview = computed(() => groupViewStore.wildSpawnPreview)

// Persistence composables (read-only for group view)
const { loadFogState } = useFogPersistence()
const { loadTerrainState } = useTerrainPersistence()

// Poll for served encounters and wild spawn
let pollInterval: ReturnType<typeof setInterval> | null = null
let wildSpawnPollInterval: ReturnType<typeof setInterval> | null = null

// Poll for wild spawn preview
const checkForWildSpawn = async () => {
  await groupViewStore.fetchWildSpawnPreview()
}

// Load VTT state (fog, terrain) for a specific encounter
const loadVttState = async (encounterId: string) => {
  await Promise.all([
    loadFogState(encounterId),
    loadTerrainState(encounterId)
  ])
}

// Track the current served encounter ID to detect changes
let currentServedEncounterId: string | null = null

const checkForServedEncounter = async () => {
  try {
    const servedEncounter = await encounterStore.loadServedEncounter()

    if (servedEncounter) {
      if (servedEncounter.id !== currentServedEncounterId) {
        currentServedEncounterId = servedEncounter.id
        await loadVttState(servedEncounter.id)

        if (isConnected.value) {
          identify('group', servedEncounter.id)
          joinEncounter(servedEncounter.id)
        }
      }
    } else {
      currentServedEncounterId = null
    }
  } catch (error) {
    alert('Failed to load encounter')
  }
}

// Fetch served encounter on mount
onMounted(async () => {
  await checkForServedEncounter()
  pollInterval = setInterval(checkForServedEncounter, 2000)
  await checkForWildSpawn()
  wildSpawnPollInterval = setInterval(checkForWildSpawn, 1000)
})

// Cleanup on unmount
onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  if (wildSpawnPollInterval) {
    clearInterval(wildSpawnPollInterval)
    wildSpawnPollInterval = null
  }
})

// Watch for WebSocket connection to join encounter
watch(isConnected, (connected) => {
  if (connected && encounterStore.encounter?.id) {
    identify('group', encounterStore.encounter.id)
    joinEncounter(encounterStore.encounter.id)
  }
})

// Computed
const encounter = computed(() => encounterStore.encounter)
const currentCombatant = computed(() => encounterStore.currentCombatant)
const sortedCombatants = computed(() => encounterStore.combatantsByInitiative)

// Grid config with fallback defaults
const gridConfig = computed((): GridConfig => encounter.value?.gridConfig ?? {
  enabled: true,
  width: 20,
  height: 15,
  cellSize: 40,
  background: undefined
})

// Weather display
const weatherLabel = computed(() => {
  if (!encounter.value?.weather) return ''
  return WEATHER_LABELS[encounter.value.weather] ?? encounter.value.weather
})

const weatherTooltip = computed(() => {
  if (!encounter.value?.weather) return ''
  const duration = encounter.value.weatherDuration ?? 0
  const source = encounter.value.weatherSource ?? 'manual'
  if (duration > 0) {
    return `${weatherLabel.value} - ${duration} round${duration === 1 ? '' : 's'} remaining (${source})`
  }
  return `${weatherLabel.value} - indefinite (${source})`
})
</script>

<style lang="scss" scoped>
.encounter-view {
  min-height: 100vh;
  background: $gradient-bg-radial;

  &__waiting {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }

  &__active {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
}

.waiting-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-xxl;
  background: rgba($color-bg-secondary, 0.8);
  border-radius: $border-radius-lg;
  text-align: center;

  h2 {
    margin: 0;
    color: $color-text;
  }

  p {
    margin: 0;
    color: $color-text-muted;
  }
}

.waiting-spinner {
  color: $color-primary;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.encounter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg $spacing-xl;
  background: rgba($color-bg-primary, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 2px solid transparent;
  background-image: linear-gradient(rgba($color-bg-primary, 0.95), rgba($color-bg-primary, 0.95)),
                    $gradient-sv-cool;
  background-origin: border-box;
  background-clip: padding-box, border-box;

  @media (min-width: 3000px) {
    padding: $spacing-xl $spacing-xxl;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-lg;

    h1 {
      font-size: $font-size-xxl;
      margin: 0;
      color: $color-text;
      font-weight: 600;

      @media (min-width: 3000px) {
        font-size: $font-size-xxxl;
      }
    }
  }

  &__turn {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    font-size: $font-size-xl;

    @media (min-width: 3000px) {
      font-size: $font-size-xxl;
      gap: $spacing-lg;
    }
  }
}

.grid-view-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: $spacing-lg;

  @media (min-width: 3000px) {
    padding: $spacing-xl;
  }
}

.round-badge {
  background: $gradient-sv-cool;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-md;
  font-weight: 700;
  font-size: $font-size-lg;
  box-shadow: $shadow-glow-scarlet;

  @media (min-width: 3000px) {
    font-size: $font-size-xl;
    padding: $spacing-md $spacing-lg;
  }
}

.weather-badge {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 100%);
  color: #fff;
  padding: $spacing-sm $spacing-md;
  border-radius: $border-radius-md;
  font-weight: 700;
  font-size: $font-size-lg;
  box-shadow: 0 0 12px rgba(#29b6f6, 0.4);

  @media (min-width: 3000px) {
    font-size: $font-size-xl;
    padding: $spacing-md $spacing-lg;
  }
}

.weather-rounds {
  font-size: 0.85em;
  opacity: 0.85;
}

.turn-label {
  color: $color-text-muted;
}

.turn-name {
  background: $gradient-sv-cool;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.initiative-sidebar {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  flex-shrink: 0;
  width: 280px;

  @media (min-width: 3000px) {
    width: 400px;
  }
}

.encounter-main {
  flex: 1;
  display: flex;
  gap: $spacing-lg;
  padding: $spacing-lg;

  @media (min-width: 3000px) {
    padding: $spacing-xl;
    gap: $spacing-xl;
  }
}
</style>
