---
ticket_id: ptu-rule-072
priority: P1
status: resolved
domain: combat
source: code-review-082
created_at: 2026-02-20
created_by: senior-reviewer
severity: CRITICAL
affected_files:
  - app/composables/useGridMovement.ts
---

## Summary

Stuck condition (speed=0) is bypassed by downstream modifiers in `applyMovementModifiers()`. Speed Combat Stage, Sprint, and the minimum-speed floor can all raise a Stuck combatant's speed above 0, allowing movement that PTU rules explicitly forbid.

## PTU Rule Reference

PTU 1.05 p.231: "Stuck means you cannot Shift at all."
PTU 1.05 p.253: "A Pokemon or Trainer that is Stuck cannot make a Shift Action to move."

## Expected Behavior

A Stuck combatant should have effective movement speed of 0 regardless of any other modifiers (Speed CS, Sprint, etc.).

## Current Behavior

`applyMovementModifiers()` sets `modifiedSpeed = 0` for Stuck but does NOT return early. Three subsequent code paths can raise it above 0:

1. **Speed CS (negative):** `stageBonus < 0` triggers `Math.max(modifiedSpeed, 2)` which sets speed to 2.
2. **Speed CS (positive):** `modifiedSpeed = 0 + stageBonus` gives positive speed.
3. **Minimum floor (line 180):** `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` uses the original `speed` parameter, so any combatant with base speed > 0 gets at least 1.

## Reproduction

Any Stuck combatant with non-zero Speed CS or Sprint active can move on the VTT grid.

## Fix

Change `modifiedSpeed = 0` to `return 0` for the Stuck condition handler. This early-exits before any other modifier can override it.

```typescript
// Current (buggy):
if (conditions.includes('Stuck')) {
  modifiedSpeed = 0
}

// Fix:
if (conditions.includes('Stuck')) {
  return 0
}
```

## Resolution Log

- **Commit:** `072f167` — Changed `modifiedSpeed = 0` to `return 0` in the Stuck condition handler within `applyMovementModifiers()`. The early-return prevents all downstream modifiers (Speed CS, Sprint, minimum floor) from overriding the Stuck speed of 0.
- **Refactor:** Extracted `applyMovementModifiers` from the `useGridMovement` composable closure to a top-level exported pure function for direct unit testing.
- **Tests:** Added 38 unit tests in `app/tests/unit/composables/useGridMovement.test.ts` covering Stuck early-return (6 cases including Stuck+Sprint, Stuck+CS+6, Stuck+CS-6 interactions), confirming all return 0.
- **Awaiting:** Code review and test verification before marking done.
