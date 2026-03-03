import { describe, it, expect } from 'vitest'

/**
 * Tests for CombatantCaptureSection computed logic.
 *
 * Regression test for bug-045: availableTrainers must use the combatant's
 * `id` (combatant ID), NOT `entityId` (HumanCharacter entity ID).
 * CapturePanel passes this value as `trainerCombatantId` to the action
 * consumption endpoint, which expects a combatant ID.
 */

// Mirrors the data shape from the encounter store
interface MockCombatant {
  id: string
  type: 'human' | 'pokemon'
  entityId: string | null
  entity: Record<string, unknown>
  side: 'players' | 'allies' | 'enemies'
}

// Extract the availableTrainers logic from CombatantCaptureSection.vue
// so it can be tested in isolation (same pattern as CombatantCard.test.ts)
function getAvailableTrainers(combatants: MockCombatant[]) {
  return combatants
    .filter(c => c.type === 'human' && (c.side === 'players' || c.side === 'allies'))
    .map(c => ({
      id: c.id,
      name: (c.entity as any).name,
    }))
}

const createMockTrainerCombatant = (overrides: Partial<MockCombatant> = {}): MockCombatant => ({
  id: 'combatant-abc',
  type: 'human',
  entityId: 'entity-xyz',
  entity: { name: 'Ash Ketchum' },
  side: 'players',
  ...overrides,
})

describe('CombatantCaptureSection availableTrainers', () => {
  it('should use combatant id, NOT entityId (bug-045 regression)', () => {
    const combatant = createMockTrainerCombatant({
      id: 'combatant-abc',
      entityId: 'entity-xyz',
    })

    const trainers = getAvailableTrainers([combatant])

    expect(trainers).toHaveLength(1)
    // The critical assertion: id must be the COMBATANT id, not the entity id
    expect(trainers[0].id).toBe('combatant-abc')
    expect(trainers[0].id).not.toBe('entity-xyz')
  })

  it('should include player-side trainers', () => {
    const trainers = getAvailableTrainers([
      createMockTrainerCombatant({ id: 'comb-1', side: 'players', entity: { name: 'Ash' } }),
      createMockTrainerCombatant({ id: 'comb-2', side: 'allies', entity: { name: 'Brock' } }),
    ])

    expect(trainers).toHaveLength(2)
    expect(trainers[0].name).toBe('Ash')
    expect(trainers[1].name).toBe('Brock')
  })

  it('should exclude enemy-side trainers', () => {
    const trainers = getAvailableTrainers([
      createMockTrainerCombatant({ id: 'comb-1', side: 'players', entity: { name: 'Ash' } }),
      createMockTrainerCombatant({ id: 'comb-2', side: 'enemies', entity: { name: 'Team Rocket' } }),
    ])

    expect(trainers).toHaveLength(1)
    expect(trainers[0].name).toBe('Ash')
  })

  it('should exclude Pokemon combatants', () => {
    const trainers = getAvailableTrainers([
      createMockTrainerCombatant({ id: 'comb-1', side: 'players', entity: { name: 'Ash' } }),
      {
        id: 'comb-2',
        type: 'pokemon',
        entityId: 'poke-1',
        entity: { species: 'Pikachu' },
        side: 'players',
      },
    ])

    expect(trainers).toHaveLength(1)
    expect(trainers[0].name).toBe('Ash')
  })
})
