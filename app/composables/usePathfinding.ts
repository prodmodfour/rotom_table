import type { GridPosition, TerrainType, TerrainCostGetter, ElevationCostGetter, TerrainElevationGetter } from '~/types'
import { ptuDiagonalDistance } from '~/utils/gridDistance'

/** Callback to look up the base terrain type at a grid position */
export type TerrainTypeGetter = (x: number, y: number) => TerrainType

/** Callback to compute averaged speed given a set of terrain types along a path */
export type SpeedAveragingFn = (terrainTypes: Set<string>) => number

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
    fromElevation: number = 0,
    tokenSize: number = 1
  ): { cost: number; path: GridPosition[] } | null {
    const blockedSet = new Set(blockedCells.map(c => `${c.x},${c.y}`))
    const size = tokenSize ?? 1

    // Check if ALL cells of destination footprint are passable
    for (let fx = 0; fx < size; fx++) {
      for (let fy = 0; fy < size; fy++) {
        const cellKey = `${to.x + fx},${to.y + fy}`
        if (blockedSet.has(cellKey)) return null
        if (getTerrainCost) {
          const cost = getTerrainCost(to.x + fx, to.y + fy)
          if (!isFinite(cost)) return null
        }
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

    // A* state includes position, diagonal parity, and elevation.
    // closedNodes stores finalized nodes for path reconstruction.
    const openSet = new Map<string, {
      x: number; y: number; g: number; f: number;
      parity: number; elevation: number; parent: string | null
    }>()
    const closedSet = new Set<string>()
    const closedNodes = new Map<string, {
      x: number; y: number; parent: string | null
    }>()

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

      // Check if we reached the destination — reconstruct full path
      if (current.node.x === to.x && current.node.y === to.y) {
        const path: GridPosition[] = []
        let traceKey: string | null = current.key
        // Walk back through parents to build the full path
        // First add the destination from current (not yet in closedNodes)
        path.unshift({ x: current.node.x, y: current.node.y })
        traceKey = current.node.parent
        while (traceKey !== null) {
          const node = closedNodes.get(traceKey)
          if (!node) {
            // Parent is the start node still in openSet
            const openNode = openSet.get(traceKey)
            if (openNode) {
              path.unshift({ x: openNode.x, y: openNode.y })
            }
            break
          }
          path.unshift({ x: node.x, y: node.y })
          traceKey = node.parent
        }
        // Ensure start is included
        if (path.length === 0 || path[0].x !== from.x || path[0].y !== from.y) {
          path.unshift({ x: from.x, y: from.y })
        }
        return { cost: current.node.g, path }
      }

      // Move to closed set — store node data for path reconstruction
      openSet.delete(current.key)
      closedSet.add(current.key)
      closedNodes.set(current.key, {
        x: current.node.x,
        y: current.node.y,
        parent: current.node.parent,
      })

      // Explore neighbors
      for (const [dx, dy, isDiagonal] of directions) {
        const nx = current.node.x + dx
        const ny = current.node.y + dy
        const neighborKey = `${nx},${ny}`

        if (closedSet.has(neighborKey)) continue

        // Check ALL cells in the footprint at (nx, ny)
        let maxTerrainMultiplier = 1
        let isPassable = true
        for (let fx = 0; fx < size && isPassable; fx++) {
          for (let fy = 0; fy < size && isPassable; fy++) {
            const cellX = nx + fx
            const cellY = ny + fy
            const cellKey = `${cellX},${cellY}`

            if (blockedSet.has(cellKey)) {
              isPassable = false
              break
            }

            if (getTerrainCost) {
              const cellTerrain = getTerrainCost(cellX, cellY)
              if (!isFinite(cellTerrain)) {
                isPassable = false
                break
              }
              maxTerrainMultiplier = Math.max(maxTerrainMultiplier, cellTerrain)
            }
          }
        }

        if (!isPassable) continue

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

        // Use maximum terrain multiplier across the footprint
        let stepCost = baseCost * maxTerrainMultiplier

        // Add elevation cost for the transition (uses origin cell elevation)
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

  /**
   * Get movement range cells with terrain-type-aware speed averaging.
   *
   * Per PTU p.231 and decree-011: when a path crosses terrain boundaries,
   * the applicable movement capabilities are averaged to determine the
   * effective speed for that path.
   *
   * This variant of getMovementRangeCells explores with the maximum possible
   * speed, tracks terrain types along each path, and filters cells where
   * the path cost exceeds the averaged speed for the terrain types encountered.
   *
   * **Conservative approximation:** The flood-fill only stores the cheapest-cost
   * path to each cell. A higher-cost path with fewer terrain types might yield a
   * higher averaged speed, enabling further exploration from that cell. This means
   * some cells that are technically reachable may not appear in the movement range
   * display. The correct solution would require multi-state exploration keyed by
   * (position, terrain-type-set), which is significantly more complex. This is
   * acceptable because: (1) it errs conservatively (never shows unreachable cells),
   * (2) actual move validation in isValidMove uses A* with full path analysis so
   * no invalid moves can be executed, and (3) the edge case requires specific
   * terrain layouts unlikely in typical play.
   *
   * @param origin - Starting position
   * @param maxSpeed - Maximum possible movement speed (used as exploration budget)
   * @param blockedCells - Cells blocked by other tokens
   * @param getTerrainCost - Terrain movement cost getter
   * @param getTerrainType - Terrain type lookup at each position
   * @param getAveragedSpeed - Callback that returns averaged speed for a set of terrain types
   * @param getElevationCost - Optional elevation transition cost function
   * @param getTerrainElevation - Optional ground elevation lookup
   * @param originElevation - Starting elevation level (default 0)
   */
  function getMovementRangeCellsWithAveraging(
    origin: GridPosition,
    maxSpeed: number,
    blockedCells: GridPosition[],
    getTerrainCost: TerrainCostGetter,
    getTerrainType: TerrainTypeGetter,
    getAveragedSpeed: SpeedAveragingFn,
    getElevationCost?: ElevationCostGetter,
    getTerrainElevation?: TerrainElevationGetter,
    originElevation: number = 0
  ): GridPosition[] {
    const reachable: GridPosition[] = []
    const blockedSet = new Set(blockedCells.map(c => `${c.x},${c.y}`))

    // Extended cost map: tracks cost, diagonal parity, elevation, AND terrain types on path
    const costMap = new Map<string, {
      cost: number
      diagonalParity: number
      elevation: number
      terrainTypes: Set<string>
    }>()
    const startKey = `${origin.x},${origin.y}`
    const originTerrainType = getTerrainType(origin.x, origin.y)
    costMap.set(startKey, {
      cost: 0,
      diagonalParity: 0,
      elevation: originElevation,
      terrainTypes: new Set([originTerrainType]),
    })

    // Priority queue entries: [x, y, cost, diagonalParity, elevation, terrainTypesEncoded]
    // We encode terrain types as a sorted comma-joined string for the queue
    const queue: Array<{
      x: number; y: number; cost: number; parity: number
      elevation: number; terrainTypes: Set<string>
    }> = [
      { x: origin.x, y: origin.y, cost: 0, parity: 0,
        elevation: originElevation, terrainTypes: new Set([originTerrainType]) }
    ]

    const directions: Array<[number, number, boolean]> = [
      [-1, -1, true], [-1, 0, false], [-1, 1, true],
      [0, -1, false], /* origin */ [0, 1, false],
      [1, -1, true], [1, 0, false], [1, 1, true],
    ]

    while (queue.length > 0) {
      // Sort by cost (lowest first) - simple priority queue
      queue.sort((a, b) => a.cost - b.cost)
      const current = queue.shift()!

      // Skip if we've already found a cheaper path to this cell
      const cellKey = `${current.x},${current.y}`
      const existing = costMap.get(cellKey)
      if (existing && existing.cost < current.cost) {
        continue
      }

      // Explore neighbors
      for (const [dx, dy, isDiagonal] of directions) {
        const nx = current.x + dx
        const ny = current.y + dy
        const neighborKey = `${nx},${ny}`

        if (blockedSet.has(neighborKey)) continue

        const terrainMultiplier = getTerrainCost(nx, ny)
        if (!isFinite(terrainMultiplier)) continue

        // PTU diagonal rules
        let baseCost: number
        let newParity: number
        if (isDiagonal) {
          baseCost = current.parity === 0 ? 1 : 2
          newParity = 1 - current.parity
        } else {
          baseCost = 1
          newParity = current.parity
        }

        let moveCost = baseCost * terrainMultiplier

        // Elevation cost
        const neighborElev = getTerrainElevation ? getTerrainElevation(nx, ny) : 0
        if (getElevationCost && current.elevation !== neighborElev) {
          moveCost += getElevationCost(current.elevation, neighborElev)
        }

        const totalCost = current.cost + moveCost

        // Skip if exceeds maximum possible speed budget
        if (totalCost > maxSpeed) continue

        // Build terrain types set for this path
        const neighborTerrainType = getTerrainType(nx, ny)
        const pathTerrainTypes = new Set(current.terrainTypes)
        pathTerrainTypes.add(neighborTerrainType)

        // Check if path cost fits within the averaged speed for this terrain set
        const averagedSpeed = getAveragedSpeed(pathTerrainTypes)
        if (totalCost > averagedSpeed) continue

        // Check if we've found a better path
        const existingNeighbor = costMap.get(neighborKey)
        if (existingNeighbor && existingNeighbor.cost <= totalCost) continue

        // Record this path with terrain type tracking
        costMap.set(neighborKey, {
          cost: totalCost,
          diagonalParity: newParity,
          elevation: neighborElev,
          terrainTypes: pathTerrainTypes,
        })

        // Add to reachable if not the origin
        if (nx !== origin.x || ny !== origin.y) {
          const existingIndex = reachable.findIndex(c => c.x === nx && c.y === ny)
          if (existingIndex === -1) {
            reachable.push({ x: nx, y: ny, z: neighborElev })
          } else {
            reachable[existingIndex] = { x: nx, y: ny, z: neighborElev }
          }
        }

        queue.push({
          x: nx, y: ny, cost: totalCost, parity: newParity,
          elevation: neighborElev, terrainTypes: pathTerrainTypes,
        })
      }
    }

    return reachable
  }

  return {
    getMovementRangeCells,
    getMovementRangeCellsWithAveraging,
    calculateMoveCost,
    validateMovement,
    calculatePathCost,
  }
}
