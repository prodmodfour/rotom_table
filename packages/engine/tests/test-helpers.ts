/**
 * Shared test factories for @rotom/engine tests.
 *
 * Extracted per finding 126 — eliminates makeLens/makeCtx/makeTriggerCtx
 * duplication across 5 test files.
 */

import type { CombatantLens } from '../src/types'
import type { EffectContext, TriggerContext, ResolutionContext, EncounterReadState } from '../src/types/effect-contract'
import type { TriggerEvent } from '../src/types/combat-event'

export function makeLens(overrides: Partial<CombatantLens> = {}): CombatantLens {
  return {
    id: 'test-id', entityId: 'test-entity', entityType: 'pokemon', name: 'Test', side: 'allies',
    level: 10,
    types: ['normal'],
    stats: { hp: 10, atk: 10, def: 10, spatk: 10, spdef: 10, spd: 10, stamina: 10 },
    moves: [], traits: [], heldItem: null, accessorySlotItem: null,
    movementTypes: [{ type: 'land', speed: 4 }], weightClass: 3,
    combatStages: { atk: 0, def: 0, spatk: 0, spdef: 0, spd: 0, accuracy: 0 },
    hpDelta: 0, tempHp: 0, injuries: 0, energyCurrent: 6,
    statusConditions: [], volatileConditions: [], fatigueLevel: 0,
    position: { x: 0, y: 0 }, initiativeOverride: null, actedThisRound: false,
    actionBudget: { standard: 1, movement: 1, swift: 1 },
    outOfTurnUsage: { aooRemaining: 1, interruptUsed: false },
    activeEffects: [], mettlePoints: 0, stealthRockHitThisEncounter: false,
    ...overrides,
  } satisfies CombatantLens
}

export function makeEncounter(overrides: Partial<EncounterReadState> = {}): EncounterReadState {
  return {
    weather: null, terrain: null, hazards: [], blessings: [], coats: [], vortexes: [],
    events: [], round: 1, currentTurnIndex: 0,
    ...overrides,
  }
}

export function makeResolution(overrides: Partial<ResolutionContext> = {}): ResolutionContext {
  return {
    accuracyRoll: 15,
    damageRolls: [10],
    multiHitCount: 1,
    playerDecisions: {},
    interruptDecisions: {},
    ...overrides,
  }
}

export function makeCtx(overrides: {
  user?: Partial<CombatantLens>
  target?: Partial<CombatantLens>
  allCombatants?: CombatantLens[]
  accuracyRoll?: number
  damageRolls?: number[]
  multiHitCount?: number
  encounter?: Partial<EncounterReadState>
} = {}): EffectContext {
  const user = makeLens({ id: 'user-1', side: 'allies', ...overrides.user })
  const target = makeLens({ id: 'target-1', side: 'enemies', ...overrides.target })
  return {
    user, target,
    allCombatants: overrides.allCombatants ?? [user, target],
    encounter: makeEncounter(overrides.encounter),
    resolution: makeResolution({
      accuracyRoll: overrides.accuracyRoll ?? 15,
      damageRolls: overrides.damageRolls ?? [10],
      multiHitCount: overrides.multiHitCount ?? 1,
    }),
    effectSource: { type: 'move', id: 'test', entityId: user.entityId },
  }
}

export function makeTriggerCtx(
  ctxOverrides: Parameters<typeof makeCtx>[0],
  event: Partial<TriggerEvent> = {},
): TriggerContext {
  const ctx = makeCtx(ctxOverrides)
  return {
    ...ctx,
    event: {
      round: 1, type: 'damage-received', sourceId: 'user-1', targetId: 'target-1',
      sourceEntityId: 'user-1', ...event,
    },
    eventSource: ctx.user,
  }
}
