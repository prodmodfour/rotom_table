---
id: refactoring-142
title: Add unit tests for computeEquipmentBonuses including conditionalSpeedPenalties
priority: P4
severity: LOW
status: open
domain: combat
source: code-review-ptu-rule-126 MEDIUM-01
created_by: slave-collector (plan-1772711294)
created_at: 2026-03-05
affected_files:
  - app/tests/unit/utils/equipmentBonuses.test.ts
---

# refactoring-142: Add unit tests for computeEquipmentBonuses

## Summary

The `computeEquipmentBonuses()` utility function (used by combatant builder) has zero direct test coverage, including the new `conditionalSpeedPenalties` aggregation path added by ptu-rule-126 (Snow Boots).

## Suggested Fix

Create `app/tests/unit/utils/equipmentBonuses.test.ts` covering:
- Base equipment bonus computation
- `conditionalSpeedPenalties` aggregation from multiple equipped items
- Snow Boots -2 Overland penalty in Snow/Hail weather

## Impact

LOW — Testing gap, not a bug. The function is exercised through integration paths but has no isolated tests.
