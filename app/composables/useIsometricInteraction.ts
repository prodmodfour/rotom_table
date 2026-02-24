import type { GridConfig, GridPosition, CameraAngle, MovementPreview } from '~/types'
import { useIsometricProjection } from '~/composables/useIsometricProjection'
import { useSelectionStore } from '~/stores/selection'
import { useMeasurementStore } from '~/stores/measurement'
import { useFogOfWarStore } from '~/stores/fogOfWar'
import { useTerrainStore } from '~/stores/terrain'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
  elevation?: number
}

interface UseIsometricInteractionOptions {
  containerRef: Ref<HTMLDivElement | null>
  config: Ref<GridConfig>
  tokens: Ref<TokenData[]>
  zoom: Ref<number>
  panOffset: Ref<{ x: number; y: number }>
  cameraAngle: Ref<CameraAngle>
  isGm: Ref<boolean>
  // Callbacks
  render: () => void
  isValidMove: (
    from: GridPosition, to: GridPosition, combatantId: string,
    gridWidth: number, gridHeight: number
  ) => { valid: boolean; distance: number; blocked: boolean }
  getSpeed: (combatantId: string) => number
  // Emitters
  onTokenMove: (combatantId: string, position: GridPosition) => void
  onTokenSelect: (combatantId: string | null) => void
  onCellClick: (position: GridPosition) => void
  onMultiSelect: (combatantIds: string[]) => void
  onMovementPreviewChange: (preview: MovementPreview | null) => void
}

// Constants
const MIN_ZOOM = 0.25
const MAX_ZOOM = 3
const ZOOM_STEP = 0.1

/**
 * Isometric grid interaction composable.
 *
 * Handles: screen-to-grid conversion (inverse isometric projection),
 * token hit detection, hover cell highlight, click-to-move,
 * panning (middle/right mouse), marquee selection, zooming.
 *
 * Mirrors useGridInteraction but transforms all coordinates through
 * the isometric projection layer.
 */
export function useIsometricInteraction(options: UseIsometricInteractionOptions) {
  const {
    screenToWorld,
    getGridOriginOffset,
    worldToScreen,
    getTileDiamondPoints,
  } = useIsometricProjection()

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
   * Convert screen (mouse) coordinates to grid cell coordinates
   * through the inverse isometric projection.
   */
  const screenToGrid = (screenX: number, screenY: number): GridPosition => {
    const container = options.containerRef.value
    if (!container) return { x: -1, y: -1 }

    const rect = container.getBoundingClientRect()
    const mouseX = screenX - rect.left
    const mouseY = screenY - rect.top

    const config = options.config.value
    const { cellSize, width: gridW, height: gridH } = config
    const angle = options.cameraAngle.value

    // Reverse camera transform: pan -> zoom -> grid origin offset
    const { ox, oy } = getGridOriginOffset(gridW, gridH, cellSize, angle)
    const worldX = (mouseX - options.panOffset.value.x) / options.zoom.value - ox
    const worldY = (mouseY - options.panOffset.value.y) / options.zoom.value - oy

    // Inverse isometric projection at ground level (elevation 0)
    const cell = screenToWorld(worldX, worldY, angle, gridW, gridH, cellSize, 0)
    return { x: cell.x, y: cell.y }
  }

  /**
   * Point-in-polygon test using ray casting algorithm.
   * Returns true if the point (px, py) is inside the polygon defined by vertices.
   */
  const pointInPolygon = (
    px: number,
    py: number,
    vertices: Array<{ x: number; y: number }>
  ): boolean => {
    let inside = false
    const n = vertices.length
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = vertices[i].x
      const yi = vertices[i].y
      const xj = vertices[j].x
      const yj = vertices[j].y

      if (((yi > py) !== (yj > py)) &&
          (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }
    return inside
  }

  /**
   * Hit-test: find the token at a screen position.
   * Uses diamond-shaped (rhombus) point-in-polygon test for accurate
   * isometric hit detection. Tests tokens from front to back for correct occlusion.
   */
  const getTokenAtScreenPosition = (screenX: number, screenY: number): TokenData | undefined => {
    const container = options.containerRef.value
    if (!container) return undefined

    const rect = container.getBoundingClientRect()
    const mouseX = screenX - rect.left
    const mouseY = screenY - rect.top

    const config = options.config.value
    const { cellSize, width: gridW, height: gridH } = config
    const angle = options.cameraAngle.value
    const { ox, oy } = getGridOriginOffset(gridW, gridH, cellSize, angle)

    // Convert mouse to world space
    const worldMX = (mouseX - options.panOffset.value.x) / options.zoom.value - ox
    const worldMY = (mouseY - options.panOffset.value.y) / options.zoom.value - oy

    // Check tokens from front to back for correct depth ordering
    const tokensWithDepth = options.tokens.value.map(token => {
      const elev = token.elevation ?? 0
      const center = worldToScreen(
        token.position.x + token.size / 2,
        token.position.y + token.size / 2,
        elev,
        angle,
        gridW,
        gridH,
        cellSize
      )
      return { token, screenCenterX: center.px, screenCenterY: center.py, elevation: elev }
    })

    // Sort by depth descending (front-most first) for correct pick order
    tokensWithDepth.sort((a, b) => {
      const depthA = a.screenCenterY + a.elevation
      const depthB = b.screenCenterY + b.elevation
      return depthB - depthA
    })

    for (const { token } of tokensWithDepth) {
      const elev = token.elevation ?? 0

      // Get isometric diamond vertices for the token's footprint
      const diamond = getTileDiamondPoints(
        token.position.x, token.position.y, elev,
        angle, gridW, gridH, cellSize
      )

      // For multi-cell tokens, expand the diamond to cover the full footprint
      let vertices: Array<{ x: number; y: number }>
      if (token.size > 1) {
        // Full footprint diamond: use corners of the NxN footprint
        const bottomRight = getTileDiamondPoints(
          token.position.x + token.size - 1,
          token.position.y + token.size - 1,
          elev, angle, gridW, gridH, cellSize
        )
        vertices = [
          diamond.top,
          bottomRight.right ?? diamond.right,
          bottomRight.bottom,
          diamond.left,
        ]
      } else {
        vertices = [diamond.top, diamond.right, diamond.bottom, diamond.left]
      }

      // Extend the hit area upward to cover the billboarded sprite
      // Sprite extends from the diamond center up by ~cellSize * 1.1
      const spriteHeight = cellSize * token.size * 1.1
      const extendedVertices = [
        { x: vertices[0].x, y: vertices[0].y - spriteHeight }, // top lifted
        { x: vertices[1].x, y: vertices[1].y },                // right
        { x: vertices[2].x, y: vertices[2].y },                // bottom
        { x: vertices[3].x, y: vertices[3].y },                // left
      ]

      if (pointInPolygon(worldMX, worldMY, extendedVertices)) {
        return token
      }
    }

    return undefined
  }

  /**
   * Hit-test by grid position (simpler, for cases where we already have grid coords).
   */
  const getTokenAtGridPosition = (gridPos: GridPosition): TokenData | undefined => {
    return options.tokens.value.find(token => {
      const right = token.position.x + token.size - 1
      const bottom = token.position.y + token.size - 1
      return gridPos.x >= token.position.x && gridPos.x <= right &&
             gridPos.y >= token.position.y && gridPos.y <= bottom
    })
  }

  /**
   * Check if a grid position is within grid bounds.
   */
  const isInBounds = (pos: GridPosition): boolean => {
    return pos.x >= 0 && pos.x < options.config.value.width &&
           pos.y >= 0 && pos.y < options.config.value.height
  }

  // --- Event Handlers ---

  /**
   * Mouse wheel: zoom toward cursor position.
   */
  const handleWheel = (event: WheelEvent) => {
    const delta = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, options.zoom.value + delta))

    if (newZoom !== options.zoom.value) {
      const container = options.containerRef.value
      if (container) {
        const rect = container.getBoundingClientRect()
        const mouseX = event.clientX - rect.left
        const mouseY = event.clientY - rect.top

        // Zoom toward mouse position
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
   * Mouse down: dispatch to pan, token click, move, fog/terrain painting, or marquee.
   */
  const handleMouseDown = (event: MouseEvent) => {
    // Middle or right click = pan
    if (event.button === 1 || event.button === 2) {
      isPanning.value = true
      panStart.value = {
        x: event.clientX - options.panOffset.value.x,
        y: event.clientY - options.panOffset.value.y,
      }
      event.preventDefault()
      return
    }

    // Left click
    if (event.button === 0) {
      const gridPos = screenToGrid(event.clientX, event.clientY)

      // Measurement mode
      if (measurementStore.mode !== 'none') {
        measurementStore.startMeasurement(gridPos)
        options.render()
        return
      }

      // Fog painting (GM only)
      if (options.isGm.value && fogOfWarStore.enabled) {
        if (isInBounds(gridPos)) {
          isFogPainting.value = true
          lastPaintedCell.value = gridPos
          fogOfWarStore.applyTool(gridPos.x, gridPos.y)
          options.render()
          return
        }
      }

      // Terrain painting (GM only)
      if (options.isGm.value && terrainStore.enabled) {
        if (isInBounds(gridPos)) {
          isTerrainPainting.value = true
          lastTerrainCell.value = gridPos
          terrainStore.applyTool(gridPos.x, gridPos.y)
          options.render()
          return
        }
      }

      // Token hit-test (screen-based for accuracy in isometric view)
      const clickedToken = getTokenAtScreenPosition(event.clientX, event.clientY)

      if (clickedToken) {
        handleTokenSelect(clickedToken.combatantId, event)
        return
      }

      // Click-to-move: if in move mode, try to move to clicked cell
      if (movingTokenId.value && options.isGm.value) {
        const token = movingToken.value
        if (token && isInBounds(gridPos)) {
          const moveResult = options.isValidMove(
            token.position,
            gridPos,
            token.combatantId,
            options.config.value.width,
            options.config.value.height
          )

          if (moveResult.valid) {
            options.onTokenMove(movingTokenId.value, gridPos)
            options.onMovementPreviewChange(null)
            movingTokenId.value = null
            moveTargetCell.value = null
            options.render()
            return
          } else if (moveResult.distance === 0) {
            // Same cell = cancel move mode
            options.onMovementPreviewChange(null)
            movingTokenId.value = null
            moveTargetCell.value = null
            options.render()
            return
          }
        }
      }

      // Empty space click: cancel selection
      if (!clickedToken) {
        if (movingTokenId.value && options.isGm.value) {
          options.onMovementPreviewChange(null)
        }
        movingTokenId.value = null
        moveTargetCell.value = null
        selectedTokenId.value = null
        options.onTokenSelect(null)
      }

      // Start marquee selection (GM only)
      if (options.isGm.value && !movingTokenId.value) {
        isMarqueeSelecting.value = true
        marqueeStartScreen.value = { x: event.clientX, y: event.clientY }
        selectionStore.startMarquee(gridPos)

        if (!event.shiftKey) {
          selectionStore.clearSelection()
        }
      }

      // Emit cell click
      if (isInBounds(gridPos)) {
        options.onCellClick(gridPos)
      }
    }
  }

  /**
   * Mouse move: pan, hover, movement preview, fog/terrain painting, marquee.
   */
  const handleMouseMove = (event: MouseEvent) => {
    // Panning
    if (isPanning.value) {
      options.panOffset.value = {
        x: event.clientX - panStart.value.x,
        y: event.clientY - panStart.value.y,
      }
      options.render()
      return
    }

    // Update hovered cell
    const gridPos = screenToGrid(event.clientX, event.clientY)
    const cellChanged = !hoveredCell.value ||
      hoveredCell.value.x !== gridPos.x ||
      hoveredCell.value.y !== gridPos.y
    hoveredCell.value = gridPos

    // Movement preview while in move mode
    if (movingTokenId.value && cellChanged) {
      options.render()

      if (options.isGm.value) {
        const token = movingToken.value
        if (token && gridPos.x >= 0 && gridPos.y >= 0) {
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
            isValid: moveResult.valid,
          })
        }
      }
    }

    // Measurement mode
    if (measurementStore.isActive) {
      measurementStore.updateMeasurement(gridPos)
      options.render()
    }

    // Fog painting (drag)
    if (isFogPainting.value && options.isGm.value && fogOfWarStore.enabled) {
      if (cellChanged && isInBounds(gridPos)) {
        lastPaintedCell.value = gridPos
        fogOfWarStore.applyTool(gridPos.x, gridPos.y)
        options.render()
      }
    }

    // Terrain painting (drag)
    if (isTerrainPainting.value && options.isGm.value && terrainStore.enabled) {
      if (cellChanged && isInBounds(gridPos)) {
        lastTerrainCell.value = gridPos
        terrainStore.applyTool(gridPos.x, gridPos.y)
        options.render()
      }
    }

    // Marquee selection
    if (isMarqueeSelecting.value && selectionStore.isMarqueeActive) {
      selectionStore.updateMarquee(gridPos)
    }
  }

  /**
   * Mouse up: finalize pan, fog/terrain painting, measurement, marquee.
   */
  const handleMouseUp = (_event: MouseEvent) => {
    isPanning.value = false

    if (isFogPainting.value) {
      isFogPainting.value = false
      lastPaintedCell.value = null
    }

    if (isTerrainPainting.value) {
      isTerrainPainting.value = false
      lastTerrainCell.value = null
    }

    if (measurementStore.isActive) {
      measurementStore.endMeasurement()
    }

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
   * Handle token selection and move mode.
   */
  const handleTokenSelect = (combatantId: string, event?: MouseEvent) => {
    // Same token while in move mode = cancel
    if (movingTokenId.value === combatantId) {
      movingTokenId.value = null
      moveTargetCell.value = null
      if (options.isGm.value) options.onMovementPreviewChange(null)
      options.render()
      return
    }

    // Different token while in move mode = switch target
    if (movingTokenId.value && movingTokenId.value !== combatantId) {
      if (options.isGm.value) options.onMovementPreviewChange(null)
      movingTokenId.value = combatantId
      selectedTokenId.value = combatantId
      options.onTokenSelect(combatantId)
      options.render()
      return
    }

    // Enter move mode
    selectedTokenId.value = combatantId
    movingTokenId.value = combatantId
    options.onTokenSelect(combatantId)

    // Multi-selection with modifier keys (GM only)
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
   * Keyboard shortcuts (same as 2D mode, minus Q/E which are handled by IsometricCanvas).
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!options.isGm.value) return
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return

    // Ctrl/Cmd + A - Select all
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault()
      const allIds = options.tokens.value.map(t => t.combatantId)
      selectionStore.selectMultiple(allIds)
      options.onMultiSelect(selectionStore.selectedArray)
      return
    }

    // Escape - Clear everything
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

    // M - Toggle distance measurement
    if (event.key === 'm' || event.key === 'M') {
      measurementStore.setMode(measurementStore.mode === 'distance' ? 'none' : 'distance')
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
    getTokenAtScreenPosition,
    getTokenAtGridPosition,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTokenSelect,
    handleKeyDown,
    // Constants
    MIN_ZOOM,
    MAX_ZOOM,
    ZOOM_STEP,
  }
}
