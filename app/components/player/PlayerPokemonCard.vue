<template>
  <div
    class="pokemon-card"
    :class="{
      'pokemon-card--expanded': expanded,
      'pokemon-card--active': isActive,
      'pokemon-card--fainted': pokemon.currentHp <= 0
    }"
  >
    <!-- Collapsed Summary -->
    <button
      class="pokemon-card__summary"
      :aria-expanded="expanded"
      :aria-label="`${displayName}, Level ${pokemon.level}. ${expanded ? 'Collapse' : 'Expand'} details.`"
      @click="expanded = !expanded"
    >
      <img
        :src="spriteUrl"
        :alt="displayName"
        class="pokemon-card__sprite"
        loading="lazy"
      />
      <div class="pokemon-card__info">
        <div class="pokemon-card__name-row">
          <span class="pokemon-card__name">{{ displayName }}</span>
          <span v-if="isActive" class="pokemon-card__active-badge">Active</span>
        </div>
        <div class="pokemon-card__types">
          <span
            v-for="t in pokemon.types"
            :key="t"
            class="pokemon-card__type"
            :class="`type--${t.toLowerCase()}`"
          >
            {{ t }}
          </span>
          <span class="pokemon-card__level">Lv. {{ pokemon.level }}</span>
        </div>
        <div class="pokemon-card__hp">
          <div class="player-hp-bar-track">
            <div
              class="player-hp-bar-fill"
              :class="hpColorClass"
              :style="{ width: hpPercent + '%' }"
            ></div>
          </div>
          <span class="player-hp-bar-label">{{ pokemon.currentHp }} / {{ pokemon.maxHp }}</span>
        </div>
      </div>
      <PhCaretDown :size="16" class="pokemon-card__caret" :class="{ 'rotated': !expanded }" />
    </button>

    <!-- Expanded Details -->
    <div v-if="expanded" class="pokemon-card__details">
      <!-- Status conditions -->
      <div v-if="pokemon.statusConditions.length > 0" class="pokemon-card__statuses">
        <span
          v-for="status in pokemon.statusConditions"
          :key="status.name"
          class="player-status-badge"
        >
          {{ status.name }}
        </span>
      </div>

      <!-- Held Item -->
      <div v-if="pokemon.heldItem" class="pokemon-card__held-item">
        <span class="detail-label">Held Item</span>
        <span>{{ pokemon.heldItem }}</span>
      </div>

      <!-- Stats -->
      <div class="pokemon-card__stats">
        <div v-for="stat in statEntries" :key="stat.key" class="player-stat-cell">
          <span class="player-stat-cell__label">{{ stat.label }}</span>
          <span class="player-stat-cell__value">{{ stat.value }}</span>
          <span
            v-if="stat.stage !== 0"
            class="player-stat-cell__stage"
            :class="stat.stage > 0 ? 'player-stat-cell__stage--positive' : 'player-stat-cell__stage--negative'"
          >
            {{ stat.stage > 0 ? '+' : '' }}{{ stat.stage }}
          </span>
        </div>
      </div>

      <!-- Abilities -->
      <div v-if="pokemon.abilities.length > 0" class="pokemon-card__abilities">
        <span class="detail-label">Abilities</span>
        <div
          v-for="ability in pokemon.abilities"
          :key="ability.id"
          class="ability-row"
        >
          <span class="ability-row__name">{{ ability.name }}</span>
          <p class="ability-row__effect">{{ ability.effect }}</p>
        </div>
      </div>

      <!-- Moves -->
      <div class="pokemon-card__moves">
        <span class="detail-label">Moves</span>
        <PlayerMoveList :moves="pokemon.moves" />
      </div>

      <!-- Capabilities -->
      <div v-if="pokemon.capabilities" class="pokemon-card__capabilities">
        <span class="detail-label">Capabilities</span>
        <div class="cap-grid">
          <div class="cap-item" v-if="pokemon.capabilities.overland">
            <span class="cap-item__label">Overland</span>
            <span class="cap-item__value">{{ pokemon.capabilities.overland }}</span>
          </div>
          <div class="cap-item" v-if="pokemon.capabilities.swim">
            <span class="cap-item__label">Swim</span>
            <span class="cap-item__value">{{ pokemon.capabilities.swim }}</span>
          </div>
          <div class="cap-item" v-if="pokemon.capabilities.sky">
            <span class="cap-item__label">Sky</span>
            <span class="cap-item__value">{{ pokemon.capabilities.sky }}</span>
          </div>
          <div class="cap-item" v-if="pokemon.capabilities.burrow">
            <span class="cap-item__label">Burrow</span>
            <span class="cap-item__value">{{ pokemon.capabilities.burrow }}</span>
          </div>
          <div class="cap-item" v-if="pokemon.capabilities.levitate">
            <span class="cap-item__label">Levitate</span>
            <span class="cap-item__value">{{ pokemon.capabilities.levitate }}</span>
          </div>
          <div class="cap-item" v-if="pokemon.capabilities.jump">
            <span class="cap-item__label">Jump</span>
            <span class="cap-item__value">{{ pokemon.capabilities.jump.high }}/{{ pokemon.capabilities.jump.long }}</span>
          </div>
          <div class="cap-item">
            <span class="cap-item__label">Power</span>
            <span class="cap-item__value">{{ pokemon.capabilities.power }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhCaretDown } from '@phosphor-icons/vue'
import type { Pokemon } from '~/types'

const props = defineProps<{
  pokemon: Pokemon
  isActive: boolean
}>()

const { getSpriteUrl } = usePokemonSprite()

const expanded = ref(false)

const displayName = computed(() => props.pokemon.nickname || props.pokemon.species)
const spriteUrl = computed(() => getSpriteUrl(props.pokemon.species, props.pokemon.shiny))

const hpPercent = computed(() => {
  if (props.pokemon.maxHp <= 0) return 0
  return Math.max(0, Math.min(100, (props.pokemon.currentHp / props.pokemon.maxHp) * 100))
})

const hpColorClass = computed(() => {
  const pct = hpPercent.value
  if (pct > 50) return 'player-hp-bar-fill--healthy'
  if (pct > 25) return 'player-hp-bar-fill--warning'
  return 'player-hp-bar-fill--critical'
})

const statEntries = computed(() => {
  const stats = props.pokemon.currentStats
  const stages = props.pokemon.stageModifiers
  return [
    { key: 'hp', label: 'HP', value: stats.hp, stage: stages.hp ?? 0 },
    { key: 'attack', label: 'ATK', value: stats.attack, stage: stages.attack ?? 0 },
    { key: 'defense', label: 'DEF', value: stats.defense, stage: stages.defense ?? 0 },
    { key: 'specialAttack', label: 'SPA', value: stats.specialAttack, stage: stages.specialAttack ?? 0 },
    { key: 'specialDefense', label: 'SPD', value: stats.specialDefense, stage: stages.specialDefense ?? 0 },
    { key: 'speed', label: 'SPE', value: stats.speed, stage: stages.speed ?? 0 }
  ]
})
</script>

<style lang="scss" scoped>
.pokemon-card {
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  overflow: hidden;
  transition: border-color $transition-fast;

  &--active {
    border-color: rgba($color-accent-teal, 0.4);
  }

  &--fainted {
    opacity: 0.6;
  }

  &--expanded {
    border-color: rgba($color-accent-violet, 0.3);
  }

  &__summary {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    width: 100%;
    padding: $spacing-sm $spacing-md;
    background: transparent;
    border: none;
    color: $color-text;
    cursor: pointer;
    text-align: left;
    min-height: 64px;
  }

  &__sprite {
    width: 48px;
    height: 48px;
    min-width: 48px;
    image-rendering: pixelated;
    object-fit: contain;
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__active-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 4px;
    background: rgba($color-accent-teal, 0.2);
    border: 1px solid rgba($color-accent-teal, 0.4);
    border-radius: 3px;
    color: $color-accent-teal;
    white-space: nowrap;
  }

  &__types {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__type {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 4px;
    border-radius: 3px;
    color: white;
  }

  &__level {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-left: auto;
  }

  &__hp {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__caret {
    color: $color-text-muted;
    flex-shrink: 0;
    transition: transform $transition-fast;

    &.rotated {
      transform: rotate(-90deg);
    }
  }

  &__details {
    padding: $spacing-sm $spacing-md $spacing-md;
    border-top: 1px solid $border-color-subtle;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }

  &__statuses {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }

  &__held-item {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-sm;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;

    @media (max-width: 320px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__abilities {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__moves {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__capabilities {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
}

.detail-label {
  font-size: 10px;
  color: $color-text-muted;
  text-transform: uppercase;
  font-weight: 600;
}

.ability-row {
  padding: $spacing-xs;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;

  &__name {
    font-size: $font-size-sm;
    font-weight: 600;
  }

  &__effect {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    margin: 2px 0 0;
    line-height: 1.3;
  }
}

// HP bar size overrides for compact card layout
.pokemon-card__hp {
  :deep(.player-hp-bar-track) {
    flex: 1;
    height: 6px;
  }

  :deep(.player-hp-bar-label) {
    font-size: 10px;
  }
}

.cap-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;

  @media (max-width: 320px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.cap-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xs;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;

  &__label {
    font-size: 9px;
    color: $color-text-muted;
    text-transform: uppercase;
    font-weight: 600;
  }

  &__value {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text;
  }
}

</style>
