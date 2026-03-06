<template>
  <div class="properties-panel" :class="{ 'properties-panel--collapsed': collapsed }">
    <!-- Collapsed State -->
    <div v-if="collapsed" class="collapsed-strip" @click="emit('toggle-collapse')">
      <PhGear :size="20" />
    </div>

    <!-- Expanded State -->
    <template v-else>
      <div class="panel-header">
        <h3>Properties</h3>
        <button class="btn btn--sm btn--ghost" @click="emit('toggle-collapse')">
          <PhCaretRight :size="16" />
        </button>
      </div>

      <div class="panel-content">
        <div class="form-group">
          <label>Location Name</label>
          <input
            :value="scene.locationName"
            type="text"
            placeholder="e.g., Viridian Forest"
            @change="emit('update:scene', 'locationName', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="form-group">
          <label>Background Image URL</label>
          <input
            :value="scene.locationImage"
            type="url"
            placeholder="https://..."
            @change="emit('update:scene', 'locationImage', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea
            :value="scene.description"
            placeholder="Scene description..."
            rows="3"
            @change="emit('update:scene', 'description', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
        </div>

        <div class="form-group">
          <label>Natural Weather</label>
          <select
            :value="scene.weather"
            @change="emit('update:scene', 'weather', ($event.target as HTMLSelectElement).value || null)"
          >
            <option :value="null">None</option>
            <option value="sunny">Sunny</option>
            <option value="rain">Rain</option>
            <option value="sandstorm">Sandstorm</option>
            <option value="hail">Hail</option>
            <option value="snow">Snow</option>
            <option value="fog">Fog</option>
            <option value="harsh_sunlight">Harsh Sunlight</option>
            <option value="heavy_rain">Heavy Rain</option>
            <option value="strong_winds">Strong Winds</option>
          </select>
          <span class="form-hint">Narrative only. Game Weather Conditions with combat effects are set separately in encounters.</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhGear, PhCaretRight } from '@phosphor-icons/vue'
import type { Scene } from '~/types/scene'

defineProps<{
  scene: Scene
  collapsed: boolean
}>()

const emit = defineEmits<{
  'update:scene': [field: string, value: any]
  'toggle-collapse': []
}>()
</script>

<style lang="scss" scoped>
.properties-panel {
  width: 280px;
  background: $color-bg-secondary;
  border-left: 1px solid $border-color-default;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;

  &--collapsed {
    width: 40px;
  }
}

.collapsed-strip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-md $spacing-xs;
  gap: $spacing-sm;
  cursor: pointer;
  color: $color-text-muted;

  &:hover {
    color: $color-text;
    background: $color-bg-tertiary;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border-bottom: 1px solid $border-color-default;

  h3 {
    margin: 0;
    font-size: $font-size-md;
    color: $color-text;
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-md;
}

.form-group {
  margin-bottom: $spacing-md;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  input, select, textarea {
    width: 100%;
    padding: $spacing-sm;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    color: $color-text;
    font-size: $font-size-sm;

    &:focus {
      outline: none;
      border-color: $color-primary;
    }
  }

  textarea {
    resize: vertical;
  }

  .form-hint {
    display: block;
    margin-top: $spacing-xs;
    font-size: 11px;
    color: $color-text-muted;
    line-height: 1.3;
    opacity: 0.8;
  }
}
</style>
