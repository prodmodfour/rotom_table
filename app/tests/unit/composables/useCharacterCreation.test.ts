import { describe, it, expect } from 'vitest'
import { useCharacterCreation } from '~/composables/useCharacterCreation'

/**
 * Tests for the addEdge() guard in useCharacterCreation.
 * Verifies decree-027 compliance: Skill Edge strings cannot be injected
 * through the generic edge input to bypass the patheticSkills check.
 */
describe('useCharacterCreation — addEdge guard (decree-027)', () => {
  it('should block "Skill Edge: Athletics" and return error string', () => {
    const creation = useCharacterCreation()
    const result = creation.addEdge('Skill Edge: Athletics')
    expect(result).toBe('Skill Edges must be added through the Skill Edge selector, not typed directly')
    expect(creation.form.edges).toEqual([])
  })

  it('should block case-insensitive "skill edge: Perception"', () => {
    const creation = useCharacterCreation()
    const result = creation.addEdge('skill edge: Perception')
    expect(typeof result).toBe('string')
    expect(creation.form.edges).toEqual([])
  })

  it('should block "SKILL EDGE: Survival"', () => {
    const creation = useCharacterCreation()
    const result = creation.addEdge('SKILL EDGE: Survival')
    expect(typeof result).toBe('string')
    expect(creation.form.edges).toEqual([])
  })

  it('should allow "Basic Edge" and return null', () => {
    const creation = useCharacterCreation()
    const result = creation.addEdge('Basic Edge')
    expect(result).toBeNull()
    expect(creation.form.edges).toContain('Basic Edge')
  })

  it('should allow "Iron Mind" and return null', () => {
    const creation = useCharacterCreation()
    const result = creation.addEdge('Iron Mind')
    expect(result).toBeNull()
    expect(creation.form.edges).toContain('Iron Mind')
  })

  it('should allow edge names containing "skill" that are not Skill Edge format', () => {
    const creation = useCharacterCreation()
    const result = creation.addEdge('Multiskill Training')
    expect(result).toBeNull()
    expect(creation.form.edges).toContain('Multiskill Training')
  })
})
