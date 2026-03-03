---
design_id: design-weather-001
ticket_id: feature-018
category: FEATURE
scope: FULL
domain: scenes, combat
status: validated
decree: decree-030
affected_files:
  - app/types/encounter.ts
  - app/types/combat.ts
  - app/server/api/encounters/[id]/next-turn.post.ts
  - app/server/services/status-automation.service.ts
  - app/server/services/encounter.service.ts
  - app/server/services/combatant.service.ts
  - app/server/api/encounters/[id]/weather.post.ts
  - app/utils/damageCalculation.ts
  - app/composables/useCombat.ts
  - app/stores/encounter.ts
  - app/components/gm/EncounterHeader.vue
  - app/components/encounter/CombatantPanel.vue
new_files:
  - app/utils/weatherRules.ts
  - app/server/services/weather-automation.service.ts
  - app/components/encounter/WeatherEffectIndicator.vue
---

# Design: Weather Effect Automation (feature-018)

## Tier Summary

| Tier | Sections | File |
|------|----------|------|
| P0 | A. Weather Damage at Turn Start (Hail + Sandstorm), B. Weather Immunity Rules (Type + Ability), C. Weather Damage Integration with Turn System | [spec-p0.md](spec-p0.md) |
| P1 | D. Type Damage Modifiers (Rain: Fire -5 DB / Water +5 DB; Sun: Fire +5 DB / Water -5 DB), E. Speed-Doubling Abilities (Swift Swim, Chlorophyll, Sand Rush), F. Weather Ability Healing/Damage (Rain Dish, Ice Body, Solar Power, Dry Skin, Sun Blanket, Desert Weather) | [spec-p1.md](spec-p1.md) |
| P2 | G. Weather Ball Type Change, H. Forecast (Castform) Form/Type Change, I. UI Weather Effect Indicators, J. Additional Weather Abilities (Hydration, Leaf Guard, Sand Force, Sand Veil, Snow Cloak, Thermosensitive, Flower Gift, Harvest) | [spec-p2.md](spec-p2.md) |

## Summary

Automate PTU 1.05 weather effects for combat encounters. Weather can already be set on scenes and encounters (display-only). This design adds mechanical effects: periodic HP damage from Hail/Sandstorm, type-based damage modifiers from Rain/Sun, speed-doubling abilities, weather-dependent healing/damage abilities, Weather Ball type changes, and Forecast (Castform) form changes.

### PTU Rules Reference

- **PTU pp.341-342 (10-indices-and-reference.md):** Complete weather effects table. Four weather conditions: Hail, Rain, Sandstorm, Sunny. Each with base effects and ability interactions.
- **PTU p.246 (07-combat.md):** "A Tick of Hit Points is equal to 1/10th of a Pokemon or Trainer's Maximum Hit Points." Used for Hail/Sandstorm damage.
- **PTU pp.311-335 (10-indices-and-reference.md):** Ability descriptions for all weather-related abilities (Ice Body, Snow Cloak, Rain Dish, Swift Swim, Chlorophyll, Sand Rush, Sand Force, Sand Veil, Desert Weather, Solar Power, Dry Skin, Forecast, Hydration, Leaf Guard, Thermosensitive, Sun Blanket, Flower Gift, Harvest, Snow Warning, Drizzle, Drought).
- **PTU p.338+ (10-indices-and-reference.md):** Move descriptions for Weather Ball, Sunny Day, Rain Dance, Hail, Sandstorm.

### Related Decrees

- **decree-030:** Cap significance presets at x5 per PTU RAW. Tangentially related (scenes domain) but does not directly constrain weather implementation.

### Current State

- Weather string (`sunny`, `rain`, `sandstorm`, `hail`, `snow`, `fog`, `harsh_sunlight`, `heavy_rain`, `strong_winds`) stored on both Scene and Encounter models.
- Weather can be set via `POST /api/encounters/:id/weather` with source and duration tracking.
- Weather duration auto-decrements each round via `decrementWeather()` in `next-turn.post.ts`.
- Weather is displayed in `EncounterHeader.vue` as a badge with duration counter.
- **No mechanical effects are applied.** No weather damage, no type modifiers, no ability interactions.
- Tick damage infrastructure exists for Burn/Poison/Badly Poisoned/Cursed in `status-automation.service.ts`.
- Damage calculation in `damageCalculation.ts` does not consider weather.

### IMPORTANT: Tick Damage Correction

The ticket specifies "1/16 HP" for weather damage. This is **incorrect** per PTU RAW. The rulebook states:

> "all non-Ice Type Pokemon lose a **Tick of Hit Points** at the beginning of their turn" (p.341)

> "A Tick of Hit Points is equal to **1/10th** of a Pokemon or Trainer's Maximum Hit Points" (p.246)

Weather damage is **1/10th max HP** (a Tick), NOT 1/16th. The existing `calculateTickDamage()` function in `status-automation.service.ts` correctly implements this as `Math.max(1, Math.floor(maxHp / 10))`.

---

## Priority Map

| # | Feature | Current Status | Gap | Priority |
|---|---------|---------------|-----|----------|
| A | Hail weather damage (1 tick at turn start) | NOT_IMPLEMENTED | Weather is display-only | **P0** |
| B | Sandstorm weather damage (1 tick at turn start) | NOT_IMPLEMENTED | Weather is display-only | **P0** |
| C | Hail type immunity (Ice-type exempt) | NOT_IMPLEMENTED | No type checking for weather | **P0** |
| D | Sandstorm type immunity (Ground/Rock/Steel exempt) | NOT_IMPLEMENTED | No type checking for weather | **P0** |
| E | Hail ability immunity (Ice Body, Snow Cloak) | NOT_IMPLEMENTED | No ability checking for weather | **P0** |
| F | Sandstorm ability immunity (Sand Veil, Sand Rush, Sand Force, Desert Weather) | NOT_IMPLEMENTED | No ability checking for weather | **P0** |
| G | Rain type modifiers (Fire -5 DB, Water +5 DB) | NOT_IMPLEMENTED | Damage calc ignores weather | **P1** |
| H | Sun type modifiers (Fire +5 DB, Water -5 DB) | NOT_IMPLEMENTED | Damage calc ignores weather | **P1** |
| I | Swift Swim (+4 Speed CS in Rain) | NOT_IMPLEMENTED | No ability-weather interaction | **P1** |
| J | Chlorophyll (+4 Speed CS in Sun) | NOT_IMPLEMENTED | No ability-weather interaction | **P1** |
| K | Sand Rush (+4 Speed CS in Sandstorm) | NOT_IMPLEMENTED | No ability-weather interaction | **P1** |
| L | Rain Dish (1 tick HP at turn start in Rain) | NOT_IMPLEMENTED | No ability-weather interaction | **P1** |
| M | Ice Body (1 tick HP at turn start in Hail) | NOT_IMPLEMENTED | No ability-weather interaction | **P1** |
| N | Solar Power (+2 SpAtk CS, lose 1/16 max HP in Sun) | NOT_IMPLEMENTED | No ability-weather interaction | **P1** |
| O | Dry Skin (1 tick HP in Rain; lose 1 tick in Sun) | NOT_IMPLEMENTED | No ability-weather interaction | **P1** |
| P | Sun Blanket (1 tick HP, +1 Fire resistance in Sun) | NOT_IMPLEMENTED | No ability-weather interaction | **P1** |
| Q | Desert Weather (immune Sandstorm, resist Fire in Sun, heal in Rain) | NOT_IMPLEMENTED | No ability-weather interaction | **P1** |
| R | Weather Ball type change | NOT_IMPLEMENTED | Move type is static | **P2** |
| S | Forecast (Castform) type change | NOT_IMPLEMENTED | Pokemon type is static in combat | **P2** |
| T | UI weather effect indicators | NOT_IMPLEMENTED | No visual indicator of weather effects | **P2** |
| U | Hydration (cure status in Rain) | NOT_IMPLEMENTED | No ability-weather interaction | **P2** |
| V | Leaf Guard (cure status in Sun) | NOT_IMPLEMENTED | No ability-weather interaction | **P2** |
| W | Sand Force (+5 damage to Ground/Rock/Steel in Sandstorm) | NOT_IMPLEMENTED | No ability-weather interaction | **P2** |
| X | Snow Cloak (+2 Evasion in Hail, adjacent allies immune) | NOT_IMPLEMENTED | No ability-weather interaction | **P2** |
| Y | Sand Veil (+2 Evasion in Sandstorm, adjacent allies immune) | NOT_IMPLEMENTED | No ability-weather interaction | **P2** |
| Z | Thermosensitive (+2 Atk/SpAtk CS in Sun; halved movement in Hail) | NOT_IMPLEMENTED | No ability-weather interaction | **P2** |
| AA | Flower Gift (Burst 4 +2 CS distribution in Sun) | NOT_IMPLEMENTED | No ability-weather interaction | **P2** |
| AB | Harvest (Digestion Buff auto-retain in Sun) | NOT_IMPLEMENTED | No ability-weather interaction | **P2** |

---

## Atomized Files

- [_index.md](_index.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [shared-specs.md](shared-specs.md)
- [testing-strategy.md](testing-strategy.md)
