/**
 * Combat Lens Sub-Interfaces
 *
 * Per combat-lens-sub-interfaces.md — the per-combatant lens state decomposed
 * into narrow sub-interfaces per ISP. Utility functions are typed to receive
 * only the sub-interfaces they need.
 */

import type {
  CombatStatKey,
  CombatStages,
  EntityId,
  GridPosition,
  ItemRef,
  MovementProfile,
  MoveRef,
  PokemonType,
  Side,
  StatBlock,
  TraitRef,
} from './base'

// ─── Entity-sourced interfaces (read-only during combat) ───

export interface HasIdentity {
  id: EntityId
  entityId: EntityId
  entityType: 'pokemon' | 'trainer'
  name: string
  side: Side
  level: number | null  // Pokemon have levels 1-20; trainers are null (per only-pokemon-have-levels)
}

/** Trainers do NOT implement this — they are typeless per PTR rules */
export interface HasTypes {
  types: PokemonType[]
}

export interface HasStats {
  stats: StatBlock
}

export interface HasMoves {
  moves: MoveRef[]
}

export interface HasTraits {
  traits: TraitRef[]
}

export interface HasInventory {
  heldItem: ItemRef | null
  accessorySlotItem: ItemRef | null
}

export interface HasMovement {
  movementTypes: MovementProfile[]
  weightClass: number
}

// ─── Lens-sourced interfaces (read-write during combat) ───

export interface HasCombatStages {
  combatStages: CombatStages
}

export interface HasHealth {
  hpDelta: number
  tempHp: number
  injuries: number
}

export interface HasEnergy {
  energyCurrent: number
}

export type StatusType = 'paralyzed' | 'burned' | 'frozen' | 'poisoned' | 'badly-poisoned' | 'stuck' | 'trapped'

export type VolatileType = 'confused' | 'flinched' | 'infatuated' | 'cursed' | 'slowed' | 'vulnerable' | 'enraged' | 'taunted' | 'disabled' | 'tripped'

export interface StatusInstance {
  condition: StatusType
  source: EffectSource
  appliedCombatStages: Partial<Record<CombatStatKey, number>>
}

export interface VolatileInstance {
  condition: VolatileType
  source: EffectSource
}

export interface HasStatus {
  statusConditions: StatusInstance[]
  volatileConditions: VolatileInstance[]
  fatigueLevel: number
}

export interface HasPosition {
  position: GridPosition | null
}

export interface HasInitiative {
  initiativeOverride: number | null
  actedThisRound: boolean
}

export interface ActionBudget {
  standard: number
  movement: number
  swift: number
}

export interface OutOfTurnUsage {
  aooRemaining: number
  interruptUsed: boolean
}

export interface HasActions {
  actionBudget: ActionBudget
  outOfTurnUsage: OutOfTurnUsage
}

export interface HasActiveEffects {
  activeEffects: ActiveEffect[]
}

export interface HasPersistentResources {
  mettlePoints: number
  stealthRockHitThisEncounter: boolean
}

// ─── Supporting types ───

export interface EffectSource {
  type: 'move' | 'trait' | 'item' | 'field-state' | 'engine'
  id: string
  entityId: EntityId
}

export type ClearCondition = 'switch-out' | 'take-a-breather' | 'end-of-action' | 'caster-faint'

// TriggerRegistration lives in effect-contract.ts where the real handler type is defined.
// Type-only import avoids runtime circular dependency.
import type { TriggerRegistration } from './effect-contract'
export type { TriggerRegistration }

export interface ActiveEffect {
  effectId: string
  sourceEntityId: EntityId
  state: Record<string, unknown>
  expiresAt?: { round: number } | { onEvent: string }
  triggers?: TriggerRegistration[]
  clearedBy?: ClearCondition[]
}

// ─── Composite lens type ───

/** The full combat lens — all sub-interfaces combined.
 * HasTypes is partial because trainers are typeless per PTR rules. */
export type CombatantLens =
  & HasIdentity
  & Partial<HasTypes>
  & HasStats
  & HasMoves
  & HasTraits
  & HasInventory
  & HasMovement
  & HasCombatStages
  & HasHealth
  & HasEnergy
  & HasStatus
  & HasPosition
  & HasInitiative
  & HasActions
  & HasActiveEffects
  & HasPersistentResources
