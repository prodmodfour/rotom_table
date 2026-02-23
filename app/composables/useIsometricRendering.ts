import type { GridConfig, CameraAngle } from '~/types'
import { useIsometricProjection } from '~/composables/useIsometricProjection'

// Constants
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.25)'
const GRID_LINE_WIDTH = 1
const GRID_FILL_COLOR = 'rgba(26, 26, 46, 0.4)'
const LABEL_FONT_SIZE = 9
const LABEL_COLOR = 'rgba(255, 255, 255, 0.3)'
const CANVAS_BG_COLOR = '#1a1a2e'

interface UseIsometricRenderingOptions {
  canvasRef: Ref<HTMLCanvasElement | null>
  containerRef: Ref<HTMLDivElement | null>
  config: Ref<GridConfig>
  zoom: Ref<number>
  panOffset: Ref<{ x: number; y: number }>
  cameraAngle: Ref<CameraAngle>
  isRotating: Ref<boolean>
}

/**
 * Isometric grid rendering composable (P0 subset).
 * Handles: clear canvas, diamond grid cells, coordinate labels,
 * background image projection, and canvas resize.
 *
 * P1 will add: token rendering, movement preview, depth sorting.
 * P2 will add: fog overlay, terrain rendering, measurement overlay.
 */
export function useIsometricRendering(options: UseIsometricRenderingOptions) {
  const {
    worldToScreen,
    rotateCoords,
    getTileDiamondPoints,
    getGridOriginOffset
  } = useIsometricProjection()

  // Background image
  const backgroundImage = ref<HTMLImageElement | null>(null)

  // Render loop state
  let renderScheduled = false

  // Cached depth-sorted cell array. Rebuilt only when cameraAngle, gridW, or gridH change.
  const sortedCells = computed(() => {
    const { width: gridW, height: gridH } = options.config.value
    const angle = options.cameraAngle.value
    const cells: Array<{ x: number; y: number; depth: number }> = []
    for (let y = 0; y < gridH; y++) {
      for (let x = 0; x < gridW; x++) {
        const { rx, ry } = rotateCoords(x, y, angle, gridW, gridH)
        cells.push({ x, y, depth: rx + ry })
      }
    }
    cells.sort((a, b) => a.depth - b.depth)
    return cells
  })

  /**
   * Load background image from config.
   */
  const loadBackgroundImage = () => {
    if (options.config.value.background) {
      const img = new Image()
      img.onload = () => {
        backgroundImage.value = img
        scheduleRender()
      }
      img.onerror = () => {
        backgroundImage.value = null
        scheduleRender()
      }
      img.src = options.config.value.background
    } else {
      backgroundImage.value = null
    }
  }

  /**
   * Schedule a render on the next animation frame.
   * Batches multiple state changes into a single frame.
   */
  const scheduleRender = () => {
    if (renderScheduled) return
    renderScheduled = true
    requestAnimationFrame(() => {
      renderScheduled = false
      render()
    })
  }

  /**
   * Main render function.
   */
  const render = () => {
    const canvas = options.canvasRef.value
    const container = options.containerRef.value
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to container size (handle resize)
    const rect = container.getBoundingClientRect()
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    const config = options.config.value
    const angle = options.cameraAngle.value
    const { cellSize, width: gridW, height: gridH } = config

    // Clear canvas
    ctx.fillStyle = CANVAS_BG_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate grid origin offset (keeps grid centered/visible)
    const { ox, oy } = getGridOriginOffset(gridW, gridH, cellSize, angle)

    // Apply camera transform
    ctx.save()
    ctx.translate(options.panOffset.value.x, options.panOffset.value.y)
    ctx.scale(options.zoom.value, options.zoom.value)
    ctx.translate(ox, oy)

    // Draw background image on ground plane (if available)
    if (backgroundImage.value) {
      drawBackgroundImage(ctx, config, angle)
    }

    // Draw isometric grid cells (back to front for proper layering)
    drawIsometricGrid(ctx, config, angle)

    ctx.restore()
  }

  /**
   * Draw the background image projected onto the isometric ground plane.
   * The image is drawn as a quadrilateral matching the grid's isometric shape.
   */
  const drawBackgroundImage = (
    ctx: CanvasRenderingContext2D,
    config: GridConfig,
    angle: CameraAngle
  ) => {
    const { cellSize, width: gridW, height: gridH } = config
    const img = backgroundImage.value
    if (!img) return

    // Get the four corners of the grid in screen space
    const topLeft = worldToScreen(0, 0, 0, angle, gridW, gridH, cellSize)
    const topRight = worldToScreen(gridW, 0, 0, angle, gridW, gridH, cellSize)
    const bottomRight = worldToScreen(gridW, gridH, 0, angle, gridW, gridH, cellSize)
    const bottomLeft = worldToScreen(0, gridH, 0, angle, gridW, gridH, cellSize)

    // Use canvas transforms to project the image
    // The affine transform maps the rectangular image to the isometric quad
    ctx.save()

    // Create a clipping path matching the isometric grid bounds
    ctx.beginPath()
    ctx.moveTo(topLeft.px, topLeft.py)
    ctx.lineTo(topRight.px, topRight.py)
    ctx.lineTo(bottomRight.px, bottomRight.py)
    ctx.lineTo(bottomLeft.px, bottomLeft.py)
    ctx.closePath()
    ctx.clip()

    // Apply affine transformation to map rectangle to parallelogram
    // We need to transform from image space (0,0)-(imgW,imgH) to iso space
    // Using setTransform with the two basis vectors of the isometric quad
    const dx1 = (topRight.px - topLeft.px) / img.width
    const dy1 = (topRight.py - topLeft.py) / img.width
    const dx2 = (bottomLeft.px - topLeft.px) / img.height
    const dy2 = (bottomLeft.py - topLeft.py) / img.height

    ctx.transform(dx1, dy1, dx2, dy2, topLeft.px, topLeft.py)
    ctx.globalAlpha = 0.6
    ctx.drawImage(img, 0, 0, img.width, img.height)
    ctx.globalAlpha = 1.0

    ctx.restore()
  }

  /**
   * Draw the isometric grid: diamond-shaped cells with optional coordinate labels.
   * Cells are drawn in depth order (back to front) for proper visual layering.
   * Uses the cached sortedCells array to avoid re-sorting every frame.
   */
  const drawIsometricGrid = (
    ctx: CanvasRenderingContext2D,
    config: GridConfig,
    angle: CameraAngle
  ) => {
    const { cellSize, width: gridW, height: gridH } = config
    const cells = sortedCells.value

    for (const cell of cells) {
      drawDiamondCell(ctx, cell.x, cell.y, 0, angle, gridW, gridH, cellSize)
    }
  }

  /**
   * Draw a single diamond-shaped isometric cell.
   */
  const drawDiamondCell = (
    ctx: CanvasRenderingContext2D,
    gridX: number,
    gridY: number,
    elevation: number,
    angle: CameraAngle,
    gridW: number,
    gridH: number,
    cellSize: number
  ) => {
    const diamond = getTileDiamondPoints(gridX, gridY, elevation, angle, gridW, gridH, cellSize)

    // Build diamond path once, then fill and stroke on the same path
    ctx.beginPath()
    ctx.moveTo(diamond.top.x, diamond.top.y)
    ctx.lineTo(diamond.right.x, diamond.right.y)
    ctx.lineTo(diamond.bottom.x, diamond.bottom.y)
    ctx.lineTo(diamond.left.x, diamond.left.y)
    ctx.closePath()

    ctx.fillStyle = GRID_FILL_COLOR
    ctx.fill()

    ctx.strokeStyle = GRID_LINE_COLOR
    ctx.lineWidth = GRID_LINE_WIDTH
    ctx.stroke()

    // Coordinate label (only at large cells to avoid clutter)
    if (cellSize >= 30) {
      // Center of diamond = average of all 4 corners
      const centerX = (diamond.top.x + diamond.right.x + diamond.bottom.x + diamond.left.x) / 4
      const centerY = (diamond.top.y + diamond.right.y + diamond.bottom.y + diamond.left.y) / 4

      ctx.fillStyle = LABEL_COLOR
      ctx.font = `${LABEL_FONT_SIZE}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${gridX},${gridY}`, centerX, centerY)
    }
  }

  return {
    render,
    scheduleRender,
    loadBackgroundImage,
    backgroundImage
  }
}
