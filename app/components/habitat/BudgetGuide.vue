<template>
  <div class="budget-guide">
    <div class="budget-guide__header">
      <PhScales :size="16" />
      <h4>Budget Guide</h4>
    </div>
    <!-- Manual inputs when no partyContext prop provided -->
    <div v-if="!partyContext" class="budget-guide__inputs">
      <div class="budget-guide__input-row">
        <div class="form-group form-group--inline">
          <label for="manual-avg-level">Avg Pokemon Lv.</label>
          <input
            id="manual-avg-level"
            v-model.number="manualAvgLevel"
            type="number"
            class="form-input form-input--sm"
            min="1"
            max="100"
            placeholder="--"
          />
        </div>
        <div class="form-group form-group--inline">
          <label for="manual-player-count">Players</label>
          <input
            id="manual-player-count"
            v-model.number="manualPlayerCount"
            type="number"
            class="form-input form-input--sm"
            min="1"
            max="10"
            placeholder="--"
          />
        </div>
      </div>
    </div>
    <template v-if="effectivePartyContext">
      <p class="budget-guide__formula">
        Lv.{{ effectivePartyContext.averagePokemonLevel }} x 2 x {{ effectivePartyContext.playerCount }} players = <strong>{{ budgetTotal }}</strong> levels
        <span class="budget-guide__source">(PTU guideline)</span>
      </p>
      <BudgetIndicator
        v-if="budgetAnalysis"
        :analysis="budgetAnalysis"
      />
    </template>
    <p v-else class="budget-guide__hint">
      Enter party info above to see budget guidance.
    </p>
  </div>
</template>

<script setup lang="ts">
import { PhScales } from '@phosphor-icons/vue'
import { calculateEncounterBudget, analyzeEncounterBudget } from '~/utils/encounterBudget'
import type { BudgetAnalysis } from '~/utils/encounterBudget'

const props = defineProps<{
  partyContext?: { averagePokemonLevel: number; playerCount: number }
  generatedPokemon: Array<{ level: number }>
}>()

// Manual party context inputs (used when no partyContext prop is provided)
const manualAvgLevel = ref<number | null>(null)
const manualPlayerCount = ref<number | null>(null)

// Effective party context: prop takes precedence, falls back to manual input
const effectivePartyContext = computed(() => {
  if (props.partyContext) return props.partyContext
  if (manualAvgLevel.value && manualAvgLevel.value > 0 && manualPlayerCount.value && manualPlayerCount.value > 0) {
    return {
      averagePokemonLevel: manualAvgLevel.value,
      playerCount: manualPlayerCount.value
    }
  }
  return null
})

// Budget calculations (active when party context is available from prop or manual input)
const budgetTotal = computed((): number => {
  if (!effectivePartyContext.value) return 0
  const result = calculateEncounterBudget(effectivePartyContext.value)
  return result.totalBudget
})

const budgetAnalysis = computed((): BudgetAnalysis | null => {
  if (!effectivePartyContext.value || props.generatedPokemon.length === 0) return null
  const enemies = props.generatedPokemon.map(p => ({
    level: p.level,
    isTrainer: false
  }))
  return analyzeEncounterBudget(effectivePartyContext.value, enemies)
})
</script>

<style lang="scss" scoped>
.budget-guide {
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;
  border: 1px solid rgba($color-info, 0.2);

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-sm;
    color: $color-info;

    h4 {
      margin: 0;
      font-size: $font-size-sm;
    }
  }

  &__formula {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin: 0 0 $spacing-sm 0;

    strong {
      color: $color-text;
    }
  }

  &__inputs {
    margin-bottom: $spacing-sm;
  }

  &__input-row {
    display: flex;
    gap: $spacing-md;

    .form-group--inline {
      display: flex;
      align-items: center;
      gap: $spacing-xs;
      margin-bottom: 0;

      label {
        font-size: $font-size-xs;
        color: $color-text-muted;
        white-space: nowrap;
      }
    }

    .form-input--sm {
      width: 60px;
      padding: $spacing-xs $spacing-sm;
      font-size: $font-size-sm;
    }
  }

  &__source {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-style: italic;
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-style: italic;
    margin: 0;
  }
}
</style>
