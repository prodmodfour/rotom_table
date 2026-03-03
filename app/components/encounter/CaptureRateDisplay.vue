<template>
  <div class="capture-rate" :class="captureRateClass">
    <div class="capture-rate__header">
      <span class="capture-rate__icon">◉</span>
      <span class="capture-rate__label">Capture Rate</span>
    </div>
    <div class="capture-rate__value">
      {{ captureRate.captureRate }}%
    </div>
    <div class="capture-rate__difficulty">
      {{ captureRate.difficulty }}
    </div>
    <button
      v-if="showAttemptButton"
      class="btn btn--sm btn--accent capture-rate__attempt"
      @click="$emit('attempt')"
    >
      Attempt Capture
    </button>

    <!-- Breakdown tooltip on hover -->
    <div v-if="showBreakdown" class="capture-rate__breakdown">
      <div class="breakdown-item">
        <span>Base</span>
        <span>{{ captureRate.breakdown.base }}</span>
      </div>
      <div class="breakdown-item">
        <span>Level ({{ Math.abs(captureRate.breakdown.levelModifier) / 2 }} × 2)</span>
        <span>{{ captureRate.breakdown.levelModifier }}</span>
      </div>
      <div class="breakdown-item">
        <span>HP ({{ captureRate.hpPercentage }}%)</span>
        <span :class="{ positive: captureRate.breakdown.hpModifier > 0, negative: captureRate.breakdown.hpModifier < 0 }">
          {{ captureRate.breakdown.hpModifier >= 0 ? '+' : '' }}{{ captureRate.breakdown.hpModifier }}
        </span>
      </div>
      <div v-if="captureRate.breakdown.evolutionModifier !== 0" class="breakdown-item">
        <span>Evolution</span>
        <span :class="{ positive: captureRate.breakdown.evolutionModifier > 0, negative: captureRate.breakdown.evolutionModifier < 0 }">
          {{ captureRate.breakdown.evolutionModifier >= 0 ? '+' : '' }}{{ captureRate.breakdown.evolutionModifier }}
        </span>
      </div>
      <div v-if="captureRate.breakdown.shinyModifier !== 0" class="breakdown-item">
        <span>Shiny</span>
        <span class="negative">{{ captureRate.breakdown.shinyModifier }}</span>
      </div>
      <div v-if="captureRate.breakdown.statusModifier !== 0" class="breakdown-item">
        <span>Status</span>
        <span class="positive">+{{ captureRate.breakdown.statusModifier }}</span>
      </div>
      <div v-if="captureRate.breakdown.injuryModifier !== 0" class="breakdown-item">
        <span>Injuries</span>
        <span class="positive">+{{ captureRate.breakdown.injuryModifier }}</span>
      </div>
      <div v-if="captureRate.breakdown.stuckModifier !== 0" class="breakdown-item">
        <span>Stuck</span>
        <span class="positive">+{{ captureRate.breakdown.stuckModifier }}</span>
      </div>
      <div v-if="captureRate.breakdown.slowModifier !== 0" class="breakdown-item">
        <span>Slow</span>
        <span class="positive">+{{ captureRate.breakdown.slowModifier }}</span>
      </div>

      <!-- Ball modifier breakdown -->
      <template v-if="captureRate.ballType && captureRate.ballType !== 'Basic Ball'">
        <div class="breakdown-separator"></div>
        <div class="breakdown-item breakdown-item--ball-header">
          <span>Ball: {{ captureRate.ballType }}</span>
        </div>
        <div class="breakdown-item">
          <span>Base modifier</span>
          <span :class="ballModClass(captureRate.ballBreakdown.baseModifier)">
            {{ formatModifier(captureRate.ballBreakdown.baseModifier) }}
          </span>
        </div>
        <div v-if="captureRate.ballBreakdown.conditionDescription" class="breakdown-item">
          <span>Conditional</span>
          <span :class="ballModClass(captureRate.ballBreakdown.conditionalModifier)">
            {{ captureRate.ballBreakdown.conditionMet
              ? formatModifier(captureRate.ballBreakdown.conditionalModifier)
              : 'n/a' }}
          </span>
        </div>
        <div class="breakdown-item breakdown-item--total">
          <span>Total ball mod</span>
          <span :class="ballModClass(captureRate.ballModifier)">
            {{ formatModifier(captureRate.ballModifier) }}
          </span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CaptureRateData } from '~/composables/useCapture'
import { formatModifier } from '~/utils/pokeBallFormatters'

const props = defineProps<{
  captureRate: CaptureRateData
  showBreakdown?: boolean
  showAttemptButton?: boolean
}>()

defineEmits<{
  attempt: []
}>()

function ballModClass(mod: number): string {
  // Negative modifier = easier capture = good (green)
  if (mod < 0) return 'positive'
  if (mod > 0) return 'negative'
  return ''
}

const captureRateClass = computed(() => {
  const rate = props.captureRate.captureRate
  if (!props.captureRate.canBeCaptured) return 'capture-rate--impossible'
  if (rate >= 80) return 'capture-rate--very-easy'
  if (rate >= 60) return 'capture-rate--easy'
  if (rate >= 40) return 'capture-rate--moderate'
  if (rate >= 20) return 'capture-rate--difficult'
  if (rate >= 1) return 'capture-rate--very-difficult'
  return 'capture-rate--impossible'
})
</script>

<style lang="scss" scoped>
.capture-rate {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-sm;
  border-radius: $border-radius-md;
  background: rgba($color-bg-elevated, 0.8);
  border: 1px solid $glass-border;
  font-size: $font-size-sm;
  position: relative;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $color-text-muted;
    font-size: $font-size-xs;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__icon {
    font-size: 1rem;
  }

  &__value {
    font-size: $font-size-lg;
    font-weight: bold;
    margin: $spacing-xs 0;
  }

  &__difficulty {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__attempt {
    margin-top: $spacing-sm;
    width: 100%;
  }

  &__breakdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: $color-bg-elevated;
    border: 1px solid $glass-border;
    border-radius: $border-radius-md;
    padding: $spacing-sm;
    margin-top: $spacing-xs;
    z-index: 100;
    display: none;

    .breakdown-separator {
      border-top: 1px solid $border-color-subtle;
      margin: $spacing-xs 0;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: $font-size-xs;

      &--ball-header {
        font-weight: 600;
        color: $color-accent-teal;
      }

      &--total {
        font-weight: 600;
        border-top: 1px dashed $border-color-subtle;
        padding-top: $spacing-xs;
        margin-top: 2px;
      }

      .positive {
        color: $color-success;
      }

      .negative {
        color: $color-danger;
      }
    }
  }

  &:hover &__breakdown {
    display: block;
  }

  // Color variants based on difficulty
  &--very-easy {
    border-color: $color-success;
    .capture-rate__value { color: $color-success; }
    .capture-rate__icon { color: $color-success; }
  }

  &--easy {
    border-color: adjust-color($color-success, $lightness: 15%);
    .capture-rate__value { color: adjust-color($color-success, $lightness: 15%); }
  }

  &--moderate {
    border-color: $color-warning;
    .capture-rate__value { color: $color-warning; }
    .capture-rate__icon { color: $color-warning; }
  }

  &--difficult {
    border-color: $color-danger;
    .capture-rate__value { color: $color-danger; }
    .capture-rate__icon { color: $color-danger; }
  }

  &--very-difficult {
    border-color: adjust-color($color-danger, $lightness: -10%);
    .capture-rate__value { color: adjust-color($color-danger, $lightness: -10%); }
  }

  &--impossible {
    border-color: $color-text-muted;
    opacity: 0.6;
    .capture-rate__value {
      color: $color-text-muted;
      &::after {
        content: ' (Fainted)';
        font-size: $font-size-xs;
      }
    }
  }
}
</style>
