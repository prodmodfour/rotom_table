<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal modal--levelup">
      <div class="modal__header">
        <div class="modal__header-text">
          <h2>Level Up: {{ character.name }}</h2>
          <span class="level-badge">Level {{ character.level }} -> {{ targetLevel }}</span>
        </div>
        <button class="modal__close" @click="$emit('cancel')">x</button>
      </div>

      <div class="modal__body">
        <!-- Advancement Summary Banner -->
        <div v-if="summary" class="advancement-banner">
          <div class="advancement-banner__item">
            <span class="advancement-banner__label">Stat Points</span>
            <span class="advancement-banner__value">+{{ summary.totalStatPoints }}</span>
          </div>
          <div v-if="summary.totalEdges > 0" class="advancement-banner__item advancement-banner__item--p1">
            <span class="advancement-banner__label">Edges (P1)</span>
            <span class="advancement-banner__value">+{{ summary.totalEdges }}</span>
          </div>
          <div v-if="summary.totalFeatures > 0" class="advancement-banner__item advancement-banner__item--p1">
            <span class="advancement-banner__label">Features (P1)</span>
            <span class="advancement-banner__value">+{{ summary.totalFeatures }}</span>
          </div>
        </div>

        <!-- Step Content -->
        <LevelUpStatSection
          v-if="currentStep === 'stats'"
          :current-stats="character.stats"
          :allocations="levelUp.statAllocations"
          :total-points="levelUp.statPointsTotal.value"
          :points-remaining="levelUp.statPointsRemaining.value"
          :new-level="targetLevel"
          :current-max-hp="levelUp.currentMaxHp.value"
          :updated-max-hp="levelUp.updatedMaxHp.value"
          @increment-stat="levelUp.incrementStat"
          @decrement-stat="levelUp.decrementStat"
        />

        <LevelUpSummary
          v-if="currentStep === 'summary'"
          :character-name="character.name"
          :from-level="character.level"
          :to-level="targetLevel"
          :stat-allocations="levelUp.statAllocations"
          :current-stats="character.stats"
          :current-max-hp="levelUp.currentMaxHp.value"
          :updated-max-hp="levelUp.updatedMaxHp.value"
          :warnings="levelUp.warnings.value"
          :summary="summary"
        />
      </div>

      <div class="modal__footer">
        <button
          v-if="hasPreviousStep"
          class="btn btn--secondary"
          @click="previousStep"
        >
          Back
        </button>
        <div class="modal__footer-spacer"></div>
        <button
          class="btn btn--secondary"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          v-if="hasNextStep"
          class="btn btn--primary"
          @click="nextStep"
        >
          Next
        </button>
        <button
          v-if="currentStep === 'summary'"
          class="btn btn--primary"
          @click="applyLevelUp"
        >
          Apply Level Up
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HumanCharacter } from '~/types/character'
import type { TrainerAdvancementSummary } from '~/utils/trainerAdvancement'

interface Props {
  /** The character being leveled up (current state) */
  character: HumanCharacter
  /** Target level to advance to */
  targetLevel: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /** Emitted when the GM confirms all choices. Payload is the updated character fields. */
  complete: [updatedData: Partial<HumanCharacter>]
  /** Emitted when the GM cancels the level-up */
  cancel: []
}>()

// --- Composable ---
const levelUp = useTrainerLevelUp()

// Initialize on mount
onMounted(() => {
  levelUp.initialize(props.character, props.targetLevel)
})

// Cleanup on unmount
onUnmounted(() => {
  levelUp.reset()
})

// --- Advancement Summary ---
const summary = computed((): TrainerAdvancementSummary | null => levelUp.summary.value)

// --- Step Navigation ---
// P0 steps: stats -> summary
// P1 will add: edges (includes Skill Edge rank allocation per decree-037), features, classes, milestones
const steps = computed((): string[] => {
  const s = ['stats']
  // P1 additions:
  // if (summary.value && (summary.value.totalEdges > 0 || summary.value.bonusSkillEdges > 0)) s.push('edges')
  // if (summary.value && summary.value.totalFeatures > 0) s.push('features')
  // if (summary.value && summary.value.classChoicePrompts.length > 0) s.push('classes')
  // if (summary.value && summary.value.milestones.length > 0) s.push('milestones')
  s.push('summary')
  return s
})

const currentStepIndex = ref(0)

const currentStep = computed(() => steps.value[currentStepIndex.value] ?? 'stats')

const hasPreviousStep = computed(() => currentStepIndex.value > 0)
const hasNextStep = computed(() => currentStepIndex.value < steps.value.length - 1)

function nextStep(): void {
  if (hasNextStep.value) {
    currentStepIndex.value++
  }
}

function previousStep(): void {
  if (hasPreviousStep.value) {
    currentStepIndex.value--
  }
}

// --- Apply ---
function applyLevelUp(): void {
  const payload = levelUp.buildUpdatePayload()
  emit('complete', payload)
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  @include modal-overlay-enhanced;
}

.modal {
  @include modal-container-enhanced;

  &--levelup {
    max-width: 700px;
    max-height: 85vh;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    border-bottom: 1px solid $glass-border;
    background: linear-gradient(135deg, rgba($color-accent-teal, 0.1) 0%, transparent 100%);
  }

  &__header-text {
    display: flex;
    align-items: center;
    gap: $spacing-md;

    h2 {
      margin: 0;
      font-size: $font-size-lg;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__close {
    background: none;
    border: none;
    color: $color-text-muted;
    font-size: $font-size-lg;
    cursor: pointer;
    padding: $spacing-xs;
    line-height: 1;
    border-radius: $border-radius-sm;
    transition: all $transition-fast;

    &:hover {
      color: $color-text;
      background: $color-bg-hover;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-lg;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md $spacing-lg;
    border-top: 1px solid $glass-border;
    background: rgba($color-bg-primary, 0.5);
  }

  &__footer-spacer {
    flex: 1;
  }
}

.level-badge {
  font-size: $font-size-sm;
  font-weight: 600;
  color: $color-accent-teal;
  padding: $spacing-xs $spacing-sm;
  background: rgba($color-accent-teal, 0.1);
  border: 1px solid rgba($color-accent-teal, 0.3);
  border-radius: $border-radius-sm;
}

.advancement-banner {
  display: flex;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    padding: $spacing-sm;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;

    &--p1 {
      opacity: 0.5;
      border: 1px dashed $border-color-default;
    }
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-xs;
  }

  &__value {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-success;
  }
}

// Shared button styles
.btn {
  padding: $spacing-sm $spacing-lg;
  border: 1px solid transparent;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  font-weight: 600;
  cursor: pointer;
  transition: all $transition-fast;

  &--primary {
    background: $gradient-sv-cool;
    color: $color-text;
    border-color: transparent;

    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }

  &--secondary {
    background: $color-bg-tertiary;
    color: $color-text-secondary;
    border-color: $border-color-default;

    &:hover {
      background: $color-bg-hover;
      color: $color-text;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
