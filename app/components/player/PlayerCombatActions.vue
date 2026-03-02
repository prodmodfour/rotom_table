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
            :aria-label="`Use move ${move.name}. Hold to see details.`"
            @click="handleMoveSelect(move)"
            @touchstart.passive="startLongPress(move)"
            @touchend="cancelLongPress"
            @touchcancel="cancelLongPress"
            @contextmenu.prevent="showMoveDetails(move)"
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
            aria-label="Shift: move 1 meter"
            @click="handleShift"
          >
            <PhArrowsOutSimple :size="20" />
            <span>Shift</span>
          </button>

          <!-- Struggle -->
          <button
            class="combat-actions__btn combat-actions__btn--struggle"
            :disabled="!canUseStandardAction || !canBeCommanded"
            aria-label="Struggle attack"
            @click="handleStruggleSelect"
          >
            <PhHandFist :size="20" />
            <span>Struggle</span>
          </button>

          <!-- Pass Turn -->
          <button
            class="combat-actions__btn combat-actions__btn--pass"
            aria-label="Pass turn and end actions"
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
            :aria-expanded="showItemPanel"
            aria-label="Request to use an item (requires GM approval)"
            @click="togglePanel(showItemPanel)"
          >
            <PhFirstAidKit :size="20" />
            <span>Use Item</span>
          </button>

          <!-- Switch Pokemon -->
          <button
            class="combat-actions__btn combat-actions__btn--switch"
            :disabled="switchablePokemon.length === 0"
            :aria-expanded="showSwitchPanel"
            aria-label="Request to switch Pokemon (requires GM approval)"
            @click="togglePanel(showSwitchPanel)"
          >
            <PhArrowsClockwise :size="20" />
            <span>Switch</span>
          </button>

          <!-- Maneuvers -->
          <button
            class="combat-actions__btn combat-actions__btn--maneuver"
            :aria-expanded="showManeuverPanel"
            aria-label="Request a combat maneuver (requires GM approval)"
            @click="togglePanel(showManeuverPanel)"
          >
            <PhStrategy :size="20" />
            <span>Maneuver</span>
          </button>

          <!-- Capture (trainers only, not during Pokemon phase in League Battles) -->
          <button
            v-if="canShowCapture"
            class="combat-actions__btn combat-actions__btn--capture"
            :disabled="!canUseStandardAction || !canBeCommanded || captureTargets.length === 0"
            :aria-expanded="showCapturePanel"
            aria-label="Request to throw a Poke Ball (requires GM approval)"
            @click="togglePanel(showCapturePanel)"
          >
            <PhCrosshairSimple :size="20" />
            <span>Capture</span>
          </button>

          <!-- Healing -->
          <button
            class="combat-actions__btn combat-actions__btn--heal"
            :disabled="!canUseStandardAction"
            :aria-expanded="showHealingPanel"
            aria-label="Healing options: Take a Breather or use healing items (requires GM approval)"
            @click="togglePanel(showHealingPanel)"
          >
            <PhHeart :size="20" />
            <span>Heal</span>
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
          @click="handleRequestSwitch(pokemon)"
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

      <!-- Capture Panel (expandable) -->
      <PlayerCapturePanel
        v-if="showCapturePanel"
        @request-sent="handleCaptureRequestSent"
        @cancel="showCapturePanel = false"
      />

      <!-- Healing Panel (expandable) -->
      <PlayerHealingPanel
        v-if="showHealingPanel"
        @request-sent="handleHealingRequestSent"
        @cancel="showHealingPanel = false"
      />
    </template>

    <!-- Pass Turn Confirmation -->
    <div v-if="showPassConfirm" class="combat-actions__confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm pass turn">
      <div class="combat-actions__confirm-dialog">
        <p>End your turn?</p>
        <div class="combat-actions__confirm-buttons">
          <button class="combat-actions__btn combat-actions__btn--cancel" aria-label="Cancel and keep your turn" @click="showPassConfirm = false">
            Cancel
          </button>
          <button class="combat-actions__btn combat-actions__btn--confirm" aria-label="Confirm pass turn" @click="confirmPassTurn">
            Pass Turn
          </button>
        </div>
      </div>
    </div>

    <!-- Move Detail Overlay (long-press/right-click) -->
    <Transition name="fade">
      <div v-if="detailMove" class="combat-actions__move-detail-overlay" @click="detailMove = null">
        <div class="combat-actions__move-detail" @click.stop>
          <div class="combat-actions__move-detail-header">
            <span class="move-btn__type" :class="`type--${detailMove.type.toLowerCase()}`">
              {{ detailMove.type }}
            </span>
            <span class="combat-actions__move-detail-name">{{ detailMove.name }}</span>
            <button
              class="combat-actions__move-detail-close"
              aria-label="Close move details"
              @click="detailMove = null"
            >
              <PhX :size="18" />
            </button>
          </div>
          <div class="combat-actions__move-detail-stats">
            <span v-if="detailMove.damageBase">DB {{ detailMove.damageBase }}</span>
            <span v-if="detailMove.ac !== null">AC {{ detailMove.ac }}</span>
            <span>{{ detailMove.frequency }}</span>
            <span>{{ detailMove.damageClass }}</span>
          </div>
          <div class="combat-actions__move-detail-row">
            <span class="combat-actions__move-detail-label">Range</span>
            <span>{{ detailMove.range }}</span>
          </div>
          <p class="combat-actions__move-detail-effect">{{ detailMove.effect }}</p>
        </div>
      </div>
    </Transition>

    <!-- Toast Notification (success/error) -->
    <Transition name="toast">
      <div
        v-if="toastMessage"
        class="combat-actions__toast"
        :class="`combat-actions__toast--${toastSeverity}`"
      >
        <PhCheckCircle v-if="toastSeverity === 'success'" :size="16" />
        <PhWarningCircle v-else :size="16" />
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
  PhStrategy,
  PhCrosshairSimple,
  PhHeart
} from '@phosphor-icons/vue'
import type { Ref } from 'vue'
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
  captureTargets,
  switchablePokemon,
  trainerInventory
} = usePlayerCombat()

const { getCombatantName } = useCombatantDisplay()
const { getSpriteUrl } = usePokemonSprite()

// Panel visibility
const showItemPanel = ref(false)
const showSwitchPanel = ref(false)
const showManeuverPanel = ref(false)
const showCapturePanel = ref(false)
const showHealingPanel = ref(false)
const showPassConfirm = ref(false)

// Mutual exclusion: only one request panel open at a time
const closeAllPanels = () => {
  showItemPanel.value = false
  showSwitchPanel.value = false
  showManeuverPanel.value = false
  showCapturePanel.value = false
  showHealingPanel.value = false
}
const togglePanel = (panel: Ref<boolean>) => {
  const wasOpen = panel.value
  closeAllPanels()
  panel.value = !wasOpen
}

/**
 * Whether the capture button should be visible.
 * Only trainers can throw Poke Balls, not Pokemon.
 * In League Battles during Pokemon phase, capture is hidden.
 */
const canShowCapture = computed((): boolean => {
  if (isActivePokemon.value) return false
  if (isLeagueBattle.value && !isTrainerPhase.value) return false
  return true
})

// Target selection state
const showTargetSelector = ref(false)
const selectedTargetIds = ref<string[]>([])
const targetSelectorTitle = ref('')
const pendingMoveId = ref<string | null>(null)
const pendingAction = ref<'move' | 'struggle' | null>(null)

// Move detail overlay (long-press / right-click)
const detailMove = ref<Move | null>(null)
let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressTriggered = false
const LONG_PRESS_MS = 500

const startLongPress = (move: Move) => {
  longPressTriggered = false
  longPressTimer = setTimeout(() => {
    longPressTriggered = true
    detailMove.value = move
    longPressTimer = null
  }, LONG_PRESS_MS)
}

const cancelLongPress = () => {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

const showMoveDetails = (move: Move) => {
  detailMove.value = move
}

// Toast message for request confirmation and error feedback
const toastMessage = ref<string | null>(null)
const toastSeverity = ref<'success' | 'error'>('success')
let toastTimer: ReturnType<typeof setTimeout> | null = null

const combatManeuvers = COMBAT_MANEUVERS

// =============================================
// Action Handlers
// =============================================

const handleMoveSelect = (move: Move) => {
  // Prevent synthesized click from firing after a long-press on mobile
  if (longPressTriggered) {
    longPressTriggered = false
    return
  }
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

  const moveName = pendingAction.value === 'move' && pendingMoveId.value
    ? activeMoves.value.find(m => m.id === pendingMoveId.value)?.name ?? 'Move'
    : 'Struggle'

  try {
    if (pendingAction.value === 'move' && pendingMoveId.value) {
      await executeMove(pendingMoveId.value, selectedTargetIds.value)
    } else if (pendingAction.value === 'struggle') {
      await useStruggle(selectedTargetIds.value)
    }
    const targetCount = selectedTargetIds.value.length
    showToast(
      `${moveName} used on ${targetCount} ${targetCount === 1 ? 'target' : 'targets'}`,
      'success'
    )
  } catch (err: any) {
    showToast(`${moveName} failed: ` + (err.message || 'Unknown error'), 'error')
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
    showToast('Shifted 1 meter', 'success')
  } catch (err: any) {
    showToast('Shift failed: ' + (err.message || 'Unknown error'), 'error')
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
    showToast('Pass turn failed: ' + (err.message || 'Unknown error'), 'error')
  }
}

// =============================================
// Request Handlers (GM Approval)
// =============================================

const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
  toastMessage.value = message
  toastSeverity.value = severity
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastMessage.value = null
  }, severity === 'error' ? 4000 : 2500)
}

const handleRequestItem = (itemId: string, itemName: string) => {
  requestUseItem(itemId, itemName)
  showItemPanel.value = false
  showToast(`Requested: Use ${itemName}`)
}

const handleRequestSwitch = (pokemon: { id: string; nickname: string | null; species: string }) => {
  // Find the player's active Pokemon combatant to recall
  const activePokemonCombatant = myActiveCombatant.value?.type === 'pokemon'
    ? myActiveCombatant.value
    : null
  const recallId = activePokemonCombatant?.id

  requestSwitchPokemon(
    pokemon.id,
    pokemon.nickname || pokemon.species,
    recallId
  )
  showSwitchPanel.value = false
  showToast(`Requested: Switch to ${pokemon.nickname || pokemon.species}`)
}

const handleRequestManeuver = (maneuverId: string, maneuverName: string) => {
  requestManeuver(maneuverId, maneuverName)
  showManeuverPanel.value = false
  showToast(`Requested: ${maneuverName}`)
}

const handleCaptureRequestSent = () => {
  showCapturePanel.value = false
  showToast('Capture request sent to GM')
}

const handleHealingRequestSent = () => {
  showHealingPanel.value = false
  showToast('Healing request sent to GM')
}

// Close panels when turn ends
watch(isMyTurn, (isTurn) => {
  if (!isTurn) {
    closeAllPanels()
    showPassConfirm.value = false
    resetTargetSelector()
  }
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
  if (longPressTimer) clearTimeout(longPressTimer)
})
</script>

<!-- Styles extracted to assets/scss/components/_player-combat-actions.scss -->
<!-- Registered globally via nuxt.config.ts css array (BEM naming for scoping) -->
