<template>
  <NuxtLink :to="`/gm/characters/${human.id}`" class="human-card">
    <div class="human-card__avatar">
      <img
        v-if="resolvedAvatarUrl"
        :src="resolvedAvatarUrl"
        :alt="human.name"
        class="human-card__avatar-img"
        @error="handleAvatarError"
      />
      <div v-else class="human-card__avatar-placeholder">
        {{ human.name.charAt(0).toUpperCase() }}
      </div>
    </div>

    <div class="human-card__info">
      <div class="human-card__header">
        <h3 class="human-card__name">{{ human.name }}</h3>
        <span class="human-card__type" :class="`human-card__type--${human.characterType}`">
          {{ human.characterType === 'player' ? 'Player' : 'NPC' }}
        </span>
      </div>

      <div class="human-card__level">Level {{ human.level }}</div>
      <div v-if="human.location" class="human-card__location">
        <PhMapPin :size="12" />
        {{ human.location }}
      </div>

      <div class="human-card__stats">
        <span>HP: {{ human.currentHp }}/{{ human.maxHp }}</span>
        <span>SPD: {{ human.stats?.speed || 0 }}</span>
      </div>

      <!-- Pokemon Team -->
      <div v-if="human.pokemon && human.pokemon.length > 0" class="human-card__pokemon">
        <div
          v-for="mon in human.pokemon"
          :key="mon.id"
          class="pokemon-sprite"
          :title="mon.nickname || mon.species"
        >
          <img
            :src="getSpriteUrl(mon.species)"
            :alt="mon.species"
            @error="handleSpriteError($event)"
          />
        </div>
      </div>
    </div>

  </NuxtLink>
</template>

<script setup lang="ts">
import { PhMapPin } from '@phosphor-icons/vue'
import type { HumanCharacter } from '~/types'

defineProps<{
  human: HumanCharacter
}>()

const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()

const resolvedAvatarUrl = computed(() => getTrainerSpriteUrl(props.human.avatarUrl ?? null))

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const handleSpriteError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/images/pokemon-placeholder.svg'
}
</script>

<style lang="scss" scoped>
.human-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  cursor: pointer;
  transition: all $transition-normal;
  text-decoration: none;
  color: inherit;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba($color-accent, 0.3);
    box-shadow: $shadow-lg, $shadow-glow-scarlet;
  }

  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: $border-radius-lg;
    overflow: hidden;
    flex-shrink: 0;
    border: 2px solid $border-color-default;
    background: $color-bg-tertiary;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }
  }

  &__avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    font-size: $font-size-xl;
    font-weight: 700;
    color: $color-text;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-size: $font-size-md;
    font-weight: 600;
    margin: 0;
    color: $color-text;
  }

  &__type {
    font-size: $font-size-xs;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.05em;

    &--player {
      background: $gradient-scarlet;
      box-shadow: 0 0 8px rgba($color-accent-scarlet, 0.3);
    }

    &--npc {
      background: $gradient-violet;
      box-shadow: 0 0 8px rgba($color-accent-violet, 0.3);
    }
  }

  &__level {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  &__location {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-xs;
    color: $color-accent-violet;
    margin-bottom: $spacing-xs;
  }

  &__stats {
    display: flex;
    gap: $spacing-md;
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__pokemon {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-top: $spacing-sm;
    padding: $spacing-xs;
    background: rgba($color-bg-tertiary, 0.5);
    border-radius: $border-radius-sm;
  }
}

.pokemon-sprite {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    image-rendering: pixelated;
  }
}
</style>
