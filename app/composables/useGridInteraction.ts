import type { GridConfig, GridPosition, MovementPreview } from '~/types'
import { useSelectionStore } from '~/stores/selection'
import { useMeasurementStore } from '~/stores/measurement'
import { useFogOfWarStore } from '~/stores/fogOfWar'
import { useTerrainStore } from '~/stores/terrain'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
}

interface UseGridInteractionOptions {
  containerRef: Ref<HTMLDivElement | null>
  config: Ref<GridConfig>
  tokens: Ref<TokenData[]>
  zoom: Ref<number>
  panOffset: Ref<{ x: number; y: number }>
  scaledCellSize: ComputedRef<number>
  isGm: Ref<boolean>
  // Callbacks
  render: () => void
  calculateMoveDistance: (from: GridPosition, to: GridPosition) => number
  getSpeed: (combatantId: string) => number
  getBlockedCells: (excludeCombatantId?: string) => GridPosition[]
  isValidMove: (from: GridPosition, to: GridPosition, combatantId: string, gridWidth: number, gridHeight: number) => { valid: boolean; distance: number; blocked: boolean }
  // Emitters
  onTokenMove: (combatantId: string, position: GridPosition) => void
  onTokenSelect: (combatantId: string | null) => void
  onCellClick: (position: GridPosition) => void
  onMultiSelect: (combatantIds: string[]) => void
  onMovementPreviewChange: (preview: MovementPreview | null) => void
  // Optional touch tap override. If provided and returns true, default tap handling is skipped.
  onTouchTap?: (gridPos: GridPosition, token: TokenData | undefined) => boolean
}

// Constants
const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1

export function useGridInteraction(options: UseGridInteractionOptions) {
  const selectionStore = useSelectionStore()
  const measurementStore = useMeasurementStore()
  const fogOfWarStore = useFogOfWarStore()
  const terrainStore = useTerrainStore()

  // View state
  const isPanning = ref(false)
  const panStart = ref({ x: 0, y: 0 })
  const selectedTokenId = ref<string | null>(null)
  const hoveredCell = ref<GridPosition | null>(null)
  const movementRangeEnabled = ref(false)

  // Touch state
  const isTouchPanning = ref(false)
  const touchStartPos = ref<{ x: number; y: number } | null>(null)
  const lastTouchPos = ref<{ x: number; y: number } | null>(null)
  const isPinching = ref(false)
  const lastPinchDistance = ref(0)
  const lastPinchCenter = ref<{ x: number; y: number } | null>(null)
  const TOUCH_TAP_THRESHOLD = 5

  // Click-to-move state
  const movingTokenId = ref<string | null>(null)
  const moveTargetCell = ref<GridPosition | null>(null)

  // Marquee selection state
  const isMarqueeSelecting = ref(false)
  const marqueeStartScreen = ref<{ x: number; y: number } | null>(null)

  // Fog painting state
  const isFogPainting = ref(false)
  const lastPaintedCell = ref<GridPosition | null>(null)

  // Terrain painting state
  const isTerrainPainting = ref(false)
  const lastTerrainCell = ref<GridPosition | null>(null)

  // Moving token data for preview
  const movingToken = computed(() => {
    if (!movingTokenId.value) return null
    return options.tokens.value.find(t => t.combatantId === movingTokenId.value) || null
  })

  // Token positions for marquee selection
  const tokenPositions = computed(() => {
    return options.tokens.value.map(t => ({
      id: t.combatantId,
      position: t.position,
      size: t.size,
    }))
  })

  /**
   * Convert screen coordinates to grid position
   */
  const screenToGrid = (screenX: number, screenY: number): GridPosition => {
    const container = options.containerRef.value
    if (!container) return { x: -1, y: -1 }

    const rect = container.getBoundingClientRect()
    const canvasX = screenX - rect.left
    const canvasY = screenY - rect.top

    // Reverse transformations
    const gridX = Math.floor((canvasX - options.panOffset.value.x) / options.scaledCellSize.value)
    const gridY = Math.floor((canvasY - options.panOffset.value.y) / options.scaledCellSize.value)

    return { x: gridX, y: gridY }
  }

  /**
   * Get token at a grid position
   */
  const getTokenAtPosition = (gridPos: GridPosition): TokenData | undefined => {
    return options.tokens.value.find(token => {
      const right = token.position.x + token.size - 1
      const bottom = token.position.y + token.size - 1
      return gridPos.x >= token.position.x && gridPos.x <= right &&
             gridPos.y >= token.position.y && gridPos.y <= bottom
    })
  }

  /**
   * Handle mouse wheel for zooming
   */
  const handleWheel = (event: WheelEvent) => {
    const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, options.zoom.value + delta))

    if (newZoom !== options.zoom.value) {
      // Zoom toward mouse position
      const container = options.containerRef.value
      if (container) {
        const rect = container.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        // Calculate new pan offset to keep mouse position fixed
        const scale = newZoom / options.zoom.value
        options.panOffset.value = {
          x: mouseX - (mouseX - options.panOffset.value.x) * scale,
          y: mouseY - (mouseY - options.panOffset.value.y) * scale,
        }
      }

      options.zoom.value = newZoom
      options.render()
    }
  }

  /**
   * Handle mouse down
   */
  const handleMouseDown = (event: MouseEvent) => {
    // Middle mouse button or right click for panning
    if (event.button === 1 || event.button === 2) {
      isPanning.value = true
      panStart.value = { x: event.clientX - options.panOffset.value.x, y: event.clientY - options.panOffset.value.y }
      event.preventDefault()
      return
    }

    // Left click
    if (event.button === 0) {
      const gridPos = screenToGrid(event.clientX, event.clientY)

      // If in measurement mode, start measuring
      if (measurementStore.mode !== 'none') {
        measurementStore.startMeasurement(gridPos)
        options.render()
        return
      }

      // If fog of war is enabled and GM, start fog painting
      if (options.isGm.value && fogOfWarStore.enabled) {
        if (gridPos.x >= 0 && gridPos.x < options.config.value.width &&
            gridPos.y >= 0 && gridPos.y < options.config.value.height) {
          isFogPainting.value = true
          lastPaintedCell.value = gridPos
          fogOfWarStore.applyTool(gridPos.x, gridPos.y)
          options.render()
          return
        }
      }

      // If terrain editing is enabled and GM, start terrain painting
      if (options.isGm.value && terrainStore.enabled) {
        if (gridPos.x >= 0 && gridPos.x < options.config.value.width &&
            gridPos.y >= 0 && gridPos.y < options.config.value.height) {
          isTerrainPainting.value = true
          lastTerrainCell.value = gridPos
          terrainStore.applyTool(gridPos.x, gridPos.y)
          options.render()
          return
        }
      }

      // Check if clicking on a token
      const clickedToken = getTokenAtPosition(gridPos)

      if (clickedToken) {
        // Token click handled by VTTToken component
        return
      }

      // If in move mode and clicking on empty cell, try to move
      if (movingTokenId.value && options.isGm.value) {
        const token = movingToken.value
        if (token) {
          // Use terrain-aware validation
          const moveResult = options.isValidMove(
            token.position,
            gridPos,
            token.combatantId,
            options.config.value.width,
            options.config.value.height
          )

          // Check if move is valid (terrain-aware: accounts for slow, blocking terrain)
          if (moveResult.valid) {
            options.onTokenMove(movingTokenId.value, gridPos)
            options.onMovementPreviewChange(null)
            movingTokenId.value = null
            moveTargetCell.value = null
            options.render()
            return
          } else if (moveResult.distance === 0) {
            // Clicked on same cell, cancel move mode
            options.onMovementPreviewChange(null)
            movingTokenId.value = null
            moveTargetCell.value = null
            options.render()
            return
          }
        }
      }

      // If clicking on empty space without move mode, cancel selection
      if (!clickedToken) {
        if (movingTokenId.value && options.isGm.value) {
          options.onMovementPreviewChange(null)
        }
        movingTokenId.value = null
        moveTargetCell.value = null
        selectedTokenId.value = null
        options.onTokenSelect(null)
      }

      // If GM and not clicking on token, start marquee selection
      if (options.isGm.value && !movingTokenId.value) {
        isMarqueeSelecting.value = true
        marqueeStartScreen.value = { x: event.clientX, y: event.clientY }
        selectionStore.startMarquee(gridPos)

        // Clear selection unless shift is held
        if (!event.shiftKey) {
          selectionStore.clearSelection()
        }
      }

      // Emit cell click
      if (gridPos.x >= 0 && gridPos.x < options.config.value.width &&
          gridPos.y >= 0 && gridPos.y < options.config.value.height) {
        options.onCellClick(gridPos)
      }
    }
  }

  /**
   * Handle mouse move
   */
  const handleMouseMove = (event: MouseEvent) => {
    // Update hovered cell
    const gridPos = screenToGrid(event.clientX, event.clientY)
    const cellChanged = !hoveredCell.value ||
      hoveredCell.value.x !== gridPos.x ||
      hoveredCell.value.y !== gridPos.y
    hoveredCell.value = gridPos

    // Re-render for movement preview when in move mode and emit preview
    if (movingTokenId.value && cellChanged) {
      options.render()

      // Emit movement preview for WebSocket broadcast (GM only)
      if (options.isGm.value) {
        const token = movingToken.value
        if (token && gridPos.x >= 0 && gridPos.y >= 0) {
          // Use terrain-aware validation for preview
          const moveResult = options.isValidMove(
            token.position,
            gridPos,
            token.combatantId,
            options.config.value.width,
            options.config.value.height
          )

          options.onMovementPreviewChange({
            combatantId: token.combatantId,
            fromPosition: token.position,
            toPosition: gridPos,
            distance: moveResult.distance,
            isValid: moveResult.valid
          })
        }
      }
    }

    // Handle measurement mode
    if (measurementStore.isActive) {
      measurementStore.updateMeasurement(gridPos)
      options.render()
    }

    // Handle fog painting while dragging
    if (isFogPainting.value && options.isGm.value && fogOfWarStore.enabled) {
      if (!lastPaintedCell.value ||
          lastPaintedCell.value.x !== gridPos.x ||
          lastPaintedCell.value.y !== gridPos.y) {
        if (gridPos.x >= 0 && gridPos.x < options.config.value.width &&
            gridPos.y >= 0 && gridPos.y < options.config.value.height) {
          lastPaintedCell.value = gridPos
          fogOfWarStore.applyTool(gridPos.x, gridPos.y)
          options.render()
        }
      }
    }

    // Handle terrain painting while dragging
    if (isTerrainPainting.value && options.isGm.value && terrainStore.enabled) {
      if (!lastTerrainCell.value ||
          lastTerrainCell.value.x !== gridPos.x ||
          lastTerrainCell.value.y !== gridPos.y) {
        if (gridPos.x >= 0 && gridPos.x < options.config.value.width &&
            gridPos.y >= 0 && gridPos.y < options.config.value.height) {
          lastTerrainCell.value = gridPos
          terrainStore.applyTool(gridPos.x, gridPos.y)
          options.render()
        }
      }
    }

    // Handle marquee selection
    if (isMarqueeSelecting.value && selectionStore.isMarqueeActive) {
      selectionStore.updateMarquee(gridPos)
    }

    // Handle panning
    if (isPanning.value) {
      options.panOffset.value = {
        x: event.clientX - panStart.value.x,
        y: event.clientY - panStart.value.y,
      }
      options.render()
    }
  }

  /**
   * Handle mouse up
   */
  const handleMouseUp = (_event: MouseEvent) => {
    isPanning.value = false

    // End fog painting
    if (isFogPainting.value) {
      isFogPainting.value = false
      lastPaintedCell.value = null
    }

    // End terrain painting
    if (isTerrainPainting.value) {
      isTerrainPainting.value = false
      lastTerrainCell.value = null
    }

    // End measurement (but keep the result visible)
    if (measurementStore.isActive) {
      measurementStore.endMeasurement()
    }

    // Finalize marquee selection
    if (isMarqueeSelecting.value) {
      const rect = selectionStore.marqueeRect
      if (rect && (rect.width > 1 || rect.height > 1)) {
        selectionStore.selectInRect(rect, tokenPositions.value, _event.shiftKey)
        options.onMultiSelect(selectionStore.selectedArray)
      }

      isMarqueeSelecting.value = false
      marqueeStartScreen.value = null
      selectionStore.endMarquee()
    }
  }

  /**
   * Handle token selection
   */
  const handleTokenSelect = (combatantId: string, event?: MouseEvent) => {
    // If clicking the same token that's already in move mode, cancel move mode
    if (movingTokenId.value === combatantId) {
      movingTokenId.value = null
      moveTargetCell.value = null
      if (options.isGm.value) options.onMovementPreviewChange(null)
      options.render()
      return
    }

    // If in move mode and clicking a different token, switch to that token
    if (movingTokenId.value && movingTokenId.value !== combatantId) {
      if (options.isGm.value) options.onMovementPreviewChange(null)
      movingTokenId.value = combatantId
      selectedTokenId.value = combatantId
      options.onTokenSelect(combatantId)
      options.render()
      return
    }

    // Enter move mode for this token
    selectedTokenId.value = combatantId
    movingTokenId.value = combatantId
    options.onTokenSelect(combatantId)

    // Handle multi-selection with modifier keys
    if (options.isGm.value) {
      const shiftKey = event?.shiftKey ?? false
      const ctrlKey = event?.ctrlKey ?? event?.metaKey ?? false

      if (shiftKey || ctrlKey) {
        selectionStore.toggleSelection(combatantId)
      } else {
        selectionStore.select(combatantId)
      }
      options.onMultiSelect(selectionStore.selectedArray)
    }

    options.render()
  }

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!options.isGm.value) return

    // Ctrl/Cmd + A - Select all tokens
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault()
      const allIds = options.tokens.value.map(t => t.combatantId)
      selectionStore.selectMultiple(allIds)
      options.onMultiSelect(selectionStore.selectedArray)
      return
    }

    // Escape - Clear selection, measurement, and move mode
    if (event.key === 'Escape') {
      selectionStore.clearSelection()
      measurementStore.clearMeasurement()
      measurementStore.setMode('none')
      if (movingTokenId.value) {
        options.onMovementPreviewChange(null)
      }
      movingTokenId.value = null
      moveTargetCell.value = null
      selectedTokenId.value = null
      options.onTokenSelect(null)
      options.onMultiSelect([])
      options.render()
      return
    }

    // M - Toggle distance measurement mode
    if (event.key === 'm' || event.key === 'M') {
      measurementStore.setMode(measurementStore.mode === 'distance' ? 'none' : 'distance')
      options.render()
      return
    }

    // B - Toggle burst mode
    if (event.key === 'b' || event.key === 'B') {
      measurementStore.setMode(measurementStore.mode === 'burst' ? 'none' : 'burst')
      options.render()
      return
    }

    // C - Toggle cone mode
    if (event.key === 'c' || event.key === 'C') {
      measurementStore.setMode(measurementStore.mode === 'cone' ? 'none' : 'cone')
      options.render()
      return
    }

    // R - Rotate AoE direction
    if (event.key === 'r' || event.key === 'R') {
      measurementStore.cycleDirection()
      options.render()
      return
    }

    // +/- - Adjust AoE size
    if (event.key === '+' || event.key === '=') {
      measurementStore.setAoeSize(measurementStore.aoeSize + 1)
      options.render()
      return
    }
    if (event.key === '-' || event.key === '_') {
      measurementStore.setAoeSize(measurementStore.aoeSize - 1)
      options.render()
      return
    }

    // W - Toggle movement range display
    if (event.key === 'w' || event.key === 'W') {
      movementRangeEnabled.value = !movementRangeEnabled.value
      options.render()
      return
    }

    // F - Toggle fog of war
    if (event.key === 'f' || event.key === 'F') {
      fogOfWarStore.setEnabled(!fogOfWarStore.enabled)
      options.render()
      return
    }

    // T - Toggle terrain editing
    if (event.key === 't' || event.key === 'T') {
      terrainStore.setEnabled(!terrainStore.enabled)
      options.render()
      return
    }

    // V - Reveal fog tool
    if (event.key === 'v' || event.key === 'V') {
      if (fogOfWarStore.enabled) fogOfWarStore.setToolMode('reveal')
      return
    }

    // H - Hide fog tool
    if (event.key === 'h' || event.key === 'H') {
      if (fogOfWarStore.enabled) fogOfWarStore.setToolMode('hide')
      return
    }

    // E - Explore fog tool
    if (event.key === 'e' || event.key === 'E') {
      if (fogOfWarStore.enabled) fogOfWarStore.setToolMode('explore')
      return
    }

    // [ and ] - Adjust fog brush size
    if (event.key === '[') {
      fogOfWarStore.setBrushSize(fogOfWarStore.brushSize - 1)
      return
    }
    if (event.key === ']') {
      fogOfWarStore.setBrushSize(fogOfWarStore.brushSize + 1)
      return
    }
  }

  /**
   * Calculate distance between two touch points
   */
  const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Calculate center point between two touches
   */
  const getTouchCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    }
  }

  /**
   * Handle touch start — single finger starts pan, two fingers start pinch-to-zoom
   */
  const handleTouchStart = (event: TouchEvent) => {
    event.preventDefault()

    if (event.touches.length === 1) {
      // Single finger: start potential pan or tap
      const touch = event.touches[0]
      touchStartPos.value = { x: touch.clientX, y: touch.clientY }
      lastTouchPos.value = { x: touch.clientX, y: touch.clientY }
      isTouchPanning.value = false
      isPinching.value = false
    } else if (event.touches.length === 2) {
      // Two fingers: start pinch-to-zoom
      isTouchPanning.value = false
      isPinching.value = true
      lastPinchDistance.value = getTouchDistance(event.touches[0], event.touches[1])
      lastPinchCenter.value = getTouchCenter(event.touches[0], event.touches[1])
    }
  }

  /**
   * Handle touch move — pan with single finger, zoom with two fingers
   */
  const handleTouchMove = (event: TouchEvent) => {
    event.preventDefault()

    if (event.touches.length === 1 && !isPinching.value) {
      const touch = event.touches[0]

      // Check if movement exceeds tap threshold to start panning
      if (!isTouchPanning.value && touchStartPos.value) {
        const dx = Math.abs(touch.clientX - touchStartPos.value.x)
        const dy = Math.abs(touch.clientY - touchStartPos.value.y)
        if (dx > TOUCH_TAP_THRESHOLD || dy > TOUCH_TAP_THRESHOLD) {
          isTouchPanning.value = true
        }
      }

      // Apply pan delta
      if (isTouchPanning.value && lastTouchPos.value) {
        const deltaX = touch.clientX - lastTouchPos.value.x
        const deltaY = touch.clientY - lastTouchPos.value.y
        options.panOffset.value = {
          x: options.panOffset.value.x + deltaX,
          y: options.panOffset.value.y + deltaY,
        }
        options.render()
      }

      lastTouchPos.value = { x: touch.clientX, y: touch.clientY }
    } else if (event.touches.length === 2 && isPinching.value) {
      // Pinch-to-zoom
      const newDistance = getTouchDistance(event.touches[0], event.touches[1])
      const newCenter = getTouchCenter(event.touches[0], event.touches[1])

      if (lastPinchDistance.value > 0 && lastPinchCenter.value) {
        const scale = newDistance / lastPinchDistance.value
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, options.zoom.value * scale))

        if (newZoom !== options.zoom.value) {
          // Zoom toward pinch center
          const container = options.containerRef.value
          if (container) {
            const rect = container.getBoundingClientRect()
            const centerX = lastPinchCenter.value.x - rect.left
            const centerY = lastPinchCenter.value.y - rect.top

            const zoomRatio = newZoom / options.zoom.value
            options.panOffset.value = {
              x: centerX - (centerX - options.panOffset.value.x) * zoomRatio,
              y: centerY - (centerY - options.panOffset.value.y) * zoomRatio,
            }
          }

          options.zoom.value = newZoom
          options.render()
        }
      }

      lastPinchDistance.value = newDistance
      lastPinchCenter.value = newCenter
    }
  }

  /**
   * Handle touch end — detect taps (short touch without movement)
   */
  const handleTouchEnd = (event: TouchEvent) => {
    event.preventDefault()

    // If pinching and one finger lifts, reset to single-finger state
    if (isPinching.value) {
      isPinching.value = false
      lastPinchDistance.value = 0
      lastPinchCenter.value = null

      if (event.touches.length === 1) {
        // One finger still down: continue as pan
        const touch = event.touches[0]
        lastTouchPos.value = { x: touch.clientX, y: touch.clientY }
        touchStartPos.value = { x: touch.clientX, y: touch.clientY }
        isTouchPanning.value = false
      }
      return
    }

    // All fingers lifted — check if this was a tap
    if (event.touches.length === 0 && !isTouchPanning.value && touchStartPos.value) {
      // This was a tap (no significant movement)
      const changedTouch = event.changedTouches[0]
      if (changedTouch) {
        const gridPos = screenToGrid(changedTouch.clientX, changedTouch.clientY)
        const clickedToken = getTokenAtPosition(gridPos)

        // Allow caller to override tap handling (e.g. player mode)
        const handled = options.onTouchTap?.(gridPos, clickedToken) ?? false

        if (!handled) {
          if (clickedToken) {
            handleTokenSelect(clickedToken.combatantId)
          } else if (gridPos.x >= 0 && gridPos.x < options.config.value.width &&
                     gridPos.y >= 0 && gridPos.y < options.config.value.height) {
            options.onCellClick(gridPos)
          }
        }
      }
    }

    // Reset touch state
    isTouchPanning.value = false
    touchStartPos.value = null
    lastTouchPos.value = null
  }

  // Zoom controls
  const zoomIn = () => {
    options.zoom.value = Math.min(MAX_ZOOM, options.zoom.value + ZOOM_STEP)
    options.render()
  }

  const zoomOut = () => {
    options.zoom.value = Math.max(MIN_ZOOM, options.zoom.value - ZOOM_STEP)
    options.render()
  }

  const resetView = () => {
    options.zoom.value = 1
    options.panOffset.value = { x: 0, y: 0 }
    options.render()
  }

  return {
    // State
    selectedTokenId,
    hoveredCell,
    movingTokenId,
    movingToken,
    movementRangeEnabled,
    isMarqueeSelecting,
    marqueeStartScreen,
    // Methods
    screenToGrid,
    getTokenAtPosition,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleTokenSelect,
    handleKeyDown,
    zoomIn,
    zoomOut,
    resetView,
    // Constants
    MIN_ZOOM,
    MAX_ZOOM,
    ZOOM_STEP
  }
}
