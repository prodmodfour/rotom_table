<template>
  <div class="stat-allocation">
    <div class="stat-allocation__header">
      <h3>Combat Stats</h3>
      <div class="stat-allocation__pool" :class="{ 'stat-allocation__pool--empty': statPointsRemaining === 0, 'stat-allocation__pool--over': statPointsRemaining < 0 }">
        Points Remaining: <strong>{{ statPointsRemaining }}</strong> / {{ TOTAL_STAT_POINTS }}
      </div>
    </div>

    <div class="stat-allocation__grid">
      <div
        v-for="stat in statDefinitions"
        :key="stat.key"
        class="stat-box"
      >
        <label class="stat-box__label">{{ stat.label }}</label>
        <div class="stat-box__row">
          <span class="stat-box__base">{{ stat.base }}</span>
          <span class="stat-box__separator">+</span>
          <button
            class="stat-box__btn stat-box__btn--minus"
            :disabled="statPoints[stat.key] <= 0"
            @click="$emit('decrement', stat.key)"
          >
            -
          </button>
          <span class="stat-box__added">{{ statPoints[stat.key] }}</span>
          <button
            class="stat-box__btn stat-box__btn--plus"
            :disabled="statPoints[stat.key] >= MAX_POINTS_PER_STAT || statPointsRemaining <= 0"
            @click="$emit('increment', stat.key)"
          >
            +
          </button>
          <span class="stat-box__separator">=</span>
          <span class="stat-box__total">{{ computedStats[stat.key] }}</span>
        </div>
      </div>
    </div>

    <div class="stat-allocation__derived">
      <h4>Derived Stats</h4>
      <div class="derived-grid">
        <div class="derived-item">
          <span class="derived-item__label">Max HP</span>
          <span class="derived-item__value">{{ maxHp }}</span>
        </div>
        <div class="derived-item">
          <span class="derived-item__label">Physical Evasion</span>
          <span class="derived-item__value">{{ evasions.physical }}</span>
        </div>
        <div class="derived-item">
          <span class="derived-item__label">Special Evasion</span>
          <span class="derived-item__value">{{ evasions.special }}</span>
        </div>
        <div class="derived-item">
          <span class="derived-item__label">Speed Evasion</span>
          <span class="derived-item__value">{{ evasions.speed }}</span>
        </div>
      </div>
    </div>

    <div v-if="warnings.length" class="stat-allocation__warnings">
      <div
        v-for="(w, i) in warnings"
        :key="i"
        class="warning-item"
        :class="`warning-item--${w.severity}`"
      >
        {{ w.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Stats } from '~/types/character'
import type { StatPoints } from '~/composables/useCharacterCreation'
import type { CreationWarning } from '~/utils/characterCreationValidation'
import { BASE_HP, BASE_OTHER, TOTAL_STAT_POINTS, MAX_POINTS_PER_STAT } from '~/constants/trainerStats'

interface Props {
  statPoints: StatPoints
  computedStats: Stats
  statPointsRemaining: number
  maxHp: number
  evasions: { physical: number; special: number; speed: number }
  warnings: CreationWarning[]
}

defineProps<Props>()

defineEmits<{
  increment: [stat: keyof StatPoints]
  decrement: [stat: keyof StatPoints]
}>()

const statDefinitions = [
  { key: 'hp' as const, label: 'HP', base: BASE_HP },
  { key: 'attack' as const, label: 'Attack', base: BASE_OTHER },
  { key: 'defense' as const, label: 'Defense', base: BASE_OTHER },
  { key: 'specialAttack' as const, label: 'Sp. Attack', base: BASE_OTHER },
  { key: 'specialDefense' as const, label: 'Sp. Defense', base: BASE_OTHER },
  { key: 'speed' as const, label: 'Speed', base: BASE_OTHER }
]
</script>

<style lang="scss" scoped>
.stat-allocation {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    h3 {
      margin: 0;
      padding-bottom: $spacing-sm;
      border-bottom: 1px solid $glass-border;
      font-size: $font-size-md;
      background: $gradient-sv-cool;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 600;
    }
  }

  &__pool {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    padding: $spacing-xs $spacing-md;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;
    border: 1px solid $border-color-default;

    strong {
      color: $color-info;
      font-size: $font-size-md;
    }

    &--empty strong {
      color: $color-success;
    }

    &--over strong {
      color: $color-danger;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-md;
    margin-bottom: $spacing-lg;

    @media (max-width: 600px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__derived {
    margin-top: $spacing-md;
    padding-top: $spacing-md;
    border-top: 1px solid $glass-border;

    h4 {
      margin: 0 0 $spacing-sm 0;
      font-size: $font-size-sm;
      color: $color-text-secondary;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  &__warnings {
    margin-top: $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
}

.stat-box {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  padding: $spacing-sm $spacing-md;

  &__label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-xs;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__base {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    min-width: 20px;
    text-align: center;
  }

  &__separator {
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__added {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-info;
    min-width: 20px;
    text-align: center;
  }

  &__total {
    font-size: $font-size-md;
    font-weight: 700;
    color: $color-text;
    min-width: 24px;
    text-align: center;
  }

  &__btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid $border-color-emphasis;
    border-radius: $border-radius-sm;
    background: $color-bg-secondary;
    color: $color-text;
    cursor: pointer;
    font-size: $font-size-sm;
    font-weight: 700;
    transition: all $transition-fast;
    padding: 0;
    line-height: 1;

    &:hover:not(:disabled) {
      background: $color-bg-hover;
      border-color: $color-accent-teal;
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &--plus:hover:not(:disabled) {
      border-color: $color-success;
      color: $color-success;
    }

    &--minus:hover:not(:disabled) {
      border-color: $color-danger;
      color: $color-danger;
    }
  }
}

.derived-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $spacing-sm;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.derived-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-sm;
  background: $color-bg-secondary;
  border-radius: $border-radius-sm;
  border: 1px solid $border-color-subtle;

  &__label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    margin-bottom: $spacing-xs;
  }

  &__value {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-accent-teal;
  }
}

.warning-item {
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;

  &--warning {
    background: rgba($color-warning, 0.1);
    border: 1px solid rgba($color-warning, 0.3);
    color: $color-warning;
  }

  &--info {
    background: rgba($color-info, 0.1);
    border: 1px solid rgba($color-info, 0.3);
    color: $color-info;
  }
}
</style>
