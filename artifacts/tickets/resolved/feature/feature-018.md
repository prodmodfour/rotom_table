---
id: feature-018
title: Weather Effect Automation
priority: P2
severity: MEDIUM
status: in-progress
domain: scenes
source: matrix-gap (Scenes SG-1)
matrix_source: scenes R011, R012, R013, R014, R015
created_by: master-planner
created_at: 2026-02-28
---

# feature-018: Weather Effect Automation

## Summary

Weather can be set on scenes but is display-only. No weather damage, no type damage modifiers, no ability interactions. 5 matrix rules classified as Missing.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R011 | Hail Weather Effects | Missing — no auto weather damage |
| R012 | Rainy Weather Effects | Missing — no fire -5/water +5, no Swift Swim/Rain Dish |
| R013 | Sandstorm Weather Effects | Missing — no auto damage to non-Ground/Rock/Steel |
| R014 | Sunny Weather Effects | Missing — no fire +5/water -5, no Chlorophyll |
| R015 | Weather-Dependent Ability Interactions | Missing — no Forecast/Weather Ball type change |

## PTU Rules

- Chapter 7/10: Weather effects
- Hail/Sandstorm: 1/10 max HP damage (1 Tick) at turn start (with type immunities)
- Rain: Fire -5 DB, Water +5 DB, Swift Swim doubles speed
- Sun: Fire +5 DB, Water -5 DB, Chlorophyll doubles speed
- Weather Ball changes type based on active weather
- Forecast (Castform) changes form based on weather

## Implementation Scope

FULL-scope feature requiring design spec. Affects damage calculation, turn end processing, and ability system.

## Resolution Log

- **2026-03-03**: Design spec created at `artifacts/designs/design-weather-001/`
  - `_index.md` — Design metadata, tier summary, priority map, affected/new files
  - `spec-p0.md` — Weather damage at turn start (Hail/Sandstorm) with type and ability immunities
  - `spec-p1.md` — Type damage modifiers (Rain/Sun DB changes), speed abilities, weather healing/damage
  - `spec-p2.md` — Weather Ball type change, Forecast type change, UI indicators, additional abilities
  - `shared-specs.md` — Weather type enum, damage formulas, ability interaction matrix, data flow, constants
  - `testing-strategy.md` — Unit tests, integration tests, manual testing checklist for all tiers
- **CORRECTION**: PTU weather damage is 1 Tick (1/10th max HP), NOT 1/16th as stated in the ticket. Verified against PTU p.246 and p.341.
- **2026-03-03 P0 Implementation** (branch: `slave/3-dev-feature-018-p0-20260303-131425`):
  - `adb21288` — `app/utils/weatherRules.ts` (NEW): Pure functions for weather type/ability immunity checks
  - `8283f207` — `app/server/services/weather-automation.service.ts` (NEW): Weather tick calculation service
  - `05e8d8b3` — `app/server/api/encounters/[id]/next-turn.post.ts` (EDIT): Weather tick at turn start, move log, WebSocket broadcast
- **2026-03-03 P0 Fix Cycle** (code-review-302 + rules-review-275, branch: `slave/1-dev-feature-018-20260303-165227`):
  - `d0dc47fb` — `app/utils/weatherRules.ts` (EDIT): Add Magic Guard + Sand Stream to immunity lists, fainted ally check, token-size comment, Permafrost tracking note
  - `74930b05` — `app/server/utils/turn-helpers.ts` (NEW) + `next-turn.post.ts` (EDIT): Extract 7 helper functions to reduce next-turn.post.ts from 857→655 lines
  - `d84459e4` — `app-surface.md` (EDIT) + `feature-018.md` (EDIT): Add new files to surface map, fix 1/16→1/10 ticket text
- **2026-03-03 P1 Implementation** (branch: `slave/2-dev-feature-018-p1-20260303-191515`):
  - **Section D: Type Damage Modifiers**
    - `c5dd2c9e` — `app/utils/damageCalculation.ts` (EDIT): Add weather field to DamageCalcInput, getWeatherDamageModifier(), apply as Step 1.5 (before STAB), weatherModifier in breakdown
    - `c5dd2c9e` — `app/server/api/encounters/[id]/calculate-damage.post.ts` (EDIT): Pass encounter weather to calculateDamage
  - **Section E: Speed-Doubling Abilities + Solar Power CS**
    - `d7291941` — `app/utils/weatherRules.ts` (EDIT): Add WEATHER_CS_ABILITIES constant, getWeatherCSBonuses()
    - `9f262619` — `app/server/api/encounters/[id]/weather.post.ts` (EDIT): Apply/reverse weather CS bonuses on combatants when weather set/changed (decree-005 stageSources)
    - `4b3ab6bf` — `app/server/utils/turn-helpers.ts` (EDIT): Add reverseWeatherCSBonuses() for weather expiry
    - `4b3ab6bf` — `app/server/api/encounters/[id]/next-turn.post.ts` (EDIT): Reverse weather CS on weather expiry
  - **Section F: Weather Ability Healing/Damage**
    - `c1aebb1f` — `app/server/services/weather-automation.service.ts` (EDIT): Add WEATHER_ABILITY_EFFECTS, getWeatherAbilityEffects() for turn start/end
    - `5a6e5ab7` — `app/server/utils/turn-helpers.ts` (EDIT): Add applyWeatherAbilityEffects() helper
    - `5a6e5ab7` — `app/server/api/encounters/[id]/next-turn.post.ts` (EDIT): Turn-end and turn-start weather ability effects
- **2026-03-04 P1 Fix Cycle** (code-review-310, branch: `slave/1-dev-feature-018-fix-20260304`):
  - **CRITICAL-001**: Client-side weather DB modifier missing in useMoveCalculation.ts
    - `ca59d3b9` — `app/composables/useMoveCalculation.ts` (EDIT): Import getWeatherDamageModifier, read weather from encounterStore, apply +/-5 DB modifier before STAB in effectiveDB computed
  - **HIGH-001**: WebSocket broadcast for weather ability effects sent hardcoded newHp:0 and fainted:false
    - `64a039a0` — `app/server/services/weather-automation.service.ts` (EDIT): Add newHp and fainted fields to WeatherAbilityResult interface
    - `07d0d701` — `app/server/utils/turn-helpers.ts` (EDIT): Populate newHp and fainted after applying heal/damage in applyWeatherAbilityEffects
    - `07d0d701` — `app/server/api/encounters/[id]/next-turn.post.ts` (EDIT): Use result.newHp and result.fainted in WebSocket broadcast instead of hardcoded values
  - **MEDIUM-001**: Desert Weather Sun fire resistance deferred to P2
    - `60ad567f` — `artifacts/designs/design-weather-001/shared-specs.md` (EDIT): Update tier annotation for Desert Weather Sun fire resistance from P1 to P2
- **2026-03-04 P2 Implementation** (branch: `slave/1-dev-feature-018-p2-20260304-085746`):
  - **Section G: Weather Ball**
    - `2c19d0c8` — `app/utils/weatherRules.ts` (EDIT): Add getWeatherBallEffect() for dynamic type/DB mapping
    - `dbfd9303` — `app/server/api/encounters/[id]/calculate-damage.post.ts` (EDIT): Override moveType/DB for Weather Ball based on weather
    - `aafe5512` — `app/composables/useMoveCalculation.ts` (EDIT): Client-side Weather Ball effective type/DB for STAB and damage calcs
  - **Section H: Forecast (Castform)**
    - `f61a7171` — `app/types/encounter.ts` (EDIT): Add forecastOriginalTypes to Combatant interface
    - `2c19d0c8` — `app/utils/weatherRules.ts` (EDIT): Add getForecastType() for weather-to-type mapping
    - `546fcfb3` — `app/server/api/encounters/[id]/weather.post.ts` (EDIT): Apply Forecast type changes when weather set/cleared
    - `67caef24` — `app/server/utils/turn-helpers.ts` (EDIT): Add reverseForecastTypeChanges() for weather expiry
    - `67caef24` — `app/server/api/encounters/[id]/next-turn.post.ts` (EDIT): Reverse Forecast on weather expiry
  - **Section I: UI Indicators**
    - `778bc79d` — `app/components/encounter/WeatherEffectIndicator.vue` (NEW): Per-combatant weather effect display
    - `778bc79d` — `app/components/encounter/CombatantCard.vue` (EDIT): Integrate WeatherEffectIndicator
    - `00b78ab5` — `app/components/gm/EncounterHeader.vue` (EDIT): Enhanced weather tooltip with effect summary
  - **Section J: Additional Abilities**
    - `37ba58f9` — `app/server/api/encounters/[id]/next-turn.post.ts` (EDIT): Hydration (Rain) and Leaf Guard (Sun) status cure at turn end
    - `dbfd9303` — `app/server/api/encounters/[id]/calculate-damage.post.ts` (EDIT): Sand Force +5 damage for Ground/Rock/Steel in Sandstorm
    - `5560c70d` — `app/utils/damageCalculation.ts` (EDIT): Add abilityDamageBonus field to DamageCalcInput and formula (Step 7.5)
    - `546fcfb3` — `app/server/api/encounters/[id]/weather.post.ts` (EDIT): Snow Cloak +2 evasion in Hail, Sand Veil +2 evasion in Sandstorm (decree-005 tracked)
    - `2c19d0c8` — `app/utils/weatherRules.ts` (EDIT): Thermosensitive +2 Atk/SpAtk CS in Sun, WEATHER_EVASION_ABILITIES, WEATHER_STATUS_CURE_ABILITIES
    - `0c07439f` — `app/utils/movementModifiers.ts` (EDIT): Thermosensitive halved movement in Hail
    - `0c07439f` — `app/composables/useGridMovement.ts` (EDIT): Pass weather to applyMovementModifiers for Thermosensitive
  - **Deferred**: Flower Gift (UI indicator only, manual CS — shown in WeatherEffectIndicator), Harvest (no berry system)
- **2026-03-04 P2 Fix Cycle** (code-review-317, branch: `slave/1-dev-feature-018-p2-fix-20260304-104014`):
  - **HIGH-001**: Server-side movement modifier calls missing weather parameter
    - `058851d4` — `app/server/utils/turn-helpers.ts` (EDIT): Add weather param to resetCombatantsForNewRound, pass to applyMovementModifiers
    - `058851d4` — `app/server/services/mounting.service.ts` (EDIT): Add weather param to executeMount and resetMountMovement, pass to applyMovementModifiers
    - `058851d4` — `app/server/api/encounters/[id]/next-turn.post.ts` (EDIT): Pass weather to all 5 resetCombatantsForNewRound calls
    - `058851d4` — `app/server/api/encounters/[id]/mount.post.ts` (EDIT): Pass record.weather to executeMount
  - **MEDIUM-001**: Sand Force min-1 clamp ordering divergence
    - `e3a785f6` — `app/utils/damageCalculation.ts` (EDIT): Move abilityDamageBonus before Math.max(1, ...) so bonus is included in clamp
  - **MEDIUM-003**: WeatherEffectIndicator imports server-only service
    - `c24c4c30` — `app/utils/weatherRules.ts` (EDIT): Add WEATHER_ABILITY_EFFECTS constant and WeatherAbilityEffect interface
    - `c24c4c30` — `app/server/services/weather-automation.service.ts` (EDIT): Re-export from weatherRules.ts instead of defining locally
    - `c24c4c30` — `app/components/encounter/WeatherEffectIndicator.vue` (EDIT): Import from weatherRules.ts instead of server service
  - **MEDIUM-002**: app-surface.md missing P2 additions
    - `7458d79e` — `.claude/skills/references/app-surface.md` (EDIT): Add P2 weatherRules.ts functions, movementModifiers.ts, WeatherEffectIndicator
