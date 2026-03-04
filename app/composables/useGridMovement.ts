import type { GridPosition, Combatant, Pokemon, HumanCharacter, TerrainType, TerrainCostGetter, ElevationCostGetter, TerrainElevationGetter } from '~/types'
import { areAdjacent } from '~/utils/adjacency'
import { AOO_BLOCKING_CONDITIONS } from '~/types/combat'
import { useTerrainStore } from '~/stores/terrain'
import { useEncounterStore } from '~/stores/encounter'
import { useRangeParser } from '~/composables/useRangeParser'
import {
  combatantCanSwim, combatantCanBurrow, combatantCanFly, getSkySpeed,
  getOverlandSpeed, getSwimSpeed, getBurrowSpeed, calculateAveragedSpeed,
  naturewalkBypassesTerrain, getHumanDerivedSpeeds
} from '~/utils/combatantCapabilities'
import { TERRAIN_COSTS, DEFAULT_FLAGS } from '~/stores/terrain'
import { ptuDiagonalDistance } from '~/utils/gridDistance'
import { isEnemySide } from '~/utils/combatSides'
import { getFootprintCells, isFootprintInBounds } from '~/utils/sizeCategory'

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
 *
 * For humans, delegates to getOverlandSpeed/getSwimSpeed which compute from
 * trainer skills (PTU Core p.16).
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

  // Human trainers: derive speeds from skills (PTU Core p.16)
  if (terrainType === 'water') {
    return getSwimSpeed(combatant)
  }
  return getOverlandSpeed(combatant)
}

// Re-export applyMovementModifiers from shared utility for backward compatibility.
// The canonical implementation lives in ~/utils/movementModifiers.ts so both
// client composables and server services can use it without circular imports.
export { applyMovementModifiers } from '~/utils/movementModifiers'

export function useGridMovement(options: UseGridMovementOptions) {
  const terrainStore = useTerrainStore()
  const encounterStore = useEncounterStore()
  const { calculatePathCost, getMovementRangeCells, getMovementRangeCellsWithAveraging } = useRangeParser()

  // P2: Current weather for Thermosensitive movement halving
  const currentWeather = computed(() => encounterStore.encounter?.weather ?? null)

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
   * Get the maximum possible movement speed for a combatant across all capabilities.
   * Used as the exploration budget for A* and flood-fill before averaging is applied.
   *
   * Returns the highest of Overland, Swim (if > 0), and Burrow (if > 0),
   * with movement modifiers applied.
   */
  const getMaxPossibleSpeed = (combatantId: string): number => {
    const combatant = findCombatant(combatantId)
    if (!combatant) return DEFAULT_MOVEMENT_SPEED

    // Mounted combatants use shared movementRemaining (PTU p.218, feature-004)
    // Rider uses mount's movement on trainer turn; mount uses remainder on its turn.
    // movementRemaining already has movement modifiers (Slowed, Speed CS, Sprint)
    // applied when it was set (executeMount / resetCombatantsForNewRound).
    // Returning it directly avoids double-applying modifiers to a shrinking budget.
    if (combatant.mountState) {
      return combatant.mountState.movementRemaining
    }

    // Living Weapon shared movement pool (PTU p.306, feature-005 P2)
    // Wielder and weapon share the wielder's Movement Speed per round.
    // rules-MEDIUM-002: Apply movement modifiers (Slowed, Stuck, Speed CS, Sprint)
    // to the wielder's base speed before computing remaining pool.
    const encounter = encounterStore.encounter
    if (encounter?.wieldRelationships?.length) {
      const wieldRel = encounter.wieldRelationships.find(
        r => r.wielderId === combatantId || r.weaponId === combatantId
      )
      if (wieldRel) {
        const wielder = encounter.combatants.find(c => c.id === wieldRel.wielderId)
        if (wielder) {
          const baseSpeed = getOverlandSpeed(wielder)
          const weather = encounter.weather ?? null
          const modifiedSpeed = applyMovementModifiers(wielder, baseSpeed, weather)
          const remaining = modifiedSpeed - (wieldRel.movementUsedThisRound ?? 0)
          return Math.max(0, remaining)
        }
      }
    }

    if (options.getMovementSpeed) {
      return options.getMovementSpeed(combatantId)
    }

    // For humans, compute overland and swimming from a single derivation call
    // to avoid redundant computeTrainerDerivedStats invocations in the hot path.
    let overland: number
    const speeds: number[] = []

    if (combatant.type === 'human') {
      const humanSpeeds = getHumanDerivedSpeeds(combatant.entity as HumanCharacter)
      overland = humanSpeeds.overland
      speeds.push(overland, humanSpeeds.swimming)
    } else {
      overland = getOverlandSpeed(combatant)
      speeds.push(overland)
      if (combatantCanSwim(combatant)) {
        speeds.push(getSwimSpeed(combatant))
      }
    }
    if (combatantCanBurrow(combatant)) {
      speeds.push(getBurrowSpeed(combatant))
    }

    const maxSpeed = Math.max(...speeds)
    const modifiedSpeed = applyMovementModifiers(combatant, maxSpeed, currentWeather.value)

    // Disengage clamp: when disengaged, movement is limited to 1m (PTU p.241)
    if (combatant.disengaged) {
      return Math.min(modifiedSpeed, 1)
    }

    return modifiedSpeed
  }

  /**
   * Get movement speed for a combatant, considering:
   * 1. Terrain-aware speed selection (Swim for water, Burrow for earth, Overland default)
   * 2. Path-based speed averaging when crossing terrain boundaries (PTU p.231, decree-011)
   * 3. Movement-modifying conditions (Stuck, Tripped, Slowed)
   * 4. Combat stage speed modifier
   * 5. Sprint maneuver (+50%)
   *
   * When called without a path, returns the speed based on the combatant's
   * starting terrain. For movement range display, use getMaxPossibleSpeed
   * with getMovementRangeCellsWithAveraging for accurate averaging.
   */
  const getSpeed = (combatantId: string): number => {
    const combatant = findCombatant(combatantId)

    // Mounted combatants use shared movementRemaining (PTU p.218, feature-004)
    // movementRemaining already has movement modifiers (Slowed, Speed CS, Sprint)
    // applied when it was set (executeMount / resetCombatantsForNewRound).
    // Returning it directly avoids double-applying modifiers to a shrinking budget.
    if (combatant?.mountState) {
      return combatant.mountState.movementRemaining
    }

    // Living Weapon shared movement pool (PTU p.306, feature-005 P2)
    // rules-MEDIUM-002: Apply movement modifiers to wielder's base speed.
    if (combatant) {
      const encounter = encounterStore.encounter
      if (encounter?.wieldRelationships?.length) {
        const wieldRel = encounter.wieldRelationships.find(
          r => r.wielderId === combatantId || r.weaponId === combatantId
        )
        if (wieldRel) {
          const wielder = encounter.combatants.find(c => c.id === wieldRel.wielderId)
          if (wielder) {
            const baseSpeed = getOverlandSpeed(wielder)
            const weather = encounter.weather ?? null
            const modifiedSpeed = applyMovementModifiers(wielder, baseSpeed, weather)
            const remaining = modifiedSpeed - (wieldRel.movementUsedThisRound ?? 0)
            return Math.max(0, remaining)
          }
        }
      }
    }

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
      } else {
        // No terrain data: use Overland speed (computed from skills for humans)
        baseSpeed = getOverlandSpeed(combatant)
      }
    } else {
      baseSpeed = DEFAULT_MOVEMENT_SPEED
    }

    // Apply movement modifiers from combat state (P2: includes Thermosensitive Hail halving)
    if (combatant) {
      baseSpeed = applyMovementModifiers(combatant, baseSpeed, currentWeather.value)
    }

    // Disengage clamp: when disengaged, movement is limited to 1m (PTU p.241)
    if (combatant?.disengaged) {
      return Math.min(baseSpeed, 1)
    }

    return baseSpeed
  }

  /**
   * Compute the averaged speed for a path that crosses terrain boundaries.
   *
   * Per PTU p.231: "When using multiple different Movement Capabilities in one turn,
   * such as using Overland on a beach and then Swim in the water, average the
   * Capabilities and use that value."
   *
   * Per decree-011: Average movement speeds when path crosses terrain boundaries.
   *
   * @param combatantId - The combatant moving
   * @param path - Array of grid positions along the path
   * @returns The averaged speed with movement modifiers applied, or the standard speed if no mixing
   */
  const getAveragedSpeedForPath = (combatantId: string, path: GridPosition[]): number => {
    const combatant = findCombatant(combatantId)
    if (!combatant || terrainStore.terrainCount === 0) {
      return getSpeed(combatantId)
    }

    // If the external callback overrides speed, no averaging
    if (options.getMovementSpeed) {
      return options.getMovementSpeed(combatantId)
    }

    // Collect distinct terrain types along the path, iterating full
    // NxN footprint at each position for multi-cell tokens
    const movingToken = options.tokens.value.find(t => t.combatantId === combatantId)
    const tokenSize = movingToken?.size || 1
    const terrainTypes = new Set<string>()
    for (const pos of path) {
      for (let fx = 0; fx < tokenSize; fx++) {
        for (let fy = 0; fy < tokenSize; fy++) {
          terrainTypes.add(terrainStore.getTerrainAt(pos.x + fx, pos.y + fy))
        }
      }
    }

    // Calculate averaged base speed from terrain types
    const averagedBase = calculateAveragedSpeed(combatant, terrainTypes)

    // Apply movement modifiers (Stuck, Tripped, Slowed, Speed CS, Sprint, P2: Thermosensitive)
    return applyMovementModifiers(combatant, averagedBase, currentWeather.value)
  }

  /**
   * Build a speed averaging callback for the flood-fill pathfinding.
   * Returns a function that, given a set of terrain types, returns the
   * averaged speed with movement modifiers applied.
   *
   * Used by getMovementRangeCellsWithAveraging to constrain movement range
   * based on terrain types encountered along each path.
   */
  const buildSpeedAveragingFn = (combatantId: string): ((terrainTypes: Set<string>) => number) => {
    const combatant = findCombatant(combatantId)
    if (!combatant) {
      return () => DEFAULT_MOVEMENT_SPEED
    }
    return (terrainTypes: Set<string>) => {
      const averagedBase = calculateAveragedSpeed(combatant, terrainTypes)
      return applyMovementModifiers(combatant, averagedBase, currentWeather.value)
    }
  }

  /**
   * Get the terrain type at a position (for speed averaging terrain detection).
   */
  const getTerrainTypeAt = (x: number, y: number): TerrainType => {
    return terrainStore.getTerrainAt(x, y)
  }

  /**
   * Get all cells occupied by other tokens (for no-stacking destination check).
   *
   * Per decree-003: Movement cannot end on any occupied square.
   * This list is used to validate the FINAL position only — movement
   * THROUGH these cells is always allowed.
   *
   * Multi-cell tokens: iterates token.size for dx/dy to include all
   * cells in the NxN footprint. Verified correct for P0 multi-tile.
   */
  const getOccupiedCells = (excludeCombatantId?: string): GridPosition[] => {
    const occupied: GridPosition[] = []
    options.tokens.value.forEach(token => {
      if (token.combatantId === excludeCombatantId) return
      const cells = getFootprintCells(token.position.x, token.position.y, token.size)
      cells.forEach(cell => occupied.push(cell))
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
      return isEnemySide(combatant.side, other.side)
    }

    const enemyCells: GridPosition[] = []
    options.tokens.value.forEach(token => {
      if (token.combatantId === combatantId) return
      if (!isEnemy(token.combatantId)) return
      const cells = getFootprintCells(token.position.x, token.position.y, token.size)
      cells.forEach(cell => enemyCells.push(cell))
    })
    return enemyCells
  }

  /**
   * Get terrain cost at a position for a specific combatant.
   * Checks the combatant's Swim and Burrow capabilities to determine
   * whether water/earth terrain is passable.
   *
   * PTU p.322 (Naturewalk): If the combatant has a Naturewalk capability
   * matching the cell's base terrain type, the slow flag is bypassed
   * (treated as Basic Terrain — cost 1). The rough flag has no movement
   * cost effect regardless (it only affects accuracy).
   */
  const getTerrainCostForCombatant = (x: number, y: number, combatantId: string): number => {
    const combatant = findCombatant(combatantId)
    const canSwim = combatant ? combatantCanSwim(combatant) : false
    const canBurrow = combatant ? combatantCanBurrow(combatant) : false

    // Check Naturewalk bypass for slow flag
    if (combatant) {
      const cell = terrainStore.getCellAt(x, y)
      const terrain = cell?.type ?? terrainStore.defaultType
      const flags = cell?.flags ?? DEFAULT_FLAGS

      // Impassable checks (unaffected by Naturewalk)
      if (terrain === 'blocking') return Infinity
      if (terrain === 'water' && !canSwim) return Infinity
      if (terrain === 'earth' && !canBurrow) return Infinity

      // If cell has slow flag and combatant has matching Naturewalk,
      // bypass the slow cost doubling (treat as Basic Terrain)
      if (flags.slow && naturewalkBypassesTerrain(combatant, terrain)) {
        return TERRAIN_COSTS[terrain] // Base cost without slow doubling
      }
    }

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
   * Get terrain cost for a multi-cell footprint at position (x, y).
   * Returns the maximum terrain cost across all cells in the footprint.
   * Returns Infinity if ANY cell is impassable.
   */
  const getTerrainCostForFootprint = (
    x: number,
    y: number,
    size: number,
    combatantId: string
  ): number => {
    let maxCost = 0
    for (let fx = 0; fx < size; fx++) {
      for (let fy = 0; fy < size; fy++) {
        const cellCost = getTerrainCostForCombatant(x + fx, y + fy, combatantId)
        if (!isFinite(cellCost)) return Infinity
        maxCost = Math.max(maxCost, cellCost)
      }
    }
    return maxCost
  }

  /**
   * Get a combatant-aware terrain cost getter function, or undefined if no terrain is active.
   * Returns undefined when there's no terrain to avoid unnecessary pathfinding overhead.
   * The returned function is bound to the specific combatant's capabilities.
   *
   * Always returns a SINGLE-CELL getter. The A* and flood-fill algorithms in
   * usePathfinding.ts already iterate the full NxN footprint at each step,
   * calling this getter for every cell in the footprint. Returning a
   * footprint-aware getter here would cause double-counting (the pathfinding
   * iterates NxN cells, each of which would itself iterate NxN — checking
   * terrain at cells the token doesn't actually occupy).
   *
   * The tokenSize parameter is accepted for API compatibility but ignored.
   */
  const getTerrainCostGetter = (combatantId?: string, _tokenSize?: number): TerrainCostGetter | undefined => {
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
    const movingToken = options.tokens.value.find(t => t.combatantId === combatantId)
    const tokenSize = movingToken?.size || 1
    const terrainCostGetter = getTerrainCostGetter(combatantId, tokenSize)
    const elevCostGetter = getElevationCostGetter(combatantId)
    const terrainElevGetter = getTerrainElevationGetter()
    const fromElev = options.getTokenElevation
      ? options.getTokenElevation(combatantId)
      : 0
    return calculatePathCost(
      from, to, blockedCells, terrainCostGetter,
      elevCostGetter, terrainElevGetter, fromElev,
      tokenSize
    )
  }

  /**
   * Check if a move is valid, accounting for terrain costs, elevation,
   * combatant capabilities, speed averaging, and the no-stacking rule.
   *
   * Per decree-003 (PTU p.231):
   * - All tokens are passable (no movement blocking by tokens)
   * - Enemy-occupied squares count as rough terrain (accuracy penalty only)
   * - Cannot end movement on any occupied square (no stacking)
   *
   * Per PTU p.231 and decree-011:
   * - When a path crosses terrain boundaries, movement capabilities are
   *   averaged to determine the effective speed for that path.
   * - Example: Overland 7 + Swim 5 = 6m max when crossing land/water.
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
   * - Movement conditions (Stuck, Tripped, Slowed) reduce effective speed
   */
  const isValidMove = (
    fromPos: GridPosition,
    toPos: GridPosition,
    combatantId: string,
    gridWidth: number,
    gridHeight: number
  ): { valid: boolean; distance: number; blocked: boolean } => {
    // Determine the moving token's size for multi-cell footprint checks
    const movingToken = options.tokens.value.find(t => t.combatantId === combatantId)
    const tokenSize = movingToken?.size || 1

    const inBounds = isFootprintInBounds(toPos.x, toPos.y, tokenSize, gridWidth, gridHeight)

    // No-stacking rule: cannot end movement on any occupied square
    // Check ALL cells the moving token would occupy at the destination
    const occupiedCells = getOccupiedCells(combatantId)
    const occupiedSet = new Set(occupiedCells.map(c => `${c.x},${c.y}`))
    const destCells = getFootprintCells(toPos.x, toPos.y, tokenSize)
    const isOccupied = destCells.some(cell => occupiedSet.has(`${cell.x},${cell.y}`))

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
    const terrainCostGetter = getTerrainCostGetter(combatantId, tokenSize)

    if (terrainCostGetter || elevCostGetter) {
      // Terrain-aware and/or elevation-aware: use A* pathfinding
      // Pass tokenSize so A* checks full NxN footprint at each step
      const pathResult = calculatePathCost(
        fromPos, toPos, blockedCells, terrainCostGetter,
        elevCostGetter, terrainElevGetter, fromElev,
        tokenSize
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

      // Per PTU p.231 / decree-011: average movement speeds when path
      // crosses terrain boundaries. Use the full A* path for terrain analysis.
      const effectiveSpeed = terrainStore.terrainCount > 0
        ? getAveragedSpeedForPath(combatantId, pathResult.path)
        : getSpeed(combatantId)

      return {
        valid: pathResult.cost > 0 && pathResult.cost <= effectiveSpeed,
        distance: pathResult.cost,
        blocked: false
      }
    }

    // No terrain, no elevation: fast geometric check
    const speed = getSpeed(combatantId)
    const distance = calculateMoveDistance(fromPos, toPos)
    return {
      valid: distance > 0 && distance <= speed,
      distance,
      blocked: false
    }
  }

  /**
   * Check which adjacent enemies would get an AoO opportunity
   * if a combatant moves from `from` to `to`.
   *
   * Returns combatant IDs of enemies who were adjacent at `from`
   * and are no longer adjacent at `to` (shift_away trigger).
   *
   * This is a CLIENT-SIDE preview. The actual trigger detection
   * and resolution happens server-side via /api/encounters/:id/aoo-detect.
   *
   * Respects the disengaged flag (Disengage maneuver exempts from AoO).
   */
  const getAoOTriggersForMove = (
    combatantId: string,
    from: GridPosition,
    to: GridPosition
  ): string[] => {
    const mover = findCombatant(combatantId)
    if (!mover) return []

    // Disengaged combatants do not trigger shift_away AoO
    if (mover.disengaged) return []

    const moverSize = mover.tokenSize || 1
    const triggeredEnemyIds: string[] = []

    // Check each enemy token for adjacency shift
    for (const token of options.tokens.value) {
      if (token.combatantId === combatantId) continue

      const other = findCombatant(token.combatantId)
      if (!other) continue

      // Must be an enemy
      if (!isEnemySide(mover.side, other.side)) continue

      // Check reactor eligibility (MED-001)
      // Skip fainted, dead, or status-blocked combatants
      if (other.entity.currentHp <= 0) continue
      const conditions: string[] = other.entity.statusConditions ?? []
      if (conditions.includes('Fainted') || conditions.includes('Dead')) continue
      if (AOO_BLOCKING_CONDITIONS.some(bc => conditions.includes(bc))) continue
      // Skip if AoO already used this round
      if (other.outOfTurnUsage?.aooUsed) continue

      // Check if was adjacent before but not after
      const wasBefore = areAdjacent(from, moverSize, token.position, token.size)
      const isAfter = areAdjacent(to, moverSize, token.position, token.size)

      if (wasBefore && !isAfter) {
        triggeredEnemyIds.push(token.combatantId)
      }
    }

    return triggeredEnemyIds
  }

  return {
    calculateMoveDistance,
    calculateTerrainAwarePathCost,
    getSpeed,
    getMaxPossibleSpeed,
    getAveragedSpeedForPath,
    buildSpeedAveragingFn,
    getTerrainTypeAt,
    getOccupiedCells,
    getEnemyOccupiedCells,
    getTerrainCostAt,
    getTerrainCostForCombatant,
    getTerrainCostForFootprint,
    getTerrainCostGetter,
    isValidMove,
    findCombatant,
    getAoOTriggersForMove,
    DEFAULT_MOVEMENT_SPEED
  }
}
