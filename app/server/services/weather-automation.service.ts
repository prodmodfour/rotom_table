/**
 * Weather Automation Service
 * Pure functions for weather effect processing at turn start/end.
 *
 * P0: Hail and Sandstorm deal 1 Tick of HP damage at turn start.
 *     Type and ability immunities apply.
 * P1: Weather ability healing/damage at turn start and turn end.
 *     Ice Body, Rain Dish, Sun Blanket, Solar Power (turn start).
 *     Dry Skin, Desert Weather (turn end).
 *
 * PTU pp.341-342 (weather effects), pp.311-335 (abilities).
 * A Tick = 1/10th max HP (PTU p.246), minimum 1.
 */

import type { Combatant } from '~/types'
import type { Pokemon, HumanCharacter } from '~/types/character'
import {
  isDamagingWeather,
  isPtuWeather,
  isImmuneToWeatherDamage,
  getWeatherDamageReduction,
  getCombatantAbilities,
  WEATHER_ABILITY_EFFECTS
} from '~/utils/weatherRules'
import type { PtuWeather, WeatherAbilityEffect } from '~/utils/weatherRules'
import { calculateTickDamage } from '~/server/services/status-automation.service'

// ============================================
// TYPES
// ============================================

export interface WeatherTickResult {
  combatantId: string
  combatantName: string
  weather: string
  effect: 'damage' | 'immune'
  amount: number
  formula: string
  newHp: number
  injuryGained: boolean
  fainted: boolean
  immuneReason?: string
  immuneAbility?: string
}

// ============================================
// PURE FUNCTIONS
// ============================================

/**
 * Determine if a combatant should take weather damage at turn start,
 * and if so, calculate the amount.
 *
 * Returns null if no weather is active or weather is non-damaging.
 * Returns a WeatherTickResult with effect='immune' if combatant is immune.
 * Returns a WeatherTickResult with effect='damage' and the amount to apply.
 *
 * NOTE: This function does NOT apply the damage. The caller (next-turn endpoint)
 * uses combatant.service.calculateDamage + applyDamageToEntity for that.
 */
export function getWeatherTickForCombatant(
  combatant: Combatant,
  weather: string | null | undefined,
  allCombatants: Combatant[]
): { shouldApply: boolean; tick: WeatherTickResult | null } {
  // No weather or non-damaging weather: nothing to do
  if (!weather || !isDamagingWeather(weather)) {
    return { shouldApply: false, tick: null }
  }

  // Skip if combatant is fainted
  if (combatant.entity.currentHp <= 0) {
    return { shouldApply: false, tick: null }
  }

  const name = combatant.type === 'pokemon'
    ? (combatant.entity as Pokemon).nickname || (combatant.entity as Pokemon).species
    : (combatant.entity as HumanCharacter).name

  // Check immunity
  const immunity = isImmuneToWeatherDamage(combatant, weather, allCombatants)

  if (immunity.immune) {
    return {
      shouldApply: false,
      tick: {
        combatantId: combatant.id,
        combatantName: name,
        weather,
        effect: 'immune',
        amount: 0,
        formula: `Immune (${immunity.reason}: ${immunity.detail})`,
        newHp: combatant.entity.currentHp,
        injuryGained: false,
        fainted: false,
        immuneReason: immunity.reason,
        immuneAbility: immunity.detail
      }
    }
  }

  // Calculate weather tick damage
  const rawTickDamage = calculateTickDamage(combatant.entity.maxHp)
  const weatherLabel = weather === 'hail' ? 'Hail' : 'Sandstorm'

  // Check for damage reduction abilities (e.g. Permafrost subtracts 5)
  const reduction = getWeatherDamageReduction(combatant)
  let tickDamage = rawTickDamage
  let formula = `${weatherLabel}: 1/10 max HP (${rawTickDamage})`

  if (reduction.reduction > 0) {
    // Apply reduction, minimum 1 damage per decree-001
    tickDamage = Math.max(1, rawTickDamage - reduction.reduction)
    formula = `${weatherLabel}: 1/10 max HP (${rawTickDamage}) - ${reduction.ability} (${reduction.reduction}) = ${tickDamage}`
  }

  return {
    shouldApply: true,
    tick: {
      combatantId: combatant.id,
      combatantName: name,
      weather,
      effect: 'damage',
      amount: tickDamage,
      formula,
      // newHp, injuryGained, fainted will be filled by the caller after applying damage
      newHp: 0,
      injuryGained: false,
      fainted: false
    }
  }
}

// Re-export for backward compatibility (constant now lives in ~/utils/weatherRules)
export { WEATHER_ABILITY_EFFECTS } from '~/utils/weatherRules'
export type { WeatherAbilityEffect } from '~/utils/weatherRules'

export interface WeatherAbilityResult {
  combatantId: string
  combatantName: string
  ability: string
  weather: string
  effect: 'heal' | 'damage'
  amount: number
  formula: string
  /** Post-effect HP — populated by applyWeatherAbilityEffects after applying */
  newHp: number
  /** Whether the combatant fainted from this effect */
  fainted: boolean
}

/**
 * Get weather ability effects for a combatant at a given timing.
 * Returns array of effects to apply (healing or damage).
 *
 * NOTE: This function does NOT apply the effects. The caller handles
 * healing (clamped to maxHp) or damage (via combatant.service pipeline).
 *
 * @param combatant - The combatant to check
 * @param weather - Current encounter weather
 * @param timing - 'turn_start' or 'turn_end'
 */
export function getWeatherAbilityEffects(
  combatant: Combatant,
  weather: string | null | undefined,
  timing: 'turn_start' | 'turn_end'
): WeatherAbilityResult[] {
  if (!weather || !isPtuWeather(weather)) return []
  if (combatant.entity.currentHp <= 0) return []

  const abilities = getCombatantAbilities(combatant)
  const results: WeatherAbilityResult[] = []
  const name = getCombatantDisplayName(combatant)

  for (const effect of WEATHER_ABILITY_EFFECTS) {
    if (effect.weather !== weather) continue
    if (effect.timing !== timing) continue
    if (!abilities.some(a => a.toLowerCase() === effect.ability.toLowerCase())) continue

    const amount = Math.max(1, Math.floor(combatant.entity.maxHp / effect.hpFraction))
    results.push({
      combatantId: combatant.id,
      combatantName: name,
      ability: effect.ability,
      weather,
      effect: effect.type,
      amount,
      formula: `${effect.ability}: 1/${effect.hpFraction} max HP (${amount})`,
      // Populated by applyWeatherAbilityEffects after applying the effect
      newHp: 0,
      fainted: false
    })
  }

  return results
}

function getCombatantDisplayName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (combatant.entity as HumanCharacter).name
}
