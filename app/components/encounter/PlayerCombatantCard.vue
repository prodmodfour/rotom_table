<template>
  <div
    class="player-combatant"
    :class="{
      'player-combatant--current': isCurrentTurn,
      'player-combatant--fainted': isFainted
    }"
  >
    <!-- Sprite -->
    <div class="player-combatant__sprite">
      <img v-if="isPokemon" :src="spriteUrl" :alt="displayName" />
      <div v-else class="player-combatant__avatar">
        <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" />
        <span v-else>{{ displayName.charAt(0) }}</span>
      </div>
    </div>

    <!-- Info -->
    <div class="player-combatant__info">
      <h3 class="player-combatant__name">{{ displayName }}</h3>

      <!-- Types -->
      <div v-if="isPokemon" class="player-combatant__types">
        <span
          v-for="type in pokemonTypes"
          :key="type"
          class="type-badge"
          :class="`type-badge--${type.toLowerCase()}`"
        >
          {{ type }}
        </span>
      </div>

      <!-- Health Bar - B2W2 Style -->
      <div class="player-combatant__health">
        <div class="health-bar health-bar--large" :class="healthBarClass">
          <div class="health-bar__label">HP</div>
          <div class="health-bar__container">
            <div class="health-bar__track">
              <div class="health-bar__fill" :style="{ width: healthPercentage + '%' }"></div>
            </div>
            <span class="health-bar__text">
              {{ showDetails ? `${entity.currentHp}/${entity.maxHp}` : `${healthPercentage}%` }}
            </span>
          </div>
        </div>
      </div>

      <!-- Status Conditions -->
      <div v-if="statusConditions.length > 0" class="player-combatant__status">
        <span
          v-for="status in statusConditions"
          :key="status"
          class="status-badge"
          :class="`status-badge--${status.toLowerCase()}`"
        >
          {{ status }}
        </span>
      </div>
    </div>

    <!-- Turn Indicator -->
    <div v-if="isCurrentTurn" class="player-combatant__turn-indicator">
      <span class="turn-arrow">▶</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter } from '~/types'

const props = defineProps<{
  combatant: Combatant
  isCurrentTurn: boolean
  showDetails: boolean
}>()

defineEmits<{
  useMove: [move: any]
}>()

const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()
const { getHealthPercentage, getHealthStatus } = useCombat()

const entity = computed(() => props.combatant.entity)
const isPokemon = computed(() => props.combatant.type === 'pokemon')
const avatarUrl = computed(() => {
  if (isPokemon.value) return ''
  return getTrainerSpriteUrl((entity.value as HumanCharacter).avatarUrl) || ''
})
const pokemonTypes = computed(() => isPokemon.value ? (entity.value as Pokemon).types : [])

const displayName = computed(() => {
  if (isPokemon.value) {
    const pokemon = entity.value as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (entity.value as HumanCharacter).name
})

const spriteUrl = computed(() => {
  if (isPokemon.value) {
    const pokemon = entity.value as Pokemon
    return getSpriteUrl(pokemon.species, pokemon.shiny)
  }
  return ''
})

const healthPercentage = computed(() =>
  getHealthPercentage(entity.value.currentHp, entity.value.maxHp)
)

const healthBarClass = computed(() => {
  const status = getHealthStatus(healthPercentage.value)
  return `health-bar--${status}`
})

const isFainted = computed(() => entity.value.currentHp <= 0)

const statusConditions = computed(() => entity.value.statusConditions || [])
</script>

<style lang="scss" scoped>
.player-combatant {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-lg;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 2px solid $glass-border;
  border-radius: $border-radius-xl;
  transition: all $transition-normal;
  position: relative;

  &--current {
    border-color: $color-accent-scarlet;
    background: linear-gradient(135deg, rgba($color-accent-scarlet, 0.15) 0%, rgba($color-accent-violet, 0.1) 100%);
    transform: scale(1.02);
    box-shadow: $shadow-glow-scarlet, 0 0 40px rgba($color-accent-scarlet, 0.2);
  }

  &--fainted {
    opacity: 0.5;
    filter: grayscale(50%);
  }

  &__sprite {
    width: 120px;
    height: 120px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
    border: 2px solid $border-color-default;
    border-radius: $border-radius-lg;
    box-shadow: $shadow-md;

    img {
      max-width: 100%;
      max-height: 100%;
      image-rendering: pixelated;
    }

    /* 4K optimization */
    @media (min-width: 3000px) {
      width: 180px;
      height: 180px;
    }
  }

  &__avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: $border-radius-lg;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span {
      font-size: 3rem;
      font-weight: 700;
      background: $gradient-sv-cool;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: $font-size-xl;
    font-weight: 600;
    color: $color-text;
    margin: 0 0 $spacing-sm;

    /* 4K optimization */
    @media (min-width: 3000px) {
      font-size: $font-size-xxl;
    }
  }

  &__types {
    display: flex;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;

    .type-badge {
      font-size: $font-size-sm;
      padding: $spacing-xs $spacing-md;

      /* 4K optimization */
      @media (min-width: 3000px) {
        font-size: $font-size-md;
        padding: $spacing-sm $spacing-lg;
      }
    }
  }

  &__health {
    margin-bottom: $spacing-md;
    width: 100%;
  }

  &__status {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;

    .status-badge {
      font-size: $font-size-sm;

      /* 4K optimization */
      @media (min-width: 3000px) {
        font-size: $font-size-md;
        padding: $spacing-sm $spacing-md;
      }
    }
  }

  &__turn-indicator {
    position: absolute;
    left: -24px;
    top: 50%;
    transform: translateY(-50%);

    .turn-arrow {
      display: block;
      width: 20px;
      height: 20px;
      background: $gradient-scarlet;
      border-radius: 4px;
      clip-path: polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%);
      animation: pulse 1s ease-in-out infinite;
      box-shadow: $shadow-glow-scarlet;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: translateX(0);
  }
  50% {
    opacity: 0.7;
    transform: translateX(5px);
  }
}
</style>
