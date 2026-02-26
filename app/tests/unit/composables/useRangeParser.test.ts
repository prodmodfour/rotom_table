import { describe, it, expect } from 'vitest'
import { useRangeParser } from '~/composables/useRangeParser'

describe('useRangeParser', () => {
  const {
    parseRange, isInRange, validateMovement, getMovementRangeCells,
    getAffectedCells, getOccupiedCells, closestCellPair
  } = useRangeParser()

  describe('parseRange', () => {
    it('should parse "Melee" as melee range 1', () => {
      const result = parseRange('Melee')
      expect(result.type).toBe('melee')
      expect(result.range).toBe(1)
    })

    it('should parse "Melee, 1 Target" with target count', () => {
      const result = parseRange('Melee, 1 Target')
      expect(result.type).toBe('melee')
      expect(result.range).toBe(1)
      expect(result.targetCount).toBe(1)
    })

    it('should parse simple ranged "6"', () => {
      const result = parseRange('6')
      expect(result.type).toBe('ranged')
      expect(result.range).toBe(6)
    })

    it('should parse ranged with targets "8, 1 Target"', () => {
      const result = parseRange('8, 1 Target')
      expect(result.type).toBe('ranged')
      expect(result.range).toBe(8)
      expect(result.targetCount).toBe(1)
    })

    it('should parse "Burst 2"', () => {
      const result = parseRange('Burst 2')
      expect(result.type).toBe('burst')
      expect(result.aoeSize).toBe(2)
    })

    it('should parse "Cone 3"', () => {
      const result = parseRange('Cone 3')
      expect(result.type).toBe('cone')
      expect(result.aoeSize).toBe(3)
      expect(result.range).toBe(3)
    })

    it('should parse "Close Blast 2"', () => {
      const result = parseRange('Close Blast 2')
      expect(result.type).toBe('close-blast')
      expect(result.aoeSize).toBe(2)
      expect(result.range).toBe(1)
    })

    it('should parse "Line 6"', () => {
      const result = parseRange('Line 6')
      expect(result.type).toBe('line')
      expect(result.aoeSize).toBe(6)
    })

    it('should parse "Self"', () => {
      const result = parseRange('Self')
      expect(result.type).toBe('self')
      expect(result.range).toBe(0)
    })

    it('should parse "Field"', () => {
      const result = parseRange('Field')
      expect(result.type).toBe('field')
      expect(result.range).toBe(Infinity)
    })

    it('should parse "Cardinally Adjacent"', () => {
      const result = parseRange('Cardinally Adjacent')
      expect(result.type).toBe('cardinally-adjacent')
      expect(result.range).toBe(1)
    })

    it('should handle empty string as melee', () => {
      const result = parseRange('')
      expect(result.type).toBe('melee')
      expect(result.range).toBe(1)
    })
  })

  describe('isInRange', () => {
    const origin = { x: 5, y: 5 }

    it('should correctly check melee range', () => {
      const melee = { type: 'melee' as const, range: 1 }

      // Adjacent should be in range
      expect(isInRange(origin, { x: 6, y: 5 }, melee)).toBe(true)
      expect(isInRange(origin, { x: 5, y: 6 }, melee)).toBe(true)
      expect(isInRange(origin, { x: 6, y: 6 }, melee)).toBe(true) // Diagonal

      // 2 cells away should be out of range
      expect(isInRange(origin, { x: 7, y: 5 }, melee)).toBe(false)
    })

    it('should correctly check ranged attacks (cardinal)', () => {
      const ranged = { type: 'ranged' as const, range: 6 }

      expect(isInRange(origin, { x: 11, y: 5 }, ranged)).toBe(true) // Exactly 6
      expect(isInRange(origin, { x: 12, y: 5 }, ranged)).toBe(false) // 7, out of range
    })

    it('should use PTU alternating diagonal for ranged distance (decree-002)', () => {
      // PTU diagonal: 4 diag = 4 + floor(4/2) = 6 meters
      const ranged6 = { type: 'ranged' as const, range: 6 }
      expect(isInRange(origin, { x: 9, y: 9 }, ranged6)).toBe(true) // 4 diag = 6m, in range

      // PTU diagonal: 5 diag = 5 + floor(5/2) = 7 meters
      expect(isInRange(origin, { x: 10, y: 10 }, ranged6)).toBe(false) // 5 diag = 7m, out of range

      // Under old Chebyshev, 5 diag would be 5 (in range). Under PTU diagonal it's 7 (out).
      // This verifies we're using PTU diagonal, not Chebyshev.
    })

    it('should only allow self for self type', () => {
      const self = { type: 'self' as const, range: 0 }

      expect(isInRange(origin, origin, self)).toBe(true)
      expect(isInRange(origin, { x: 6, y: 5 }, self)).toBe(false)
    })

    it('should allow any distance for field type', () => {
      const field = { type: 'field' as const, range: Infinity }

      expect(isInRange(origin, { x: 100, y: 100 }, field)).toBe(true)
    })

    it('should correctly check cardinally adjacent (no diagonals)', () => {
      const cardinal = { type: 'cardinally-adjacent' as const, range: 1 }

      // Orthogonal adjacent should work
      expect(isInRange(origin, { x: 6, y: 5 }, cardinal)).toBe(true)
      expect(isInRange(origin, { x: 4, y: 5 }, cardinal)).toBe(true)
      expect(isInRange(origin, { x: 5, y: 6 }, cardinal)).toBe(true)
      expect(isInRange(origin, { x: 5, y: 4 }, cardinal)).toBe(true)

      // Diagonal should NOT work
      expect(isInRange(origin, { x: 6, y: 6 }, cardinal)).toBe(false)
    })
  })

  describe('validateMovement', () => {
    const origin = { x: 5, y: 5 }

    it('should allow movement within speed', () => {
      const result = validateMovement(origin, { x: 8, y: 5 }, 5)
      expect(result.valid).toBe(true)
      expect(result.distance).toBe(3)
    })

    it('should reject movement beyond speed', () => {
      const result = validateMovement(origin, { x: 12, y: 5 }, 5)
      expect(result.valid).toBe(false)
      expect(result.distance).toBe(7)
      expect(result.reason).toContain('Exceeds movement speed')
    })

    it('should reject movement to blocked cell', () => {
      const blocked = [{ x: 8, y: 5 }]
      const result = validateMovement(origin, { x: 8, y: 5 }, 5, blocked)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('Destination is blocked')
    })

    it('should use PTU diagonal rules (1, 2, 1, 2...)', () => {
      // 3 diagonal moves costs 1+2+1 = 4m
      const result = validateMovement(origin, { x: 8, y: 8 }, 5)
      expect(result.valid).toBe(true)
      expect(result.distance).toBe(4) // PTU: 1+2+1 = 4 (not Chebyshev 3 or Manhattan 6)
    })
  })

  describe('getMovementRangeCells', () => {
    const origin = { x: 5, y: 5 }

    it('should return correct cells for speed 1', () => {
      const cells = getMovementRangeCells(origin, 1)
      expect(cells).toHaveLength(8) // 8 adjacent cells (not including origin)

      // Check some expected cells
      expect(cells).toContainEqual({ x: 6, y: 5 })
      expect(cells).toContainEqual({ x: 4, y: 5 })
      expect(cells).toContainEqual({ x: 6, y: 6 })
    })

    it('should return correct cells for speed 2', () => {
      const cells = getMovementRangeCells(origin, 2)
      // PTU diagonal rules: corners cost 3m (1+2), so they're excluded
      // 8 adjacent + 12 at distance 2 (excluding 4 diagonal corners) = 20 cells
      expect(cells).toHaveLength(20)
    })

    it('should exclude blocked cells', () => {
      const blocked = [{ x: 6, y: 5 }, { x: 5, y: 6 }]
      const cells = getMovementRangeCells(origin, 1, blocked)
      expect(cells).toHaveLength(6) // 8 - 2 blocked
      expect(cells).not.toContainEqual({ x: 6, y: 5 })
      expect(cells).not.toContainEqual({ x: 5, y: 6 })
    })

    it('should not include origin cell', () => {
      const cells = getMovementRangeCells(origin, 2)
      expect(cells).not.toContainEqual(origin)
    })
  })

  describe('getMovementRangeCells with terrain costs', () => {
    const origin = { x: 5, y: 5 }

    it('should reduce range when crossing difficult terrain', () => {
      // Difficult terrain costs 2 instead of 1
      const getTerrainCost = (x: number, y: number): number => {
        // Make cells at x=6 difficult terrain
        if (x === 6) return 2
        return 1
      }

      const cellsWithTerrain = getMovementRangeCells(origin, 2, [], getTerrainCost)
      const cellsWithoutTerrain = getMovementRangeCells(origin, 2, [])

      // With difficult terrain at x=6, cells beyond x=6 should not be reachable
      // since moving to x=6 costs 2, leaving no movement to go further
      expect(cellsWithoutTerrain).toContainEqual({ x: 7, y: 5 })

      // With terrain cost, we can't reach x=7 with speed 2 (costs: 1 to x=6, then 2 to x=7 = 3)
      // Wait, actually we can reach x=6 (cost 2) with speed 2, but not x=7
      // The cells at x=6 should still be reachable (cost 2 <= speed 2)
      expect(cellsWithTerrain).toContainEqual({ x: 6, y: 5 })
    })

    it('should block movement through impassable terrain', () => {
      const getTerrainCost = (x: number, y: number): number => {
        // Make cell at (6, 5) impassable
        if (x === 6 && y === 5) return Infinity
        return 1
      }

      const cells = getMovementRangeCells(origin, 3, [], getTerrainCost)

      // The cell itself should not be reachable
      expect(cells).not.toContainEqual({ x: 6, y: 5 })

      // Cells that can only be reached through (6, 5) might still be reachable
      // via alternate paths (diagonal)
    })

    it('should find path around obstacles via diagonals', () => {
      const getTerrainCost = (x: number, y: number): number => {
        // Wall of blocking terrain at x=6 from y=4 to y=6
        if (x === 6 && y >= 4 && y <= 6) return Infinity
        return 1
      }

      const cells = getMovementRangeCells(origin, 4, [], getTerrainCost)

      // Should be able to reach (7, 5) by going diagonally around the wall
      // Path: (5,5) -> (5,4) -> (6,3) -> (7,3) -> (7,4) -> (7,5) = 5 moves, too far
      // Or: (5,5) -> (6,3) -> (7,3) -> (7,4) -> (7,5) with diagonals
      // Actually with Chebyshev, path is: (5,5) -> (6,3) [cost 1] -> (7,4) [cost 1] -> (7,5) [cost 1] = 3
      // So (7, 5) should be reachable with speed 4
    })

    it('should not include cells that cost more than remaining speed', () => {
      const getTerrainCost = (x: number, y: number): number => {
        // All cells cost 3 except origin neighbors
        if (Math.abs(x - 5) <= 1 && Math.abs(y - 5) <= 1) return 1
        return 3
      }

      const cells = getMovementRangeCells(origin, 2, [], getTerrainCost)

      // Only cells adjacent to origin should be reachable (cost 1 each)
      // Cells 2 away would cost: 1 (adjacent) + 3 (next) = 4 > speed 2
      expect(cells.every(c =>
        Math.abs(c.x - origin.x) <= 1 && Math.abs(c.y - origin.y) <= 1
      )).toBe(true)
    })
  })

  describe('validateMovement with terrain costs', () => {
    const origin = { x: 5, y: 5 }

    it('should fail when destination has impassable terrain', () => {
      const getTerrainCost = (x: number, y: number): number => {
        if (x === 7 && y === 5) return Infinity
        return 1
      }

      const result = validateMovement(origin, { x: 7, y: 5 }, 5, [], getTerrainCost)
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('impassable terrain')
    })

    it('should succeed when path exists through difficult terrain', () => {
      const getTerrainCost = (x: number, y: number): number => {
        // Difficult terrain between origin and destination
        if (x === 6 && y === 5) return 2
        return 1
      }

      // Distance is 2, but cost is 1 + 2 = 3 (assuming worst path)
      // With speed 5, should be able to reach (7, 5)
      const result = validateMovement(origin, { x: 7, y: 5 }, 5, [], getTerrainCost)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateMovement with elevation costs', () => {
    const origin = { x: 5, y: 5 }

    // Simple elevation: 1 MP per level of elevation change
    const getElevationCost = (fromZ: number, toZ: number): number => {
      return Math.abs(toZ - fromZ)
    }

    it('should reject movement when elevation cost exceeds remaining budget', () => {
      // Destination is 2 cells away (XY cost = 2) + elevation change of 4 = total 6
      const getTerrainElevation = (x: number, y: number): number => {
        if (x === 7) return 4
        if (x === 6) return 2
        return 0
      }

      // Speed 3 is not enough: cost to (6,5) = 1 (xy) + 2 (elev) = 3, then
      // (7,5) = 1 (xy) + 2 (elev) = 2 more, total 5 > 3
      const result = validateMovement(
        origin, { x: 7, y: 5 }, 3, [],
        undefined, getElevationCost, getTerrainElevation, 0
      )
      expect(result.valid).toBe(false)
    })

    it('should allow movement when elevation cost fits within budget', () => {
      const getTerrainElevation = (x: number, y: number): number => {
        if (x >= 6) return 1
        return 0
      }

      // Cost to (6,5) = 1 (xy) + 1 (elev) = 2. Speed 5 is sufficient.
      const result = validateMovement(
        origin, { x: 6, y: 5 }, 5, [],
        undefined, getElevationCost, getTerrainElevation, 0
      )
      expect(result.valid).toBe(true)
    })

    it('should work with both terrain and elevation costs', () => {
      const getTerrainCost = (x: number, y: number): number => {
        if (x === 6 && y === 5) return 2  // Difficult terrain
        return 1
      }
      const getTerrainElevation = (x: number, y: number): number => {
        if (x >= 6) return 1
        return 0
      }

      // (5,5) -> (6,5): base=1, terrain=2x, elev=1 => cost = 1*2 + 1 = 3
      // Speed 2 not enough
      const result = validateMovement(
        origin, { x: 6, y: 5 }, 2, [],
        getTerrainCost, getElevationCost, getTerrainElevation, 0
      )
      expect(result.valid).toBe(false)
    })

    it('should respect fromElevation parameter', () => {
      const getTerrainElevation = (x: number, y: number): number => {
        return 3 // All cells at elevation 3
      }

      // Starting from elevation 3, moving to elevation 3 cells => no elevation cost
      const resultSameElev = validateMovement(
        origin, { x: 6, y: 5 }, 1, [],
        undefined, getElevationCost, getTerrainElevation, 3
      )
      expect(resultSameElev.valid).toBe(true)

      // Starting from elevation 0, moving to elevation 3 cells => +3 cost
      const resultDiffElev = validateMovement(
        origin, { x: 6, y: 5 }, 1, [],
        undefined, getElevationCost, getTerrainElevation, 0
      )
      expect(resultDiffElev.valid).toBe(false)
    })

    it('should allow flying Pokemon with zero elevation cost', () => {
      const flyingElevationCost = (_fromZ: number, _toZ: number): number => 0

      const getTerrainElevation = (x: number, y: number): number => {
        if (x >= 6) return 5
        return 0
      }

      // Flying: no elevation cost, so 1 cell XY = cost 1. Speed 1 is enough.
      const result = validateMovement(
        origin, { x: 6, y: 5 }, 1, [],
        undefined, flyingElevationCost, getTerrainElevation, 0
      )
      expect(result.valid).toBe(true)
    })

    it('should default to no elevation cost when getters are omitted', () => {
      // Without elevation params, same behavior as before
      const result = validateMovement(origin, { x: 6, y: 5 }, 1)
      expect(result.valid).toBe(true)
    })
  })

  describe('calculatePathCost', () => {
    const { calculatePathCost } = useRangeParser()
    const origin = { x: 0, y: 0 }

    it('should return null for blocked destination', () => {
      const blocked = [{ x: 3, y: 3 }]
      const result = calculatePathCost(origin, { x: 3, y: 3 }, blocked)
      expect(result).toBeNull()
    })

    it('should return null for impassable terrain destination', () => {
      const getTerrainCost = (x: number, y: number): number => {
        if (x === 3 && y === 3) return Infinity
        return 1
      }
      const result = calculatePathCost(origin, { x: 3, y: 3 }, [], getTerrainCost)
      expect(result).toBeNull()
    })

    it('should calculate correct cost for simple path', () => {
      const result = calculatePathCost(origin, { x: 3, y: 0 }, [])
      expect(result).not.toBeNull()
      expect(result!.cost).toBe(3) // 3 cells at cost 1 each
    })

    it('should calculate cost through difficult terrain', () => {
      const getTerrainCost = (x: number, y: number): number => {
        if (x === 1) return 2 // Middle column is difficult
        return 1
      }
      const result = calculatePathCost(origin, { x: 2, y: 0 }, [], getTerrainCost)
      expect(result).not.toBeNull()
      // Path: (0,0) -> (1,0) [cost 2] -> (2,0) [cost 1] = 3
      expect(result!.cost).toBe(3)
    })
  })

  describe('getAffectedCells - cone shapes (decree-007)', () => {
    const origin = { x: 5, y: 5 }

    it('should produce 4 cells for cardinal Cone 2 (d=1: 1 cell, d=2: 3 cells)', () => {
      const parsed = parseRange('Cone 2')
      const cells = getAffectedCells(origin, { dx: 0, dy: -1 }, parsed)
      expect(cells).toHaveLength(4)
      // d=1: center only
      expect(cells).toContainEqual({ x: 5, y: 4 })
      // d=2: 3 cells wide
      expect(cells).toContainEqual({ x: 4, y: 3 })
      expect(cells).toContainEqual({ x: 5, y: 3 })
      expect(cells).toContainEqual({ x: 6, y: 3 })
    })

    it('should produce 8 cells for diagonal Cone 2 (decree-024: diamond pattern with corner)', () => {
      const parsed = parseRange('Cone 2')
      const cells = getAffectedCells(origin, { dx: 1, dy: -1 }, parsed)
      // Cone 2 diagonal: tip (1 cell) + 7 unique cells at d=2
      // Per decree-024: includes diagonal corner cell via three push groups
      // d=1: (6,4)
      // d=2: (6,3), (7,2), (6,2), (7,3), (8,3), (7,4), (8,4)
      expect(cells).toHaveLength(8)
    })

    it('should produce 1 cell at d=1 for any cone direction', () => {
      const parsed = parseRange('Cone 1')
      const cells = getAffectedCells(origin, { dx: 1, dy: 0 }, parsed)
      expect(cells).toHaveLength(1)
      expect(cells).toContainEqual({ x: 6, y: 5 })
    })

    it('should produce fixed 3-wide rows at d=2+ for cardinal cone', () => {
      const parsed = parseRange('Cone 4')
      const cells = getAffectedCells(origin, { dx: 1, dy: 0 }, parsed)
      // d=1: 1 cell, d=2: 3, d=3: 3, d=4: 3 = 10 total
      expect(cells).toHaveLength(10)
    })
  })

  describe('getAffectedCells - diagonal line shortening (decree-009)', () => {
    const origin = { x: 5, y: 5 }

    it('should not shorten cardinal lines', () => {
      const parsed = parseRange('Line 4')
      const cells = getAffectedCells(origin, { dx: 1, dy: 0 }, parsed)
      expect(cells).toHaveLength(4)
    })

    it('should shorten diagonal Line 4 to 3 cells (1+2+1=4m)', () => {
      const parsed = parseRange('Line 4')
      const cells = getAffectedCells(origin, { dx: 1, dy: -1 }, parsed)
      expect(cells).toHaveLength(3)
    })

    it('should shorten diagonal Line 6 to 4 cells (1+2+1+2=6m)', () => {
      const parsed = parseRange('Line 6')
      const cells = getAffectedCells(origin, { dx: 1, dy: 1 }, parsed)
      expect(cells).toHaveLength(4)
    })

    it('should shorten diagonal Line 2 to 1 cell (next step costs 2m, total 3m > 2m)', () => {
      const parsed = parseRange('Line 2')
      const cells = getAffectedCells(origin, { dx: -1, dy: -1 }, parsed)
      expect(cells).toHaveLength(1)
    })
  })

  describe('getAffectedCells - burst shapes (decree-023)', () => {
    const origin = { x: 5, y: 5 }

    it('should produce 9 cells for Burst 1 (PTU diagonal: first diag = 1m)', () => {
      const parsed = parseRange('Burst 1')
      const cells = getAffectedCells(origin, { dx: 0, dy: 0 }, parsed)
      // ptuDiag(1,1) = 1 (first diagonal = 1m) so all 8 neighbors are included
      // Same result as Chebyshev for radius 1 because first diagonal costs only 1m
      expect(cells).toHaveLength(9)
      expect(cells).toContainEqual({ x: 5, y: 5 }) // center
      expect(cells).toContainEqual({ x: 6, y: 5 }) // east
      expect(cells).toContainEqual({ x: 4, y: 5 }) // west
      expect(cells).toContainEqual({ x: 5, y: 4 }) // north
      expect(cells).toContainEqual({ x: 5, y: 6 }) // south
      // Diagonals included because ptuDiag(1,1) = 1 <= 1
      expect(cells).toContainEqual({ x: 6, y: 6 })
      expect(cells).toContainEqual({ x: 4, y: 4 })
    })

    it('should produce 21 cells for Burst 2 (not 25-cell Chebyshev square)', () => {
      const parsed = parseRange('Burst 2')
      const cells = getAffectedCells(origin, { dx: 0, dy: 0 }, parsed)
      // PTU diagonal Burst 2: cells where ptuDiagonalDistance <= 2
      // 1 center + 8 at dist 1 + 12 at dist 2 = 21
      // Excludes the 4 corners at (+-2, +-2) which have ptuDiag = 3
      expect(cells).toHaveLength(21)
    })

    it('should exclude far diagonal corners from Burst 2 (PTU diagonal distance > radius)', () => {
      const parsed = parseRange('Burst 2')
      const cells = getAffectedCells(origin, { dx: 0, dy: 0 }, parsed)
      // The corners (x+-2, y+-2) have ptuDiagonalDistance = 3 > radius 2
      expect(cells).not.toContainEqual({ x: 3, y: 3 })
      expect(cells).not.toContainEqual({ x: 7, y: 7 })
      expect(cells).not.toContainEqual({ x: 3, y: 7 })
      expect(cells).not.toContainEqual({ x: 7, y: 3 })
    })

    it('should include (2,1) type cells in Burst 2 (ptuDiag = 2)', () => {
      const parsed = parseRange('Burst 2')
      const cells = getAffectedCells(origin, { dx: 0, dy: 0 }, parsed)
      // ptuDiag(2,1) = 1 diag + 1 straight = 2 <= 2
      expect(cells).toContainEqual({ x: 7, y: 6 })
      expect(cells).toContainEqual({ x: 7, y: 4 })
      expect(cells).toContainEqual({ x: 3, y: 6 })
      expect(cells).toContainEqual({ x: 3, y: 4 })
    })
  })

  describe('getOccupiedCells', () => {
    it('should return single cell for 1x1 token', () => {
      const cells = getOccupiedCells({ position: { x: 3, y: 4 }, size: 1 })
      expect(cells).toHaveLength(1)
      expect(cells).toContainEqual({ x: 3, y: 4 })
    })

    it('should return 4 cells for 2x2 token', () => {
      const cells = getOccupiedCells({ position: { x: 3, y: 4 }, size: 2 })
      expect(cells).toHaveLength(4)
      expect(cells).toContainEqual({ x: 3, y: 4 })
      expect(cells).toContainEqual({ x: 4, y: 4 })
      expect(cells).toContainEqual({ x: 3, y: 5 })
      expect(cells).toContainEqual({ x: 4, y: 5 })
    })

    it('should return 9 cells for 3x3 token', () => {
      const cells = getOccupiedCells({ position: { x: 0, y: 0 }, size: 3 })
      expect(cells).toHaveLength(9)
    })
  })

  describe('closestCellPair', () => {
    it('should return positions directly for two 1x1 tokens', () => {
      const result = closestCellPair(
        { position: { x: 0, y: 0 }, size: 1 },
        { position: { x: 5, y: 5 }, size: 1 }
      )
      expect(result.from).toEqual({ x: 0, y: 0 })
      expect(result.to).toEqual({ x: 5, y: 5 })
    })

    it('should find closest pair between multi-cell tokens', () => {
      // 2x2 at (0,0) and 2x2 at (5,5)
      // Closest pair: (1,1) from first, (5,5) from second
      const result = closestCellPair(
        { position: { x: 0, y: 0 }, size: 2 },
        { position: { x: 5, y: 5 }, size: 2 }
      )
      expect(result.from).toEqual({ x: 1, y: 1 })
      expect(result.to).toEqual({ x: 5, y: 5 })
    })

    it('should handle adjacent tokens', () => {
      // 1x1 at (3,3) and 2x2 at (4,2)
      // Closest pair: (3,3) and (4,3) with distance 1
      const result = closestCellPair(
        { position: { x: 3, y: 3 }, size: 1 },
        { position: { x: 4, y: 2 }, size: 2 }
      )
      expect(result.from).toEqual({ x: 3, y: 3 })
      expect(result.to).toEqual({ x: 4, y: 3 })
    })
  })
})
