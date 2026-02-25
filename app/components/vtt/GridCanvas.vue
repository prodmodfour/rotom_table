<template>
  <div
    ref="containerRef"
    class="grid-canvas-container"
    data-testid="grid-canvas-container"
    @wheel.prevent="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <canvas
      ref="canvasRef"
      class="grid-canvas"
      data-testid="grid-canvas"
    />

    <!-- Token Layer (rendered over canvas) -->
    <div
      class="token-layer"
      :style="tokenLayerStyle"
    >
      <VTTToken
        v-for="token in visibleTokens"
        :key="token.combatantId"
        :token="token"
        :cell-size="scaledCellSize"
        :combatant="getCombatant(token.combatantId)"
        :is-current-turn="token.combatantId === currentTurnId"
        :is-selected="token.combatantId === interaction.selectedTokenId.value"
        :is-multi-selected="selectionStore.isSelected(token.combatantId)"
        :is-gm="isGm"
        :is-own-token="playerMode ? isOwnTokenCheck(token.combatantId) : false"
        :is-pending-move="token.combatantId === pendingMoveCombatantId"
        @select="(id, evt) => handleTokenSelectWithPlayerMode(id, evt)"
      />
    </div>

    <!-- Marquee Selection Overlay -->
    <div
      v-if="selectionStore.isMarqueeActive && marqueePixelRect"
      class="marquee-selection"
      :style="marqueePixelRect"
    />

    <!-- Coordinate Display -->
    <CoordinateDisplay
      v-if="showCoordinates"
      :cell="interaction.hoveredCell.value"
      :mode="measurementStore.mode"
      :distance="measurementStore.distance"
    />

    <!-- Zoom Controls -->
    <ZoomControls
      v-if="showZoomControls"
      :zoom="zoom"
      @zoom-in="interaction.zoomIn"
      @zoom-out="interaction.zoomOut"
      @reset="interaction.resetView"
    />
  </div>
</template>

<script setup lang="ts">
import type { GridConfig, GridPosition, Combatant, MovementPreview } from '~/types'
import { useSelectionStore } from '~/stores/selection'
import { useMeasurementStore } from '~/stores/measurement'
import { useGridMovement } from '~/composables/useGridMovement'
import { useGridRendering } from '~/composables/useGridRendering'
import { useGridInteraction } from '~/composables/useGridInteraction'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
}

const props = defineProps<{
  config: GridConfig
  tokens: TokenData[]
  combatants: Combatant[]
  currentTurnId?: string
  isGm?: boolean
  showZoomControls?: boolean
  showCoordinates?: boolean
  showMovementRange?: boolean
  getMovementSpeed?: (combatantId: string) => number
  externalMovementPreview?: MovementPreview | null
  /** Player mode: disables drag-to-move, highlights own tokens */
  playerMode?: boolean
  /** Player's character ID for ownership checks in player mode */
  playerCharacterId?: string
  /** Player's pokemon IDs for ownership checks in player mode */
  playerPokemonIds?: string[]
  /** Combatant ID with a pending move request (shows pulsing state) */
  pendingMoveCombatantId?: string | null
}>()

const emit = defineEmits<{
  tokenMove: [combatantId: string, position: GridPosition]
  tokenSelect: [combatantId: string | null]
  cellClick: [position: GridPosition]
  multiSelect: [combatantIds: string[]]
  movementPreviewChange: [preview: MovementPreview | null]
  /** Player mode: player tapped a cell (for move destination selection) */
  playerCellClick: [position: GridPosition]
  /** Player mode: player tapped their own token */
  playerTokenSelect: [combatantId: string]
}>()

// Stores
const selectionStore = useSelectionStore()
const measurementStore = useMeasurementStore()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// View state
const zoom = ref(1)
const panOffset = ref({ x: 0, y: 0 })

// Reactive props as refs for composables
const tokensRef = computed(() => props.tokens)
const configRef = computed(() => props.config)
const isGmRef = computed(() => props.isGm ?? false)
const externalMovementPreviewRef = computed(() => props.externalMovementPreview ?? null)

// Computed
const scaledCellSize = computed(() => props.config.cellSize * zoom.value)

const gridPixelWidth = computed(() => props.config.width * props.config.cellSize)
const gridPixelHeight = computed(() => props.config.height * props.config.cellSize)

const tokenLayerStyle = computed(() => ({
  transform: `translate(${panOffset.value.x}px, ${panOffset.value.y}px) scale(${zoom.value})`,
  transformOrigin: '0 0',
  width: `${gridPixelWidth.value}px`,
  height: `${gridPixelHeight.value}px`,
}))

const visibleTokens = computed(() => {
  return props.tokens.filter(token => {
    const pos = token.position
    return pos.x >= 0 && pos.x < props.config.width &&
           pos.y >= 0 && pos.y < props.config.height
  })
})

// Combatant lookup (used by movement composable and template)
const getCombatant = (combatantId: string): Combatant | undefined => {
  return props.combatants.find(c => c.id === combatantId)
}

// Player mode helpers
const isOwnTokenCheck = (combatantId: string): boolean => {
  if (!props.playerMode) return false
  const combatant = getCombatant(combatantId)
  if (!combatant) return false
  return combatant.entityId === props.playerCharacterId ||
    (props.playerPokemonIds?.includes(combatant.entityId) ?? false)
}

const handleTokenSelectWithPlayerMode = (combatantId: string, evt: MouseEvent): void => {
  if (props.playerMode) {
    if (isOwnTokenCheck(combatantId)) {
      emit('playerTokenSelect', combatantId)
    }
    // In player mode, non-own tokens are ignored for selection
    return
  }
  interaction.handleTokenSelect(combatantId, evt)
}

// Movement composable
const movement = useGridMovement({
  tokens: tokensRef,
  getMovementSpeed: props.getMovementSpeed,
  getCombatant
})

// Interaction composable (needs to be set up before rendering)
const interaction = useGridInteraction({
  containerRef,
  config: configRef,
  tokens: tokensRef,
  zoom,
  panOffset,
  scaledCellSize,
  isGm: isGmRef,
  render: () => rendering.render(),
  calculateMoveDistance: movement.calculateMoveDistance,
  getSpeed: movement.getSpeed,
  getBlockedCells: movement.getBlockedCells,
  isValidMove: movement.isValidMove,
  onTokenMove: (id, pos) => emit('tokenMove', id, pos),
  onTokenSelect: (id) => emit('tokenSelect', id),
  onCellClick: (pos) => emit('cellClick', pos),
  onMultiSelect: (ids) => emit('multiSelect', ids),
  onMovementPreviewChange: (preview) => emit('movementPreviewChange', preview)
})

// Selected token for movement range display
const selectedTokenForMovement = computed(() => {
  const shouldShow = props.showMovementRange || interaction.movementRangeEnabled.value || interaction.movingTokenId.value
  const tokenId = interaction.movingTokenId.value || interaction.selectedTokenId.value
  if (!shouldShow || !tokenId) return null
  return props.tokens.find(t => t.combatantId === tokenId) || null
})

// Rendering composable
const rendering = useGridRendering({
  canvasRef,
  containerRef,
  config: configRef,
  tokens: tokensRef,
  zoom,
  panOffset,
  isGm: isGmRef,
  selectedTokenForMovement,
  movingToken: interaction.movingToken,
  hoveredCell: interaction.hoveredCell,
  externalMovementPreview: externalMovementPreviewRef,
  getSpeed: movement.getSpeed,
  getBlockedCells: movement.getBlockedCells,
  calculateMoveDistance: movement.calculateMoveDistance,
  getTerrainCostAt: movement.getTerrainCostAt,
  getTerrainCostForCombatant: movement.getTerrainCostForCombatant,
  isValidMove: movement.isValidMove
})

// Marquee pixel rect for visual overlay (in screen coordinates)
const marqueePixelRect = computed(() => {
  const rect = selectionStore.marqueeRect
  if (!rect) return null

  const left = rect.x * props.config.cellSize * zoom.value + panOffset.value.x
  const top = rect.y * props.config.cellSize * zoom.value + panOffset.value.y
  const width = rect.width * props.config.cellSize * zoom.value
  const height = rect.height * props.config.cellSize * zoom.value

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
})

// Event handlers (delegate to interaction composable, with player mode intercepts)
const handleWheel = interaction.handleWheel
const handleMouseMove = interaction.handleMouseMove
const handleMouseUp = interaction.handleMouseUp

const handleMouseDown = (event: MouseEvent): void => {
  if (props.playerMode && event.button === 0) {
    // In player mode, left-click on the grid emits playerCellClick
    // (panning and zooming still work via middle-click/wheel)
    const container = containerRef.value
    if (!container) return

    const rect = container.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    // Convert screen coordinates to grid cell
    const gridX = Math.floor((mouseX - panOffset.value.x) / scaledCellSize.value)
    const gridY = Math.floor((mouseY - panOffset.value.y) / scaledCellSize.value)

    if (gridX >= 0 && gridX < props.config.width && gridY >= 0 && gridY < props.config.height) {
      // Check if clicking on a token (handled by token click handler)
      const clickedToken = props.tokens.find(t =>
        t.position.x === gridX && t.position.y === gridY
      )
      if (!clickedToken) {
        emit('playerCellClick', { x: gridX, y: gridY })
      }
    }
    return
  }
  interaction.handleMouseDown(event)
}

// Lifecycle
onMounted(() => {
  rendering.loadBackgroundImage()
  rendering.render()

  window.addEventListener('resize', rendering.render)
  window.addEventListener('keydown', interaction.handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', rendering.render)
  window.removeEventListener('keydown', interaction.handleKeyDown)
})

// Watch for config changes
watch(() => props.config, () => {
  rendering.loadBackgroundImage()
  rendering.render()
}, { deep: true })

watch(() => props.tokens, () => {
  rendering.render()
}, { deep: true })

// Re-render when selected token changes
watch(() => interaction.selectedTokenId.value, () => {
  rendering.render()
})

// Re-render when external movement preview changes
watch(() => props.externalMovementPreview, () => {
  rendering.render()
}, { deep: true })

// Expose methods for parent
defineExpose({
  zoomIn: interaction.zoomIn,
  zoomOut: interaction.zoomOut,
  resetView: interaction.resetView,
  render: rendering.render,
})
</script>

<style lang="scss" scoped>
.grid-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
  background: $color-bg-primary;
  border-radius: $border-radius-md;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.grid-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.token-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.marquee-selection {
  position: absolute;
  background: rgba($color-accent-teal, 0.2);
  border: 2px dashed $color-accent-teal;
  pointer-events: none;
  z-index: 50;
  box-shadow: 0 0 10px rgba($color-accent-teal, 0.3);
}
</style>
