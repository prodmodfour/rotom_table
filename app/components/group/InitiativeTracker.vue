<template>
  <aside class="initiative-tracker" v-if="combatants.length > 0">
    <h3 class="initiative-tracker__title">
      {{ phaseTitle }}
    </h3>
    <div class="initiative-tracker__list">
      <div
        v-for="(combatant, index) in combatants"
        :key="combatant.id"
        class="initiative-entry"
        :class="{
          'initiative-entry--current': combatant.id === currentTurnId,
          'initiative-entry--player': combatant.side === 'players',
          'initiative-entry--ally': combatant.side === 'allies',
          'initiative-entry--enemy': combatant.side === 'enemies',
          'initiative-entry--uncommandable': !combatant.turnState?.canBeCommanded && combatant.entity.currentHp > 0
        }"
      >
        <span class="initiative-entry__order">{{ index + 1 }}</span>
        <img
          v-if="combatant.type === 'pokemon'"
          :src="getSpriteUrl((combatant.entity as Pokemon).species)"
          :alt="getCombatantName(combatant)"
          class="initiative-entry__sprite"
          @error="handleSpriteError($event)"
        />
        <!-- deliberate: lightweight function in v-for, no per-item computed available -->
        <div v-else class="initiative-entry__avatar">
          <img
            v-if="getTrainerSpriteUrl((combatant.entity as HumanCharacter).avatarUrl) && !brokenAvatars.has(combatant.id)"
            :src="getTrainerSpriteUrl((combatant.entity as HumanCharacter).avatarUrl)!"
            :alt="getCombatantName(combatant)"
            class="initiative-entry__avatar-img"
            @error="handleAvatarError(combatant.id)"
          />
          <span v-else>{{ getCombatantName(combatant).charAt(0) }}</span>
        </div>
        <div class="initiative-entry__info">
          <span class="initiative-entry__name">{{ getCombatantName(combatant) }}</span>
          <span
            v-if="flankingMap?.[combatant.id]?.isFlanked"
            class="initiative-entry__flanked"
          >Flanked</span>
          <span
            v-if="!combatant.turnState?.canBeCommanded && combatant.entity.currentHp > 0"
            class="initiative-entry__restricted"
          >Cannot Act</span>
          <div class="initiative-entry__health-bar">
            <div
              class="initiative-entry__health-fill"
              :style="{ width: getHpPercentage(combatant) + '%' }"
              :class="getHpClass(combatant)"
            ></div>
          </div>
        </div>
        <span class="initiative-entry__init">{{ combatant.initiative }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Combatant, Pokemon, HumanCharacter, FlankingMap } from '~/types'
import { getEffectiveMaxHp } from '~/utils/restHealing'

const PHASE_TITLES: Record<string, string> = {
  trainer_declaration: 'Declaration (Low \u2192 High)',
  trainer_resolution: 'Resolution (High \u2192 Low)',
  pokemon: 'Pokemon Phase'
}

const props = defineProps<{
  combatants: Combatant[]
  currentTurnId?: string
  currentPhase?: string
  /** P2: Flanking map from GM broadcast — combatantId -> FlankingStatus */
  flankingMap?: FlankingMap
}>()

const phaseTitle = computed(() => {
  if (!props.currentPhase || props.currentPhase === 'pokemon') {
    // For Full Contact or Pokemon phase, just show "Initiative"
    if (!props.currentPhase) return 'Initiative'
    return PHASE_TITLES[props.currentPhase] ?? 'Initiative'
  }
  return PHASE_TITLES[props.currentPhase] ?? 'Initiative'
})

const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()
const { getCombatantName } = useCombatantDisplay()

const handleSpriteError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = '/images/pokemon-placeholder.svg'
}

const brokenAvatars = ref<Set<string>>(new Set())
const handleAvatarError = (combatantId: string) => {
  brokenAvatars.value = new Set([...brokenAvatars.value, combatantId])
}

const getCombatantEffectiveMax = (combatant: Combatant): number => {
  const { maxHp, injuries } = combatant.entity
  return getEffectiveMaxHp(maxHp, injuries || 0)
}

const getHpPercentage = (combatant: Combatant): number => {
  const { currentHp } = combatant.entity
  const effectiveMax = getCombatantEffectiveMax(combatant)
  if (effectiveMax <= 0) return 100
  return Math.max(0, Math.min(100, (currentHp / effectiveMax) * 100))
}

const getHpClass = (combatant: Combatant): string => {
  const { currentHp } = combatant.entity
  if (currentHp <= 0) return 'health--fainted'
  const percentage = getHpPercentage(combatant)
  if (percentage <= 25) return 'health--critical'
  if (percentage <= 50) return 'health--low'
  return 'health--good'
}
</script>

<style lang="scss" scoped>
.initiative-tracker {
  width: 280px;
  flex-shrink: 0;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  max-height: calc(100vh - 150px);
  overflow-y: auto;

  @media (min-width: 3000px) {
    width: 400px;
    padding: $spacing-lg;
  }

  &__title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text;
    margin: 0 0 $spacing-md 0;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $glass-border;

    @media (min-width: 3000px) {
      font-size: $font-size-lg;
      margin-bottom: $spacing-lg;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }
}

.initiative-entry {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  border-radius: $border-radius-md;
  background: rgba($color-bg-secondary, 0.5);
  transition: all $transition-fast;

  @media (min-width: 3000px) {
    padding: $spacing-md;
    gap: $spacing-md;
  }

  &--player {
    border-left: 3px solid $color-side-player;
  }

  &--ally {
    border-left: 3px solid $color-side-ally;
  }

  &--enemy {
    border-left: 3px solid $color-side-enemy;
  }

  &--current.initiative-entry--player {
    background: rgba($color-side-player, 0.2);
    border: 1px solid $color-side-player;
    border-left: 3px solid $color-side-player;
    box-shadow: 0 0 12px rgba($color-side-player, 0.4);
  }

  &--current.initiative-entry--ally {
    background: rgba($color-side-ally, 0.2);
    border: 1px solid $color-side-ally;
    border-left: 3px solid $color-side-ally;
    box-shadow: 0 0 12px rgba($color-side-ally, 0.4);
  }

  &--current.initiative-entry--enemy {
    background: rgba($color-side-enemy, 0.2);
    border: 1px solid $color-side-enemy;
    border-left: 3px solid $color-side-enemy;
    box-shadow: 0 0 12px rgba($color-side-enemy, 0.4);
  }

  &__order {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-bg-tertiary;
    border-radius: 50%;
    font-size: $font-size-xs;
    font-weight: 700;
    color: $color-text-muted;

    @media (min-width: 3000px) {
      width: 32px;
      height: 32px;
      font-size: $font-size-sm;
    }
  }

  &__sprite {
    width: 32px;
    height: 32px;
    object-fit: contain;
    image-rendering: pixelated;

    @media (min-width: 3000px) {
      width: 48px;
      height: 48px;
    }
  }

  &__avatar {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $gradient-sv-cool;
    border-radius: $border-radius-sm;
    font-size: $font-size-sm;
    font-weight: 700;
    color: $color-text;
    overflow: hidden;

    @media (min-width: 3000px) {
      width: 48px;
      height: 48px;
      font-size: $font-size-md;
    }
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    image-rendering: pixelated;
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: 500;
    color: $color-text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (min-width: 3000px) {
      font-size: $font-size-md;
    }
  }

  &__flanked {
    font-size: 9px;
    font-weight: 600;
    color: $color-warning;
    background: rgba($color-warning, 0.15);
    border: 1px solid rgba($color-warning, 0.3);
    border-radius: 3px;
    padding: 0 3px;
    white-space: nowrap;

    @media (min-width: 3000px) {
      font-size: $font-size-xs;
      padding: 1px $spacing-xs;
    }
  }

  &__restricted {
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-warning;
    white-space: nowrap;

    @media (min-width: 3000px) {
      font-size: $font-size-sm;
    }
  }

  &--uncommandable {
    opacity: 0.45;
    filter: grayscale(40%);
  }

  &__health-bar {
    width: 100%;
    height: 4px;
    background: rgba($color-bg-tertiary, 0.8);
    border-radius: 2px;
    overflow: hidden;

    @media (min-width: 3000px) {
      height: 6px;
      border-radius: 3px;
    }
  }

  &__health-fill {
    height: 100%;
    border-radius: 2px;
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

    @media (min-width: 3000px) {
      border-radius: 3px;
    }
  }

  &__init {
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-text-muted;
    background: $color-bg-tertiary;
    padding: 2px $spacing-xs;
    border-radius: $border-radius-sm;

    @media (min-width: 3000px) {
      font-size: $font-size-sm;
      padding: $spacing-xs $spacing-sm;
    }
  }
}
</style>
