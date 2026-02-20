/**
 * PTU 1.05 Damage Calculator
 *
 * Pure functions for the 9-step damage formula (07-combat.md:834-847):
 * 1. Start with Move's Damage Base
 * 2. Apply Five-Strike/Double-Strike modifiers
 * 3. Apply STAB (+2 to DB)
 * 4. Look up set damage from DB chart (or roll)
 * 5. Apply critical hit (add dice damage again)
 * 6. Add stage-modified Attack stat
 * 7. Subtract stage-modified Defense stat + Damage Reduction
 * 8. Apply type effectiveness multiplier
 * 9. Minimum 1 damage (unless immune)
 *
 * Follows the captureRate.ts pattern: typed input, typed result with breakdown,
 * pure functions, zero side effects.
 */

// ============================================
// CONSTANTS
// ============================================

/**
 * Combat stage multiplier table (PTU 07-combat.md:701-728)
 * Positive: +20% per stage. Negative: -10% per stage.
 */
export const STAGE_MULTIPLIERS: Record<number, number> = {
  [-6]: 0.4,
  [-5]: 0.5,
  [-4]: 0.6,
  [-3]: 0.7,
  [-2]: 0.8,
  [-1]: 0.9,
  [0]: 1.0,
  [1]: 1.2,
  [2]: 1.4,
  [3]: 1.6,
  [4]: 1.8,
  [5]: 2.0,
  [6]: 2.2,
}

/**
 * Damage Base → Set Damage chart (PTU 07-combat.md:921-985)
 * Each entry: { min, avg, max } for the DB value.
 */
export const DAMAGE_BASE_CHART: Record<number, { min: number; avg: number; max: number }> = {
  1:  { min: 2,  avg: 5,   max: 7   },
  2:  { min: 4,  avg: 7,   max: 9   },
  3:  { min: 6,  avg: 9,   max: 11  },
  4:  { min: 7,  avg: 11,  max: 14  },
  5:  { min: 9,  avg: 13,  max: 16  },
  6:  { min: 10, avg: 15,  max: 20  },
  7:  { min: 12, avg: 17,  max: 22  },
  8:  { min: 12, avg: 19,  max: 26  },
  9:  { min: 12, avg: 21,  max: 30  },
  10: { min: 13, avg: 24,  max: 34  },
  11: { min: 13, avg: 27,  max: 40  },
  12: { min: 13, avg: 30,  max: 46  },
  13: { min: 14, avg: 35,  max: 50  },
  14: { min: 19, avg: 40,  max: 55  },
  15: { min: 24, avg: 45,  max: 60  },
  16: { min: 25, avg: 50,  max: 70  },
  17: { min: 30, avg: 60,  max: 85  },
  18: { min: 31, avg: 65,  max: 97  },
  19: { min: 36, avg: 70,  max: 102 },
  20: { min: 41, avg: 75,  max: 107 },
  21: { min: 46, avg: 80,  max: 112 },
  22: { min: 51, avg: 85,  max: 117 },
  23: { min: 56, avg: 90,  max: 122 },
  24: { min: 61, avg: 95,  max: 127 },
  25: { min: 66, avg: 100, max: 132 },
  26: { min: 72, avg: 110, max: 149 },
  27: { min: 78, avg: 120, max: 166 },
  28: { min: 88, avg: 130, max: 176 },
}

// Type chart data imported from canonical source
export { TYPE_CHART, NET_EFFECTIVENESS, getTypeEffectiveness, getEffectivenessLabel } from '~/utils/typeChart'

// ============================================
// EVASION & ACCURACY
// ============================================

/**
 * Calculate evasion using PTU's two-part system (07-combat.md:594-657).
 *
 * Part 1 — Stat-derived evasion (MULTIPLIER-based via combat stages):
 *   "for every 5 points ... they gain +1 [Physical/Special/Speed] Evasion, up to +6"
 *   Combat stages on Def/SpDef/Speed modify the stat via the multiplier table
 *   (e.g., CS +1 = x1.2), and evasion is derived from the modified stat.
 *
 * Part 2 — Evasion bonus from moves/effects (ADDITIVE, not multiplier):
 *   "Besides these base values for evasion, Moves and effects can raise or lower
 *    Evasion. These extra Changes in Evasion apply to all types of Evasion, and
 *    stack on top." (07-combat.md:648-653) Range: -6 to +6.
 *
 * The total evasion is clamped to min 0 because "Negative Evasion can erase
 * Evasion from other sources, but does not increase the Accuracy of an enemy's
 * Moves." The +9 cap on accuracy checks is enforced in calculateAccuracyThreshold.
 */
export function calculateEvasion(baseStat: number, combatStage: number = 0, evasionBonus: number = 0): number {
  // Part 1: Combat stage multiplier applied to stat, then derive evasion
  const statEvasion = Math.min(6, Math.floor(applyStageModifier(baseStat, combatStage) / 5))
  // Part 2: Bonus evasion from moves/effects stacks additively on top
  // Negative evasion can erase stat-derived evasion but total never goes below 0
  return Math.max(0, statEvasion + evasionBonus)
}

/**
 * Calculate accuracy threshold for a move.
 * PTU 07-combat.md:624-657
 * Threshold = moveAC + min(9, evasion) - attackerAccuracyStage
 * Result is clamped to min 1 (nat 1 always misses, nat 20 always hits — handled by caller).
 * Accuracy combat stages apply directly (not as multiplier).
 */
export function calculateAccuracyThreshold(
  moveAC: number,
  attackerAccuracyStage: number,
  defenderEvasion: number
): number {
  const effectiveEvasion = Math.min(9, defenderEvasion)
  return Math.max(1, moveAC + effectiveEvasion - attackerAccuracyStage)
}

export interface AccuracyCalcResult {
  moveAC: number
  attackerAccuracyStage: number
  /** Dynamic evasion from stage-modified Defense: min(6, floor(modifiedDef / 5)) */
  physicalEvasion: number
  /** Dynamic evasion from stage-modified SpDef: min(6, floor(modifiedSpDef / 5)) */
  specialEvasion: number
  /** Dynamic evasion from stage-modified Speed: min(6, floor(modifiedSpeed / 5)) */
  speedEvasion: number
  /** Best evasion for the defender: max(damage-class-matching evasion, Speed Evasion) per PTU p.234 */
  applicableEvasion: number
  /** min(9, applicableEvasion) — PTU cap on total evasion applied to one check */
  effectiveEvasion: number
  /** The d20 roll needed to hit: max(1, moveAC + effectiveEvasion - accuracyStage) */
  accuracyThreshold: number
}

// ============================================
// INPUT / OUTPUT TYPES
// ============================================

export interface DamageCalcInput {
  /** Attacker's types (for STAB check) */
  attackerTypes: string[]
  /** Base attack or spAtk stat (pre-stage, calculated stat) */
  attackStat: number
  /** Combat stage for the relevant attack stat (-6 to +6) */
  attackStage: number
  /** Move's type (e.g., 'Fire', 'Water') */
  moveType: string
  /** Move's Damage Base (1-28) */
  moveDamageBase: number
  /** Move's damage class — determines which stats are used */
  moveDamageClass: 'Physical' | 'Special'
  /** Target's types (for effectiveness calculation) */
  targetTypes: string[]
  /** Base defense or spDef stat (pre-stage, calculated stat) */
  defenseStat: number
  /** Combat stage for the relevant defense stat (-6 to +6) */
  defenseStage: number
  /** Whether this is a critical hit */
  isCritical?: boolean
  /** Flat damage reduction from abilities/items */
  damageReduction?: number
  /** Post-stage flat bonus to attack stat (e.g., Focus +5) — PTU p.295 */
  attackBonus?: number
  /** Post-stage flat bonus to defense stat (e.g., Focus +5) — PTU p.295 */
  defenseBonus?: number
}

export interface DamageCalcResult {
  finalDamage: number
  breakdown: {
    // Steps 1-3: Damage Base + STAB
    rawDB: number
    stabApplied: boolean
    effectiveDB: number
    // Steps 4-5: Set damage + critical
    setDamage: number
    criticalApplied: boolean
    critDamageBonus: number
    baseDamage: number
    // Step 6: Attack stat (stage-modified)
    rawAttackStat: number
    attackStageMultiplier: number
    effectiveAttack: number
    subtotalBeforeDefense: number
    // Step 7: Defense stat (stage-modified) + DR
    rawDefenseStat: number
    defenseStageMultiplier: number
    effectiveDefense: number
    damageReduction: number
    afterDefense: number
    // Step 8: Type effectiveness
    typeEffectiveness: number
    typeEffectivenessLabel: string
    afterEffectiveness: number
    // Final
    minimumApplied: boolean
  }
}

// ============================================
// PURE FUNCTIONS
// ============================================

/**
 * Apply combat stage multiplier to a base stat.
 * PTU 07-combat.md:670-675
 */
export function applyStageModifier(baseStat: number, stage: number): number {
  const clamped = Math.max(-6, Math.min(6, stage))
  return Math.floor(baseStat * STAGE_MULTIPLIERS[clamped])
}

/**
 * Apply stage modifier and then add a post-stage flat bonus (e.g., Focus +5).
 * PTU p.295: "This Bonus is applied AFTER Combat Stages."
 */
export function applyStageModifierWithBonus(
  baseStat: number,
  stage: number,
  postStageBonus: number = 0
): number {
  return applyStageModifier(baseStat, stage) + postStageBonus
}

/**
 * Check if attacker gets STAB (Same Type Attack Bonus).
 * PTU 07-combat.md:790-793
 */
export function hasSTAB(moveType: string, attackerTypes: string[]): boolean {
  return attackerTypes.includes(moveType)
}

/**
 * Get set damage (average) for a Damage Base value from the DB chart.
 */
export function getSetDamage(db: number): number {
  const clamped = Math.max(1, Math.min(28, db))
  return DAMAGE_BASE_CHART[clamped].avg
}

/**
 * Full PTU 9-step damage formula.
 * PTU 07-combat.md:834-847
 *
 * Steps:
 * 1-3: Damage Base + STAB → effective DB
 * 4-5: DB chart lookup → set damage + critical bonus
 * 6:   Add stage-modified attack stat
 * 7:   Subtract stage-modified defense stat + damage reduction (min 1)
 * 8:   Multiply by type effectiveness
 * 9:   Minimum 1 damage (unless immune)
 */
export function calculateDamage(input: DamageCalcInput): DamageCalcResult {
  // Steps 1-3: Damage Base + STAB
  const rawDB = input.moveDamageBase
  const stabApplied = hasSTAB(input.moveType, input.attackerTypes)
  const effectiveDB = rawDB + (stabApplied ? 2 : 0)

  // Steps 4-5: Set damage from chart + critical
  const setDamage = getSetDamage(effectiveDB)
  const criticalApplied = input.isCritical ?? false
  const critDamageBonus = criticalApplied ? getSetDamage(effectiveDB) : 0
  const baseDamage = setDamage + critDamageBonus

  // Step 6: Add attack stat (stage-modified + post-stage bonus from Focus items)
  const attackStageMultiplier = STAGE_MULTIPLIERS[Math.max(-6, Math.min(6, input.attackStage))]
  const effectiveAttack = applyStageModifierWithBonus(input.attackStat, input.attackStage, input.attackBonus ?? 0)
  const subtotalBeforeDefense = baseDamage + effectiveAttack

  // Step 7: Subtract defense stat (stage-modified + post-stage bonus from Focus items) + damage reduction
  const defenseStageMultiplier = STAGE_MULTIPLIERS[Math.max(-6, Math.min(6, input.defenseStage))]
  const effectiveDefense = applyStageModifierWithBonus(input.defenseStat, input.defenseStage, input.defenseBonus ?? 0)
  const dr = input.damageReduction ?? 0
  const afterDefense = Math.max(1, subtotalBeforeDefense - effectiveDefense - dr)

  // Step 8: Type effectiveness
  const typeEffectiveness = getTypeEffectiveness(input.moveType, input.targetTypes)
  const typeEffectivenessLabel = getEffectivenessLabel(typeEffectiveness)
  let afterEffectiveness = Math.floor(afterDefense * typeEffectiveness)

  // Minimum 1 damage (unless immune)
  let minimumApplied = false
  if (typeEffectiveness === 0) {
    afterEffectiveness = 0
  } else if (afterEffectiveness < 1) {
    afterEffectiveness = 1
    minimumApplied = true
  }

  return {
    finalDamage: afterEffectiveness,
    breakdown: {
      rawDB,
      stabApplied,
      effectiveDB,
      setDamage,
      criticalApplied,
      critDamageBonus,
      baseDamage,
      rawAttackStat: input.attackStat,
      attackStageMultiplier,
      effectiveAttack,
      subtotalBeforeDefense,
      rawDefenseStat: input.defenseStat,
      defenseStageMultiplier,
      effectiveDefense,
      damageReduction: dr,
      afterDefense,
      typeEffectiveness,
      typeEffectivenessLabel,
      afterEffectiveness,
      minimumApplied,
    },
  }
}
