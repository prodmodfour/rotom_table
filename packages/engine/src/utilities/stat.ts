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

/** Compute max HP for a combatant based on entity type */
export function maxHp(lens: CombatantLens): number {
  if (lens.entityType === 'pokemon') {
    // Pokemon need a level — stored on the entity, not the lens.
    // For now, we accept level as a property on the lens via the entity passthrough.
    const level = (lens as CombatantLens & { level?: number }).level ?? 1
    return computePokemonMaxHp(level, lens.stats.hp)
  }
  return computeTrainerMaxHp(lens.stats.hp)
}

/** Current HP = maxHp + hpDelta (hpDelta is negative for damage) */
export function currentHp(lens: CombatantLens): number {
  return maxHp(lens) + lens.hpDelta
}

/** Max energy derived from stamina stat */
export function maxEnergy(lens: CombatantLens): number {
  return computeEnergy(lens.stats.stamina)
}

/** Tick value (1/10 of real max HP, rounded down) */
export function tickValue(lens: CombatantLens): number {
  return computeTickValue(maxHp(lens))
}
