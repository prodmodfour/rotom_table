<template>
  <div v-if="canHold" class="hold-action">
    <button
      class="btn btn--sm btn--secondary hold-action__trigger"
      @click="showHoldDialog = true"
    >
      <PhPause :size="16" weight="bold" />
      Hold Action
    </button>

    <div v-if="showHoldDialog" class="hold-action__dialog">
      <div class="hold-action__dialog-header">
        <PhPause :size="16" weight="bold" />
        <span>Hold Action</span>
      </div>

      <div class="hold-action__dialog-body">
        <label class="hold-action__label">
          Hold until initiative:
          <input
            v-model.number="targetInitiative"
            type="number"
            :max="currentInitiative - 1"
            min="0"
            placeholder="Enter initiative value"
            class="hold-action__input"
          />
        </label>
        <p class="hold-action__hint">
          Leave empty to hold indefinitely (GM can manually release).
        </p>
      </div>

      <div class="hold-action__dialog-actions">
        <button class="btn btn--sm btn--success" @click="confirmHold">
          <PhCheck :size="14" weight="bold" />
          Confirm Hold
        </button>
        <button class="btn btn--sm btn--secondary" @click="showHoldDialog = false">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { PhPause, PhCheck } from '@phosphor-icons/vue'
import type { Combatant } from '~/types/encounter'

const props = defineProps<{
  combatant: Combatant
}>()

const emit = defineEmits<{
  hold: [combatantId: string, holdUntilInitiative: number | null]
}>()

const showHoldDialog = ref(false)
const targetInitiative = ref<number | undefined>(undefined)

const currentInitiative = computed(() => props.combatant.initiative)

const canHold = computed(() => {
  // Must not have acted yet
  if (props.combatant.hasActed) return false
  // Must not have already held this round
  if (props.combatant.holdAction?.holdUsedThisRound) return false
  // Must not already be holding
  if (props.combatant.holdAction?.isHolding) return false
  // Must be alive
  if (props.combatant.entity.currentHp <= 0) return false
  return true
})

function confirmHold() {
  const holdUntil = targetInitiative.value !== undefined && targetInitiative.value >= 0
    ? targetInitiative.value
    : null
  emit('hold', props.combatant.id, holdUntil)
  showHoldDialog.value = false
  targetInitiative.value = undefined
}
</script>

<style lang="scss" scoped>
.hold-action {
  position: relative;

  &__trigger {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__dialog {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 100;
    margin-top: $spacing-xs;
    background: $color-bg-elevated;
    border: 1px solid $color-border;
    border-radius: $border-radius-md;
    padding: $spacing-md;
    min-width: 260px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &__dialog-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-text;
    margin-bottom: $spacing-sm;
  }

  &__dialog-body {
    margin-bottom: $spacing-md;
  }

  &__label {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__input {
    width: 80px;
    padding: $spacing-xs $spacing-sm;
    border: 1px solid $color-border;
    border-radius: $border-radius-sm;
    background: $color-bg;
    color: $color-text;
    font-size: $font-size-sm;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $color-primary;
    }
  }

  &__hint {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-top: $spacing-xs;
  }

  &__dialog-actions {
    display: flex;
    gap: $spacing-sm;
  }
}
</style>
