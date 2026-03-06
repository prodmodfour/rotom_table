---
id: ptu-rule-156
title: "Fix terrain/weather recall clearing and implement send-out re-apply hook"
priority: P2
severity: MEDIUM
status: in-progress
domain: combat
source: decree-053
created_by: decree-facilitator
created_at: 2026-03-06
affected_files:
  - app/constants/conditionSourceRules.ts
  - app/server/services/switching.service.ts
  - app/server/api/encounters/[id]/switch.post.ts
  - app/server/api/encounters/[id]/release.post.ts
  - app/server/api/encounters/[id]/combatants.post.ts
---

## Summary

Per decree-053, terrain/weather-sourced Other conditions must clear on recall (RAW p.248), but automatically re-apply on send-out if the source is still active.

## Required Implementation

1. **Fix `SOURCE_CLEARING_RULES`** in `conditionSourceRules.ts`:
   - Change `terrain.clearsOnRecall` from `false` to `true`
   - Change `weather.clearsOnRecall` from `false` to `true`

2. **Implement send-out re-apply hook**:
   - When a Pokemon is sent out into an encounter, check for active terrain/weather/environment effects
   - If a persisting source would apply an Other condition, automatically apply it with the correct `sourceType` and `sourceLabel`
   - This prevents the GM from needing to manually re-apply conditions after a recall/switch

## Notes

- The `environment` source type already has `clearsOnRecall: false`. Per decree-053's principle, this should also be reviewed — but environment conditions may not have RAW switching text, so the current `false` may be correct. Implementer should verify.
- The send-out hook is new logic that needs design consideration for how terrain/weather effects are tracked at the encounter level.

## Resolution Log

### Environment clearsOnRecall decision
Verified against RAW: PTU p.248 has switching text only for Stuck ("may be removed by switching") and Slowed ("may be removed by switching"). No switching text exists for environment-sourced conditions in the rulebook. `environment.clearsOnRecall: false` is correct and left unchanged.

### Commits
- `a18d4662` fix: set terrain/weather clearsOnRecall to true per decree-053
  - Changed `conditionSourceRules.ts`: `terrain.clearsOnRecall` false->true, `weather.clearsOnRecall` false->true
- `e089805a` feat: add send-out re-apply hook for terrain/weather conditions
  - Added `applyTerrainWeatherConditions()` to `switching.service.ts`
  - Scans existing combatants for terrain/weather/environment-sourced Other conditions
  - Applies matching conditions with correct source metadata to newly entered Pokemon
- `db238cd5` feat: wire terrain/weather re-apply hook into switch endpoint
  - Called `applyTerrainWeatherConditions` in `switch.post.ts` after combatant creation
- `c1ee7fd8` feat: wire terrain/weather re-apply hook into release endpoint
  - Called `applyTerrainWeatherConditions` in `release.post.ts` after combatant creation
- `9f66f5a1` feat: wire terrain/weather re-apply hook into combatants endpoint
  - Called `applyTerrainWeatherConditions` in `combatants.post.ts` for mid-encounter adds

### Files changed
- `app/constants/conditionSourceRules.ts` — clearsOnRecall flags fixed
- `app/server/services/switching.service.ts` — new `applyTerrainWeatherConditions()` function
- `app/server/api/encounters/[id]/switch.post.ts` — wired re-apply hook
- `app/server/api/encounters/[id]/release.post.ts` — wired re-apply hook
- `app/server/api/encounters/[id]/combatants.post.ts` — wired re-apply hook
