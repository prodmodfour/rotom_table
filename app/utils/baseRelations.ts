/**
 * PTU Base Relations Rule (Core p.198)
 *
 * Stats must maintain the same relative ordering as nature-adjusted base stats.
 * Equal base stats form a "tier" and may end up in any order relative to each other.
 *
 * Decree-035: ordering uses nature-adjusted base stats, not raw species base stats.
 *
 * Shared between level-up allocation and evolution stat redistribution.
 * Pure functions, no DB access.
 */

import type { Stats } from '~/types/character'

const STAT_KEYS = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
type StatKey = typeof STAT_KEYS[number]

export interface BaseRelationsTier {
  /** Stats in this tier (equal nature-adjusted base values) */
  stats: StatKey[]
  /** The nature-adjusted base value for this tier */
  baseValue: number
}

export interface BaseRelationsValidation {
  /** Whether the allocation is valid */
  valid: boolean
  /** Violation messages if invalid */
  violations: string[]
  /** Stat ordering tiers (highest to lowest) */
  tiers: BaseRelationsTier[]
}

/**
 * Build the stat ordering tiers from nature-adjusted base stats.
 * Groups stats with equal base values into tiers, sorted highest to lowest.
 */
export function buildStatTiers(
  natureAdjustedBase: Stats
): BaseRelationsTier[] {
  // Build entries and sort by base value descending
  const entries = STAT_KEYS.map(key => ({
    key,
    value: natureAdjustedBase[key]
  }))
  entries.sort((a, b) => b.value - a.value)

  // Group into tiers
  const tiers: BaseRelationsTier[] = []
  let currentTier: BaseRelationsTier | null = null

  for (const entry of entries) {
    if (!currentTier || currentTier.baseValue !== entry.value) {
      currentTier = { stats: [entry.key], baseValue: entry.value }
      tiers.push(currentTier)
    } else {
      currentTier.stats.push(entry.key)
    }
  }

  return tiers
}

/**
 * Validate that a stat point allocation preserves Base Relations ordering.
 *
 * Rule: if natureAdjustedBase[A] > natureAdjustedBase[B], then
 *   (natureAdjustedBase[A] + statPoints[A]) >= (natureAdjustedBase[B] + statPoints[B])
 *
 * Equal base stats may have any relative allocation.
 *
 * @param natureAdjustedBase - Base stats after nature modifiers (decree-035)
 * @param statPoints - Number of stat points allocated to each stat
 * @returns Validation result with any violations
 */
export function validateBaseRelations(
  natureAdjustedBase: Stats,
  statPoints: Stats
): BaseRelationsValidation {
  const tiers = buildStatTiers(natureAdjustedBase)
  const violations: string[] = []

  // Check every pair of stats from different tiers
  for (let i = 0; i < STAT_KEYS.length; i++) {
    for (let j = i + 1; j < STAT_KEYS.length; j++) {
      const a = STAT_KEYS[i]
      const b = STAT_KEYS[j]

      const baseA = natureAdjustedBase[a]
      const baseB = natureAdjustedBase[b]

      // Only check pairs where base stats differ
      if (baseA === baseB) continue

      const finalA = baseA + statPoints[a]
      const finalB = baseB + statPoints[b]

      // If base[a] > base[b], then final[a] must >= final[b]
      if (baseA > baseB && finalA < finalB) {
        violations.push(
          `${formatStatName(a)} (base ${baseA}, final ${finalA}) ` +
          `must be >= ${formatStatName(b)} (base ${baseB}, final ${finalB})`
        )
      }
      // If base[b] > base[a], then final[b] must >= final[a]
      if (baseB > baseA && finalB < finalA) {
        violations.push(
          `${formatStatName(b)} (base ${baseB}, final ${finalB}) ` +
          `must be >= ${formatStatName(a)} (base ${baseA}, final ${finalA})`
        )
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    tiers
  }
}

/**
 * Determine which stats can legally receive the next stat point
 * without violating Base Relations.
 *
 * For each stat S, check: if we add +1 to S, is the resulting
 * allocation still valid? Return true for each stat that passes.
 */
export function getValidAllocationTargets(
  natureAdjustedBase: Stats,
  currentStatPoints: Stats
): Record<StatKey, boolean> {
  const result = {} as Record<StatKey, boolean>

  for (const key of STAT_KEYS) {
    const testPoints: Stats = { ...currentStatPoints, [key]: currentStatPoints[key] + 1 }
    const validation = validateBaseRelations(natureAdjustedBase, testPoints)
    result[key] = validation.valid
  }

  return result
}

/**
 * Extract stat point allocation from a Pokemon's current DB state.
 *
 * Nature-adjusted base stats are stored in base<Stat> fields.
 * Calculated stats are stored in current<Stat> fields.
 * Stat points = calculated - nature-adjusted base.
 *
 * HP is special: maxHp = level + (hpStat * 3) + 10
 *   So: hpStat = (maxHp - level - 10) / 3
 *   And: hpStatPoints = hpStat - baseHp
 */
export function extractStatPoints(pokemon: {
  level: number
  maxHp: number
  baseStats: Stats
  currentStats: Stats
}): {
  statPoints: Stats
  totalAllocated: number
  expectedTotal: number
  isConsistent: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // HP extraction from maxHp formula
  const hpStat = Math.round((pokemon.maxHp - pokemon.level - 10) / 3)
  const hpPoints = hpStat - pokemon.baseStats.hp

  // Track raw extraction values and warn on negative clamping
  const rawExtractions: Record<string, number> = {
    hp: hpPoints,
    attack: pokemon.currentStats.attack - pokemon.baseStats.attack,
    defense: pokemon.currentStats.defense - pokemon.baseStats.defense,
    specialAttack: pokemon.currentStats.specialAttack - pokemon.baseStats.specialAttack,
    specialDefense: pokemon.currentStats.specialDefense - pokemon.baseStats.specialDefense,
    speed: pokemon.currentStats.speed - pokemon.baseStats.speed
  }

  for (const [key, rawValue] of Object.entries(rawExtractions)) {
    if (rawValue < 0) {
      warnings.push(
        `${formatStatName(key)} extraction is negative (${rawValue}), clamped to 0 — ` +
        `current stat (${key === 'hp' ? hpStat : pokemon.currentStats[key as keyof Stats]}) ` +
        `is below base stat (${pokemon.baseStats[key as keyof Stats]})`
      )
    }
  }

  const statPoints: Stats = {
    hp: Math.max(0, rawExtractions.hp),
    attack: Math.max(0, rawExtractions.attack),
    defense: Math.max(0, rawExtractions.defense),
    specialAttack: Math.max(0, rawExtractions.specialAttack),
    specialDefense: Math.max(0, rawExtractions.specialDefense),
    speed: Math.max(0, rawExtractions.speed)
  }

  const totalAllocated = Object.values(statPoints).reduce((sum, v) => sum + v, 0)
  const expectedTotal = pokemon.level + 10

  return {
    statPoints,
    totalAllocated,
    expectedTotal,
    isConsistent: totalAllocated === expectedTotal,
    warnings
  }
}

/** Format stat key for display */
export function formatStatName(key: string): string {
  const names: Record<string, string> = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    specialAttack: 'Sp.Atk',
    specialDefense: 'Sp.Def',
    speed: 'Speed'
  }
  return names[key] || key
}

export { STAT_KEYS, type StatKey }
