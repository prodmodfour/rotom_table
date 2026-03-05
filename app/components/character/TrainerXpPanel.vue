<template>
  <div class="trainer-xp-panel">
    <!-- Header -->
    <div class="trainer-xp-panel__header">
      <h4>Trainer Experience</h4>
      <span class="trainer-xp-panel__bank">
        {{ isAtMaxLevel ? 'Max Level' : `${character.trainerXp} / 10 XP` }}
      </span>
    </div>

    <!-- Progress bar -->
    <div v-if="!isAtMaxLevel" class="trainer-xp-panel__progress">
      <div
        class="trainer-xp-panel__progress-fill"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>

    <!-- Quick award buttons -->
    <div class="trainer-xp-panel__actions">
      <button
        class="btn btn--sm btn--secondary"
        :disabled="disabled || isProcessing || character.trainerXp === 0"
        @click="handleAward(-1)"
      >
        -1
      </button>
      <button
        class="btn btn--sm btn--primary"
        :disabled="disabled || isProcessing"
        @click="handleAward(1)"
      >
        +1
      </button>
      <button
        class="btn btn--sm btn--primary"
        :disabled="disabled || isProcessing"
        @click="handleAward(2)"
      >
        +2
      </button>
      <button
        class="btn btn--sm btn--primary"
        :disabled="disabled || isProcessing"
        @click="handleAward(3)"
      >
        +3
      </button>
      <button
        class="btn btn--sm btn--primary"
        :disabled="disabled || isProcessing"
        @click="handleAward(5)"
      >
        +5
      </button>
      <button
        class="btn btn--sm btn--secondary"
        :disabled="disabled || isProcessing"
        @click="showCustomInput = !showCustomInput"
      >
        Custom
      </button>
    </div>

    <!-- Custom input (shown when "Custom" is clicked) -->
    <div v-if="showCustomInput" class="trainer-xp-panel__custom">
      <div class="trainer-xp-panel__custom-row">
        <input
          v-model.number="customAmount"
          type="number"
          class="form-input form-input--sm"
          min="-100"
          max="100"
          placeholder="Amount"
        />
        <input
          v-model="customReason"
          type="text"
          class="form-input form-input--sm"
          placeholder="Reason (optional)"
        />
        <button
          class="btn btn--sm btn--primary"
          :disabled="!customAmount || customAmount === 0 || isProcessing"
          @click="handleCustomAward"
        >
          Apply
        </button>
        <button
          class="btn btn--sm btn--secondary"
          @click="showCustomInput = false"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Max level indicator -->
    <div v-if="isAtMaxLevel" class="trainer-xp-panel__max-level">
      Max Level Reached
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HumanCharacter } from '~/types/character'
import { TRAINER_MAX_LEVEL } from '~/utils/trainerExperience'

const props = defineProps<{
  character: HumanCharacter
  disabled?: boolean
}>()

const emit = defineEmits<{
  'level-up': [payload: { oldLevel: number; newLevel: number; character: HumanCharacter }]
  'xp-changed': [payload: { newXp: number; newLevel: number }]
}>()

const { awardXp, isProcessing } = useTrainerXp()
const { showToast } = useGmToast()

const showCustomInput = ref(false)
const customAmount = ref<number | null>(null)
const customReason = ref('')

const isAtMaxLevel = computed(() => props.character.level >= TRAINER_MAX_LEVEL)

const progressPercent = computed(() =>
  Math.min(100, (props.character.trainerXp / 10) * 100)
)

async function processXpAward(amount: number, reason: string) {
  try {
    const result = await awardXp(props.character.id, amount, reason)

    emit('xp-changed', { newXp: result.newXp, newLevel: result.newLevel })

    if (result.levelsGained > 0) {
      emit('level-up', {
        oldLevel: result.previousLevel,
        newLevel: result.newLevel,
        character: {
          ...props.character,
          level: result.newLevel,
          trainerXp: result.newXp
        }
      })
    }

    return result
  } catch (e) {
    showToast(`Failed to award XP: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error')
    throw e
  }
}

async function handleAward(amount: number) {
  const reason = `Quick award: ${amount > 0 ? '+' : ''}${amount}`
  await processXpAward(amount, reason)
}

async function handleCustomAward() {
  if (!customAmount.value || customAmount.value === 0) return

  const reason = customReason.value || `Custom: ${customAmount.value > 0 ? '+' : ''}${customAmount.value}`
  await processXpAward(customAmount.value, reason)

  // Reset custom input
  showCustomInput.value = false
  customAmount.value = null
  customReason.value = ''
}
</script>

<style lang="scss" scoped>
.trainer-xp-panel {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-md;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;

    h4 {
      margin: 0;
      font-size: $font-size-sm;
      color: $color-text-muted;
      text-transform: uppercase;
    }
  }

  &__bank {
    font-weight: 600;
    color: $color-accent-teal;
    font-size: $font-size-lg;
  }

  &__progress {
    height: 8px;
    background: $color-bg-primary;
    border-radius: $border-radius-sm;
    overflow: hidden;
    margin-bottom: $spacing-sm;
  }

  &__progress-fill {
    height: 100%;
    background: $color-accent-teal;
    border-radius: $border-radius-sm;
    transition: width 0.3s ease;
  }

  &__actions {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }

  &__custom {
    margin-top: $spacing-sm;
    padding-top: $spacing-sm;
    border-top: 1px solid $glass-border;
  }

  &__custom-row {
    display: flex;
    gap: $spacing-xs;
    align-items: center;

    .form-input--sm {
      padding: $spacing-xs $spacing-sm;
      font-size: $font-size-sm;
      width: auto;
      min-width: 80px;
    }

    .form-input--sm:last-of-type {
      flex: 1;
    }
  }

  &__max-level {
    text-align: center;
    color: $color-text-muted;
    font-style: italic;
    padding: $spacing-sm 0;
  }
}
</style>
