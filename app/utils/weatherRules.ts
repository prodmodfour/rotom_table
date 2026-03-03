/**
 * PTU 1.05 Weather Effect Rules
 *
 * Pure functions for weather damage, immunity, and modifier calculations.
 * Weather conditions defined in PTU pp.341-342 (10-indices-and-reference.md).
 *
 * Tick = 1/10th max HP (PTU p.246): Math.max(1, Math.floor(maxHp / 10))
 *
 * Four PTU weather conditions with mechanical effects:
 * - Hail: 1 tick damage to non-Ice-type Pokemon at turn start
 * - Sandstorm: 1 tick damage to non-Ground/Rock/Steel-type Pokemon at turn start
 * - Rain: Fire -5 DB, Water +5 DB
 * - Sunny: Fire +5 DB, Water -5 DB
 */

import type { Combatant } from '~/types'
import type { Pokemon, HumanCharacter } from '~/types/character'

// ============================================
// TYPES
// ============================================

export type PtuWeather = 'hail' | 'sandstorm' | 'rain' | 'sunny'

/** All weather strings the system supports (display + mechanical) */
export type WeatherCondition =
  | PtuWeather
  | 'snow'
  | 'fog'
  | 'harsh_sunlight'
  | 'heavy_rain'
  | 'strong_winds'

/** Weather conditions that deal tick damage at turn start */
export const DAMAGING_WEATHER: PtuWeather[] = ['hail', 'sandstorm']

/** Weather conditions that modify move damage bases */
export const MODIFIER_WEATHER: PtuWeather[] = ['rain', 'sunny']

/** Check if a weather string is a PTU-standard weather with mechanical effects */
export function isPtuWeather(weather: string | null | undefined): weather is PtuWeather {
  return weather === 'hail' || weather === 'sandstorm' || weather === 'rain' || weather === 'sunny'
}

/** Check if weather deals tick damage at turn start */
export function isDamagingWeather(weather: string | null | undefined): boolean {
  return weather === 'hail' || weather === 'sandstorm'
}

// ============================================
// CONSTANTS
// ============================================

/** Weather damage = 1 Tick = 1/10th max HP (PTU p.246) */
export const WEATHER_TICK_FRACTION = 10

/** Rain/Sun damage modifier applied to Damage Base (PTU pp.341-342) */
export const WEATHER_DB_MODIFIER = 5

/** Hail: types immune to weather damage (PTU p.341) */
export const HAIL_IMMUNE_TYPES: string[] = ['Ice']

/** Sandstorm: types immune to weather damage (PTU p.341) */
export const SANDSTORM_IMMUNE_TYPES: string[] = ['Ground', 'Rock', 'Steel']

/**
 * Hail: abilities that grant immunity to weather damage (PTU pp.311-335).
 * - Ice Body: immune + heals 1 tick (healing handled separately in P1)
 * - Snow Cloak: immune + adjacent allies immune
 * - Snow Warning: static effect, user not damaged by Hail
 * - Overcoat: immune to weather damage (errata)
 * - Magic Guard: immune to all indirect damage including weather (PTU p.1770-1775)
 */
export const HAIL_IMMUNE_ABILITIES: string[] = [
  'Ice Body', 'Snow Cloak', 'Snow Warning', 'Overcoat', 'Magic Guard'
]

/**
 * Sandstorm: abilities that grant immunity to weather damage (PTU pp.311-335).
 * - Sand Veil: immune + adjacent allies immune
 * - Sand Rush: immune to Sandstorm damage
 * - Sand Force: immune to Sandstorm damage
 * - Desert Weather: immune to Sandstorm damage
 * - Overcoat: immune to weather damage (errata)
 * - Magic Guard: immune to all indirect damage including weather (PTU p.1770-1775)
 * - Sand Stream: grants Sandstorm immunity (PTU 10-indices p.2247-2251)
 */
export const SANDSTORM_IMMUNE_ABILITIES: string[] = [
  'Sand Veil', 'Sand Rush', 'Sand Force', 'Desert Weather', 'Overcoat', 'Magic Guard', 'Sand Stream'
]

/** Abilities that protect adjacent allies from Hail damage */
export const HAIL_ADJACENT_PROTECTION: string[] = ['Snow Cloak']

/** Abilities that protect adjacent allies from Sandstorm damage */
export const SANDSTORM_ADJACENT_PROTECTION: string[] = ['Sand Veil']

// ============================================
// TYPE / ABILITY HELPERS
// ============================================

/**
 * Get the types of a combatant's entity.
 * Pokemon have a types tuple. Humans have no types (always empty array).
 */
export function getCombatantTypes(combatant: Combatant): string[] {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    // Pokemon.types is [PokemonType] | [PokemonType, PokemonType]
    return [...pokemon.types]
  }
  // Trainers have no type -- they ARE affected by weather damage
  // (PTU p.341: "all non-Ice Type Pokemon" -- trainers are not Pokemon
  //  but take weather damage in Full Contact. No type immunity.)
  return []
}

/**
 * Get the abilities of a combatant's entity.
 * Returns all ability names. Abilities are stored as objects with a `name` field.
 */
export function getCombatantAbilities(combatant: Combatant): string[] {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    const abilities: string[] = []
    if (pokemon.abilities) {
      for (const ability of pokemon.abilities) {
        if (typeof ability === 'string') {
          abilities.push(ability)
        } else if (ability && typeof ability === 'object' && 'name' in ability) {
          abilities.push((ability as { name: string }).name)
        }
      }
    }
    return abilities
  }
  // Trainers don't have abilities in the Pokemon sense
  return []
}

// ============================================
// IMMUNITY CHECKS
// ============================================

export interface WeatherImmunityResult {
  immune: boolean
  reason?: 'type' | 'ability' | 'adjacent_ally'
  /** Which type or ability granted immunity */
  detail?: string
}

/**
 * Check if a combatant is immune to Hail damage.
 *
 * PTU p.341:
 * - Ice-type Pokemon are immune
 * - Abilities: Ice Body, Snow Cloak, Snow Warning, Overcoat
 * - Adjacent to ally with Snow Cloak: immune
 *
 * @param combatant - The combatant to check
 * @param allCombatants - All combatants (for adjacent ally checks)
 */
export function isImmuneToHail(
  combatant: Combatant,
  allCombatants?: Combatant[]
): WeatherImmunityResult {
  // Type check: Ice-type Pokemon are immune
  const types = getCombatantTypes(combatant)
  for (const immuneType of HAIL_IMMUNE_TYPES) {
    if (types.includes(immuneType)) {
      return { immune: true, reason: 'type', detail: immuneType }
    }
  }

  // Ability check: personal abilities
  const abilities = getCombatantAbilities(combatant)
  for (const immuneAbility of HAIL_IMMUNE_ABILITIES) {
    if (abilities.some(a => a.toLowerCase() === immuneAbility.toLowerCase())) {
      return { immune: true, reason: 'ability', detail: immuneAbility }
    }
  }

  // Adjacent ally check: Snow Cloak protects adjacent allies
  if (allCombatants && combatant.position) {
    for (const ally of allCombatants) {
      if (ally.id === combatant.id) continue
      if (ally.side !== combatant.side) continue
      if (!ally.position) continue
      // Fainted allies cannot protect (PTU p.248: fainted abilities inactive)
      if (ally.entity.currentHp <= 0) continue

      // Note: uses anchor position only; does not account for large token sizes (pre-existing limitation)
      // Check adjacency (1 cell distance in any direction)
      const dx = Math.abs(ally.position.x - combatant.position.x)
      const dy = Math.abs(ally.position.y - combatant.position.y)
      const isAdjacent = dx <= 1 && dy <= 1 && (dx + dy > 0)

      if (isAdjacent) {
        const allyAbilities = getCombatantAbilities(ally)
        for (const protectAbility of HAIL_ADJACENT_PROTECTION) {
          if (allyAbilities.some(a => a.toLowerCase() === protectAbility.toLowerCase())) {
            const allyName = ally.type === 'pokemon'
              ? (ally.entity as Pokemon).nickname || (ally.entity as Pokemon).species
              : (ally.entity as HumanCharacter).name
            return { immune: true, reason: 'adjacent_ally', detail: `${protectAbility} (${allyName})` }
          }
        }
      }
    }
  }

  // Permafrost damage reduction not handled (tracked in ptu-rule-133)
  return { immune: false }
}

/**
 * Check if a combatant is immune to Sandstorm damage.
 *
 * PTU p.341:
 * - Ground/Rock/Steel-type Pokemon are immune
 * - Abilities: Sand Veil, Sand Rush, Sand Force, Desert Weather, Overcoat
 * - Adjacent to ally with Sand Veil: immune
 *
 * @param combatant - The combatant to check
 * @param allCombatants - All combatants (for adjacent ally checks)
 */
export function isImmuneToSandstorm(
  combatant: Combatant,
  allCombatants?: Combatant[]
): WeatherImmunityResult {
  // Type check: Ground/Rock/Steel-type Pokemon are immune
  const types = getCombatantTypes(combatant)
  for (const immuneType of SANDSTORM_IMMUNE_TYPES) {
    if (types.includes(immuneType)) {
      return { immune: true, reason: 'type', detail: immuneType }
    }
  }

  // Ability check: personal abilities
  const abilities = getCombatantAbilities(combatant)
  for (const immuneAbility of SANDSTORM_IMMUNE_ABILITIES) {
    if (abilities.some(a => a.toLowerCase() === immuneAbility.toLowerCase())) {
      return { immune: true, reason: 'ability', detail: immuneAbility }
    }
  }

  // Adjacent ally check: Sand Veil protects adjacent allies
  if (allCombatants && combatant.position) {
    for (const ally of allCombatants) {
      if (ally.id === combatant.id) continue
      if (ally.side !== combatant.side) continue
      if (!ally.position) continue
      // Fainted allies cannot protect (PTU p.248: fainted abilities inactive)
      if (ally.entity.currentHp <= 0) continue

      // Note: uses anchor position only; does not account for large token sizes (pre-existing limitation)
      const dx = Math.abs(ally.position.x - combatant.position.x)
      const dy = Math.abs(ally.position.y - combatant.position.y)
      const isAdjacent = dx <= 1 && dy <= 1 && (dx + dy > 0)

      if (isAdjacent) {
        const allyAbilities = getCombatantAbilities(ally)
        for (const protectAbility of SANDSTORM_ADJACENT_PROTECTION) {
          if (allyAbilities.some(a => a.toLowerCase() === protectAbility.toLowerCase())) {
            const allyName = ally.type === 'pokemon'
              ? (ally.entity as Pokemon).nickname || (ally.entity as Pokemon).species
              : (ally.entity as HumanCharacter).name
            return { immune: true, reason: 'adjacent_ally', detail: `${protectAbility} (${allyName})` }
          }
        }
      }
    }
  }

  return { immune: false }
}

/**
 * Check weather immunity for a combatant given the current weather.
 * Dispatches to the correct weather-specific check.
 */
export function isImmuneToWeatherDamage(
  combatant: Combatant,
  weather: string,
  allCombatants?: Combatant[]
): WeatherImmunityResult {
  switch (weather) {
    case 'hail': return isImmuneToHail(combatant, allCombatants)
    case 'sandstorm': return isImmuneToSandstorm(combatant, allCombatants)
    default: return { immune: true, reason: 'type', detail: 'non-damaging weather' }
  }
}
