<template>
  <div
    class="combatant-card"
    :class="{
      'combatant-card--current': isCurrent,
      'combatant-card--fainted': isFainted && !isDead,
      'combatant-card--dead': isDead,
      'combatant-card--player': combatant.side === 'players',
      'combatant-card--ally': combatant.side === 'allies',
      'combatant-card--enemy': combatant.side === 'enemies'
    }"
  >
    <!-- Sprite/Avatar -->
    <div class="combatant-card__visual">
      <img v-if="isPokemon" :src="spriteUrl" :alt="displayName" class="combatant-card__sprite" />
      <div v-else class="combatant-card__avatar">
        <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" />
        <span v-else>{{ displayName.charAt(0) }}</span>
      </div>
    </div>

    <!-- Info -->
    <div class="combatant-card__info">
      <div class="combatant-card__header">
        <span class="combatant-card__name">{{ displayName }}</span>
        <span class="combatant-card__level">Lv.{{ entity.level }}</span>
      </div>

      <!-- Types (Pokemon only) -->
      <div v-if="isPokemon" class="combatant-card__types">
        <span
          v-for="type in pokemonTypes"
          :key="type"
          class="type-badge type-badge--sm"
          :class="`type-badge--${type.toLowerCase()}`"
        >
          {{ type }}
        </span>
      </div>

      <!-- Health Bar -->
      <div class="combatant-card__health">
        <HealthBar
          :current-hp="entity.currentHp"
          :max-hp="entity.maxHp"
          :temp-hp="tempHp"
          :show-exact-values="isGm"
        />
      </div>

      <!-- Injuries indicator -->
      <div v-if="injuries > 0" class="combatant-card__injuries">
        <span class="injury-badge" :class="{
          'injury-badge--severe': isHeavilyInjured,
          'injury-badge--lethal': injuries >= 10
        }">
          {{ injuries }} {{ injuries === 1 ? 'Injury' : 'Injuries' }}
        </span>
        <span v-if="isHeavilyInjured && !isDead" class="injury-warning">
          Heavily Injured (-{{ injuries }} HP/action)
        </span>
      </div>

      <!-- Death indicator (GM only) -->
      <div v-if="isDead && isGm" class="combatant-card__death">
        <span class="death-badge">DEAD</span>
        <button
          class="btn btn--xs btn--ghost"
          title="Revoke death (GM override)"
          @click="$emit('status', combatant.id, [], ['Dead'], false)"
        >
          Override
        </button>
      </div>

      <!-- League switch restriction indicator (P1 Section G) -->
      <div v-if="isGm && isUncommandable" class="combatant-card__uncommandable">
        Cannot Act (Switched In)
      </div>

      <!-- Status Conditions (Dead/Fainted filtered — they have dedicated UI) -->
      <div v-if="displayStatusConditions.length > 0" class="combatant-card__status">
        <span
          v-for="status in displayStatusConditions"
          :key="status"
          class="status-badge"
          :class="`status-badge--${status.toLowerCase().replace(' ', '-')}`"
        >
          {{ status }}
        </span>
      </div>

      <!-- P2: Flanking indicator (PTU p.232: -2 evasion penalty) -->
      <div v-if="isFlanked" class="combatant-card__flanking">
        <span class="flanking-badge">Flanked</span>
      </div>

      <!-- P2 (feature-018): Weather effect indicator -->
      <WeatherEffectIndicator
        v-if="encounterWeather"
        :combatant="combatant"
        :weather="encounterWeather"
        :all-combatants="allCombatants"
      />

      <!-- Combat Stages (GM only, show non-zero) -->
      <div v-if="isGm && hasStageChanges" class="combatant-card__stages">
        <span
          v-for="(value, stat) in nonZeroStages"
          :key="stat"
          class="stage-badge"
          :class="{ 'stage-badge--positive': value > 0, 'stage-badge--negative': value < 0 }"
        >
          {{ formatStatName(stat as string) }} {{ value > 0 ? '+' : '' }}{{ value }}
        </span>
      </div>

      <!-- Mount relationship indicator (feature-004 P1) -->
      <div v-if="mountIndicatorText" class="combatant-card__mount-indicator">
        <PhHorse :size="12" weight="bold" />
        {{ mountIndicatorText }}
      </div>

      <!-- Initiative (GM only) -->
      <div v-if="isGm" class="combatant-card__initiative">
        Init: {{ combatant.initiative }}
        <span v-if="combatant.initiativeRollOff" class="combatant-card__rolloff">
          ({{ combatant.initiativeRollOff }})
        </span>
      </div>

      <!-- Capture Panel (GM only, wild Pokemon) -->
      <CombatantCaptureSection
        v-if="isGm && isWildPokemon"
        :pokemon-id="entity.id"
        :pokemon-species="(entity as Pokemon).species"
        :pokemon-entity="entity as Pokemon"
        :encounter-id="encounterStore.encounter?.id"
        @captured="handleCaptured"
      />
    </div>

    <!-- GM Actions -->
    <CombatantGmActions
      v-if="isGm"
      :combatant="combatant"
      :display-name="displayName"
      :current-temp-hp="tempHp"
      :current-stages="stages"
      :status-conditions="statusConditions"
      :entity-types="pokemonTypes as string[]"
      @damage="(id, dmg) => $emit('damage', id, dmg)"
      @heal="(id, amt, tmp, inj) => $emit('heal', id, amt, tmp, inj)"
      @stages="(id, changes, abs) => $emit('stages', id, changes, abs)"
      @status="(id, add, rem, ovr) => $emit('status', id, add, rem, ovr)"
      @open-actions="(id) => $emit('openActions', id)"
      @remove="(id) => $emit('remove', id)"
      @switch-pokemon="(id) => $emit('switchPokemon', id)"
      @fainted-switch="(id) => $emit('faintedSwitch', id)"
      @force-switch="(id) => $emit('forceSwitch', id)"
    />
  </div>
</template>

<script setup lang="ts">
import { PhHorse } from '@phosphor-icons/vue'
import type { Combatant, Pokemon, HumanCharacter, StatusCondition, StageModifiers } from '~/types'

const props = defineProps<{
  combatant: Combatant
  isCurrent: boolean
  isGm: boolean
  /** P2: Whether this combatant is currently flanked (provided by parent when VTT is active) */
  isFlanked?: boolean
}>()

defineEmits<{
  action: [combatantId: string, action: { type: string; data: unknown }]
  damage: [combatantId: string, damage: number]
  heal: [combatantId: string, amount: number, tempHp?: number, healInjuries?: number]
  remove: [combatantId: string]
  stages: [combatantId: string, changes: Partial<StageModifiers>, absolute: boolean]
  status: [combatantId: string, add: StatusCondition[], remove: StatusCondition[], override: boolean]
  openActions: [combatantId: string]
  switchPokemon: [combatantId: string]
  faintedSwitch: [combatantId: string]
  forceSwitch: [combatantId: string]
}>()

const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()

// Computed properties
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

const tempHp = computed(() => entity.value.temporaryHp || 0)
const injuries = computed(() => entity.value.injuries || 0)
const isFainted = computed(() => entity.value.currentHp <= 0)
const isUncommandable = computed(() =>
  props.combatant.turnState?.canBeCommanded === false && entity.value.currentHp > 0
)
const isDead = computed(() => (entity.value.statusConditions || []).includes('Dead'))
const isHeavilyInjured = computed(() => injuries.value >= 5)
const statusConditions = computed(() => entity.value.statusConditions || [])
// Filter out Dead and Fainted from badge display — they have dedicated UI sections
const displayStatusConditions = computed(() =>
  statusConditions.value.filter(
    (s: StatusCondition) => s !== 'Dead' && s !== 'Fainted'
  )
)

const stages = computed<StageModifiers>(() => entity.value.stageModifiers || {
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
  accuracy: 0,
  evasion: 0
})

const nonZeroStages = computed(() => {
  const result: Record<string, number> = {}
  for (const [key, value] of Object.entries(stages.value)) {
    if (value !== 0) {
      result[key] = value as number
    }
  }
  return result
})

const hasStageChanges = computed(() => Object.keys(nonZeroStages.value).length > 0)

// Mount relationship indicator text (feature-004 P1)
const mountIndicatorText = computed(() => {
  const ms = props.combatant.mountState
  if (!ms) return ''
  const encounterStore = useEncounterStore()
  const partner = encounterStore.getMountPartner(props.combatant.id)
  if (!partner) return ''
  const partnerName = partner.type === 'pokemon'
    ? ((partner.entity as Pokemon).nickname || (partner.entity as Pokemon).species)
    : (partner.entity as HumanCharacter).name
  if (ms.isMounted) {
    return `Mounted on ${partnerName}`
  }
  return `Carrying ${partnerName}`
})

// Wild Pokemon check (enemy Pokemon without owner)
const isWildPokemon = computed(() => {
  if (!isPokemon.value) return false
  if (props.combatant.side !== 'enemies') return false
  const pokemon = entity.value as Pokemon
  return !pokemon.ownerId
})

const encounterStore = useEncounterStore()

// P2 (feature-018): Weather effect indicator data
const encounterWeather = computed(() => encounterStore.encounter?.weather ?? null)
const allCombatants = computed(() => encounterStore.encounter?.combatants ?? [])

// Handle successful capture — reload encounter to reflect Pokemon ownership change
function handleCaptured() {
  const encId = encounterStore.encounter?.id
  if (encId) {
    encounterStore.loadEncounter(encId)
  }
}

// Format stat name for display
// PTU: Evasion bonus is from moves/effects (additive), distinct from stat-derived evasion
const STAT_NAMES: Record<string, string> = {
  attack: 'Atk',
  defense: 'Def',
  specialAttack: 'SpA',
  specialDefense: 'SpD',
  speed: 'Spe',
  accuracy: 'Acc',
  evasion: 'Eva+'
}

const formatStatName = (stat: string): string => STAT_NAMES[stat] || stat

</script>

<style lang="scss" scoped>
.combatant-card {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  transition: all $transition-normal;

  // Current turn highlight - color based on side
  &--current.combatant-card--player {
    border-color: $color-side-player;
    background: linear-gradient(135deg, rgba($color-side-player, 0.15) 0%, rgba($color-side-player, 0.05) 100%);
    box-shadow: 0 0 20px rgba($color-side-player, 0.3);
  }

  &--current.combatant-card--ally {
    border-color: $color-side-ally;
    background: linear-gradient(135deg, rgba($color-side-ally, 0.15) 0%, rgba($color-side-ally, 0.05) 100%);
    box-shadow: 0 0 20px rgba($color-side-ally, 0.3);
  }

  &--current.combatant-card--enemy {
    border-color: $color-side-enemy;
    background: linear-gradient(135deg, rgba($color-side-enemy, 0.15) 0%, rgba($color-side-enemy, 0.05) 100%);
    box-shadow: 0 0 20px rgba($color-side-enemy, 0.3);
  }

  &--fainted {
    opacity: 0.5;
    filter: grayscale(30%);
  }

  &--dead {
    opacity: 0.35;
    filter: grayscale(60%);
    border-color: $color-danger;
    background: rgba($color-danger, 0.05);
  }

  &__visual {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
    border: 2px solid $border-color-default;
    border-radius: $border-radius-md;
  }

  &__sprite {
    max-width: 100%;
    max-height: 100%;
    image-rendering: pixelated;
  }

  &__avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: $border-radius-md;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span {
      font-size: $font-size-xl;
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

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-xs;
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-md;
    color: $color-text;
  }

  &__level {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__types {
    display: flex;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;

    .type-badge--sm {
      font-size: 0.65rem;
      padding: 1px 4px;
    }
  }

  &__health {
    margin-bottom: $spacing-xs;
    width: 100%;
  }

  &__injuries {
    margin-bottom: $spacing-xs;
  }

  &__status {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  &__stages {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-bottom: $spacing-xs;
  }

  &__initiative {
    font-size: $font-size-xs;
    color: $color-accent-scarlet;
    font-weight: 500;
  }

  &__rolloff {
    color: $color-accent-violet;
    font-weight: normal;
    margin-left: 2px;
  }

  &__uncommandable {
    display: inline-block;
    padding: 2px $spacing-sm;
    margin-bottom: $spacing-xs;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-warning;
    background: rgba($color-warning, 0.15);
    border: 1px solid rgba($color-warning, 0.3);
    border-radius: $border-radius-sm;
  }

  &__mount-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px $spacing-xs;
    margin-bottom: $spacing-xs;
    font-size: $font-size-xs;
    font-weight: 500;
    color: $color-accent-teal;
    background: rgba($color-accent-teal, 0.1);
    border: 1px solid rgba($color-accent-teal, 0.3);
    border-radius: $border-radius-sm;
  }

  &__flanking {
    margin-bottom: $spacing-xs;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    min-width: 100px;
  }
}

// Injury badge
.injury-badge {
  display: inline-block;
  padding: 2px $spacing-xs;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-danger;
  background: rgba($color-danger, 0.2);
  border: 1px solid rgba($color-danger, 0.4);
  border-radius: $border-radius-sm;

  &--severe {
    background: rgba($color-danger, 0.4);
    animation: pulse 1.5s infinite;
  }

  &--lethal {
    background: $color-danger;
    color: $color-text;
    animation: pulse 0.8s infinite;
  }
}

// Heavily injured warning text
.injury-warning {
  display: inline-block;
  margin-left: $spacing-xs;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-warning;
}

// Death badge
.death-badge {
  display: inline-block;
  padding: 2px $spacing-sm;
  font-size: $font-size-xs;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: $color-text;
  background: $color-danger;
  border-radius: $border-radius-sm;
}

.combatant-card__death {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin-bottom: $spacing-xs;
}

// Flanking badge (PTU p.232)
.flanking-badge {
  display: inline-block;
  padding: 2px $spacing-xs;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-warning;
  background: rgba($color-warning, 0.2);
  border: 1px solid rgba($color-warning, 0.4);
  border-radius: $border-radius-sm;
}

// Stage badge
.stage-badge {
  display: inline-block;
  padding: 1px $spacing-xs;
  font-size: 0.65rem;
  font-weight: 600;
  border-radius: $border-radius-sm;

  &--positive {
    color: $color-success;
    background: rgba($color-success, 0.2);
  }

  &--negative {
    color: $color-danger;
    background: rgba($color-danger, 0.2);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
