<template>
  <div class="player-grid-view">
    <!-- No Grid -->
    <div v-if="!gridEnabled" class="player-grid-view__empty">
      <PhSquaresFour :size="32" />
      <span>No battle grid configured</span>
    </div>

    <!-- Grid Display -->
    <template v-else>
      <!-- Pending Move Status Bar -->
      <div
        v-if="pendingMove"
        class="player-grid-view__pending"
      >
        <div class="player-grid-view__pending-spinner"></div>
        <span>Move pending GM approval...</span>
      </div>

      <!-- Grid Canvas (player mode) -->
      <div class="player-grid-view__canvas-wrapper">
        <GridCanvas
          ref="gridCanvasRef"
          :config="gridConfig"
          :tokens="visibleTokens"
          :combatants="combatants"
          :current-turn-id="currentTurnId"
          :is-gm="false"
          :show-zoom-controls="true"
          :show-coordinates="true"
          :player-mode="true"
          :player-character-id="characterId"
          :player-pokemon-ids="pokemonIds"
          :pending-move-combatant-id="pendingMove?.combatantId ?? null"
          @player-cell-click="handleCellClick"
          @player-token-select="handleTokenSelect"
        />
      </div>

      <!-- Move Confirmation Sheet -->
      <PlayerMoveRequest
        :visible="!!moveConfirmTarget"
        :position="moveConfirmTarget?.position ?? { x: 0, y: 0 }"
        :distance="moveConfirmTarget?.distance ?? 0"
        @confirm="confirmMove"
        @cancel="cancelMoveConfirm"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { PhSquaresFour } from '@phosphor-icons/vue'
import type { GridPosition, GridConfig, WebSocketEvent } from '~/types'
import GridCanvas from '~/components/vtt/GridCanvas.vue'

const props = defineProps<{
  characterId: string
  pokemonIds: string[]
  send: (event: WebSocketEvent) => void
  onMessage: (listener: (msg: WebSocketEvent) => void) => (() => void)
}>()

const encounterStore = useEncounterStore()
const gridCanvasRef = ref<InstanceType<typeof GridCanvas> | null>(null)

// Player grid composable
const {
  visibleTokens,
  isOwnCombatant,
  selectedCombatantId,
  moveConfirmTarget,
  pendingMove,
  selectToken,
  clearSelection,
  setMoveTarget,
  confirmMove,
  cancelMoveConfirm,
  primaryTokenPosition
} = usePlayerGridView({
  characterId: computed(() => props.characterId),
  pokemonIds: computed(() => props.pokemonIds),
  send: props.send,
  onMessage: props.onMessage
})

// Grid config from encounter
const gridConfig = computed((): GridConfig => {
  return encounterStore.encounter?.gridConfig ?? {
    enabled: false,
    width: 20,
    height: 20,
    cellSize: 32,
    isometric: false,
    cameraAngle: 0,
    maxElevation: 5
  }
})

const gridEnabled = computed(() => gridConfig.value.enabled)

const combatants = computed(() =>
  encounterStore.encounter?.combatants ?? []
)

const currentTurnId = computed(() => {
  const enc = encounterStore.encounter
  if (!enc || enc.turnOrder.length === 0) return undefined
  return enc.turnOrder[enc.currentTurnIndex]
})

// Interaction handlers
const handleTokenSelect = (combatantId: string): void => {
  selectToken(combatantId)
}

const handleCellClick = (position: GridPosition): void => {
  const selectedId = selectedCombatantId.value
  if (!selectedId) return

  // Calculate distance from selected token to clicked cell
  const combatant = combatants.value.find(c => c.id === selectedId)
  if (!combatant?.position) return

  const dx = Math.abs(position.x - combatant.position.x)
  const dy = Math.abs(position.y - combatant.position.y)
  // PTU diagonal: alternating 1m/2m, simplified as Chebyshev
  const distance = Math.max(dx, dy)

  setMoveTarget(position, distance)
}

// Auto-center on player's token when grid first loads
watch(primaryTokenPosition, (pos) => {
  if (pos && gridCanvasRef.value) {
    gridCanvasRef.value.resetView()
  }
}, { once: true })
</script>

<style lang="scss" scoped>
.player-grid-view {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-lg;
    color: $color-text-muted;
    font-size: $font-size-sm;
  }

  &__pending {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-xs $spacing-md;
    background: rgba($color-accent-scarlet, 0.1);
    border: 1px solid rgba($color-accent-scarlet, 0.3);
    border-radius: $border-radius-md;
    font-size: $font-size-xs;
    color: $color-accent-scarlet;

    &-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba($color-accent-scarlet, 0.3);
      border-top-color: $color-accent-scarlet;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  &__canvas-wrapper {
    border-radius: $border-radius-md;
    overflow: hidden;
    min-height: 250px;
    max-height: 400px;
    border: 1px solid $glass-border;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
