/**
 * Stat computation utilities.
 *
 * Per effective-stat-formula.md — effectiveStat computes the in-combat value
 * of a stat from the base stat and combat stage.
 */

import type { CombatantLens } from '../types'
import type { CombatStatKey } from '../types/base'
import { applyStageMultiplier, computeEnergy, computePokemonMaxHp, computeTrainerMaxHp, computeTickValue } from '../constants'

/**
 * Compute the effective (in-combat) value of a combat stat.
 * effectiveStat = floor(baseStat * stageMultiplier)
 */
export function effectiveStat(lens: CombatantLens, stat: CombatStatKey): number {
  const baseStat = lens.stats[stat]
  const stage = lens.combatStages[stat] ?? 0
  return applyStageMultiplier(baseStat, stage)
}

/**
 * Compute max HP for a combatant based on entity type.
 * Per combat-lens-sub-interfaces.md — level is entity-sourced, not lens state.
 * The caller provides level from the entity; trainers have no level.
 */
export function maxHp(lens: CombatantLens, level?: number): number {
  if (lens.entityType === 'pokemon') {
    if (level === undefined) {
      throw new Error('maxHp requires level for Pokemon — level is entity-sourced, not lens state')
    }
    return computePokemonMaxHp(level, lens.stats.hp)
  }
  return computeTrainerMaxHp(lens.stats.hp)
}

/** Current HP = maxHp + hpDelta (hpDelta is negative for damage) */
export function currentHp(lens: CombatantLens, level?: number): number {
  return maxHp(lens, level) + lens.hpDelta
}

/** Max energy derived from stamina stat */
export function maxEnergy(lens: CombatantLens): number {
  return computeEnergy(lens.stats.stamina)
}

/** Tick value (1/10 of real max HP, rounded down) */
export function tickValue(lens: CombatantLens, level?: number): number {
  return computeTickValue(maxHp(lens, level))
}
