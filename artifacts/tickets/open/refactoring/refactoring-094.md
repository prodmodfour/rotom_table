---
ticket_id: refactoring-094
title: "Remove trivial combatantsOnGrid passthrough in useMoveCalculation"
severity: LOW
priority: P4
domain: combat
source: code-review-209 (MED-1)
created_by: slave-collector (plan-20260227-162300)
created_at: 2026-02-27
---

## Summary

After refactoring-088 made `allCombatants` required, the `combatantsOnGrid` computed in `useMoveCalculation.ts` (lines 111-113) became a trivial passthrough:

```ts
const combatantsOnGrid = computed(() => allCombatants.value)
```

It is used in exactly one place (`enemyOccupiedCells`, line 119). The named computed adds a layer of indirection without abstraction value.

## Affected Files

- `app/composables/useMoveCalculation.ts` (lines 111-113, 119)

## Suggested Fix

Replace `combatantsOnGrid` usage with `allCombatants.value` directly, or rename to clarify intent if the indirection is preserved for readability.

## Impact

Code clarity only. No behavioral change.
