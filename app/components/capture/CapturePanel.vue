<template>
  <div class="capture-panel">
    <div class="capture-panel__header">
      <span class="capture-panel__title">Capture</span>
    </div>

    <!-- Ball Selector -->
    <BallSelector
      v-model="selectedBallType"
      :condition-context="fullConditionContext"
    />

    <!-- GM Context Toggles -->
    <CaptureContextToggles v-model="contextFlags" />

    <!-- Capture Rate Display with ball breakdown -->
    <CaptureRateDisplay
      v-if="captureRateData"
      :capture-rate="captureRateData"
      :show-breakdown="true"
    />

    <!-- Accuracy + Capture buttons -->
    <div class="capture-panel__actions">
      <template v-if="!accuracyResult">
        <button
          class="btn btn--sm btn--accent capture-panel__throw-btn"
          @click="rollAndThrow"
        >
          Throw {{ selectedBallType }}
        </button>
      </template>
      <template v-else>
        <div class="capture-panel__accuracy-result">
          <span>Accuracy: {{ accuracyResult.roll }} (need {{ accuracyResult.threshold }}+)</span>
          <span v-if="accuracyResult.isNat1" class="capture-panel__miss">
            Natural 1 -- Miss!
          </span>
          <span v-else-if="accuracyResult.isNat20" class="capture-panel__crit">
            Natural 20 -- Critical Hit!
          </span>
          <span v-else-if="accuracyResult.hits" class="capture-panel__hit">
            {{ accuracyResult.roll }} vs {{ accuracyResult.threshold }} -- Hit
          </span>
          <span v-else class="capture-panel__miss">
            {{ accuracyResult.roll }} vs {{ accuracyResult.threshold }} -- Miss!
          </span>
        </div>

        <!-- Capture result -->
        <div v-if="captureAttemptResult" class="capture-panel__result">
          <div class="capture-panel__roll-breakdown">
            <div class="roll-line">
              <span>Roll: {{ captureAttemptResult.roll }}</span>
            </div>
            <div class="roll-line">
              <span>- Trainer Level: {{ captureAttemptResult.trainerLevel }}</span>
            </div>
            <div v-if="captureAttemptResult.ballModifier !== 0" class="roll-line">
              <span>+ Ball ({{ captureAttemptResult.ballType }}): {{ captureAttemptResult.ballModifier }}</span>
            </div>
            <div v-if="captureAttemptResult.modifiers !== 0" class="roll-line">
              <span>+ Other Mods: {{ captureAttemptResult.modifiers }}</span>
            </div>
            <div class="roll-line roll-line--total">
              <span>= Modified Roll: {{ captureAttemptResult.modifiedRoll }}</span>
            </div>
          </div>

          <div class="capture-panel__outcome" :class="captureAttemptResult.captured ? 'capture-panel__outcome--success' : 'capture-panel__outcome--fail'">
            <span v-if="captureAttemptResult.naturalHundred">
              Natural 100 -- Auto-Capture!
            </span>
            <span v-else-if="captureAttemptResult.captured">
              {{ captureAttemptResult.modifiedRoll }} &lt;= {{ captureAttemptResult.captureRate }} -- Captured!
            </span>
            <span v-else>
              {{ captureAttemptResult.modifiedRoll }} &gt; {{ captureAttemptResult.captureRate }} -- Escaped!
            </span>
          </div>

          <!-- Post-capture effect notification -->
          <div
            v-if="captureAttemptResult.captured && captureAttemptResult.postCaptureEffect"
            class="capture-panel__post-effect"
          >
            <PhSparkle :size="14" weight="fill" />
            <span>{{ captureAttemptResult.postCaptureEffect.description }}</span>
          </div>
        </div>

        <button
          class="btn btn--sm btn--secondary capture-panel__reset-btn"
          @click="resetCapture"
        >
          New Attempt
        </button>
      </template>
    </div>

    <!-- Loading/error state -->
    <div v-if="captureLoading" class="capture-panel__loading">
      Rolling...
    </div>
    <div v-if="captureError" class="capture-panel__error">
      {{ captureError }}
    </div>
    <div v-if="captureWarning" class="capture-panel__warning">
      {{ captureWarning }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhSparkle } from '@phosphor-icons/vue'
import { DEFAULT_BALL_TYPE } from '~/constants/pokeBalls'
import type { BallConditionContext } from '~/constants/pokeBalls'
import type { CaptureRateData, CaptureAttemptResult, CaptureAccuracyParams } from '~/composables/useCapture'

const props = defineProps<{
  /** The wild Pokemon's ID */
  pokemonId: string
  /** Pokemon data for local capture rate calculation */
  pokemonData: {
    level: number
    currentHp: number
    maxHp: number
    evolutionStage?: number
    maxEvolutionStage?: number
    statusConditions?: string[]
    injuries?: number
    isShiny?: boolean
  }
  /** The active encounter ID (for round tracking, active Pokemon lookup) */
  encounterId?: string
  /** Available trainer IDs for capture (GM selects) */
  trainerId: string
  /** Accuracy modifiers per decree-042: thrower stages, target evasion, flanking, terrain */
  accuracyParams?: CaptureAccuracyParams
}>()

const emit = defineEmits<{
  captured: [result: CaptureAttemptResult]
}>()

const {
  loading: captureLoading,
  error: captureError,
  warning: captureWarning,
  calculateCaptureRateLocal,
  attemptCapture,
  rollAccuracyCheck,
} = useCapture()

// Ball selection state
const selectedBallType = ref(DEFAULT_BALL_TYPE)

// GM context toggles
const contextFlags = ref({
  targetWasBaited: false,
  isDarkOrLowLight: false,
  isUnderwaterOrUnderground: false,
})

// Encounter store for round tracking (Timer Ball, Quick Ball)
const encounterStore = useEncounterStore()

// Build full condition context from pokemon data + GM flags + encounter round
const fullConditionContext = computed<Partial<BallConditionContext>>(() => ({
  targetLevel: props.pokemonData.level,
  encounterRound: encounterStore.currentRound || 1,
  ...contextFlags.value,
}))

// Live capture rate preview with selected ball
const captureRateData = computed<CaptureRateData>(() => {
  return calculateCaptureRateLocal({
    level: props.pokemonData.level,
    currentHp: props.pokemonData.currentHp,
    maxHp: props.pokemonData.maxHp,
    evolutionStage: props.pokemonData.evolutionStage,
    maxEvolutionStage: props.pokemonData.maxEvolutionStage,
    statusConditions: (props.pokemonData.statusConditions ?? []) as any,
    injuries: props.pokemonData.injuries ?? 0,
    isShiny: props.pokemonData.isShiny ?? false,
    ballType: selectedBallType.value,
    conditionContext: fullConditionContext.value,
  })
})

// Accuracy and capture results
const accuracyResult = ref<{
  roll: number
  isNat1: boolean
  isNat20: boolean
  hits: boolean
  threshold: number
} | null>(null)

const captureAttemptResult = ref<CaptureAttemptResult | null>(null)

async function rollAndThrow() {
  // Step 1: Roll accuracy with full modifier system (decree-042)
  const accuracy = rollAccuracyCheck(props.accuracyParams)
  accuracyResult.value = accuracy

  if (!accuracy.hits) {
    // Ball missed — no capture roll
    return
  }

  // Step 2: Call capture attempt API with threshold for server validation
  const result = await attemptCapture({
    pokemonId: props.pokemonId,
    trainerId: props.trainerId,
    accuracyRoll: accuracy.roll,
    accuracyThreshold: accuracy.threshold,
    ballType: selectedBallType.value,
    conditionContext: fullConditionContext.value,
    encounterContext: props.encounterId
      ? { encounterId: props.encounterId, trainerCombatantId: props.trainerId }
      : undefined,
  })

  if (result) {
    captureAttemptResult.value = result
    if (result.captured) {
      emit('captured', result)
    }
  }
}

function resetCapture() {
  accuracyResult.value = null
  captureAttemptResult.value = null
}
</script>

<style lang="scss" scoped>
.capture-panel {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: rgba($color-bg-elevated, 0.6);
  border: 1px solid $glass-border;
  border-radius: $border-radius-md;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__title {
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__throw-btn {
    width: 100%;
  }

  &__reset-btn {
    width: 100%;
    margin-top: $spacing-xs;
  }

  &__accuracy-result {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: $font-size-sm;
    padding: $spacing-xs;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;
  }

  &__hit {
    color: $color-success;
    font-weight: 600;
  }

  &__miss {
    color: $color-danger;
    font-weight: 600;
  }

  &__crit {
    color: $color-warning;
    font-weight: 600;
  }

  &__result {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__roll-breakdown {
    font-size: $font-size-xs;
    padding: $spacing-xs;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;

    .roll-line {
      padding: 1px 0;
      color: $color-text-secondary;

      &--total {
        font-weight: 600;
        color: $color-text;
        border-top: 1px solid $border-color-subtle;
        padding-top: $spacing-xs;
        margin-top: 2px;
      }
    }
  }

  &__outcome {
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-sm;
    font-weight: 700;
    font-size: $font-size-sm;
    text-align: center;

    &--success {
      background: rgba($color-success, 0.2);
      color: $color-success;
      border: 1px solid rgba($color-success, 0.4);
    }

    &--fail {
      background: rgba($color-danger, 0.15);
      color: $color-danger;
      border: 1px solid rgba($color-danger, 0.3);
    }
  }

  &__post-effect {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-accent-teal;
    background: rgba($color-accent-teal, 0.1);
    border: 1px solid rgba($color-accent-teal, 0.3);
    border-radius: $border-radius-sm;
  }

  &__loading {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-align: center;
    padding: $spacing-xs;
  }

  &__error {
    font-size: $font-size-xs;
    color: $color-danger;
    text-align: center;
    padding: $spacing-xs;
  }

  &__warning {
    font-size: $font-size-xs;
    color: $color-warning;
    text-align: center;
    padding: $spacing-xs;
    background: rgba($color-warning, 0.1);
    border: 1px solid rgba($color-warning, 0.3);
    border-radius: $border-radius-sm;
  }
}
</style>
