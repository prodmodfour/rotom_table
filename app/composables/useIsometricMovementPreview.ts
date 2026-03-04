import type { GridPosition, CameraAngle, MovementPreview } from '~/types'
import { useIsometricProjection } from '~/composables/useIsometricProjection'

// Movement preview constants
const MOVEMENT_RANGE_FILL = 'rgba(0, 255, 150, 0.15)'
const MOVEMENT_RANGE_STROKE = 'rgba(0, 255, 150, 0.3)'
const VALID_MOVE_COLOR = 'rgba(0, 255, 255, 0.6)'
const INVALID_MOVE_COLOR = 'rgba(255, 80, 80, 0.6)'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
  elevation?: number
}

interface UseIsometricMovementPreviewOptions {
  tokens?: Ref<TokenData[]>
  getTokenElevation?: (combatantId: string) => number
  getTerrainElevation?: (x: number, y: number) => number
}

/**
 * Isometric movement preview composable.
 * Handles cell highlights, movement range overlays, and movement arrow rendering.
 * Extracted from useIsometricRendering to keep file sizes under 800 lines.
 */
export function useIsometricMovementPreview(options: UseIsometricMovementPreviewOptions) {
  const {
    worldToScreen,
    getTileDiamondPoints,
  } = useIsometricProjection()

  /**
   * Draw a diamond-shaped cell highlight (hover, movement range, etc).
   */
  const drawCellHighlight = (
    ctx: CanvasRenderingContext2D,
    pos: GridPosition,
    elevation: number,
    angle: CameraAngle,
    gridW: number,
    gridH: number,
    cellSize: number,
    fillColor: string,
    strokeColor: string
  ) => {
    const diamond = getTileDiamondPoints(pos.x, pos.y, elevation, angle, gridW, gridH, cellSize)

    ctx.beginPath()
    ctx.moveTo(diamond.top.x, diamond.top.y)
    ctx.lineTo(diamond.right.x, diamond.right.y)
    ctx.lineTo(diamond.bottom.x, diamond.bottom.y)
    ctx.lineTo(diamond.left.x, diamond.left.y)
    ctx.closePath()

    ctx.fillStyle = fillColor
    ctx.fill()

    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 2
    ctx.stroke()
  }

  /**
   * Draw movement range overlay as isometric diamonds.
   */
  const drawMovementRange = (
    ctx: CanvasRenderingContext2D,
    cells: GridPosition[],
    angle: CameraAngle,
    gridW: number,
    gridH: number,
    cellSize: number
  ) => {
    for (const cell of cells) {
      drawCellHighlight(
        ctx, cell, cell.z ?? 0, angle, gridW, gridH, cellSize,
        MOVEMENT_RANGE_FILL, MOVEMENT_RANGE_STROKE
      )
    }
  }

  /**
   * Draw movement preview arrow in isometric space.
   * Uses the center of the NxN footprint for both origin and destination
   * so multi-cell tokens have correctly positioned arrows.
   */
  const drawMovementArrow = (
    ctx: CanvasRenderingContext2D,
    preview: MovementPreview,
    angle: CameraAngle,
    gridW: number,
    gridH: number,
    cellSize: number
  ) => {
    // Look up the token to get its footprint size
    const token = options.tokens?.value?.find(t => t.combatantId === preview.combatantId)
    const tokenSize = token?.size ?? 1

    const fromElev = options.getTokenElevation
      ? options.getTokenElevation(preview.combatantId)
      : 0
    const toElev = options.getTerrainElevation
      ? options.getTerrainElevation(preview.toPosition.x, preview.toPosition.y)
      : 0

    // Use center of NxN footprint for arrow endpoints
    const fromCenterX = preview.fromPosition.x + tokenSize / 2
    const fromCenterY = preview.fromPosition.y + tokenSize / 2
    const toCenterX = preview.toPosition.x + tokenSize / 2
    const toCenterY = preview.toPosition.y + tokenSize / 2

    const from = worldToScreen(
      fromCenterX, fromCenterY, fromElev,
      angle, gridW, gridH, cellSize
    )
    const to = worldToScreen(
      toCenterX, toCenterY, toElev,
      angle, gridW, gridH, cellSize
    )

    const color = preview.isValid ? VALID_MOVE_COLOR : INVALID_MOVE_COLOR
    const bgColor = preview.isValid
      ? 'rgba(0, 255, 255, 0.15)'
      : 'rgba(255, 80, 80, 0.15)'

    // Highlight all cells of the destination footprint (NxN) with bounds checking
    for (let dx = 0; dx < tokenSize; dx++) {
      for (let dy = 0; dy < tokenSize; dy++) {
        const cellX = preview.toPosition.x + dx
        const cellY = preview.toPosition.y + dy
        if (cellX >= 0 && cellX < gridW && cellY >= 0 && cellY < gridH) {
          const cellElev = options.getTerrainElevation
            ? options.getTerrainElevation(cellX, cellY)
            : toElev
          drawCellHighlight(
            ctx,
            { x: cellX, y: cellY },
            cellElev, angle, gridW, gridH, cellSize,
            bgColor, color
          )
        }
      }
    }

    // Dashed line
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(from.px, from.py)
    ctx.lineTo(to.px, to.py)
    ctx.stroke()

    // Arrowhead
    const arrowAngle = Math.atan2(to.py - from.py, to.px - from.px)
    const headLen = 15
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(to.px, to.py)
    ctx.lineTo(
      to.px - headLen * Math.cos(arrowAngle - Math.PI / 6),
      to.py - headLen * Math.sin(arrowAngle - Math.PI / 6)
    )
    ctx.moveTo(to.px, to.py)
    ctx.lineTo(
      to.px - headLen * Math.cos(arrowAngle + Math.PI / 6),
      to.py - headLen * Math.sin(arrowAngle + Math.PI / 6)
    )
    ctx.stroke()

    // Distance label
    const midX = (from.px + to.px) / 2
    const midY = (from.py + to.py) / 2 - 12
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    const label = `${preview.distance}m`
    ctx.font = 'bold 12px sans-serif'
    const metrics = ctx.measureText(label)
    ctx.fillRect(midX - metrics.width / 2 - 4, midY - 8, metrics.width + 8, 16)
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, midX, midY)

    ctx.restore()
  }

  return {
    drawCellHighlight,
    drawMovementRange,
    drawMovementArrow,
  }
}
