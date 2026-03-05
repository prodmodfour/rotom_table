---
id: refactoring-144
title: Update decree-001 citation comments in weather tick minimum floor
priority: P4
severity: LOW
status: open
domain: combat
source: code-review-ptu-rule-133 MED-001, rules-review-ptu-rule-133 MED-001
created_by: slave-collector (plan-1772711294)
created_at: 2026-03-05
affected_files:
  - app/utils/weatherRules.ts
  - app/server/services/weather-automation.service.ts
---

# refactoring-144: Update decree-001 citation in weather tick minimum floor

## Summary

The `Math.max(1, ...)` minimum floor for weather tick damage reduction (Permafrost ability) cites decree-001, but decree-001 covers attack damage minimum floor, not ability-based weather tick reduction. The behavior is correct but the citation is imprecise.

## Suggested Fix

Update comments in `weatherRules.ts` and `weather-automation.service.ts` to say "minimum 1 damage (extrapolated from decree-001 precedent)" instead of "per decree-001".

## Impact

LOW — Documentation accuracy only. No behavioral change.
