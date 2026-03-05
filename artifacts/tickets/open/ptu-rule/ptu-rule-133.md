---
ticket_id: ptu-rule-133
title: "Permafrost ability weather damage reduction not handled"
priority: P4
severity: LOW
status: in-progress
domain: scenes
source: rules-review-275 MED-001
created_by: slave-collector (plan-20260303-150824)
created_at: 2026-03-03
affected_files:
  - app/utils/weatherRules.ts
  - app/server/services/weather-automation.service.ts
---

# ptu-rule-133: Permafrost ability weather damage reduction not handled

## Summary

The Permafrost ability reduces weather tick damage by 5 HP instead of granting full immunity. The current weather automation system (feature-018 P0) only handles full immunity abilities and has no mechanism for partial damage reduction.

## PTU Reference

PTU 10-indices-and-reference.md, p.1993-1997, Ability: Permafrost:
> "whenever the user would lose a Tick of Hit Points due to an effect such as Sandstorm or the Burn Status condition, subtract 5 from the amount of Hit Points lost. Defensive."

## Problem

`weatherRules.ts` classifies abilities as either fully immune or not. Permafrost does not make the user immune — it reduces the tick damage by 5. The current tick calculation pipeline (`calculateTickDamage()` → `calculateDamage()`) has no hook for ability-based damage reduction before application.

## Required Implementation

1. Add a `WEATHER_DAMAGE_REDUCTION_ABILITIES` constant (or similar) mapping ability names to reduction amounts: `{ 'Permafrost': 5 }`
2. In `weather-automation.service.ts`, after computing tick damage but before applying it, check for damage reduction abilities and subtract the reduction amount (minimum 1 per decree-001)
3. Only affects the Aurorus evolutionary line (Permafrost ability)

## Impact

Low practical impact — Permafrost is limited to the Aurorus line. However, the ability text explicitly mentions Sandstorm by name, so it's a known PTU mechanic gap. Suitable for P1/P2 weather tier.

## Resolution Log

- `6f633769` — `app/utils/weatherRules.ts`: Added `WEATHER_DAMAGE_REDUCTION_ABILITIES` constant (`{ 'Permafrost': 5 }`) and `getWeatherDamageReduction()` helper function. Removed stale TODO comment.
- `f72d9e49` — `app/server/services/weather-automation.service.ts`: In `getWeatherTickForCombatant()`, after computing raw tick damage, check for reduction abilities via `getWeatherDamageReduction()`. Subtract reduction amount with `Math.max(1, ...)` floor per decree-001. Formula string shows full breakdown.

**Note:** Permafrost PTU text also mentions Burn status condition reduction. Status tick damage reduction (in `status-automation.service.ts`) is out of scope for this ticket — weather damage path only.
