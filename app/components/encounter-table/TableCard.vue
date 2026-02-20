<template>
  <NuxtLink :to="`/gm/encounter-tables/${table.id}`" class="table-card">
    <div class="table-card__header">
      <h3 class="table-card__name">{{ table.name }}</h3>
    </div>

    <p v-if="table.description" class="table-card__description">
      {{ table.description }}
    </p>

    <div class="table-card__meta">
      <span class="meta-item">
        <span class="meta-label">Levels:</span>
        <span class="meta-value">{{ table.levelRange.min }} - {{ table.levelRange.max }}</span>
      </span>
      <span class="meta-item">
        <span class="meta-label">Density:</span>
        <span class="density-badge" :class="`density--${table.density}`">
          {{ getDensityLabel(table.density) }}
        </span>
      </span>
      <span class="meta-item">
        <span class="meta-label">Entries:</span>
        <span class="meta-value">{{ table.entries.length }}</span>
      </span>
      <span v-if="table.modifications.length > 0" class="meta-item">
        <span class="meta-label">Sub-habitats:</span>
        <span class="meta-value">{{ table.modifications.length }}</span>
      </span>
    </div>

    <!-- Preview of top entries -->
    <div v-if="table.entries.length > 0" class="table-card__preview">
      <div class="preview-header">Top Pokemon</div>
      <div class="preview-entries">
        <div
          v-for="entry in topEntries"
          :key="entry.id"
          class="preview-entry"
        >
          <span class="entry-name">{{ entry.speciesName }}</span>
          <span class="entry-weight" :class="getRarityClass(entry.weight)">
            {{ getRarityLabel(entry.weight) }}
          </span>
        </div>
        <div v-if="table.entries.length > 5" class="preview-more">
          +{{ table.entries.length - 5 }} more
        </div>
      </div>
    </div>

    <!-- Modifications preview -->
    <div v-if="table.modifications.length > 0" class="table-card__mods">
      <div class="mods-label">Sub-habitats:</div>
      <div class="mods-list">
        <span
          v-for="mod in table.modifications"
          :key="mod.id"
          class="mod-tag"
        >
          {{ mod.name }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { EncounterTable, DensityTier } from '~/types'

const props = defineProps<{
  table: EncounterTable
}>()

// Get top 5 entries by weight
const topEntries = computed(() => {
  return [...props.table.entries]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
})

// Get density label for display (capitalized tier name)
const getDensityLabel = (density: DensityTier): string => {
  return density.charAt(0).toUpperCase() + density.slice(1)
}

// Get rarity label based on weight
const getRarityLabel = (weight: number): string => {
  if (weight >= 10) return 'Common'
  if (weight >= 5) return 'Uncommon'
  if (weight >= 3) return 'Rare'
  if (weight >= 1) return 'Very Rare'
  return 'Legendary'
}

// Get rarity class for styling
const getRarityClass = (weight: number): string => {
  if (weight >= 10) return 'rarity--common'
  if (weight >= 5) return 'rarity--uncommon'
  if (weight >= 3) return 'rarity--rare'
  if (weight >= 1) return 'rarity--very-rare'
  return 'rarity--legendary'
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
  padding: $spacing-md;
  transition: all $transition-normal;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba($color-accent, 0.3);
    box-shadow: $shadow-lg, $shadow-glow-scarlet;
  }

  &__header {
    margin-bottom: $spacing-sm;
  }

  &__name {
    margin: 0;
    font-size: $font-size-lg;
    color: $color-text;
    font-weight: 600;
  }

  &__description {
    margin: 0 0 $spacing-md;
    color: $color-text-muted;
    font-size: $font-size-sm;
    line-height: 1.4;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-md;
    border-bottom: 1px solid $glass-border;
  }

  &__preview {
    margin-bottom: $spacing-md;
  }

  &__mods {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-sm;
  }
}

.meta-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  font-size: $font-size-sm;
}

.meta-label {
  color: $color-text-muted;
}

.meta-value {
  color: $color-text;
  font-weight: 500;
}

.density-badge {
  padding: 2px 8px;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: 500;

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

.preview-header {
  font-size: $font-size-xs;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: $color-text-muted;
  margin-bottom: $spacing-sm;
}

.preview-entries {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.preview-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: $font-size-sm;
}

.entry-name {
  color: $color-text;
}

.entry-weight {
  padding: 2px 8px;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: 500;

  &.rarity--common {
    background: rgba(76, 175, 80, 0.2);
    color: #81c784;
  }

  &.rarity--uncommon {
    background: rgba(33, 150, 243, 0.2);
    color: #64b5f6;
  }

  &.rarity--rare {
    background: rgba(156, 39, 176, 0.2);
    color: #ba68c8;
  }

  &.rarity--very-rare {
    background: rgba(255, 152, 0, 0.2);
    color: #ffb74d;
  }

  &.rarity--legendary {
    background: rgba(244, 67, 54, 0.2);
    color: #ef5350;
  }
}

.preview-more {
  font-size: $font-size-xs;
  color: $color-text-muted;
  text-align: center;
  padding-top: $spacing-xs;
}

.mods-label {
  font-size: $font-size-xs;
  color: $color-text-muted;
}

.mods-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.mod-tag {
  padding: 2px 8px;
  background: rgba($color-primary, 0.2);
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  color: $color-primary;
}
</style>
