<template>
  <div class="player-identity-picker">
    <div class="picker-overlay">
      <div class="picker-content">
        <h1 class="picker-title">Rotom Table</h1>
        <p class="picker-subtitle">Select your character to continue</p>

        <div v-if="loading" class="picker-loading">
          <div class="picker-spinner"></div>
          <p>Loading characters...</p>
        </div>

        <div v-else-if="error" class="picker-error">
          <PhWarningCircle :size="48" />
          <p>{{ error }}</p>
          <button class="btn btn--primary" @click="loadPlayers">
            Retry
          </button>
        </div>

        <div v-else-if="players.length === 0" class="picker-empty">
          <PhUserCircle :size="48" />
          <p>No player characters found.</p>
          <p class="picker-empty__hint">Ask your GM to create a player character for you.</p>
        </div>

        <div v-else class="picker-grid">
          <button
            v-for="player in players"
            :key="player.id"
            class="picker-card"
            :class="{ 'picker-card--selecting': selectingId === player.id }"
            :aria-label="`Select ${player.name}, Level ${player.level}${player.trainerClasses.length > 0 ? ', ' + player.trainerClasses.join(' / ') : ''}`"
            :aria-busy="selectingId === player.id"
            @click="handleSelect(player)"
          >
            <div class="picker-card__avatar">
              <span class="picker-card__initial">{{ player.name.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="picker-card__info">
              <span class="picker-card__name">{{ player.name }}</span>
              <span v-if="player.trainerClasses.length > 0" class="picker-card__classes">
                {{ player.trainerClasses.join(' / ') }}
              </span>
              <span class="picker-card__level">Lv. {{ player.level }}</span>
            </div>
            <div v-if="player.pokemon.length > 0" class="picker-card__team">
              <img
                v-for="poke in player.pokemon.slice(0, 6)"
                :key="poke.id"
                :src="getSpriteUrl(poke.species)"
                :alt="poke.nickname || poke.species"
                class="picker-card__sprite"
                loading="lazy"
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhWarningCircle, PhUserCircle } from '@phosphor-icons/vue'

interface PlayerSummary {
  id: string
  name: string
  level: number
  trainerClasses: string[]
  pokemon: Array<{ id: string; species: string; nickname: string | null }>
}

const emit = defineEmits<{
  select: [characterId: string, characterName: string]
}>()

const { getSpriteUrl } = usePokemonSprite()

const players = ref<PlayerSummary[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const selectingId = ref<string | null>(null)

const loadPlayers = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await $fetch<{ success: boolean; data: PlayerSummary[] }>('/api/characters/players')
    players.value = response.data
  } catch (err: any) {
    error.value = err.message || 'Failed to load characters'
  } finally {
    loading.value = false
  }
}

const handleSelect = async (player: PlayerSummary) => {
  selectingId.value = player.id
  emit('select', player.id, player.name)
}

onMounted(() => {
  loadPlayers()
})
</script>

<style lang="scss" scoped>
.player-identity-picker {
  position: fixed;
  inset: 0;
  z-index: $z-index-overlay;
}

.picker-overlay {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $gradient-bg-radial;
  padding: $spacing-md;
}

.picker-content {
  width: 100%;
  max-width: 600px;
  text-align: center;
}

.picker-title {
  font-size: $font-size-xxl;
  background: $gradient-sv-primary;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  margin-bottom: $spacing-sm;

  @media (max-width: 480px) {
    font-size: $font-size-xl;
  }
}

.picker-subtitle {
  color: $color-text-muted;
  font-size: $font-size-md;
  margin-bottom: $spacing-xl;
}

.picker-loading,
.picker-error,
.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
  color: $color-text-muted;
  padding: $spacing-xl;
}

.picker-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $glass-border;
  border-top-color: $color-accent-scarlet;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.picker-error {
  color: $color-danger;
}

.picker-empty__hint {
  font-size: $font-size-sm;
  color: $color-text-muted;
}

.picker-grid {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.picker-card {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  width: 100%;
  padding: $spacing-md $spacing-lg;
  background: $glass-bg;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;
  color: $color-text;
  min-height: 72px;

  &:hover {
    background: $color-bg-hover;
    border-color: $color-accent-violet;
    box-shadow: $shadow-glow-violet;
  }

  &--selecting {
    border-color: $color-accent-scarlet;
    box-shadow: $shadow-glow-scarlet;
    opacity: 0.7;
    pointer-events: none;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: $border-radius-full;
    background: $gradient-sv-cool;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__initial {
    font-size: $font-size-lg;
    font-weight: 700;
    color: white;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-size: $font-size-md;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__classes {
    font-size: $font-size-xs;
    color: $color-text-muted;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__level {
    font-size: $font-size-xs;
    color: $color-accent-teal;
    font-weight: 600;
  }

  &__team {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  &__sprite {
    width: 32px;
    height: 32px;
    image-rendering: pixelated;
    object-fit: contain;

    @media (max-width: 480px) {
      width: 24px;
      height: 24px;
    }
  }
}
</style>
