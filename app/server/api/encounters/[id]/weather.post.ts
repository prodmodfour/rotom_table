/**
 * POST /api/encounters/:id/weather
 *
 * Set or clear weather on an encounter with PTU duration tracking.
 * Body: { weather: string | null, source?: 'move' | 'ability' | 'manual', duration?: number }
 *
 * PTU rules: Weather from moves lasts 5 rounds.
 * Weather from abilities persists while the ability user is active.
 * Manual weather has no auto-expiration (duration 0).
 *
 * P1: When weather changes, apply/reverse weather-based CS bonuses
 * (Swift Swim, Chlorophyll, Sand Rush, Solar Power) using decree-005
 * source-tracked stage changes.
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, buildEncounterResponse } from '~/server/services/encounter.service'
import { syncEntityToDatabase } from '~/server/services/entity-update.service'
import { getWeatherCSBonuses, getForecastType, getCombatantAbilities, getWeatherEvasionBonuses } from '~/utils/weatherRules'
import type { StageModifiers, StageSource } from '~/types/combat'
import type { Pokemon } from '~/types/character'

const PTU_WEATHER_DURATION = 5

/**
 * Create default stage modifiers (all zeros).
 */
function createDefaultStageModifiers(): StageModifiers {
  return { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 }
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    const body = await readBody(event)

    const { record, combatants } = await loadEncounter(id)

    const oldWeather = record.weather
    const weather = body.weather ?? null
    const source: string | null = weather ? (body.source ?? 'manual') : null

    // Determine duration based on source
    let duration = 0
    if (weather) {
      if (body.duration !== undefined && body.duration !== null) {
        // Explicit duration provided
        duration = Math.max(0, Math.round(body.duration))
      } else if (source === 'move' || source === 'ability') {
        // PTU default: 5 rounds for moves and abilities
        duration = PTU_WEATHER_DURATION
      }
      // Manual weather: duration stays 0 (indefinite)
    }

    // --- P1: Apply/reverse weather-based CS bonuses (decree-005 stageSources) ---
    // When weather changes, reverse old weather CS sources and apply new ones.
    let combatantsChanged = false

    for (const combatant of combatants) {
      let modified = false

      // Reverse old weather CS sources
      const oldSources: StageSource[] = (combatant.stageSources ?? []).filter(
        (s: StageSource) => s.source.startsWith('weather:')
      )
      if (oldSources.length > 0) {
        const entity = combatant.entity
        if (!entity.stageModifiers) {
          entity.stageModifiers = createDefaultStageModifiers()
        }

        let updatedModifiers = { ...entity.stageModifiers }
        for (const src of oldSources) {
          const current = updatedModifiers[src.stat] || 0
          updatedModifiers = {
            ...updatedModifiers,
            [src.stat]: Math.max(-6, Math.min(6, current - src.value))
          }
        }
        entity.stageModifiers = updatedModifiers

        combatant.stageSources = (combatant.stageSources ?? []).filter(
          (s: StageSource) => !s.source.startsWith('weather:')
        )
        modified = true
      }

      // Apply new weather CS bonuses
      if (weather) {
        const csBonuses = getWeatherCSBonuses(combatant, weather)
        if (csBonuses.length > 0) {
          const entity = combatant.entity
          if (!entity.stageModifiers) {
            entity.stageModifiers = createDefaultStageModifiers()
          }

          for (const bonus of csBonuses) {
            const current = entity.stageModifiers[bonus.stat] || 0
            const newValue = Math.min(6, current + bonus.bonus)
            const actualDelta = newValue - current

            entity.stageModifiers = {
              ...entity.stageModifiers,
              [bonus.stat]: newValue
            }

            combatant.stageSources = [
              ...(combatant.stageSources ?? []),
              { stat: bonus.stat, value: actualDelta, source: `weather:${weather}:${bonus.ability}` }
            ]
          }
          modified = true
        }

        // P2: Apply weather evasion bonuses (Snow Cloak, Sand Veil)
        // Tracked as evasion CS source for clean reversal (decree-005)
        const evasionBonuses = getWeatherEvasionBonuses(combatant, weather)
        if (evasionBonuses.length > 0) {
          const entity = combatant.entity
          if (!entity.stageModifiers) {
            entity.stageModifiers = createDefaultStageModifiers()
          }

          for (const eBonus of evasionBonuses) {
            const current = entity.stageModifiers.evasion || 0
            const newValue = Math.min(6, current + eBonus.bonus)
            const actualDelta = newValue - current

            entity.stageModifiers = {
              ...entity.stageModifiers,
              evasion: newValue
            }

            combatant.stageSources = [
              ...(combatant.stageSources ?? []),
              { stat: 'evasion', value: actualDelta, source: `weather:${weather}:${eBonus.ability}` }
            ]
          }
          modified = true
        }
      }

      // P2: Forecast type changes (PTU p.319)
      // When weather changes, update type for all combatants with Forecast ability
      if (combatant.type === 'pokemon') {
        const abilities = getCombatantAbilities(combatant)
        const hasForecast = abilities.some(a => a.toLowerCase() === 'forecast')

        if (hasForecast) {
          const pokemon = combatant.entity as Pokemon

          if (weather) {
            // Save original types (only if not already saved from a previous weather change)
            if (!combatant.forecastOriginalTypes) {
              combatant.forecastOriginalTypes = {
                type1: pokemon.types[0],
                type2: pokemon.types.length > 1 ? pokemon.types[1] : null
              }
            }

            // Apply new weather type
            const newType = getForecastType(weather)
            pokemon.types = [newType] as any
            modified = true
          } else {
            // Weather cleared — restore original types
            if (combatant.forecastOriginalTypes) {
              const orig = combatant.forecastOriginalTypes
              pokemon.types = orig.type2
                ? [orig.type1, orig.type2] as any
                : [orig.type1] as any
              combatant.forecastOriginalTypes = undefined
              modified = true
            }
          }
        }
      }

      // Sync affected combatants to database
      if (modified) {
        combatantsChanged = true
        await syncEntityToDatabase(combatant, {
          stageModifiers: combatant.entity.stageModifiers
        })
      }
    }

    const updated = await prisma.encounter.update({
      where: { id },
      data: {
        weather,
        weatherDuration: duration,
        weatherSource: source,
        // Save updated combatants if CS bonuses were applied/reversed
        ...(combatantsChanged && { combatants: JSON.stringify(combatants) })
      }
    })

    const response = buildEncounterResponse(
      { ...record, weather: updated.weather, weatherDuration: updated.weatherDuration, weatherSource: updated.weatherSource },
      combatants
    )

    return { success: true, data: response }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to set weather'
    })
  }
})
