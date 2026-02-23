<template>
  <aside class="combatant-details" v-if="combatant">
    <h3 class="combatant-details__title">Current Turn</h3>

    <!-- Header with sprite/avatar and name -->
    <div class="combatant-details__header">
      <img
        v-if="combatant.type === 'pokemon'"
        :src="getSpriteUrl((combatant.entity as Pokemon).species)"
        :alt="combatantName"
        class="combatant-details__sprite"
        @error="handleSpriteError($event)"
      />
      <div v-else class="combatant-details__avatar">
        <img
          v-if="resolvedHumanAvatarUrl"
          :src="resolvedHumanAvatarUrl"
          :alt="combatantName"
          class="combatant-details__avatar-img"
          @error="handleSpriteError($event)"
        />
        <span v-else>{{ combatantName.charAt(0) }}</span>
      </div>
      <div class="combatant-details__name-block">
        <span class="combatant-details__name">{{ combatantName }}</span>
        <span class="combatant-details__type-badge" :class="'side--' + combatant.side">
          {{ combatant.side === 'players' ? 'Player' : combatant.side === 'allies' ? 'Ally' : 'Enemy' }}
        </span>
      </div>
    </div>

    <!-- Pokemon Types -->
    <div v-if="combatant.type === 'pokemon'" class="combatant-details__types">
      <span
        v-for="pType in (combatant.entity as Pokemon).types"
        :key="pType"
        class="type-badge"
        :class="'type-badge--' + pType.toLowerCase()"
      >
        {{ pType }}
      </span>
    </div>

    <!-- HP Bar -->
    <div class="combatant-details__hp">
      <div class="hp-label">
        <span>HP</span>
        <span v-if="isPlayerSide">
          {{ combatant.entity.currentHp }} / {{ effectiveMaxHp }}
          <span v-if="combatant.entity.injuries > 0" class="hp-base-max">
            ({{ combatant.entity.maxHp }})
          </span>
        </span>
        <span v-else>{{ hpPercentageDisplay }}%</span>
      </div>
      <div class="hp-bar">
        <div
          class="hp-bar__fill"
          :style="{ width: hpPercentage + '%' }"
          :class="hpClass"
        ></div>
      </div>
    </div>

    <!-- Injuries -->
    <div v-if="combatant.entity.injuries > 0" class="combatant-details__injuries">
      <span class="injuries-label">Injuries:</span>
      <span class="injuries-value">{{ combatant.entity.injuries }}</span>
      <div class="injuries-pips">
        <span
          v-for="i in combatant.entity.injuries"
          :key="i"
          class="injury-pip"
        ></span>
      </div>
    </div>

    <!-- Player-only details -->
    <template v-if="isPlayerSide">
      <!-- Stats -->
      <div class="combatant-details__stats">
        <div class="stat-row">
          <span class="stat-label">ATK</span>
          <span class="stat-value">{{ getStatValue('attack') }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">DEF</span>
          <span class="stat-value">{{ getStatValue('defense') }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">SP.ATK</span>
          <span class="stat-value">{{ getStatValue('specialAttack') }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">SP.DEF</span>
          <span class="stat-value">{{ getStatValue('specialDefense') }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">SPD</span>
          <span class="stat-value">{{ getStatValue('speed') }}</span>
        </div>
      </div>

      <!-- Abilities (Pokemon only) -->
      <div v-if="combatant.type === 'pokemon' && pokemonAbilities.length" class="combatant-details__section">
        <h4>Abilities</h4>
        <div class="ability-list">
          <span
            v-for="ability in pokemonAbilities"
            :key="ability.name"
            class="ability-tag"
          >
            {{ ability.name }}
          </span>
        </div>
      </div>

      <!-- Moves (Pokemon only) -->
      <div v-if="combatant.type === 'pokemon' && pokemonMoves.length" class="combatant-details__section">
        <h4>Moves</h4>
        <div class="move-list">
          <div
            v-for="move in pokemonMoves"
            :key="move.name"
            class="move-card"
            :class="'move-card--' + move.type.toLowerCase()"
          >
            <div class="move-card__header">
              <span class="move-card__name">{{ move.name }}</span>
              <span class="move-card__class" :class="'move-card__class--' + move.damageClass.toLowerCase()">
                {{ move.damageClass }}
              </span>
            </div>
            <div class="move-card__stats">
              <span v-if="move.damageBase" class="move-card__stat">
                <span class="move-card__stat-label">DB</span>
                <span class="move-card__stat-value">{{ move.damageBase }}</span>
              </span>
              <span v-if="move.ac" class="move-card__stat">
                <span class="move-card__stat-label">AC</span>
                <span class="move-card__stat-value">{{ move.ac }}</span>
              </span>
              <span class="move-card__stat">
                <span class="move-card__stat-label">Freq</span>
                <span class="move-card__stat-value move-card__stat-value--freq">{{ formatFrequency(move.frequency) }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Status Conditions (shown for all) -->
    <div v-if="combatant.entity.statusConditions?.length" class="combatant-details__section">
      <h4>Status</h4>
      <div class="status-list">
        <span
          v-for="status in combatant.entity.statusConditions"
          :key="status"
          class="status-tag"
          :class="'status-tag--' + status.toLowerCase()"
        >
          {{ status }}
        </span>
      </div>
    </div>

    <!-- Combat Stages (if any non-zero, player-side only) -->
    <div v-if="isPlayerSide && hasNonZeroStages" class="combatant-details__section">
      <h4>Combat Stages</h4>
      <div class="stages-grid">
        <template v-for="(value, key) in combatant.entity.stageModifiers" :key="key">
          <div v-if="value !== 0" class="stage-item" :class="value > 0 ? 'stage-item--positive' : 'stage-item--negative'">
            <span class="stage-label">{{ formatStageName(key as string) }}</span>
            <span class="stage-value">{{ value > 0 ? '+' : '' }}{{ value }}</span>
          </div>
        </template>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter } from '~/types'
import { getEffectiveMaxHp } from '~/utils/restHealing'

const props = defineProps<{
  combatant: Combatant | null
}>()

const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()

const handleSpriteError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/images/pokemon-placeholder.svg'
}

const resolvedHumanAvatarUrl = computed(() => {
  if (!props.combatant || props.combatant.type === 'pokemon') return null
  return getTrainerSpriteUrl((props.combatant.entity as HumanCharacter).avatarUrl)
})

// Computed
const combatantName = computed(() => {
  if (!props.combatant) return ''
  if (props.combatant.type === 'pokemon') {
    const pokemon = props.combatant.entity as Pokemon
    return pokemon.nickname || pokemon.species
  } else {
    const human = props.combatant.entity as HumanCharacter
    return human.name
  }
})

const isPlayerSide = computed(() => {
  return props.combatant?.side === 'players' || props.combatant?.side === 'allies'
})

const effectiveMaxHp = computed(() => {
  if (!props.combatant) return 0
  const { maxHp, injuries } = props.combatant.entity
  return getEffectiveMaxHp(maxHp, injuries || 0)
})

const hpPercentage = computed(() => {
  if (!props.combatant) return 100
  const { currentHp } = props.combatant.entity
  if (effectiveMaxHp.value <= 0) return 100
  return Math.max(0, Math.min(100, (currentHp / effectiveMaxHp.value) * 100))
})

const hpPercentageDisplay = computed(() => {
  if (!props.combatant) return 100
  const { currentHp } = props.combatant.entity
  if (effectiveMaxHp.value <= 0) return 100
  return Math.round((currentHp / effectiveMaxHp.value) * 100)
})

const hpClass = computed(() => {
  if (!props.combatant) return 'health--good'
  const { currentHp } = props.combatant.entity
  if (currentHp <= 0) return 'health--fainted'
  if (hpPercentage.value <= 25) return 'health--critical'
  if (hpPercentage.value <= 50) return 'health--low'
  return 'health--good'
})

const pokemonAbilities = computed(() => {
  if (props.combatant?.type !== 'pokemon') return []
  return (props.combatant.entity as Pokemon).abilities || []
})

const pokemonMoves = computed(() => {
  if (props.combatant?.type !== 'pokemon') return []
  return (props.combatant.entity as Pokemon).moves || []
})

const hasNonZeroStages = computed(() => {
  const stages = props.combatant?.entity.stageModifiers
  if (!stages) return false
  return Object.values(stages).some(v => v !== 0)
})

// Methods
const getStatValue = (stat: string): number => {
  if (!props.combatant) return 0
  if (props.combatant.type === 'pokemon') {
    const pokemon = props.combatant.entity as Pokemon
    return pokemon.currentStats?.[stat as keyof typeof pokemon.currentStats] ?? 0
  } else {
    const human = props.combatant.entity as HumanCharacter
    return human.stats?.[stat as keyof typeof human.stats] ?? 0
  }
}

// PTU: Evasion bonus is from moves/effects (additive), distinct from stat-derived evasion
const formatStageName = (key: string): string => {
  const names: Record<string, string> = {
    attack: 'ATK',
    defense: 'DEF',
    specialAttack: 'SP.ATK',
    specialDefense: 'SP.DEF',
    speed: 'SPD',
    accuracy: 'ACC',
    evasion: 'EVA+'
  }
  return names[key] || key.toUpperCase()
}

const formatFrequency = (freq: string): string => {
  const abbrevs: Record<string, string> = {
    'At-Will': 'At Will',
    'EOT': 'EOT',
    'Scene': 'Scene',
    'Scene x2': 'Scene ×2',
    'Scene x3': 'Scene ×3',
    'Daily': 'Daily',
    'Daily x2': 'Daily ×2',
    'Daily x3': 'Daily ×3',
    'Static': 'Static'
  }
  return abbrevs[freq] || freq
}
</script>

<style lang="scss" scoped>
.combatant-details {
  width: 320px;
  flex-shrink: 0;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;

  @media (min-width: 3000px) {
    width: 450px;
    padding: $spacing-lg;
    gap: $spacing-lg;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text;
    margin: 0;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $glass-border;

    @media (min-width: 3000px) {
      font-size: $font-size-lg;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__sprite {
    width: 64px;
    height: 64px;
    object-fit: contain;
    image-rendering: pixelated;
    background: rgba($color-bg-tertiary, 0.5);
    border-radius: $border-radius-md;
    padding: $spacing-xs;

    @media (min-width: 3000px) {
      width: 96px;
      height: 96px;
    }
  }

  &__avatar {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    border-radius: $border-radius-md;
    font-size: $font-size-xxl;
    font-weight: 700;
    color: $color-text;
    overflow: hidden;

    @media (min-width: 3000px) {
      width: 96px;
      height: 96px;
      font-size: $font-size-xxxl;
    }
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }

  &__name-block {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__name {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text;

    @media (min-width: 3000px) {
      font-size: $font-size-xl;
    }
  }

  &__type-badge {
    font-size: $font-size-xs;
    font-weight: 600;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    text-transform: uppercase;
    width: fit-content;

    &.side--players {
      background: rgba($color-side-player, 0.2);
      color: $color-side-player;
    }

    &.side--allies {
      background: rgba($color-side-ally, 0.2);
      color: $color-side-ally;
    }

    &.side--enemies {
      background: rgba($color-side-enemy, 0.2);
      color: $color-side-enemy;
    }
  }

  &__types {
    display: flex;
    gap: $spacing-xs;
  }

  &__hp {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__injuries {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm;
    background: rgba($color-danger, 0.1);
    border: 1px solid rgba($color-danger, 0.3);
    border-radius: $border-radius-md;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: $spacing-xs;
    background: rgba($color-bg-tertiary, 0.5);
    border-radius: $border-radius-md;
    padding: $spacing-sm;
  }

  &__section {
    h4 {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-text-muted;
      margin: 0 0 $spacing-sm 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}

.hp-label {
  display: flex;
  justify-content: space-between;
  font-size: $font-size-sm;
  color: $color-text-muted;
}

.hp-base-max {
  color: $color-text-muted;
  opacity: 0.6;
  text-decoration: line-through;
  font-size: $font-size-xs;
}

.hp-bar {
  width: 100%;
  height: 8px;
  background: rgba($color-bg-tertiary, 0.8);
  border-radius: 4px;
  overflow: hidden;

  @media (min-width: 3000px) {
    height: 12px;
    border-radius: 6px;
  }

  &__fill {
    height: 100%;
    border-radius: 4px;
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

.stat-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-size: $font-size-xs;
  color: $color-text-muted;
  font-weight: 500;
}

.stat-value {
  font-size: $font-size-md;
  font-weight: 700;
  color: $color-text;
}

.type-badge {
  @include pokemon-sheet-type-badge;
}

.ability-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.ability-tag {
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  background: rgba($color-accent-teal, 0.2);
  border: 1px solid rgba($color-accent-teal, 0.4);
  border-radius: $border-radius-sm;
  color: $color-accent-teal;
}

.move-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.move-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-sm;
  border-radius: $border-radius-md;
  border-left: 4px solid;

  &--normal { border-left-color: #A8A878; background: rgba(#A8A878, 0.1); }
  &--fire { border-left-color: #F08030; background: rgba(#F08030, 0.1); }
  &--water { border-left-color: #6890F0; background: rgba(#6890F0, 0.1); }
  &--electric { border-left-color: #F8D030; background: rgba(#F8D030, 0.1); }
  &--grass { border-left-color: #78C850; background: rgba(#78C850, 0.1); }
  &--ice { border-left-color: #98D8D8; background: rgba(#98D8D8, 0.1); }
  &--fighting { border-left-color: #C03028; background: rgba(#C03028, 0.1); }
  &--poison { border-left-color: #A040A0; background: rgba(#A040A0, 0.1); }
  &--ground { border-left-color: #E0C068; background: rgba(#E0C068, 0.1); }
  &--flying { border-left-color: #A890F0; background: rgba(#A890F0, 0.1); }
  &--psychic { border-left-color: #F85888; background: rgba(#F85888, 0.1); }
  &--bug { border-left-color: #A8B820; background: rgba(#A8B820, 0.1); }
  &--rock { border-left-color: #B8A038; background: rgba(#B8A038, 0.1); }
  &--ghost { border-left-color: #705898; background: rgba(#705898, 0.1); }
  &--dragon { border-left-color: #7038F8; background: rgba(#7038F8, 0.1); }
  &--dark { border-left-color: #705848; background: rgba(#705848, 0.1); }
  &--steel { border-left-color: #B8B8D0; background: rgba(#B8B8D0, 0.1); }
  &--fairy { border-left-color: #EE99AC; background: rgba(#EE99AC, 0.1); }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: 600;
    color: $color-text;

    @media (min-width: 3000px) {
      font-size: $font-size-md;
    }
  }

  &__class {
    font-size: $font-size-xs;
    font-weight: 700;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;
    text-transform: uppercase;

    &--physical {
      background: rgba(#C03028, 0.2);
      color: #C03028;
    }

    &--special {
      background: rgba(#6890F0, 0.2);
      color: #6890F0;
    }

    &--status {
      background: rgba($color-text-muted, 0.2);
      color: $color-text-muted;
    }
  }

  &__stats {
    display: flex;
    gap: $spacing-md;
  }

  &__stat {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__stat-label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-weight: 500;
  }

  &__stat-value {
    font-size: $font-size-sm;
    font-weight: 700;
    color: $color-text;

    &--freq {
      font-size: $font-size-xs;
      color: $color-accent-violet;
    }
  }
}

.status-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.status-tag {
  font-size: $font-size-xs;
  font-weight: 600;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;
  text-transform: uppercase;

  &--burned, &--burn { background: $type-fire; color: #fff; }
  &--frozen, &--freeze { background: $type-ice; color: #000; }
  &--paralyzed, &--paralysis { background: $type-electric; color: #000; }
  &--poisoned, &--poison { background: $type-poison; color: #fff; }
  &--badly-poisoned { background: darken($type-poison, 15%); color: #fff; }
  &--asleep, &--sleep { background: $type-ghost; color: #fff; }
  &--confused, &--confusion { background: $type-psychic; color: #fff; }
  &--flinched, &--flinch { background: $type-dark; color: #fff; }
  &--infatuated, &--infatuation { background: $type-fairy; color: #000; }
}

.stages-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;

  &--positive {
    background: rgba($color-success, 0.2);
    color: $color-success;
  }

  &--negative {
    background: rgba($color-danger, 0.2);
    color: $color-danger;
  }
}

.stage-label {
  font-weight: 500;
}

.stage-value {
  font-weight: 700;
}

.injuries-label {
  font-size: $font-size-sm;
  color: $color-danger;
  font-weight: 500;
}

.injuries-value {
  font-size: $font-size-md;
  color: $color-danger;
  font-weight: 700;
}

.injuries-pips {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.injury-pip {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: $color-danger;
  box-shadow: 0 0 4px rgba($color-danger, 0.5);

  @media (min-width: 3000px) {
    width: 16px;
    height: 16px;
  }
}
</style>
