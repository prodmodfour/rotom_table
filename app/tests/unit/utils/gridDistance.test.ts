import { describe, it, expect } from 'vitest'
import { ptuDiagonalDistance, maxDiagonalCells } from '~/utils/gridDistance'

describe('ptuDiagonalDistance', () => {
  it('should return 0 for same position', () => {
    expect(ptuDiagonalDistance(0, 0)).toBe(0)
  })

  it('should return cardinal distance for straight lines', () => {
    expect(ptuDiagonalDistance(5, 0)).toBe(5)
    expect(ptuDiagonalDistance(0, 3)).toBe(3)
    expect(ptuDiagonalDistance(-4, 0)).toBe(4)
  })

  it('should apply alternating diagonal rule (1-2-1-2)', () => {
    // 1 diag = 1 + floor(1/2) = 1
    expect(ptuDiagonalDistance(1, 1)).toBe(1)
    // 2 diag = 2 + floor(2/2) = 3
    expect(ptuDiagonalDistance(2, 2)).toBe(3)
    // 3 diag = 3 + floor(3/2) = 4
    expect(ptuDiagonalDistance(3, 3)).toBe(4)
    // 4 diag = 4 + floor(4/2) = 6
    expect(ptuDiagonalDistance(4, 4)).toBe(6)
    // 5 diag = 5 + floor(5/2) = 7
    expect(ptuDiagonalDistance(5, 5)).toBe(7)
  })

  it('should handle mixed cardinal + diagonal', () => {
    // dx=3, dy=1: 1 diagonal + 2 straights = 1 + 0 + 2 = 3
    expect(ptuDiagonalDistance(3, 1)).toBe(3)
    // dx=4, dy=2: 2 diagonals + 2 straights = 2 + 1 + 2 = 5
    expect(ptuDiagonalDistance(4, 2)).toBe(5)
  })

  it('should handle negative deltas', () => {
    expect(ptuDiagonalDistance(-3, -3)).toBe(ptuDiagonalDistance(3, 3))
    expect(ptuDiagonalDistance(-2, 4)).toBe(ptuDiagonalDistance(2, 4))
  })
})

describe('maxDiagonalCells', () => {
  it('should return 0 for budget 0', () => {
    expect(maxDiagonalCells(0)).toBe(0)
  })

  it('should return 1 cell for budget 1 (first diagonal costs 1m)', () => {
    expect(maxDiagonalCells(1)).toBe(1)
  })

  it('should return 1 cell for budget 2 (next cell costs 2m, total 3m > 2m)', () => {
    expect(maxDiagonalCells(2)).toBe(1)
  })

  it('should return 2 cells for budget 3 (1+2=3m)', () => {
    expect(maxDiagonalCells(3)).toBe(2)
  })

  it('should return 3 cells for budget 4 (1+2+1=4m)', () => {
    expect(maxDiagonalCells(4)).toBe(3)
  })

  it('should return 4 cells for budget 6 (1+2+1+2=6m)', () => {
    expect(maxDiagonalCells(6)).toBe(4)
  })

  it('should return 5 cells for budget 7 (1+2+1+2+1=7m)', () => {
    expect(maxDiagonalCells(7)).toBe(5)
  })

  it('should return 5 cells for budget 8 (1+2+1+2+1=7m, next costs 2m for 9m > 8m)', () => {
    expect(maxDiagonalCells(8)).toBe(5)
  })
})
