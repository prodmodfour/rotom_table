/**
 * State Delta Model
 *
 * Per state-delta-model.md and encounter-delta-model.md — how effects write to
 * game state. Effects produce deltas; the engine applies them.
 */

import type { CombatStatKey, CombatStages, EntityId, GridPosition, Side } from './base'
import type { ActionBudget, ActiveEffect, EffectSource, OutOfTurnUsage, StatusType, VolatileType } from './lens'
import type { TerrainType, WeatherType } from './field-state'

// ─── Per-combatant delta ───

export interface StatusMutation {
  op: 'add' | 'remove'
  condition: StatusType
  source?: EffectSource
  appliedCombatStages?: Partial<Record<CombatStatKey, number>>
}

export interface VolatileMutation {
  op: 'add' | 'remove'
  condition: VolatileType
  source?: EffectSource
}

export interface ActiveEffectMutation {
  op: 'add' | 'remove'
  effect?: ActiveEffect
  effectId?: string
}

export interface StateDelta {
  // Additive fields
  hpDelta?: number
  injuries?: number
  energyCurrent?: number
  mettlePoints?: number
  fatigueLevel?: number

  // Additive-with-clamp (-6..+6)
  combatStages?: Partial<CombatStages>

  // Replacement fields
  tempHp?: number
  position?: GridPosition | null
  initiativeOverride?: number | null
  actedThisRound?: boolean
  stealthRockHitThisEncounter?: boolean
  actionBudget?: Partial<ActionBudget>
  outOfTurnUsage?: Partial<OutOfTurnUsage>

  // Mutation fields
  statusConditions?: StatusMutation[]
  volatileConditions?: VolatileMutation[]
  activeEffects?: ActiveEffectMutation[]
}

export interface EntityWriteDelta {
  heldItem?: { id: string; name: string } | null
  accessorySlotItem?: { id: string; name: string } | null
}

// ─── Encounter-level delta ───

export type WeatherMutation =
  | { op: 'set'; type: WeatherType; roundsRemaining: number }
  | { op: 'clear' }

export type TerrainMutation =
  | { op: 'set'; type: TerrainType; roundsRemaining: number }
  | { op: 'clear' }

export type HazardMutation =
  | { op: 'add'; instance: { type: string; positions: GridPosition[]; layers: number; ownerSide: Side } }
  | { op: 'add-layer'; type: string; positions: GridPosition[] }
  | { op: 'remove-all' }
  | { op: 'remove-by-type'; type: string; side: Side }

export type BlessingMutation =
  | { op: 'add'; instance: { blessingType: string; teamSide: Side; activationsRemaining: number } }
  | { op: 'consume'; blessingType: string }
  | { op: 'remove-all' }

export type CoatMutation =
  | { op: 'add'; instance: { type: string; entityId: EntityId; triggerTiming: 'turn-start' | 'turn-end' } }
  | { op: 'remove'; entityId: EntityId }
  | { op: 'remove-all' }

export type VortexMutation =
  | { op: 'add'; instance: { targetId: EntityId; casterId: EntityId; appliesTrapped: boolean; appliesSlowed: boolean; turnsElapsed: number } }
  | { op: 'remove'; targetId: EntityId }
  | { op: 'tick'; targetId: EntityId }

export type DeploymentMutation =
  | { op: 'switch-out'; trainerId: string; entityId: string }
  | { op: 'switch-in'; trainerId: string; entityId: string }
  | { op: 'faint'; trainerId: string; entityId: string }

export interface EncounterDelta {
  weather?: WeatherMutation
  terrain?: TerrainMutation
  hazards?: HazardMutation[]
  blessings?: BlessingMutation[]
  coats?: CoatMutation[]
  vortexes?: VortexMutation[]
  deploymentChanges?: DeploymentMutation[]
}
