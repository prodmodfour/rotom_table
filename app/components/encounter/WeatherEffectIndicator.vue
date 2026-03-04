<template>
  <div v-if="weatherEffect" class="weather-effect-indicator" :class="effectClass">
    <img :src="weatherIcon" alt="" class="weather-effect-icon" />
    <span class="weather-effect-label">{{ effectLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Combatant } from '~/types'
import type { Pokemon } from '~/types/character'
import {
  isDamagingWeather,
  isImmuneToWeatherDamage,
  getCombatantAbilities,
  WEATHER_EVASION_ABILITIES,
  WEATHER_STATUS_CURE_ABILITIES,
  WEATHER_ABILITY_EFFECTS
} from '~/utils/weatherRules'

const props = defineProps<{
  combatant: Combatant
  weather: string | null
  allCombatants: Combatant[]
}>()

interface WeatherEffect {
  type: 'damage' | 'immune' | 'boost' | 'heal' | 'cure'
  reason: string | null
}

/**
 * Compute the most relevant weather effect for this combatant.
 * Priority: damage > immune > heal > cure > boost
 */
const weatherEffect = computed((): WeatherEffect | null => {
  if (!props.weather) return null

  const isDamaging = isDamagingWeather(props.weather)

  // Check weather tick damage/immunity first (Hail, Sandstorm)
  if (isDamaging) {
    const immunity = isImmuneToWeatherDamage(
      props.combatant,
      props.weather,
      props.allCombatants
    )
    if (immunity.immune) {
      return { type: 'immune', reason: immunity.detail ?? null }
    }
    return { type: 'damage', reason: null }
  }

  // Check for weather ability healing/damage effects
  const abilities = getCombatantAbilities(props.combatant)

  for (const effect of WEATHER_ABILITY_EFFECTS) {
    if (effect.weather !== props.weather) continue
    if (!abilities.some(a => a.toLowerCase() === effect.ability.toLowerCase())) continue

    if (effect.type === 'heal') {
      return { type: 'heal', reason: effect.ability }
    }
    if (effect.type === 'damage') {
      return { type: 'damage', reason: effect.ability }
    }
  }

  // Check for status cure abilities (Hydration in Rain, Leaf Guard in Sun)
  for (const cureEntry of WEATHER_STATUS_CURE_ABILITIES) {
    if (cureEntry.weather !== props.weather) continue
    if (abilities.some(a => a.toLowerCase() === cureEntry.ability.toLowerCase())) {
      return { type: 'cure', reason: cureEntry.ability }
    }
  }

  // Check for evasion boost abilities (Snow Cloak in Hail, Sand Veil in Sandstorm)
  for (const evasionEntry of WEATHER_EVASION_ABILITIES) {
    if (evasionEntry.weather !== props.weather) continue
    if (abilities.some(a => a.toLowerCase() === evasionEntry.ability.toLowerCase())) {
      return { type: 'boost', reason: `${evasionEntry.ability} (+${evasionEntry.bonus} Evasion)` }
    }
  }

  // Check for Flower Gift availability (Sun)
  if (props.weather === 'sunny') {
    if (abilities.some(a => a.toLowerCase() === 'flower gift')) {
      return { type: 'boost', reason: 'Flower Gift available' }
    }
  }

  // Check for Forecast type change
  if (abilities.some(a => a.toLowerCase() === 'forecast')) {
    const pokemon = props.combatant.entity as Pokemon
    return { type: 'boost', reason: `Forecast (${pokemon.types?.[0] ?? 'Normal'}-type)` }
  }

  return null
})

const effectClass = computed(() => ({
  'weather-effect--damage': weatherEffect.value?.type === 'damage',
  'weather-effect--immune': weatherEffect.value?.type === 'immune',
  'weather-effect--boost': weatherEffect.value?.type === 'boost',
  'weather-effect--heal': weatherEffect.value?.type === 'heal',
  'weather-effect--cure': weatherEffect.value?.type === 'cure'
}))

const weatherIcon = computed(() => {
  switch (props.weather) {
    case 'hail': return '/icons/phosphor/cloud.svg'
    case 'sandstorm': return '/icons/phosphor/wind.svg'
    case 'rain': return '/icons/phosphor/cloud.svg'
    case 'sunny': return '/icons/phosphor/sun.svg'
    default: return '/icons/phosphor/cloud.svg'
  }
})

const effectLabel = computed(() => {
  if (!weatherEffect.value) return ''
  switch (weatherEffect.value.type) {
    case 'damage':
      return weatherEffect.value.reason
        ? `${weatherEffect.value.reason} damage`
        : 'Takes weather damage'
    case 'immune':
      return `Immune: ${weatherEffect.value.reason}`
    case 'boost':
      return weatherEffect.value.reason ?? 'Weather-boosted'
    case 'heal':
      return `${weatherEffect.value.reason}: heals`
    case 'cure':
      return `${weatherEffect.value.reason}: cures status`
    default:
      return ''
  }
})
</script>

<style lang="scss" scoped>
.weather-effect-indicator {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  line-height: 1.3;
  white-space: nowrap;
}

.weather-effect-icon {
  width: 11px;
  height: 11px;
  opacity: 0.9;
}

.weather-effect-label {
  font-size: 10px;
  letter-spacing: 0.01em;
}

.weather-effect--damage {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);

  .weather-effect-icon {
    filter: brightness(0) saturate(100%) invert(70%) sepia(50%) saturate(1000%) hue-rotate(325deg);
  }
}

.weather-effect--immune {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);

  .weather-effect-icon {
    filter: brightness(0) saturate(100%) invert(60%) sepia(50%) saturate(700%) hue-rotate(200deg);
  }
}

.weather-effect--boost {
  background: rgba(234, 179, 8, 0.15);
  color: #fde68a;
  border: 1px solid rgba(234, 179, 8, 0.3);

  .weather-effect-icon {
    filter: brightness(0) saturate(100%) invert(80%) sepia(50%) saturate(700%) hue-rotate(10deg);
  }
}

.weather-effect--heal {
  background: rgba(34, 197, 94, 0.15);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.3);

  .weather-effect-icon {
    filter: brightness(0) saturate(100%) invert(70%) sepia(50%) saturate(700%) hue-rotate(100deg);
  }
}

.weather-effect--cure {
  background: rgba(168, 85, 247, 0.15);
  color: #d8b4fe;
  border: 1px solid rgba(168, 85, 247, 0.3);

  .weather-effect-icon {
    filter: brightness(0) saturate(100%) invert(60%) sepia(50%) saturate(700%) hue-rotate(250deg);
  }
}
</style>
