/**
 * Encounter Budget & XP Calculator
 *
 * Budget guideline (PTU Encounter Creation Guide, Chapter 11):
 * PTU suggests working backwards from a desired XP drop to determine
 * the total enemy levels for an encounter. The guideline for an everyday
 * encounter: multiply the average Pokemon Level of PCs by 2 for a baseline
 * XP drop per player, then multiply by the number of trainers to get the
 * total levels to distribute among enemies.
 *
 * This is a GM guideline, not a hard formula. PTU notes it should be
 * decreased for very low-level parties and increased for significant
 * encounters. The difficulty thresholds below are app-specific heuristics.
 *
 * XP Calculation (PTU Core p.460):
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
  /** Total level budget (guideline) for distributing among enemies */
  totalBudget: number
  /** Per-player baseline: averagePokemonLevel * 2 (PTU Encounter Creation Guide) */
  levelBudgetPerPlayer: number
  breakdown: {
    averagePokemonLevel: number
    playerCount: number
    /** averagePokemonLevel * 2 = baseline per player (PTU guideline for everyday encounters) */
    baselinePerPlayer: number
    /** baselinePerPlayer * playerCount = total levels to distribute */
    totalBudget: number
  }
}

export type SignificanceTier = 'insignificant' | 'everyday' | 'significant'

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

/**
 * Significance presets capped at x5 per PTU Core p.460 and decree-030.
 * GMs who want values above x5 can use the custom input in the UI.
 */
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
    multiplierRange: { min: 4.0, max: 5.0 },
    defaultMultiplier: 5.0,
    description: 'Gym leaders, rival encounters, legendary battles, arc finales (PTU: x4-x5)'
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
 * Calculate the suggested level budget for an encounter.
 * Based on PTU Encounter Creation Guide (Chapter 11) guideline:
 * average Pokemon level * 2 = baseline per player, * player count = total levels.
 * This is a guideline for everyday encounters — adjust for significance and party strength.
 */
export function calculateEncounterBudget(input: BudgetCalcInput): BudgetCalcResult {
  const avgLevel = Math.max(0, input.averagePokemonLevel)
  const players = Math.max(0, input.playerCount)
  const baselinePerPlayer = avgLevel * 2
  const totalBudget = baselinePerPlayer * players

  return {
    totalBudget,
    levelBudgetPerPlayer: baselinePerPlayer,
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
