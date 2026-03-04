---
ticket: refactoring-108
category: EXT-GOD
priority: P3
severity: MEDIUM
status: in-progress
source: code-review-241 H1
created_by: slave-collector (plan-20260301-115518)
created_at: 2026-03-01
---

# refactoring-108: Extract switch button computeds from CombatantCard.vue

## Summary

CombatantCard.vue exceeds the 800-line limit (841 lines) after feature-011 P1 added five switch-related computed properties (~125 lines of script logic). These should be extracted into a `useCombatantSwitchButtons` composable.

## Affected Files

- `app/components/encounter/CombatantCard.vue` (841 lines)

## Suggested Fix

1. Create `app/composables/useCombatantSwitchButtons.ts`
2. Move the five switch-related computed properties (canFaintedSwitch, canForceSwitch, showFaintedSwitchButton, showForceSwitchButton, leagueRestrictionText) into the new composable
3. Import and use the composable in CombatantCard.vue
4. Verify CombatantCard.vue is under 800 lines after extraction

## Impact

Code health — CombatantCard.vue is a high-traffic component. Extracting domain-specific logic keeps it maintainable and testable.

## Resolution Log

**Note:** The five switch-related computed properties were already moved from CombatantCard.vue to CombatantGmActions.vue in a prior extraction (commit `ceb39066` / `71058454`). This ticket extracted them from CombatantGmActions.vue into the composable instead.

- `4617242c` — Extract 5 switch button computeds (~112 lines) from `app/components/encounter/CombatantGmActions.vue` into new `app/composables/useCombatantSwitchButtons.ts`. CombatantGmActions reduced from 396 to 284 lines. CombatantCard.vue remains at 585 lines (well under 800-line limit).
