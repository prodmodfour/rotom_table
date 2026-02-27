---
ticket_id: ptu-rule-067
priority: P1
status: resolved
domain: combat
source: rules-review-067, code-review-077
created_at: 2026-02-20
created_by: orchestrator
severity: CRITICAL
affected_files:
  - app/composables/useGridMovement.ts
---

## Summary

Stuck condition implemented as speed halving instead of full movement block. Both reviewers independently flagged this as incorrect.

## PTU Rule Reference

PTU 1.05 p.231: "Stuck means you cannot Shift at all."
PTU 1.05 p.253: "A Pokemon or Trainer that is Stuck cannot make a Shift Action to move."

## Expected Behavior

Stuck combatants should have effective movement speed of 0 (cannot move at all).

## Current Behavior

`applyMovementModifiers()` in `useGridMovement.ts` halves speed for Stuck (`Math.floor(modifiedSpeed / 2)`), which is Slowed behavior, not Stuck.

## Fix

Change `modifiedSpeed = Math.floor(modifiedSpeed / 2)` for the Stuck condition to `modifiedSpeed = 0`.

## Resolution Log

- **Commit:** `8ecdb47` — Changed Stuck handler in `applyMovementModifiers()` from `Math.floor(modifiedSpeed / 2)` to `modifiedSpeed = 0`. Updated JSDoc to reference PTU 1.05 p.231.
- **Duplicate code path check:** Searched entire `app/` for all code paths applying Stuck to movement. Confirmed `applyMovementModifiers()` is the sole code path. Other Stuck references are in capture rate calculations (separate concern), status condition constants, and breather/healing logic (condition clearing, not movement).
- **Awaiting:** Code review and test verification before marking done.

### 2026-02-20 — Rules review (rules-review-072) found CRITICAL regression

**Issue:** The fix sets `modifiedSpeed = 0` for Stuck, but the function's final return line `return Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` overrides this back to 1. Any combatant with a positive base speed (all of them) will still be able to move 1 cell while Stuck. The Speed CS minimum floor of 2 (line 169) also overrides Stuck when negative Speed CS is present.

**Required fix:** The Stuck check must short-circuit with `return 0` immediately, bypassing all subsequent modifiers and the minimum speed floor. The current approach of setting `modifiedSpeed = 0` and continuing through the rest of the function is insufficient.

**PTU ref:** "Stuck means you cannot Shift at all" (core/07-combat.md, line 434). "cannot make a Shift Action to move" (line 1722). No speed floor should override this.
