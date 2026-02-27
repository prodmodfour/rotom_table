---
ticket_id: refactoring-088
ticket_type: refactoring
priority: P4
status: in-progress
category: EXT-ROBUSTNESS
domain: vtt-grid
source: code-review-195 MED-1
created_by: slave-collector (plan-20260227-174900)
created_at: 2026-02-27T18:10:00
affected_files:
  - app/composables/useMoveCalculation.ts
---

## Summary

`combatantsOnGrid` in `useMoveCalculation.ts` falls back to `targets.value` when `allCombatants` is not provided. This means enemy-occupied cells that are NOT valid targets of the current move won't be detected as rough terrain, potentially missing the -2 accuracy penalty.

## Current Behavior

```typescript
const combatantsOnGrid = computed((): Combatant[] => {
  return allCombatants?.value ?? targets.value
})
```

When `allCombatants` is not passed, `enemyOccupiedCells` only includes enemies that are valid targets of the current move. An enemy blocking the line-of-fire but not targetable by the move won't trigger the rough terrain penalty.

## Suggested Fix

Consider making `allCombatants` required in the composable signature, or add a warning/fallback mechanism. All callers with VTT grid data should pass the full combatant list.

## Impact

Edge case affecting accuracy calculations when `allCombatants` is not provided. Pre-existing issue, not introduced by the rough terrain fix.

## Resolution Log

- **Commit:** 35e4d04
- **Changes:**
  - Made `allCombatants` parameter required (was optional with `?`) in `useMoveCalculation()` signature (`app/composables/useMoveCalculation.ts`)
  - Removed fallback `allCombatants?.value ?? targets.value` — `combatantsOnGrid` now uses `allCombatants.value` directly
  - Updated all 11 test calls in `app/tests/unit/composables/useMoveCalculation.test.ts` to pass the required 4th argument
  - Existing caller (MoveTargetModal.vue) already passes `targetsRef` as 4th arg (which is the full `allCombatants` prop from GMActionModal) — no change needed
