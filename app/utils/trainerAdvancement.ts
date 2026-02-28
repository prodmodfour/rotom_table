/**
 * PTU 1.05 Trainer Advancement Logic
 *
 * Pure functions for computing what a trainer gains at each level-up.
 * No side effects, no reactive state, no DB access.
 *
 * Mirrors the pattern of `levelUpCheck.ts` (Pokemon level-up) but for trainers.
 *
 * Reference: PTU Core Chapter 3 — Trainers (pp. 19-21)
 *
 * Advancement schedule per level:
 * - Every level: +1 stat point, +1 skill rank
 * - Even levels: +1 Edge
 * - Odd levels (3+): +1 Feature
 * - Levels 2, 6, 12: Bonus Skill Edge
 * - Level 2: Adept skill rank cap unlocked
 * - Level 6: Expert skill rank cap unlocked
 * - Level 12: Master skill rank cap unlocked
 * - Level 5: Amateur milestone
 * - Level 10: Capable milestone
 * - Level 20: Veteran milestone
 * - Level 30: Elite milestone
 * - Level 40: Champion milestone
 */

import type { SkillRankName } from '~/constants/trainerStats'

/**
 * What a trainer gains at a single level-up.
 * Pure data -- no choices, just the entitlements.
 */
export interface TrainerLevelUpInfo {
  /** The new level reached */
  newLevel: number
  /** Stat points gained this level (always 1 per PTU p.19) */
  statPointsGained: number
  /** Skill ranks gained this level (always 1 -- feature or general, GM decides) */
  skillRanksGained: number
  /** Edges gained this level: 1 on even levels, 0 on odd */
  edgesGained: number
  /** Features gained this level: 1 on odd levels (3+), 0 on even, 0 at levels 1-2 */
  featuresGained: number
  /** Whether a bonus Skill Edge is granted at this level (levels 2, 6, 12) */
  bonusSkillEdge: boolean
  /**
   * Skill rank cap name unlocked at this level, or null.
   * 'Adept' at level 2, 'Expert' at level 6, 'Master' at level 12.
   */
  skillRankCapUnlocked: SkillRankName | null
  /** Trainer milestone at this level (Amateur/Capable/etc.), or null */
  milestone: TrainerMilestone | null
  /**
   * Whether a class choice prompt occurs at this level.
   * Levels 5 and 10 are conventional points where campaigns introduce new classes.
   */
  classChoicePrompt: boolean
}

/**
 * Trainer milestone data (Amateur, Capable, Veteran, Elite, Champion).
 * Each milestone offers a choice between options.
 */
export interface TrainerMilestone {
  level: number
  name: 'Amateur' | 'Capable' | 'Veteran' | 'Elite' | 'Champion'
  /** The options the trainer chooses one from */
  choices: MilestoneOption[]
}

/**
 * A single milestone choice option.
 */
export interface MilestoneOption {
  id: string
  type: 'lifestyle_stat_points' | 'bonus_edges' | 'general_feature'
  label: string
  description: string
  /**
   * For lifestyle_stat_points: the level range where +1 Atk/SpAtk is gained on even levels.
   */
  evenLevelRange?: [number, number]
  /** Retroactive stat points granted immediately (Amateur only: +2 for levels 2 and 4) */
  retroactivePoints?: number
  /** Number of bonus edges granted (Capable/Veteran: 2) */
  edgeCount?: number
}

/**
 * Summary of all advancement deltas across multiple levels.
 */
export interface TrainerAdvancementSummary {
  fromLevel: number
  toLevel: number
  totalStatPoints: number
  totalSkillRanks: number
  totalEdges: number
  totalFeatures: number
  bonusSkillEdges: number
  skillRankCapsUnlocked: Array<{ level: number; cap: SkillRankName }>
  milestones: TrainerMilestone[]
  classChoicePrompts: number[]
}

/**
 * Get the skill rank cap unlocked at a specific level, or null.
 */
function getSkillRankCapUnlockedAt(level: number): SkillRankName | null {
  if (level === 2) return 'Adept'
  if (level === 6) return 'Expert'
  if (level === 12) return 'Master'
  return null
}

/**
 * Get the milestone (if any) at a specific level.
 */
function getMilestoneAt(level: number): TrainerMilestone | null {
  switch (level) {
    case 5:
      return {
        level: 5,
        name: 'Amateur',
        choices: [
          {
            id: 'amateur-stats',
            type: 'lifestyle_stat_points',
            label: 'Lifestyle Stat Points',
            description: '+1 Atk or SpAtk per even level (6-10), +2 retroactive for levels 2 and 4',
            evenLevelRange: [6, 10],
            retroactivePoints: 2
          },
          {
            id: 'amateur-feature',
            type: 'general_feature',
            label: 'General Feature',
            description: 'Gain one General Feature for which you qualify'
          }
        ]
      }
    case 10:
      return {
        level: 10,
        name: 'Capable',
        choices: [
          {
            id: 'capable-stats',
            type: 'lifestyle_stat_points',
            label: 'Lifestyle Stat Points',
            description: '+1 Atk or SpAtk per even level (12-20)',
            evenLevelRange: [12, 20]
          },
          {
            id: 'capable-edges',
            type: 'bonus_edges',
            label: 'Bonus Edges',
            description: 'Gain two Edges for which you qualify',
            edgeCount: 2
          }
        ]
      }
    case 20:
      return {
        level: 20,
        name: 'Veteran',
        choices: [
          {
            id: 'veteran-stats',
            type: 'lifestyle_stat_points',
            label: 'Lifestyle Stat Points',
            description: '+1 Atk or SpAtk per even level (22-30)',
            evenLevelRange: [22, 30]
          },
          {
            id: 'veteran-edges',
            type: 'bonus_edges',
            label: 'Bonus Edges',
            description: 'Gain two Edges for which you qualify',
            edgeCount: 2
          }
        ]
      }
    case 30:
      return {
        level: 30,
        name: 'Elite',
        choices: [
          {
            id: 'elite-stats',
            type: 'lifestyle_stat_points',
            label: 'Lifestyle Stat Points',
            description: '+1 Atk or SpAtk per even level (32-40)',
            evenLevelRange: [32, 40]
          },
          {
            id: 'elite-edges',
            type: 'bonus_edges',
            label: 'Bonus Edges',
            description: 'Gain two Edges for which you qualify',
            edgeCount: 2
          },
          {
            id: 'elite-feature',
            type: 'general_feature',
            label: 'General Feature',
            description: 'Gain one General Feature for which you qualify'
          }
        ]
      }
    case 40:
      return {
        level: 40,
        name: 'Champion',
        choices: [
          {
            id: 'champion-stats',
            type: 'lifestyle_stat_points',
            label: 'Lifestyle Stat Points',
            description: '+1 Atk or SpAtk per even level (42-50)',
            evenLevelRange: [42, 50]
          },
          {
            id: 'champion-edges',
            type: 'bonus_edges',
            label: 'Bonus Edges',
            description: 'Gain two Edges for which you qualify',
            edgeCount: 2
          },
          {
            id: 'champion-feature',
            type: 'general_feature',
            label: 'General Feature',
            description: 'Gain one General Feature for which you qualify'
          }
        ]
      }
    default:
      return null
  }
}

/**
 * Compute what a trainer gains when reaching a specific level.
 * Pure function -- returns entitlements, not choices.
 */
export function computeTrainerLevelUp(level: number): TrainerLevelUpInfo {
  const isEven = level % 2 === 0
  const isOdd = !isEven

  return {
    newLevel: level,
    statPointsGained: 1,
    skillRanksGained: 1,
    edgesGained: isEven ? 1 : 0,
    featuresGained: (isOdd && level >= 3) ? 1 : 0,
    bonusSkillEdge: [2, 6, 12].includes(level),
    skillRankCapUnlocked: getSkillRankCapUnlockedAt(level),
    milestone: getMilestoneAt(level),
    classChoicePrompt: [5, 10].includes(level)
  }
}

/**
 * Compute advancement for a range of levels (inclusive).
 * Handles multi-level jumps (e.g., level 3 -> 7 returns info for levels 4, 5, 6, 7).
 */
export function computeTrainerAdvancement(
  fromLevel: number,
  toLevel: number
): TrainerLevelUpInfo[] {
  if (toLevel <= fromLevel || fromLevel < 1) return []
  const results: TrainerLevelUpInfo[] = []
  for (let level = fromLevel + 1; level <= Math.min(toLevel, 50); level++) {
    results.push(computeTrainerLevelUp(level))
  }
  return results
}

/**
 * Summarize advancement across multiple levels into aggregate totals.
 */
export function summarizeTrainerAdvancement(
  infos: TrainerLevelUpInfo[]
): TrainerAdvancementSummary {
  if (infos.length === 0) {
    return {
      fromLevel: 0,
      toLevel: 0,
      totalStatPoints: 0,
      totalSkillRanks: 0,
      totalEdges: 0,
      totalFeatures: 0,
      bonusSkillEdges: 0,
      skillRankCapsUnlocked: [],
      milestones: [],
      classChoicePrompts: []
    }
  }

  const fromLevel = infos[0].newLevel - 1
  const toLevel = infos[infos.length - 1].newLevel

  return {
    fromLevel,
    toLevel,
    totalStatPoints: infos.reduce((sum, i) => sum + i.statPointsGained, 0),
    totalSkillRanks: infos.reduce((sum, i) => sum + i.skillRanksGained, 0),
    totalEdges: infos.reduce((sum, i) => sum + i.edgesGained, 0),
    totalFeatures: infos.reduce((sum, i) => sum + i.featuresGained, 0),
    bonusSkillEdges: infos.filter(i => i.bonusSkillEdge).length,
    skillRankCapsUnlocked: infos
      .filter(i => i.skillRankCapUnlocked !== null)
      .map(i => ({ level: i.newLevel, cap: i.skillRankCapUnlocked! })),
    milestones: infos
      .filter(i => i.milestone !== null)
      .map(i => i.milestone!),
    classChoicePrompts: infos
      .filter(i => i.classChoicePrompt)
      .map(i => i.newLevel)
  }
}

/**
 * Calculate total lifestyle stat points earned based on milestone choices.
 * Used when creating higher-level characters or validating advancement.
 *
 * Each milestone that chose 'lifestyle_stat_points' grants:
 * - Amateur: +1 per even level in [6, 10] + 2 retroactive = up to 5 total
 * - Capable: +1 per even level in [12, 20] = up to 5 total
 * - Veteran: +1 per even level in [22, 30] = up to 5 total
 * - Elite:   +1 per even level in [32, 40] = up to 5 total
 * - Champion: +1 per even level in [42, 50] = up to 5 total
 *
 * These points must be spent on Attack or Special Attack only.
 */
export function calculateLifestyleStatPoints(
  currentLevel: number,
  milestoneChoices: Record<number, string>
): number {
  let total = 0
  for (const [milestoneLevelStr, choiceId] of Object.entries(milestoneChoices)) {
    if (!choiceId.endsWith('-stats')) continue
    const milestoneLevel = Number(milestoneLevelStr)
    const milestone = getMilestoneAt(milestoneLevel)
    const choice = milestone?.choices.find(c => c.id === choiceId)
    if (!choice || choice.type !== 'lifestyle_stat_points') continue

    // Add retroactive points
    total += choice.retroactivePoints ?? 0

    // Add per-even-level points within the range, up to current level
    if (choice.evenLevelRange) {
      const [start, end] = choice.evenLevelRange
      for (let lvl = start; lvl <= Math.min(end, currentLevel); lvl += 2) {
        total++
      }
    }
  }
  return total
}
