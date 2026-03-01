<template>
  <div
    ref="containerRef"
    class="isometric-canvas-container"
    data-testid="isometric-canvas-container"
    @wheel.prevent="interaction.handleWheel"
    @mousedown="interaction.handleMouseDown"
    @mousemove="interaction.handleMouseMove"
    @mouseup="interaction.handleMouseUp"
    @mouseleave="onMouseLeave"
    @touchstart="interaction.handleTouchStart"
    @touchmove="interaction.handleTouchMove"
    @touchend="interaction.handleTouchEnd"
    @contextmenu.prevent
  >
    <canvas
      ref="canvasRef"
      class="isometric-canvas"
      data-testid="isometric-canvas"
    />

    <!-- Camera Controls (bottom-left) -->
    <CameraControls
      :angle="camera.cameraAngle.value"
      :is-rotating="camera.isRotating.value"
      @rotate-cw="onRotateCw"
      @rotate-ccw="onRotateCcw"
    />

    <!-- Zoom Controls (bottom-right) -->
    <ZoomControls
      v-if="showZoomControls"
      :zoom="camera.zoom.value"
      @zoom-in="camera.zoomIn"
      @zoom-out="camera.zoomOut"
      @reset="camera.resetView"
    />

    <!-- Coordinate Display (with full elevation display) -->
    <CoordinateDisplay
      v-if="showCoordinates"
      :cell="interaction.hoveredCell.value"
      :elevation="hoveredElevation"
      :is-isometric="true"
      :mode="measurementStore.mode"
      :distance="measurementStore.distance"
    />
  </div>
</template>

<script setup lang="ts">
import type { GridConfig, GridPosition, CameraAngle, Combatant, MovementPreview } from '~/types'
import { useIsometricCamera } from '~/composables/useIsometricCamera'
import { useIsometricRendering, clearSpriteCache } from '~/composables/useIsometricRendering'
import { useIsometricInteraction } from '~/composables/useIsometricInteraction'
import { useGridMovement, calculateElevationCost } from '~/composables/useGridMovement'
import { useElevation } from '~/composables/useElevation'
import { useRangeParser } from '~/composables/useRangeParser'
import { useFogOfWarStore } from '~/stores/fogOfWar'
import { useTerrainStore, TERRAIN_COLORS } from '~/stores/terrain'
import { useMeasurementStore } from '~/stores/measurement'

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
}>()

const emit = defineEmits<{
  tokenMove: [combatantId: string, position: GridPosition]
  tokenSelect: [combatantId: string | null]
  cellClick: [position: GridPosition]
  multiSelect: [combatantIds: string[]]
  movementPreviewChange: [preview: MovementPreview | null]
}>()

// Refs
const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Camera
const camera = useIsometricCamera()
const configRef = computed(() => props.config)
const tokensRef = computed(() => props.tokens)
const combatantsRef = computed(() => props.combatants)
const currentTurnIdRef = computed(() => props.currentTurnId)
const isGmRef = computed(() => props.isGm ?? false)

// P2: Stores for fog, terrain, measurement
const fogOfWarStore = useFogOfWarStore()
const terrainStore = useTerrainStore()
const measurementStore = useMeasurementStore()

// Elevation management
const maxElevationRef = computed(() => props.config.maxElevation ?? 5)
const elevation = useElevation({
  maxElevation: maxElevationRef,
  getCombatant: (id: string) => props.combatants.find(c => c.id === id),
})

// Movement system (elevation-aware)
const movement = useGridMovement({
  tokens: tokensRef,
  getMovementSpeed: props.getMovementSpeed,
  getCombatant: (id: string) => props.combatants.find(c => c.id === id),
  getTokenElevation: (id: string) => elevation.getTokenElevation(id),
  getTerrainElevation: (x: number, y: number) => elevation.getTerrainElevation(x, y),
})

// Movement preview state
const movementPreview = ref<MovementPreview | null>(null)

// Movement range cells (computed from selected token)
// Uses terrain-type-aware averaging when terrain is present per PTU p.231 / decree-011
const { getMovementRangeCells, getMovementRangeCellsWithAveraging } = useRangeParser()
const movementRangeCells = computed<GridPosition[]>(() => {
  if (!props.showMovementRange) return []
  const selectedId = interaction.selectedTokenId.value
  if (!selectedId) return []

  const token = props.tokens.find(t => t.combatantId === selectedId)
  if (!token) return []

  // Per decree-003: tokens never block movement — empty blocked list
  const blockedCells: GridPosition[] = []
  const tokenSize = token.size ?? 1
  const gridBounds = { width: props.config.width, height: props.config.height }
  const terrainCostGetter = movement.getTerrainCostGetter(selectedId)

  // Build elevation cost getter bound to this combatant
  const combatant = props.combatants.find(c => c.id === selectedId)
  const elevationCostGetter = (fromZ: number, toZ: number) =>
    calculateElevationCost(fromZ, toZ, combatant)

  const originElev = elevation.getTokenElevation(selectedId)
  const terrainElevGetter = (x: number, y: number) => elevation.getTerrainElevation(x, y)

  // Use speed-averaging flood-fill when terrain is present
  if (terrainCostGetter) {
    const maxSpeed = movement.getMaxPossibleSpeed(selectedId)
    const averagingFn = movement.buildSpeedAveragingFn(selectedId)
    const terrainTypeGetter = movement.getTerrainTypeAt

    return getMovementRangeCellsWithAveraging(
      token.position,
      maxSpeed,
      blockedCells,
      terrainCostGetter,
      terrainTypeGetter,
      averagingFn,
      elevationCostGetter,
      terrainElevGetter,
      originElev,
      tokenSize,
      gridBounds,
    )
  }

  // No terrain: use standard flood-fill
  const speed = movement.getSpeed(selectedId)
  return getMovementRangeCells(
    token.position,
    speed,
    blockedCells,
    terrainCostGetter,
    elevationCostGetter,
    terrainElevGetter,
    originElev,
    tokenSize,
    gridBounds,
  )
})

// Token data with elevation for renderer
const tokensWithElevation = computed(() => {
  return props.tokens.map(t => ({
    ...t,
    elevation: elevation.getTokenElevation(t.combatantId),
  }))
})

// Rendering (P1: tokens, P2: fog, terrain, measurement)
const rendering = useIsometricRendering({
  canvasRef,
  containerRef,
  config: configRef,
  zoom: camera.zoom,
  panOffset: camera.panOffset,
  cameraAngle: camera.cameraAngle,
  isRotating: camera.isRotating,
  tokens: tokensWithElevation,
  combatants: combatantsRef,
  currentTurnId: currentTurnIdRef,
  selectedTokenId: computed(() => interaction.selectedTokenId.value),
  hoveredCell: computed(() => interaction.hoveredCell.value),
  movingTokenId: computed(() => interaction.movingTokenId.value),
  movementPreview: computed(() => props.externalMovementPreview ?? movementPreview.value),
  movementRangeCells,
  getTokenElevation: (id: string) => elevation.getTokenElevation(id),
  getTerrainElevation: (x: number, y: number) => elevation.getTerrainElevation(x, y),
  // P2: Fog of war
  isGm: isGmRef,
  getFogState: (x: number, y: number) => fogOfWarStore.getCellState(x, y),
  fogEnabled: computed(() => fogOfWarStore.enabled),
  // P2: Terrain
  getTerrainType: (x: number, y: number) => terrainStore.getTerrainAt(x, y),
  getTerrainFlags: (x: number, y: number) => terrainStore.getFlagsAt(x, y),
  terrainColors: TERRAIN_COLORS,
  // P2: Measurement
  measurementMode: computed(() => measurementStore.mode),
  measurementCells: computed(() => measurementStore.affectedCells),
  measurementOrigin: computed(() => measurementStore.startPosition),
  measurementEnd: computed(() => measurementStore.endPosition),
  measurementDistance: computed(() => measurementStore.distance),
  measurementStartTokenOrigin: computed(() => measurementStore.startTokenOrigin),
  measurementStartTokenSize: computed(() => measurementStore.startTokenSize),
  measurementEndTokenOrigin: computed(() => measurementStore.endTokenOrigin),
  measurementEndTokenSize: computed(() => measurementStore.endTokenSize),
})

// Interaction composable (wires mouse events to grid logic)
const interaction = useIsometricInteraction({
  containerRef,
  config: configRef,
  tokens: tokensWithElevation,
  zoom: camera.zoom,
  panOffset: camera.panOffset,
  cameraAngle: camera.cameraAngle,
  isGm: isGmRef,
  terrainPaintElevation: elevation.brushElevation,
  render: () => rendering.scheduleRender(),
  isValidMove: movement.isValidMove,
  getSpeed: movement.getSpeed,
  onTokenMove: (combatantId: string, position: GridPosition) => {
    emit('tokenMove', combatantId, position)
  },
  onTokenSelect: (combatantId: string | null) => {
    emit('tokenSelect', combatantId)
  },
  onCellClick: (position: GridPosition) => {
    emit('cellClick', position)
  },
  onMultiSelect: (combatantIds: string[]) => {
    emit('multiSelect', combatantIds)
  },
  onMovementPreviewChange: (preview: MovementPreview | null) => {
    movementPreview.value = preview
    emit('movementPreviewChange', preview)
  },
})

// Hovered cell elevation (for CoordinateDisplay)
const hoveredElevation = computed(() => {
  const cell = interaction.hoveredCell.value
  if (!cell) return 0
  return elevation.getTerrainElevation(cell.x, cell.y)
})

// Initialize camera angle from config on mount
watch(() => props.config.cameraAngle, (newAngle) => {
  if (newAngle !== undefined) {
    camera.setAngle(newAngle)
  }
}, { immediate: true })

// Camera rotation handlers (trigger re-render)
const onRotateCw = () => {
  camera.rotateClockwise()
  rendering.scheduleRender()
}

const onRotateCcw = () => {
  camera.rotateCounterClockwise()
  rendering.scheduleRender()
}

const onMouseLeave = (event: MouseEvent) => {
  interaction.handleMouseUp(event)
}

/**
 * Handle keyboard events for camera rotation and interaction shortcuts.
 */
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

  // Camera rotation: Q/E
  switch (event.key.toLowerCase()) {
    case 'q':
      camera.rotateCounterClockwise()
      rendering.scheduleRender()
      return
    case 'e':
      // Only handle 'e' for camera rotation if fog is not enabled
      // (useGridInteraction uses 'e' for fog explore tool)
      camera.rotateClockwise()
      rendering.scheduleRender()
      return
  }

  // Delegate other keys to interaction composable
  interaction.handleKeyDown(event)
}

// Apply default elevations for flying Pokemon when combatant list changes.
// Watch only combatant IDs (not deep state) to avoid unnecessary calls
// when HP, status, or other combatant fields change.
watch(
  () => props.combatants.map(c => c.id),
  (_ids) => {
    for (const combatant of props.combatants) {
      elevation.applyDefaultElevation(combatant.id)
    }
  },
  { immediate: true }
)

// Watch for rotation completion
watch(() => camera.isRotating.value, (rotating) => {
  if (!rotating) {
    rendering.scheduleRender()
  }
})

// Lifecycle
onMounted(() => {
  rendering.loadBackgroundImage()
  rendering.render()

  window.addEventListener('resize', rendering.scheduleRender)
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', rendering.scheduleRender)
  window.removeEventListener('keydown', handleKeyDown)
  clearSpriteCache()
})

// Watch for config changes
watch(() => props.config, () => {
  rendering.loadBackgroundImage()
  rendering.scheduleRender()
}, { deep: true })

watch(() => props.tokens, () => {
  rendering.scheduleRender()
}, { deep: true })

watch(() => props.combatants, () => {
  rendering.scheduleRender()
}, { deep: true })

// P2: Re-render on fog/terrain/measurement state changes
// Watch only rendering-relevant state (not UI-only fields like toolMode, brushSize)
watch(() => fogOfWarStore.cellStates, () => {
  rendering.scheduleRender()
}, { deep: true })

watch(() => fogOfWarStore.enabled, () => {
  rendering.scheduleRender()
})

watch(() => terrainStore.cells, () => {
  rendering.scheduleRender()
}, { deep: true })

// Measurement: watch the fields that affect overlay rendering
const measurementRenderState = computed(() => ({
  mode: measurementStore.mode,
  startPosition: measurementStore.startPosition,
  endPosition: measurementStore.endPosition,
  aoeSize: measurementStore.aoeSize,
  aoeDirection: measurementStore.aoeDirection,
}))

watch(measurementRenderState, () => {
  rendering.scheduleRender()
}, { deep: true })

// Expose methods for parent
defineExpose({
  zoomIn: camera.zoomIn,
  zoomOut: camera.zoomOut,
  resetView: camera.resetView,
  render: rendering.render,
  // Elevation API for ElevationToolbar
  getTokenElevation: elevation.getTokenElevation,
  getTerrainElevation: elevation.getTerrainElevation,
  setTokenElevation: elevation.setTokenElevation,
  raiseToken: elevation.raiseToken,
  lowerToken: elevation.lowerToken,
  raiseTerrainAt: elevation.raiseTerrainAt,
  lowerTerrainAt: elevation.lowerTerrainAt,
  brushElevation: elevation.brushElevation,
  setBrushElevation: elevation.setBrushElevation,
  selectedTokenId: interaction.selectedTokenId,
})
</script>

<style lang="scss" scoped>
.isometric-canvas-container {
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
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
}

.isometric-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
