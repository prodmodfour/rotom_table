---
id: ptu-rule-159
title: "Pain Split marker injury deferral not implemented"
priority: P4
severity: LOW
status: open
domain: combat
source: rules-review-317 INFO-001
created_by: slave-collector (plan-1772793388)
created_at: 2026-03-06
affected_files:
  - app/server/services/combatant.service.ts
---

## Summary

Marker injuries fire immediately during `calculateDamage` instead of being deferred until Pain Split's full effect resolves, per PTU p.400.

## Problem

Pain Split equalizes HP between two targets. When HP loss causes a combatant to cross injury thresholds, the marker injuries should be evaluated after the full Pain Split effect resolves (both targets adjusted), not during the intermediate calculation step. Currently, injuries trigger immediately as HP changes, which could produce incorrect injury counts if the final HP after Pain Split differs from the intermediate value.

## Suggested Fix

Requires a Pain Split-specific implementation that defers injury evaluation. The HP-loss pathway (hpLoss type) already bypasses massive damage, but does not defer marker injury checks.

## Impact

- Edge case: only affects Pain Split interactions
- Low priority — Pain Split is uncommon in typical play
