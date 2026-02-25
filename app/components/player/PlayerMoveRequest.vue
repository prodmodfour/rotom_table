<template>
  <Transition name="slide-up">
    <div v-if="visible" class="move-request">
      <div class="move-request__content">
        <div class="move-request__info">
          <PhArrowsOutCardinal :size="20" />
          <div class="move-request__details">
            <span class="move-request__label">Move to ({{ position.x }}, {{ position.y }})?</span>
            <span class="move-request__distance">Distance: {{ distance }} meter{{ distance !== 1 ? 's' : '' }}</span>
          </div>
        </div>
        <div class="move-request__actions">
          <button class="btn btn--sm btn--ghost" @click="$emit('cancel')">
            Cancel
          </button>
          <button class="btn btn--sm btn--primary" @click="$emit('confirm')">
            <PhCheck :size="16" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { PhArrowsOutCardinal, PhCheck } from '@phosphor-icons/vue'
import type { GridPosition } from '~/types'

defineProps<{
  visible: boolean
  position: GridPosition
  distance: number
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style lang="scss" scoped>
.move-request {
  position: fixed;
  bottom: 72px; // Above player nav bar
  left: 0;
  right: 0;
  z-index: $z-index-modal;
  padding: $spacing-sm $spacing-md;
  padding-bottom: env(safe-area-inset-bottom, 0);

  &__content {
    background: rgba($color-bg-primary, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid $glass-border;
    border-radius: $border-radius-lg;
    padding: $spacing-md;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-md;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    color: $color-text;
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: 600;
  }

  &__distance {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    flex-shrink: 0;
  }
}

// Slide-up transition
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
