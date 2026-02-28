---
ticket_id: refactoring-099
category: EXT-GOD
priority: P4
severity: LOW
status: open
source: code-review-225 M3
created_by: slave-collector (plan-20260228-221811)
created_at: 2026-02-28
---

# refactoring-099: Extract XP actions from encounter.ts store (806 lines)

## Summary

The encounter store (`app/stores/encounter.ts`) is at 806 lines, exceeding the project convention of 800 lines max. The feature-012 implementation added ~17 lines for the `applyDamage` return type change, pushing it over the limit.

## Affected Files

- `app/stores/encounter.ts` (806 lines)

## Suggested Fix

Extract the XP-related actions (lines 731-803: `distributeXp`, `addExperience`, `applyLevelUp`, and related helpers) into a separate `useEncounterXp` composable or dedicated store. This is a natural extraction boundary since XP logic is self-contained.

## Impact

Code health — file size convention enforcement. No functional impact.
