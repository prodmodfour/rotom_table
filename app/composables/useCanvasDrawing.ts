import type { GridPosition, TerrainType } from '~/types'

/**
 * Canvas drawing utilities for grid-based rendering
 * Shared functions for arrows, labels, highlights, and terrain patterns
 */

interface ArrowOptions {
  startX: number
  startY: number
  endX: number
  endY: number
  color: string
  lineWidth?: number
  arrowSize?: number
  dashed?: boolean
}

interface DistanceLabelOptions {
  x: number
  y: number
  text: string
  color: string
  backgroundColor?: string
  fontSize?: number
}

interface CellHighlightOptions {
  x: number
  y: number
  cellSize: number
  fillColor: string
  strokeColor: string
  strokeWidth?: number
}

interface MessageLabelOptions {
  x: number
  y: number
  message: string
  color: string
  backgroundColor?: string
  fontSize?: number
}

export function useCanvasDrawing() {
  /**
   * Draw an arrow from start to end point
   */
  const drawArrow = (ctx: CanvasRenderingContext2D, opts: ArrowOptions) => {
    const { startX, startY, endX, endY, color, lineWidth = 3, arrowSize = 12, dashed = true } = opts

    // Draw line
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    if (dashed) {
      ctx.setLineDash([8, 4])
    }
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    if (dashed) {
      ctx.setLineDash([])
    }

    // Draw arrowhead
    const angle = Math.atan2(endY - startY, endX - startX)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  }

  /**
   * Draw a distance/measurement label with background
   */
  const drawDistanceLabel = (ctx: CanvasRenderingContext2D, opts: DistanceLabelOptions) => {
    const { x, y, text, color, backgroundColor = 'rgba(0, 0, 0, 0.8)', fontSize = 14 } = opts

    ctx.font = `bold ${fontSize}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Draw background
    const metrics = ctx.measureText(text)
    ctx.fillStyle = backgroundColor
    ctx.fillRect(
      x - metrics.width / 2 - 4,
      y - fontSize / 2 - 2,
      metrics.width + 8,
      fontSize + 4
    )

    // Draw text
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
  }

  /**
   * Draw a message label (e.g., "Out of range", "Blocked")
   */
  const drawMessageLabel = (ctx: CanvasRenderingContext2D, opts: MessageLabelOptions) => {
    const { x, y, message, color, backgroundColor = 'rgba(0, 0, 0, 0.8)', fontSize = 10 } = opts

    ctx.font = `bold ${fontSize}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const metrics = ctx.measureText(message)
    ctx.fillStyle = backgroundColor
    ctx.fillRect(x - metrics.width / 2 - 4, y - fontSize / 2 - 2, metrics.width + 8, fontSize + 4)
    ctx.fillStyle = color
    ctx.fillText(message, x, y)
  }

  /**
   * Highlight a grid cell with fill and stroke
   */
  const drawCellHighlight = (ctx: CanvasRenderingContext2D, opts: CellHighlightOptions) => {
    const { x, y, cellSize, fillColor, strokeColor, strokeWidth = 2 } = opts

    ctx.fillStyle = fillColor
    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = strokeWidth
    ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2)
  }

  /**
   * Draw a dashed ring around a point (for origin markers)
   */
  const drawDashedRing = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    color: string,
    lineWidth: number = 2,
    dashPattern: number[] = [4, 4]
  ) => {
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.setLineDash(dashPattern)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  /**
   * Draw a speed indicator badge
   */
  const drawSpeedBadge = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    speed: number,
    color: string = 'rgba(34, 211, 238, 0.9)'
  ) => {
    const speedText = `${speed}m`
    ctx.font = 'bold 12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Background
    const textMetrics = ctx.measureText(speedText)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(x - textMetrics.width / 2 - 3, y - 8, textMetrics.width + 6, 16)

    // Text
    ctx.fillStyle = color
    ctx.fillText(speedText, x, y)
  }

  /**
   * Draw terrain-specific patterns
   */
  const drawTerrainPattern = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    terrain: TerrainType,
    cellSize: number
  ) => {
    const centerX = x * cellSize + cellSize / 2
    const centerY = y * cellSize + cellSize / 2

    ctx.save()

    switch (terrain) {
      case 'blocking':
        // Draw X pattern for blocking
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x * cellSize + 4, y * cellSize + 4)
        ctx.lineTo((x + 1) * cellSize - 4, (y + 1) * cellSize - 4)
        ctx.moveTo((x + 1) * cellSize - 4, y * cellSize + 4)
        ctx.lineTo(x * cellSize + 4, (y + 1) * cellSize - 4)
        ctx.stroke()
        break

      case 'water':
        // Draw wave pattern for water
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = 0; i < 3; i++) {
          const waveY = y * cellSize + 8 + i * 10
          ctx.moveTo(x * cellSize + 4, waveY)
          ctx.quadraticCurveTo(
            x * cellSize + cellSize / 4, waveY - 3,
            x * cellSize + cellSize / 2, waveY
          )
          ctx.quadraticCurveTo(
            x * cellSize + (3 * cellSize) / 4, waveY + 3,
            (x + 1) * cellSize - 4, waveY
          )
        }
        ctx.stroke()
        break

      case 'hazard':
        // Draw warning triangle for hazard
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.beginPath()
        ctx.moveTo(centerX, y * cellSize + 6)
        ctx.lineTo(x * cellSize + 6, (y + 1) * cellSize - 6)
        ctx.lineTo((x + 1) * cellSize - 6, (y + 1) * cellSize - 6)
        ctx.closePath()
        ctx.fill()

        // Exclamation mark
        ctx.fillStyle = 'rgba(255, 69, 0, 0.8)'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('!', centerX, centerY + 2)
        break

      case 'elevated':
        // Draw up arrow for elevated
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(centerX, y * cellSize + 8)
        ctx.lineTo(centerX, (y + 1) * cellSize - 8)
        ctx.moveTo(centerX - 5, y * cellSize + 14)
        ctx.lineTo(centerX, y * cellSize + 8)
        ctx.lineTo(centerX + 5, y * cellSize + 14)
        ctx.stroke()
        break

      case 'earth':
        // Draw downward arrow pattern for earth/underground terrain
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(centerX, (y + 1) * cellSize - 8)
        ctx.lineTo(centerX, y * cellSize + 8)
        ctx.moveTo(centerX - 5, (y + 1) * cellSize - 14)
        ctx.lineTo(centerX, (y + 1) * cellSize - 8)
        ctx.lineTo(centerX + 5, (y + 1) * cellSize - 14)
        ctx.stroke()
        break

    }

    ctx.restore()
  }

  /**
   * Draw a cross pattern (for fog of war hidden cells)
   */
  const drawCrossPattern = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellSize: number,
    color: string,
    padding: number = 2
  ) => {
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x * cellSize + padding, y * cellSize + padding)
    ctx.lineTo((x + 1) * cellSize - padding, (y + 1) * cellSize - padding)
    ctx.moveTo((x + 1) * cellSize - padding, y * cellSize + padding)
    ctx.lineTo(x * cellSize + padding, (y + 1) * cellSize - padding)
    ctx.stroke()
  }

  /**
   * Draw a center dot (for fog of war explored cells)
   */
  const drawCenterDot = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellSize: number,
    color: string,
    radius: number = 2
  ) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(
      x * cellSize + cellSize / 2,
      y * cellSize + cellSize / 2,
      radius,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }

  /**
   * Draw a flanking indicator around a token.
   *
   * Renders a pulsing red-orange dashed border around flanked combatants
   * to provide immediate visual feedback on the VTT grid.
   *
   * @param ctx - Canvas 2D rendering context
   * @param x - Pixel X of the token's top-left cell
   * @param y - Pixel Y of the token's top-left cell
   * @param cellSize - Size of one grid cell in pixels
   * @param tokenSize - Token footprint (1=1x1, 2=2x2)
   * @param pulse - Animation value 0-1 for pulsing effect
   */
  const drawFlankingIndicator = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellSize: number,
    tokenSize: number,
    pulse: number
  ) => {
    const width = cellSize * tokenSize
    const height = cellSize * tokenSize
    const alpha = 0.4 + 0.3 * Math.sin(pulse * Math.PI * 2)

    ctx.save()
    ctx.strokeStyle = `rgba(255, 100, 50, ${alpha})`
    ctx.lineWidth = 3
    ctx.setLineDash([6, 3])

    // Draw dashed border around the token
    ctx.strokeRect(
      x + 1.5,
      y + 1.5,
      width - 3,
      height - 3
    )

    ctx.restore()
  }

  return {
    drawArrow,
    drawDistanceLabel,
    drawMessageLabel,
    drawCellHighlight,
    drawDashedRing,
    drawSpeedBadge,
    drawTerrainPattern,
    drawCrossPattern,
    drawCenterDot,
    drawFlankingIndicator
  }
}
