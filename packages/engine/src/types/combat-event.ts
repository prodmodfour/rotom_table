/**
 * Combat Event Log Schema
 *
 * Per combat-event-log-schema.md — structured historical record of combat
 * events, queryable by effects that depend on past actions.
 */

import type { DamageClass, EntityId, PokemonType } from './base'

export type CombatEventType =
  | 'damage-dealt'
  | 'damage-received'
  | 'faint'
  | 'status-applied'
  | 'move-used'
  | 'switch-in'
  | 'switch-out'
  | 'heal'
  | 'healing-attempted'
  | 'turn-start'
  | 'turn-end'
  | 'accuracy-check'
  | 'roll-completed'

/** Lean historical record stored in the combat log */
export interface CombatEvent {
  round: number
  type: CombatEventType
  sourceId: EntityId
  targetId: EntityId
  moveId?: string
  isDamagingMove?: boolean
  amount?: number
}

/**
 * Rich event type provided to trigger handlers during resolution.
 * Extends CombatEvent with transient metadata that doesn't persist in the log.
 */
export interface TriggerEvent extends CombatEvent {
  moveType?: PokemonType
  isContact?: boolean
  damageClass?: DamageClass
  moveRange?: 'melee' | 'ranged'
  sourceEntityId: EntityId
}
