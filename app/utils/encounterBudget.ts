/**
 * PTU 1.05 Encounter Budget Calculator
 *
 * Level Budget formula (Core p.473):
 * - Multiply the average Pokemon Level of PCs by 2 = baseline XP per player
 * - Multiply baseline by number of trainers = total level budget
 *
 * XP Calculation (Core p.460):
 * 1. Total the Level of enemy combatants defeated (Trainer levels count as double)
 * 2. Multiply by Significance Multiplier (x1 to x5)
 * 3. Divide by number of players gaining XP
 *
 * Follows the captureRate.ts / damageCalculation.ts pattern:
 * typed input, typed result with breakdown, pure functions, zero side effects.
 */

// ============================================
// TYPES
// ============================================

export interface BudgetCalcInput {
  /** Average Pokemon level of the player party */
  averagePokemonLevel: number
  /** Number of player trainers in the encounter */
  playerCount: number
}

export interface BudgetCalcResult {
  /** Total level budget available to spend on enemies */
  totalBudget: number
  /** Baseline XP drop per player (before significance) */
  baselineXpPerPlayer: number
  breakdown: {
    averagePokemonLevel: number
    playerCount: number
    /** averagePokemonLevel * 2 = baseline per player */
    baselinePerPlayer: number
    /** baselinePerPlayer * playerCount = total budget */
    totalBudget: number
  }
}

export type SignificanceTier = 'insignificant' | 'everyday' | 'significant' | 'climactic' | 'legendary'

export interface SignificancePreset {
  tier: SignificanceTier
  label: string
  multiplierRange: { min: number; max: number }
  defaultMultiplier: number
  description: string
}

export interface BudgetAnalysis {
  /** Total levels of enemy combatants in the encounter */
  totalEnemyLevels: number
  /** The calculated budget for the player party */
  budget: BudgetCalcResult
  /** Ratio of enemy levels to budget (1.0 = perfectly balanced) */
  budgetRatio: number
  /** Human-readable difficulty assessment */
  difficulty: 'trivial' | 'easy' | 'balanced' | 'hard' | 'deadly'
  /** Whether any trainer combatants exist (their levels count double) */
  hasTrainerEnemies: boolean
  /** Effective enemy levels (trainers count double per PTU) */
  effectiveEnemyLevels: number
}

// ============================================
// CONSTANTS
// ============================================

export const SIGNIFICANCE_PRESETS: SignificancePreset[] = [
  {
    tier: 'insignificant',
    label: 'Insignificant',
    multiplierRange: { min: 1.0, max: 1.5 },
    defaultMultiplier: 1.0,
    description: 'Random wild encounters, trivial roadside battles'
  },
  {
    tier: 'everyday',
    label: 'Everyday',
    multiplierRange: { min: 2.0, max: 3.0 },
    defaultMultiplier: 2.0,
    description: 'Standard trainer battles, strong wild Pokemon'
  },
  {
    tier: 'significant',
    label: 'Significant',
    multiplierRange: { min: 3.0, max: 4.0 },
    defaultMultiplier: 3.5,
    description: 'Gym leaders, rival encounters, mini-bosses'
  },
  {
    tier: 'climactic',
    label: 'Climactic',
    multiplierRange: { min: 4.0, max: 5.0 },
    defaultMultiplier: 4.5,
    description: 'Tournament finals, legendary encounters, arc finales'
  },
  {
    tier: 'legendary',
    label: 'Legendary',
    multiplierRange: { min: 5.0, max: 5.0 },
    defaultMultiplier: 5.0,
    description: 'Campaign-defining battles, one-of-a-kind showdowns'
  }
]

/**
 * Budget ratio thresholds for difficulty assessment.
 * Ratio = effectiveEnemyLevels / totalBudget
 */
export const DIFFICULTY_THRESHOLDS = {
  trivial: 0.4,    // < 40% of budget
  easy: 0.7,       // 40%-70% of budget
  balanced: 1.3,   // 70%-130% of budget
  hard: 1.8,       // 130%-180% of budget
  // > 180% = deadly
} as const

// ============================================
// PURE FUNCTIONS
// ============================================

/**
 * Calculate the level budget for an encounter.
 * PTU Core p.473: average Pokemon level * 2 * player count
 */
export function calculateEncounterBudget(input: BudgetCalcInput): BudgetCalcResult {
  const avgLevel = Math.max(0, input.averagePokemonLevel)
  const players = Math.max(0, input.playerCount)
  const baselinePerPlayer = avgLevel * 2
  const totalBudget = baselinePerPlayer * players

  return {
    totalBudget,
    baselineXpPerPlayer: baselinePerPlayer,
    breakdown: {
      averagePokemonLevel: avgLevel,
      playerCount: players,
      baselinePerPlayer,
      totalBudget
    }
  }
}

/**
 * Calculate effective enemy levels for budget analysis.
 * Trainer levels count as doubled per PTU XP rules (p.460).
 */
export function calculateEffectiveEnemyLevels(
  enemies: Array<{ level: number; isTrainer: boolean }>
): { totalLevels: number; effectiveLevels: number } {
  let totalLevels = 0
  let effectiveLevels = 0
  for (const enemy of enemies) {
    totalLevels += enemy.level
    effectiveLevels += enemy.isTrainer ? enemy.level * 2 : enemy.level
  }
  return { totalLevels, effectiveLevels }
}

/**
 * Assess encounter difficulty by comparing enemy levels to budget.
 */
export function assessDifficulty(budgetRatio: number): BudgetAnalysis['difficulty'] {
  if (budgetRatio < DIFFICULTY_THRESHOLDS.trivial) return 'trivial'
  if (budgetRatio < DIFFICULTY_THRESHOLDS.easy) return 'easy'
  if (budgetRatio < DIFFICULTY_THRESHOLDS.balanced) return 'balanced'
  if (budgetRatio < DIFFICULTY_THRESHOLDS.hard) return 'hard'
  return 'deadly'
}

/**
 * Full budget analysis for an encounter-in-progress.
 */
export function analyzeEncounterBudget(
  input: BudgetCalcInput,
  enemies: Array<{ level: number; isTrainer: boolean }>
): BudgetAnalysis {
  const budget = calculateEncounterBudget(input)
  const { totalLevels, effectiveLevels } = calculateEffectiveEnemyLevels(enemies)
  const budgetRatio = budget.totalBudget > 0 ? effectiveLevels / budget.totalBudget : 0

  return {
    totalEnemyLevels: totalLevels,
    budget,
    budgetRatio,
    difficulty: assessDifficulty(budgetRatio),
    hasTrainerEnemies: enemies.some(e => e.isTrainer),
    effectiveEnemyLevels: effectiveLevels
  }
}

/**
 * Calculate XP for a completed encounter.
 * PTU Core p.460: total enemy levels * significance / player count
 */
export function calculateEncounterXp(
  enemies: Array<{ level: number; isTrainer: boolean }>,
  significanceMultiplier: number,
  playerCount: number
): { totalXp: number; xpPerPlayer: number; baseXp: number } {
  const { effectiveLevels } = calculateEffectiveEnemyLevels(enemies)
  const baseXp = effectiveLevels
  const totalXp = Math.floor(baseXp * significanceMultiplier)
  const xpPerPlayer = Math.floor(totalXp / Math.max(1, playerCount))
  return { totalXp, xpPerPlayer, baseXp }
}
