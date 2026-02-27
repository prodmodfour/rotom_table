import { describe, it, expect } from 'vitest'
import { migrateLegacyCell } from '~/stores/terrain'

describe('migrateLegacyCell', () => {
  it('should convert difficult type without flags to normal + slow', () => {
    const result = migrateLegacyCell({
      position: { x: 0, y: 0 },
      type: 'difficult',
      elevation: 0,
    })

    expect(result.type).toBe('normal')
    expect(result.flags).toEqual({ rough: false, slow: true })
  })

  it('should convert rough type without flags to normal + rough', () => {
    const result = migrateLegacyCell({
      position: { x: 0, y: 0 },
      type: 'rough',
      elevation: 0,
    })

    expect(result.type).toBe('normal')
    expect(result.flags).toEqual({ rough: true, slow: false })
  })

  it('should convert difficult type with existing flags to normal + slow merged', () => {
    const result = migrateLegacyCell({
      position: { x: 0, y: 0 },
      type: 'difficult',
      elevation: 0,
      flags: { rough: true, slow: false },
    })

    expect(result.type).toBe('normal')
    expect(result.flags).toEqual({ rough: true, slow: true })
  })

  it('should convert rough type with existing flags to normal + rough merged', () => {
    const result = migrateLegacyCell({
      position: { x: 0, y: 0 },
      type: 'rough',
      elevation: 0,
      flags: { rough: false, slow: true },
    })

    expect(result.type).toBe('normal')
    expect(result.flags).toEqual({ rough: true, slow: true })
  })

  it('should pass through non-legacy type with flags unchanged', () => {
    const result = migrateLegacyCell({
      position: { x: 5, y: 5 },
      type: 'water',
      elevation: 2,
      note: 'deep',
      flags: { rough: false, slow: true },
    })

    expect(result.type).toBe('water')
    expect(result.flags).toEqual({ rough: false, slow: true })
    expect(result.elevation).toBe(2)
    expect(result.note).toBe('deep')
  })

  it('should add default flags to non-legacy type without flags', () => {
    const result = migrateLegacyCell({
      position: { x: 0, y: 0 },
      type: 'water',
      elevation: 0,
    })

    expect(result.type).toBe('water')
    expect(result.flags).toEqual({ rough: false, slow: false })
  })

  it('should preserve position, elevation, and note', () => {
    const result = migrateLegacyCell({
      position: { x: 3, y: 7 },
      type: 'difficult',
      elevation: 4,
      note: 'muddy',
    })

    expect(result.position).toEqual({ x: 3, y: 7 })
    expect(result.elevation).toBe(4)
    expect(result.note).toBe('muddy')
  })
})
