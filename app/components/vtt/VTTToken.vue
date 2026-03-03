<template>
  <div
    class="vtt-token"
    :class="{
      'vtt-token--selected': isSelected,
      'vtt-token--multi-selected': isMultiSelected,
      'vtt-token--current': isCurrentTurn,
      'vtt-token--player': side === 'players',
      'vtt-token--ally': side === 'allies',
      'vtt-token--enemy': side === 'enemies',
      'vtt-token--fainted': isFainted,
      'vtt-token--flanked': isFlanked,
      'vtt-token--own': isOwnToken,
      'vtt-token--pending-move': isPendingMove,
      'vtt-token--mounted-rider': isMountedRider,
      'vtt-token--mounted-mount': isMountedMount,
    }"
    :style="tokenStyle"
    :data-testid="`vtt-token-${token.combatantId}`"
    @click.stop="handleClick"
  >
    <!-- Pokemon Sprite or Character Avatar -->
    <div class="vtt-token__avatar">
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="displayName"
        class="vtt-token__sprite"
        @error="handleSpriteError($event)"
      />
      <span v-else class="vtt-token__initial">{{ initial }}</span>
    </div>

    <!-- HP Bar -->
    <div class="vtt-token__hp-bar">
      <div
        class="vtt-token__hp-fill"
        :style="{ width: `${hpPercent}%` }"
        :class="hpColorClass"
      />
    </div>

    <!-- Name Label (shown on hover or when selected) -->
    <div class="vtt-token__label">
      <span class="vtt-token__name">{{ displayName }}</span>
      <span class="vtt-token__level">Lv.{{ level }}</span>
    </div>


    <!-- Size Indicator for Large Tokens -->
    <div v-if="token.size > 1" class="vtt-token__size-badge">
      {{ token.size }}×{{ token.size }}
    </div>

    <!-- Elevation Badge -->
    <div v-if="elevation && elevation > 0" class="vtt-token__elevation-badge">
      Z{{ elevation }}
    </div>

    <!-- Mount Rider Badge (shown on mount tokens carrying a rider) -->
    <div v-if="isMountedMount" class="vtt-token__mount-badge" title="Carrying rider">
      <PhPersonSimpleRun :size="10" weight="bold" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, CombatSide, Pokemon, HumanCharacter } from '~/types'
import { PhPersonSimpleRun } from '@phosphor-icons/vue'

interface TokenData {
  combatantId: string
  position: { x: number; y: number }
  size: number
}

const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()

const props = defineProps<{
  token: TokenData
  cellSize: number
  combatant?: Combatant
  isCurrentTurn?: boolean
  isSelected?: boolean
  isMultiSelected?: boolean
  isGm?: boolean
  /** When true, token uses isometric screen coordinates for positioning */
  isometricMode?: boolean
  /** Screen X position from isometric projection (used when isometricMode is true) */
  isoScreenX?: number
  /** Screen Y position from isometric projection (used when isometricMode is true) */
  isoScreenY?: number
  /** Token elevation level (displayed as badge) */
  elevation?: number
  /** Flanking detection: this token is currently flanked by enemies */
  isFlanked?: boolean
  /** Player mode: highlights this token as belonging to the current player */
  isOwnToken?: boolean
  /** Player mode: shows pulsing pending state for a move request */
  isPendingMove?: boolean
  /** Optional HP percentage override (0-100). When provided, used instead of exact HP for bar fill. */
  displayHpOverride?: number
}>()

const emit = defineEmits<{
  select: [combatantId: string, event: MouseEvent]
}>()


// Computed
const tokenStyle = computed(() => {
  const size = props.cellSize * props.token.size

  if (props.isometricMode && props.isoScreenX !== undefined && props.isoScreenY !== undefined) {
    // Isometric mode: position using pre-computed screen coordinates
    // Token is centered on the isometric diamond position
    return {
      left: `${props.isoScreenX - size / 2}px`,
      top: `${props.isoScreenY - size}px`,
      width: `${size}px`,
      height: `${size}px`,
    }
  }

  // Default 2D grid positioning
  return {
    left: `${props.token.position.x * props.cellSize}px`,
    top: `${props.token.position.y * props.cellSize}px`,
    width: `${size}px`,
    height: `${size}px`,
  }
})

const entity = computed(() => props.combatant?.entity)

const isPokemon = computed(() => props.combatant?.type === 'pokemon')

const side = computed((): CombatSide => props.combatant?.side ?? 'enemies')

const displayName = computed(() => {
  if (!entity.value) return '???'
  if (isPokemon.value) {
    const pokemon = entity.value as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (entity.value as HumanCharacter).name
})

const level = computed(() => {
  if (!entity.value) return 0
  return entity.value.level
})

const avatarBroken = ref(false)
const avatarUrl = computed(() => {
  if (!entity.value) return null
  if (isPokemon.value) {
    const pokemon = entity.value as Pokemon
    return getSpriteUrl(pokemon.species, pokemon.shiny)
  }
  if (avatarBroken.value) return null
  return getTrainerSpriteUrl((entity.value as HumanCharacter).avatarUrl)
})

const initial = computed(() => {
  return displayName.value.charAt(0).toUpperCase()
})

const hpPercent = computed(() => {
  // When a display override is provided (e.g. player mode enemy HP masking),
  // use the pre-rounded percentage instead of exact HP
  if (props.displayHpOverride !== undefined) {
    return Math.max(0, Math.min(100, props.displayHpOverride))
  }
  if (!entity.value) return 100
  const current = entity.value.currentHp
  const max = entity.value.maxHp
  if (max === 0) return 0
  return Math.max(0, Math.min(100, (current / max) * 100))
})

const isFainted = computed(() => {
  if (!entity.value) return false
  return entity.value.currentHp <= 0
})

const hpColorClass = computed(() => {
  if (hpPercent.value > 50) return 'hp-high'
  if (hpPercent.value > 25) return 'hp-medium'
  return 'hp-low'
})

// Mount state indicators (feature-004 P1)
const isMountedRider = computed(() =>
  props.combatant?.mountState?.isMounted === true
)
const isMountedMount = computed(() =>
  props.combatant?.mountState?.isMounted === false &&
  !!props.combatant?.mountState?.partnerId
)

// Methods
const handleSpriteError = (event: Event) => {
  if (isPokemon.value) {
    const img = event.target as HTMLImageElement
    img.src = '/images/pokemon-placeholder.svg'
  } else {
    avatarBroken.value = true
  }
}

const handleClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('select', props.token.combatantId, event)
}
</script>

<style lang="scss" scoped>
.vtt-token {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-select: none;

  // States
  &--selected {
    transform: scale(1.1);
    z-index: 10;

    .vtt-token__label {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &--multi-selected {
    outline: 2px dashed $color-accent-teal;
    outline-offset: 2px;
    z-index: 9;
  }

  &--fainted {
    opacity: 0.5;
    filter: grayscale(0.8);
  }

  // Flanking indicator: pulsing dashed border (PTU p.232)
  &--flanked {
    &::after {
      content: '';
      position: absolute;
      inset: -2px;
      border: 2px dashed rgba(255, 100, 50, 0.7);
      border-radius: $border-radius-sm;
      pointer-events: none;
      animation: flanking-pulse 1.5s ease-in-out infinite;
    }
  }

  // Player mode: own token highlight (colored border ring)
  &--own {
    outline: 2px solid $color-side-player;
    outline-offset: 1px;
    border-radius: 50%;
  }

  // Player mode: pending move pulsing animation
  &--pending-move {
    animation: token-pulse 1.5s ease-in-out infinite;
  }

  // Mount state: rider token (rendered small on top of mount via VTTMountedToken)
  &--mounted-rider {
    opacity: 0.7;
  }

  // Mount state: mount carrying a rider (subtle glow outline)
  &--mounted-mount {
    outline: 2px solid rgba(100, 200, 255, 0.5);
    outline-offset: 1px;
    border-radius: $border-radius-sm;
  }

  // Current turn glow - color based on side
  &--current.vtt-token--player {
    filter: drop-shadow(0 0 8px $color-side-player) drop-shadow(0 0 16px $color-side-player);
  }

  &--current.vtt-token--ally {
    filter: drop-shadow(0 0 8px $color-side-ally) drop-shadow(0 0 16px $color-side-ally);
  }

  &--current.vtt-token--enemy {
    filter: drop-shadow(0 0 8px $color-side-enemy) drop-shadow(0 0 16px $color-side-enemy);
  }

  &:hover {
    transform: scale(1.05);
    z-index: 5;

    .vtt-token__label {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.vtt-token__avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.vtt-token__sprite {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.5));
}

.vtt-token__initial {
  font-size: 1.2em;
  font-weight: 700;
  color: $color-text;
}

.vtt-token__hp-bar {
  position: absolute;
  bottom: 2px;
  left: 10%;
  right: 10%;
  height: 4px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  overflow: hidden;
}

.vtt-token__hp-fill {
  height: 100%;
  transition: width 0.3s ease;

  &.hp-high {
    background: $color-success;
  }

  &.hp-medium {
    background: #f59e0b;
  }

  &.hp-low {
    background: $color-danger;
  }
}

.vtt-token__label {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-4px);
  background: rgba(0, 0, 0, 0.85);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  pointer-events: none;
  z-index: 20;
  display: flex;
  gap: 4px;
  align-items: center;
}

.vtt-token__name {
  font-size: 10px;
  font-weight: 600;
  color: $color-text;
}

.vtt-token__level {
  font-size: 9px;
  color: $color-text-muted;
}

.vtt-token__size-badge {
  position: absolute;
  top: 2px;
  left: 2px;
  background: rgba(0, 0, 0, 0.7);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 8px;
  color: $color-text-muted;
}

.vtt-token__elevation-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 8px;
  font-weight: 700;
  color: $color-accent-teal;
}

.vtt-token__mount-badge {
  position: absolute;
  top: 2px;
  right: 18px;
  background: rgba(100, 200, 255, 0.8);
  padding: 2px;
  border-radius: 3px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
}

@keyframes token-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.95);
  }
}

@keyframes flanking-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
