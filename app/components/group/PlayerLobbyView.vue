<template>
  <div class="group-view__lobby">
    <header class="lobby-header">
      <h1>PTU Session Helper</h1>
    </header>

    <div class="players-grid" v-if="players.length > 0">
      <div
        v-for="player in players"
        :key="player.id"
        class="player-card"
      >
        <div class="player-card__header">
          <div class="player-card__avatar">
            <!-- deliberate: lightweight function in v-for, no per-item computed available -->
            <img
              v-if="getTrainerSpriteUrl(player.avatarUrl) && !brokenAvatars.has(player.id)"
              :src="getTrainerSpriteUrl(player.avatarUrl)!"
              :alt="player.name"
              class="player-card__avatar-img"
              @error="handleAvatarError(player.id)"
            />
            <span v-else class="player-card__initials">{{ player.name.charAt(0) }}</span>
          </div>
          <div class="player-card__info">
            <h2 class="player-card__name">{{ player.name }}</h2>
            <span v-if="player.playedBy" class="player-card__played-by">{{ player.playedBy }}</span>
          </div>
          <span class="player-card__level">Lv {{ player.level }}</span>
        </div>

        <div class="player-card__team">
          <div
            v-for="pokemon in player.pokemon"
            :key="pokemon.id"
            class="team-pokemon"
            :class="{ 'team-pokemon--fainted': pokemon.currentHp <= 0 }"
          >
            <img
              :src="getSpriteUrl(pokemon.species)"
              :alt="pokemon.nickname || pokemon.species"
              class="team-pokemon__sprite"
              @error="handleSpriteError($event)"
            />
            <div class="team-pokemon__info">
              <span class="team-pokemon__name">{{ pokemon.nickname || pokemon.species }}</span>
              <span class="team-pokemon__level">Lv {{ pokemon.level }}</span>
            </div>
            <div class="team-pokemon__types">
              <span
                v-for="pType in pokemon.types"
                :key="pType"
                class="type-pip"
                :class="'type-pip--' + pType.toLowerCase()"
                :title="pType"
              ></span>
            </div>
            <div class="team-pokemon__hp-bar">
              <div
                class="team-pokemon__hp-fill"
                :style="{ width: Math.max(0, (pokemon.currentHp / pokemon.maxHp) * 100) + '%' }"
                :class="getHpClassFromPercent(Math.round((pokemon.currentHp / pokemon.maxHp) * 100))"
              ></div>
            </div>
          </div>
          <div v-if="!player.pokemon?.length" class="team-pokemon team-pokemon--empty">
            No Pokemon
          </div>
        </div>
      </div>
    </div>

    <div v-else class="no-players">
      <p>No player characters in library</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PlayerPokemon {
  id: string
  species: string
  nickname: string | null
  level: number
  types: string[]
  currentHp: number
  maxHp: number
  shiny: boolean
  spriteUrl: string | null
}

interface Player {
  id: string
  name: string
  playedBy: string | null
  level: number
  currentHp: number
  maxHp: number
  avatarUrl: string | null
  trainerClasses: { name: string }[]
  pokemon: PlayerPokemon[]
}

defineProps<{
  players: Player[]
}>()

const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()

const brokenAvatars = ref<Set<string>>(new Set())
const handleAvatarError = (playerId: string) => {
  brokenAvatars.value = new Set([...brokenAvatars.value, playerId])
}

const handleSpriteError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/images/pokemon-placeholder.svg'
}

const getHpClassFromPercent = (percentage: number): string => {
  if (percentage <= 0) return 'health--fainted'
  if (percentage <= 25) return 'health--critical'
  if (percentage <= 50) return 'health--low'
  return 'health--good'
}
</script>

<style lang="scss" scoped>
.group-view__lobby {
  min-height: 100vh;
  padding: $spacing-xl;
  display: flex;
  flex-direction: column;
  gap: $spacing-xl;

  @media (min-width: 3000px) {
    padding: $spacing-xxl;
    gap: $spacing-xxl;
  }
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: $spacing-lg;
  border-bottom: 1px solid $glass-border;

  h1 {
    font-size: $font-size-xxxl;
    margin: 0;
    background: $gradient-sv-primary;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 700;

    @media (min-width: 3000px) {
      font-size: 4rem;
    }
  }
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: $spacing-xl;

  @media (min-width: 3000px) {
    grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
    gap: $spacing-xxl;
  }
}

.player-card {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-lg;
    background: linear-gradient(135deg, rgba($color-side-player, 0.15) 0%, transparent 100%);
    border-bottom: 1px solid $glass-border;
  }

  &__avatar {
    width: 64px;
    height: 64px;
    border-radius: $border-radius-lg;
    overflow: hidden;
    background: $gradient-sv-cool;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }

    @media (min-width: 3000px) {
      width: 96px;
      height: 96px;
    }
  }

  &__initials {
    font-size: $font-size-xxl;
    font-weight: 700;
    color: $color-text;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: $font-size-xl;
    font-weight: 600;
    margin: 0 0 $spacing-xs 0;
    color: $color-text;

    @media (min-width: 3000px) {
      font-size: $font-size-xxl;
    }
  }

  &__played-by {
    font-size: $font-size-sm;
    color: $color-text-muted;
    display: block;
    margin-bottom: $spacing-xs;
  }

  &__level {
    font-size: $font-size-lg;
    font-weight: 700;
    color: $color-accent-violet;
    background: rgba($color-accent-violet, 0.15);
    padding: $spacing-xs $spacing-sm;
    border-radius: $border-radius-md;
  }

  &__team {
    padding: $spacing-md;
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
  }
}

.team-pokemon {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-bg-tertiary, 0.5);
  border-radius: $border-radius-md;
  transition: all $transition-fast;

  &--fainted {
    opacity: 0.5;
    filter: grayscale(0.5);
  }

  &--empty {
    justify-content: center;
    color: $color-text-muted;
    font-style: italic;
    padding: $spacing-lg;
  }

  &__sprite {
    width: 48px;
    height: 48px;
    object-fit: contain;
    image-rendering: pixelated;
    flex-shrink: 0;

    @media (min-width: 3000px) {
      width: 64px;
      height: 64px;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (min-width: 3000px) {
      font-size: $font-size-md;
    }
  }

  &__level {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__types {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  &__hp-bar {
    width: 60px;
    height: 6px;
    background: rgba($color-bg-tertiary, 0.8);
    border-radius: 3px;
    overflow: hidden;
    flex-shrink: 0;

    @media (min-width: 3000px) {
      width: 80px;
      height: 8px;
    }
  }

  &__hp-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease, background-color 0.3s ease;

    &.health--good {
      background: linear-gradient(90deg, $color-success 0%, lighten($color-success, 10%) 100%);
    }

    &.health--low {
      background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
    }

    &.health--critical {
      background: linear-gradient(90deg, $color-danger 0%, lighten($color-danger, 10%) 100%);
    }

    &.health--fainted {
      background: linear-gradient(90deg, #4a4a4a 0%, #2a2a2a 100%);
      width: 0% !important;
    }
  }
}

.type-pip {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;

  @media (min-width: 3000px) {
    width: 16px;
    height: 16px;
  }

  @include type-color-modifiers;
}

.no-players {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;

  p {
    font-size: $font-size-xl;
    color: $color-text-muted;
  }
}
</style>
