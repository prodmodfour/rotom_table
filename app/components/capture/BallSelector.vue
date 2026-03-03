<template>
  <div class="ball-selector">
    <label class="ball-selector__label">
      Ball Type
    </label>

    <!-- Selected ball summary -->
    <button
      class="ball-selector__toggle"
      :class="{ 'ball-selector__toggle--open': isOpen }"
      @click="isOpen = !isOpen"
    >
      <span class="ball-selector__selected-name">{{ selectedBall?.name || 'Basic Ball' }}</span>
      <span
        v-if="selectedBall"
        class="ball-selector__selected-mod"
        :class="modifierClass(totalModifier)"
      >
        {{ formatModifier(totalModifier) }}
      </span>
      <PhCaretDown :size="14" weight="bold" class="ball-selector__caret" />
    </button>

    <!-- Dropdown panel -->
    <div v-if="isOpen" class="ball-selector__dropdown">
      <!-- Basic Balls -->
      <div class="ball-group">
        <div class="ball-group__header">
          <PhCircle :size="14" weight="fill" />
          <span>Basic Balls</span>
        </div>
        <button
          v-for="ball in basicBalls"
          :key="ball.name"
          class="ball-option"
          :class="{ 'ball-option--selected': ball.name === modelValue }"
          @click="selectBall(ball.name)"
        >
          <span class="ball-option__name">{{ ball.name }}</span>
          <span class="ball-option__info">
            <span class="ball-option__mod" :class="modifierClass(ball.modifier)">
              {{ formatModifier(ball.modifier) }}
            </span>
            <span v-if="ball.postCaptureEffect" class="ball-option__badge">
              <PhSparkle :size="10" weight="fill" />
              {{ effectLabel(ball.postCaptureEffect) }}
            </span>
          </span>
        </button>
      </div>

      <!-- Apricorn Balls -->
      <div class="ball-group">
        <div class="ball-group__header">
          <PhFlower :size="14" weight="fill" />
          <span>Apricorn Balls</span>
        </div>
        <button
          v-for="ball in apricornBalls"
          :key="ball.name"
          class="ball-option"
          :class="{ 'ball-option--selected': ball.name === modelValue }"
          @click="selectBall(ball.name)"
        >
          <span class="ball-option__name">{{ ball.name }}</span>
          <span class="ball-option__info">
            <span class="ball-option__mod" :class="modifierClass(ball.modifier)">
              {{ formatModifier(ball.modifier) }}
            </span>
            <BallConditionPreview
              v-if="ball.conditionDescription"
              :ball="ball"
              :condition-context="conditionContext"
            />
            <span v-if="ball.postCaptureEffect" class="ball-option__badge">
              <PhSparkle :size="10" weight="fill" />
              {{ effectLabel(ball.postCaptureEffect) }}
            </span>
          </span>
        </button>
      </div>

      <!-- Special Balls -->
      <div class="ball-group">
        <div class="ball-group__header">
          <PhStar :size="14" weight="fill" />
          <span>Special Balls</span>
        </div>
        <button
          v-for="ball in specialBalls"
          :key="ball.name"
          class="ball-option"
          :class="{ 'ball-option--selected': ball.name === modelValue }"
          @click="selectBall(ball.name)"
        >
          <span class="ball-option__name">{{ ball.name }}</span>
          <span class="ball-option__info">
            <span class="ball-option__mod" :class="modifierClass(ball.modifier)">
              {{ formatModifier(ball.modifier) }}
            </span>
            <BallConditionPreview
              v-if="ball.conditionDescription"
              :ball="ball"
              :condition-context="conditionContext"
            />
            <span v-if="ball.postCaptureEffect" class="ball-option__badge">
              <PhSparkle :size="10" weight="fill" />
              {{ effectLabel(ball.postCaptureEffect) }}
            </span>
          </span>
        </button>
      </div>

      <!-- Safari Balls (optional) -->
      <div v-if="includeSafari && safariBalls.length > 0" class="ball-group">
        <div class="ball-group__header">
          <PhTree :size="14" weight="fill" />
          <span>Safari Balls</span>
        </div>
        <button
          v-for="ball in safariBalls"
          :key="ball.name"
          class="ball-option"
          :class="{ 'ball-option--selected': ball.name === modelValue }"
          @click="selectBall(ball.name)"
        >
          <span class="ball-option__name">{{ ball.name }}</span>
          <span class="ball-option__info">
            <span class="ball-option__mod" :class="modifierClass(ball.modifier)">
              {{ formatModifier(ball.modifier) }}
            </span>
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCaretDown, PhCircle, PhFlower, PhStar, PhTree, PhSparkle } from '@phosphor-icons/vue'
import { POKE_BALL_CATALOG, getBallsByCategory, calculateBallModifier } from '~/constants/pokeBalls'
import type { PokeBallDef, BallConditionContext } from '~/constants/pokeBalls'
import { formatModifier, modifierClass } from '~/utils/pokeBallFormatters'

const props = withDefaults(defineProps<{
  /** Currently selected ball type */
  modelValue: string
  /** Condition context for showing conditional modifier previews */
  conditionContext?: Partial<BallConditionContext>
  /** Whether to include Safari-only balls */
  includeSafari?: boolean
}>(), {
  conditionContext: undefined,
  includeSafari: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)

const grouped = computed(() => getBallsByCategory())

const basicBalls = computed(() => grouped.value.basic)
const apricornBalls = computed(() => grouped.value.apricorn)
const specialBalls = computed(() => grouped.value.special)
const safariBalls = computed(() => grouped.value.safari)

const selectedBall = computed<PokeBallDef | undefined>(() =>
  POKE_BALL_CATALOG[props.modelValue]
)

const totalModifier = computed(() => {
  const result = calculateBallModifier(props.modelValue, props.conditionContext)
  return result.total
})

function selectBall(name: string) {
  emit('update:modelValue', name)
  isOpen.value = false
}

function effectLabel(effect: string): string {
  switch (effect) {
    case 'heal_full': return 'Heal Max'
    case 'loyalty_plus_one': return '+1 Loyalty'
    case 'raised_happiness': return 'Happiness'
    default: return effect
  }
}
</script>

<style lang="scss" scoped>
.ball-selector {
  position: relative;

  &__label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: $spacing-xs;
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    width: 100%;
    padding: $spacing-xs $spacing-sm;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    color: $color-text;
    cursor: pointer;
    font-size: $font-size-sm;
    transition: border-color $transition-fast;

    &:hover {
      border-color: $color-accent-teal;
    }

    &--open {
      border-color: $color-accent-teal;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  &__selected-name {
    flex: 1;
    text-align: left;
  }

  &__selected-mod {
    font-weight: 600;
    font-size: $font-size-xs;
  }

  &__caret {
    transition: transform $transition-fast;
    .ball-selector__toggle--open & {
      transform: rotate(180deg);
    }
  }

  &__dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: $z-index-dropdown;
    background: $color-bg-elevated;
    border: 1px solid $color-accent-teal;
    border-top: none;
    border-radius: 0 0 $border-radius-sm $border-radius-sm;
    max-height: 320px;
    overflow-y: auto;
    box-shadow: $shadow-md;
  }
}

.ball-group {
  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: rgba($color-bg-primary, 0.5);
    border-bottom: 1px solid $border-color-subtle;
  }
}

.ball-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: $spacing-xs $spacing-sm;
  background: transparent;
  border: none;
  border-bottom: 1px solid $border-color-subtle;
  color: $color-text;
  cursor: pointer;
  font-size: $font-size-sm;
  transition: background $transition-fast;

  &:hover {
    background: $color-bg-hover;
  }

  &--selected {
    background: rgba($color-accent-teal, 0.15);

    &:hover {
      background: rgba($color-accent-teal, 0.2);
    }
  }

  &__name {
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &__mod {
    font-weight: 600;
    font-size: $font-size-xs;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px $spacing-xs;
    font-size: 0.65rem;
    font-weight: 600;
    color: $color-accent-teal;
    background: rgba($color-accent-teal, 0.15);
    border-radius: $border-radius-sm;
  }
}

.mod {
  &--positive {
    color: $color-success;
  }

  &--negative {
    color: $color-danger;
  }

  &--neutral {
    color: $color-text-muted;
  }
}
</style>
