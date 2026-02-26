import type { GridPosition, TerrainCostGetter, ElevationCostGetter, TerrainElevationGetter } from '~/types'
import { ptuDiagonalDistance } from '~/utils/gridDistance'

/**
 * Pathfinding composable for PTU grid movement.
 *
 * Provides A* pathfinding with elevation support, flood-fill movement range
 * calculation, and movement cost/validation utilities.
 *
 * Extracted from useRangeParser to keep file sizes manageable.
 */
export function usePathfinding() {
  /**
   * Get movement range visualization cells with terrain cost support
   *
   * Uses flood-fill algorithm to find all reachable cells within movement budget,
   * accounting for terrain movement costs, elevation costs, and PTU diagonal rules.
   *
   * PTU Diagonal Rules: First diagonal costs 1m, second costs 2m, alternating.
   * Elevation Cost: 1 MP per level of elevation change (additive to XY movement).
   * Flying Pokemon ignore elevation cost within Sky speed range.
   *
   * @param origin - Starting position
   * @param speed - Movement speed (movement points available)
   * @param blockedCells - Cells blocked by other tokens
   * @param getTerrainCost - Optional function to get terrain movement cost at a position
   * @param getElevationCost - Optional function to get elevation transition cost
   * @param getTerrainElevation - Optional function to get ground elevation at a position
   * @param originElevation - Starting elevation level (default 0)
   */
  function getMovementRangeCells(
    origin: GridPosition,
    speed: number,
    blockedCells: GridPosition[] = [],
    getTerrainCost?: TerrainCostGetter,
    getElevationCost?: ElevationCostGetter,
    getTerrainElevation?: TerrainElevationGetter,
    originElevation: number = 0
  ): GridPosition[] {
    const reachable: GridPosition[] = []
    const blockedSet = new Set(blockedCells.map(c => `${c.x},${c.y}`))

    // Cost map: stores the minimum cost to reach each cell
    // We track cost, diagonal parity, and current elevation
    const costMap = new Map<string, { cost: number; diagonalParity: number; elevation: number }>()
    const startKey = `${origin.x},${origin.y}`
    costMap.set(startKey, { cost: 0, diagonalParity: 0, elevation: originElevation })

    // Priority queue for Dijkstra-like exploration
    // Each entry: [x, y, costToReach, diagonalParity, currentElevation]
    const queue: Array<[number, number, number, number, number]> = [
      [origin.x, origin.y, 0, 0, originElevation]
    ]

    // 8 directions for movement (including diagonals)
    const directions: Array<[number, number, boolean]> = [
      [-1, -1, true], [-1, 0, false], [-1, 1, true],
      [0, -1, false], /* origin */ [0, 1, false],
      [1, -1, true], [1, 0, false], [1, 1, true],
    ]

    while (queue.length > 0) {
      // Sort by cost (lowest first) - simple priority queue
      queue.sort((a, b) => a[2] - b[2])
      const [x, y, currentCost, currentParity, currentElev] = queue.shift()!

      // Skip if we've already found a cheaper path to this cell
      const cellKey = `${x},${y}`
      const existing = costMap.get(cellKey)
      if (existing && existing.cost < currentCost) {
        continue
      }

      // Explore neighbors
      for (const [dx, dy, isDiagonal] of directions) {
        const nx = x + dx
        const ny = y + dy
        const neighborKey = `${nx},${ny}`

        // Skip if blocked by token
        if (blockedSet.has(neighborKey)) {
          continue
        }

        // Get terrain cost multiplier for the destination cell
        const terrainMultiplier = getTerrainCost ? getTerrainCost(nx, ny) : 1

        // Skip impassable terrain (Infinity cost)
        if (!isFinite(terrainMultiplier)) {
          continue
        }

        // Calculate XY movement cost based on PTU diagonal rules
        let baseCost: number
        let newParity: number
        if (isDiagonal) {
          baseCost = currentParity === 0 ? 1 : 2
          newParity = 1 - currentParity
        } else {
          baseCost = 1
          newParity = currentParity
        }

        let moveCost = baseCost * terrainMultiplier

        // Calculate elevation cost for this step
        const neighborElev = getTerrainElevation ? getTerrainElevation(nx, ny) : 0
        if (getElevationCost && currentElev !== neighborElev) {
          moveCost += getElevationCost(currentElev, neighborElev)
        }

        const totalCost = currentCost + moveCost

        // Skip if exceeds movement budget
        if (totalCost > speed) {
          continue
        }

        // Check if we've found a better path
        const existingNeighbor = costMap.get(neighborKey)
        if (existingNeighbor && existingNeighbor.cost <= totalCost) {
          continue
        }

        // Record this path
        costMap.set(neighborKey, { cost: totalCost, diagonalParity: newParity, elevation: neighborElev })

        // Add to reachable if not the origin (include elevation in result)
        if (nx !== origin.x || ny !== origin.y) {
          const existingIndex = reachable.findIndex(c => c.x === nx && c.y === ny)
          if (existingIndex === -1) {
            reachable.push({ x: nx, y: ny, z: neighborElev })
          } else {
            // Update with elevation info
            reachable[existingIndex] = { x: nx, y: ny, z: neighborElev }
          }
        }

        // Add to queue for further exploration
        queue.push([nx, ny, totalCost, newParity, neighborElev])
      }
    }

    return reachable
  }

  /**
   * Calculate the minimum movement cost between two positions using PTU diagonal rules
   * Diagonals alternate: 1m, 2m, 1m, 2m...
   */
  function calculateMoveCost(from: GridPosition, to: GridPosition): number {
    return ptuDiagonalDistance(to.x - from.x, to.y - from.y)
  }

  /**
   * Validate if a movement is legal, accounting for terrain costs and elevation.
   *
   * @param from - Start position
   * @param to - Destination position
   * @param speed - Movement speed budget
   * @param blockedCells - Cells occupied by other tokens
   * @param getTerrainCost - Optional terrain cost multiplier function
   * @param getElevationCost - Optional elevation transition cost function
   * @param getTerrainElevation - Optional ground elevation lookup
   * @param fromElevation - Starting elevation (default 0)
   */
  function validateMovement(
    from: GridPosition,
    to: GridPosition,
    speed: number,
    blockedCells: GridPosition[] = [],
    getTerrainCost?: TerrainCostGetter,
    getElevationCost?: ElevationCostGetter,
    getTerrainElevation?: TerrainElevationGetter,
    fromElevation: number = 0
  ): { valid: boolean; distance: number; cost: number; reason?: string } {
    const distance = calculateMoveCost(from, to)

    // Check blocked
    const isBlocked = blockedCells.some(c => c.x === to.x && c.y === to.y)
    if (isBlocked) {
      return { valid: false, distance, cost: Infinity, reason: 'Destination is blocked' }
    }

    // Check terrain at destination
    if (getTerrainCost) {
      const terrainCost = getTerrainCost(to.x, to.y)
      if (!isFinite(terrainCost)) {
        return { valid: false, distance, cost: Infinity, reason: 'Destination is impassable terrain' }
      }
    }

    // For simple validation, calculate minimum path cost using flood-fill
    // with full elevation support
    const reachable = getMovementRangeCells(
      from, speed, blockedCells, getTerrainCost,
      getElevationCost, getTerrainElevation, fromElevation
    )
    const canReach = reachable.some(c => c.x === to.x && c.y === to.y)

    if (!canReach) {
      // Determine why
      if (distance > speed) {
        return { valid: false, distance, cost: distance, reason: `Exceeds movement speed (${distance} > ${speed})` }
      }
      return { valid: false, distance, cost: distance, reason: 'Cannot reach destination (terrain or obstacles)' }
    }

    return { valid: true, distance, cost: distance }
  }

  /**
   * Calculate the actual path cost between two points through terrain.
   * Uses A* pathfinding with PTU diagonal rules.
   *
   * When elevation getters are provided, the heuristic includes elevation cost
   * and each step adds the elevation transition cost.
   *
   * The heuristic uses the provided getElevationCost function (when available)
   * to ensure admissibility: flying Pokemon with zero elevation cost get a
   * heuristic of 0 for elevation, while grounded combatants get |dz|.
   *
   * @param from - Start position
   * @param to - Destination position
   * @param blockedCells - Cells occupied by other tokens
   * @param getTerrainCost - Optional terrain cost multiplier function
   * @param getElevationCost - Optional elevation transition cost function
   * @param getTerrainElevation - Optional ground elevation lookup
   * @param fromElevation - Starting elevation (default 0)
   */
  function calculatePathCost(
    from: GridPosition,
    to: GridPosition,
    blockedCells: GridPosition[] = [],
    getTerrainCost?: TerrainCostGetter,
    getElevationCost?: ElevationCostGetter,
    getTerrainElevation?: TerrainElevationGetter,
    fromElevation: number = 0
  ): { cost: number; path: GridPosition[] } | null {
    const blockedSet = new Set(blockedCells.map(c => `${c.x},${c.y}`))
    const destKey = `${to.x},${to.y}`

    // Check if destination is blocked
    if (blockedSet.has(destKey)) {
      return null
    }

    // Check if destination terrain is passable
    if (getTerrainCost) {
      const terrainCost = getTerrainCost(to.x, to.y)
      if (!isFinite(terrainCost)) {
        return null
      }
    }

    const toElev = getTerrainElevation ? getTerrainElevation(to.x, to.y) : 0

    // Heuristic: chebyshev(dx, dy) + elevationCost for admissible 3D estimate.
    // Uses getElevationCost when provided so flying Pokemon (who return 0 for
    // elevation transitions within Sky speed) get a correct lower bound.
    const heuristic = (x: number, y: number, z: number) => {
      const xyCost = ptuDiagonalDistance(to.x - x, to.y - y)
      const elevCost = getElevationCost ? getElevationCost(z, toElev) : 0
      return xyCost + elevCost
    }

    // A* state includes position, diagonal parity, and elevation
    const openSet = new Map<string, {
      x: number; y: number; g: number; f: number;
      parity: number; elevation: number; parent: string | null
    }>()
    const closedSet = new Set<string>()

    const startKey = `${from.x},${from.y}`
    openSet.set(startKey, {
      x: from.x,
      y: from.y,
      g: 0,
      f: heuristic(from.x, from.y, fromElevation),
      parity: 0,
      elevation: fromElevation,
      parent: null,
    })

    const directions: Array<[number, number, boolean]> = [
      [-1, -1, true], [-1, 0, false], [-1, 1, true],
      [0, -1, false], [0, 1, false],
      [1, -1, true], [1, 0, false], [1, 1, true],
    ]

    while (openSet.size > 0) {
      // Find node with lowest f score
      let current: { key: string; node: typeof openSet extends Map<string, infer V> ? V : never } | null = null
      for (const [key, node] of openSet) {
        if (!current || node.f < current.node.f) {
          current = { key, node }
        }
      }

      if (!current) break

      // Check if we reached the destination
      if (current.node.x === to.x && current.node.y === to.y) {
        const path: GridPosition[] = [{ x: to.x, y: to.y }]
        if (from.x !== to.x || from.y !== to.y) {
          path.unshift({ x: from.x, y: from.y })
        }
        return { cost: current.node.g, path }
      }

      // Move to closed set
      openSet.delete(current.key)
      closedSet.add(current.key)

      // Explore neighbors
      for (const [dx, dy, isDiagonal] of directions) {
        const nx = current.node.x + dx
        const ny = current.node.y + dy
        const neighborKey = `${nx},${ny}`

        if (closedSet.has(neighborKey)) continue
        if (blockedSet.has(neighborKey)) continue

        const terrainMultiplier = getTerrainCost ? getTerrainCost(nx, ny) : 1
        if (!isFinite(terrainMultiplier)) continue

        // PTU diagonal rules for XY cost
        let baseCost: number
        let newParity: number
        if (isDiagonal) {
          baseCost = current.node.parity === 0 ? 1 : 2
          newParity = 1 - current.node.parity
        } else {
          baseCost = 1
          newParity = current.node.parity
        }

        let stepCost = baseCost * terrainMultiplier

        // Add elevation cost for the transition
        const neighborElev = getTerrainElevation ? getTerrainElevation(nx, ny) : 0
        if (getElevationCost && current.node.elevation !== neighborElev) {
          stepCost += getElevationCost(current.node.elevation, neighborElev)
        }

        const g = current.node.g + stepCost
        const f = g + heuristic(nx, ny, neighborElev)

        const existing = openSet.get(neighborKey)
        if (!existing || g < existing.g) {
          openSet.set(neighborKey, {
            x: nx,
            y: ny,
            g,
            f,
            parity: newParity,
            elevation: neighborElev,
            parent: current.key,
          })
        }
      }
    }

    return null // No path found
  }

  return {
    getMovementRangeCells,
    calculateMoveCost,
    validateMovement,
    calculatePathCost,
  }
}
