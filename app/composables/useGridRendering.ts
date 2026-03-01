import type { GridConfig, GridPosition, MovementPreview } from '~/types'
import { useMeasurementStore } from '~/stores/measurement'
import { useFogOfWarStore } from '~/stores/fogOfWar'
import { useTerrainStore, TERRAIN_COLORS, FLAG_COLORS } from '~/stores/terrain'
import { useRangeParser } from '~/composables/useRangeParser'
import { useCanvasDrawing } from '~/composables/useCanvasDrawing'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
}

interface UseGridRenderingOptions {
  canvasRef: Ref<HTMLCanvasElement | null>
  containerRef: Ref<HTMLDivElement | null>
  config: Ref<GridConfig>
  tokens: Ref<TokenData[]>
  zoom: Ref<number>
  panOffset: Ref<{ x: number; y: number }>
  isGm: Ref<boolean>
  // Movement state
  selectedTokenForMovement: Ref<TokenData | null>
  movingToken: Ref<TokenData | null>
  hoveredCell: Ref<GridPosition | null>
  externalMovementPreview: Ref<MovementPreview | null>
  // Movement helpers
  getSpeed: (combatantId: string) => number
  getMaxPossibleSpeed?: (combatantId: string) => number
  buildSpeedAveragingFn?: (combatantId: string) => (terrainTypes: Set<string>) => number
  getTerrainTypeAt?: (x: number, y: number) => string
  calculateMoveDistance: (from: GridPosition, to: GridPosition) => number
  getTerrainCostAt: (x: number, y: number) => number
  getTerrainCostForCombatant?: (x: number, y: number, combatantId: string) => number
  isValidMove: (from: GridPosition, to: GridPosition, combatantId: string, gridWidth: number, gridHeight: number) => { valid: boolean; distance: number; blocked: boolean }
}

// Constants
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.2)'
const GRID_LINE_WIDTH = 1
const MOVEMENT_VALID_COLOR = 'rgba(34, 211, 238, 0.8)'
const MOVEMENT_VALID_BG = 'rgba(34, 211, 238, 0.2)'
const MOVEMENT_INVALID_COLOR = 'rgba(239, 68, 68, 0.8)'
const MOVEMENT_INVALID_BG = 'rgba(239, 68, 68, 0.2)'

export function useGridRendering(options: UseGridRenderingOptions) {
  const measurementStore = useMeasurementStore()
  const fogOfWarStore = useFogOfWarStore()
  const terrainStore = useTerrainStore()
  const { getMovementRangeCells, getMovementRangeCellsWithAveraging } = useRangeParser()
  const {
    drawArrow,
    drawDistanceLabel,
    drawMessageLabel,
    drawCellHighlight,
    drawDashedRing,
    drawSpeedBadge,
    drawTerrainPattern,
    drawCrossPattern,
    drawCenterDot
  } = useCanvasDrawing()

  // Background image
  const backgroundImage = ref<HTMLImageElement | null>(null)

  // Computed values
  const gridPixelWidth = computed(() => options.config.value.width * options.config.value.cellSize)
  const gridPixelHeight = computed(() => options.config.value.height * options.config.value.cellSize)

  /**
   * Load background image from config
   */
  const loadBackgroundImage = () => {
    if (options.config.value.background) {
      const img = new Image()
      img.onload = () => {
        backgroundImage.value = img
        render()
      }
      img.onerror = () => {
        backgroundImage.value = null
        render()
      }
      img.src = options.config.value.background
    } else {
      backgroundImage.value = null
    }
  }

  /**
   * Main render function
   */
  const render = () => {
    const canvas = options.canvasRef.value
    const container = options.containerRef.value
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to container size
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Apply transformations
    ctx.save()
    ctx.translate(options.panOffset.value.x, options.panOffset.value.y)
    ctx.scale(options.zoom.value, options.zoom.value)

    // Draw background image if available
    if (backgroundImage.value) {
      ctx.drawImage(
        backgroundImage.value,
        0, 0,
        gridPixelWidth.value,
        gridPixelHeight.value
      )
    }

    // Draw terrain layer (before grid for visual layering)
    if (terrainStore.terrainCount > 0) {
      drawTerrain(ctx)
    }

    // Draw grid
    drawGrid(ctx)

    // Draw movement range overlay (before measurement and fog)
    if (options.selectedTokenForMovement.value) {
      drawMovementRange(ctx)
    }

    // Draw movement preview arrow when in move mode
    if (options.movingToken.value && options.hoveredCell.value) {
      drawMovementPreview(ctx)
    }

    // Draw external movement preview (from WebSocket, for group view)
    if (options.externalMovementPreview.value && !options.isGm.value) {
      drawExternalMovementPreview(ctx, options.externalMovementPreview.value)
    }

    // Draw measurement overlay
    if (measurementStore.mode !== 'none' && measurementStore.affectedCells.length > 0) {
      drawMeasurementOverlay(ctx)
    }

    // Draw fog of war overlay (only for non-GM players)
    if (fogOfWarStore.enabled && !options.isGm.value) {
      drawFogOfWar(ctx)
    }

    // Draw fog of war preview for GM (semi-transparent)
    if (fogOfWarStore.enabled && options.isGm.value) {
      drawFogOfWarPreview(ctx)
    }

    ctx.restore()
  }

  /**
   * Draw the grid lines
   */
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const { width, height, cellSize } = options.config.value

    ctx.strokeStyle = GRID_LINE_COLOR
    ctx.lineWidth = GRID_LINE_WIDTH

    // Draw vertical lines
    for (let x = 0; x <= width; x++) {
      ctx.beginPath()
      ctx.moveTo(x * cellSize, 0)
      ctx.lineTo(x * cellSize, height * cellSize)
      ctx.stroke()
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * cellSize)
      ctx.lineTo(width * cellSize, y * cellSize)
      ctx.stroke()
    }
  }

  /**
   * Draw terrain cells — base terrain type + flag overlays (multi-tag system).
   */
  const drawTerrain = (ctx: CanvasRenderingContext2D) => {
    const { width, height, cellSize } = options.config.value

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const terrain = terrainStore.getTerrainAt(x, y)
        const flags = terrainStore.getFlagsAt(x, y)
        const hasFlags = flags.rough || flags.slow
        if (terrain === 'normal' && !hasFlags) continue

        // Draw base terrain type
        if (terrain !== 'normal') {
          const colors = TERRAIN_COLORS[terrain]
          if (colors) {
            ctx.fillStyle = colors.fill
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)

            ctx.strokeStyle = colors.stroke
            ctx.lineWidth = 1
            ctx.strokeRect(x * cellSize + 0.5, y * cellSize + 0.5, cellSize - 1, cellSize - 1)

            drawTerrainPattern(ctx, x, y, terrain, cellSize)
          }
        }

        // Draw flag overlays on top of base terrain
        if (flags.slow) {
          ctx.fillStyle = FLAG_COLORS.slow.fill
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
          // Draw slow indicator — dots in bottom-left corner
          ctx.fillStyle = FLAG_COLORS.slow.stroke
          const dotRadius = Math.max(2, cellSize * 0.04)
          const margin = cellSize * 0.2
          ctx.beginPath()
          ctx.arc(x * cellSize + margin, (y + 1) * cellSize - margin, dotRadius, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(x * cellSize + margin + dotRadius * 3, (y + 1) * cellSize - margin, dotRadius, 0, Math.PI * 2)
          ctx.fill()
        }

        if (flags.rough) {
          ctx.fillStyle = FLAG_COLORS.rough.fill
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
          // Draw rough indicator — jagged line in top-right corner
          ctx.strokeStyle = FLAG_COLORS.rough.stroke
          ctx.lineWidth = 1.5
          const rMargin = cellSize * 0.15
          const rTop = y * cellSize + rMargin
          const rRight = (x + 1) * cellSize - rMargin
          const rLen = cellSize * 0.3
          ctx.beginPath()
          ctx.moveTo(rRight - rLen, rTop)
          ctx.lineTo(rRight - rLen * 0.66, rTop + 4)
          ctx.lineTo(rRight - rLen * 0.33, rTop - 2)
          ctx.lineTo(rRight, rTop + 3)
          ctx.stroke()
        }
      }
    }
  }

  /**
   * Draw measurement overlay
   */
  const drawMeasurementOverlay = (ctx: CanvasRenderingContext2D) => {
    const { cellSize } = options.config.value
    const cells = measurementStore.affectedCells
    const origin = measurementStore.startPosition

    // Color based on measurement mode
    const colors: Record<string, { fill: string; stroke: string }> = {
      distance: { fill: 'rgba(59, 130, 246, 0.3)', stroke: 'rgba(59, 130, 246, 0.8)' },
      burst: { fill: 'rgba(239, 68, 68, 0.3)', stroke: 'rgba(239, 68, 68, 0.8)' },
      cone: { fill: 'rgba(245, 158, 11, 0.3)', stroke: 'rgba(245, 158, 11, 0.8)' },
      line: { fill: 'rgba(34, 197, 94, 0.3)', stroke: 'rgba(34, 197, 94, 0.8)' },
      'close-blast': { fill: 'rgba(168, 85, 247, 0.3)', stroke: 'rgba(168, 85, 247, 0.8)' },
    }

    const color = colors[measurementStore.mode] || colors.distance

    // Draw affected cells
    ctx.fillStyle = color.fill
    ctx.strokeStyle = color.stroke
    ctx.lineWidth = 2

    cells.forEach(cell => {
      if (cell.x >= 0 && cell.x < options.config.value.width &&
          cell.y >= 0 && cell.y < options.config.value.height) {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize)
        ctx.strokeRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize)
      }
    })

    // Draw origin marker
    if (origin) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(
        origin.x * cellSize + cellSize / 2,
        origin.y * cellSize + cellSize / 2,
        cellSize / 4,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }

    // Draw distance line for distance mode
    if (measurementStore.mode === 'distance' && origin && measurementStore.endPosition) {
      ctx.strokeStyle = 'rgba(59, 130, 246, 1)'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      ctx.moveTo(
        origin.x * cellSize + cellSize / 2,
        origin.y * cellSize + cellSize / 2
      )
      ctx.lineTo(
        measurementStore.endPosition.x * cellSize + cellSize / 2,
        measurementStore.endPosition.y * cellSize + cellSize / 2
      )
      ctx.stroke()

      ctx.setLineDash([])
    }
  }

  /**
   * Draw fog of war for players (fully opaque fog on hidden cells)
   */
  const drawFogOfWar = (ctx: CanvasRenderingContext2D) => {
    const { width, height, cellSize } = options.config.value

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const fogState = fogOfWarStore.getCellState(x, y)

        if (fogState === 'hidden') {
          ctx.fillStyle = 'rgba(10, 10, 15, 0.95)'
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        } else if (fogState === 'explored') {
          ctx.fillStyle = 'rgba(10, 10, 15, 0.5)'
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        }
      }
    }
  }

  /**
   * Draw fog of war preview for GM (shows fog state without blocking view)
   */
  const drawFogOfWarPreview = (ctx: CanvasRenderingContext2D) => {
    const { width, height, cellSize } = options.config.value

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const fogState = fogOfWarStore.getCellState(x, y)

        if (fogState === 'hidden') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
          drawCrossPattern(ctx, x, y, cellSize, 'rgba(239, 68, 68, 0.3)')
        } else if (fogState === 'explored') {
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)'
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
          drawCenterDot(ctx, x, y, cellSize, 'rgba(245, 158, 11, 0.4)')
        }
      }
    }
  }

  /**
   * Draw movement range overlay for selected token.
   *
   * When speed averaging callbacks are available and terrain is present,
   * uses the terrain-type-aware flood-fill to correctly display the movement
   * range accounting for PTU p.231 speed averaging across terrain boundaries.
   */
  const drawMovementRange = (ctx: CanvasRenderingContext2D) => {
    const token = options.selectedTokenForMovement.value
    if (!token) return

    const { cellSize } = options.config.value
    // Per decree-003: tokens never block movement — pass empty blocked list
    const blocked: GridPosition[] = []

    // Build combatant-aware terrain cost getter
    const terrainCostGetter = terrainStore.terrainCount > 0
      ? (options.getTerrainCostForCombatant
        ? (x: number, y: number) => options.getTerrainCostForCombatant!(x, y, token.combatantId)
        : options.getTerrainCostAt)
      : undefined

    let rangeCells: GridPosition[]
    let displaySpeed: number

    // Use terrain-type-aware averaging when all callbacks are available
    const canUseAveraging = terrainCostGetter
      && options.getMaxPossibleSpeed
      && options.buildSpeedAveragingFn
      && options.getTerrainTypeAt

    if (canUseAveraging) {
      const maxSpeed = options.getMaxPossibleSpeed!(token.combatantId)
      const averagingFn = options.buildSpeedAveragingFn!(token.combatantId)
      const terrainTypeGetter = options.getTerrainTypeAt! as (x: number, y: number) => import('~/types').TerrainType

      rangeCells = getMovementRangeCellsWithAveraging(
        token.position,
        maxSpeed,
        blocked,
        terrainCostGetter,
        terrainTypeGetter,
        averagingFn,
      )
      // Display the speed based on starting terrain (may differ for specific paths)
      displaySpeed = options.getSpeed(token.combatantId)
    } else {
      const speed = options.getSpeed(token.combatantId)
      rangeCells = getMovementRangeCells(token.position, speed, blocked, terrainCostGetter)
      displaySpeed = speed
    }

    // Draw reachable cells with cyan tint
    ctx.fillStyle = MOVEMENT_VALID_BG
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)'
    ctx.lineWidth = 1

    rangeCells.forEach(cell => {
      if (cell.x >= 0 && cell.x < options.config.value.width &&
          cell.y >= 0 && cell.y < options.config.value.height) {
        ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize)
        ctx.strokeRect(cell.x * cellSize + 0.5, cell.y * cellSize + 0.5, cellSize - 1, cellSize - 1)
      }
    })

    // Draw token origin marker with pulsing ring
    const originX = token.position.x * cellSize + (token.size * cellSize) / 2
    const originY = token.position.y * cellSize + (token.size * cellSize) / 2
    drawDashedRing(ctx, originX, originY, (token.size * cellSize) / 2 + 4, MOVEMENT_VALID_COLOR)

    // Draw speed indicator
    const badgeX = token.position.x * cellSize + token.size * cellSize - 10
    const badgeY = token.position.y * cellSize + token.size * cellSize - 10
    drawSpeedBadge(ctx, badgeX, badgeY, displaySpeed)
  }

  /**
   * Draw movement preview arrow when in click-to-move mode.
   * Uses terrain-aware validation for accurate cost display.
   */
  const drawMovementPreview = (ctx: CanvasRenderingContext2D) => {
    const token = options.movingToken.value
    const target = options.hoveredCell.value
    if (!token || !target) return

    const { cellSize, width: gridWidth, height: gridHeight } = options.config.value

    // Use terrain-aware validation for preview
    const moveResult = options.isValidMove(
      token.position,
      target,
      token.combatantId,
      gridWidth,
      gridHeight
    )

    const distance = moveResult.distance

    // Token center (accounts for multi-cell footprint)
    const startX = token.position.x * cellSize + (token.size * cellSize) / 2
    const startY = token.position.y * cellSize + (token.size * cellSize) / 2

    // Destination center — center of full NxN footprint at target position
    const tokenSize = token.size
    const destCenterX = target.x * cellSize + (tokenSize * cellSize) / 2
    const destCenterY = target.y * cellSize + (tokenSize * cellSize) / 2

    // Choose colors based on validity
    const arrowColor = moveResult.valid ? MOVEMENT_VALID_COLOR : MOVEMENT_INVALID_COLOR
    const bgColor = moveResult.valid ? MOVEMENT_VALID_BG : MOVEMENT_INVALID_BG

    // Highlight ALL cells the token would occupy at the destination (NxN footprint)
    if (distance > 0) {
      for (let dx = 0; dx < tokenSize; dx++) {
        for (let dy = 0; dy < tokenSize; dy++) {
          drawCellHighlight(ctx, {
            x: target.x + dx,
            y: target.y + dy,
            cellSize,
            fillColor: bgColor,
            strokeColor: arrowColor
          })
        }
      }

      // Draw arrow from token center to destination footprint center
      drawArrow(ctx, { startX, startY, endX: destCenterX, endY: destCenterY, color: arrowColor })

      // Draw distance indicator above destination footprint
      const labelY = target.y * cellSize - 12
      drawDistanceLabel(ctx, {
        x: destCenterX,
        y: labelY,
        text: `${distance}m`,
        color: arrowColor
      })

      // Show "Out of range", "Blocked", or "Impassable" message if invalid
      if (!moveResult.valid) {
        const message = moveResult.blocked ? 'Occupied' : 'Out of range'
        drawMessageLabel(ctx, {
          x: destCenterX,
          y: labelY - 20,
          message,
          color: MOVEMENT_INVALID_COLOR
        })
      }
    }
  }

  /**
   * Draw external movement preview received from WebSocket (for group view)
   */
  const drawExternalMovementPreview = (ctx: CanvasRenderingContext2D, preview: MovementPreview) => {
    const { cellSize } = options.config.value

    // Find the token for sizing
    const token = options.tokens.value.find(t => t.combatantId === preview.combatantId)
    const tokenSize = token?.size || 1

    // Draw movement range grid if token exists
    if (token) {
      // Per decree-003: tokens never block movement — pass empty blocked list
    const blocked: GridPosition[] = []
      const terrainCostGetter = terrainStore.terrainCount > 0
        ? (options.getTerrainCostForCombatant
          ? (x: number, y: number) => options.getTerrainCostForCombatant!(x, y, token.combatantId)
          : options.getTerrainCostAt)
        : undefined

      // Use terrain-type-aware averaging when callbacks are available
      let rangeCells: GridPosition[]
      let displaySpeed: number
      const canUseAveraging = terrainCostGetter
        && options.getMaxPossibleSpeed
        && options.buildSpeedAveragingFn
        && options.getTerrainTypeAt

      if (canUseAveraging) {
        const maxSpeed = options.getMaxPossibleSpeed!(token.combatantId)
        const averagingFn = options.buildSpeedAveragingFn!(token.combatantId)
        const terrainTypeGetter = options.getTerrainTypeAt! as (x: number, y: number) => import('~/types').TerrainType

        rangeCells = getMovementRangeCellsWithAveraging(
          token.position, maxSpeed, blocked,
          terrainCostGetter, terrainTypeGetter, averagingFn,
        )
        // Display the speed based on starting terrain (may differ for specific paths)
        displaySpeed = options.getSpeed(token.combatantId)
      } else {
        displaySpeed = options.getSpeed(token.combatantId)
        rangeCells = getMovementRangeCells(token.position, displaySpeed, blocked, terrainCostGetter)
      }

      // Draw reachable cells with cyan tint
      ctx.fillStyle = MOVEMENT_VALID_BG
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)'
      ctx.lineWidth = 1

      rangeCells.forEach(cell => {
        if (cell.x >= 0 && cell.x < options.config.value.width &&
            cell.y >= 0 && cell.y < options.config.value.height) {
          ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize)
          ctx.strokeRect(cell.x * cellSize + 0.5, cell.y * cellSize + 0.5, cellSize - 1, cellSize - 1)
        }
      })

      // Draw origin marker ring around token
      const originX = token.position.x * cellSize + (tokenSize * cellSize) / 2
      const originY = token.position.y * cellSize + (tokenSize * cellSize) / 2
      drawDashedRing(ctx, originX, originY, (tokenSize * cellSize) / 2 + 4, MOVEMENT_VALID_COLOR)

      // Draw speed indicator
      const badgeX = token.position.x * cellSize + tokenSize * cellSize - 10
      const badgeY = token.position.y * cellSize + tokenSize * cellSize - 10
      drawSpeedBadge(ctx, badgeX, badgeY, displaySpeed)
    }

    // Token center (accounts for multi-cell footprint)
    const startX = preview.fromPosition.x * cellSize + (tokenSize * cellSize) / 2
    const startY = preview.fromPosition.y * cellSize + (tokenSize * cellSize) / 2

    // Destination center — center of full NxN footprint at target position
    const destCenterX = preview.toPosition.x * cellSize + (tokenSize * cellSize) / 2
    const destCenterY = preview.toPosition.y * cellSize + (tokenSize * cellSize) / 2

    // Choose colors based on validity
    const arrowColor = preview.isValid ? MOVEMENT_VALID_COLOR : MOVEMENT_INVALID_COLOR
    const bgColor = preview.isValid ? MOVEMENT_VALID_BG : MOVEMENT_INVALID_BG

    // Highlight ALL cells the token would occupy at the destination (NxN footprint)
    if (preview.distance > 0) {
      for (let dx = 0; dx < tokenSize; dx++) {
        for (let dy = 0; dy < tokenSize; dy++) {
          drawCellHighlight(ctx, {
            x: preview.toPosition.x + dx,
            y: preview.toPosition.y + dy,
            cellSize,
            fillColor: bgColor,
            strokeColor: arrowColor
          })
        }
      }

      drawArrow(ctx, { startX, startY, endX: destCenterX, endY: destCenterY, color: arrowColor })

      // Draw distance indicator above destination footprint
      drawDistanceLabel(ctx, {
        x: destCenterX,
        y: preview.toPosition.y * cellSize - 12,
        text: `${preview.distance}m`,
        color: arrowColor
      })
    }
  }

  return {
    render,
    loadBackgroundImage,
    backgroundImage,
    gridPixelWidth,
    gridPixelHeight
  }
}
