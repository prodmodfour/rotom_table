import { describe, it, expect } from 'vitest'
import { applyStatus, removeStatus } from '../src/utilities/status'
import { makeCtx } from './test-helpers'

describe('applyStatus', () => {
  it('adds a persistent status condition to the target', () => {
    const ctx = makeCtx()
    const result = applyStatus(ctx, { category: 'persistent', condition: 'burned' })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta).toBeDefined()
    expect(delta!.statusConditions).toBeDefined()
    expect(delta!.statusConditions![0].condition).toBe('burned')
    expect(delta!.statusConditions![0].op).toBe('add')
  })

  it('adds a volatile condition to the target', () => {
    const ctx = makeCtx()
    const result = applyStatus(ctx, { category: 'volatile', condition: 'confused' })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.volatileConditions).toBeDefined()
    expect(delta!.volatileConditions![0].condition).toBe('confused')
  })

  it('Electric types are immune to Paralysis', () => {
    const ctx = makeCtx({ target: { types: ['electric'] } })
    const result = applyStatus(ctx, { category: 'persistent', condition: 'paralyzed' })
    expect(result.combatantDeltas.size).toBe(0)
  })

  it('Fire types are immune to Burn', () => {
    const ctx = makeCtx({ target: { types: ['fire'] } })
    const result = applyStatus(ctx, { category: 'persistent', condition: 'burned' })
    expect(result.combatantDeltas.size).toBe(0)
  })

  it('Ice types are immune to Frozen', () => {
    const ctx = makeCtx({ target: { types: ['ice'] } })
    const result = applyStatus(ctx, { category: 'persistent', condition: 'frozen' })
    expect(result.combatantDeltas.size).toBe(0)
  })

  it('Poison types are immune to Poison', () => {
    const ctx = makeCtx({ target: { types: ['poison'] } })
    const result = applyStatus(ctx, { category: 'persistent', condition: 'poisoned' })
    expect(result.combatantDeltas.size).toBe(0)
  })

  it('Steel types are immune to Poison', () => {
    const ctx = makeCtx({ target: { types: ['steel'] } })
    const result = applyStatus(ctx, { category: 'persistent', condition: 'badly-poisoned' })
    expect(result.combatantDeltas.size).toBe(0)
  })

  it('Ghost types are immune to Stuck and Trapped', () => {
    const ctx = makeCtx({ target: { types: ['ghost'] } })
    expect(applyStatus(ctx, { category: 'persistent', condition: 'stuck' }).combatantDeltas.size).toBe(0)
    expect(applyStatus(ctx, { category: 'persistent', condition: 'trapped' }).combatantDeltas.size).toBe(0)
  })

  it('Burn auto-applies -2 Def combat stage', () => {
    const ctx = makeCtx()
    const result = applyStatus(ctx, { category: 'persistent', condition: 'burned' })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.combatStages).toBeDefined()
    expect(delta!.combatStages!.def).toBe(-2)
  })

  it('Poison auto-applies -2 SpDef combat stage', () => {
    const ctx = makeCtx()
    const result = applyStatus(ctx, { category: 'persistent', condition: 'poisoned' })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.combatStages!.spdef).toBe(-2)
  })

  it('non-immunized types can receive status normally', () => {
    const ctx = makeCtx({ target: { types: ['water'] } })
    const result = applyStatus(ctx, { category: 'persistent', condition: 'paralyzed' })
    expect(result.combatantDeltas.size).toBe(1)
  })

  it('produces a status-applied event', () => {
    const ctx = makeCtx()
    const result = applyStatus(ctx, { category: 'persistent', condition: 'burned' })
    expect(result.events.length).toBe(1)
    expect(result.events[0].type).toBe('status-applied')
  })
})

describe('removeStatus', () => {
  it('produces a remove mutation for persistent status', () => {
    const ctx = makeCtx()
    const result = removeStatus(ctx, { category: 'persistent', condition: 'burned' })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.statusConditions![0].op).toBe('remove')
    expect(delta!.statusConditions![0].condition).toBe('burned')
  })

  it('produces a remove mutation for volatile condition', () => {
    const ctx = makeCtx()
    const result = removeStatus(ctx, { category: 'volatile', condition: 'confused' })
    const delta = result.combatantDeltas.get('target-1')
    expect(delta!.volatileConditions![0].op).toBe('remove')
  })
})
