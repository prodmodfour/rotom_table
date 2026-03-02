/**
 * Shared PTU trainer stat allocation constants.
 *
 * Used by both the useCharacterCreation composable and
 * the StatAllocationSection component to avoid duplication.
 *
 * Reference: PTU Core Chapter 2, p. 15
 */

/** Base HP stat for a new trainer */
export const BASE_HP = 10

/** Base value for non-HP stats (Atk, Def, SpA, SpD, Spe) */
export const BASE_OTHER = 5

/** Total stat points to distribute at level 1 */
export const TOTAL_STAT_POINTS = 10

/** Maximum points that can be assigned to a single stat at level 1 */
export const MAX_POINTS_PER_STAT = 5

/**
 * Stat definitions used across level-up and creation UI.
 * Shared by LevelUpStatSection, LevelUpSummary, and StatAllocationSection.
 */
export const STAT_DEFINITIONS = [
  { key: 'hp' as const, label: 'HP' },
  { key: 'attack' as const, label: 'Attack' },
  { key: 'defense' as const, label: 'Defense' },
  { key: 'specialAttack' as const, label: 'Sp. Attack' },
  { key: 'specialDefense' as const, label: 'Sp. Defense' },
  { key: 'speed' as const, label: 'Speed' }
] as const

/**
 * Skill rank progression order.
 * Used by Skill Edge rank-up logic in level-up composable and summary.
 */
export const RANK_PROGRESSION: readonly string[] = [
  'Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master'
] as const

/**
 * Calculate total stat points available at a given trainer level.
 *
 * PTU Core p. 19-21:
 * - Level 1: 10 base stat points
 * - Every level grants +1 stat point
 * - Total = 10 + (level - 1) = 9 + level
 *
 * Note: This does NOT include optional bonus stat points from
 * milestone choices (Amateur/Capable/Veteran/Elite/Champion),
 * as those are GM discretion choices.
 */
export function getStatPointsForLevel(level: number): number {
  return TOTAL_STAT_POINTS + Math.max(0, level - 1)
}

/**
 * Skill rank cap by trainer level.
 *
 * PTU Core p. 19:
 * - Level 1: Novice max (cannot raise above Novice during creation)
 * - Level 2: Adept unlocked
 * - Level 6: Expert unlocked
 * - Level 12: Master unlocked
 */
export type SkillRankName = 'Pathetic' | 'Untrained' | 'Novice' | 'Adept' | 'Expert' | 'Master'

const SKILL_RANK_ORDER: readonly SkillRankName[] = ['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master'] as const

export function getMaxSkillRankForLevel(level: number): SkillRankName {
  if (level >= 12) return 'Master'
  if (level >= 6) return 'Expert'
  if (level >= 2) return 'Adept'
  return 'Novice'
}

export function isSkillRankAboveCap(rank: string, level: number): boolean {
  const maxRank = getMaxSkillRankForLevel(level)
  const rankIndex = SKILL_RANK_ORDER.indexOf(rank as SkillRankName)
  const maxIndex = SKILL_RANK_ORDER.indexOf(maxRank)
  if (rankIndex === -1 || maxIndex === -1) return false
  return rankIndex > maxIndex
}

/**
 * Calculate expected total edges at a given trainer level.
 *
 * PTU Core p. 19-21:
 * - Level 1: 4 starting edges
 * - Every even level: +1 edge
 * - Bonus Skill Edges at levels 2, 6, 12 (+1 each)
 */
export function getExpectedEdgesForLevel(level: number): { base: number; bonusSkillEdges: number; total: number } {
  // Base edges: 4 starting + 1 per even level (2, 4, 6, ...)
  const base = 4 + Math.floor(Math.max(1, level) / 2)

  // Bonus Skill Edges from milestone levels
  let bonusSkillEdges = 0
  if (level >= 2) bonusSkillEdges++
  if (level >= 6) bonusSkillEdges++
  if (level >= 12) bonusSkillEdges++

  return { base, bonusSkillEdges, total: base + bonusSkillEdges }
}

/**
 * Calculate expected total features at a given trainer level.
 *
 * PTU Core p. 19-21:
 * - Level 1: 4 features + 1 Training Feature = 5
 * - Every odd level from 3 onwards: +1 feature
 *
 * Verified against progression table:
 * L1=5, L2=5, L3=6, L5=7, L10=9, L20=14, L50=29
 */
export function getExpectedFeaturesForLevel(level: number): number {
  return 5 + Math.floor(Math.max(0, level - 1) / 2)
}
