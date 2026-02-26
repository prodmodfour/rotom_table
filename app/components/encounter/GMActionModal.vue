<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="gm-action-modal">
      <!-- Header -->
      <div class="gm-action-modal__header">
        <div class="header-info">
          <img
            v-if="isPokemon"
            :src="spriteUrl"
            :alt="displayName"
            class="header-info__sprite"
          />
          <div v-else class="header-info__avatar">
            <img
              v-if="resolvedHumanAvatarUrl"
              :src="resolvedHumanAvatarUrl"
              :alt="displayName"
              class="header-info__avatar-img"
              @error="handleAvatarError"
            />
            <span v-else>{{ displayName.charAt(0) }}</span>
          </div>
          <div class="header-info__text">
            <h2>{{ displayName }}</h2>
            <div v-if="isPokemon" class="header-info__types">
              <span
                v-for="type in (combatant.entity as Pokemon).types"
                :key="type"
                class="type-badge"
                :class="`type-badge--${type.toLowerCase()}`"
              >
                {{ type }}
              </span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <span class="action-count">
            <span class="action-count__label">Standard:</span>
            <span :class="{ 'action-count--used': turnState.standardActionUsed }">
              {{ turnState.standardActionUsed ? 0 : 1 }}
            </span>
          </span>
          <span class="action-count">
            <span class="action-count__label">Shift:</span>
            <span :class="{ 'action-count--used': turnState.shiftActionUsed }">
              {{ turnState.shiftActionUsed ? 0 : 1 }}
            </span>
          </span>
        </div>
        <button class="modal__close" @click="$emit('close')">&times;</button>
      </div>

      <!-- Body -->
      <div class="gm-action-modal__body">
        <!-- Moves Section (Pokemon only) -->
        <div v-if="isPokemon && moves.length > 0" class="action-section">
          <h3>Moves</h3>
          <div class="move-list">
            <button
              v-for="move in moves"
              :key="move.id || move.name"
              class="move-btn"
              :class="[
                `move-btn--${move.type?.toLowerCase() || 'normal'}`,
                { 'move-btn--exhausted': isMoveExhausted(move) }
              ]"
              :disabled="turnState.standardActionUsed || isMoveExhausted(move)"
              :title="isMoveExhausted(move) ? getMoveDisabledReason(move) : ''"
              @click="selectMove(move)"
            >
              <div class="move-btn__main">
                <span class="move-btn__name">{{ move.name }}</span>
                <span class="move-btn__type">{{ move.type }}</span>
              </div>
              <div class="move-btn__details">
                <span v-if="move.damageBase" class="move-btn__damage">
                  DB {{ move.damageBase }}
                </span>
                <span class="move-btn__frequency">{{ move.frequency }}</span>
                <span v-if="move.ac !== null" class="move-btn__ac">AC {{ move.ac }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Standard Actions Section -->
        <div class="action-section">
          <h3>Standard Actions</h3>
          <div class="standard-actions">
            <button
              class="action-btn action-btn--shift"
              :disabled="turnState.shiftActionUsed"
              @click="executeStandardAction('shift')"
            >
              <span class="action-btn__icon">
                <img src="/icons/phosphor/arrows-out-cardinal.svg" alt="" class="action-icon" />
              </span>
              <span class="action-btn__text">
                <span class="action-btn__name">Shift</span>
                <span class="action-btn__desc">Move 1 meter</span>
              </span>
            </button>

            <button
              v-if="isPokemon"
              class="action-btn action-btn--struggle"
              :disabled="turnState.standardActionUsed"
              @click="selectStruggle"
            >
              <span class="action-btn__icon">
                <img src="/icons/phosphor/hand-fist.svg" alt="" class="action-icon" />
              </span>
              <span class="action-btn__text">
                <span class="action-btn__name">Struggle</span>
                <span class="action-btn__desc">DB 4 Typeless attack</span>
              </span>
            </button>

            <button
              class="action-btn action-btn--pass"
              @click="executeStandardAction('pass')"
            >
              <span class="action-btn__icon">
                <img src="/icons/phosphor/skip-forward.svg" alt="" class="action-icon" />
              </span>
              <span class="action-btn__text">
                <span class="action-btn__name">Pass Turn</span>
                <span class="action-btn__desc">End this combatant's turn</span>
              </span>
            </button>
          </div>
        </div>

        <!-- Combat Maneuvers Section -->
        <div class="action-section">
          <button class="section-toggle" @click="showManeuvers = !showManeuvers">
            <h3>Combat Maneuvers</h3>
            <span class="section-toggle__icon" :class="{ 'section-toggle__icon--open': showManeuvers }">
              ▼
            </span>
          </button>
          <ManeuverGrid
            v-if="showManeuvers"
            :standard-action-used="turnState.standardActionUsed"
            :shift-action-used="turnState.shiftActionUsed"
            @select="selectManeuver"
          />
        </div>

        <!-- Status Conditions Section -->
        <CombatantConditionsSection
          :current-conditions="currentConditions"
          @add-condition="addCondition"
          @remove-condition="removeCondition"
        />
      </div>

      <!-- Move Target Modal -->
      <MoveTargetModal
        v-if="selectedMove"
        :move="selectedMove"
        :actor="combatant"
        :targets="allCombatants"
        @confirm="handleMoveConfirm"
        @cancel="selectedMove = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Combatant, Move, Pokemon, HumanCharacter, StatusCondition } from '~/types'
import type { Maneuver } from '~/constants/combatManeuvers'
import { checkMoveFrequency } from '~/utils/moveFrequency'

const props = defineProps<{
  combatant: Combatant
  allCombatants: Combatant[]
}>()

const emit = defineEmits<{
  close: []
  executeMove: [combatantId: string, moveId: string, targetIds: string[], damage?: number, targetDamages?: Record<string, number>]
  executeAction: [combatantId: string, actionType: string]
  updateStatus: [combatantId: string, add: StatusCondition[], remove: StatusCondition[], override: boolean]
}>()

const { getSpriteUrl } = usePokemonSprite()
const { getTrainerSpriteUrl } = useTrainerSprite()
const encounterStore = useEncounterStore()

const selectedMove = ref<Move | null>(null)
const showManeuvers = ref(false)

const isPokemon = computed(() => props.combatant.type === 'pokemon')

const avatarBroken = ref(false)
const resolvedHumanAvatarUrl = computed(() => {
  if (isPokemon.value || avatarBroken.value) return null
  return getTrainerSpriteUrl((props.combatant.entity as HumanCharacter).avatarUrl)
})

const handleAvatarError = () => {
  avatarBroken.value = true
}

// Provide default turnState if not present
const turnState = computed(() => props.combatant.turnState ?? {
  hasActed: false,
  standardActionUsed: false,
  shiftActionUsed: false,
  swiftActionUsed: false,
  canBeCommanded: true,
  isHolding: false
})

const displayName = computed(() => {
  if (isPokemon.value) {
    const pokemon = props.combatant.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (props.combatant.entity as HumanCharacter).name
})

const spriteUrl = computed(() => {
  if (isPokemon.value) {
    const pokemon = props.combatant.entity as Pokemon
    return getSpriteUrl(pokemon.species, pokemon.shiny)
  }
  return ''
})

const moves = computed(() => {
  if (isPokemon.value) {
    return (props.combatant.entity as Pokemon).moves || []
  }
  return []
})

/** Check if a move is exhausted (frequency limit reached). */
const isMoveExhausted = (move: Move): boolean => {
  if (!move.frequency) return false
  const currentRound = encounterStore.currentRound || 1
  const result = checkMoveFrequency(move, currentRound)
  return !result.canUse
}

/** Get a tooltip reason for why a move is disabled. */
const getMoveDisabledReason = (move: Move): string => {
  if (!move.frequency) return ''
  const currentRound = encounterStore.currentRound || 1
  const result = checkMoveFrequency(move, currentRound)
  return result.reason || ''
}

// Get current status conditions from the entity
const currentConditions = computed((): StatusCondition[] => {
  return props.combatant.entity.statusConditions || []
})

const addCondition = (condition: StatusCondition) => {
  emit('updateStatus', props.combatant.id, [condition], [], false)
}

const removeCondition = (condition: StatusCondition) => {
  emit('updateStatus', props.combatant.id, [], [condition], false)
}

// Create a Struggle move for Pokemon
const struggleMove: Move = {
  id: 'struggle',
  name: 'Struggle',
  type: 'Normal',
  damageClass: 'Physical',
  frequency: 'At-Will',
  ac: 4,
  damageBase: 4,
  range: 'Melee',
  effect: 'Typeless. The user loses 1/4th of their max HP.'
}

const selectMove = (move: Move) => {
  selectedMove.value = move
}

const selectStruggle = () => {
  selectedMove.value = struggleMove
}

const handleMoveConfirm = (targetIds: string[], damage?: number, rollResult?: any, targetDamages?: Record<string, number>) => {
  if (selectedMove.value) {
    // Use move name as identifier since id might be undefined
    const moveIdentifier = selectedMove.value.id || selectedMove.value.name
    emit('executeMove', props.combatant.id, moveIdentifier, targetIds, damage, targetDamages)
    selectedMove.value = null
    emit('close')
  }
}

const executeStandardAction = (actionType: 'shift' | 'struggle' | 'pass') => {
  emit('executeAction', props.combatant.id, actionType)
  if (actionType === 'pass') {
    emit('close')
  }
}

// Select and execute a maneuver
const selectManeuver = (maneuver: Maneuver) => {
  // For now, just emit the action - the GM page will handle logging
  emit('executeAction', props.combatant.id, `maneuver:${maneuver.id}`)
  emit('close')
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  @include modal-overlay-enhanced;
}

.gm-action-modal {
  @include modal-container-enhanced;
  max-width: 600px;
  max-height: 85vh;

  &__header {
    gap: $spacing-md;
    background: linear-gradient(135deg, rgba($color-accent-violet, 0.1) 0%, transparent 100%);

    .header-info {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      flex: 1;

      &__sprite {
        width: 64px;
        height: 64px;
        image-rendering: pixelated;
        background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
        border: 2px solid $border-color-default;
        border-radius: $border-radius-md;
        padding: $spacing-xs;
      }

      &__avatar {
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, $color-bg-tertiary 0%, $color-bg-secondary 100%);
        border: 2px solid $border-color-default;
        border-radius: $border-radius-md;
        overflow: hidden;

        span {
          font-size: $font-size-xl;
          font-weight: 700;
          background: $gradient-sv-cool;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      &__avatar-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        image-rendering: pixelated;
      }

      &__text {
        h2 {
          margin: 0 0 $spacing-xs;
          font-size: $font-size-xl;
          color: $color-text;
        }
      }

      &__types {
        display: flex;
        gap: $spacing-xs;
      }
    }

    .header-actions {
      display: flex;
      flex-direction: column;
      gap: $spacing-xs;
    }
  }
}

.action-count {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;

  &__label {
    color: $color-text-muted;
  }

  span:last-child {
    font-weight: 600;
    color: $color-success;
  }

  &--used {
    color: $color-danger !important;
  }
}

.modal__close {
  background: none;
  border: none;
  color: $color-text-muted;
  font-size: 1.5rem;
  cursor: pointer;
  padding: $spacing-xs;
  line-height: 1;
  margin-left: $spacing-md;

  &:hover {
    color: $color-text;
  }
}

.action-section {
  margin-bottom: $spacing-xl;

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.move-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.move-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  border: none;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-fast;
  text-align: left;
  color: $color-text;
  box-shadow: $shadow-sm;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    transform: translateX(4px);
    box-shadow: $shadow-md;
  }

  &__main {
    display: flex;
    align-items: center;
    gap: $spacing-md;
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-md;
  }

  &__type {
    font-size: $font-size-xs;
    opacity: 0.8;
    text-transform: uppercase;
  }

  &__details {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    font-size: $font-size-xs;
  }

  &__damage {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
    font-weight: 600;
  }

  &__frequency {
    opacity: 0.7;
  }

  &__ac {
    opacity: 0.7;
  }

  &--exhausted {
    opacity: 0.4;
    text-decoration: line-through;
    cursor: not-allowed;
  }

  // Type colors
  &--normal { background-color: $type-normal; }
  &--fire { background-color: $type-fire; }
  &--water { background-color: $type-water; }
  &--electric { background-color: $type-electric; color: $color-text-dark; }
  &--grass { background-color: $type-grass; }
  &--ice { background-color: $type-ice; color: $color-text-dark; }
  &--fighting { background-color: $type-fighting; }
  &--poison { background-color: $type-poison; }
  &--ground { background-color: $type-ground; color: $color-text-dark; }
  &--flying { background-color: $type-flying; }
  &--psychic { background-color: $type-psychic; }
  &--bug { background-color: $type-bug; }
  &--rock { background-color: $type-rock; }
  &--ghost { background-color: $type-ghost; }
  &--dragon { background-color: $type-dragon; }
  &--dark { background-color: $type-dark; }
  &--steel { background-color: $type-steel; color: $color-text-dark; }
  &--fairy { background-color: $type-fairy; }
}

.standard-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;
  min-width: 160px;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: $color-bg-hover;
    border-color: $border-color-emphasis;
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: $color-bg-secondary;
    border-radius: $border-radius-sm;

    .action-icon {
      width: 20px;
      height: 20px;
      filter: brightness(0) invert(1);
    }
  }

  &__text {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-md;
  }

  &__desc {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &--shift {
    &:not(:disabled):hover {
      border-color: $color-accent-teal;
      .action-btn__icon {
        background: rgba($color-accent-teal, 0.2);
      }
    }
  }

  &--struggle {
    &:not(:disabled):hover {
      border-color: $color-danger;
      .action-btn__icon {
        background: rgba($color-danger, 0.2);
      }
    }
  }

  &--pass {
    &:not(:disabled):hover {
      border-color: $color-accent-violet;
      .action-btn__icon {
        background: rgba($color-accent-violet, 0.2);
      }
    }
  }
}

// type-badge styles now in global main.scss

// Section toggle for collapsible sections
.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  margin-bottom: $spacing-md;
  background: none;
  border: none;
  cursor: pointer;
  color: $color-text;

  h3 {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__icon {
    font-size: $font-size-xs;
    color: $color-text-muted;
    transition: transform $transition-fast;

    &--open {
      transform: rotate(180deg);
    }
  }

  &:hover h3 {
    color: $color-text;
  }
}

</style>
