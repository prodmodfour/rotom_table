import { describe, it, expect } from 'vitest'
import { isEnemySide } from '~/utils/combatSides'

describe('isEnemySide', () => {
  it('should return false for same side', () => {
    expect(isEnemySide('players', 'players')).toBe(false)
    expect(isEnemySide('allies', 'allies')).toBe(false)
    expect(isEnemySide('enemies', 'enemies')).toBe(false)
  })

  it('should return false for players and allies (friendly)', () => {
    expect(isEnemySide('players', 'allies')).toBe(false)
    expect(isEnemySide('allies', 'players')).toBe(false)
  })

  it('should return true for enemies vs players', () => {
    expect(isEnemySide('enemies', 'players')).toBe(true)
    expect(isEnemySide('players', 'enemies')).toBe(true)
  })

  it('should return true for enemies vs allies', () => {
    expect(isEnemySide('enemies', 'allies')).toBe(true)
    expect(isEnemySide('allies', 'enemies')).toBe(true)
  })
})
