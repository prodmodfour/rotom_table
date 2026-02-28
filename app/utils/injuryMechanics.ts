/**
 * PTU 1.05 Injury Mechanics — Heavily Injured & Death Checks
 *
 * Pure utility functions for:
 * - Heavily Injured (5+ injuries): HP loss on Standard Action or taking damage
 * - Death check: 10+ injuries OR HP below death threshold
 * - League Battle exemption: death from HP is suppressed
 *
 * References: PTU 07-combat.md:1898-1932
 * Decrees: decree-001 (minimum damage), decree-004 (temp HP & massive damage)
 */

// ============================================
// CONSTANTS
// ============================================

/** Injury count at which a combatant becomes "Heavily Injured" (PTU p.250) */
export const HEAVILY_INJURED_THRESHOLD = 5

/** Injury count that causes immediate death (PTU p.251) */
export const LETHAL_INJURY_COUNT = 10

/** Absolute HP floor for death check (PTU p.251: "-50 Hit Points") */
export const DEATH_HP_ABSOLUTE = -50

/** Percentage-based HP floor for death check (PTU p.251: "-200% Hit Points") */
export const DEATH_HP_PERCENTAGE = -2.0

// ============================================
// TYPES
// ============================================

export interface HeavilyInjuredResult {
  /** Whether the combatant is heavily injured (5+ injuries) */
  isHeavilyInjured: boolean
  /** HP loss from heavily injured penalty (equals injury count, 0 if not heavily injured) */
  hpLoss: number
}

export type DeathCause = 'injuries' | 'hp_threshold' | null

export interface DeathCheckResult {
  /** Whether the combatant meets death conditions */
  isDead: boolean
  /** What caused death (null if alive) */
  cause: DeathCause
  /** Whether League Battle rules suppress this death (HP-based deaths only) */
  leagueSuppressed: boolean
  /** The HP threshold at which death occurs for this combatant */
  deathHpThreshold: number
}

// ============================================
// PURE FUNCTIONS
// ============================================

/**
 * Check if a combatant is heavily injured and calculate the HP penalty.
 *
 * PTU p.250: "Whenever a Trainer or Pokemon has 5 or more injuries,
 * they are considered Heavily Injured. Whenever a Heavily Injured Trainer
 * or Pokemon takes a Standard Action during combat, or takes Damage from
 * an attack, they lose Hit Points equal to the number of Injuries they
 * currently have."
 *
 * @param injuries - Current injury count
 * @returns Whether heavily injured and the HP loss amount
 */
export function checkHeavilyInjured(injuries: number): HeavilyInjuredResult {
  const isHeavilyInjured = injuries >= HEAVILY_INJURED_THRESHOLD
  return {
    isHeavilyInjured,
    hpLoss: isHeavilyInjured ? injuries : 0
  }
}

/**
 * Calculate the HP threshold at which death occurs.
 *
 * PTU p.251: "goes down to either -50 Hit Points or -200% Hit Points,
 * whichever is lower (in that -80 Hit Points is lower than -50 Hit Points)"
 *
 * The death threshold is the MORE NEGATIVE of:
 * - -50 HP (absolute floor)
 * - -200% of maxHp (percentage floor)
 *
 * @param maxHp - The combatant's maximum HP (real, not injury-reduced)
 * @returns The HP value at or below which death occurs (always negative)
 */
export function calculateDeathHpThreshold(maxHp: number): number {
  const absoluteThreshold = DEATH_HP_ABSOLUTE
  const percentageThreshold = Math.floor(maxHp * DEATH_HP_PERCENTAGE)
  // "whichever is lower" = more negative = Math.min
  return Math.min(absoluteThreshold, percentageThreshold)
}

/**
 * Perform a death check on a combatant.
 *
 * Death occurs when:
 * 1. Injury count >= 10 (always applies, even in League Battles)
 * 2. HP drops to the death threshold: min(-50, -200% maxHp)
 *
 * League Battle exemption (PTU p.251 + decree-021):
 * - HP-based death is suppressed in League/friendly battles
 * - Pokemon faint at 0 HP instead of dying
 * - Injury-based death (10+ injuries) still applies
 *
 * @param currentHp - Current HP (can be 0 for stored, or negative for unclamped check)
 * @param maxHp - Real max HP (not injury-reduced)
 * @param injuries - Current injury count
 * @param isLeagueBattle - Whether this is a League/friendly battle
 * @param unclampedHp - Unclamped HP for death threshold check (optional, uses currentHp if not provided)
 * @returns Death check result
 */
export function checkDeath(
  currentHp: number,
  maxHp: number,
  injuries: number,
  isLeagueBattle: boolean,
  unclampedHp?: number
): DeathCheckResult {
  const hpForCheck = unclampedHp ?? currentHp
  const deathHpThreshold = calculateDeathHpThreshold(maxHp)

  // Check 1: Injury-based death (always applies)
  if (injuries >= LETHAL_INJURY_COUNT) {
    return {
      isDead: true,
      cause: 'injuries',
      leagueSuppressed: false,
      deathHpThreshold
    }
  }

  // Check 2: HP-based death
  if (hpForCheck <= deathHpThreshold) {
    // In League Battles, HP-based death is suppressed
    if (isLeagueBattle) {
      return {
        isDead: false,
        cause: null,
        leagueSuppressed: true,
        deathHpThreshold
      }
    }
    return {
      isDead: true,
      cause: 'hp_threshold',
      leagueSuppressed: false,
      deathHpThreshold
    }
  }

  return {
    isDead: false,
    cause: null,
    leagueSuppressed: false,
    deathHpThreshold
  }
}

/**
 * Apply heavily injured HP loss to a combatant's current HP.
 * Returns the new HP value (clamped to 0 for storage) and the unclamped value.
 *
 * @param currentHp - Current HP (clamped, >= 0)
 * @param injuries - Current injury count
 * @returns New HP values after heavily injured penalty
 */
export function applyHeavilyInjuredPenalty(
  currentHp: number,
  injuries: number
): { newHp: number; unclampedHp: number; hpLost: number } {
  const { isHeavilyInjured, hpLoss } = checkHeavilyInjured(injuries)

  if (!isHeavilyInjured || currentHp <= 0) {
    return { newHp: currentHp, unclampedHp: currentHp, hpLost: 0 }
  }

  const unclampedHp = currentHp - hpLoss
  const newHp = Math.max(0, unclampedHp)

  return { newHp, unclampedHp, hpLost: hpLoss }
}
