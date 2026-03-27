/**
 * Effect Handler Contract
 *
 * Per effect-handler-contract.md — the shared interface for all move and trait
 * effect implementations. Handlers are typed functions, not data structures.
 */

import type { DamageClass, EntityId, MovementType, PokemonType, StatKey } from './base'
import type { CombatEvent, CombatEventType, TriggerEvent } from './combat-event'
import type { EncounterDelta, EntityWriteDelta, StateDelta } from './delta'
import type { FieldState, WeatherType } from './field-state'
import type {
  ActiveEffect,
  ClearCondition,
  CombatantLens,
  EffectSource,
} from './lens'

// ─── Context types ───

export interface ResolutionContext {
  accuracyRoll: number
  damageRolls: number[]
  multiHitCount: number
  playerDecisions: Record<string, unknown>
  interruptDecisions: Record<string, unknown>
}

export interface EncounterReadState extends FieldState {
  events: CombatEvent[]
  round: number
  currentTurnIndex: number
}

export interface EffectContext {
  user: CombatantLens
  target: CombatantLens
  allCombatants: CombatantLens[]
  encounter: EncounterReadState
  resolution: ResolutionContext
  effectSource: EffectSource
}

export interface TriggerContext extends EffectContext {
  event: TriggerEvent
  eventSource: CombatantLens
}

// ─── Result types ───

export type PendingModification =
  | { type: 'scale-damage'; factor: number }
  | { type: 'flat-damage-reduction'; amount: number }
  | { type: 'accuracy-bonus'; amount: number }

export interface EmbeddedActionSpec {
  actionType: 'swift' | 'attack-of-opportunity'
  result: EffectResult
}

export interface TriggeredEffect {
  triggerId: string
  handler: TraitTriggerHandler
}

export interface EffectResult {
  combatantDeltas: Map<EntityId, StateDelta>
  encounterDelta: EncounterDelta | null
  entityWriteDeltas: Map<EntityId, EntityWriteDelta>
  events: CombatEvent[]
  triggers: TriggeredEffect[]
  success: boolean
  intercepted: boolean
  embeddedActions: EmbeddedActionSpec[]
  pendingModifications: PendingModification[]
}

// ─── Handler types ───

export type MoveHandler = (ctx: EffectContext) => EffectResult
export type TraitTriggerHandler = (ctx: TriggerContext) => EffectResult

export interface TriggerRegistration {
  eventType: CombatEventType
  timing: 'before' | 'after'
  scope: 'self' | 'ally' | 'enemy' | 'any'
  handler: TraitTriggerHandler
}

// ─── Definition types ───

export interface MoveDefinition {
  id: string
  name: string
  type: PokemonType
  damageClass: DamageClass
  damageBase: number | null
  accuracy: number
  range: MoveRange
  energyCost: number
  keywords?: string[]
  handler: MoveHandler
}

export type MoveRange =
  | { type: 'melee' }
  | { type: 'ranged'; min: number; max: number }
  | { type: 'self' }
  | { type: 'field' }

export interface PassiveEffectSpec {
  struggleAttackTypeOverride?: PokemonType
  moveTypeOverride?: { moveId: string; type: PokemonType }
  statMultiplier?: { stat: StatKey; multiplier: number }
  immunityGrant?: { type: PokemonType }
  weatherDamageImmunity?: WeatherType
  contactDamageImmunity?: boolean
  movementTypeGrant?: MovementType
  critBonusDamage?: number
  dbBoostThreshold?: number
  dbBoostAmount?: number
  dbBoostKeywords?: string[]
}

export interface TraitDefinition {
  id: string
  name: string
  category: 'innate' | 'learned' | 'emergent'
  scalingParam?: string
  triggers?: TriggerRegistration[]
  passiveEffects?: PassiveEffectSpec
}

// ─── Move restriction types ───

export type MoveRestriction = 'damaging-only' | 'status-only' | 'disabled'

export interface Duration {
  rounds?: number
  onEvent?: string
  clearedBy?: ClearCondition[]
}
