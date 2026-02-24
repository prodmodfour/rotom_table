<template>
  <div v-if="cell" class="coordinate-display">
    {{ cell.x }}, {{ cell.y }}
    <span v-if="elevation !== undefined && (elevation > 0 || isIsometric)" class="coordinate-display__elevation">
      Z{{ elevation }}
    </span>
    <template v-if="mode !== 'none'">
      <span class="coordinate-display__mode">| {{ mode }}</span>
      <span v-if="distance && distance > 0" class="coordinate-display__distance">
        | {{ distance }}m
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { GridPosition } from '~/types'
import type { MeasurementMode } from '~/stores/measurement'

defineProps<{
  cell: GridPosition | null
  mode?: MeasurementMode
  distance?: number
  elevation?: number
  /** When true, always show elevation (even Z0) for spatial awareness. */
  isIsometric?: boolean
}>()
</script>

<style lang="scss" scoped>
.coordinate-display {
  position: absolute;
  bottom: $spacing-md;
  left: $spacing-md;
  padding: $spacing-xs $spacing-sm;
  background: rgba($color-bg-primary, 0.9);
  backdrop-filter: blur(4px);
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-family: monospace;
  color: $color-text-muted;
  z-index: 10;

  &__mode {
    color: $color-accent-teal;
  }

  &__elevation {
    color: $color-accent-teal;
    font-weight: 600;
    margin-left: 4px;
  }

  &__distance {
    color: $color-accent-scarlet;
    font-weight: 600;
  }
}
</style>
