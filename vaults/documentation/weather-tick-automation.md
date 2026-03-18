# Weather Tick Automation

Weather tick damage and ability effects at turn boundaries.

**Service:** `server/services/weather-automation.service.ts`.

**Functions:**

- `getWeatherTickForCombatant` — Hail and Sandstorm damage at turn start, using [[weather-rules-utility]] for immunity checks.
- `getWeatherAbilityEffects` — ability-triggered effects keyed to weather and timing:
  - *Turn start:* Ice Body, Rain Dish, Sun Blanket (heal); Solar Power (damage).
  - *Turn end:* Dry Skin (heal in Rain, damage in Sun); Desert Weather (heal in Sandstorm).

**Types:** `WeatherTickResult`, `WeatherAbilityResult`.

**Integration:** Fires in `next-turn.post.ts`. Uses [[status-tick-automation|status-automation.service.ts]] for tick calculation.

Part of [[turn-lifecycle]].
