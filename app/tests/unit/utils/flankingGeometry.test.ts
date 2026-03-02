import { describe, it, expect } from 'vitest'
import {
  areAdjacent,
  getOccupiedCells,
  getAdjacentCells,
  checkFlanking,
  countAdjacentAttackerCells,
  findIndependentSet,
  checkFlankingMultiTile,
  FLANKING_FOES_REQUIRED,
  NEIGHBOR_OFFSETS,
} from '~/utils/flankingGeometry'

// =============================================================
// P0 Functions (regression coverage)
// =============================================================

describe('NEIGHBOR_OFFSETS', () => {
  it('should have 8 directional offsets', () => {
    expect(NEIGHBOR_OFFSETS).toHaveLength(8)
  })
})

describe('FLANKING_FOES_REQUIRED', () => {
  it('should map PTU size categories correctly', () => {
    expect(FLANKING_FOES_REQUIRED[1]).toBe(2) // Small/Medium
    expect(FLANKING_FOES_REQUIRED[2]).toBe(3) // Large
    expect(FLANKING_FOES_REQUIRED[3]).toBe(4) // Huge
    expect(FLANKING_FOES_REQUIRED[4]).toBe(5) // Gigantic
  })
})

describe('getOccupiedCells', () => {
  it('should return 1 cell for 1x1 token', () => {
    const cells = getOccupiedCells({ x: 3, y: 4 }, 1)
    expect(cells).toEqual([{ x: 3, y: 4 }])
  })

  it('should return 4 cells for 2x2 token', () => {
    const cells = getOccupiedCells({ x: 3, y: 3 }, 2)
    expect(cells).toHaveLength(4)
    expect(cells).toContainEqual({ x: 3, y: 3 })
    expect(cells).toContainEqual({ x: 4, y: 3 })
    expect(cells).toContainEqual({ x: 3, y: 4 })
    expect(cells).toContainEqual({ x: 4, y: 4 })
  })

  it('should return 9 cells for 3x3 token', () => {
    const cells = getOccupiedCells({ x: 0, y: 0 }, 3)
    expect(cells).toHaveLength(9)
  })

  it('should return 16 cells for 4x4 token', () => {
    const cells = getOccupiedCells({ x: 0, y: 0 }, 4)
    expect(cells).toHaveLength(16)
  })
})

describe('getAdjacentCells', () => {
  it('should return 8 adjacent cells for 1x1 token', () => {
    const adj = getAdjacentCells({ x: 5, y: 5 }, 1)
    expect(adj).toHaveLength(8)
  })

  it('should return 12 adjacent cells for 2x2 token', () => {
    const adj = getAdjacentCells({ x: 3, y: 3 }, 2)
    // 2x2 border ring has 12 cells: 4 corners + 4 top/bottom + 4 sides
    expect(adj).toHaveLength(12)
  })

  it('should not include occupied cells', () => {
    const adj = getAdjacentCells({ x: 3, y: 3 }, 2)
    const occupied = [
      { x: 3, y: 3 }, { x: 4, y: 3 },
      { x: 3, y: 4 }, { x: 4, y: 4 },
    ]
    for (const occ of occupied) {
      expect(adj).not.toContainEqual(occ)
    }
  })
})

describe('areAdjacent', () => {
  it('should detect cardinal adjacency for 1x1 tokens', () => {
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 4, y: 3 }, 1)).toBe(true) // right
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 3, y: 4 }, 1)).toBe(true) // below
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 2, y: 3 }, 1)).toBe(true) // left
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 3, y: 2 }, 1)).toBe(true) // above
  })

  it('should detect diagonal adjacency for 1x1 tokens', () => {
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 4, y: 4 }, 1)).toBe(true)
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 2, y: 2 }, 1)).toBe(true)
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 4, y: 2 }, 1)).toBe(true)
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 2, y: 4 }, 1)).toBe(true)
  })

  it('should return false for non-adjacent 1x1 tokens', () => {
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 5, y: 3 }, 1)).toBe(false) // 2 apart
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 3, y: 5 }, 1)).toBe(false)
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 5, y: 5 }, 1)).toBe(false)
  })

  it('should return false for same position', () => {
    expect(areAdjacent({ x: 3, y: 3 }, 1, { x: 3, y: 3 }, 1)).toBe(false)
  })

  it('should detect adjacency between 2x2 and 1x1 tokens', () => {
    // 2x2 at (3,3) occupies (3,3)(4,3)(3,4)(4,4)
    // 1x1 at (2,3) is adjacent to (3,3)
    expect(areAdjacent({ x: 3, y: 3 }, 2, { x: 2, y: 3 }, 1)).toBe(true)
    // 1x1 at (5,5) is adjacent to (4,4)
    expect(areAdjacent({ x: 3, y: 3 }, 2, { x: 5, y: 5 }, 1)).toBe(true)
    // 1x1 at (6,3) is NOT adjacent to any occupied cell
    expect(areAdjacent({ x: 3, y: 3 }, 2, { x: 6, y: 3 }, 1)).toBe(false)
  })

  it('should detect adjacency between two 2x2 tokens', () => {
    // Token A at (1,1) occupies (1,1)(2,1)(1,2)(2,2)
    // Token B at (3,1) occupies (3,1)(4,1)(3,2)(4,2)
    // (2,1) and (3,1) are adjacent
    expect(areAdjacent({ x: 1, y: 1 }, 2, { x: 3, y: 1 }, 2)).toBe(true)
    // Token C at (5,1) -- (2,2) and (5,1): dx=3, not adjacent
    expect(areAdjacent({ x: 1, y: 1 }, 2, { x: 5, y: 1 }, 2)).toBe(false)
  })
})

describe('checkFlanking (P0)', () => {
  it('should not flank with 0 foes', () => {
    const result = checkFlanking({ x: 5, y: 5 }, 1, [])
    expect(result.isFlanked).toBe(false)
    expect(result.effectiveFoeCount).toBe(0)
    expect(result.requiredFoes).toBe(2)
  })

  it('should not flank with 1 foe', () => {
    const result = checkFlanking({ x: 5, y: 5 }, 1, [
      { id: 'a', position: { x: 4, y: 5 }, size: 1 },
    ])
    expect(result.isFlanked).toBe(false)
  })

  it('should flank with 2 non-adjacent foes', () => {
    // Foes on opposite sides
    const result = checkFlanking({ x: 5, y: 5 }, 1, [
      { id: 'a', position: { x: 4, y: 5 }, size: 1 }, // left
      { id: 'b', position: { x: 6, y: 5 }, size: 1 }, // right
    ])
    expect(result.isFlanked).toBe(true)
    expect(result.flankerIds).toContain('a')
    expect(result.flankerIds).toContain('b')
  })

  it('should not flank with 2 adjacent foes', () => {
    // Both foes are adjacent to each other
    const result = checkFlanking({ x: 5, y: 5 }, 1, [
      { id: 'a', position: { x: 4, y: 5 }, size: 1 },
      { id: 'b', position: { x: 4, y: 4 }, size: 1 }, // adjacent to 'a'
    ])
    expect(result.isFlanked).toBe(false)
    expect(result.effectiveFoeCount).toBe(2)
  })
})

// =============================================================
// P1 Functions
// =============================================================

describe('countAdjacentAttackerCells', () => {
  it('should return 1 for 1x1 attacker adjacent to 1x1 target', () => {
    const count = countAdjacentAttackerCells(
      { x: 4, y: 5 }, 1, // attacker at (4,5)
      { x: 5, y: 5 }, 1  // target at (5,5)
    )
    expect(count).toBe(1)
  })

  it('should return 0 for non-adjacent tokens', () => {
    const count = countAdjacentAttackerCells(
      { x: 0, y: 0 }, 1,
      { x: 5, y: 5 }, 1
    )
    expect(count).toBe(0)
  })

  it('should count 2 cells for 2x2 attacker with 2 cells adjacent to 1x1 target', () => {
    // 2x2 attacker at (3,4) occupies (3,4)(4,4)(3,5)(4,5)
    // 1x1 target at (5,5)
    // Cell (4,4) is adjacent to (5,5)? |dx|=1, |dy|=1 -> yes (diagonal)
    // Cell (4,5) is adjacent to (5,5)? |dx|=1, |dy|=0 -> yes (cardinal)
    // Cell (3,4) is adjacent to (5,5)? |dx|=2 -> no
    // Cell (3,5) is adjacent to (5,5)? |dx|=2 -> no
    const count = countAdjacentAttackerCells(
      { x: 3, y: 4 }, 2,
      { x: 5, y: 5 }, 1
    )
    expect(count).toBe(2)
  })

  it('should count all 4 cells for 2x2 attacker surrounding 1x1 target corner', () => {
    // 2x2 attacker at (4,4) occupies (4,4)(5,4)(4,5)(5,5)
    // 1x1 target at (3,3)
    // (4,4) is adjacent to (3,3): |dx|=1, |dy|=1 -> yes
    // (5,4) is adjacent to (3,3): |dx|=2 -> no
    // (4,5) is adjacent to (3,3): |dy|=2 -> no
    // (5,5) is adjacent to (3,3): |dx|=2, |dy|=2 -> no
    const count = countAdjacentAttackerCells(
      { x: 4, y: 4 }, 2,
      { x: 3, y: 3 }, 1
    )
    expect(count).toBe(1)
  })

  it('should count adjacent cells for 2x2 attacker next to 2x2 target', () => {
    // 2x2 attacker at (5,3) occupies (5,3)(6,3)(5,4)(6,4)
    // 2x2 target at (3,3) occupies (3,3)(4,3)(3,4)(4,4)
    // Cell (5,3) adjacent to target? (5,3) neighbors (4,3)? |dx|=1,|dy|=0 -> yes
    // Cell (6,3)? neighbors (4,3)? |dx|=2 -> no; (4,4)? |dx|=2 -> no -> no
    // Cell (5,4) adjacent to target? (5,4) neighbors (4,4)? |dx|=1,|dy|=0 -> yes
    // Cell (6,4)? neighbors (4,4)? |dx|=2 -> no -> no
    const count = countAdjacentAttackerCells(
      { x: 5, y: 3 }, 2,
      { x: 3, y: 3 }, 2
    )
    expect(count).toBe(2)
  })

  it('should handle PTU example: Flygon (2x2) adjacent to Aggron (2x2)', () => {
    // Per PTU p.232 visual example, a Flygon occupying 2 adjacent squares
    // to the Aggron counts as 2 foes.
    // Aggron (Large 2x2) at (3,3): occupies (3,3)(4,3)(3,4)(4,4)
    // Flygon (Large 2x2) at (5,3): occupies (5,3)(6,3)(5,4)(6,4)
    // Flygon cells adjacent to Aggron: (5,3)->adj(4,3)=yes, (5,4)->adj(4,4)=yes
    // (6,3) and (6,4) are not adjacent to any Aggron cell
    const count = countAdjacentAttackerCells(
      { x: 5, y: 3 }, 2,
      { x: 3, y: 3 }, 2
    )
    expect(count).toBe(2)
  })

  it('should handle 3x3 attacker (Lugia) adjacent to 2x2 target (Aggron)', () => {
    // Per PTU p.232: Lugia can by itself occupy 3 adjacent squares to Aggron
    // Aggron at (3,3): (3,3)(4,3)(3,4)(4,4)
    // Lugia at (5,2): (5,2)(6,2)(7,2)(5,3)(6,3)(7,3)(5,4)(6,4)(7,4)
    // Lugia cell (5,2): adj (4,3)? |dx|=1,|dy|=1 -> yes
    // Lugia cell (5,3): adj (4,3)? |dx|=1,|dy|=0 -> yes
    // Lugia cell (5,4): adj (4,4)? |dx|=1,|dy|=0 -> yes
    // Cells at x=6,7 are too far from Aggron cells
    const count = countAdjacentAttackerCells(
      { x: 5, y: 2 }, 3,
      { x: 3, y: 3 }, 2
    )
    expect(count).toBe(3)
  })
})

describe('findIndependentSet', () => {
  it('should return all vertices when no edges exist', () => {
    // 3 vertices, no connections
    const adj = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ]
    const result = findIndependentSet(adj, 3, 3)
    expect(result).toHaveLength(3)
  })

  it('should find independent set of 2 from a path graph', () => {
    // Path: 0-1-2 (0 and 2 are not adjacent to each other)
    const adj = [
      [false, true, false],
      [true, false, true],
      [false, true, false],
    ]
    const result = findIndependentSet(adj, 3, 2)
    expect(result).toHaveLength(2)
    // Should pick 0 and 2 (both degree 1, not adjacent)
    expect(result).toContain(0)
    expect(result).toContain(2)
  })

  it('should return 1 from a complete graph of 3', () => {
    // Complete graph: all connected
    const adj = [
      [false, true, true],
      [true, false, true],
      [true, true, false],
    ]
    const result = findIndependentSet(adj, 3, 3)
    // Maximum independent set in K3 is 1
    expect(result).toHaveLength(1)
  })

  it('should stop early when target reached', () => {
    // 4 isolated vertices, target=2
    const adj = Array.from({ length: 4 }, () => Array(4).fill(false))
    const result = findIndependentSet(adj, 4, 2)
    expect(result).toHaveLength(2)
  })

  it('should handle empty graph', () => {
    const result = findIndependentSet([], 0, 0)
    expect(result).toHaveLength(0)
  })

  it('should find independent set of 3 from spec example H', () => {
    // From spec section H: 3 foes around a Large target
    // A(0), B(1), C(2) -- none adjacent to each other
    const adj = [
      [false, false, false],
      [false, false, false],
      [false, false, false],
    ]
    const result = findIndependentSet(adj, 3, 3)
    expect(result).toHaveLength(3)
  })

  it('should handle spec example H: 2 clustered foes + 1 independent', () => {
    // From spec: A-B adjacent, C independent
    // Need IS of size 3, but max IS = 2 ({A,C} or {B,C})
    const adj = [
      [false, true, false],  // A adj to B
      [true, false, false],  // B adj to A
      [false, false, false], // C independent
    ]
    const result = findIndependentSet(adj, 3, 3)
    // Can only get 2: C (degree 0) + one of A or B
    expect(result).toHaveLength(2)
  })
})

describe('checkFlankingMultiTile', () => {
  // -------------------------------------------------------
  // Backward compatibility with 1x1 tokens (P0 behavior)
  // -------------------------------------------------------

  describe('1x1 token backward compatibility', () => {
    it('should not flank with 0 foes', () => {
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [])
      expect(result.isFlanked).toBe(false)
      expect(result.effectiveFoeCount).toBe(0)
    })

    it('should not flank with 1 foe (self-flank prevention)', () => {
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'a', position: { x: 4, y: 5 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(false)
      expect(result.effectiveFoeCount).toBe(1)
    })

    it('should flank with 2 non-adjacent foes on opposite sides', () => {
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'a', position: { x: 4, y: 5 }, size: 1 },
        { id: 'b', position: { x: 6, y: 5 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(true)
      expect(result.requiredFoes).toBe(2)
    })

    it('should not flank with 2 adjacent foes', () => {
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'a', position: { x: 4, y: 5 }, size: 1 },
        { id: 'b', position: { x: 4, y: 4 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(false)
    })

    it('should flank with diagonal non-adjacent foes', () => {
      // Foes on opposite diagonals of the target
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'a', position: { x: 4, y: 4 }, size: 1 }, // NW
        { id: 'b', position: { x: 6, y: 6 }, size: 1 }, // SE
      ])
      expect(result.isFlanked).toBe(true)
    })
  })

  // -------------------------------------------------------
  // Multi-tile TARGET flanking (Section E)
  // -------------------------------------------------------

  describe('multi-tile target flanking', () => {
    it('should require 3 foes for Large (2x2) target', () => {
      const result = checkFlankingMultiTile({ x: 3, y: 3 }, 2, [
        { id: 'a', position: { x: 2, y: 2 }, size: 1 },
        { id: 'b', position: { x: 5, y: 5 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(false)
      expect(result.requiredFoes).toBe(3)
    })

    it('should flank Large target with 3 non-adjacent foes (spec example H)', () => {
      // From spec Section H:
      //   . A .
      //   . T T
      //   B T T
      //   . . C
      // A at (1,0), B at (0,2), C at (3,3), Target at (1,1) size 2
      const result = checkFlankingMultiTile({ x: 1, y: 1 }, 2, [
        { id: 'A', position: { x: 1, y: 0 }, size: 1 },
        { id: 'B', position: { x: 0, y: 2 }, size: 1 },
        { id: 'C', position: { x: 3, y: 3 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(true)
      expect(result.requiredFoes).toBe(3)
    })

    it('should not flank Large target when 2 of 3 foes are adjacent (spec example H variant)', () => {
      // From spec Section H:
      //   A B .
      //   . T T
      //   . T T
      //   . . C
      // A at (0,0), B at (1,0), C at (3,3), Target at (1,1) size 2
      // A-B are adjacent, so max IS = 2 ({A,C} or {B,C}), need 3
      const result = checkFlankingMultiTile({ x: 1, y: 1 }, 2, [
        { id: 'A', position: { x: 0, y: 0 }, size: 1 },
        { id: 'B', position: { x: 1, y: 0 }, size: 1 },
        { id: 'C', position: { x: 3, y: 3 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(false)
    })

    it('should require 4 foes for Huge (3x3) target', () => {
      const result = checkFlankingMultiTile({ x: 3, y: 3 }, 3, [])
      expect(result.requiredFoes).toBe(4)
    })

    it('should require 5 foes for Gigantic (4x4) target', () => {
      const result = checkFlankingMultiTile({ x: 3, y: 3 }, 4, [])
      expect(result.requiredFoes).toBe(5)
    })

    it('should flank Huge target with 4 non-adjacent foes', () => {
      // 3x3 target at (3,3): occupies (3,3)-(5,5)
      // 4 foes spread around the border, none adjacent to each other
      const result = checkFlankingMultiTile({ x: 3, y: 3 }, 3, [
        { id: 'a', position: { x: 2, y: 2 }, size: 1 }, // NW corner
        { id: 'b', position: { x: 6, y: 2 }, size: 1 }, // NE corner
        { id: 'c', position: { x: 2, y: 6 }, size: 1 }, // SW corner
        { id: 'd', position: { x: 6, y: 6 }, size: 1 }, // SE corner
      ])
      expect(result.isFlanked).toBe(true)
    })

    it('should not flank Huge target with only 3 non-adjacent foes', () => {
      const result = checkFlankingMultiTile({ x: 3, y: 3 }, 3, [
        { id: 'a', position: { x: 2, y: 2 }, size: 1 },
        { id: 'b', position: { x: 6, y: 2 }, size: 1 },
        { id: 'c', position: { x: 2, y: 6 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(false)
    })
  })

  // -------------------------------------------------------
  // Multi-tile ATTACKER counting (Section F)
  // -------------------------------------------------------

  describe('multi-tile attacker counting', () => {
    it('should count 2x2 attacker as multiple foes for 1x1 target', () => {
      // 2x2 attacker at (3,4) has 2 cells adjacent to target at (5,5)
      // Plus a 1x1 foe on the other side
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'large', position: { x: 3, y: 4 }, size: 2 },
        { id: 'small', position: { x: 7, y: 5 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(true)
      // large contributes 2, small contributes 1 = 3 effective
      expect(result.effectiveFoeCount).toBe(3)
    })

    it('should prevent self-flank even with large multi-tile attacker', () => {
      // PTU p.232: "A single combatant cannot Flank by itself"
      // Even a 2x2 attacker with 4 cells adjacent should not self-flank
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'large', position: { x: 3, y: 4 }, size: 2 },
      ])
      expect(result.isFlanked).toBe(false)
    })

    it('should use multi-tile counting for PTU Flygon+Zangoose example', () => {
      // PTU p.232: Aggron (Large 2x2) at (3,3)
      // Flygon (Large 2x2) at (5,3) counts as 2 foes (2 cells adjacent)
      // Zangoose (Medium 1x1) at (2,3) counts as 1 foe
      // Total effective = 3, required = 3 for Large target -> FLANKED
      // (if Flygon and Zangoose are not adjacent to each other)
      const result = checkFlankingMultiTile({ x: 3, y: 3 }, 2, [
        { id: 'flygon', position: { x: 5, y: 3 }, size: 2 },
        { id: 'zangoose', position: { x: 2, y: 3 }, size: 1 },
      ])
      // Flygon at (5,3) and Zangoose at (2,3): |dx|=3, not adjacent
      expect(result.isFlanked).toBe(true)
      expect(result.effectiveFoeCount).toBe(3) // Flygon=2, Zangoose=1
    })

    it('should not flank when Lugia alone is adjacent (PTU example)', () => {
      // PTU p.232: Lugia (3x3) alone occupying 3 adjacent squares to Aggron
      // Self-flank prevention: need minimum 2 combatants
      const result = checkFlankingMultiTile({ x: 3, y: 3 }, 2, [
        { id: 'lugia', position: { x: 5, y: 2 }, size: 3 },
      ])
      expect(result.isFlanked).toBe(false)
      expect(result.effectiveFoeCount).toBe(3) // 3 cells adjacent
    })

    it('should not flank when 2 large attackers are adjacent to each other', () => {
      // Two 2x2 foes adjacent to each other AND the target
      // Even though effective count may be high, non-adjacency check fails
      // Target 1x1 at (5,5), need 2 non-adjacent foes
      // Foe A (2x2) at (3,4), Foe B (2x2) at (3,6)
      // A occupies (3,4)(4,4)(3,5)(4,5)
      // B occupies (3,6)(4,6)(3,7)(4,7)
      // A cell (3,5) and B cell (3,6): |dx|=0, |dy|=1 -> adjacent!
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'a', position: { x: 3, y: 4 }, size: 2 },
        { id: 'b', position: { x: 3, y: 6 }, size: 2 },
      ])
      expect(result.isFlanked).toBe(false)
    })
  })

  // -------------------------------------------------------
  // 3+ Attackers (Section H)
  // -------------------------------------------------------

  describe('3+ attackers', () => {
    it('should flank with 3 foes where any 2 are non-adjacent (1x1 target)', () => {
      // 3 foes: A and B adjacent, but C is not adjacent to A
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'a', position: { x: 4, y: 5 }, size: 1 }, // left
        { id: 'b', position: { x: 4, y: 4 }, size: 1 }, // NW (adj to a)
        { id: 'c', position: { x: 6, y: 5 }, size: 1 }, // right (not adj to a or b)
      ])
      expect(result.isFlanked).toBe(true)
    })

    it('should not flank when all adjacent foes form a connected cluster', () => {
      // All 3 foes are mutually adjacent
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'a', position: { x: 4, y: 4 }, size: 1 },
        { id: 'b', position: { x: 5, y: 4 }, size: 1 },
        { id: 'c', position: { x: 4, y: 5 }, size: 1 },
      ])
      // a-b: adjacent (|dx|=1,|dy|=0)
      // a-c: adjacent (|dx|=0,|dy|=1)
      // b-c: adjacent (|dx|=1,|dy|=1)
      // No independent set of size 2 exists
      expect(result.isFlanked).toBe(false)
    })

    it('should handle all-clustered case from spec', () => {
      // PTU visual example: 2 Zangoose adjacent to each other, adjacent to Hitmonchan
      // Not flanked because the two are adjacent to each other
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'zangoose1', position: { x: 4, y: 5 }, size: 1 },
        { id: 'zangoose2', position: { x: 4, y: 4 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(false)
    })
  })

  // -------------------------------------------------------
  // Diagonal flanking (Section G)
  // -------------------------------------------------------

  describe('diagonal flanking', () => {
    it('should correctly handle diagonal foes (8-directional adjacency)', () => {
      // Foes on opposite diagonals
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'nw', position: { x: 4, y: 4 }, size: 1 },
        { id: 'se', position: { x: 6, y: 6 }, size: 1 },
      ])
      // NW and SE: |dx|=2, |dy|=2 -> NOT adjacent to each other
      expect(result.isFlanked).toBe(true)
    })

    it('should treat diagonal adjacency same as cardinal for flanking', () => {
      // One foe cardinal, one diagonal -- they should still be able to flank
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'n', position: { x: 5, y: 4 }, size: 1 },  // north
        { id: 'sw', position: { x: 4, y: 6 }, size: 1 },  // SW
      ])
      // n and sw: |dx|=1, |dy|=2 -> NOT adjacent
      expect(result.isFlanked).toBe(true)
    })
  })

  // -------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------

  describe('edge cases', () => {
    it('should handle foes not adjacent to the target', () => {
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'a', position: { x: 0, y: 0 }, size: 1 },
        { id: 'b', position: { x: 10, y: 10 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(false)
      expect(result.effectiveFoeCount).toBe(0)
    })

    it('should handle mix of adjacent and non-adjacent foes', () => {
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'adj1', position: { x: 4, y: 5 }, size: 1 },
        { id: 'adj2', position: { x: 6, y: 5 }, size: 1 },
        { id: 'far', position: { x: 0, y: 0 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(true)
    })

    it('should return all adjacent foes as flankerIds when flanked', () => {
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 1, [
        { id: 'a', position: { x: 4, y: 5 }, size: 1 },
        { id: 'b', position: { x: 6, y: 5 }, size: 1 },
        { id: 'c', position: { x: 5, y: 4 }, size: 1 },
      ])
      expect(result.isFlanked).toBe(true)
      expect(result.flankerIds).toHaveLength(3)
      expect(result.flankerIds).toContain('a')
      expect(result.flankerIds).toContain('b')
      expect(result.flankerIds).toContain('c')
    })

    it('should default to requiring 2 foes for unknown token size', () => {
      const result = checkFlankingMultiTile({ x: 5, y: 5 }, 99, [
        { id: 'a', position: { x: 4, y: 5 }, size: 1 },
        { id: 'b', position: { x: 6, y: 5 }, size: 1 },
      ])
      expect(result.requiredFoes).toBe(2)
    })
  })
})
