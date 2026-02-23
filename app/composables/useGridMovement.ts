import type { GridPosition, Combatant, Pokemon } from '~/types'
import { useTerrainStore } from '~/stores/terrain'
import { useRangeParser, type TerrainCostGetter } from '~/composables/useRangeParser'

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
 * Check whether a combatant has Swim capability (swim speed > 0).
 * Pokemon have capabilities.swim; humans default to 0 (no swim).
 */
function combatantCanSwim(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.swim ?? 0) > 0
  }
  return false
}

/**
 * Check whether a combatant has Burrow capability (burrow speed > 0).
 * Pokemon have capabilities.burrow; humans default to 0 (no burrow).
 */
function combatantCanBurrow(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.burrow ?? 0) > 0
  }
  return false
}

/**
 * Check whether a combatant has Sky capability (sky speed > 0).
 * Flying Pokemon ignore elevation cost within their Sky speed range.
 */
function combatantCanFly(combatant: Combatant): boolean {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return (pokemon.capabilities?.sky ?? 0) > 0
  }
  return false
}

/**
 * Get a combatant's Sky speed. Returns 0 for non-flying combatants.
 */
function getSkySpeed(combatant: Combatant): number {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.capabilities?.sky ?? 0
  }
  return 0
}

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
    const dx = Math.abs(to.x - from.x)
    const dy = Math.abs(to.y - from.y)
    const diagonals = Math.min(dx, dy)
    const straights = Math.abs(dx - dy)
    // Diagonal cost: 1 + 2 + 1 + 2... = diagonals + floor(diagonals / 2)
    const diagonalCost = diagonals + Math.floor(diagonals / 2)
    return diagonalCost + straights
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
   * Get blocked cells (cells occupied by other tokens)
   */
  const getBlockedCells = (excludeCombatantId?: string): GridPosition[] => {
    const blocked: GridPosition[] = []
    options.tokens.value.forEach(token => {
      if (token.combatantId === excludeCombatantId) return
      // Add all cells occupied by this token
      for (let dx = 0; dx < token.size; dx++) {
        for (let dy = 0; dy < token.size; dy++) {
          blocked.push({
            x: token.position.x + dx,
            y: token.position.y + dy
          })
        }
      }
    })
    return blocked
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
   * Calculate the terrain-aware path cost between two positions.
   * Uses A* pathfinding with PTU diagonal rules and terrain costs.
   * Returns the cost and path, or null if no valid path exists.
   */
  const calculateTerrainAwarePathCost = (
    from: GridPosition,
    to: GridPosition,
    combatantId: string
  ): { cost: number; path: GridPosition[] } | null => {
    const blockedCells = getBlockedCells(combatantId)
    const terrainCostGetter = getTerrainCostGetter(combatantId)
    return calculatePathCost(from, to, blockedCells, terrainCostGetter)
  }

  /**
   * Check if a move is valid, accounting for terrain costs, elevation, and combatant capabilities.
   *
   * Uses terrain-aware pathfinding (A*) when terrain is present on the grid.
   * Falls back to geometric distance when no terrain exists (for performance).
   *
   * Elevation cost: 1 MP per level of elevation change (additive to XY movement cost).
   * Flying Pokemon (Sky speed > 0) ignore elevation cost within their Sky speed range.
   *
   * - Slow/difficult terrain costs 2 movement per cell
   * - Blocking terrain prevents movement through it
   * - Water terrain blocks non-swimming combatants
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
    const blockedCells = getBlockedCells(combatantId)
    const isBlocked = blockedCells.some(b => b.x === toPos.x && b.y === toPos.y)
    const inBounds = toPos.x >= 0 && toPos.x < gridWidth && toPos.y >= 0 && toPos.y < gridHeight

    if (isBlocked || !inBounds) {
      const geometricDistance = calculateMoveDistance(fromPos, toPos)
      return {
        valid: false,
        distance: geometricDistance,
        blocked: isBlocked
      }
    }

    // Calculate elevation cost (if elevation callbacks are provided)
    let elevCost = 0
    if (options.getTokenElevation && options.getTerrainElevation) {
      const fromZ = options.getTokenElevation(combatantId)
      const toZ = options.getTerrainElevation(toPos.x, toPos.y)
      const combatant = findCombatant(combatantId)
      elevCost = calculateElevationCost(fromZ, toZ, combatant)
    }

    const terrainCostGetter = getTerrainCostGetter(combatantId)

    if (terrainCostGetter) {
      // Terrain-aware: use A* pathfinding
      const pathResult = calculatePathCost(fromPos, toPos, blockedCells, terrainCostGetter)
      if (!pathResult) {
        // No valid path (terrain blocks all routes)
        const geometricDistance = calculateMoveDistance(fromPos, toPos)
        return {
          valid: false,
          distance: geometricDistance + elevCost,
          blocked: true // Effectively blocked by terrain
        }
      }
      const totalCost = pathResult.cost + elevCost
      return {
        valid: totalCost > 0 && totalCost <= speed,
        distance: totalCost,
        blocked: false
      }
    }

    // No terrain: fast geometric check + elevation cost
    const distance = calculateMoveDistance(fromPos, toPos)
    const totalDistance = distance + elevCost
    return {
      valid: totalDistance > 0 && totalDistance <= speed,
      distance: totalDistance,
      blocked: false
    }
  }

  return {
    calculateMoveDistance,
    calculateTerrainAwarePathCost,
    getSpeed,
    getBlockedCells,
    getTerrainCostAt,
    getTerrainCostForCombatant,
    getTerrainCostGetter,
    isValidMove,
    findCombatant,
    DEFAULT_MOVEMENT_SPEED
  }
}
