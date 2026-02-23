<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="sprite-picker">
      <!-- Header -->
      <div class="sprite-picker__header">
        <h2>Select Trainer Sprite</h2>
        <button class="btn btn--icon btn--secondary" @click="$emit('close')">
          <img src="/icons/phosphor/x.svg" alt="Close" class="close-icon" />
        </button>
      </div>

      <!-- Body -->
      <div class="sprite-picker__body">
        <!-- Search -->
        <div class="sprite-picker__search">
          <input
            v-model="searchQuery"
            type="text"
            class="form-input"
            placeholder="Search sprites..."
          />
        </div>

        <!-- Category Tabs -->
        <div class="sprite-picker__categories">
          <button
            class="category-tab"
            :class="{ 'category-tab--active': selectedCategory === null }"
            @click="selectedCategory = null"
          >
            All
          </button>
          <button
            v-for="cat in TRAINER_SPRITE_CATEGORIES"
            :key="cat.key"
            class="category-tab"
            :class="{ 'category-tab--active': selectedCategory === cat.key }"
            @click="selectedCategory = cat.key"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- Sprite Grid -->
        <div class="sprite-picker__grid">
          <button
            v-for="sprite in filteredSprites"
            :key="sprite.key"
            class="sprite-cell"
            :class="{ 'sprite-cell--selected': localSelection === sprite.key }"
            @click="localSelection = sprite.key"
          >
            <img
              :src="getTrainerSpriteUrl(sprite.key)!"
              :alt="sprite.label"
              class="sprite-cell__img"
              loading="lazy"
              @error="handleSpriteError($event, sprite.key)"
            />
            <span class="sprite-cell__label">{{ sprite.label }}</span>
          </button>
          <p v-if="filteredSprites.length === 0" class="sprite-picker__empty">
            No sprites match your search.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="sprite-picker__footer">
        <button class="btn btn--secondary" @click="clearSelection">
          Clear Selection
        </button>
        <div class="sprite-picker__footer-actions">
          <button class="btn btn--secondary" @click="$emit('close')">
            Cancel
          </button>
          <button class="btn btn--primary" @click="confirmSelection">
            Select
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TRAINER_SPRITE_CATALOG, TRAINER_SPRITE_CATEGORIES } from '~/constants/trainerSprites'

const props = defineProps<{
  modelValue: string | null
  show: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [key: string | null]
  close: []
}>()

const { getTrainerSpriteUrl } = useTrainerSprite()

// Local state
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const localSelection = ref<string | null>(props.modelValue)
const brokenKeys = ref<Set<string>>(new Set())

// Reset local selection when modal opens with new value
watch(() => props.show, (showing) => {
  if (showing) {
    localSelection.value = props.modelValue
    searchQuery.value = ''
  }
})

// Filtered sprites based on category and search
const filteredSprites = computed(() => {
  return TRAINER_SPRITE_CATALOG.filter(sprite => {
    // Exclude broken sprites
    if (brokenKeys.value.has(sprite.key)) return false

    // Category filter
    if (selectedCategory.value && sprite.category !== selectedCategory.value) return false

    // Search filter (case-insensitive substring)
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      return sprite.label.toLowerCase().includes(query) ||
             sprite.key.toLowerCase().includes(query)
    }

    return true
  })
})

// Handle broken sprite images
const handleSpriteError = (event: Event, key: string) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  brokenKeys.value = new Set([...brokenKeys.value, key])
}

// Clear selection (revert to letter-initial fallback)
const clearSelection = () => {
  localSelection.value = null
}

// Confirm and emit the selected key
const confirmSelection = () => {
  emit('update:modelValue', localSelection.value)
  emit('close')
}
</script>

<style lang="scss" scoped>
.close-icon {
  width: 18px;
  height: 18px;
  filter: brightness(0) invert(1);
}

.modal-overlay {
  @include modal-overlay-enhanced;
}

.sprite-picker {
  @include modal-container-enhanced;
  max-width: 720px;
  max-height: 85vh;

  &__header {
    background: linear-gradient(135deg, rgba($color-accent-teal, 0.1) 0%, transparent 100%);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
    min-height: 0;
    flex: 1;
    overflow: hidden;
  }

  &__search {
    flex-shrink: 0;
  }

  &__categories {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
    flex-shrink: 0;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $glass-border;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: $spacing-sm;
    overflow-y: auto;
    flex: 1;
    min-height: 200px;
    padding: $spacing-xs;
  }

  &__empty {
    grid-column: 1 / -1;
    text-align: center;
    color: $color-text-muted;
    padding: $spacing-xl;
    font-style: italic;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba($color-bg-primary, 0.5);
  }

  &__footer-actions {
    display: flex;
    gap: $spacing-sm;
  }
}

.category-tab {
  padding: $spacing-xs $spacing-sm;
  background: transparent;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  font-size: $font-size-xs;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-fast;
  white-space: nowrap;

  &:hover {
    background: $color-bg-hover;
    color: $color-text;
  }

  &--active {
    background: $gradient-sv-cool;
    color: $color-text;
    border-color: $color-accent-teal;
  }
}

.sprite-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border: 2px solid transparent;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-fast;
  min-height: 100px;

  &:hover {
    background: $color-bg-hover;
    border-color: $border-color-emphasis;
  }

  &--selected {
    border-color: $color-accent-teal;
    background: rgba($color-accent-teal, 0.1);
    box-shadow: $shadow-glow-teal;
  }

  &__img {
    width: 64px;
    height: 64px;
    object-fit: contain;
    image-rendering: pixelated;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-align: center;
    line-height: 1.2;
    word-break: break-word;
  }
}
</style>
