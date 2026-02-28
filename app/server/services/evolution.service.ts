/**
 * Pokemon Evolution Service
 *
 * Core business logic for performing Pokemon evolution:
 * - Stat point extraction from current Pokemon state
 * - Stat recalculation with new species base stats + existing nature
 * - Base Relations Rule validation (decree-035: uses nature-adjusted base stats)
 * - Full evolution execution (species, types, stats, HP)
 *
 * PTU Core Chapter 5, p.202:
 * "Take the new form's Base Stats, apply the Pokemon's Nature again,
 * reapply any Vitamins that were used, and then re-Stat the Pokemon,
 * spreading the Stats as you wish."
 *
 * HP formula: Level + (HP stat * 3) + 10
 * Stat points total: Level + 10
 */

import { prisma } from '~/server/utils/prisma'
import { applyNatureToBaseStats } from '~/constants/natures'
import type { EvolutionTrigger } from '~/types/species'

// ============================================
// TYPES
// ============================================

export interface Stats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

export interface StatRecalculationResult {
  valid: boolean
  error?: string
  natureAdjustedBase: Stats
  calculatedStats: Stats
  maxHp: number
  violations: string[]
}

export interface EvolutionChanges {
  previousSpecies: string
  newSpecies: string
  previousTypes: string[]
  newTypes: string[]
  previousBaseStats: Stats
  newBaseStats: Stats
  previousMaxHp: number
  newMaxHp: number
}

export interface EvolutionResult {
  success: boolean
  pokemon: Record<string, unknown>
  changes: EvolutionChanges
}

export interface PerformEvolutionInput {
  pokemonId: string
  targetSpecies: string
  statPoints: Stats
  skipBaseRelations?: boolean
}

// ============================================
// STAT FUNCTIONS
// ============================================

/**
 * Extract the stat point allocation from a Pokemon's current state.
 *
 * Pokemon.baseHp etc. stores NATURE-ADJUSTED base stats (not raw species base).
 * Pokemon.currentAttack etc. are calculated stats (base + added points).
 * Stat points allocated = calculated stat - nature-adjusted base stat.
 *
 * For HP: maxHp = level + (hpStat * 3) + 10
 * So: hpStat = (maxHp - level - 10) / 3
 * And: hpStatPoints = hpStat - baseHp
 */
export function extractStatPoints(pokemon: {
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseSpAtk: number
  baseSpDef: number
  baseSpeed: number
  currentAttack: number
  currentDefense: number
  currentSpAtk: number
  currentSpDef: number
  currentSpeed: number
  maxHp: number
  level: number
}): Stats {
  const hpStat = Math.round((pokemon.maxHp - pokemon.level - 10) / 3)
  return {
    hp: hpStat - pokemon.baseHp,
    attack: pokemon.currentAttack - pokemon.baseAttack,
    defense: pokemon.currentDefense - pokemon.baseDefense,
    specialAttack: pokemon.currentSpAtk - pokemon.baseSpAtk,
    specialDefense: pokemon.currentSpDef - pokemon.baseSpDef,
    speed: pokemon.currentSpeed - pokemon.baseSpeed
  }
}

/**
 * Recalculate stats for a new species after evolution.
 *
 * 1. Apply nature to new species' raw base stats
 * 2. Validate stat points total = level + 10
 * 3. Validate Base Relations Rule (decree-035)
 * 4. Calculate final stats and max HP
 */
export function recalculateStats(input: {
  newSpeciesBaseStats: Stats
  natureName: string
  level: number
  statPoints: Stats
}): StatRecalculationResult {
  const { newSpeciesBaseStats, natureName, level, statPoints } = input

  // 1. Apply nature to new base stats
  const natureAdjusted = applyNatureToBaseStats(newSpeciesBaseStats, natureName)

  // 2. Validate stat points total = level + 10
  const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
  const total = statKeys.reduce((sum, key) => sum + statPoints[key], 0)
  const expectedTotal = level + 10
  if (total !== expectedTotal) {
    return {
      valid: false,
      error: `Stat points must total ${expectedTotal}, got ${total}`,
      natureAdjustedBase: natureAdjusted,
      calculatedStats: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
      maxHp: 0,
      violations: []
    }
  }

  // 3. Validate no negative stat points
  for (const key of statKeys) {
    if (statPoints[key] < 0) {
      return {
        valid: false,
        error: `Stat points for ${key} cannot be negative (got ${statPoints[key]})`,
        natureAdjustedBase: natureAdjusted,
        calculatedStats: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
        maxHp: 0,
        violations: []
      }
    }
  }

  // 4. Validate Base Relations Rule
  const violations = validateBaseRelations(natureAdjusted, statPoints)

  // 5. Calculate final stats
  const calculatedStats: Stats = {
    hp: natureAdjusted.hp + statPoints.hp,
    attack: natureAdjusted.attack + statPoints.attack,
    defense: natureAdjusted.defense + statPoints.defense,
    specialAttack: natureAdjusted.specialAttack + statPoints.specialAttack,
    specialDefense: natureAdjusted.specialDefense + statPoints.specialDefense,
    speed: natureAdjusted.speed + statPoints.speed
  }

  // 6. Calculate max HP: level + (hpStat * 3) + 10
  const maxHp = level + (calculatedStats.hp * 3) + 10

  return {
    valid: true,
    natureAdjustedBase: natureAdjusted,
    calculatedStats,
    maxHp,
    violations
  }
}

/**
 * Validate that stat point allocation preserves Base Relations ordering.
 *
 * PTU Core p.198: stats must maintain the same relative ordering as base stats.
 * Equal base stats are in the same tier and need not maintain order relative to each other.
 * Decree-035: Uses nature-adjusted base stats for ordering.
 *
 * Returns array of violation messages. Empty array = valid.
 */
export function validateBaseRelations(
  natureAdjustedBase: Stats,
  statPoints: Stats
): string[] {
  const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'] as const
  const violations: string[] = []

  for (const a of statKeys) {
    for (const b of statKeys) {
      if (a === b) continue
      // If base[a] > base[b], then final[a] must >= final[b]
      if (natureAdjustedBase[a] > natureAdjustedBase[b]) {
        const finalA = natureAdjustedBase[a] + statPoints[a]
        const finalB = natureAdjustedBase[b] + statPoints[b]
        if (finalA < finalB) {
          violations.push(
            `${a} (base ${natureAdjustedBase[a]}) must be >= ${b} (base ${natureAdjustedBase[b]}), ` +
            `but final ${a}=${finalA} < ${b}=${finalB}`
          )
        }
      }
    }
  }

  return violations
}

// ============================================
// EVOLUTION EXECUTION
// ============================================

/**
 * Perform a Pokemon evolution. Orchestrates all changes.
 *
 * 1. Fetch the Pokemon and validate it exists
 * 2. Fetch current species and validate evolution trigger
 * 3. Fetch target species data
 * 4. Recalculate stats with new species base stats + existing nature
 * 5. Calculate current HP proportionally
 * 6. Write the update to DB
 */
export async function performEvolution(input: PerformEvolutionInput): Promise<EvolutionResult> {
  const { pokemonId, targetSpecies, statPoints, skipBaseRelations } = input

  // 1. Fetch the Pokemon
  const pokemon = await prisma.pokemon.findUnique({ where: { id: pokemonId } })
  if (!pokemon) {
    throw new Error('Pokemon not found')
  }

  // 2. Fetch current species data (for evolution trigger validation)
  const currentSpecies = await prisma.speciesData.findUnique({ where: { name: pokemon.species } })
  if (!currentSpecies) {
    throw new Error('Current species data not found')
  }

  // 3. Validate evolution is possible (trigger check)
  const triggers: EvolutionTrigger[] = JSON.parse(currentSpecies.evolutionTriggers || '[]')
  const trigger = triggers.find(t => t.toSpecies === targetSpecies)
  if (!trigger) {
    throw new Error(`${pokemon.species} cannot evolve into ${targetSpecies}`)
  }

  // Validate level requirement
  if (trigger.minimumLevel !== null && pokemon.level < trigger.minimumLevel) {
    throw new Error(`Pokemon must be at least level ${trigger.minimumLevel} to evolve (current: ${pokemon.level})`)
  }

  // Validate held item requirement
  if (trigger.requiredItem !== null && trigger.itemMustBeHeld) {
    if (!pokemon.heldItem || pokemon.heldItem.toLowerCase() !== trigger.requiredItem.toLowerCase()) {
      throw new Error(`Pokemon must be holding ${trigger.requiredItem} to evolve`)
    }
  }

  // 4. Fetch the target species data
  const targetSpeciesData = await prisma.speciesData.findUnique({ where: { name: targetSpecies } })
  if (!targetSpeciesData) {
    throw new Error(`Target species data not found: ${targetSpecies}`)
  }

  // 5. Recalculate stats
  const nature: { name: string } = JSON.parse(pokemon.nature)
  const newBaseStats: Stats = {
    hp: targetSpeciesData.baseHp,
    attack: targetSpeciesData.baseAttack,
    defense: targetSpeciesData.baseDefense,
    specialAttack: targetSpeciesData.baseSpAtk,
    specialDefense: targetSpeciesData.baseSpDef,
    speed: targetSpeciesData.baseSpeed
  }

  const recalc = recalculateStats({
    newSpeciesBaseStats: newBaseStats,
    natureName: nature.name,
    level: pokemon.level,
    statPoints
  })

  if (!recalc.valid) {
    throw new Error(recalc.error)
  }

  if (recalc.violations.length > 0 && !skipBaseRelations) {
    throw new Error(`Base Relations violated: ${recalc.violations.join('; ')}`)
  }

  // 6. Calculate current HP proportionally
  const oldMaxHp = pokemon.maxHp
  const oldCurrentHp = pokemon.currentHp
  const hpRatio = oldMaxHp > 0 ? oldCurrentHp / oldMaxHp : 1
  const newCurrentHp = Math.max(1, Math.round(hpRatio * recalc.maxHp))

  // Build previous state for changes diff
  const previousBaseStats: Stats = {
    hp: pokemon.baseHp,
    attack: pokemon.baseAttack,
    defense: pokemon.baseDefense,
    specialAttack: pokemon.baseSpAtk,
    specialDefense: pokemon.baseSpDef,
    speed: pokemon.baseSpeed
  }
  const previousTypes = [pokemon.type1, pokemon.type2].filter(Boolean) as string[]
  const newTypes = [targetSpeciesData.type1, targetSpeciesData.type2].filter(Boolean) as string[]

  // 7. Write the update
  const updated = await prisma.pokemon.update({
    where: { id: pokemonId },
    data: {
      species: targetSpecies,
      type1: targetSpeciesData.type1,
      type2: targetSpeciesData.type2 || null,
      baseHp: recalc.natureAdjustedBase.hp,
      baseAttack: recalc.natureAdjustedBase.attack,
      baseDefense: recalc.natureAdjustedBase.defense,
      baseSpAtk: recalc.natureAdjustedBase.specialAttack,
      baseSpDef: recalc.natureAdjustedBase.specialDefense,
      baseSpeed: recalc.natureAdjustedBase.speed,
      currentAttack: recalc.calculatedStats.attack,
      currentDefense: recalc.calculatedStats.defense,
      currentSpAtk: recalc.calculatedStats.specialAttack,
      currentSpDef: recalc.calculatedStats.specialDefense,
      currentSpeed: recalc.calculatedStats.speed,
      maxHp: recalc.maxHp,
      currentHp: newCurrentHp
      // P1 handles: abilities, moves, capabilities, skills
    }
  })

  const changes: EvolutionChanges = {
    previousSpecies: pokemon.species,
    newSpecies: targetSpecies,
    previousTypes,
    newTypes,
    previousBaseStats,
    newBaseStats: recalc.natureAdjustedBase,
    previousMaxHp: oldMaxHp,
    newMaxHp: recalc.maxHp
  }

  return {
    success: true,
    pokemon: updated as unknown as Record<string, unknown>,
    changes
  }
}
