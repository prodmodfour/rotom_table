import { describe, it, expect } from 'vitest'
import { noEffect, intercept, merge } from '../src/utilities/result'

describe('noEffect', () => {
  it('returns an empty result with success=true', () => {
    const result = noEffect()
    expect(result.combatantDeltas.size).toBe(0)
    expect(result.encounterDelta).toBeNull()
    expect(result.events).toEqual([])
    expect(result.success).toBe(true)
    expect(result.intercepted).toBe(false)
  })
})

describe('intercept', () => {
  it('returns a result with intercepted=true', () => {
    const result = intercept()
    expect(result.intercepted).toBe(true)
    expect(result.success).toBe(true)
  })
})

describe('merge', () => {
  it('returns noEffect for zero inputs', () => {
    const result = merge()
    expect(result.combatantDeltas.size).toBe(0)
    expect(result.success).toBe(true)
  })

  it('passes through a single result', () => {
    const single = noEffect()
    single.combatantDeltas.set('entity-1', { hpDelta: -10 })
    single.success = true

    const result = merge(single)
    expect(result.combatantDeltas.get('entity-1')?.hpDelta).toBe(-10)
  })

  it('sums additive fields for same entity', () => {
    const a = noEffect()
    a.combatantDeltas.set('entity-1', { hpDelta: -10 })

    const b = noEffect()
    b.combatantDeltas.set('entity-1', { hpDelta: -5 })

    const result = merge(a, b)
    expect(result.combatantDeltas.get('entity-1')?.hpDelta).toBe(-15)
  })

  it('keeps separate entities separate', () => {
    const a = noEffect()
    a.combatantDeltas.set('entity-1', { hpDelta: -10 })

    const b = noEffect()
    b.combatantDeltas.set('entity-2', { hpDelta: -5 })

    const result = merge(a, b)
    expect(result.combatantDeltas.get('entity-1')?.hpDelta).toBe(-10)
    expect(result.combatantDeltas.get('entity-2')?.hpDelta).toBe(-5)
  })

  it('sums combat stage deltas additively', () => {
    const a = noEffect()
    a.combatantDeltas.set('entity-1', { combatStages: { atk: 2 } })

    const b = noEffect()
    b.combatantDeltas.set('entity-1', { combatStages: { atk: 1, spd: 1 } })

    const result = merge(a, b)
    const stages = result.combatantDeltas.get('entity-1')?.combatStages
    expect(stages?.atk).toBe(3)
    expect(stages?.spd).toBe(1)
  })

  it('concatenates events in order', () => {
    const a = noEffect()
    a.events = [{ round: 1, type: 'damage-dealt', sourceId: 'a', targetId: 'b' }]

    const b = noEffect()
    b.events = [{ round: 1, type: 'status-applied', sourceId: 'a', targetId: 'b' }]

    const result = merge(a, b)
    expect(result.events).toHaveLength(2)
    expect(result.events[0].type).toBe('damage-dealt')
    expect(result.events[1].type).toBe('status-applied')
  })

  it('intercepted wins if any result is intercepted', () => {
    const a = noEffect()
    const b = intercept()
    const c = noEffect()

    const result = merge(a, b, c)
    expect(result.intercepted).toBe(true)
  })

  it('last-writer-wins for success', () => {
    const a = noEffect()
    a.success = false

    const b = noEffect()
    b.success = true

    expect(merge(a, b).success).toBe(true)
    expect(merge(b, a).success).toBe(false)
  })

  it('concatenates status mutations', () => {
    const a = noEffect()
    a.combatantDeltas.set('entity-1', {
      statusConditions: [{ op: 'add', category: 'persistent', condition: 'burned' }],
    })

    const b = noEffect()
    b.combatantDeltas.set('entity-1', {
      statusConditions: [{ op: 'add', category: 'volatile', condition: 'confused' }],
    })

    const result = merge(a, b)
    expect(result.combatantDeltas.get('entity-1')?.statusConditions).toHaveLength(2)
  })

  it('uses replacement semantics for position (last writer wins)', () => {
    const a = noEffect()
    a.combatantDeltas.set('entity-1', { position: { x: 1, y: 2 } })

    const b = noEffect()
    b.combatantDeltas.set('entity-1', { position: { x: 5, y: 5 } })

    const result = merge(a, b)
    expect(result.combatantDeltas.get('entity-1')?.position).toEqual({ x: 5, y: 5 })
  })
})
