<template>
  <div class="combat-actions">
    <!-- Turn State Banner -->
    <div class="combat-actions__turn-banner">
      <span class="combat-actions__turn-label">Your Turn</span>
      <div class="combat-actions__action-pips">
        <span
          class="action-pip"
          :class="{ 'action-pip--used': turnState.standardActionUsed }"
          title="Standard Action"
        >STD</span>
        <span
          class="action-pip"
          :class="{ 'action-pip--used': turnState.shiftActionUsed }"
          title="Shift Action"
        >SHF</span>
        <span
          class="action-pip"
          :class="{ 'action-pip--used': turnState.swiftActionUsed }"
          title="Swift Action"
        >SWF</span>
      </div>
    </div>

    <!-- League Battle Phase Indicator -->
    <div v-if="isLeagueBattle" class="combat-actions__phase">
      <PhStar :size="14" weight="fill" />
      <span v-if="isTrainerPhase">Trainer Phase</span>
      <span v-else>Pokemon Phase</span>
    </div>

    <!-- Cannot Command Warning (league battles — newly switched-in Pokemon) -->
    <div v-if="!canBeCommanded" class="combat-actions__not-commandable">
      <PhWarning :size="16" weight="bold" />
      <span>Cannot command this Pokemon this turn</span>
    </div>

    <!-- Target Selector Overlay -->
    <div v-if="showTargetSelector" class="target-selector">
      <div class="target-selector__header">
        <span class="target-selector__title">
          {{ targetSelectorTitle }}
        </span>
        <button
          class="target-selector__cancel"
          aria-label="Cancel target selection"
          @click="cancelTargetSelection"
        >
          <PhX :size="18" />
        </button>
      </div>
      <div class="target-selector__list">
        <button
          v-for="target in validTargets"
          :key="target.id"
          class="target-selector__target"
          :class="{ 'target-selector__target--selected': selectedTargetIds.includes(target.id) }"
          @click="toggleTarget(target.id)"
        >
          <span class="target-selector__target-name">{{ getCombatantName(target) }}</span>
          <span class="target-selector__target-side" :class="`target-selector__target-side--${target.side}`">
            {{ target.side }}
          </span>
        </button>
      </div>
      <button
        class="combat-actions__btn combat-actions__btn--confirm"
        :disabled="selectedTargetIds.length === 0"
        @click="confirmTargetSelection"
      >
        <PhCheck :size="18" />
        Confirm ({{ selectedTargetIds.length }} {{ selectedTargetIds.length === 1 ? 'target' : 'targets' }})
      </button>
    </div>

    <!-- Main Action Panels (hidden during target selection) -->
    <template v-if="!showTargetSelector">
      <!-- Moves Section (Pokemon combatants) -->
      <section v-if="isActivePokemon && activeMoves.length > 0" class="combat-actions__section">
        <h3 class="combat-actions__section-title">Moves</h3>
        <div class="combat-actions__moves">
          <button
            v-for="move in activeMoves"
            :key="move.id"
            class="move-btn"
            :class="{
              'move-btn--exhausted': isMoveExhausted(move).exhausted,
              'move-btn--status': move.damageClass === 'Status'
            }"
            :disabled="isMoveExhausted(move).exhausted || !canUseStandardAction || !canBeCommanded"
            :title="isMoveExhausted(move).reason || move.effect"
            @click="handleMoveSelect(move)"
          >
            <div class="move-btn__header">
              <span class="move-btn__type" :class="`type--${move.type.toLowerCase()}`">
                {{ move.type }}
              </span>
              <span class="move-btn__name">{{ move.name }}</span>
            </div>
            <div class="move-btn__stats">
              <span v-if="move.damageBase" class="move-btn__stat">DB {{ move.damageBase }}</span>
              <span v-if="move.ac !== null" class="move-btn__stat">AC {{ move.ac }}</span>
              <span class="move-btn__stat move-btn__stat--freq">{{ move.frequency }}</span>
            </div>
            <span v-if="isMoveExhausted(move).exhausted" class="move-btn__exhausted-label">
              {{ isMoveExhausted(move).reason }}
            </span>
          </button>
        </div>
      </section>

      <!-- Core Actions -->
      <section class="combat-actions__section">
        <h3 class="combat-actions__section-title">Actions</h3>
        <div class="combat-actions__grid">
          <!-- Shift -->
          <button
            class="combat-actions__btn combat-actions__btn--shift"
            :disabled="!canUseShiftAction"
            @click="handleShift"
          >
            <PhArrowsOutSimple :size="20" />
            <span>Shift</span>
          </button>

          <!-- Struggle -->
          <button
            class="combat-actions__btn combat-actions__btn--struggle"
            :disabled="!canUseStandardAction || !canBeCommanded"
            @click="handleStruggleSelect"
          >
            <PhHandFist :size="20" />
            <span>Struggle</span>
          </button>

          <!-- Pass Turn -->
          <button
            class="combat-actions__btn combat-actions__btn--pass"
            @click="handlePassTurn"
          >
            <PhSkipForward :size="20" />
            <span>Pass Turn</span>
          </button>
        </div>
      </section>

      <!-- Request Actions (GM Approval) -->
      <section class="combat-actions__section">
        <h3 class="combat-actions__section-title">
          Requests
          <span class="combat-actions__section-hint">(GM approval)</span>
        </h3>
        <div class="combat-actions__grid">
          <!-- Use Item -->
          <button
            class="combat-actions__btn combat-actions__btn--item"
            :disabled="trainerInventory.length === 0"
            @click="showItemPanel = !showItemPanel"
          >
            <PhFirstAidKit :size="20" />
            <span>Use Item</span>
          </button>

          <!-- Switch Pokemon -->
          <button
            class="combat-actions__btn combat-actions__btn--switch"
            :disabled="switchablePokemon.length === 0"
            @click="showSwitchPanel = !showSwitchPanel"
          >
            <PhArrowsClockwise :size="20" />
            <span>Switch</span>
          </button>

          <!-- Maneuvers -->
          <button
            class="combat-actions__btn combat-actions__btn--maneuver"
            @click="showManeuverPanel = !showManeuverPanel"
          >
            <PhStrategy :size="20" />
            <span>Maneuver</span>
          </button>
        </div>
      </section>

      <!-- Item Panel (expandable) -->
      <section v-if="showItemPanel" class="combat-actions__panel">
        <h4 class="combat-actions__panel-title">Inventory</h4>
        <div v-if="trainerInventory.length === 0" class="combat-actions__panel-empty">
          No items available.
        </div>
        <button
          v-for="item in trainerInventory"
          :key="item.id"
          class="combat-actions__panel-row"
          @click="handleRequestItem(item.id, item.name)"
        >
          <span class="combat-actions__panel-name">{{ item.name }}</span>
          <span class="combat-actions__panel-qty">x{{ item.quantity }}</span>
        </button>
      </section>

      <!-- Switch Pokemon Panel (expandable) -->
      <section v-if="showSwitchPanel" class="combat-actions__panel">
        <h4 class="combat-actions__panel-title">Switch Pokemon</h4>
        <div v-if="switchablePokemon.length === 0" class="combat-actions__panel-empty">
          No available Pokemon to switch to.
        </div>
        <button
          v-for="pokemon in switchablePokemon"
          :key="pokemon.id"
          class="combat-actions__panel-row combat-actions__panel-row--pokemon"
          @click="handleRequestSwitch(pokemon.id)"
        >
          <img
            :src="getSpriteUrl(pokemon.species, pokemon.shiny)"
            :alt="pokemon.nickname || pokemon.species"
            class="combat-actions__panel-sprite"
            loading="lazy"
          />
          <div class="combat-actions__panel-pokemon-info">
            <span class="combat-actions__panel-name">
              {{ pokemon.nickname || pokemon.species }}
            </span>
            <span class="combat-actions__panel-hp">
              {{ pokemon.currentHp }} / {{ pokemon.maxHp }} HP
            </span>
          </div>
        </button>
      </section>

      <!-- Maneuver Panel (expandable) -->
      <section v-if="showManeuverPanel" class="combat-actions__panel">
        <h4 class="combat-actions__panel-title">Combat Maneuvers</h4>
        <button
          v-for="maneuver in combatManeuvers"
          :key="maneuver.id"
          class="combat-actions__panel-row"
          @click="handleRequestManeuver(maneuver.id, maneuver.name)"
        >
          <div class="combat-actions__panel-maneuver">
            <span class="combat-actions__panel-name">{{ maneuver.name }}</span>
            <span class="combat-actions__panel-action-label">{{ maneuver.actionLabel }}</span>
          </div>
          <span class="combat-actions__panel-desc">{{ maneuver.shortDesc }}</span>
        </button>
      </section>
    </template>

    <!-- Pass Turn Confirmation -->
    <div v-if="showPassConfirm" class="combat-actions__confirm-overlay">
      <div class="combat-actions__confirm-dialog">
        <p>End your turn?</p>
        <div class="combat-actions__confirm-buttons">
          <button class="combat-actions__btn combat-actions__btn--cancel" @click="showPassConfirm = false">
            Cancel
          </button>
          <button class="combat-actions__btn combat-actions__btn--confirm" @click="confirmPassTurn">
            Pass Turn
          </button>
        </div>
      </div>
    </div>

    <!-- Request Sent Toast -->
    <Transition name="toast">
      <div v-if="toastMessage" class="combat-actions__toast">
        <PhCheckCircle :size="16" />
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  PhStar,
  PhX,
  PhCheck,
  PhCheckCircle,
  PhWarning,
  PhWarningCircle,
  PhArrowsOutSimple,
  PhHandFist,
  PhSkipForward,
  PhFirstAidKit,
  PhArrowsClockwise,
  PhStrategy
} from '@phosphor-icons/vue'
import type { Move } from '~/types'
import { COMBAT_MANEUVERS } from '~/constants/combatManeuvers'

const {
  isMyTurn,
  myActiveCombatant,
  isActivePokemon,
  isLeagueBattle,
  isTrainerPhase,
  turnState,
  canUseStandardAction,
  canUseShiftAction,
  canBeCommanded,
  activeMoves,
  isMoveExhausted,
  hasUsableMoves,
  executeMove,
  useShiftAction,
  useStruggle,
  passTurn,
  requestUseItem,
  requestSwitchPokemon,
  requestManeuver,
  validTargets,
  switchablePokemon,
  trainerInventory
} = usePlayerCombat()

const { getCombatantName } = useCombatantDisplay()
const { getSpriteUrl } = usePokemonSprite()

// Panel visibility
const showItemPanel = ref(false)
const showSwitchPanel = ref(false)
const showManeuverPanel = ref(false)
const showPassConfirm = ref(false)

// Target selection state
const showTargetSelector = ref(false)
const selectedTargetIds = ref<string[]>([])
const targetSelectorTitle = ref('')
const pendingMoveId = ref<string | null>(null)
const pendingAction = ref<'move' | 'struggle' | null>(null)

// Toast message for request confirmation
const toastMessage = ref<string | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const combatManeuvers = COMBAT_MANEUVERS

// =============================================
// Action Handlers
// =============================================

const handleMoveSelect = (move: Move) => {
  if (isMoveExhausted(move).exhausted || !canUseStandardAction.value || !canBeCommanded.value) return

  pendingMoveId.value = move.id
  pendingAction.value = 'move'
  targetSelectorTitle.value = `Target for ${move.name}`
  selectedTargetIds.value = []
  showTargetSelector.value = true
}

const handleStruggleSelect = () => {
  if (!canUseStandardAction.value || !canBeCommanded.value) return

  pendingMoveId.value = null
  pendingAction.value = 'struggle'
  targetSelectorTitle.value = 'Target for Struggle'
  selectedTargetIds.value = []
  showTargetSelector.value = true
}

const toggleTarget = (targetId: string) => {
  const index = selectedTargetIds.value.indexOf(targetId)
  if (index === -1) {
    selectedTargetIds.value = [...selectedTargetIds.value, targetId]
  } else {
    selectedTargetIds.value = selectedTargetIds.value.filter(id => id !== targetId)
  }
}

const confirmTargetSelection = async () => {
  if (selectedTargetIds.value.length === 0) return

  try {
    if (pendingAction.value === 'move' && pendingMoveId.value) {
      await executeMove(pendingMoveId.value, selectedTargetIds.value)
    } else if (pendingAction.value === 'struggle') {
      await useStruggle(selectedTargetIds.value)
    }
  } catch (err: any) {
    alert('Action failed: ' + (err.message || 'Unknown error'))
  }

  resetTargetSelector()
}

const cancelTargetSelection = () => {
  resetTargetSelector()
}

const resetTargetSelector = () => {
  showTargetSelector.value = false
  selectedTargetIds.value = []
  pendingMoveId.value = null
  pendingAction.value = null
  targetSelectorTitle.value = ''
}

const handleShift = async () => {
  if (!canUseShiftAction.value) return
  try {
    await useShiftAction()
  } catch (err: any) {
    alert('Shift failed: ' + (err.message || 'Unknown error'))
  }
}

const handlePassTurn = () => {
  showPassConfirm.value = true
}

const confirmPassTurn = async () => {
  showPassConfirm.value = false
  try {
    await passTurn()
  } catch (err: any) {
    alert('Pass turn failed: ' + (err.message || 'Unknown error'))
  }
}

// =============================================
// Request Handlers (GM Approval)
// =============================================

const showToast = (message: string) => {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = null
  }, 2500)
}

const handleRequestItem = (itemId: string, itemName: string) => {
  requestUseItem(itemId, itemName)
  showItemPanel.value = false
  showToast(`Requested: Use ${itemName}`)
}

const handleRequestSwitch = (pokemonId: string) => {
  requestSwitchPokemon(pokemonId)
  showSwitchPanel.value = false
  showToast('Requested: Switch Pokemon')
}

const handleRequestManeuver = (maneuverId: string, maneuverName: string) => {
  requestManeuver(maneuverId, maneuverName)
  showManeuverPanel.value = false
  showToast(`Requested: ${maneuverName}`)
}

// Close panels when turn ends
watch(isMyTurn, (isTurn) => {
  if (!isTurn) {
    showItemPanel.value = false
    showSwitchPanel.value = false
    showManeuverPanel.value = false
    showPassConfirm.value = false
    resetTargetSelector()
  }
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style lang="scss" scoped>
.combat-actions {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  position: relative;

  &__turn-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-accent-scarlet, 0.15);
    border: 1px solid rgba($color-accent-scarlet, 0.4);
    border-radius: $border-radius-md;
    animation: pulse-turn 2s ease-in-out infinite;
  }

  &__turn-label {
    font-weight: 700;
    font-size: $font-size-sm;
    color: $color-accent-scarlet;
  }

  &__action-pips {
    display: flex;
    gap: 4px;
  }

  &__phase {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-xs $spacing-sm;
    background: rgba($color-accent-violet, 0.15);
    border: 1px solid rgba($color-accent-violet, 0.3);
    border-radius: $border-radius-sm;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-accent-violet;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__section-title {
    font-size: $font-size-xs;
    font-weight: 700;
    text-transform: uppercase;
    color: $color-text-muted;
    letter-spacing: 0.05em;
    margin: 0;
  }

  &__section-hint {
    font-weight: 400;
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: none;
    letter-spacing: 0;
  }

  &__moves {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-xs;
  }

  &__btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 44px;
    min-width: 44px;
    padding: $spacing-xs;
    border: 1px solid $glass-border;
    border-radius: $border-radius-md;
    background: $glass-bg;
    color: $color-text;
    font-size: $font-size-xs;
    font-weight: 600;
    cursor: pointer;
    transition: all $transition-fast;
    -webkit-tap-highlight-color: transparent;

    &:hover:not(:disabled) {
      background: $color-bg-hover;
      border-color: $border-color-emphasis;
    }

    &:active:not(:disabled) {
      transform: scale(0.97);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &--shift {
      border-color: rgba($color-accent-teal, 0.3);
      &:hover:not(:disabled) { border-color: $color-accent-teal; }
    }

    &--struggle {
      border-color: rgba($color-warning, 0.3);
      &:hover:not(:disabled) { border-color: $color-warning; }
    }

    &--pass {
      border-color: rgba($color-text-muted, 0.3);
      &:hover:not(:disabled) { border-color: $color-text-muted; }
    }

    &--item {
      border-color: rgba($color-success, 0.3);
      &:hover:not(:disabled) { border-color: $color-success; }
    }

    &--switch {
      border-color: rgba($color-info, 0.3);
      &:hover:not(:disabled) { border-color: $color-info; }
    }

    &--maneuver {
      border-color: rgba($color-accent-violet, 0.3);
      &:hover:not(:disabled) { border-color: $color-accent-violet; }
    }

    &--confirm {
      flex-direction: row;
      gap: $spacing-xs;
      background: rgba($color-success, 0.15);
      border-color: rgba($color-success, 0.4);
      color: $color-success;
      font-size: $font-size-sm;

      &:hover:not(:disabled) {
        background: rgba($color-success, 0.25);
      }

      &:disabled {
        opacity: 0.4;
      }
    }

    &--cancel {
      flex-direction: row;
      gap: $spacing-xs;
      background: rgba($color-text-muted, 0.1);
      border-color: rgba($color-text-muted, 0.3);
      color: $color-text-muted;
      font-size: $font-size-sm;
    }
  }

  // =============================================
  // Expandable Panels (Items, Switch, Maneuvers)
  // =============================================
  &__panel {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: $color-bg-tertiary;
    border-radius: $border-radius-md;
    padding: $spacing-sm;
  }

  &__panel-title {
    font-size: $font-size-xs;
    font-weight: 700;
    color: $color-text-muted;
    text-transform: uppercase;
    margin: 0 0 $spacing-xs;
  }

  &__panel-empty {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-align: center;
    padding: $spacing-sm;
  }

  &__panel-row {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: $spacing-xs $spacing-sm;
    border: 1px solid $glass-border;
    border-radius: $border-radius-sm;
    background: $glass-bg;
    color: $color-text;
    cursor: pointer;
    transition: background $transition-fast;
    text-align: left;
    min-height: 44px;
    justify-content: center;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: $color-bg-hover;
    }

    &--pokemon {
      flex-direction: row;
      align-items: center;
      gap: $spacing-sm;
    }
  }

  &__panel-sprite {
    width: 32px;
    height: 32px;
    image-rendering: pixelated;
    object-fit: contain;
  }

  &__panel-pokemon-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__panel-name {
    font-size: $font-size-sm;
    font-weight: 600;
  }

  &__panel-qty {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-left: auto;
  }

  &__panel-hp {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__panel-maneuver {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-xs;
  }

  &__panel-action-label {
    font-size: 10px;
    color: $color-accent-teal;
    font-weight: 600;
  }

  &__panel-desc {
    font-size: $font-size-xs;
    color: $color-text-muted;
    line-height: 1.3;
  }

  // =============================================
  // Pass Turn Confirmation Overlay
  // =============================================
  &__confirm-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: $z-index-modal;
    padding: $spacing-md;
  }

  &__confirm-dialog {
    background: $color-bg-secondary;
    border: 1px solid $glass-border;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    text-align: center;
    max-width: 280px;
    width: 100%;

    p {
      font-size: $font-size-md;
      font-weight: 600;
      margin: 0 0 $spacing-md;
    }
  }

  &__confirm-buttons {
    display: flex;
    gap: $spacing-sm;

    .combat-actions__btn {
      flex: 1;
    }
  }

  // =============================================
  // Cannot Command Warning
  // =============================================
  &__not-commandable {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-warning, 0.15);
    border: 1px solid rgba($color-warning, 0.4);
    border-radius: $border-radius-md;
    font-size: $font-size-xs;
    font-weight: 600;
    color: $color-warning;
  }

  // =============================================
  // Toast Notification
  // =============================================
  &__toast {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-success, 0.9);
    border-radius: $border-radius-full;
    font-size: $font-size-xs;
    font-weight: 600;
    color: white;
    z-index: $z-index-toast;
    white-space: nowrap;
    box-shadow: $shadow-md;
  }
}

// =============================================
// Action Pip (STD / SHF / SWF)
// =============================================
.action-pip {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 3px;
  background: rgba($color-success, 0.2);
  color: $color-success;
  letter-spacing: 0.03em;

  &--used {
    background: rgba($color-text-muted, 0.15);
    color: $color-text-muted;
    text-decoration: line-through;
  }
}

// =============================================
// Move Button
// =============================================
.move-btn {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: $spacing-xs $spacing-sm;
  border: 1px solid $glass-border;
  border-radius: $border-radius-sm;
  background: $glass-bg;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;
  min-height: 44px;
  justify-content: center;
  text-align: left;
  -webkit-tap-highlight-color: transparent;

  &:hover:not(:disabled) {
    background: $color-bg-hover;
    border-color: $border-color-emphasis;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    cursor: not-allowed;
  }

  &--exhausted {
    opacity: 0.45;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
  }

  &__type {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 1px 4px;
    border-radius: 3px;
    color: white;
    min-width: 40px;
    text-align: center;
  }

  &__name {
    font-size: $font-size-sm;
    font-weight: 600;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__stats {
    display: flex;
    gap: $spacing-sm;
    padding-left: calc(40px + $spacing-xs); // align under name (after type badge)
  }

  &__stat {
    font-size: 10px;
    color: $color-text-muted;

    &--freq {
      margin-left: auto;
      color: $color-accent-teal;
    }
  }

  &__exhausted-label {
    font-size: 10px;
    color: $color-danger;
    padding-left: calc(40px + $spacing-xs);
  }
}

// =============================================
// Target Selector
// =============================================
.target-selector {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: $font-size-sm;
    font-weight: 700;
  }

  &__cancel {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    color: $color-text-muted;
    cursor: pointer;
    border-radius: $border-radius-md;

    &:hover {
      background: $color-bg-hover;
      color: $color-text;
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__target {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-sm;
    border: 1px solid $glass-border;
    border-radius: $border-radius-sm;
    background: $glass-bg;
    color: $color-text;
    cursor: pointer;
    transition: all $transition-fast;
    min-height: 44px;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: $color-bg-hover;
    }

    &--selected {
      border-color: $color-accent-teal;
      background: rgba($color-accent-teal, 0.1);
    }

    &-name {
      font-size: $font-size-sm;
      font-weight: 600;
    }

    &-side {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 1px 4px;
      border-radius: 3px;

      &--players { color: $color-side-player; }
      &--allies { color: $color-side-ally; }
      &--enemies { color: $color-side-enemy; }
    }
  }
}

// =============================================
// Toast Transition
// =============================================
.toast-enter-active,
.toast-leave-active {
  transition: all 300ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

// =============================================
// Pulse Animation
// =============================================
@keyframes pulse-turn {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
