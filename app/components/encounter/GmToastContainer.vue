<template>
  <div class="gm-toast-container" aria-live="polite">
    <TransitionGroup name="gm-toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="gm-toast"
        :class="`gm-toast--${toast.severity}`"
        role="alert"
      >
        <component :is="severityIcon(toast.severity)" :size="18" class="gm-toast__icon" />
        <span class="gm-toast__message">{{ toast.message }}</span>
        <button
          class="gm-toast__dismiss"
          aria-label="Dismiss"
          @click="dismissToast(toast.id)"
        >
          <PhX :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import {
  PhWarning,
  PhSkull,
  PhWarningCircle,
  PhInfo,
  PhCheckCircle,
  PhX,
} from '@phosphor-icons/vue'
import type { GmToastSeverity } from '~/composables/useGmToast'

const { toasts, dismissToast } = useGmToast()

const severityIcon = (severity: GmToastSeverity) => {
  switch (severity) {
    case 'warning': return PhWarning
    case 'critical': return PhSkull
    case 'error': return PhWarningCircle
    case 'info': return PhInfo
    case 'success': return PhCheckCircle
  }
}
</script>

<style lang="scss" scoped>
@import '~/assets/scss/components/gm-toast';
</style>
