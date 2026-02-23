<template>
  <div
    ref="containerRef"
    class="isometric-canvas-container"
    data-testid="isometric-canvas-container"
    @wheel.prevent="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
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
      @rotate-cw="camera.rotateClockwise"
      @rotate-ccw="camera.rotateCounterClockwise"
    />

    <!-- Zoom Controls (bottom-right) -->
    <ZoomControls
      v-if="showZoomControls"
      :zoom="camera.zoom.value"
      @zoom-in="camera.zoomIn"
      @zoom-out="camera.zoomOut"
      @reset="camera.resetView"
    />

    <!-- Coordinate Display -->
    <CoordinateDisplay
      v-if="showCoordinates"
      :cell="hoveredCell"
    />
  </div>
</template>

<script setup lang="ts">
import type { GridConfig, GridPosition, CameraAngle, Combatant, MovementPreview } from '~/types'
import { useIsometricCamera } from '~/composables/useIsometricCamera'
import { useIsometricRendering } from '~/composables/useIsometricRendering'
import { useIsometricProjection } from '~/composables/useIsometricProjection'

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

// Hover state
const hoveredCell = ref<GridPosition | null>(null)

// Panning state
let isPanning = false
let lastPanX = 0
let lastPanY = 0

// Camera
const camera = useIsometricCamera()

// Initialize camera angle from config
const configRef = computed(() => props.config)

// Projection (for screenToWorld and getGridOriginOffset in mouse handlers)
const { screenToWorld, getGridOriginOffset } = useIsometricProjection()

// Rendering
const rendering = useIsometricRendering({
  canvasRef,
  containerRef,
  config: configRef,
  zoom: camera.zoom,
  panOffset: camera.panOffset,
  cameraAngle: camera.cameraAngle,
  isRotating: camera.isRotating,
  rotationProgress: camera.rotationProgress
})

// Initialize camera angle from config on mount
watch(() => props.config.cameraAngle, (newAngle) => {
  if (newAngle !== undefined) {
    camera.setAngle(newAngle)
  }
}, { immediate: true })

// Mouse handlers
const handleWheel = (event: WheelEvent) => {
  if (event.deltaY < 0) {
    camera.zoomIn()
  } else {
    camera.zoomOut()
  }
  rendering.scheduleRender()
}

const handleMouseDown = (event: MouseEvent) => {
  // Right click or middle click = pan
  if (event.button === 1 || event.button === 2) {
    isPanning = true
    lastPanX = event.clientX
    lastPanY = event.clientY
    event.preventDefault()
    return
  }

  // Left click = pan (for now in P0, interaction will be added in P1)
  if (event.button === 0) {
    isPanning = true
    lastPanX = event.clientX
    lastPanY = event.clientY
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (isPanning) {
    const dx = event.clientX - lastPanX
    const dy = event.clientY - lastPanY
    camera.panOffset.value = {
      x: camera.panOffset.value.x + dx,
      y: camera.panOffset.value.y + dy
    }
    lastPanX = event.clientX
    lastPanY = event.clientY
    rendering.scheduleRender()
    return
  }

  // Update hovered cell
  updateHoveredCell(event)
}

const handleMouseUp = () => {
  isPanning = false
}

/**
 * Convert mouse screen position to grid cell coordinates.
 */
const updateHoveredCell = (event: MouseEvent) => {
  const container = containerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top

  const config = props.config
  const { cellSize, width: gridW, height: gridH } = config

  // Reverse the camera transform: pan offset -> zoom -> grid origin offset
  const { ox, oy } = getGridOriginOffset(
    gridW, gridH, cellSize, camera.cameraAngle.value
  )

  const worldX = (mouseX - camera.panOffset.value.x) / camera.zoom.value - ox
  const worldY = (mouseY - camera.panOffset.value.y) / camera.zoom.value - oy

  const cell = screenToWorld(
    worldX, worldY,
    camera.cameraAngle.value,
    gridW, gridH,
    cellSize,
    0
  )

  // Only update if within grid bounds
  if (cell.x >= 0 && cell.x < gridW && cell.y >= 0 && cell.y < gridH) {
    hoveredCell.value = { x: cell.x, y: cell.y }
  } else {
    hoveredCell.value = null
  }
}

/**
 * Handle keyboard events for camera rotation.
 */
const handleKeyDown = (event: KeyboardEvent) => {
  // Ignore if typing in an input
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

  switch (event.key.toLowerCase()) {
    case 'q':
      camera.rotateCounterClockwise()
      rendering.scheduleRender()
      break
    case 'e':
      camera.rotateClockwise()
      rendering.scheduleRender()
      break
  }
}

// Watch for rotation animation progress to trigger re-renders
watch(() => camera.isRotating.value, (rotating) => {
  if (!rotating) {
    // Rotation completed, do a final render
    rendering.scheduleRender()
  }
})

// Continuous render during rotation animation
watch(() => camera.rotationProgress.value, () => {
  if (camera.isRotating.value) {
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
})

// Watch for config changes
watch(() => props.config, () => {
  rendering.loadBackgroundImage()
  rendering.scheduleRender()
}, { deep: true })

watch(() => props.tokens, () => {
  rendering.scheduleRender()
}, { deep: true })

// Expose methods for parent
defineExpose({
  zoomIn: camera.zoomIn,
  zoomOut: camera.zoomOut,
  resetView: camera.resetView,
  render: rendering.render,
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
