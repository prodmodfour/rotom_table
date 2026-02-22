<template>
  <div class="budget-indicator" :class="`budget-indicator--${analysis.difficulty}`">
    <div class="budget-bar">
      <div
        class="budget-bar__fill"
        :style="{ width: `${Math.min(barPercent, 100)}%` }"
      />
      <div
        v-if="barPercent > 100"
        class="budget-bar__overflow"
        :style="{ width: `${Math.min(barPercent - 100, 100)}%` }"
      />
    </div>
    <div class="budget-details">
      <span class="budget-levels">
        {{ analysis.effectiveEnemyLevels }} / {{ analysis.budget.totalBudget }} levels
        <span v-if="analysis.hasTrainerEnemies" class="trainer-note">(trainers count x2)</span>
      </span>
      <span class="budget-difficulty" :class="`budget-difficulty--${analysis.difficulty}`">
        {{ difficultyLabel }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BudgetAnalysis } from '~/utils/encounterBudget'

const props = defineProps<{
  analysis: BudgetAnalysis
}>()

const DIFFICULTY_LABELS: Record<BudgetAnalysis['difficulty'], string> = {
  trivial: 'Trivial',
  easy: 'Easy',
  balanced: 'Balanced',
  hard: 'Hard',
  deadly: 'Deadly'
}

const barPercent = computed(() => {
  if (props.analysis.budget.totalBudget <= 0) return 0
  return Math.round(props.analysis.budgetRatio * 100)
})

const difficultyLabel = computed(() => {
  return DIFFICULTY_LABELS[props.analysis.difficulty]
})
</script>

<style lang="scss" scoped>
.budget-indicator {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.budget-bar {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: $border-radius-full;
  overflow: hidden;

  &__fill {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: $border-radius-full;
    transition: width $transition-normal;

    @include difficulty-bg-colors-ancestor('.budget-indicator');
  }

  &__overflow {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: $border-radius-full;
    background: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 3px,
      rgba($color-danger, 0.5) 3px,
      rgba($color-danger, 0.5) 6px
    );
    transition: width $transition-normal;
  }
}

.budget-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: $font-size-xs;
}

.budget-levels {
  color: $color-text-muted;
}

.trainer-note {
  font-style: italic;
  color: $color-text-muted;
  opacity: 0.8;
}

.budget-difficulty {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: $font-size-xs;

  @include difficulty-text-colors('&');
}
</style>
