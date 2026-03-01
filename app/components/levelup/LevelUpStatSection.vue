<template>
  <div class="levelup-stats">
    <div class="levelup-stats__header">
      <h3>Stat Allocation</h3>
      <div
        class="levelup-stats__pool"
        :class="{
          'levelup-stats__pool--empty': pointsRemaining === 0,
          'levelup-stats__pool--over': pointsRemaining < 0
        }"
      >
        Points Remaining: <strong>{{ pointsRemaining }}</strong> / {{ totalPoints }}
      </div>
    </div>

    <div class="levelup-stats__grid">
      <div
        v-for="stat in statDefinitions"
        :key="stat.key"
        class="stat-row"
      >
        <span class="stat-row__label">{{ stat.label }}</span>
        <span class="stat-row__was">{{ currentStats[stat.key] }}</span>
        <span class="stat-row__arrow">+</span>
        <div class="stat-row__controls">
          <button
            class="stat-row__btn stat-row__btn--minus"
            :disabled="allocations[stat.key] <= 0"
            @click="$emit('decrementStat', stat.key)"
          >
            -
          </button>
          <span class="stat-row__added">{{ allocations[stat.key] }}</span>
          <button
            class="stat-row__btn stat-row__btn--plus"
            :disabled="pointsRemaining <= 0"
            @click="$emit('incrementStat', stat.key)"
          >
            +
          </button>
        </div>
        <span class="stat-row__arrow">=</span>
        <span class="stat-row__new" :class="{ 'stat-row__new--changed': allocations[stat.key] > 0 }">
          {{ currentStats[stat.key] + allocations[stat.key] }}
        </span>
      </div>
    </div>

    <div class="levelup-stats__derived">
      <div class="derived-row">
        <span class="derived-row__label">Max HP</span>
        <span class="derived-row__old">{{ currentMaxHp }}</span>
        <span class="derived-row__arrow">-></span>
        <span class="derived-row__new" :class="{ 'derived-row__new--changed': updatedMaxHp !== currentMaxHp }">
          {{ updatedMaxHp }}
        </span>
      </div>
      <div class="derived-row">
        <span class="derived-row__label">Physical Evasion</span>
        <span class="derived-row__new">{{ evasions.physical }}</span>
      </div>
      <div class="derived-row">
        <span class="derived-row__label">Special Evasion</span>
        <span class="derived-row__new">{{ evasions.special }}</span>
      </div>
      <div class="derived-row">
        <span class="derived-row__label">Speed Evasion</span>
        <span class="derived-row__new">{{ evasions.speed }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Stats } from '~/types/character'
import type { StatPoints } from '~/composables/useCharacterCreation'
import { STAT_DEFINITIONS } from '~/constants/trainerStats'

interface Props {
  /** Current stat values (from the character's existing stats) */
  currentStats: Stats
  /** Points allocated so far in this level-up session */
  allocations: StatPoints
  /** Total points to distribute in this level-up */
  totalPoints: number
  /** Points remaining to allocate */
  pointsRemaining: number
  /** New level (for maxHp calculation preview) */
  newLevel: number
  /** Current maxHp before level-up */
  currentMaxHp: number
  /** Updated maxHp after level-up */
  updatedMaxHp: number
}

const props = defineProps<Props>()

defineEmits<{
  incrementStat: [stat: keyof StatPoints]
  decrementStat: [stat: keyof StatPoints]
}>()

const statDefinitions = STAT_DEFINITIONS

/** Compute evasions from updated stats (uses calculated stats per PTU rules, capped at +6 per PTU Core p.15) */
const evasions = computed(() => {
  const def = props.currentStats.defense + props.allocations.defense
  const spDef = props.currentStats.specialDefense + props.allocations.specialDefense
  const spd = props.currentStats.speed + props.allocations.speed
  return {
    physical: Math.min(Math.floor(def / 5), 6),
    special: Math.min(Math.floor(spDef / 5), 6),
    speed: Math.min(Math.floor(spd / 5), 6)
  }
})
</script>

<style lang="scss" scoped>
.levelup-stats {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    h3 {
      margin: 0;
      font-size: $font-size-md;
      color: $color-text;
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
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    margin-bottom: $spacing-lg;
  }

  &__derived {
    padding-top: $spacing-md;
    border-top: 1px solid $glass-border;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-sm;
  }
}

.stat-row {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  padding: $spacing-sm $spacing-md;

  &__label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    min-width: 80px;
  }

  &__was {
    font-size: $font-size-sm;
    color: $color-text-muted;
    min-width: 24px;
    text-align: center;
  }

  &__arrow {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &__controls {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__added {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-info;
    min-width: 20px;
    text-align: center;
  }

  &__new {
    font-size: $font-size-md;
    font-weight: 700;
    color: $color-text;
    min-width: 24px;
    text-align: center;

    &--changed {
      color: $color-success;
    }
  }

  &__btn {
    width: 28px;
    height: 28px;
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

.derived-row {
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

  &__old {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &__arrow {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin: 0 $spacing-xs;
  }

  &__new {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-accent-teal;

    &--changed {
      color: $color-success;
    }
  }
}
</style>
