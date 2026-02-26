import type { GridPosition, Combatant, Pokemon, TerrainCostGetter, ElevationCostGetter, TerrainElevationGetter } from '~/types'
import { useTerrainStore } from '~/stores/terrain'
import { useRangeParser } from '~/composables/useRangeParser'
import { combatantCanSwim, combatantCanBurrow, combatantCanFly, getSkySpeed } from '~/utils/combatantCapabilities'
import { ptuDiagonalDistance } from '~/utils/gridDistance'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
}

interface UseGridMovementOptions {
  tokens: Ref<TokenData[]>
  getMovementSpeed?: (combatantId: string) => number
  getCombatant?: (combatantId: string) => Combatant | undefined
  /** Optional elevation lookup for isometric mode. Returns 0 if not provided. */
  getTokenElevation?: (combatantId: string) => number
  /** Optional terrain elevation lookup for isometric mode. Returns 0 if not provided. */
  getTerrainElevation?: (x: number, y: number) => number
}

const DEFAULT_MOVEMENT_SPEED = 5

/**
 * Calculate the elevation change cost between two Z-levels.
 * Cost: 1 movement point per level of elevation change (up or down).
 * Flying Pokemon (Sky speed > 0) ignore elevation cost within their Sky speed range.
 *
 * @param fromZ - Starting elevation
 * @param toZ - Destination elevation
 * @param combatant - Optional combatant for Sky speed check
 * @returns Movement point cost for the elevation change
 */
export function calculateElevationCost(
  fromZ: number,
  toZ: number,
  combatant?: Combatant
): number {
  const dz = Math.abs(toZ - fromZ)
  if (dz === 0) return 0

  // Flying Pokemon ignore elevation cost within Sky speed range
  if (combatant && combatantCanFly(combatant)) {
    const sky = getSkySpeed(combatant)
    if (dz <= sky) return 0
    // Exceeds Sky speed: pay for the excess
    return dz - sky
  }

  return dz
}

/**
 * Get the appropriate movement speed for a combatant based on terrain context.
 * Returns Swim speed for water terrain, Burrow speed for earth terrain,
 * and Overland speed for all other terrain types.
 */
function getTerrainAwareSpeed(combatant: Combatant, terrainType: string): number {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    const caps = pokemon.capabilities
    if (!caps) return DEFAULT_MOVEMENT_SPEED

    if (terrainType === 'water' && caps.swim > 0) {
      return caps.swim
    }
    if (terrainType === 'earth' && caps.burrow > 0) {
      return caps.burrow
    }
    return caps.overland || DEFAULT_MOVEMENT_SPEED
  }

  // Human characters use default (no capabilities interface yet)
  return DEFAULT_MOVEMENT_SPEED
}

/**
 * Apply movement-modifying conditions and combat stage effects to base speed.
 *
 * Exported as a pure function for direct unit testing.
 *
 * PTU Rules:
 * - Stuck: cannot Shift at all — effective speed 0 (PTU 1.05 p.231)
 * - Slowed: reduce all movement speeds by half
 * - Speed CS: additive bonus/penalty of half stage value (PTU 1.05 p.234), min 2
 * - Sprint (tempCondition): +50% movement speed for the turn
 */
export function applyMovementModifiers(combatant: Combatant, speed: number): number {
  let modifiedSpeed = speed
  const conditions = combatant.entity.statusConditions ?? []
  const tempConditions = combatant.tempConditions ?? []

  // Stuck: cannot Shift at all (PTU 1.05 p.231, p.253)
  // Early-return so no downstream modifier (Speed CS, Sprint, min floor) can override
  if (conditions.includes('Stuck')) {
    return 0
  }

  // Slowed: reduce all movement speeds by half
  if (conditions.includes('Slowed')) {
    modifiedSpeed = Math.floor(modifiedSpeed / 2)
  }

  // Speed Combat Stage modifier (-6 to +6): additive bonus/penalty
  // PTU 1.05 p.234: "bonus or penalty to all Movement Speeds equal to
  // half your current Speed Combat Stage value rounded down"
  // Math.trunc rounds toward zero for symmetric positive/negative results:
  // +5→+2, -5→-2, +1→0, -1→0 (PTU: "reduces movement equally")
  const speedStage = combatant.entity.stageModifiers?.speed ?? 0
  if (speedStage !== 0) {
    const clamped = Math.max(-6, Math.min(6, speedStage))
    const stageBonus = Math.trunc(clamped / 2)
    modifiedSpeed = modifiedSpeed + stageBonus
    // PTU 1.05 p.700: negative CS may never reduce movement below 2
    if (stageBonus < 0) {
      modifiedSpeed = Math.max(modifiedSpeed, 2)
    }
  }

  // Sprint: +50% movement speed for the turn (tracked as tempCondition)
  if (tempConditions.includes('Sprint')) {
    modifiedSpeed = Math.floor(modifiedSpeed * 1.5)
  }

  // Minimum speed is 1 (can always move at least 1 cell unless at 0)
  return Math.max(modifiedSpeed, speed > 0 ? 1 : 0)
}

export function useGridMovement(options: UseGridMovementOptions) {
  const terrainStore = useTerrainStore()
  const { calculatePathCost, getMovementRangeCells } = useRangeParser()

  /**
   * Calculate distance between two grid positions using PTU diagonal rules.
   * Diagonals alternate: 1m, 2m, 1m, 2m...
   *
   * Note: This is the geometric (no-terrain) distance. For terrain-aware cost,
   * use calculateTerrainAwarePathCost instead.
   */
  const calculateMoveDistance = (from: GridPosition, to: GridPosition): number => {
    return ptuDiagonalDistance(to.x - from.x, to.y - from.y)
  }

  /**
   * Look up a combatant by ID via the provided callback.
   */
  const findCombatant = (combatantId: string): Combatant | undefined => {
    if (options.getCombatant) {
      return options.getCombatant(combatantId)
    }
    return undefined
  }

  /**
   * Get movement speed for a combatant, considering:
   * 1. Terrain-aware speed selection (Swim for water, Burrow for earth, Overland default)
   * 2. Movement-modifying conditions (Stuck, Slowed)
   * 3. Combat stage speed modifier
   * 4. Sprint maneuver (+50%)
   */
  const getSpeed = (combatantId: string): number => {
    const combatant = findCombatant(combatantId)

    // Base speed: use callback if provided, otherwise derive from combatant
    let baseSpeed: number
    if (options.getMovementSpeed) {
      baseSpeed = options.getMovementSpeed(combatantId)
    } else if (combatant) {
      // Select speed based on terrain at combatant's current position
      const token = options.tokens.value.find(t => t.combatantId === combatantId)
      if (token && terrainStore.terrainCount > 0) {
        const terrainType = terrainStore.getTerrainAt(token.position.x, token.position.y)
        baseSpeed = getTerrainAwareSpeed(combatant, terrainType)
      } else if (combatant.type === 'pokemon') {
        const pokemon = combatant.entity as Pokemon
        baseSpeed = pokemon.capabilities?.overland || DEFAULT_MOVEMENT_SPEED
      } else {
        baseSpeed = DEFAULT_MOVEMENT_SPEED
      }
    } else {
      baseSpeed = DEFAULT_MOVEMENT_SPEED
    }

    // Apply movement modifiers from combat state
    if (combatant) {
      baseSpeed = applyMovementModifiers(combatant, baseSpeed)
    }

    return baseSpeed
  }

  /**
   * Get blocked cells for pathfinding purposes.
   *
   * Per decree-003 (PTU p.231): All tokens are passable — no token blocks
   * movement. Enemy-occupied squares count as rough terrain (accuracy
   * penalty only, no movement cost increase). Tokens cannot stack
   * (destination check handled separately by getOccupiedCells).
   *
   * Returns an empty array — no cells are blocked by tokens.
   * Terrain blocking (walls, water, etc.) is handled by the terrain
   * cost getter, not by this function.
   */
  const getBlockedCells = (_excludeCombatantId?: string): GridPosition[] => {
    return []
  }

  /**
   * Get all cells occupied by other tokens (for no-stacking destination check).
   *
   * Per decree-003: Movement cannot end on any occupied square.
   * This list is used to validate the FINAL position only — movement
   * THROUGH these cells is always allowed.
   */
  const getOccupiedCells = (excludeCombatantId?: string): GridPosition[] => {
    const occupied: GridPosition[] = []
    options.tokens.value.forEach(token => {
      if (token.combatantId === excludeCombatantId) return
      for (let dx = 0; dx < token.size; dx++) {
        for (let dy = 0; dy < token.size; dy++) {
          occupied.push({
            x: token.position.x + dx,
            y: token.position.y + dy
          })
        }
      }
    })
    return occupied
  }

  /**
   * Get cells occupied by enemy combatants relative to a given combatant.
   *
   * Per decree-003 (PTU p.231): "Squares occupied by enemies always count
   * as Rough Terrain" — this applies a -2 accuracy penalty when targeting
   * through these squares. This is a DYNAMIC property computed from
   * combatant positions, not stored in the terrain data model.
   *
   * Enemy determination: 'enemies' side vs 'players'/'allies' sides.
   * A combatant on 'enemies' considers 'players' and 'allies' as enemies.
   * A combatant on 'players' or 'allies' considers 'enemies' as enemies.
   */
  const getEnemyOccupiedCells = (combatantId: string): GridPosition[] => {
    const combatant = findCombatant(combatantId)
    if (!combatant) return []

    const isEnemy = (otherCombatantId: string): boolean => {
      const other = findCombatant(otherCombatantId)
      if (!other) return false
      // Same side = not enemy
      if (combatant.side === other.side) return false
      // 'players' and 'allies' are friendly to each other
      if (
        (combatant.side === 'players' || combatant.side === 'allies') &&
        (other.side === 'players' || other.side === 'allies')
      ) {
        return false
      }
      return true
    }

    const enemyCells: GridPosition[] = []
    options.tokens.value.forEach(token => {
      if (token.combatantId === combatantId) return
      if (!isEnemy(token.combatantId)) return
      for (let dx = 0; dx < token.size; dx++) {
        for (let dy = 0; dy < token.size; dy++) {
          enemyCells.push({
            x: token.position.x + dx,
            y: token.position.y + dy
          })
        }
      }
    })
    return enemyCells
  }

  /**
   * Get terrain cost at a position for a specific combatant.
   * Checks the combatant's Swim and Burrow capabilities to determine
   * whether water/earth terrain is passable.
   */
  const getTerrainCostForCombatant = (x: number, y: number, combatantId: string): number => {
    const combatant = findCombatant(combatantId)
    const canSwim = combatant ? combatantCanSwim(combatant) : false
    const canBurrow = combatant ? combatantCanBurrow(combatant) : false
    return terrainStore.getMovementCost(x, y, canSwim, canBurrow)
  }

  /**
   * Get terrain cost at a position (without combatant context).
   * Used by rendering code that needs a generic (x, y) => cost function.
   * Falls back to no-swim, no-burrow for safety.
   */
  const getTerrainCostAt = (x: number, y: number): number => {
    return terrainStore.getMovementCost(x, y, false, false)
  }

  /**
   * Get a combatant-aware terrain cost getter function, or undefined if no terrain is active.
   * Returns undefined when there's no terrain to avoid unnecessary pathfinding overhead.
   * The returned function is bound to the specific combatant's capabilities.
   */
  const getTerrainCostGetter = (combatantId?: string): TerrainCostGetter | undefined => {
    if (terrainStore.terrainCount === 0) return undefined
    if (combatantId) {
      return (x: number, y: number) => getTerrainCostForCombatant(x, y, combatantId)
    }
    return getTerrainCostAt
  }

  /**
   * Build an elevation cost getter bound to a specific combatant.
   * Returns undefined if elevation callbacks are not configured.
   * Flying Pokemon (Sky speed > 0) get reduced elevation cost within their Sky speed range.
   */
  const getElevationCostGetter = (combatantId: string): ElevationCostGetter | undefined => {
    if (!options.getTokenElevation || !options.getTerrainElevation) return undefined
    const combatant = findCombatant(combatantId)
    return (fromZ: number, toZ: number) => calculateElevationCost(fromZ, toZ, combatant)
  }

  /**
   * Get terrain elevation getter, or undefined if not configured.
   */
  const getTerrainElevationGetter = (): TerrainElevationGetter | undefined => {
    return options.getTerrainElevation
  }

  /**
   * Calculate the terrain-aware path cost between two positions.
   * Uses A* pathfinding with PTU diagonal rules, terrain costs, and elevation.
   * Returns the cost and path, or null if no valid path exists.
   *
   * Per decree-003: tokens do not block pathfinding — only terrain blocks.
   */
  const calculateTerrainAwarePathCost = (
    from: GridPosition,
    to: GridPosition,
    combatantId: string
  ): { cost: number; path: GridPosition[] } | null => {
    // No cells blocked by tokens — only terrain blocks pathfinding
    const blockedCells: GridPosition[] = []
    const terrainCostGetter = getTerrainCostGetter(combatantId)
    const elevCostGetter = getElevationCostGetter(combatantId)
    const terrainElevGetter = getTerrainElevationGetter()
    const fromElev = options.getTokenElevation
      ? options.getTokenElevation(combatantId)
      : 0
    return calculatePathCost(
      from, to, blockedCells, terrainCostGetter,
      elevCostGetter, terrainElevGetter, fromElev
    )
  }

  /**
   * Check if a move is valid, accounting for terrain costs, elevation,
   * combatant capabilities, and the no-stacking rule.
   *
   * Per decree-003 (PTU p.231):
   * - All tokens are passable (no movement blocking by tokens)
   * - Enemy-occupied squares count as rough terrain (accuracy penalty only)
   * - Cannot end movement on any occupied square (no stacking)
   *
   * Uses terrain-aware pathfinding (A*) when terrain is present on the grid.
   * Falls back to geometric distance when no terrain exists (for performance).
   *
   * Elevation cost: 1 MP per level of elevation change (additive to XY movement cost).
   * Flying Pokemon (Sky speed > 0) ignore elevation cost within their Sky speed range.
   *
   * - Slow flag on any terrain doubles movement cost per cell
   * - Rough flag on terrain only affects accuracy (no movement cost change)
   * - Blocking terrain prevents movement through it
   * - Water terrain blocks non-swimming combatants (cost 1 with swim per decree-008)
   * - Earth terrain blocks non-burrowing combatants
   * - Movement conditions (Stuck, Slowed) reduce effective speed
   */
  const isValidMove = (
    fromPos: GridPosition,
    toPos: GridPosition,
    combatantId: string,
    gridWidth: number,
    gridHeight: number
  ): { valid: boolean; distance: number; blocked: boolean } => {
    const speed = getSpeed(combatantId)
    const inBounds = toPos.x >= 0 && toPos.x < gridWidth && toPos.y >= 0 && toPos.y < gridHeight

    // No-stacking rule: cannot end movement on any occupied square
    const occupiedCells = getOccupiedCells(combatantId)
    const isOccupied = occupiedCells.some(c => c.x === toPos.x && c.y === toPos.y)

    if (isOccupied || !inBounds) {
      const geometricDistance = calculateMoveDistance(fromPos, toPos)
      return {
        valid: false,
        distance: geometricDistance,
        blocked: isOccupied
      }
    }

    // No cells blocked by tokens — only terrain blocks pathfinding
    const blockedCells: GridPosition[] = []

    // Build elevation-aware cost getters for A* pathfinding
    const elevCostGetter = getElevationCostGetter(combatantId)
    const terrainElevGetter = getTerrainElevationGetter()
    const fromElev = options.getTokenElevation
      ? options.getTokenElevation(combatantId)
      : 0
    const terrainCostGetter = getTerrainCostGetter(combatantId)

    if (terrainCostGetter || elevCostGetter) {
      // Terrain-aware and/or elevation-aware: use A* pathfinding
      const pathResult = calculatePathCost(
        fromPos, toPos, blockedCells, terrainCostGetter,
        elevCostGetter, terrainElevGetter, fromElev
      )
      if (!pathResult) {
        // No valid path (terrain blocks all routes)
        const geometricDistance = calculateMoveDistance(fromPos, toPos)
        return {
          valid: false,
          distance: geometricDistance,
          blocked: true // Effectively blocked by terrain
        }
      }
      return {
        valid: pathResult.cost > 0 && pathResult.cost <= speed,
        distance: pathResult.cost,
        blocked: false
      }
    }

    // No terrain, no elevation: fast geometric check
    const distance = calculateMoveDistance(fromPos, toPos)
    return {
      valid: distance > 0 && distance <= speed,
      distance,
      blocked: false
    }
  }

  return {
    calculateMoveDistance,
    calculateTerrainAwarePathCost,
    getSpeed,
    getBlockedCells,
    getOccupiedCells,
    getEnemyOccupiedCells,
    getTerrainCostAt,
    getTerrainCostForCombatant,
    getTerrainCostGetter,
    isValidMove,
    findCombatant,
    DEFAULT_MOVEMENT_SPEED
  }
}
