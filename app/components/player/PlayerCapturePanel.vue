<template>
  <section class="combat-actions__panel">
    <h4 class="combat-actions__panel-title">
      <PhCrosshairSimple :size="16" />
      Throw Poke Ball
    </h4>

    <!-- Step 1: Select target Pokemon (enemies only) -->
    <div v-if="!selectedTarget" class="capture-panel__targets">
      <p class="capture-panel__hint">Select a target Pokemon:</p>
      <button
        v-for="target in captureTargets"
        :key="target.id"
        class="combat-actions__panel-row combat-actions__panel-row--pokemon"
        @click="selectTarget(target)"
      >
        <img
          :src="getSpriteUrl(target.entity.species, (target.entity as Pokemon).shiny)"
          :alt="getCombatantName(target)"
          class="combat-actions__panel-sprite"
          loading="lazy"
        />
        <div class="combat-actions__panel-pokemon-info">
          <span class="combat-actions__panel-name">{{ getCombatantName(target) }}</span>
          <span class="combat-actions__panel-hp">
            {{ (target.entity as Pokemon).currentHp }} / {{ (target.entity as Pokemon).maxHp }} HP
          </span>
        </div>
      </button>
      <div v-if="captureTargets.length === 0" class="combat-actions__panel-empty">
        No wild Pokemon to capture.
      </div>
    </div>

    <!-- Step 2: Capture rate preview + confirm -->
    <div v-else class="capture-panel__confirm">
      <div class="capture-panel__target-info">
        <img
          :src="getSpriteUrl(selectedTarget.entity.species, (selectedTarget.entity as Pokemon).shiny)"
          :alt="getCombatantName(selectedTarget)"
          class="capture-panel__sprite"
          loading="lazy"
        />
        <span class="capture-panel__name">{{ getCombatantName(selectedTarget) }}</span>
      </div>

      <!-- Capture rate display -->
      <div v-if="loadingRate" class="capture-panel__loading">
        Calculating capture rate...
      </div>
      <CaptureRateDisplay
        v-else-if="captureRateData"
        :capture-rate="captureRateData"
        :show-breakdown="true"
        :show-attempt-button="false"
      />

      <!-- Action cost reminder -->
      <div class="capture-panel__action-cost">
        <PhInfo :size="14" />
        <span>Standard Action (accuracy check)</span>
      </div>

      <!-- Confirm / Cancel -->
      <div class="capture-panel__buttons">
        <button
          class="combat-actions__btn combat-actions__btn--cancel"
          @click="cancelCapture"
        >
          Cancel
        </button>
        <button
          class="combat-actions__btn combat-actions__btn--confirm"
          :disabled="requestPending || !captureRateData?.canBeCaptured"
          @click="confirmCapture"
        >
          <PhCrosshairSimple :size="18" />
          {{ requestPending ? 'Waiting for GM...' : 'Request Capture' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PhCrosshairSimple, PhInfo } from '@phosphor-icons/vue'
import type { Combatant, Pokemon } from '~/types'
import type { CaptureRateData } from '~/composables/useCapture'

const emit = defineEmits<{
  'request-sent': []
  cancel: []
}>()

const {
  captureTargets,
  requestCapture,
  myActiveCombatant
} = usePlayerCombat()

const { fetchCaptureRate, estimateCaptureRate, loading: loadingRate } = usePlayerCapture()
const { getCombatantName } = useCombatantDisplay()
const { getSpriteUrl } = usePokemonSprite()

// State
const selectedTarget = ref<Combatant | null>(null)
const captureRateData = ref<CaptureRateData | null>(null)
const requestPending = ref(false)

/**
 * Select a target and fetch its capture rate.
 * Tries the server endpoint first for accuracy, falls back to local estimate.
 */
const selectTarget = async (target: Combatant) => {
  selectedTarget.value = target
  captureRateData.value = null

  // Try server-side calculation first (has full SpeciesData)
  const serverRate = await fetchCaptureRate(target)
  if (serverRate) {
    captureRateData.value = serverRate
    return
  }

  // Fall back to local calculation
  captureRateData.value = estimateCaptureRate(target)
}

/**
 * Send capture request to GM via WebSocket.
 */
const confirmCapture = () => {
  if (!selectedTarget.value || requestPending.value) return

  const pokemon = selectedTarget.value.entity as Pokemon
  const trainerCombatant = myActiveCombatant.value

  if (!trainerCombatant) return

  requestPending.value = true

  requestCapture({
    targetPokemonId: pokemon.id,
    targetPokemonName: pokemon.nickname || pokemon.species,
    captureRatePreview: captureRateData.value?.captureRate,
    trainerCombatantId: trainerCombatant.id
  })

  emit('request-sent')
}

/**
 * Reset selection and go back to target list.
 */
const cancelCapture = () => {
  selectedTarget.value = null
  captureRateData.value = null
  requestPending.value = false
  emit('cancel')
}
</script>

<style lang="scss" scoped>
.capture-panel {
  &__targets {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin: 0 0 $spacing-xs;
  }

  &__confirm {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__target-info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  &__sprite {
    width: 48px;
    height: 48px;
    image-rendering: pixelated;
    object-fit: contain;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: 700;
  }

  &__loading {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-align: center;
    padding: $spacing-sm;
  }

  &__action-cost {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    color: $color-text-muted;
    padding: $spacing-xs $spacing-sm;
    background: rgba($color-info, 0.1);
    border-radius: $border-radius-sm;
  }

  &__buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-xs;
  }
}
</style>
