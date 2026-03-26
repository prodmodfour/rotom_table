# Weather Rules Utility

Shared weather effect logic in `utils/weatherRules.ts`, used by both server and client for immunity checks, combat stage bonuses, evasion bonuses, and ability-triggered effects.

**Type:** `PtuWeather` — union of recognized PTR 1.05 weather conditions.

**Functions:** isDamagingWeather, isPtuWeather, isImmuneToHail, isImmuneToSandstorm, isImmuneToWeatherDamage, getCombatantTypes, getCombatantAbilities, getWeatherCSBonuses, getWeatherEvasionBonuses, getWeatherBallEffect, getForecastType, getSandForceDamageBonus.

**Constants:** HAIL_IMMUNE_TYPES, SANDSTORM_IMMUNE_TYPES, HAIL_IMMUNE_ABILITIES, SANDSTORM_IMMUNE_ABILITIES, HAIL_ADJACENT_PROTECTION, SANDSTORM_ADJACENT_PROTECTION, WEATHER_CS_ABILITIES, WEATHER_EVASION_ABILITIES, WEATHER_STATUS_CURE_ABILITIES, WEATHER_ABILITY_EFFECTS, SAND_FORCE_TYPES, CURABLE_PERSISTENT_STATUSES.

**Interface:** `WeatherAbilityEffect` — describes an ability's interaction with a specific weather condition.

## See also

- [[weather-tick-automation]]
- [[type-status-immunity-utility]]
