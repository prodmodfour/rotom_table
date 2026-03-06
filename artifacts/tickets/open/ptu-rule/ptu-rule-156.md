---
id: ptu-rule-156
title: "Fix terrain/weather recall clearing and implement send-out re-apply hook"
priority: P2
severity: MEDIUM
status: open
domain: combat
source: decree-053
created_by: decree-facilitator
created_at: 2026-03-06
affected_files:
  - app/constants/conditionSourceRules.ts
  - app/server/services/encounterService.ts
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
