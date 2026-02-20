/**
 * Encounter Generation Service
 * Pure logic for weighted random species selection with diversity enforcement.
 * Extracted from generate.post.ts for testability.
 */

import type { DensityTier } from '~/types'
import { DENSITY_RANGES, MAX_SPAWN_COUNT } from '~/types'

// --- Types ---

export interface PoolEntry {
  speciesId: string
  speciesName: string
  weight: number
  levelMin: number | null
  levelMax: number | null
  source: 'parent' | 'modification'
}

export interface GeneratedPokemon {
  speciesId: string
  speciesName: string
  level: number
  weight: number
  source: 'parent' | 'modification'
}

export interface GenerateEncounterInput {
  entries: PoolEntry[]
  count: number
  levelMin: number
  levelMax: number
  /** Injectable RNG for testing. Defaults to Math.random. */
  randomFn?: () => number
}

export interface CalculateSpawnCountInput {
  density: DensityTier
  densityMultiplier: number
  countOverride?: number
  /** Injectable RNG for testing. Defaults to Math.random. */
  randomFn?: () => number
}

// --- Spawn Count ---

/**
 * Calculate spawn count from density tier, multiplier, and optional override.
 * The count is clamped between 1 and MAX_SPAWN_COUNT.
 */
export function calculateSpawnCount(input: CalculateSpawnCountInput): number {
  const { density, densityMultiplier, countOverride, randomFn = Math.random } = input

  if (countOverride !== undefined) {
    return Math.min(Math.max(countOverride, 1), MAX_SPAWN_COUNT)
  }

  const baseDensity = density || 'moderate'
  const densityRange = DENSITY_RANGES[baseDensity] || DENSITY_RANGES.moderate

  const rawMin = Math.max(1, Math.round(densityRange.min * densityMultiplier))
  const scaledMax = Math.min(MAX_SPAWN_COUNT, Math.round(densityRange.max * densityMultiplier))
  const scaledMin = Math.min(rawMin, scaledMax)

  return Math.floor(randomFn() * (scaledMax - scaledMin + 1)) + scaledMin
}

// --- Weighted Random Selection with Diversity Enforcement ---

/**
 * Generate encounter Pokemon using weighted random selection with diversity enforcement.
 *
 * Diversity rules:
 * - Each time a species is selected, its effective weight is halved (exponential decay).
 * - A per-species cap of ceil(count / 2) prevents any species from exceeding half the encounter.
 * - When only 1 species exists in the pool, diversity logic is skipped.
 * - When all species hit the cap (effective total weight = 0), original weights are used as fallback.
 *
 * @throws Error if entries array is empty or total weight is 0
 */
export function generateEncounterPokemon(input: GenerateEncounterInput): GeneratedPokemon[] {
  const { entries, count, levelMin, levelMax, randomFn = Math.random } = input

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)

  if (entries.length === 0 || totalWeight === 0) {
    throw new Error('No entries in encounter pool')
  }

  const generated: GeneratedPokemon[] = []
  const selectionCounts: Map<string, number> = new Map()
  const maxPerSpecies = Math.ceil(count / 2)
  const applyDiversity = entries.length > 1

  for (let i = 0; i < count; i++) {
    // Build effective weights with diversity decay
    const effectiveEntries = entries.map(entry => {
      const timesSelected = selectionCounts.get(entry.speciesName) ?? 0

      // Skip species that hit the per-species cap
      if (applyDiversity && timesSelected >= maxPerSpecies) {
        return { entry, effectiveWeight: 0 }
      }

      // Halve weight for each prior selection of this species
      const effectiveWeight = applyDiversity
        ? entry.weight * Math.pow(0.5, timesSelected)
        : entry.weight

      return { entry, effectiveWeight }
    })

    const effectiveTotalWeight = effectiveEntries.reduce(
      (sum, e) => sum + e.effectiveWeight, 0
    )

    // Fallback: if all effective weights are 0 (all species capped), use original weights
    const useOriginal = effectiveTotalWeight === 0
    const drawWeight = useOriginal ? totalWeight : effectiveTotalWeight

    let random = randomFn() * drawWeight
    let selected = entries[0]

    for (const { entry, effectiveWeight } of effectiveEntries) {
      const w = useOriginal ? entry.weight : effectiveWeight
      random -= w
      if (random <= 0) {
        selected = entry
        break
      }
    }

    // Track selection count for diversity
    selectionCounts.set(
      selected.speciesName,
      (selectionCounts.get(selected.speciesName) ?? 0) + 1
    )

    // Calculate level within range (entry-specific or table default)
    const entryLevelMin = selected.levelMin ?? levelMin
    const entryLevelMax = selected.levelMax ?? levelMax
    const level = Math.floor(randomFn() * (entryLevelMax - entryLevelMin + 1)) + entryLevelMin

    generated.push({
      speciesId: selected.speciesId,
      speciesName: selected.speciesName,
      level,
      weight: selected.weight,
      source: selected.source
    })
  }

  return generated
}
