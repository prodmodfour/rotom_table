<template>
  <div class="levelup-milestones">
    <h3>Lifestyle Milestones</h3>

    <div
      v-for="milestone in milestones"
      :key="milestone.level"
      class="milestone-card"
    >
      <div class="milestone-card__header">
        <span class="milestone-card__title">{{ milestone.name }} Trainer</span>
        <span class="milestone-card__level">Level {{ milestone.level }}</span>
      </div>

      <p class="milestone-card__prompt">Choose one bonus:</p>

      <div class="milestone-card__options">
        <label
          v-for="option in milestone.choices"
          :key="option.id"
          class="milestone-option"
          :class="{ 'milestone-option--selected': milestoneChoices[milestone.level] === option.id }"
        >
          <input
            type="radio"
            :name="`milestone-${milestone.level}`"
            :value="option.id"
            :checked="milestoneChoices[milestone.level] === option.id"
            class="milestone-option__radio"
            @change="$emit('setMilestoneChoice', milestone.level, option.id)"
          />
          <div class="milestone-option__content">
            <span class="milestone-option__label">{{ option.label }}</span>
            <span class="milestone-option__description">{{ option.description }}</span>
          </div>
        </label>
      </div>
    </div>

    <div v-if="!milestones.length" class="levelup-milestones__empty">
      No milestones encountered in this level range.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrainerMilestone } from '~/utils/trainerAdvancement'
import type { MilestoneChoiceId } from '~/composables/useTrainerLevelUp'

interface Props {
  /** Milestones encountered in this advancement */
  milestones: TrainerMilestone[]
  /** Current milestone choices made */
  milestoneChoices: Record<number, MilestoneChoiceId>
}

defineProps<Props>()

defineEmits<{
  setMilestoneChoice: [milestoneLevel: number, choiceId: MilestoneChoiceId]
}>()
</script>

<style lang="scss" scoped>
.levelup-milestones {
  h3 {
    margin: 0 0 $spacing-md 0;
    font-size: $font-size-md;
    color: $color-text;
    font-weight: 600;
  }

  &__empty {
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-style: italic;
    padding: $spacing-md;
    text-align: center;
  }
}

.milestone-card {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  border-left: 3px solid $color-accent-teal;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-accent-teal;
  }

  &__level {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    padding: $spacing-xs $spacing-sm;
    background: $color-bg-secondary;
    border-radius: $border-radius-sm;
  }

  &__prompt {
    margin: 0 0 $spacing-md 0;
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
}

.milestone-option {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    border-color: $color-accent-teal;
    background: $color-bg-hover;
  }

  &--selected {
    border-color: rgba($color-accent-teal, 0.5);
    background: rgba($color-accent-teal, 0.08);
  }

  &__radio {
    margin-top: 2px;
    flex-shrink: 0;
    accent-color: $color-accent-teal;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text;
  }

  &__description {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    line-height: 1.4;
  }
}
</style>
