/**
 * Game constants from PTR vault rules.
 */

import type { PokemonType } from './types/base'

/**
 * Combat stage multiplier table — asymmetric scaling.
 * Per combat-stage-asymmetric-scaling.md:
 * Buffs range wider (+6 = x2.0) than debuffs (-6 = x0.4).
 */
export const STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 0.4,
  [-5]: 0.5,
  [-4]: 0.57,
  [-3]: 0.67,
  [-2]: 0.8,
  [-1]: 0.9,
  [0]: 1.0,
  [1]: 1.1,
  [2]: 1.2,
  [3]: 1.33,
  [4]: 1.5,
  [5]: 1.67,
  [6]: 2.0,
}

/**
 * Damage Base to dice expression table.
 * Per damage-base-to-dice-table.md.
 */
export const DB_TO_DICE: Record<number, { dice: number; sides: number; flat: number }> = {
  1: { dice: 1, sides: 6, flat: 1 },
  2: { dice: 1, sides: 6, flat: 3 },
  3: { dice: 1, sides: 6, flat: 5 },
  4: { dice: 1, sides: 8, flat: 6 },
  5: { dice: 1, sides: 8, flat: 8 },
  6: { dice: 2, sides: 6, flat: 8 },
  7: { dice: 2, sides: 6, flat: 10 },
  8: { dice: 2, sides: 8, flat: 10 },
  9: { dice: 2, sides: 10, flat: 10 },
  10: { dice: 3, sides: 8, flat: 10 },
  11: { dice: 3, sides: 10, flat: 10 },
  12: { dice: 3, sides: 12, flat: 10 },
  13: { dice: 4, sides: 10, flat: 10 },
  14: { dice: 4, sides: 10, flat: 15 },
  15: { dice: 4, sides: 10, flat: 20 },
  16: { dice: 5, sides: 10, flat: 20 },
  17: { dice: 5, sides: 12, flat: 25 },
  18: { dice: 6, sides: 12, flat: 25 },
  19: { dice: 6, sides: 12, flat: 30 },
  20: { dice: 6, sides: 12, flat: 35 },
  21: { dice: 6, sides: 12, flat: 40 },
  22: { dice: 6, sides: 12, flat: 45 },
  23: { dice: 6, sides: 12, flat: 50 },
  24: { dice: 6, sides: 12, flat: 55 },
  25: { dice: 6, sides: 12, flat: 60 },
  26: { dice: 7, sides: 12, flat: 65 },
  27: { dice: 8, sides: 12, flat: 70 },
  28: { dice: 8, sides: 12, flat: 80 },
}

/**
 * Type effectiveness chart — PTR uses 17 types (Flying removed).
 * Per type-effectiveness-chart.md.
 * Values: 2 = super effective, 1 = neutral, 0.5 = resisted, 0 = immune.
 * Only non-neutral entries are stored.
 */
export const TYPE_EFFECTIVENESS: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal: { rock: 0.5, steel: 0.5, ghost: 0 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, bug: 0.5, rock: 2, steel: 2 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
}

/**
 * Energy = max(3, floor(2 * sqrt(Stamina)))
 * Per energy-stamina-scaling.md.
 */
export function computeEnergy(stamina: number): number {
  return Math.max(3, Math.floor(2 * Math.sqrt(stamina)))
}

/**
 * Pokemon HP = (Level * 5) + (HP stat * 3) + 10
 * Per pokemon-hp-formula.md.
 */
export function computePokemonMaxHp(level: number, hpStat: number): number {
  return (level * 5) + (hpStat * 3) + 10
}

/**
 * Trainer HP = (HP stat * 3) + 10
 * Per trainer-hp-formula.md. Trainers have no level component.
 */
export function computeTrainerMaxHp(hpStat: number): number {
  return (hpStat * 3) + 10
}

/** 1 tick = floor(maxHp / 10). Per tick-value-one-tenth-max-hp.md. */
export function computeTickValue(maxHp: number): number {
  return Math.floor(maxHp / 10)
}

/** Clamp combat stage to valid range */
export function clampStage(stage: number): number {
  return Math.max(-6, Math.min(6, stage))
}

/**
 * Apply stage multiplier to a base stat value.
 * Per combat-stage-asymmetric-scaling.md and always-round-down.md.
 */
export function applyStageMultiplier(baseStat: number, stage: number): number {
  const clamped = clampStage(stage)
  const multiplier = STAGE_MULTIPLIERS[clamped] ?? 1.0
  return Math.floor(baseStat * multiplier)
}

/**
 * Type effectiveness multiplier for an attack type vs a list of defending types.
 * Per type-effectiveness-chart.md dual-type interaction rules.
 */
export function getTypeEffectiveness(attackType: PokemonType, defenderTypes: PokemonType[]): number {
  if (defenderTypes.length === 0) return 1

  let multiplier = 1
  for (const defType of defenderTypes) {
    const chart = TYPE_EFFECTIVENESS[attackType]
    const factor = chart?.[defType] ?? 1
    multiplier *= factor
  }
  return multiplier
}
