/**
 * Pure validation functions for PTU character creation rules.
 * Returns warning arrays, not errors -- the GM always has final say.
 *
 * Reference: PTU Core Chapter 2 (pp. 12-18)
 */

export interface CreationWarning {
  section: 'stats' | 'skills' | 'edges' | 'features' | 'classes'
  message: string
  severity: 'info' | 'warning'
}

/**
 * Validate stat point allocation against PTU rules.
 *
 * PTU Core p. 15:
 * - 10 points to distribute among combat stats
 * - Max 5 points in any single stat
 */
export function validateStatAllocation(
  statPoints: Record<string, number>,
  level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []
  const total = Object.values(statPoints).reduce((s, v) => s + v, 0)

  if (total !== 10 && level === 1) {
    warnings.push({
      section: 'stats',
      message: `Level 1 trainers should allocate exactly 10 stat points (currently ${total})`,
      severity: 'warning'
    })
  }

  for (const [stat, points] of Object.entries(statPoints)) {
    if (points > 5 && level === 1) {
      warnings.push({
        section: 'stats',
        message: `${stat} has ${points} added points (max 5 per stat at level 1)`,
        severity: 'warning'
      })
    }
  }

  return warnings
}

/**
 * Validate skill background allocation against PTU rules.
 *
 * PTU Core p. 14:
 * - Exactly 1 Adept, 1 Novice, 3 Pathetic
 * - Remaining skills stay Untrained
 */
export function validateSkillBackground(
  skills: Record<string, string>,
  _level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []
  const ranks = Object.values(skills)
  const adeptCount = ranks.filter(r => r === 'Adept').length
  const noviceCount = ranks.filter(r => r === 'Novice').length
  const patheticCount = ranks.filter(r => r === 'Pathetic').length

  if (adeptCount !== 1) {
    warnings.push({
      section: 'skills',
      message: `Background should set exactly 1 skill to Adept (found ${adeptCount})`,
      severity: 'warning'
    })
  }
  if (noviceCount !== 1) {
    warnings.push({
      section: 'skills',
      message: `Background should set exactly 1 skill to Novice (found ${noviceCount})`,
      severity: 'warning'
    })
  }
  if (patheticCount !== 3) {
    warnings.push({
      section: 'skills',
      message: `Background should set exactly 3 skills to Pathetic (found ${patheticCount})`,
      severity: 'warning'
    })
  }

  return warnings
}

/**
 * Validate edges, features, and class counts against PTU starting rules.
 *
 * PTU Core p. 13-14:
 * - 4 starting edges
 * - 4 features + 1 Training Feature = 5 total
 * - Max 4 trainer classes
 */
export function validateEdgesAndFeatures(
  edges: string[],
  features: string[],
  trainerClasses: string[],
  level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []

  if (level === 1 && edges.length !== 4) {
    warnings.push({
      section: 'edges',
      message: `Level 1 trainers start with 4 edges (have ${edges.length})`,
      severity: 'warning'
    })
  }
  if (level === 1 && features.length !== 5) {
    warnings.push({
      section: 'features',
      message: `Level 1 trainers start with 5 features (4 + 1 Training) (have ${features.length})`,
      severity: 'warning'
    })
  }
  if (trainerClasses.length > 4) {
    warnings.push({
      section: 'classes',
      message: `Maximum 4 trainer classes (have ${trainerClasses.length})`,
      severity: 'warning'
    })
  }

  return warnings
}
