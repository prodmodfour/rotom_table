---
ticket_id: refactoring-120
category: EXT-GOD
priority: P3
severity: MEDIUM
status: resolved
domain: combat
source: code-review-273 HIGH-003
created_by: slave-collector (plan-20260302-110035)
created_at: 2026-03-02
---

# refactoring-120: Extract intercept logic from out-of-turn.service.ts (1361 lines)

## Summary

`app/server/services/out-of-turn.service.ts` grew from 728 lines (pre-P2) to 1361 lines after the feature-016 P2 implementation (Intercept Melee, Intercept Ranged, Disengage). This is nearly double the 800-line project limit.

The P2 additions (~633 lines) are logically separable from the existing P0 (AoO) and P1 (Hold/Priority/Interrupt framework) code.

## Affected Files

- `app/server/services/out-of-turn.service.ts` (1361 lines)

## Suggested Fix

Extract P2 Intercept logic into `app/server/services/intercept.service.ts`. Move:

- `InterceptMeleeDetectionParams`, `InterceptRangedDetectionParams` (types)
- `canIntercept`, `checkInterceptLoyalty`, `canInterceptMove` (eligibility)
- `detectInterceptMelee`, `detectInterceptRanged` (detection)
- `calculatePushDirection` (geometry helper)
- `resolveInterceptMelee`, `resolveInterceptRanged` (resolution)
- `getCombatantSpeed`, `isAllyCombatant`, `getDisplayName` (shared helpers -- export from service or shared utils)

The `out-of-turn.service.ts` retains P0 (AoO) and P1 (Hold/Priority/Interrupt) logic. The intercept service imports shared types and helpers.

## Impact

- File exceeds 800-line limit by 70% (1361/800)
- Reduces discoverability -- intercept logic is buried in a service handling 4 different concerns (AoO, Hold/Priority, Interrupt, Intercept)
- Makes the feature-016 fix cycle harder to navigate
- Structural blocker: future P3/P4 out-of-turn additions will push the file even further past limits

## Related

- refactoring-117: Extract out-of-turn actions from encounter.ts store (separate concern -- store layer, not service layer)
- refactoring-113: Wire or remove autoDeclineFaintedReactor (same service file)
