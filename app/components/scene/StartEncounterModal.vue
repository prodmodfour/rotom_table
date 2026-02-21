<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal start-encounter-modal">
      <div class="modal__header">
        <h3>Start Encounter</h3>
        <button class="modal__close" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal__body">
        <p class="scene-summary">
          Create encounter from <strong>{{ sceneName }}</strong>
        </p>

        <div class="entity-counts">
          <div v-if="pokemonCount > 0" class="entity-count">
            <PhPawPrint :size="18" />
            <span>{{ pokemonCount }} wild Pokemon (enemies)</span>
          </div>
          <div v-if="characterCount > 0" class="entity-count">
            <PhUser :size="18" />
            <span>{{ characterCount }} characters (players)</span>
          </div>
          <div v-if="budgetInfo" class="entity-count">
            <PhScales :size="18" />
            <span>
              Budget: {{ budgetInfo.effectiveEnemyLevels }} / {{ budgetInfo.totalBudget }} levels
              (<span class="difficulty-label" :class="`difficulty-label--${budgetInfo.difficulty}`">{{ budgetInfo.difficulty }}</span>)
            </span>
          </div>
          <div v-if="pokemonCount === 0 && characterCount === 0" class="entity-count entity-count--empty">
            <PhWarning :size="18" />
            <span>No Pokemon or characters in this scene</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Battle Type</label>
          <div class="battle-type-options">
            <label class="radio-option" :class="{ 'radio-option--selected': battleType === 'full_contact' }">
              <input type="radio" v-model="battleType" value="full_contact" />
              <div class="radio-option__content">
                <strong>Full Contact</strong>
                <span>All combatants act in speed order</span>
              </div>
            </label>
            <label class="radio-option" :class="{ 'radio-option--selected': battleType === 'trainer' }">
              <input type="radio" v-model="battleType" value="trainer" />
              <div class="radio-option__content">
                <strong>Trainer (League)</strong>
                <span>Trainers declare, then Pokemon act</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">Cancel</button>
        <button
          class="btn btn--warning"
          :disabled="pokemonCount === 0 && characterCount === 0"
          @click="handleConfirm"
        >
          <PhSword :size="16" />
          Start Encounter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhPawPrint, PhUser, PhWarning, PhSword, PhScales } from '@phosphor-icons/vue'

defineProps<{
  sceneName: string
  pokemonCount: number
  characterCount: number
  budgetInfo?: {
    totalBudget: number
    totalEnemyLevels: number
    effectiveEnemyLevels: number
    difficulty: 'trivial' | 'easy' | 'balanced' | 'hard' | 'deadly'
  }
}>()

const emit = defineEmits<{
  close: []
  confirm: [options: { battleType: 'trainer' | 'full_contact' }]
}>()

const battleType = ref<'trainer' | 'full_contact'>('full_contact')

const handleConfirm = () => {
  emit('confirm', { battleType: battleType.value })
}
</script>

<style lang="scss" scoped>
.start-encounter-modal {
  max-width: 440px;
}

.scene-summary {
  margin-bottom: $spacing-md;
  color: $color-text-muted;
}

.entity-counts {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
}

.entity-count {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  color: $color-text;

  &--empty {
    color: $color-text-muted;
  }
}

.difficulty-label {
  font-weight: 600;
  text-transform: capitalize;

  &--trivial {
    color: #9e9e9e;
  }

  &--easy {
    color: $color-success;
  }

  &--balanced {
    color: $color-info;
  }

  &--hard {
    color: $color-warning;
  }

  &--deadly {
    color: $color-danger;
  }
}

.battle-type-options {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 2px solid transparent;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $color-bg-hover;
  }

  &--selected {
    border-color: $color-warning;
    background: rgba($color-warning, 0.1);
  }

  input[type="radio"] {
    margin-top: 3px;
    accent-color: $color-warning;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
      color: $color-text;
    }

    span {
      font-size: $font-size-sm;
      color: $color-text-muted;
    }
  }
}

.modal-overlay {
  @include modal-overlay-base;
}

.modal {
  @include modal-container-base;
  max-width: none;
}
</style>
