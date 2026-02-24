import type { GridConfig, GridPosition, CameraAngle, Combatant, MovementPreview, Pokemon, HumanCharacter, CombatSide } from '~/types'
import { useIsometricProjection } from '~/composables/useIsometricProjection'

// Constants
const GRID_LINE_COLOR = 'rgba(255, 255, 255, 0.25)'
const GRID_LINE_WIDTH = 1
const GRID_FILL_COLOR = 'rgba(26, 26, 46, 0.4)'
const LABEL_FONT_SIZE = 9
const LABEL_COLOR = 'rgba(255, 255, 255, 0.3)'
const CANVAS_BG_COLOR = '#1a1a2e'

// Token rendering constants
const HOVER_FILL = 'rgba(0, 255, 255, 0.15)'
const HOVER_STROKE = 'rgba(0, 255, 255, 0.5)'
const MOVEMENT_RANGE_FILL = 'rgba(0, 255, 150, 0.15)'
const MOVEMENT_RANGE_STROKE = 'rgba(0, 255, 150, 0.3)'
const VALID_MOVE_COLOR = 'rgba(0, 255, 255, 0.6)'
const INVALID_MOVE_COLOR = 'rgba(255, 80, 80, 0.6)'
const SELECTION_GLOW_COLOR = 'rgba(0, 255, 255, 0.8)'
const MULTI_SELECT_DASH_COLOR = 'rgba(0, 200, 200, 0.6)'
const ELEVATION_BADGE_BG = 'rgba(0, 0, 0, 0.7)'
const ELEVATION_BADGE_COLOR = '#00ffcc'
const HP_HIGH = '#22c55e'
const HP_MEDIUM = '#f59e0b'
const HP_LOW = '#ef4444'
const SIDE_COLORS: Record<CombatSide, string> = {
  players: '#4ade80',
  allies: '#60a5fa',
  enemies: '#f87171',
}
const TURN_GLOW_SIZE = 8

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
  elevation?: number
}

interface UseIsometricRenderingOptions {
  canvasRef: Ref<HTMLCanvasElement | null>
  containerRef: Ref<HTMLDivElement | null>
  config: Ref<GridConfig>
  zoom: Ref<number>
  panOffset: Ref<{ x: number; y: number }>
  cameraAngle: Ref<CameraAngle>
  isRotating: Ref<boolean>
  // P1 additions
  tokens?: Ref<TokenData[]>
  combatants?: Ref<Combatant[]>
  currentTurnId?: Ref<string | undefined>
  selectedTokenId?: Ref<string | null>
  hoveredCell?: Ref<GridPosition | null>
  movingTokenId?: Ref<string | null>
  movementPreview?: Ref<MovementPreview | null>
  movementRangeCells?: Ref<GridPosition[]>
  getTokenElevation?: (combatantId: string) => number
  /** Terrain elevation lookup for movement preview arrow destination. */
  getTerrainElevation?: (x: number, y: number) => number
}

// Sprite cache to avoid re-loading images every frame.
// Module-level but with explicit clear function to prevent unbounded growth.
const spriteCache = new Map<string, HTMLImageElement | null>()

// Maximum cache size before evicting oldest entries
const SPRITE_CACHE_MAX = 200

/**
 * Clear the sprite cache. Called from onUnmounted to prevent memory leaks
 * across encounter changes.
 */
export function clearSpriteCache(): void {
  spriteCache.clear()
}

/**
 * Isometric grid rendering composable.
 * P0: diamond grid cells, coordinate labels, background image projection.
 * P1: token rendering (billboarded sprites), hover highlight, movement range,
 *     movement preview arrow, selection glow, elevation badges.
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
   * Load a sprite image into the cache. Returns the cached image if available,
   * null if still loading or failed. Triggers a re-render when the image loads
   * so tokens update from fallback circles to actual sprites.
   * Evicts oldest entries when cache exceeds SPRITE_CACHE_MAX.
   */
  const loadSprite = (url: string): HTMLImageElement | null => {
    if (spriteCache.has(url)) return spriteCache.get(url) || null

    // Evict oldest entries if cache is full
    if (spriteCache.size >= SPRITE_CACHE_MAX) {
      const firstKey = spriteCache.keys().next().value
      if (firstKey !== undefined) {
        spriteCache.delete(firstKey)
      }
    }

    const img = new Image()
    img.onload = () => {
      spriteCache.set(url, img)
      scheduleRender()
    }
    img.onerror = () => {
      spriteCache.set(url, null)
    }
    spriteCache.set(url, null) // Mark as loading
    img.src = url
    return null
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

    // Draw movement range overlay
    if (options.movementRangeCells?.value && options.movementRangeCells.value.length > 0) {
      drawMovementRange(ctx, options.movementRangeCells.value, angle, gridW, gridH, cellSize)
    }

    // Draw hover cell highlight
    if (options.hoveredCell?.value && isInBounds(options.hoveredCell.value, gridW, gridH)) {
      drawCellHighlight(ctx, options.hoveredCell.value, 0, angle, gridW, gridH, cellSize, HOVER_FILL, HOVER_STROKE)
    }

    // Draw tokens (depth-sorted)
    drawTokens(ctx, angle, gridW, gridH, cellSize)

    // Draw movement preview arrow
    if (options.movementPreview?.value) {
      drawMovementArrow(ctx, options.movementPreview.value, angle, gridW, gridH, cellSize)
    }

    ctx.restore()
  }

  // --- P0 drawing functions ---

  /**
   * Draw the background image projected onto the isometric ground plane.
   */
  const drawBackgroundImage = (
    ctx: CanvasRenderingContext2D,
    config: GridConfig,
    angle: CameraAngle
  ) => {
    const { cellSize, width: gridW, height: gridH } = config
    const img = backgroundImage.value
    if (!img) return

    const topLeft = worldToScreen(0, 0, 0, angle, gridW, gridH, cellSize)
    const topRight = worldToScreen(gridW, 0, 0, angle, gridW, gridH, cellSize)
    const bottomRight = worldToScreen(gridW, gridH, 0, angle, gridW, gridH, cellSize)
    const bottomLeft = worldToScreen(0, gridH, 0, angle, gridW, gridH, cellSize)

    ctx.save()

    ctx.beginPath()
    ctx.moveTo(topLeft.px, topLeft.py)
    ctx.lineTo(topRight.px, topRight.py)
    ctx.lineTo(bottomRight.px, bottomRight.py)
    ctx.lineTo(bottomLeft.px, bottomLeft.py)
    ctx.closePath()
    ctx.clip()

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
   * Draw the isometric grid cells in depth order.
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

    // Coordinate label
    if (cellSize >= 30) {
      const centerX = (diamond.top.x + diamond.right.x + diamond.bottom.x + diamond.left.x) / 4
      const centerY = (diamond.top.y + diamond.right.y + diamond.bottom.y + diamond.left.y) / 4

      ctx.fillStyle = LABEL_COLOR
      ctx.font = `${LABEL_FONT_SIZE}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${gridX},${gridY}`, centerX, centerY)
    }
  }

  // --- P1 drawing functions ---

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
   * Draw all tokens in depth order (painter's algorithm).
   * Sprites are billboarded: drawn upright regardless of camera rotation.
   */
  const drawTokens = (
    ctx: CanvasRenderingContext2D,
    angle: CameraAngle,
    gridW: number,
    gridH: number,
    cellSize: number
  ) => {
    const tokens = options.tokens?.value
    const combatants = options.combatants?.value
    if (!tokens || tokens.length === 0) return

    // Sort tokens by depth for correct draw order
    const tokensWithDepth = tokens.map(token => {
      const elevation = options.getTokenElevation
        ? options.getTokenElevation(token.combatantId)
        : (token.elevation ?? 0)
      const { rx, ry } = rotateCoords(token.position.x, token.position.y, angle, gridW, gridH)
      return { token, depth: rx + ry + elevation, elevation }
    })
    tokensWithDepth.sort((a, b) => a.depth - b.depth)

    for (const { token, elevation } of tokensWithDepth) {
      const combatant = combatants?.find(c => c.id === token.combatantId)
      drawSingleToken(ctx, token, combatant, elevation, angle, gridW, gridH, cellSize)
    }
  }

  /**
   * Draw a single token as a billboarded sprite in isometric space.
   */
  const drawSingleToken = (
    ctx: CanvasRenderingContext2D,
    token: TokenData,
    combatant: Combatant | undefined,
    elevation: number,
    angle: CameraAngle,
    gridW: number,
    gridH: number,
    cellSize: number
  ) => {
    // Calculate token center in isometric screen space
    const centerGridX = token.position.x + token.size / 2
    const centerGridY = token.position.y + token.size / 2
    const screenPos = worldToScreen(centerGridX, centerGridY, elevation, angle, gridW, gridH, cellSize)

    // Token dimensions in screen space
    const tokenW = cellSize * token.size * 0.9
    const tokenH = cellSize * token.size * 1.1 // Slightly taller for sprite
    const drawX = screenPos.px - tokenW / 2
    const drawY = screenPos.py - tokenH * 0.8 // Offset up so token sits on diamond

    const isCurrentTurn = options.currentTurnId?.value === token.combatantId
    const isSelected = options.selectedTokenId?.value === token.combatantId
    const side: CombatSide = combatant?.side ?? 'enemies'

    // Turn glow
    if (isCurrentTurn) {
      ctx.save()
      ctx.shadowColor = SIDE_COLORS[side]
      ctx.shadowBlur = TURN_GLOW_SIZE
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      // Draw a subtle glow circle behind the token
      ctx.beginPath()
      ctx.arc(screenPos.px, screenPos.py - tokenH * 0.3, tokenW / 2, 0, Math.PI * 2)
      ctx.fillStyle = `${SIDE_COLORS[side]}33`
      ctx.fill()
      ctx.restore()
    }

    // Selection highlight
    if (isSelected) {
      ctx.save()
      ctx.strokeStyle = SELECTION_GLOW_COLOR
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.strokeRect(drawX - 2, drawY - 2, tokenW + 4, tokenH + 4)
      ctx.restore()
    }

    // Draw sprite (billboarded — always upright)
    const sprite = combatant ? getTokenSprite(combatant) : null
    if (sprite) {
      ctx.drawImage(sprite, drawX, drawY, tokenW, tokenH)
    } else {
      // Fallback: colored circle with initial
      ctx.fillStyle = SIDE_COLORS[side]
      ctx.beginPath()
      ctx.arc(screenPos.px, screenPos.py - tokenH * 0.3, tokenW / 3, 0, Math.PI * 2)
      ctx.fill()

      // Initial letter
      const initial = combatant
        ? getTokenDisplayName(combatant).charAt(0).toUpperCase()
        : '?'
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${Math.round(cellSize * 0.4)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(initial, screenPos.px, screenPos.py - tokenH * 0.3)
    }

    // HP bar below sprite
    if (combatant) {
      drawTokenHpBar(ctx, combatant, screenPos.px, drawY + tokenH + 2, tokenW)
    }

    // Name label above sprite
    if (combatant && (isSelected || isCurrentTurn)) {
      drawTokenLabel(ctx, combatant, screenPos.px, drawY - 4, cellSize)
    }

    // Size badge for multi-cell tokens
    if (token.size > 1) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      const badgeW = 22
      const badgeH = 14
      const badgeX = drawX + 2
      const badgeY = drawY + 2
      ctx.fillRect(badgeX, badgeY, badgeW, badgeH)
      ctx.fillStyle = '#ccc'
      ctx.font = '8px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${token.size}x${token.size}`, badgeX + badgeW / 2, badgeY + badgeH / 2)
    }

    // Elevation badge
    if (elevation > 0) {
      const badgeX = drawX + tokenW - 2
      const badgeY = drawY + 2
      const badgeW = 20
      const badgeH = 14

      ctx.fillStyle = ELEVATION_BADGE_BG
      ctx.fillRect(badgeX - badgeW, badgeY, badgeW, badgeH)
      ctx.fillStyle = ELEVATION_BADGE_COLOR
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`Z${elevation}`, badgeX - badgeW / 2, badgeY + badgeH / 2)
    }
  }

  /**
   * Draw HP bar below token.
   */
  const drawTokenHpBar = (
    ctx: CanvasRenderingContext2D,
    combatant: Combatant,
    centerX: number,
    topY: number,
    width: number
  ) => {
    const current = combatant.entity.currentHp
    const max = combatant.entity.maxHp
    if (max <= 0) return

    const percent = Math.max(0, Math.min(1, current / max))
    const barW = width * 0.8
    const barH = 4
    const barX = centerX - barW / 2
    const barY = topY

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(barX, barY, barW, barH)

    // Fill
    if (percent > 0.5) {
      ctx.fillStyle = HP_HIGH
    } else if (percent > 0.25) {
      ctx.fillStyle = HP_MEDIUM
    } else {
      ctx.fillStyle = HP_LOW
    }
    ctx.fillRect(barX, barY, barW * percent, barH)
  }

  /**
   * Draw name label above token.
   */
  const drawTokenLabel = (
    ctx: CanvasRenderingContext2D,
    combatant: Combatant,
    centerX: number,
    bottomY: number,
    cellSize: number
  ) => {
    const name = getTokenDisplayName(combatant)
    const level = combatant.entity.level

    ctx.font = `bold ${Math.round(cellSize * 0.25)}px sans-serif`
    const textMetrics = ctx.measureText(`${name} Lv.${level}`)
    const textW = textMetrics.width + 8
    const textH = Math.round(cellSize * 0.3) + 4

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    const bgX = centerX - textW / 2
    const bgY = bottomY - textH
    ctx.fillRect(bgX, bgY, textW, textH)

    // Text
    ctx.fillStyle = '#fff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${name} Lv.${level}`, centerX, bgY + textH / 2)
  }

  /**
   * Draw movement preview arrow in isometric space.
   */
  const drawMovementArrow = (
    ctx: CanvasRenderingContext2D,
    preview: MovementPreview,
    angle: CameraAngle,
    gridW: number,
    gridH: number,
    cellSize: number
  ) => {
    const fromElev = options.getTokenElevation
      ? options.getTokenElevation(preview.combatantId)
      : 0
    const toElev = options.getTerrainElevation
      ? options.getTerrainElevation(preview.toPosition.x, preview.toPosition.y)
      : 0

    const from = worldToScreen(
      preview.fromPosition.x + 0.5,
      preview.fromPosition.y + 0.5,
      fromElev,
      angle, gridW, gridH, cellSize
    )
    const to = worldToScreen(
      preview.toPosition.x + 0.5,
      preview.toPosition.y + 0.5,
      toElev,
      angle, gridW, gridH, cellSize
    )

    const color = preview.isValid ? VALID_MOVE_COLOR : INVALID_MOVE_COLOR

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

  // --- Helper functions ---

  /**
   * Get display name for a combatant.
   */
  const getTokenDisplayName = (combatant: Combatant): string => {
    if (combatant.type === 'pokemon') {
      const pokemon = combatant.entity as Pokemon
      return pokemon.nickname || pokemon.species
    }
    return (combatant.entity as HumanCharacter).name
  }

  /**
   * Get sprite image for a combatant from cache, triggering load if needed.
   */
  const getTokenSprite = (combatant: Combatant): HTMLImageElement | null => {
    if (combatant.type === 'pokemon') {
      const pokemon = combatant.entity as Pokemon
      const species = pokemon.species.toLowerCase()
      const shiny = pokemon.shiny ? '-shiny' : ''
      const url = `/sprites/pokemon/${species}${shiny}.png`
      return loadSprite(url)
    }
    // Human characters: use avatar URL if available
    const human = combatant.entity as HumanCharacter
    if (human.avatarUrl) {
      return loadSprite(human.avatarUrl)
    }
    return null
  }

  /**
   * Check if position is within grid bounds.
   */
  const isInBounds = (pos: GridPosition, gridW: number, gridH: number): boolean => {
    return pos.x >= 0 && pos.x < gridW && pos.y >= 0 && pos.y < gridH
  }

  return {
    render,
    scheduleRender,
    loadBackgroundImage,
    backgroundImage
  }
}
