<template>
  <div
    class="player-combatant"
    :class="{
      'player-combatant--current': isCurrentTurn,
      'player-combatant--own': visibility.showExactHp && visibility.showStats,
      'player-combatant--fainted': currentHp <= 0
    }"
    :data-combatant-id="combatant.id"
    :data-is-current="isCurrentTurn || undefined"
  >
    <!-- Sprite (for Pokemon) -->
    <img
      v-if="combatant.type === 'pokemon'"
      :src="spriteUrl"
      :alt="name"
      class="player-combatant__sprite"
      loading="lazy"
    />
    <div v-else class="player-combatant__avatar">
      <span>{{ name.charAt(0).toUpperCase() }}</span>
    </div>

    <div class="player-combatant__info">
      <div class="player-combatant__name-row">
        <span class="player-combatant__name">{{ name }}</span>
        <span v-if="isCurrentTurn" class="player-combatant__turn-badge">Turn</span>
      </div>

      <!-- Types (always visible for Pokemon) -->
      <div v-if="combatant.type === 'pokemon' && types.length > 0" class="player-combatant__types">
        <span
          v-for="t in types"
          :key="t"
          class="player-combatant__type"
          :class="`type--${t.toLowerCase()}`"
        >
          {{ t }}
        </span>
      </div>

      <!-- HP Bar -->
      <div class="player-combatant__hp">
        <div class="player-hp-bar-track">
          <div
            class="player-hp-bar-fill"
            :class="hpColorClass"
            :style="{ width: hpPercent + '%' }"
          ></div>
        </div>
        <span class="player-hp-bar-label">
          <template v-if="visibility.showExactHp">
            {{ currentHp }} / {{ maxHp }}
          </template>
          <template v-else>
            {{ hpPercent }}%
          </template>
        </span>
      </div>

      <!-- Status conditions (always visible) -->
      <div v-if="statusConditions.length > 0" class="player-combatant__statuses">
        <span
          v-for="status in statusConditions"
          :key="status.name"
          class="player-status-badge"
        >
          {{ status.name }}
        </span>
      </div>

      <!-- P2: Flanking indicator (PTU p.232: -2 evasion penalty) -->
      <span v-if="isFlanked" class="player-combatant__flanked">Flanked</span>

      <!-- Injuries (visible for own/allies) -->
      <span v-if="visibility.showInjuries && injuries > 0" class="player-combatant__injuries">
        {{ injuries }} {{ injuries === 1 ? 'injury' : 'injuries' }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter, StatusCondition, PokemonType } from '~/types'

const props = defineProps<{
  combatant: Combatant
  isCurrentTurn: boolean
  myCharacterId: string
  myPokemonIds: string[]
  /** P2: Whether this combatant is currently flanked (from GM broadcast) */
  isFlanked?: boolean
}>()

const { getCombatantName } = useCombatantDisplay()
const { getSpriteUrl: getSprite } = usePokemonSprite()

const name = computed(() => getCombatantName(props.combatant))

const spriteUrl = computed(() => {
  if (props.combatant.type === 'pokemon') {
    const pokemon = props.combatant.entity as Pokemon
    return getSprite(pokemon.species, pokemon.shiny)
  }
  return ''
})

const types = computed((): PokemonType[] => {
  if (props.combatant.type === 'pokemon') {
    const pokemon = props.combatant.entity as Pokemon
    return pokemon.types
  }
  return []
})

const currentHp = computed(() => {
  if (props.combatant.type === 'pokemon') {
    return (props.combatant.entity as Pokemon).currentHp
  }
  return (props.combatant.entity as HumanCharacter).currentHp
})

const maxHp = computed(() => {
  if (props.combatant.type === 'pokemon') {
    return (props.combatant.entity as Pokemon).maxHp
  }
  return (props.combatant.entity as HumanCharacter).maxHp
})

const hpPercent = computed(() => {
  if (maxHp.value <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((currentHp.value / maxHp.value) * 100)))
})

const hpColorClass = computed(() => {
  if (hpPercent.value > 50) return 'player-hp-bar-fill--healthy'
  if (hpPercent.value > 25) return 'player-hp-bar-fill--warning'
  return 'player-hp-bar-fill--critical'
})

const statusConditions = computed((): StatusCondition[] => {
  if (props.combatant.type === 'pokemon') {
    return (props.combatant.entity as Pokemon).statusConditions ?? []
  }
  return (props.combatant.entity as HumanCharacter).statusConditions ?? []
})

const injuries = computed((): number => {
  if (props.combatant.type === 'pokemon') {
    return (props.combatant.entity as Pokemon).injuries ?? 0
  }
  return (props.combatant.entity as HumanCharacter).injuries ?? 0
})

// Visibility rules from design spec Section 5.1
const visibility = computed(() => {
  const isOwn =
    props.combatant.entityId === props.myCharacterId ||
    props.myPokemonIds.includes(props.combatant.entityId)
  const isAlly =
    props.combatant.side === 'players' || props.combatant.side === 'allies'

  if (isOwn) {
    return { showExactHp: true, showStats: true, showMoves: true, showAbilities: true, showInjuries: true }
  }
  if (isAlly) {
    return { showExactHp: true, showStats: false, showMoves: false, showAbilities: false, showInjuries: true }
  }
  // Enemy
  return { showExactHp: false, showStats: false, showMoves: false, showAbilities: false, showInjuries: false }
})
</script>

<style lang="scss" scoped>
.player-combatant {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $border-radius-md;
  transition: border-color $transition-fast;

  &--current {
    border-color: rgba($color-accent-scarlet, 0.5);
    box-shadow: 0 0 8px rgba($color-accent-scarlet, 0.15);
  }

  &--own {
    border-color: rgba($color-accent-teal, 0.3);
  }

  &--fainted {
    opacity: 0.5;
  }

  &__sprite {
    width: 40px;
    height: 40px;
    min-width: 40px;
    image-rendering: pixelated;
    object-fit: contain;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: $border-radius-full;
    background: $color-bg-tertiary;
    display: flex;
    align-items: center;
    justify-content: center;

    span {
      font-size: $font-size-sm;
      font-weight: 700;
      color: $color-text-muted;
    }
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

  &__turn-badge {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 4px;
    background: rgba($color-accent-scarlet, 0.2);
    border: 1px solid rgba($color-accent-scarlet, 0.4);
    border-radius: 3px;
    color: $color-accent-scarlet;
    white-space: nowrap;
    animation: pulse-badge 2s ease-in-out infinite;
  }

  &__types {
    display: flex;
    gap: 2px;
  }

  &__type {
    font-size: 8px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0 3px;
    border-radius: 2px;
    color: white;
  }

  &__hp {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__statuses {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }

  &__flanked {
    font-size: 9px;
    font-weight: 600;
    color: $color-warning;
    background: rgba($color-warning, 0.15);
    border: 1px solid rgba($color-warning, 0.3);
    border-radius: 3px;
    padding: 0 3px;
    width: fit-content;
  }

  &__injuries {
    font-size: 10px;
    color: $color-danger;
  }
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

// HP bar size overrides for compact combatant layout
.player-combatant__hp {
  :deep(.player-hp-bar-track) {
    flex: 1;
    height: 5px;
  }

  :deep(.player-hp-bar-label) {
    font-size: 10px;
    min-width: 40px;
    text-align: right;
  }
}

// Status badge size override for compact combatant layout
.player-combatant__statuses {
  :deep(.player-status-badge) {
    padding: 1px $spacing-xs;
    border-radius: 2px;
    font-size: 9px;
  }
}

// 4K scaling
@media (min-width: $breakpoint-4k) {
  .player-combatant {
    padding: $spacing-4k-sm;
    gap: $spacing-4k-sm;

    &__sprite {
      width: 60px;
      height: 60px;
      min-width: 60px;
    }

    &__avatar {
      width: 60px;
      height: 60px;
      min-width: 60px;

      span {
        font-size: $font-size-4k-sm;
      }
    }

    &__name {
      font-size: $font-size-4k-sm;
    }

    &__turn-badge {
      font-size: $font-size-4k-sm;
    }

    &__type {
      font-size: $font-size-4k-sm;
    }

    &__flanked {
      font-size: $font-size-4k-sm;
      padding: 1px $spacing-4k-sm;
    }

    &__injuries {
      font-size: $font-size-4k-sm;
    }
  }

  .player-combatant__hp {
    :deep(.player-hp-bar-label) {
      font-size: $font-size-4k-sm;
    }
  }

  .player-combatant__statuses {
    :deep(.player-status-badge) {
      font-size: $font-size-4k-sm;
    }
  }
}
</style>
