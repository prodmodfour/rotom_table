<template>
  <div v-if="showVisionToggles" class="vision-toggle">
    <label
      v-for="cap in ALL_VISION_CAPABILITIES"
      :key="cap"
      class="vision-toggle__item"
    >
      <input
        type="checkbox"
        :checked="hasCap(cap)"
        @change="toggleVision(cap, ($event.target as HTMLInputElement).checked)"
      />
      <span class="vision-toggle__label">{{ VISION_CAPABILITY_LABELS[cap] }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ALL_VISION_CAPABILITIES, VISION_CAPABILITY_LABELS, hasSpecificVision } from '~/utils/visionRules'
import type { VisionCapability } from '~/utils/visionRules'
import type { Combatant } from '~/types'

const props = defineProps<{
  combatant: Combatant
  showVisionToggles: boolean
}>()

const emit = defineEmits<{
  toggleVision: [capability: VisionCapability, enabled: boolean]
}>()

const hasCap = (cap: VisionCapability) => hasSpecificVision(props.combatant, cap)

const toggleVision = (cap: VisionCapability, enabled: boolean) => {
  emit('toggleVision', cap, enabled)
}
</script>

<style lang="scss" scoped>
.vision-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px $spacing-xs;
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-accent-teal;
    background: rgba($color-accent-teal, 0.08);
    border: 1px solid rgba($color-accent-teal, 0.25);
    border-radius: $border-radius-sm;
    cursor: pointer;
    user-select: none;

    input[type="checkbox"] {
      margin: 0;
      cursor: pointer;
    }
  }

  &__label {
    pointer-events: none;
  }
}
</style>
