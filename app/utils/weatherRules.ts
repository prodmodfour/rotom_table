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

/**
 * Weather-based combat stage abilities (P1 + P2).
 * Applied when weather is set, reversed when weather changes/expires.
 * Uses source-tracked CS changes per decree-005 (stageSources system).
 *
 * PTU pp.311-335:
 * - Swift Swim: +4 Speed CS in Rain (p.331)
 * - Chlorophyll: +4 Speed CS in Sun (p.315)
 * - Sand Rush: +4 Speed CS in Sandstorm (p.323)
 * - Solar Power: +2 SpAtk CS in Sun (p.327) — also has HP damage, handled separately
 * P2 additions:
 * - Thermosensitive: +2 Atk CS and +2 SpAtk CS in Sun (p.331)
 *   (Hail movement halving handled separately in grid movement)
 */
export const WEATHER_CS_ABILITIES: Array<{
  weather: PtuWeather
  ability: string
  stat: 'speed' | 'specialAttack' | 'attack'
  bonus: number
}> = [
  { weather: 'rain', ability: 'Swift Swim', stat: 'speed', bonus: 4 },
  { weather: 'sunny', ability: 'Chlorophyll', stat: 'speed', bonus: 4 },
  { weather: 'sandstorm', ability: 'Sand Rush', stat: 'speed', bonus: 4 },
  { weather: 'sunny', ability: 'Solar Power', stat: 'specialAttack', bonus: 2 },
  // P2: Thermosensitive (PTU p.331)
  { weather: 'sunny', ability: 'Thermosensitive', stat: 'attack', bonus: 2 },
  { weather: 'sunny', ability: 'Thermosensitive', stat: 'specialAttack', bonus: 2 },
]

/**
 * Get weather-based CS bonuses for a combatant.
 * Returns array of matching abilities and their stat bonuses.
 */
export function getWeatherCSBonuses(
  combatant: Combatant,
  weather: string | null | undefined
): Array<{ ability: string; stat: 'speed' | 'specialAttack' | 'attack'; bonus: number }> {
  if (!weather) return []
  const abilities = getCombatantAbilities(combatant)
  const bonuses: Array<{ ability: string; stat: 'speed' | 'specialAttack' | 'attack'; bonus: number }> = []

  for (const entry of WEATHER_CS_ABILITIES) {
    if (weather === entry.weather) {
      if (abilities.some(a => a.toLowerCase() === entry.ability.toLowerCase())) {
        bonuses.push({ ability: entry.ability, stat: entry.stat, bonus: entry.bonus })
      }
    }
  }

  return bonuses
}

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

// ============================================
// P2: WEATHER BALL
// ============================================

/**
 * Weather Ball type/DB mapping (PTU p.338+).
 * Returns the effective type and DB for Weather Ball given the current weather.
 *
 * Without weather: Normal-type, DB 5
 * With weather: matching type, DB 10
 */
export function getWeatherBallEffect(weather: string | null | undefined): {
  type: string
  damageBase: number
} {
  switch (weather) {
    case 'sunny': return { type: 'Fire', damageBase: 10 }
    case 'rain': return { type: 'Water', damageBase: 10 }
    case 'hail': return { type: 'Ice', damageBase: 10 }
    case 'sandstorm': return { type: 'Rock', damageBase: 10 }
    default: return { type: 'Normal', damageBase: 5 }
  }
}

// ============================================
// P2: FORECAST (CASTFORM)
// ============================================

/**
 * Forecast type mapping (PTU p.319).
 * Returns the type Castform becomes in the given weather.
 * Returns 'Normal' if no weather or non-PTU weather.
 */
export function getForecastType(weather: string | null | undefined): string {
  switch (weather) {
    case 'sunny': return 'Fire'
    case 'rain': return 'Water'
    case 'hail': return 'Ice'
    case 'sandstorm': return 'Rock'
    default: return 'Normal'
  }
}

// ============================================
// P2: WEATHER EVASION ABILITIES
// ============================================

/**
 * Weather-based evasion bonus abilities (P2).
 * These add flat evasion bonuses (PTU Part 2 evasion: additive on top of stat-derived).
 * Applied/reversed alongside WEATHER_CS_ABILITIES when weather changes.
 *
 * PTU pp.311-335:
 * - Snow Cloak: +2 evasion in Hail (p.327)
 * - Sand Veil: +2 evasion in Sandstorm (p.323)
 */
export const WEATHER_EVASION_ABILITIES: Array<{
  weather: PtuWeather
  ability: string
  bonus: number
}> = [
  { weather: 'hail', ability: 'Snow Cloak', bonus: 2 },
  { weather: 'sandstorm', ability: 'Sand Veil', bonus: 2 },
]

/**
 * Get weather-based evasion bonuses for a combatant.
 * Returns array of matching abilities and their evasion bonus values.
 */
export function getWeatherEvasionBonuses(
  combatant: Combatant,
  weather: string | null | undefined
): Array<{ ability: string; bonus: number }> {
  if (!weather) return []
  const abilities = getCombatantAbilities(combatant)
  const bonuses: Array<{ ability: string; bonus: number }> = []

  for (const entry of WEATHER_EVASION_ABILITIES) {
    if (weather === entry.weather) {
      if (abilities.some(a => a.toLowerCase() === entry.ability.toLowerCase())) {
        bonuses.push({ ability: entry.ability, bonus: entry.bonus })
      }
    }
  }

  return bonuses
}

// ============================================
// P2: SAND FORCE
// ============================================

/** Move types that get +5 damage from Sand Force in Sandstorm (PTU p.323) */
export const SAND_FORCE_TYPES: string[] = ['Ground', 'Rock', 'Steel']

/**
 * Check if Sand Force damage bonus applies.
 * PTU p.323: "While in a Sandstorm, the user's Ground, Rock, and Steel-Type
 * Direct-Damage Moves deal +5 Damage."
 *
 * @returns 5 if Sand Force applies, 0 otherwise.
 */
export function getSandForceDamageBonus(
  combatant: Combatant,
  weather: string | null | undefined,
  moveType: string
): number {
  if (weather !== 'sandstorm') return 0

  const abilities = getCombatantAbilities(combatant)
  const hasSandForce = abilities.some(a => a.toLowerCase() === 'sand force')
  if (!hasSandForce) return 0

  const normalizedType = moveType.charAt(0).toUpperCase() + moveType.slice(1).toLowerCase()
  if (SAND_FORCE_TYPES.includes(normalizedType)) return 5

  return 0
}

// ============================================
// P2: STATUS CURE ABILITIES
// ============================================

/**
 * Persistent status conditions that can be cured by Hydration/Leaf Guard.
 * PTU p.320:
 * - Hydration: cures "one Status Affliction" (persistent statuses)
 * - Leaf Guard: cures "one Status Condition" (broader — includes volatile)
 *
 * For safety, both cure from the same list of persistent statuses.
 * Volatile conditions (Confused, Flinched, etc.) are generally round-scoped
 * and clear on their own, so we focus on persistent ones.
 */
export const CURABLE_PERSISTENT_STATUSES: string[] = [
  'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned', 'Asleep'
]

/**
 * Weather status cure abilities (P2).
 * Each entry defines which weather triggers the cure.
 *
 * PTU pp.320:
 * - Hydration: cure one status affliction at turn end in Rain
 * - Leaf Guard: cure one status condition at turn end in Sun
 */
export const WEATHER_STATUS_CURE_ABILITIES: Array<{
  weather: PtuWeather
  ability: string
}> = [
  { weather: 'rain', ability: 'Hydration' },
  { weather: 'sunny', ability: 'Leaf Guard' },
]

// ============================================
// P1: WEATHER ABILITY HEALING/DAMAGE
// ============================================

/**
 * Weather ability healing/damage mapping (P1).
 * Each entry defines when the effect fires and what it does.
 *
 * PTU pp.311-335:
 * Turn start: Ice Body (Hail heal), Rain Dish (Rain heal), Sun Blanket (Sun heal),
 *             Solar Power (Sun damage)
 * Turn end: Dry Skin (Rain heal / Sun damage), Desert Weather (Rain heal)
 */
export interface WeatherAbilityEffect {
  ability: string
  weather: PtuWeather
  timing: 'turn_start' | 'turn_end'
  type: 'heal' | 'damage'
  /** Fraction of max HP: 10 = 1/10th (tick), 16 = 1/16th */
  hpFraction: number
}

export const WEATHER_ABILITY_EFFECTS: WeatherAbilityEffect[] = [
  // Turn start
  { ability: 'Ice Body', weather: 'hail', timing: 'turn_start', type: 'heal', hpFraction: 10 },
  { ability: 'Rain Dish', weather: 'rain', timing: 'turn_start', type: 'heal', hpFraction: 10 },
  { ability: 'Sun Blanket', weather: 'sunny', timing: 'turn_start', type: 'heal', hpFraction: 10 },
  { ability: 'Solar Power', weather: 'sunny', timing: 'turn_start', type: 'damage', hpFraction: 16 },

  // Turn end
  { ability: 'Dry Skin', weather: 'rain', timing: 'turn_end', type: 'heal', hpFraction: 10 },
  { ability: 'Dry Skin', weather: 'sunny', timing: 'turn_end', type: 'damage', hpFraction: 10 },
  { ability: 'Desert Weather', weather: 'rain', timing: 'turn_end', type: 'heal', hpFraction: 16 },
]
