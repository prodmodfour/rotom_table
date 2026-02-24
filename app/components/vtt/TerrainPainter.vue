<template>
  <div class="terrain-painter">
    <div class="terrain-painter__header">
      <h4>Terrain Tools</h4>
      <button
        class="btn-toggle"
        :class="{ active: terrainStore.enabled }"
        @click="terrainStore.setEnabled(!terrainStore.enabled)"
        title="Toggle terrain editing"
      >
        {{ terrainStore.enabled ? 'Editing' : 'View Only' }}
      </button>
    </div>

    <div v-if="terrainStore.enabled" class="terrain-painter__tools">
      <!-- Terrain Type Selector -->
      <div class="terrain-painter__section">
        <label>Paint Mode</label>
        <div class="terrain-painter__types">
          <button
            v-for="terrain in terrainTypes"
            :key="terrain.type"
            class="terrain-btn"
            :class="{ active: terrainStore.paintMode === terrain.type }"
            :style="{ '--terrain-color': terrain.color }"
            @click="terrainStore.setPaintMode(terrain.type)"
            :title="terrain.description"
          >
            <span class="terrain-btn__icon">{{ terrain.icon }}</span>
            <span class="terrain-btn__label">{{ terrain.label }}</span>
          </button>
        </div>
      </div>

      <!-- Brush Size -->
      <div class="terrain-painter__section">
        <label>Brush Size: {{ terrainStore.brushSize }}</label>
        <div class="terrain-painter__slider">
          <input
            type="range"
            min="1"
            max="5"
            :value="terrainStore.brushSize"
            @input="terrainStore.setBrushSize(Number(($event.target as HTMLInputElement).value))"
          />
          <div class="terrain-painter__brush-preview" :style="brushPreviewStyle">
            <div
              v-for="i in terrainStore.brushSize * terrainStore.brushSize"
              :key="i"
              class="brush-cell"
            />
          </div>
        </div>
      </div>

      <!-- Tool Mode -->
      <div class="terrain-painter__section">
        <label>Tool</label>
        <div class="terrain-painter__modes">
          <button
            class="mode-btn"
            :class="{ active: toolMode === 'paint' }"
            @click="toolMode = 'paint'"
            title="Paint terrain"
          >
            Paint
          </button>
          <button
            class="mode-btn"
            :class="{ active: toolMode === 'erase' }"
            @click="toolMode = 'erase'"
            title="Erase terrain (reset to normal)"
          >
            Erase
          </button>
          <button
            class="mode-btn"
            :class="{ active: toolMode === 'line' }"
            @click="toolMode = 'line'"
            title="Draw line (for walls)"
          >
            Line
          </button>
          <button
            class="mode-btn"
            :class="{ active: toolMode === 'fill' }"
            @click="toolMode = 'fill'"
            title="Fill rectangle"
          >
            Fill
          </button>
        </div>
      </div>

      <!-- Elevation Brush (isometric mode only) -->
      <div v-if="isIsometric" class="terrain-painter__section">
        <label>Elevation Level: {{ elevationLevel }}</label>
        <div class="terrain-painter__slider">
          <input
            type="range"
            min="0"
            :max="maxElevation"
            :value="elevationLevel"
            @input="elevationLevel = Number(($event.target as HTMLInputElement).value)"
          />
          <span class="terrain-painter__elev-value">Z{{ elevationLevel }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="terrain-painter__actions">
        <button
          class="btn btn-secondary btn-sm"
          @click="clearAllTerrain"
          :disabled="terrainStore.terrainCount === 0"
        >
          Clear All
        </button>
        <span class="terrain-painter__count">
          {{ terrainStore.terrainCount }} cells
        </span>
      </div>
    </div>

    <!-- Legend (always visible) -->
    <div class="terrain-painter__legend">
      <div
        v-for="terrain in terrainTypes"
        :key="terrain.type"
        class="legend-item"
        :style="{ '--terrain-color': terrain.color }"
      >
        <span class="legend-swatch"></span>
        <span class="legend-label">{{ terrain.label }}</span>
        <span class="legend-cost">{{ terrain.costLabel }}</span>
      </div>
    </div>

    <!-- Keyboard Shortcuts Hint -->
    <div v-if="terrainStore.enabled" class="terrain-painter__shortcuts">
      <span><kbd>T</kbd> Toggle terrain</span>
      <span><kbd>[</kbd><kbd>]</kbd> Brush size</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTerrainStore, TERRAIN_COLORS } from '~/stores/terrain'
import type { TerrainType } from '~/types'

const props = defineProps<{
  /** Whether isometric mode is active (shows elevation brush). */
  isIsometric?: boolean
  /** Max elevation level for the slider. */
  maxElevation?: number
}>()

const terrainStore = useTerrainStore()

// Tool mode (separate from terrain type)
const toolMode = ref<'paint' | 'erase' | 'line' | 'fill'>('paint')

// Elevation level for terrain painting (isometric mode)
const elevationLevel = ref(0)

// Terrain type definitions with UI metadata
const terrainTypes = [
  {
    type: 'normal' as TerrainType,
    label: 'Normal',
    icon: '○',
    color: 'rgba(200, 200, 200, 0.5)',
    description: 'Normal terrain - standard movement',
    costLabel: '1x',
  },
  {
    type: 'difficult' as TerrainType,
    label: 'Slow',
    icon: '◇',
    color: TERRAIN_COLORS.difficult.fill,
    description: 'Slow terrain - 2x movement cost (PTU: Slow Terrain)',
    costLabel: '2x',
  },
  {
    type: 'blocking' as TerrainType,
    label: 'Blocking',
    icon: '■',
    color: TERRAIN_COLORS.blocking.fill,
    description: 'Blocking terrain - impassable',
    costLabel: '∞',
  },
  {
    type: 'water' as TerrainType,
    label: 'Water',
    icon: '≈',
    color: TERRAIN_COLORS.water.fill,
    description: 'Underwater terrain - requires Swim capability',
    costLabel: '2x/∞',
  },
  {
    type: 'earth' as TerrainType,
    label: 'Earth',
    icon: '⛏',
    color: TERRAIN_COLORS.earth.fill,
    description: 'Earth terrain - requires Burrow capability (PTU: Earth Terrain)',
    costLabel: '∞/1x',
  },
  {
    type: 'rough' as TerrainType,
    label: 'Rough',
    icon: '⌇',
    color: TERRAIN_COLORS.rough.fill,
    description: 'Rough terrain - -2 accuracy penalty when targeting through (PTU: Rough Terrain)',
    costLabel: '1x/-2 acc',
  },
  {
    type: 'hazard' as TerrainType,
    label: 'Hazard',
    icon: '⚠',
    color: TERRAIN_COLORS.hazard.fill,
    description: 'Hazard - deals damage on entry',
    costLabel: '1x+dmg',
  },
  {
    type: 'elevated' as TerrainType,
    label: 'Elevated',
    icon: '△',
    color: TERRAIN_COLORS.elevated.fill,
    description: 'Elevated terrain - height advantage',
    costLabel: '1x',
  },
]

// Brush preview style
const brushPreviewStyle = computed(() => ({
  gridTemplateColumns: `repeat(${terrainStore.brushSize}, 8px)`,
  gridTemplateRows: `repeat(${terrainStore.brushSize}, 8px)`,
}))

// Clear all terrain
const clearAllTerrain = () => {
  if (confirm('Clear all terrain? This cannot be undone.')) {
    terrainStore.clearAll()
  }
}

// Expose tool mode and elevation level for parent component
defineExpose({
  toolMode,
  elevationLevel,
})
</script>

<style lang="scss" scoped>
.terrain-painter {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $color-bg-secondary;
  border-radius: $border-radius-md;
  border: 1px solid $border-color-default;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    h4 {
      margin: 0;
      font-size: $font-size-sm;
      color: $color-text;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;

    label {
      font-size: $font-size-xs;
      color: $color-text-muted;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  &__types {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-xs;
  }

  &__modes {
    display: flex;
    gap: $spacing-xs;
  }

  &__slider {
    display: flex;
    align-items: center;
    gap: $spacing-sm;

    input[type="range"] {
      flex: 1;
      accent-color: $color-accent-teal;
    }
  }

  &__brush-preview {
    display: grid;
    gap: 1px;
    padding: 2px;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;

    .brush-cell {
      width: 8px;
      height: 8px;
      background: $color-accent-teal;
      border-radius: 1px;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: $spacing-xs;
    border-top: 1px solid $border-color-default;
  }

  &__count {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__elev-value {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-accent-teal;
    min-width: 28px;
    text-align: center;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    padding-top: $spacing-xs;
    border-top: 1px solid $border-color-default;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: $font-size-xs;
    }

    .legend-swatch {
      width: 12px;
      height: 12px;
      background: var(--terrain-color);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }

    .legend-label {
      color: $color-text-muted;
    }

    .legend-cost {
      color: $color-text-muted;
      opacity: 0.7;
      font-size: 0.7rem;
    }
  }

  &__shortcuts {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    padding-top: $spacing-xs;
    font-size: $font-size-xs;
    color: $color-text-muted;

    kbd {
      display: inline-block;
      padding: 1px 4px;
      background: $color-bg-tertiary;
      border: 1px solid $border-color-default;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.7rem;
    }
  }
}

.btn-toggle {
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  font-size: $font-size-xs;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: $color-accent-teal;
  }

  &.active {
    background: rgba($color-accent-teal, 0.2);
    border-color: $color-accent-teal;
    color: $color-accent-teal;
  }
}

.terrain-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: $spacing-xs;
  background: $color-bg-tertiary;
  border: 2px solid transparent;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--terrain-color);
  }

  &.active {
    border-color: var(--terrain-color);
    background: var(--terrain-color);
  }

  &__icon {
    font-size: 1rem;
    line-height: 1;
  }

  &__label {
    font-size: 0.6rem;
    color: $color-text-muted;
    text-transform: uppercase;
  }
}

.mode-btn {
  flex: 1;
  padding: $spacing-xs;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  font-size: $font-size-xs;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: $color-accent-teal;
  }

  &.active {
    background: rgba($color-accent-teal, 0.2);
    border-color: $color-accent-teal;
    color: $color-accent-teal;
  }
}

.btn-sm {
  padding: $spacing-xs $spacing-sm;
  font-size: $font-size-xs;
}
</style>
