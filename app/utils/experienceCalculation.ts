/**
 * PTU 1.05 Experience Calculation
 *
 * Post-combat XP calculation and distribution logic (PTU Core p.460):
 * 1. Total defeated enemy levels (Trainers count as 2x level)
 * 2. Apply GM significance multiplier (1-10)
 * 3. Divide by number of players (unless Boss encounter)
 * 4. XP always rounded down (floor)
 *
 * Follows the captureRate.ts pattern: typed input, typed result with breakdown,
 * pure functions, zero side effects.
 */

import { checkLevelUp } from '~/utils/levelUpCheck'
import type { LearnsetEntry } from '~/utils/levelUpCheck'
import { SIGNIFICANCE_PRESETS as BUDGET_PRESETS } from '~/utils/encounterBudget'
import type { SignificanceTier } from '~/utils/encounterBudget'

// ============================================
// CONSTANTS
// ============================================

/**
 * PTU Experience Chart (Core p.203)
 * Maps level -> cumulative XP needed to reach that level.
 * Level 1 requires 0 XP, Level 100 requires 20,555 XP.
 */
export const EXPERIENCE_CHART: Record<number, number> = {
  1: 0, 2: 10, 3: 20, 4: 30, 5: 40,
  6: 50, 7: 60, 8: 70, 9: 80, 10: 90,
  11: 110, 12: 135, 13: 160, 14: 190, 15: 220,
  16: 250, 17: 285, 18: 320, 19: 360, 20: 400,
  21: 460, 22: 530, 23: 600, 24: 670, 25: 745,
  26: 820, 27: 900, 28: 990, 29: 1075, 30: 1165,
  31: 1260, 32: 1355, 33: 1455, 34: 1555, 35: 1660,
  36: 1770, 37: 1880, 38: 1995, 39: 2110, 40: 2230,
  41: 2355, 42: 2480, 43: 2610, 44: 2740, 45: 2875,
  46: 3015, 47: 3155, 48: 3300, 49: 3445, 50: 3645,
  51: 3850, 52: 4060, 53: 4270, 54: 4485, 55: 4705,
  56: 4930, 57: 5160, 58: 5390, 59: 5625, 60: 5865,
  61: 6110, 62: 6360, 63: 6610, 64: 6865, 65: 7125,
  66: 7390, 67: 7660, 68: 7925, 69: 8205, 70: 8485,
  71: 8770, 72: 9060, 73: 9350, 74: 9645, 75: 9945,
  76: 10250, 77: 10560, 78: 10870, 79: 11185, 80: 11505,
  81: 11910, 82: 12320, 83: 12735, 84: 13155, 85: 13580,
  86: 14010, 87: 14445, 88: 14885, 89: 15330, 90: 15780,
  91: 16235, 92: 16695, 93: 17160, 94: 17630, 95: 18105,
  96: 18585, 97: 19070, 98: 19560, 99: 20055, 100: 20555
}

/** Maximum level a Pokemon can reach */
export const MAX_LEVEL = 100

/** Maximum experience (XP needed for level 100) */
export const MAX_EXPERIENCE = EXPERIENCE_CHART[MAX_LEVEL]

/**
 * Significance multiplier presets derived from encounterBudget.ts (canonical source).
 * PTU Core p.460: GM-assigned based on narrative significance.
 *
 * Object format for template v-for="(value, key)" iteration:
 * { insignificant: 1.0, everyday: 2.0, significant: 3.5, climactic: 4.5, legendary: 5.0 }
 */
export const SIGNIFICANCE_PRESETS = Object.fromEntries(
  BUDGET_PRESETS.map(p => [p.tier, p.defaultMultiplier])
) as Record<SignificanceTier, number>

export type SignificancePreset = SignificanceTier

/**
 * Canonical friendly labels for significance presets.
 * Used in both SignificancePanel and XpDistributionModal for consistent display.
 */
export const SIGNIFICANCE_PRESET_LABELS: Record<SignificancePreset, string> = Object.fromEntries(
  BUDGET_PRESETS.map(p => [p.tier, p.label])
) as Record<SignificancePreset, string>

/**
 * Resolve a significance preset key from a multiplier value.
 * Returns 'custom' if no preset matches.
 */
export function resolvePresetFromMultiplier(multiplier: number): SignificancePreset | 'custom' {
  for (const [key, value] of Object.entries(SIGNIFICANCE_PRESETS)) {
    if (value === multiplier) return key as SignificancePreset
  }
  return 'custom'
}

// ============================================
// TYPES
// ============================================

/** A defeated enemy combatant for XP calculation */
export interface DefeatedEnemy {
  species: string
  level: number
  /** Trainers count as 2x level for XP (PTU Core p.460) */
  isTrainer: boolean
}

/** Input for the encounter XP calculation */
export interface XpCalculationInput {
  defeatedEnemies: DefeatedEnemy[]
  /** GM-set significance multiplier, typically 1-5 (PTU Core p.460) */
  significanceMultiplier: number
  /** Number of players (NOT Pokemon) */
  playerCount: number
  /** Boss XP is not divided by players (PTU Core p.489) */
  isBossEncounter: boolean
}

/** Full breakdown of XP calculation */
export interface XpCalculationResult {
  totalXpPerPlayer: number
  breakdown: {
    /** Sum of enemy levels (trainers counted 2x) */
    enemyLevelsTotal: number
    /** Same as enemyLevelsTotal (before multiplier) */
    baseExperienceValue: number
    significanceMultiplier: number
    /** base * multiplier */
    multipliedXp: number
    playerCount: number
    isBossEncounter: boolean
    /** Final per-player amount (floored) */
    perPlayerXp: number
    /** Per-enemy contribution breakdown */
    enemies: {
      species: string
      level: number
      isTrainer: boolean
      /** Effective level contribution (2x for trainers) */
      xpContribution: number
    }[]
  }
}

/** Result of applying XP to a single Pokemon */
export interface XpApplicationResult {
  pokemonId: string
  species: string
  previousExperience: number
  xpGained: number
  newExperience: number
  previousLevel: number
  newLevel: number
  levelsGained: number
  levelUps: LevelUpEvent[]
}

/** Details about a single level-up event */
export interface LevelUpEvent {
  newLevel: number
  /** Always 1 per level */
  statPointsGained: number
  /** True if level is divisible by 5 */
  tutorPointGained: boolean
  /** Moves learned at this level from learnset */
  newMovesAvailable: string[]
  /** Whether evolution is available at this level */
  canEvolve: boolean
  /** Level 20 = 'second', Level 40 = 'third', otherwise null */
  newAbilitySlot: 'second' | 'third' | null
}

/** A raw defeated enemy entry as stored in the encounter's JSON column */
export interface RawDefeatedEnemy {
  species: string
  level: number
  /** Present on entries created after the type field was added; absent on legacy entries */
  type?: 'pokemon' | 'human'
}

// ============================================
// FUNCTIONS
// ============================================

/**
 * Enrich raw defeated enemy entries from the encounter record into the
 * DefeatedEnemy shape required by calculateEncounterXp().
 *
 * Determines isTrainer via:
 * 1. The `type` field on the entry (new entries from damage.post.ts)
 * 2. Fallback: index-based trainerEnemyIds from the request body
 * 3. Default: false for legacy entries with no type info
 *
 * @param raw - Defeated enemy entries parsed from the encounter JSON column
 * @param trainerEnemyIds - Optional index-based string IDs for legacy trainer identification
 * @returns Enriched DefeatedEnemy array ready for XP calculation
 */
export function enrichDefeatedEnemies(
  raw: RawDefeatedEnemy[],
  trainerEnemyIds: string[] = []
): DefeatedEnemy[] {
  return raw.map((entry, index) => ({
    species: entry.species,
    level: entry.level,
    isTrainer: entry.type === 'human' || trainerEnemyIds.includes(String(index))
  }))
}

/**
 * Get the cumulative XP needed to reach a specific level.
 * PTU Core p.203.
 *
 * @param level - Level to look up (1-100)
 * @returns XP needed for that level, or 0 for invalid levels
 */
export function getXpForLevel(level: number): number {
  if (level < 1) return 0
  if (level > MAX_LEVEL) return MAX_EXPERIENCE
  return EXPERIENCE_CHART[level] ?? 0
}

/**
 * Get the level a Pokemon should be at given a total experience value.
 * Walks the chart from highest to lowest to find the matching level.
 *
 * @param totalXp - Total accumulated experience
 * @returns The level corresponding to that XP total (1-100)
 */
export function getLevelForXp(totalXp: number): number {
  if (totalXp < 0) return 1
  if (totalXp >= MAX_EXPERIENCE) return MAX_LEVEL

  // Walk from level 100 down to find the highest level the XP qualifies for
  for (let level = MAX_LEVEL; level >= 1; level--) {
    if (totalXp >= EXPERIENCE_CHART[level]) {
      return level
    }
  }

  return 1
}

/**
 * Get XP remaining until the next level.
 *
 * @param currentExperience - Pokemon's current total XP
 * @param currentLevel - Pokemon's current level
 * @returns XP needed to reach the next level, or 0 if at max level
 */
export function getXpToNextLevel(currentExperience: number, currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return 0

  const nextLevelXp = getXpForLevel(currentLevel + 1)
  const remaining = nextLevelXp - currentExperience
  return Math.max(0, remaining)
}

/**
 * Calculate post-encounter XP per player.
 * PTU Core p.460: total defeated levels, apply significance, divide by players.
 *
 * @param input - Defeated enemies, multiplier, player count, boss flag
 * @returns Full breakdown of the XP calculation
 */
export function calculateEncounterXp(input: XpCalculationInput): XpCalculationResult {
  const {
    defeatedEnemies,
    significanceMultiplier,
    playerCount,
    isBossEncounter
  } = input

  // Step 1: Total enemy levels (trainers counted as 2x)
  const enemies = defeatedEnemies.map(enemy => ({
    species: enemy.species,
    level: enemy.level,
    isTrainer: enemy.isTrainer,
    xpContribution: enemy.isTrainer ? enemy.level * 2 : enemy.level
  }))

  const enemyLevelsTotal = enemies.reduce(
    (sum, enemy) => sum + enemy.xpContribution, 0
  )

  // Step 2: Apply significance multiplier
  const multipliedXp = Math.floor(enemyLevelsTotal * significanceMultiplier)

  // Step 3: Divide by players (unless boss encounter)
  const perPlayerXp = isBossEncounter
    ? multipliedXp
    : Math.floor(multipliedXp / Math.max(1, playerCount))

  return {
    totalXpPerPlayer: perPlayerXp,
    breakdown: {
      enemyLevelsTotal,
      baseExperienceValue: enemyLevelsTotal,
      significanceMultiplier,
      multipliedXp,
      playerCount,
      isBossEncounter,
      perPlayerXp,
      enemies
    }
  }
}

/**
 * Given a Pokemon's current experience and XP to add, determine the new level
 * and any level-up events.
 * PTU Core p.202-203.
 *
 * Delegates to the existing checkLevelUp utility for per-level event details.
 *
 * @param currentExperience - Pokemon's current total XP
 * @param currentLevel - Pokemon's current level
 * @param xpToAdd - XP to grant
 * @param learnset - Optional learnset for move learning detection
 * @param evolutionLevels - Optional list of levels at which evolution is possible
 * @returns Application result with level-up events
 */
export function calculateLevelUps(
  currentExperience: number,
  currentLevel: number,
  xpToAdd: number,
  learnset?: LearnsetEntry[],
  evolutionLevels?: number[]
): Omit<XpApplicationResult, 'pokemonId' | 'species'> {
  // Cap experience at max
  const newExperience = Math.min(currentExperience + xpToAdd, MAX_EXPERIENCE)
  const newLevel = getLevelForXp(newExperience)
  const levelsGained = newLevel - currentLevel

  // Use existing checkLevelUp utility for per-level details
  const levelUpInfos = checkLevelUp({
    oldLevel: currentLevel,
    newLevel,
    learnset: learnset ?? []
  })

  // Convert to the LevelUpEvent format expected by the design
  const levelUps: LevelUpEvent[] = levelUpInfos.map(info => ({
    newLevel: info.newLevel,
    statPointsGained: info.statPointsGained,
    tutorPointGained: info.tutorPointGained,
    newMovesAvailable: info.newMoves,
    canEvolve: evolutionLevels ? evolutionLevels.includes(info.newLevel) : false,
    newAbilitySlot: info.abilityMilestone
  }))

  return {
    previousExperience: currentExperience,
    xpGained: xpToAdd,
    newExperience,
    previousLevel: currentLevel,
    newLevel,
    levelsGained,
    levelUps
  }
}
