<template>
  <span
    class="condition-preview"
    :class="conditionMet ? 'condition-preview--met' : 'condition-preview--unmet'"
    :title="ball.conditionDescription"
  >
    <PhCheckCircle v-if="conditionMet" :size="10" weight="fill" />
    <PhMinusCircle v-else :size="10" weight="fill" />
    <span class="condition-preview__text">
      {{ conditionMet ? formatModifier(conditionalModifier) : 'if...' }}
    </span>
  </span>
</template>

<script setup lang="ts">
import { PhCheckCircle, PhMinusCircle } from '@phosphor-icons/vue'
import { evaluateBallCondition } from '~/utils/pokeBallConditions'
import type { PokeBallDef, BallConditionContext } from '~/constants/pokeBalls'
import { formatModifier } from '~/utils/pokeBallFormatters'

const props = defineProps<{
  ball: PokeBallDef
  conditionContext?: Partial<BallConditionContext>
}>()

const conditionResult = computed(() => {
  if (!props.conditionContext) {
    return { modifier: 0, conditionMet: false }
  }
  return evaluateBallCondition(props.ball.name, props.conditionContext)
})

const conditionMet = computed(() => conditionResult.value.conditionMet)
const conditionalModifier = computed(() => conditionResult.value.modifier)

</script>

<style lang="scss" scoped>
.condition-preview {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px $spacing-xs;
  font-size: 0.65rem;
  font-weight: 600;
  border-radius: $border-radius-sm;

  &--met {
    color: $color-success;
    background: rgba($color-success, 0.15);
  }

  &--unmet {
    color: $color-text-muted;
    background: rgba($color-text-muted, 0.1);
    font-style: italic;
  }

  &__text {
    white-space: nowrap;
  }
}
</style>
