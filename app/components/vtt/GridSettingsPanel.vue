<template>
  <div class="grid-settings" data-testid="vtt-settings">
    <div class="grid-settings__row">
      <div class="form-group">
        <label>Width (cells)</label>
        <input
          type="number"
          :value="config.width"
          @input="updateField('width', $event)"
          class="form-input form-input--sm"
          min="5"
          max="100"
          data-testid="grid-width-input"
        />
      </div>
      <div class="form-group">
        <label>Height (cells)</label>
        <input
          type="number"
          :value="config.height"
          @input="updateField('height', $event)"
          class="form-input form-input--sm"
          min="5"
          max="100"
          data-testid="grid-height-input"
        />
      </div>
      <div class="form-group">
        <label>Cell Size (px)</label>
        <input
          type="number"
          :value="config.cellSize"
          @input="updateField('cellSize', $event)"
          class="form-input form-input--sm"
          min="20"
          max="100"
          data-testid="cell-size-input"
        />
      </div>
    </div>

    <!-- Isometric Grid Toggle -->
    <div class="grid-settings__row">
      <div class="form-group">
        <label class="checkbox-label">
          <input
            type="checkbox"
            :checked="config.isometric"
            @change="toggleIsometric"
            data-testid="isometric-toggle"
          />
          Isometric View
        </label>
      </div>
      <div v-if="config.isometric" class="form-group">
        <label>Max Elevation</label>
        <input
          type="number"
          :value="config.maxElevation"
          @input="updateField('maxElevation', $event)"
          class="form-input form-input--sm"
          min="1"
          max="10"
          data-testid="max-elevation-input"
        />
      </div>
      <div v-if="config.isometric" class="form-group">
        <label>Camera Angle</label>
        <select
          :value="config.cameraAngle"
          @change="updateCameraAngle"
          class="form-input form-input--sm"
          data-testid="camera-angle-select"
        >
          <option :value="0">North (default)</option>
          <option :value="1">East (90)</option>
          <option :value="2">South (180)</option>
          <option :value="3">West (270)</option>
        </select>
      </div>
    </div>

    <div class="grid-settings__row">
      <div class="form-group form-group--wide">
        <label>Background Image</label>
        <div class="background-upload">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            class="background-upload__input"
            @change="handleFileSelect"
            data-testid="background-file-input"
          />
          <button
            class="btn btn--sm btn--secondary background-upload__btn"
            @click="triggerFileInput"
            :disabled="isUploading"
            data-testid="upload-bg-btn"
          >
            {{ isUploading ? 'Uploading...' : 'Upload Image' }}
          </button>
          <button
            v-if="config.background"
            class="btn btn--sm btn--danger"
            @click="$emit('removeBackground')"
            :disabled="isUploading"
            data-testid="remove-bg-btn"
          >
            Remove
          </button>
        </div>
        <div v-if="config.background" class="background-preview">
          <img :src="config.background" alt="Background preview" />
        </div>
        <div v-if="uploadError" class="upload-error">{{ uploadError }}</div>
      </div>
    </div>

    <div class="grid-settings__actions">
      <button
        class="btn btn--sm btn--secondary"
        @click="$emit('reset')"
      >
        Reset
      </button>
      <button
        class="btn btn--sm btn--primary"
        @click="$emit('apply')"
        data-testid="apply-settings-btn"
      >
        Apply
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GridConfig } from '~/types'

const props = defineProps<{
  config: GridConfig
  isUploading?: boolean
  uploadError?: string | null
}>()

const emit = defineEmits<{
  update: [field: keyof GridConfig, value: number | string | boolean | undefined]
  apply: []
  reset: []
  uploadBackground: [file: File]
  removeBackground: []
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const updateField = (field: keyof GridConfig, event: Event) => {
  const input = event.target as HTMLInputElement
  const value = input.type === 'number' ? Number(input.value) : input.value
  emit('update', field, value)
}

const toggleIsometric = (event: Event) => {
  const input = event.target as HTMLInputElement
  emit('update', 'isometric', input.checked)
}

const updateCameraAngle = (event: Event) => {
  const select = event.target as HTMLSelectElement
  emit('update', 'cameraAngle', Number(select.value))
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return
  }

  emit('uploadBackground', file)

  // Reset file input
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}
</script>

<style lang="scss" scoped>
.grid-settings {
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  &__row {
    display: flex;
    gap: $spacing-md;
    flex-wrap: wrap;

    .form-group {
      flex: 1;
      min-width: 100px;

      &--wide {
        flex: 3;
        min-width: 200px;
      }
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    cursor: pointer;
    font-size: $font-size-sm;
    margin-bottom: 0;

    input[type="checkbox"] {
      cursor: pointer;
    }
  }

  .form-input--sm {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
  }
}

.background-upload {
  display: flex;
  gap: $spacing-sm;
  align-items: center;

  &__input {
    display: none;
  }

  &__btn {
    flex-shrink: 0;
  }
}

.background-preview {
  margin-top: $spacing-sm;
  border-radius: $border-radius-sm;
  overflow: hidden;
  max-height: 100px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    max-height: 100px;
  }
}

.upload-error {
  color: $color-danger;
  font-size: $font-size-xs;
  margin-top: $spacing-xs;
}
</style>
