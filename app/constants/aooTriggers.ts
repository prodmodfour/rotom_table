/**
 * AoO Trigger Detection Constants (PTU p.241)
 *
 * Maps AoO trigger types to their detection context.
 * Used by the trigger detection service to determine which triggers
 * to check based on the action being taken.
 */

import type { AoOTrigger } from '~/types/combat'

interface AoOTriggerInfo {
  /** When this trigger should be checked */
  checkOn: 'movement' | 'attack' | 'status_change' | 'maneuver' | 'item_action'
  /** Human-readable description of what triggered the AoO */
  description: string
}

/**
 * PTU p.241 AoO trigger definitions.
 * Each maps a trigger type to the action context it checks against.
 */
export const AOO_TRIGGER_MAP: Record<AoOTrigger, AoOTriggerInfo> = {
  /** PTU p.241: "An adjacent foe Shifts out of a Square adjacent to you." */
  shift_away: {
    checkOn: 'movement',
    description: 'shifted away from an adjacent enemy'
  },
  /** PTU p.241: "An adjacent foe uses a Ranged Attack that does not target someone adjacent to it." */
  ranged_attack: {
    checkOn: 'attack',
    description: 'used a ranged attack while adjacent to an enemy'
  },
  /** PTU p.241: "An adjacent foe stands up." */
  stand_up: {
    checkOn: 'status_change',
    description: 'stood up from Tripped while adjacent to an enemy'
  },
  /** PTU p.241: "An adjacent foe uses a Push, Grapple, Disarm, Trip, or Dirty Trick Maneuver that does not target you." */
  maneuver_other: {
    checkOn: 'maneuver',
    description: 'used a combat maneuver not targeting an adjacent enemy'
  },
  /** PTU p.241: "An adjacent foe uses a Standard Action to pick up or retrieve an item." */
  retrieve_item: {
    checkOn: 'item_action',
    description: 'picked up an item while adjacent to an enemy'
  }
} as const

/**
 * Maneuver IDs that trigger AoO when used against a non-adjacent target.
 * Matches the maneuver IDs in COMBAT_MANEUVERS constant.
 */
export const AOO_TRIGGERING_MANEUVERS: readonly string[] = [
  'push', 'grapple', 'disarm', 'trip', 'dirty-trick'
] as const

/**
 * The AC (accuracy check) value for a standard Struggle Attack.
 * PTU p.240: Struggle Attack AC 4.
 */
export const AOO_STRUGGLE_ATTACK_AC = 4

/**
 * Base damage for a standard Struggle Attack.
 * PTU: DB4 = 1d8+6 (Physical, Typeless, Melee).
 * In set damage mode, DB4 avg = 11 (per DAMAGE_BASE_CHART).
 */
export const AOO_STRUGGLE_ATTACK_DAMAGE_BASE = 11

/**
 * Expert+ Combat Skill Struggle Attack stats (PTU p.240).
 * "If a Trainer or Pokemon has a Combat Skill Rank of Expert or higher,
 * Struggle Attacks instead have an AC of 3 and a Damage Base of 5."
 * DB5 avg = 13 (per DAMAGE_BASE_CHART).
 */
export const AOO_EXPERT_STRUGGLE_ATTACK_AC = 3
export const AOO_EXPERT_STRUGGLE_ATTACK_DAMAGE_BASE = 13
