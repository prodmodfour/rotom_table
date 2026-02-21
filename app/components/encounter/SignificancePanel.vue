<template>
  <div class="significance-panel">
    <!-- Header -->
    <div class="significance-panel__header">
      <span class="significance-panel__title">XP Significance</span>
      <span class="significance-panel__badge">x{{ displayMultiplier }}</span>
    </div>

    <!-- No defeated enemies -->
    <div v-if="!hasDefeatedEnemies" class="significance-panel__empty">
      <p>No defeated enemies yet.</p>
      <p class="significance-panel__empty-hint">
        XP breakdown will appear after enemies are defeated.
      </p>
    </div>

    <template v-else>
      <!-- Significance Preset Selector -->
      <div class="significance-selector">
        <label class="significance-selector__label">Significance Tier</label>
        <div class="significance-selector__row">
          <select
            v-model="selectedPreset"
            class="significance-selector__select"
            @change="handlePresetChange"
          >
            <option
              v-for="(value, key) in SIGNIFICANCE_PRESETS"
              :key="key"
              :value="key"
            >
              {{ SIGNIFICANCE_PRESET_LABELS[key] }} - x{{ value }}
            </option>
            <option value="custom">Custom</option>
          </select>
          <input
            v-if="selectedPreset === 'custom'"
            v-model.number="customMultiplier"
            type="number"
            class="significance-selector__custom-input"
            min="0.5"
            max="10"
            step="0.5"
            @change="handleCustomChange"
          />
        </div>
      </div>

      <!-- Difficulty Adjustment Slider -->
      <div class="difficulty-adjust">
        <div class="difficulty-adjust__label">
          <span>Difficulty Adjustment</span>
          <span class="difficulty-adjust__value">
            {{ safeDifficultyAdjustment > 0 ? '+' : '' }}{{ safeDifficultyAdjustment.toFixed(1) }}
          </span>
        </div>
        <input
          v-model.number="difficultyAdjustment"
          type="range"
          class="difficulty-adjust__slider"
          min="-1.5"
          max="1.5"
          step="0.5"
          @change="handleAdjustmentChange"
        />
        <div class="difficulty-adjust__range">
          <span>-1.5</span>
          <span>0</span>
          <span>+1.5</span>
        </div>
      </div>

      <!-- Final Multiplier -->
      <div class="final-multiplier">
        <span class="final-multiplier__label">Final Significance</span>
        <span class="final-multiplier__value">x{{ displayMultiplier }}</span>
      </div>

      <!-- Player Count -->
      <div class="player-count">
        <label class="player-count__label">Player Count</label>
        <div class="player-count__row">
          <input
            v-model.number="playerCount"
            type="number"
            class="player-count__input"
            min="1"
            max="20"
            @change="handlePlayerCountChange"
          />
          <span class="player-count__hint">
            (detected: {{ detectedPlayerCount }})
          </span>
        </div>
      </div>

      <!-- Boss Encounter Toggle -->
      <label class="boss-toggle">
        <input
          v-model="isBossEncounter"
          type="checkbox"
          @change="handleBossToggle"
        />
        <span class="boss-toggle__text">
          Boss Encounter (XP not divided by players)
        </span>
      </label>

      <!-- XP Breakdown -->
      <div v-if="calculationResult" class="xp-breakdown">
        <div class="xp-breakdown__row">
          <span class="xp-breakdown__label">Base XP (enemy levels)</span>
          <span class="xp-breakdown__value">{{ calculationResult.breakdown.enemyLevelsTotal }}</span>
        </div>
        <div class="xp-breakdown__row">
          <span class="xp-breakdown__label">x{{ displayMultiplier }} significance</span>
          <span class="xp-breakdown__value">{{ calculationResult.breakdown.multipliedXp }}</span>
        </div>
        <div v-if="!isBossEncounter" class="xp-breakdown__row">
          <span class="xp-breakdown__label">/ {{ safePlayerCount }} players</span>
          <span class="xp-breakdown__value">{{ calculationResult.totalXpPerPlayer }}</span>
        </div>
        <div class="xp-breakdown__row xp-breakdown__row--total">
          <span class="xp-breakdown__label">XP Per Player</span>
          <span class="xp-breakdown__value xp-breakdown__value--highlight">
            {{ calculationResult.totalXpPerPlayer }}
          </span>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isCalculating" class="significance-panel__loading">
        Calculating XP...
      </div>

      <!-- Error state -->
      <div v-if="calculationError" class="significance-panel__error">
        {{ calculationError }}
      </div>

      <!-- Distribute XP button -->
      <div class="significance-panel__actions">
        <button
          class="btn btn--primary"
          :disabled="!hasDefeatedEnemies"
          @click="handleDistributeXp"
        >
          Distribute XP
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  SIGNIFICANCE_PRESETS,
  SIGNIFICANCE_PRESET_LABELS,
  resolvePresetFromMultiplier
} from '~/utils/experienceCalculation'
import type {
  SignificancePreset,
  XpCalculationResult
} from '~/utils/experienceCalculation'
import type { Encounter } from '~/types'

const props = defineProps<{
  encounter: Encounter
}>()

const emit = defineEmits<{
  openXpModal: []
}>()

const encounterStore = useEncounterStore()

// Guard: suppress watcher-triggered recalculations during init
const initialized = ref(false)

// Detect player count from unique owners of player-side Pokemon
const detectedPlayerCount = computed(() => {
  const playerPokemon = props.encounter.combatants.filter(
    c => c.side === 'players' && c.type === 'pokemon'
  )
  const ownerIds = new Set(
    playerPokemon
      .map(c => (c.entity as { ownerId?: string }).ownerId)
      .filter(Boolean)
  )
  return Math.max(1, ownerIds.size)
})

// State
const selectedPreset = ref<SignificancePreset | 'custom'>(
  resolvePresetFromMultiplier(props.encounter.significanceMultiplier ?? 1.0)
)
const customMultiplier = ref(props.encounter.significanceMultiplier ?? 1.0)
const difficultyAdjustment = ref(0)
const playerCount = ref(1)
const isBossEncounter = ref(false)
const isCalculating = ref(false)
const calculationError = ref<string | null>(null)

// Calculation result
const calculationResult = ref<{
  totalXpPerPlayer: number
  breakdown: XpCalculationResult['breakdown']
} | null>(null)

// Defeated enemies check
const hasDefeatedEnemies = computed(() =>
  (props.encounter.defeatedEnemies ?? []).length > 0
)

// NaN-safe accessors — Vue 3.4+ v-model.number returns '' when input is cleared
const safeCustomMultiplier = computed(() => Number(customMultiplier.value) || 1.0)
const safeDifficultyAdjustment = computed(() => Number(difficultyAdjustment.value) || 0)
const safePlayerCount = computed(() => Math.max(1, Number(playerCount.value) || 1))

// Base significance from preset or custom value
const baseSignificance = computed(() => {
  if (selectedPreset.value === 'custom') return safeCustomMultiplier.value
  return SIGNIFICANCE_PRESETS[selectedPreset.value]
})

// Final significance: base + adjustment, clamped to >= 0.5
const finalSignificance = computed(() => {
  const raw = baseSignificance.value + safeDifficultyAdjustment.value
  return Math.max(0.5, Math.round(raw * 10) / 10)
})

// Display multiplier formatted to 1 decimal place
const displayMultiplier = computed(() => finalSignificance.value.toFixed(1))

// Stale response protection
let requestVersion = 0

// Recalculate XP from the server
const recalculate = async () => {
  if (!hasDefeatedEnemies.value) return

  const thisRequest = ++requestVersion
  isCalculating.value = true
  calculationError.value = null

  try {
    const result = await encounterStore.calculateXp({
      significanceMultiplier: finalSignificance.value,
      playerCount: safePlayerCount.value,
      isBossEncounter: isBossEncounter.value
    })

    if (thisRequest !== requestVersion) return

    calculationResult.value = {
      totalXpPerPlayer: result.totalXpPerPlayer,
      breakdown: result.breakdown
    }
  } catch (e: unknown) {
    if (thisRequest !== requestVersion) return
    const message = e instanceof Error ? e.message : 'Failed to calculate XP'
    calculationError.value = message
  } finally {
    if (thisRequest === requestVersion) {
      isCalculating.value = false
    }
  }
}

// Persist significance to the encounter record
const persistSignificance = async () => {
  try {
    await encounterStore.setSignificance(
      props.encounter.id,
      finalSignificance.value
    )
  } catch {
    // setSignificance already sets the store error
  }
}

// Handlers
const handlePresetChange = () => {
  if (selectedPreset.value !== 'custom') {
    customMultiplier.value = SIGNIFICANCE_PRESETS[selectedPreset.value]
  }
  persistSignificance()
  recalculate()
}

const handleCustomChange = () => {
  persistSignificance()
  recalculate()
}

const handleAdjustmentChange = () => {
  persistSignificance()
  recalculate()
}

const handlePlayerCountChange = () => {
  if (initialized.value) recalculate()
}

const handleBossToggle = () => {
  if (initialized.value) recalculate()
}

const handleDistributeXp = () => {
  emit('openXpModal')
}

// Watch for defeated enemies changes (new enemies defeated during combat)
watch(() => (props.encounter.defeatedEnemies ?? []).length, () => {
  if (initialized.value && hasDefeatedEnemies.value) {
    recalculate()
  }
})

// Initialize on mount
onMounted(async () => {
  playerCount.value = detectedPlayerCount.value
  if (hasDefeatedEnemies.value) {
    await recalculate()
  }
  initialized.value = true
})
</script>

<style lang="scss" scoped>
@import '~/assets/scss/components/significance-panel';
</style>
