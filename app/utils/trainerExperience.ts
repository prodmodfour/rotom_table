/**
 * PTU 1.05 Trainer Experience Logic
 *
 * Trainer XP rules (PTU Core p.461):
 * - Trainers have an "Experience Bank" that accumulates XP
 * - When the bank reaches 10+, subtract 10 and gain 1 level
 * - Multi-level jumps are possible (bank 8 + 15 = 23 -> 2 levels, bank 3)
 * - Milestones grant levels separately (do not affect the bank)
 * - Bank cannot go below 0
 * - Level cannot exceed TRAINER_MAX_LEVEL (50)
 */

/** Maximum trainer level (practical PTU limit) */
export const TRAINER_MAX_LEVEL = 50

/** XP required per trainer level */
export const TRAINER_XP_PER_LEVEL = 10

/** Trainer milestone levels requiring player/GM choices (PTU Core p.19-21) */
export const TRAINER_MILESTONE_LEVELS = [5, 10, 20, 30, 40] as const

/**
 * Input for applying XP to a trainer's experience bank.
 */
export interface TrainerXpInput {
  currentXp: number
  currentLevel: number
  xpToAdd: number
}

/**
 * Result of applying XP. Includes level changes and final bank state.
 */
export interface TrainerXpResult {
  previousXp: number
  previousLevel: number
  xpAdded: number
  newXp: number
  newLevel: number
  levelsGained: number
  /** Milestone levels crossed during this XP application (5, 10, 20, 30, 40) */
  milestoneLevelsCrossed: number[]
}

/**
 * Apply XP to a trainer's experience bank.
 * Handles multi-level jumps and negative XP (deduction).
 * Bank cannot go below 0. Level cannot exceed TRAINER_MAX_LEVEL.
 */
export function applyTrainerXp(input: TrainerXpInput): TrainerXpResult {
  const { currentXp, currentLevel, xpToAdd } = input

  // Clamp bank to non-negative after addition
  const rawTotal = Math.max(0, currentXp + xpToAdd)

  // If already at max level, bank accumulates but no more level-ups
  if (currentLevel >= TRAINER_MAX_LEVEL) {
    return {
      previousXp: currentXp,
      previousLevel: currentLevel,
      xpAdded: xpToAdd,
      newXp: rawTotal,
      newLevel: currentLevel,
      levelsGained: 0,
      milestoneLevelsCrossed: []
    }
  }

  // Calculate levels gained from bank
  const levelsFromXp = Math.floor(rawTotal / TRAINER_XP_PER_LEVEL)
  const remainingXp = rawTotal - (levelsFromXp * TRAINER_XP_PER_LEVEL)

  // Cap at max level
  const maxLevelsGainable = TRAINER_MAX_LEVEL - currentLevel
  const actualLevelsGained = Math.min(levelsFromXp, maxLevelsGainable)
  const newLevel = currentLevel + actualLevelsGained

  // If capped at max level, put excess XP back in bank
  const newXp = actualLevelsGained < levelsFromXp
    ? rawTotal - (actualLevelsGained * TRAINER_XP_PER_LEVEL)
    : remainingXp

  // Identify milestone levels crossed (exclusive of currentLevel, inclusive of newLevel)
  const milestoneLevelsCrossed = TRAINER_MILESTONE_LEVELS.filter(
    ml => ml > currentLevel && ml <= newLevel
  )

  return {
    previousXp: currentXp,
    previousLevel: currentLevel,
    xpAdded: xpToAdd,
    newXp,
    newLevel,
    levelsGained: actualLevelsGained,
    milestoneLevelsCrossed
  }
}

/**
 * Check if a species is new for a trainer (not in their ownedSpecies list).
 * Case-insensitive comparison with whitespace trimming.
 */
export function isNewSpecies(species: string, ownedSpecies: string[]): boolean {
  const normalized = species.toLowerCase().trim()
  return !ownedSpecies.some(s => s.toLowerCase().trim() === normalized)
}

/**
 * Suggested trainer XP awards for UI display.
 * Maps significance tiers to typical trainer XP amounts.
 * Capped at x5 per decree-030.
 */
export const TRAINER_XP_SUGGESTIONS = {
  none: { label: 'None', xp: 0, description: 'Weak/average wild Pokemon' },
  low: { label: 'Low', xp: 1, description: 'Average trainer encounter' },
  moderate: { label: 'Moderate', xp: 2, description: 'Challenging trainer battle' },
  significant: { label: 'Significant', xp: 3, description: 'Important battle or rival encounter' },
  major: { label: 'Major', xp: 4, description: 'Significant non-milestone event' },
  critical: { label: 'Critical', xp: 5, description: 'Near-milestone battle or major story event' }
} as const

/**
 * Maps encounter significance tiers to suggested trainer XP.
 * PTU Core p.461: GM decides trainer XP, these are guidelines.
 * Uses the same SignificanceTier type as encounterBudget.ts.
 */
export const SIGNIFICANCE_TO_TRAINER_XP: Record<string, number> = {
  insignificant: 0,
  everyday: 1,
  significant: 3
}
