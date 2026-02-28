<template>
  <div class="stat-allocation-panel">
    <!-- Header with unallocated count -->
    <div class="stat-allocation-panel__header">
      <h4>Stat Point Allocation</h4>
      <span
        class="unallocated-badge"
        :class="{ 'unallocated-badge--zero': unallocatedPoints === 0 }"
      >
        {{ unallocatedPoints }} unallocated
      </span>
    </div>

    <!-- Base Relations tier display -->
    <div v-if="validation" class="stat-allocation-panel__tiers">
      <span class="tier-label">Base Relations:</span>
      <span class="tier-display">
        <template v-for="(tier, idx) in validation.tiers" :key="idx">
          <span v-if="idx > 0" class="tier-separator"> &gt; </span>
          <span class="tier-group">
            <template v-for="(stat, sidx) in tier.stats" :key="stat">
              <span v-if="sidx > 0">, </span>
              {{ formatStatName(stat) }} ({{ tier.baseValue }})
            </template>
          </span>
        </template>
      </span>
    </div>

    <!-- Stat rows -->
    <div class="stat-allocation-panel__stats">
      <div v-for="stat in STAT_KEYS" :key="stat" class="stat-row">
        <span class="stat-row__label">{{ formatStatName(stat) }}</span>
        <span class="stat-row__base">
          Base: {{ natureAdjustedBase?.[stat] ?? 0 }}
        </span>
        <span class="stat-row__points">
          {{ currentExtraction?.statPoints[stat] ?? 0 }}
          <span v-if="pendingAllocation[stat] > 0" class="stat-row__pending">
            +{{ pendingAllocation[stat] }}
          </span>
        </span>
        <div class="stat-row__controls">
          <button
            class="btn btn--icon btn--sm"
            :disabled="pendingAllocation[stat] <= 0"
            @click="deallocatePoint(stat)"
          >
            <PhMinus :size="14" />
          </button>
          <button
            class="btn btn--icon btn--sm"
            :disabled="!validTargets[stat] || unallocatedPoints <= 0"
            @click="allocatePoint(stat)"
          >
            <PhPlus :size="14" />
          </button>
        </div>
        <span class="stat-row__final">
          {{ (natureAdjustedBase?.[stat] ?? 0) + (combinedAllocation[stat] ?? 0) }}
        </span>
      </div>
    </div>

    <!-- Validation feedback -->
    <div v-if="validation && !validation.valid" class="stat-allocation-panel__violations">
      <PhWarning :size="16" class="violation-icon" />
      <ul>
        <li v-for="(v, idx) in validation.violations" :key="idx">{{ v }}</li>
      </ul>
    </div>

    <!-- Error from server -->
    <div v-if="error" class="stat-allocation-panel__error">
      <PhWarning :size="16" class="error-icon" />
      <span>{{ error }}</span>
    </div>

    <!-- Actions -->
    <div class="stat-allocation-panel__actions">
      <button class="btn btn--secondary btn--sm" @click="handleCancel">
        Cancel
      </button>
      <button class="btn btn--ghost btn--sm" @click="resetAllocation">
        Reset
      </button>
      <button
        class="btn btn--primary btn--sm"
        :disabled="unallocatedPoints > 0 || !validation?.valid || isSaving"
        @click="handleSubmit"
      >
        {{ isSaving ? 'Saving...' : 'Apply Allocation' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhMinus, PhPlus, PhWarning } from '@phosphor-icons/vue'
import type { Pokemon } from '~/types'
import { formatStatName, STAT_KEYS } from '~/utils/baseRelations'

const props = defineProps<{
  pokemon: Pokemon
  /** Number of new stat points to allocate (informational) */
  pointsToAllocate: number
}>()

const emit = defineEmits<{
  allocated: []
  cancelled: []
}>()

// Wrap pokemon in a ref for the composable
const pokemonRef = computed(() => props.pokemon)

const {
  pendingAllocation,
  isAllocating,
  isSaving,
  error,
  natureAdjustedBase,
  currentExtraction,
  statBudget,
  totalAllocated,
  unallocatedPoints,
  combinedAllocation,
  validation,
  validTargets,
  startAllocation,
  allocatePoint,
  deallocatePoint,
  resetAllocation,
  submitAllocation,
  cancelAllocation
} = useLevelUpAllocation(pokemonRef)

// Auto-start allocation when mounted
onMounted(() => {
  startAllocation()
})

async function handleSubmit() {
  const success = await submitAllocation()
  if (success) {
    emit('allocated')
  }
}

function handleCancel() {
  cancelAllocation()
  emit('cancelled')
}
</script>

<style lang="scss" scoped>
.stat-allocation-panel {
  background: linear-gradient(135deg, rgba($color-accent-teal, 0.08) 0%, rgba($color-accent-violet, 0.04) 100%);
  border: 1px solid rgba($color-accent-teal, 0.25);
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-lg;
  margin-top: $spacing-md;
  animation: slideDown 0.3s ease-out;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-md;

    h4 {
      margin: 0;
      color: $color-accent-teal;
      font-size: $font-size-md;
    }
  }

  &__tiers {
    display: flex;
    align-items: baseline;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-bg-secondary, 0.5);
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    color: $color-text-muted;
    flex-wrap: wrap;
  }

  &__stats {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    margin-bottom: $spacing-md;
  }

  &__violations {
    display: flex;
    align-items: flex-start;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-danger, 0.1);
    border: 1px solid rgba($color-danger, 0.3);
    border-radius: $border-radius-sm;
    margin-bottom: $spacing-md;
    color: $color-danger;
    font-size: $font-size-sm;

    ul {
      margin: 0;
      padding-left: $spacing-md;
    }

    li {
      margin-bottom: 2px;
    }
  }

  &__error {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-danger, 0.1);
    border: 1px solid rgba($color-danger, 0.3);
    border-radius: $border-radius-sm;
    margin-bottom: $spacing-md;
    color: $color-danger;
    font-size: $font-size-sm;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }
}

.unallocated-badge {
  display: inline-flex;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  background: rgba($color-warning, 0.15);
  border: 1px solid rgba($color-warning, 0.3);
  border-radius: $border-radius-full;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-warning;

  &--zero {
    background: rgba($color-success, 0.15);
    border-color: rgba($color-success, 0.3);
    color: $color-success;
  }
}

.tier-label {
  font-weight: 600;
  white-space: nowrap;
}

.tier-separator {
  color: $color-text-muted;
  font-weight: 700;
}

.tier-group {
  white-space: nowrap;
}

.stat-row {
  display: grid;
  grid-template-columns: 80px 80px 90px auto 60px;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  transition: background $transition-fast;

  &:hover {
    background: rgba($color-bg-hover, 0.3);
  }

  &__label {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__base {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__points {
    font-size: $font-size-sm;
    color: $color-text;
    font-weight: 500;
  }

  &__pending {
    color: $color-accent-teal;
    font-weight: 700;
  }

  &__controls {
    display: flex;
    gap: $spacing-xs;

    .btn--icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      padding: 0;
      border-radius: $border-radius-sm;
      border: 1px solid $border-color-default;
      background: $color-bg-tertiary;
      color: $color-text;
      cursor: pointer;
      transition: all $transition-fast;

      &:hover:not(:disabled) {
        background: $color-bg-hover;
        border-color: $color-accent-teal;
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }
  }

  &__final {
    font-size: $font-size-md;
    font-weight: 700;
    color: $color-text;
    text-align: right;
  }
}

.violation-icon,
.error-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
