import type { GridConfig, GridPosition, CameraAngle, TerrainType, TerrainFlags } from '~/types'
import { FLAG_COLORS } from '~/stores/terrain'
import { useIsometricProjection } from '~/composables/useIsometricProjection'
import type { FogState } from '~/stores/fogOfWar'
import type { MeasurementMode } from '~/stores/measurement'

// Fog of war constants
const FOG_HIDDEN_FILL = 'rgba(10, 10, 15, 0.95)'
const FOG_EXPLORED_FILL = 'rgba(10, 10, 15, 0.5)'
const FOG_GM_HIDDEN_FILL = 'rgba(239, 68, 68, 0.15)'
const FOG_GM_HIDDEN_STRIPE = 'rgba(239, 68, 68, 0.3)'
const FOG_GM_EXPLORED_FILL = 'rgba(245, 158, 11, 0.15)'
const FOG_GM_EXPLORED_DOT = 'rgba(245, 158, 11, 0.4)'

// Measurement colors by mode
const MEASUREMENT_COLORS: Record<string, { fill: string; stroke: string }> = {
  distance: { fill: 'rgba(59, 130, 246, 0.3)', stroke: 'rgba(59, 130, 246, 0.8)' },
  burst: { fill: 'rgba(239, 68, 68, 0.3)', stroke: 'rgba(239, 68, 68, 0.8)' },
  cone: { fill: 'rgba(245, 158, 11, 0.3)', stroke: 'rgba(245, 158, 11, 0.8)' },
  line: { fill: 'rgba(34, 197, 94, 0.3)', stroke: 'rgba(34, 197, 94, 0.8)' },
  'close-blast': { fill: 'rgba(168, 85, 247, 0.3)', stroke: 'rgba(168, 85, 247, 0.8)' },
}

/**
 * Darken an rgba color string by blending toward black.
 * @param rgba - CSS rgba string like 'rgba(r, g, b, a)'
 * @param amount - Darkening amount from 0 (no change) to 1 (full black)
 * @returns Darkened rgba string
 */
function darkenRgba(rgba: string, amount: number): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/)
  if (!match) return rgba

  const r = Math.round(Number(match[1]) * (1 - amount))
  const g = Math.round(Number(match[2]) * (1 - amount))
  const b = Math.round(Number(match[3]) * (1 - amount))
  const a = match[4] !== undefined ? Math.min(1, Number(match[4]) + 0.2) : 0.8
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

interface IsometricOverlayOptions {
  config: Ref<GridConfig>
  cameraAngle: Ref<CameraAngle>
  // Sorted cells array (shared with main renderer for consistency)
  sortedCells: ComputedRef<Array<{ x: number; y: number; depth: number }>>
  // Fog of war
  isGm?: Ref<boolean>
  getFogState?: (x: number, y: number) => FogState
  fogEnabled?: Ref<boolean>
  // Terrain
  getTerrainType?: (x: number, y: number) => TerrainType
  getTerrainFlags?: (x: number, y: number) => TerrainFlags
  terrainColors?: Record<TerrainType, { fill: string; stroke: string }>
  getTerrainElevation?: (x: number, y: number) => number
  // Measurement
  measurementMode?: Ref<MeasurementMode>
  measurementCells?: Ref<GridPosition[]>
  measurementOrigin?: Ref<GridPosition | null>
  measurementEnd?: Ref<GridPosition | null>
  measurementDistance?: Ref<number>
  // Token metadata for multi-cell measurement endpoints
  measurementStartTokenOrigin?: Ref<GridPosition | null>
  measurementStartTokenSize?: Ref<number>
  measurementEndTokenOrigin?: Ref<GridPosition | null>
  measurementEndTokenSize?: Ref<number>
  // Token data for AoE footprint highlighting
  tokens?: Ref<Array<{ position: GridPosition; size: number }>>
  // AoE hit detection for multi-cell token highlighting
  isTargetHitByAoE?: (targetPosition: GridPosition, targetSize: number, affectedCells: GridPosition[]) => boolean
}

/**
 * Isometric overlay rendering: fog of war, terrain, measurement.
 * Extracted from useIsometricRendering to keep file sizes under limit.
 * All functions accept canvas context and draw directly.
 */
export function useIsometricOverlays(options: IsometricOverlayOptions) {
  const { worldToScreen, getTileDiamondPoints } = useIsometricProjection()

  // --- Shared diamond drawing primitives ---

  /**
   * Draw a filled isometric diamond (no stroke).
   */
  const drawFilledDiamond = (
    ctx: CanvasRenderingContext2D,
    gridX: number, gridY: number,
    elevation: number, angle: CameraAngle,
    gridW: number, gridH: number, cellSize: number,
    fillColor: string
  ) => {
    const diamond = getTileDiamondPoints(gridX, gridY, elevation, angle, gridW, gridH, cellSize)
    ctx.beginPath()
    ctx.moveTo(diamond.top.x, diamond.top.y)
    ctx.lineTo(diamond.right.x, diamond.right.y)
    ctx.lineTo(diamond.bottom.x, diamond.bottom.y)
    ctx.lineTo(diamond.left.x, diamond.left.y)
    ctx.closePath()
    ctx.fillStyle = fillColor
    ctx.fill()
  }

  /**
   * Draw diagonal stripes inside an isometric diamond (GM fog preview for hidden cells).
   */
  const drawDiamondStripes = (
    ctx: CanvasRenderingContext2D,
    gridX: number, gridY: number,
    elevation: number, angle: CameraAngle,
    gridW: number, gridH: number, cellSize: number,
    strokeColor: string
  ) => {
    const diamond = getTileDiamondPoints(gridX, gridY, elevation, angle, gridW, gridH, cellSize)

    ctx.save()
    ctx.beginPath()
    ctx.moveTo(diamond.top.x, diamond.top.y)
    ctx.lineTo(diamond.right.x, diamond.right.y)
    ctx.lineTo(diamond.bottom.x, diamond.bottom.y)
    ctx.lineTo(diamond.left.x, diamond.left.y)
    ctx.closePath()
    ctx.clip()

    const minX = Math.min(diamond.top.x, diamond.right.x, diamond.bottom.x, diamond.left.x)
    const maxX = Math.max(diamond.top.x, diamond.right.x, diamond.bottom.x, diamond.left.x)
    const minY = Math.min(diamond.top.y, diamond.right.y, diamond.bottom.y, diamond.left.y)
    const maxY = Math.max(diamond.top.y, diamond.right.y, diamond.bottom.y, diamond.left.y)
    const stripeGap = 6

    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let offset = 0; offset < (maxX - minX) + (maxY - minY); offset += stripeGap) {
      ctx.moveTo(minX + offset, minY)
      ctx.lineTo(minX, minY + offset)
    }
    ctx.stroke()
    ctx.restore()
  }

  /**
   * Draw a center dot inside an isometric diamond.
   */
  const drawDiamondCenterDot = (
    ctx: CanvasRenderingContext2D,
    gridX: number, gridY: number,
    elevation: number, angle: CameraAngle,
    gridW: number, gridH: number, cellSize: number,
    dotColor: string
  ) => {
    const diamond = getTileDiamondPoints(gridX, gridY, elevation, angle, gridW, gridH, cellSize)
    const cx = (diamond.top.x + diamond.right.x + diamond.bottom.x + diamond.left.x) / 4
    const cy = (diamond.top.y + diamond.right.y + diamond.bottom.y + diamond.left.y) / 4

    ctx.fillStyle = dotColor
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // --- Fog of war ---

  /**
   * Draw fog of war for non-GM players.
   * Hidden cells get near-opaque overlay, explored cells get semi-transparent.
   * Fog is per-column (2D) — covers all elevations at that XY.
   */
  const drawFogOfWar = (ctx: CanvasRenderingContext2D) => {
    if (!options.getFogState) return
    const config = options.config.value
    const angle = options.cameraAngle.value
    const { cellSize, width: gridW, height: gridH } = config

    for (const cell of options.sortedCells.value) {
      const fogState = options.getFogState(cell.x, cell.y)
      if (fogState === 'revealed') continue

      const fill = fogState === 'hidden' ? FOG_HIDDEN_FILL : FOG_EXPLORED_FILL
      drawFilledDiamond(ctx, cell.x, cell.y, 0, angle, gridW, gridH, cellSize, fill)
    }
  }

  /**
   * Draw fog of war preview for GM.
   * Hidden cells get striped pattern, explored cells get center dot.
   */
  const drawFogOfWarPreview = (ctx: CanvasRenderingContext2D) => {
    if (!options.getFogState) return
    const config = options.config.value
    const angle = options.cameraAngle.value
    const { cellSize, width: gridW, height: gridH } = config

    for (const cell of options.sortedCells.value) {
      const fogState = options.getFogState(cell.x, cell.y)
      if (fogState === 'revealed') continue

      if (fogState === 'hidden') {
        drawFilledDiamond(ctx, cell.x, cell.y, 0, angle, gridW, gridH, cellSize, FOG_GM_HIDDEN_FILL)
        drawDiamondStripes(ctx, cell.x, cell.y, 0, angle, gridW, gridH, cellSize, FOG_GM_HIDDEN_STRIPE)
      } else {
        drawFilledDiamond(ctx, cell.x, cell.y, 0, angle, gridW, gridH, cellSize, FOG_GM_EXPLORED_FILL)
        drawDiamondCenterDot(ctx, cell.x, cell.y, 0, angle, gridW, gridH, cellSize, FOG_GM_EXPLORED_DOT)
      }
    }
  }

  // --- Terrain ---

  /**
   * Draw terrain layer as colored isometric diamonds with patterns + flag overlays.
   */
  const drawTerrainLayer = (ctx: CanvasRenderingContext2D) => {
    if (!options.getTerrainType || !options.terrainColors) return
    const config = options.config.value
    const angle = options.cameraAngle.value
    const { cellSize, width: gridW, height: gridH } = config
    const defaultFlags: TerrainFlags = { rough: false, slow: false }

    for (const cell of options.sortedCells.value) {
      const terrain = options.getTerrainType(cell.x, cell.y)
      const flags = options.getTerrainFlags
        ? options.getTerrainFlags(cell.x, cell.y)
        : defaultFlags
      const hasFlags = flags.rough || flags.slow

      if (terrain === 'normal' && !hasFlags) continue

      // Get terrain elevation (raised/lowered ground)
      const elev = options.getTerrainElevation
        ? options.getTerrainElevation(cell.x, cell.y)
        : 0

      // Draw base terrain type
      if (terrain !== 'normal') {
        const terrainColor = options.terrainColors[terrain]
        if (terrainColor) {
          drawFilledDiamond(ctx, cell.x, cell.y, elev, angle, gridW, gridH, cellSize, terrainColor.fill)

          const diamond = getTileDiamondPoints(cell.x, cell.y, elev, angle, gridW, gridH, cellSize)
          ctx.beginPath()
          ctx.moveTo(diamond.top.x, diamond.top.y)
          ctx.lineTo(diamond.right.x, diamond.right.y)
          ctx.lineTo(diamond.bottom.x, diamond.bottom.y)
          ctx.lineTo(diamond.left.x, diamond.left.y)
          ctx.closePath()
          ctx.strokeStyle = terrainColor.stroke
          ctx.lineWidth = 1
          ctx.stroke()

          if (elev > 0) {
            drawTerrainSideFaces(ctx, cell.x, cell.y, elev, angle, gridW, gridH, cellSize, terrainColor.fill, terrainColor.stroke)
          }

          drawIsometricTerrainPattern(ctx, cell.x, cell.y, terrain, angle, gridW, gridH, cellSize, elev)
        }
      }

      // Draw flag overlays on top of base terrain
      if (flags.slow) {
        drawFilledDiamond(ctx, cell.x, cell.y, elev, angle, gridW, gridH, cellSize, FLAG_COLORS.slow.fill)
      }
      if (flags.rough) {
        drawFilledDiamond(ctx, cell.x, cell.y, elev, angle, gridW, gridH, cellSize, FLAG_COLORS.rough.fill)
      }
    }
  }

  /**
   * Draw side faces for elevated terrain (gives visual depth to raised ground).
   * Draws the visible side faces of the isometric "box" between ground and elevated level.
   *
   * Camera angle correctness: These two faces (right->bottom and left->bottom) are
   * always the camera-facing faces regardless of rotation angle. This works because
   * getTileDiamondPoints calls worldToScreen which applies rotateCoords internally.
   * The diamond's "bottom" point always has the highest depth (closest to viewer),
   * so the right->bottom and left->bottom edges are always the two visible sides.
   * No camera-angle-aware face selection is needed.
   */
  const drawTerrainSideFaces = (
    ctx: CanvasRenderingContext2D,
    gridX: number, gridY: number,
    elevation: number,
    angle: CameraAngle,
    gridW: number, gridH: number, cellSize: number,
    fillColor: string,
    strokeColor: string
  ) => {
    const topDiamond = getTileDiamondPoints(gridX, gridY, elevation, angle, gridW, gridH, cellSize)
    const bottomDiamond = getTileDiamondPoints(gridX, gridY, 0, angle, gridW, gridH, cellSize)

    // Derive side face fill from terrain fill color (darker shade for depth effect).
    // Right face gets a medium-dark blend, left face gets a darker blend.
    const rightFill = darkenRgba(fillColor, 0.3)
    const leftFill = darkenRgba(fillColor, 0.5)

    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 1

    // Right face: top.right -> bottom.right -> bottom.bottom -> top.bottom
    ctx.fillStyle = rightFill
    ctx.beginPath()
    ctx.moveTo(topDiamond.right.x, topDiamond.right.y)
    ctx.lineTo(bottomDiamond.right.x, bottomDiamond.right.y)
    ctx.lineTo(bottomDiamond.bottom.x, bottomDiamond.bottom.y)
    ctx.lineTo(topDiamond.bottom.x, topDiamond.bottom.y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Left face: top.left -> bottom.left -> bottom.bottom -> top.bottom
    ctx.fillStyle = leftFill
    ctx.beginPath()
    ctx.moveTo(topDiamond.left.x, topDiamond.left.y)
    ctx.lineTo(bottomDiamond.left.x, bottomDiamond.left.y)
    ctx.lineTo(bottomDiamond.bottom.x, bottomDiamond.bottom.y)
    ctx.lineTo(topDiamond.bottom.x, topDiamond.bottom.y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  /**
   * Draw terrain-specific pattern inside an isometric diamond.
   */
  const drawIsometricTerrainPattern = (
    ctx: CanvasRenderingContext2D,
    gridX: number, gridY: number,
    terrain: TerrainType,
    angle: CameraAngle,
    gridW: number, gridH: number, cellSize: number,
    elevation: number = 0
  ) => {
    const diamond = getTileDiamondPoints(gridX, gridY, elevation, angle, gridW, gridH, cellSize)
    const cx = (diamond.top.x + diamond.right.x + diamond.bottom.x + diamond.left.x) / 4
    const cy = (diamond.top.y + diamond.right.y + diamond.bottom.y + diamond.left.y) / 4

    ctx.save()

    // Clip to diamond
    ctx.beginPath()
    ctx.moveTo(diamond.top.x, diamond.top.y)
    ctx.lineTo(diamond.right.x, diamond.right.y)
    ctx.lineTo(diamond.bottom.x, diamond.bottom.y)
    ctx.lineTo(diamond.left.x, diamond.left.y)
    ctx.closePath()
    ctx.clip()

    const halfW = (diamond.right.x - diamond.left.x) / 2
    const halfH = (diamond.bottom.y - diamond.top.y) / 2

    switch (terrain) {
      case 'blocking': {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx - halfW * 0.5, cy - halfH * 0.5)
        ctx.lineTo(cx + halfW * 0.5, cy + halfH * 0.5)
        ctx.moveTo(cx + halfW * 0.5, cy - halfH * 0.5)
        ctx.lineTo(cx - halfW * 0.5, cy + halfH * 0.5)
        ctx.stroke()
        break
      }
      case 'water': {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = -1; i <= 1; i++) {
          const waveY = cy + i * halfH * 0.35
          ctx.moveTo(cx - halfW * 0.6, waveY)
          ctx.quadraticCurveTo(cx - halfW * 0.2, waveY - 3, cx, waveY)
          ctx.quadraticCurveTo(cx + halfW * 0.2, waveY + 3, cx + halfW * 0.6, waveY)
        }
        ctx.stroke()
        break
      }
      case 'hazard': {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.beginPath()
        ctx.moveTo(cx, cy - halfH * 0.4)
        ctx.lineTo(cx - halfW * 0.3, cy + halfH * 0.3)
        ctx.lineTo(cx + halfW * 0.3, cy + halfH * 0.3)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = 'rgba(255, 69, 0, 0.8)'
        ctx.font = 'bold 9px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('!', cx, cy + halfH * 0.05)
        break
      }
      case 'elevated': {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx, cy - halfH * 0.4)
        ctx.lineTo(cx, cy + halfH * 0.4)
        ctx.moveTo(cx - halfW * 0.2, cy - halfH * 0.15)
        ctx.lineTo(cx, cy - halfH * 0.4)
        ctx.lineTo(cx + halfW * 0.2, cy - halfH * 0.15)
        ctx.stroke()
        break
      }
      case 'earth': {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(cx, cy + halfH * 0.4)
        ctx.lineTo(cx, cy - halfH * 0.4)
        ctx.moveTo(cx - halfW * 0.2, cy + halfH * 0.15)
        ctx.lineTo(cx, cy + halfH * 0.4)
        ctx.lineTo(cx + halfW * 0.2, cy + halfH * 0.15)
        ctx.stroke()
        break
      }
    }

    ctx.restore()
  }

  // --- Measurement ---

  /**
   * Draw a dashed diamond outline around a multi-cell token footprint.
   * Highlights the full NxN footprint by drawing each cell's diamond border.
   */
  const drawDashedFootprint = (
    ctx: CanvasRenderingContext2D,
    origin: GridPosition, size: number,
    angle: CameraAngle, gridW: number, gridH: number, cellSize: number,
    strokeColor: string
  ) => {
    ctx.save()
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        const diamond = getTileDiamondPoints(origin.x + dx, origin.y + dy, 0, angle, gridW, gridH, cellSize)
        ctx.beginPath()
        ctx.moveTo(diamond.top.x, diamond.top.y)
        ctx.lineTo(diamond.right.x, diamond.right.y)
        ctx.lineTo(diamond.bottom.x, diamond.bottom.y)
        ctx.lineTo(diamond.left.x, diamond.left.y)
        ctx.closePath()
        ctx.stroke()
      }
    }
    ctx.setLineDash([])
    ctx.restore()
  }

  const drawMeasurementOverlay = (ctx: CanvasRenderingContext2D) => {
    if (!options.measurementMode || !options.measurementCells) return
    const config = options.config.value
    const angle = options.cameraAngle.value
    const { cellSize, width: gridW, height: gridH } = config
    const mode = options.measurementMode.value
    const cells = options.measurementCells.value
    const origin = options.measurementOrigin?.value
    const end = options.measurementEnd?.value
    const distance = options.measurementDistance?.value ?? 0

    // Token metadata for multi-cell endpoints
    const startTokenOrigin = options.measurementStartTokenOrigin?.value ?? null
    const startTokenSize = options.measurementStartTokenSize?.value ?? 1
    const endTokenOrigin = options.measurementEndTokenOrigin?.value ?? null
    const endTokenSize = options.measurementEndTokenSize?.value ?? 1

    const color = MEASUREMENT_COLORS[mode] || MEASUREMENT_COLORS.distance

    // Draw affected cells
    for (const cell of cells) {
      if (cell.x >= 0 && cell.x < gridW && cell.y >= 0 && cell.y < gridH) {
        drawFilledDiamond(ctx, cell.x, cell.y, 0, angle, gridW, gridH, cellSize, color.fill)

        const diamond = getTileDiamondPoints(cell.x, cell.y, 0, angle, gridW, gridH, cellSize)
        ctx.beginPath()
        ctx.moveTo(diamond.top.x, diamond.top.y)
        ctx.lineTo(diamond.right.x, diamond.right.y)
        ctx.lineTo(diamond.bottom.x, diamond.bottom.y)
        ctx.lineTo(diamond.left.x, diamond.left.y)
        ctx.closePath()
        ctx.strokeStyle = color.stroke
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    // Highlight full footprint of multi-cell tokens hit by the AoE
    if (mode !== 'distance' && cells.length > 0 && options.tokens && options.isTargetHitByAoE) {
      const hitTokens = options.tokens.value.filter(token =>
        token.size > 1 && options.isTargetHitByAoE!(token.position, token.size, cells)
      )
      for (const token of hitTokens) {
        drawDashedFootprint(ctx, token.position, token.size, angle, gridW, gridH, cellSize, 'rgba(255, 255, 255, 0.9)')
      }
    }

    // Calculate origin center — accounts for multi-cell token footprint
    const originAnchor = startTokenOrigin ?? origin
    const originCenterWx = originAnchor ? originAnchor.x + startTokenSize / 2 : 0
    const originCenterWy = originAnchor ? originAnchor.y + startTokenSize / 2 : 0

    // Draw origin marker centered on token footprint
    if (origin) {
      const originScreen = worldToScreen(originCenterWx, originCenterWy, 0, angle, gridW, gridH, cellSize)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(originScreen.px, originScreen.py, 4, 0, Math.PI * 2)
      ctx.fill()

      // Draw dashed outline around multi-cell start token
      if (startTokenSize > 1 && startTokenOrigin) {
        drawDashedFootprint(ctx, startTokenOrigin, startTokenSize, angle, gridW, gridH, cellSize, 'rgba(255, 255, 255, 0.6)')
      }
    }

    // Draw distance line for distance mode
    if (mode === 'distance' && origin && end) {
      // Calculate end center — accounts for multi-cell token footprint
      const endAnchor = endTokenOrigin ?? end
      const endCenterWx = endAnchor.x + endTokenSize / 2
      const endCenterWy = endAnchor.y + endTokenSize / 2

      const fromScreen = worldToScreen(originCenterWx, originCenterWy, 0, angle, gridW, gridH, cellSize)
      const toScreen = worldToScreen(endCenterWx, endCenterWy, 0, angle, gridW, gridH, cellSize)

      ctx.save()
      ctx.strokeStyle = 'rgba(59, 130, 246, 1)'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(fromScreen.px, fromScreen.py)
      ctx.lineTo(toScreen.px, toScreen.py)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw dashed outline around multi-cell end token
      if (endTokenSize > 1 && endTokenOrigin) {
        drawDashedFootprint(ctx, endTokenOrigin, endTokenSize, angle, gridW, gridH, cellSize, 'rgba(59, 130, 246, 0.6)')
      }

      if (distance > 0) {
        const midX = (fromScreen.px + toScreen.px) / 2
        const midY = (fromScreen.py + toScreen.py) / 2 - 12
        const label = `${distance}m`
        ctx.font = 'bold 12px sans-serif'
        const metrics = ctx.measureText(label)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillRect(midX - metrics.width / 2 - 4, midY - 8, metrics.width + 8, 16)
        ctx.fillStyle = color.stroke
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, midX, midY)
      }

      ctx.restore()
    }
  }

  return {
    drawFogOfWar,
    drawFogOfWarPreview,
    drawTerrainLayer,
    drawMeasurementOverlay,
    // Expose primitives for potential reuse
    drawFilledDiamond,
    drawDiamondCenterDot,
  }
}
