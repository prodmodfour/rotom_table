---
ticket_id: refactoring-067
category: CODE-HYGIENE
priority: P4
status: resolved
domain: combat
source: rules-review-115 M1
created_by: slave-collector (plan-20260221-071325)
created_at: 2026-02-21
---

# refactoring-067: Dead calculateInitiative in useCombat missing Focus bonus

## Summary

`useCombat.calculateInitiative()` (lines 66-82) does not incorporate Focus Speed bonus. The function is never called anywhere in the codebase — the actual initiative computation happens in `buildCombatantFromEntity` on the server, which does include Focus correctly. This is dead code that could cause incorrect initiative values if someone uses it in the future.

## Affected Files

- `app/composables/useCombat.ts` (lines 66-82)

## Suggested Fix

Either:
1. Add a `// NOTE: Does not include equipment bonuses — use combatant.initiative from server instead` JSDoc warning
2. Or remove the function if it remains unused after audit

## Impact

- **Low risk:** No current callers. Potential future confusion if someone reaches for this function instead of using the server-computed initiative.

## Resolution Log

- **Commit:** cb55d65
- **Files changed:** `app/composables/useCombat.ts`
- **Fix:** Removed the dead `calculateInitiative()` function (definition + export). Confirmed zero callers in the codebase -- actual initiative is computed in `buildCombatantFromEntity()` on the server side which correctly handles Focus Speed bonus and Heavy Armor default CS.
