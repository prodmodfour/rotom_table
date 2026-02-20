<template>
  <NuxtLink :to="`/gm/habitats/${table.id}`" class="table-card" data-testid="encounter-table-card">
    <!-- Header -->
    <div class="table-card__header">
      <div class="table-card__image" v-if="table.imageUrl">
        <img :src="table.imageUrl" :alt="table.name" />
      </div>
      <div class="table-card__placeholder" v-else>
        <img src="/icons/phosphor/tree.svg" alt="" class="placeholder-icon" />
      </div>
      <div class="table-card__info">
        <h3 class="table-card__name">{{ table.name }}</h3>
        <p class="table-card__meta">
          <span class="table-card__level">Lv. {{ table.levelRange.min }}-{{ table.levelRange.max }}</span>
          <span class="table-card__density" :class="`density--${table.density}`">
            {{ getDensityLabel(table.density) }}
          </span>
          <span class="table-card__count">{{ table.entries.length }} species</span>
        </p>
      </div>
    </div>

    <!-- Description -->
    <p v-if="table.description" class="table-card__description">
      {{ table.description }}
    </p>

    <!-- Species Sprites -->
    <div class="table-card__species" v-if="table.entries.length > 0">
      <div
        v-for="entry in previewEntries"
        :key="entry.id"
        class="species-sprite"
        :title="entry.speciesName"
      >
        <img
          :src="getSpriteUrl(entry.speciesName)"
          :alt="entry.speciesName"
          @error="handleSpriteError($event)"
        />
      </div>
      <div v-if="table.entries.length > maxPreview" class="species-more">
        +{{ table.entries.length - maxPreview }}
      </div>
    </div>
    <p v-else class="table-card__empty-species">No species added yet</p>

    <!-- Modifications -->
    <div v-if="table.modifications.length > 0" class="table-card__mods">
      <span class="table-card__mods-label">Sub-habitats:</span>
      <span
        v-for="mod in table.modifications"
        :key="mod.id"
        class="mod-tag"
      >
        {{ mod.name }}
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { EncounterTable, DensityTier } from '~/types'

const props = defineProps<{
  table: EncounterTable
}>()

const { getSpriteUrl } = usePokemonSprite()

const maxPreview = 8

// Show first entries as preview, sorted by weight (most common first)
const previewEntries = computed(() => {
  return [...props.table.entries]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, maxPreview)
})

// Get density label for display (capitalized tier name)
const getDensityLabel = (density: DensityTier): string => {
  return density.charAt(0).toUpperCase() + density.slice(1)
}

const handleSpriteError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/images/pokemon-placeholder.svg'
}
</script>

<style lang="scss" scoped>
.table-card {
  display: block;
  text-decoration: none;
  color: inherit;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  padding: $spacing-lg;
  transition: all $transition-normal;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba($color-accent, 0.3);
    box-shadow: $shadow-lg, $shadow-glow-scarlet;
  }

  &__header {
    display: flex;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
  }

  &__image,
  &__placeholder {
    width: 60px;
    height: 60px;
    border-radius: $border-radius-md;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-bg-tertiary;
    border: 2px solid $border-color-default;

    .placeholder-icon {
      width: 32px;
      height: 32px;
      filter: brightness(0) invert(0.5);
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    margin: 0;
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: flex;
    gap: $spacing-md;
    margin-top: $spacing-xs;
    font-size: $font-size-sm;
    color: $color-text-muted;
  }

  &__level {
    background: $gradient-scarlet;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    font-weight: 600;
    font-size: $font-size-xs;
  }

  &__density {
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    font-weight: 500;
    font-size: $font-size-xs;

    &.density--sparse {
      background: rgba(158, 158, 158, 0.2);
      color: #bdbdbd;
    }

    &.density--moderate {
      background: rgba(33, 150, 243, 0.2);
      color: #64b5f6;
    }

    &.density--dense {
      background: rgba(255, 152, 0, 0.2);
      color: #ffb74d;
    }

    &.density--abundant {
      background: rgba(244, 67, 54, 0.2);
      color: #ef5350;
    }
  }

  &__description {
    color: $color-text-muted;
    font-size: $font-size-sm;
    margin-bottom: $spacing-md;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__species {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $spacing-xs;
    margin-bottom: $spacing-md;
    padding: $spacing-sm;
    background: rgba($color-bg-tertiary, 0.5);
    border-radius: $border-radius-md;
  }

  &__empty-species {
    color: $color-text-muted;
    font-size: $font-size-sm;
    font-style: italic;
    margin-bottom: $spacing-md;
  }

  &__mods {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-xs;
    padding-top: $spacing-sm;
    border-top: 1px solid $border-color-default;
  }

  &__mods-label {
    color: $color-text-muted;
    font-size: $font-size-xs;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.species-sprite {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($color-bg-secondary, 0.5);
  border-radius: $border-radius-sm;
  overflow: hidden;

  img {
    width: 36px;
    height: 36px;
    object-fit: contain;
    image-rendering: pixelated;
  }
}

.species-more {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba($color-bg-secondary, 0.3);
  border: 1px dashed $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text-muted;
  font-size: $font-size-xs;
  font-weight: 500;
}

.mod-tag {
  background: linear-gradient(135deg, rgba($color-accent-violet, 0.2) 0%, rgba($color-accent-scarlet, 0.1) 100%);
  border: 1px solid rgba($color-accent-violet, 0.3);
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  color: $color-text;
}
</style>
