import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref, computed } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useTerrainStore } from '~/stores/terrain'
import type { Combatant, Move } from '~/types'

// Stub Vue's ref/computed as globals — Nuxt auto-imports them but tests don't
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)

// Mock auto-imported composables that useMoveCalculation depends on
vi.mock('~/utils/diceRoller', () => ({
  roll: vi.fn(() => ({ total: 10, dice: [10], notation: '1d20' })),
}))

vi.mock('~/utils/equipmentBonuses', () => ({
  computeEquipmentBonuses: vi.fn(() => ({
    evasionBonus: 0,
    damageReduction: 0,
    statBonuses: {},
    conditionalDR: [],
  })),
}))

vi.mock('~/utils/combatSides', () => ({
  isEnemySide: (actorSide: string, otherSide: string) => {
    if (actorSide === 'enemies') return otherSide !== 'enemies'
    return otherSide === 'enemies'
  },
}))

// Stub auto-imported composables via global mocks
// These are auto-imported by Nuxt but need explicit stubs in tests
const mockUseDamageCalculation = vi.fn(() => ({
  rollDamageBase: vi.fn(),
  getDamageRoll: vi.fn(),
}))

const mockUseTypeChart = vi.fn(() => ({
  hasSTAB: vi.fn(() => false),
  getTypeEffectiveness: vi.fn(() => 1),
  getEffectivenessDescription: vi.fn(() => 'neutral'),
}))

const mockUseCombat = vi.fn(() => ({
  applyStageModifier: vi.fn((base: number) => base),
  calculatePhysicalEvasion: vi.fn(() => 0),
  calculateSpecialEvasion: vi.fn(() => 0),
  calculateSpeedEvasion: vi.fn(() => 0),
}))

const mockUseEntityStats = vi.fn(() => ({
  getStageModifiers: vi.fn(() => ({ accuracy: 0, evasion: 0, defense: 0, specialDefense: 0, speed: 0 })),
  getPokemonAttackStat: vi.fn(() => 10),
  getPokemonSpAtkStat: vi.fn(() => 10),
  getPokemonDefenseStat: vi.fn(() => 10),
  getPokemonSpDefStat: vi.fn(() => 10),
  getPokemonSpeedStat: vi.fn(() => 10),
  getHumanStat: vi.fn(() => 10),
}))

const mockUseCombatantDisplay = vi.fn(() => ({
  getCombatantNameById: vi.fn(() => 'Test'),
}))

const mockUseRangeParser = vi.fn(() => ({
  parseRange: vi.fn(() => ({ type: 'ranged', range: 10 })),
  isInRange: vi.fn(() => true),
  closestCellPair: vi.fn((a: { position: { x: number; y: number }; size: number }, b: { position: { x: number; y: number }; size: number }) => ({
    from: a.position,
    to: b.position,
  })),
}))

// Register global auto-imports for the composable
vi.stubGlobal('useDamageCalculation', mockUseDamageCalculation)
vi.stubGlobal('useTypeChart', mockUseTypeChart)
vi.stubGlobal('useCombat', mockUseCombat)
vi.stubGlobal('useEntityStats', mockUseEntityStats)
vi.stubGlobal('useCombatantDisplay', mockUseCombatantDisplay)
vi.stubGlobal('useRangeParser', mockUseRangeParser)

// Import after mocks are set up
import { useMoveCalculation } from '~/composables/useMoveCalculation'

/**
 * Build a minimal Combatant stub for testing rough terrain penalty.
 */
function makeCombatant(overrides: {
  id?: string
  side?: 'players' | 'allies' | 'enemies'
  position?: { x: number; y: number }
  tokenSize?: number
} = {}): Combatant {
  return {
    id: overrides.id ?? 'combatant-1',
    type: 'pokemon',
    entityId: 'entity-1',
    side: overrides.side ?? 'players',
    initiative: 0,
    initiativeBonus: 0,
    turnState: {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false,
    },
    hasActed: false,
    actionsRemaining: 1,
    shiftActionsRemaining: 1,
    tempConditions: [],
    injuries: { count: 0, sources: [] },
    physicalEvasion: 0,
    specialEvasion: 0,
    speedEvasion: 0,
    tokenSize: overrides.tokenSize ?? 1,
    position: overrides.position,
    entity: {
      id: 'entity-1',
      types: ['Normal'],
      statusConditions: [],
      stageModifiers: {
        attack: 0, defense: 0, specialAttack: 0,
        specialDefense: 0, speed: 0, accuracy: 0, evasion: 0,
      },
    } as Combatant['entity'],
  }
}

function makeMove(overrides: Partial<Move> = {}): Move {
  return {
    id: 'move-1',
    name: 'Tackle',
    type: 'Normal',
    damageBase: 5,
    damageClass: 'Physical',
    ac: 3,
    frequency: 'At-Will',
    range: '6, 1 Target',
    effect: '',
    contestType: '',
    contestEffect: '',
    ...overrides,
  }
}

describe('useMoveCalculation — getRoughTerrainPenalty', () => {
  let terrainStore: ReturnType<typeof useTerrainStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    terrainStore = useTerrainStore()
  })

  describe('painted rough terrain triggers -2 penalty', () => {
    it('should return 2 when a painted rough cell is on the line of sight', () => {
      // Actor at (0,0), target at (4,0) — line goes through (1,0), (2,0), (3,0)
      // Paint rough terrain at (2,0)
      terrainStore.setTerrain(2, 0, 'normal', { rough: true, slow: false })

      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 4, y: 0 } })
      const move = ref(makeMove())
      const targets = ref([target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets)

      expect(getRoughTerrainPenalty('target')).toBe(2)
    })

    it('should return 0 when painted rough terrain is not on the line of sight', () => {
      // Actor at (0,0), target at (4,0) — line goes through (1,0), (2,0), (3,0)
      // Paint rough terrain at (2,5) — off the path
      terrainStore.setTerrain(2, 5, 'normal', { rough: true, slow: false })

      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 4, y: 0 } })
      const move = ref(makeMove())
      const targets = ref([target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets)

      expect(getRoughTerrainPenalty('target')).toBe(0)
    })

    it('should return 0 when rough terrain is only at actor position (excluded)', () => {
      // Actor at (0,0), target at (3,0)
      // Rough terrain at (0,0) — actor's own cell, should be excluded
      terrainStore.setTerrain(0, 0, 'normal', { rough: true, slow: false })

      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 3, y: 0 } })
      const move = ref(makeMove())
      const targets = ref([target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets)

      expect(getRoughTerrainPenalty('target')).toBe(0)
    })

    it('should return 0 when rough terrain is only at target position (excluded)', () => {
      // Actor at (0,0), target at (3,0)
      // Rough terrain at (3,0) — target's own cell, should be excluded
      terrainStore.setTerrain(3, 0, 'normal', { rough: true, slow: false })

      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 3, y: 0 } })
      const move = ref(makeMove())
      const targets = ref([target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets)

      expect(getRoughTerrainPenalty('target')).toBe(0)
    })

    it('should return 2 for diagonal line through rough terrain', () => {
      // Actor at (0,0), target at (3,3) — diagonal line through (1,1), (2,2)
      terrainStore.setTerrain(2, 2, 'normal', { rough: true, slow: false })

      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 3, y: 3 } })
      const move = ref(makeMove())
      const targets = ref([target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets)

      expect(getRoughTerrainPenalty('target')).toBe(2)
    })

    it('should return 2 for water terrain with rough flag on the line', () => {
      // Water + rough flag combination (decree-010: multi-tag system)
      terrainStore.setTerrain(2, 0, 'water', { rough: true, slow: false })

      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 4, y: 0 } })
      const move = ref(makeMove())
      const targets = ref([target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets)

      expect(getRoughTerrainPenalty('target')).toBe(2)
    })

    it('should return 0 for slow terrain without rough flag (slow does not affect accuracy)', () => {
      // Slow terrain only — no accuracy penalty per decree-010
      terrainStore.setTerrain(2, 0, 'normal', { rough: false, slow: true })

      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 4, y: 0 } })
      const move = ref(makeMove())
      const targets = ref([target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets)

      expect(getRoughTerrainPenalty('target')).toBe(0)
    })
  })

  describe('enemy-occupied rough terrain still works', () => {
    it('should return 2 when an enemy is between actor and target', () => {
      // Actor at (0,0), target at (4,0)
      // Enemy combatant at (2,0) on the line
      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const enemy = makeCombatant({ id: 'enemy', side: 'enemies', position: { x: 2, y: 0 } })
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 4, y: 0 } })
      const move = ref(makeMove())
      const targets = ref([target])
      const allCombatants = ref([actor.value, enemy, target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets, allCombatants)

      expect(getRoughTerrainPenalty('target')).toBe(2)
    })
  })

  describe('combined sources (enemy-occupied + painted)', () => {
    it('should return 2 (flat, not cumulative) when both sources are on the line', () => {
      // Both an enemy and painted rough terrain on the line
      terrainStore.setTerrain(1, 0, 'normal', { rough: true, slow: false })

      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const enemy = makeCombatant({ id: 'enemy', side: 'enemies', position: { x: 3, y: 0 } })
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 5, y: 0 } })
      const move = ref(makeMove())
      const targets = ref([target])
      const allCombatants = ref([actor.value, enemy, target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets, allCombatants)

      // Penalty is flat -2, not cumulative per cell
      expect(getRoughTerrainPenalty('target')).toBe(2)
    })
  })

  describe('no positions (non-VTT encounter)', () => {
    it('should return 0 when actor has no position', () => {
      const actor = ref(makeCombatant({ id: 'actor', side: 'players' }))
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 4, y: 0 } })
      const move = ref(makeMove())
      const targets = ref([target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets)

      expect(getRoughTerrainPenalty('target')).toBe(0)
    })

    it('should return 0 when target has no position', () => {
      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const target = makeCombatant({ id: 'target', side: 'enemies' })
      const move = ref(makeMove())
      const targets = ref([target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets)

      expect(getRoughTerrainPenalty('target')).toBe(0)
    })
  })

  describe('adjacent combatants (no intermediate cells)', () => {
    it('should return 0 when actor and target are adjacent (no intermediate cells)', () => {
      // Actor at (0,0), target at (1,0) — no intermediate cells to check
      terrainStore.setTerrain(0, 0, 'normal', { rough: true, slow: false })
      terrainStore.setTerrain(1, 0, 'normal', { rough: true, slow: false })

      const actor = ref(makeCombatant({ id: 'actor', side: 'players', position: { x: 0, y: 0 } }))
      const target = makeCombatant({ id: 'target', side: 'enemies', position: { x: 1, y: 0 } })
      const move = ref(makeMove())
      const targets = ref([target])

      const { getRoughTerrainPenalty } = useMoveCalculation(move, actor, targets)

      // Both cells belong to actor/target, no intermediate cells to trigger penalty
      expect(getRoughTerrainPenalty('target')).toBe(0)
    })
  })
})
