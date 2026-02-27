---
ticket_id: refactoring-066
category: CODE-HYGIENE
priority: P4
status: resolved
domain: combat
source: code-review-125 M2
created_by: slave-collector (plan-20260221-071325)
created_at: 2026-02-21
---

# refactoring-066: Use calculateEvasion for initial evasion in combatant builder

## Summary

`buildCombatantFromEntity()` in `combatant.service.ts` uses `initialEvasion(stat + focusBonus)` for initial evasion values, while runtime calculations use `calculateEvasion(stat, stage, evasionBonus, statBonus)`. At combat stage 0, these are mathematically equivalent, but the semantic treatment differs: `initialEvasion` treats Focus as a base stat modifier, while `calculateEvasion` treats it as a post-stage bonus.

## Affected Files

- `app/server/services/combatant.service.ts` (lines 622-624)

## Suggested Fix

Have `buildCombatantFromEntity()` use `calculateEvasion(stat, 0, evasionBonus, statBonus)` for initial evasion values instead of `initialEvasion(stat + statBonus) + evasionBonus`. This ensures semantic consistency with the runtime calculation path.

## Impact

- **Low risk:** The stored evasion values are display/snapshot values only. Runtime calculations all use the correct `calculateEvasion()` function. If someone later introduces non-zero initial combat stages, the current code would produce incorrect initial evasion.

## Resolution Log

- **Commit:** 96d4986
- **Files changed:** `app/server/services/combatant.service.ts`
- **Fix:** Replaced `initialEvasion(stat + statBonus) + equipmentEvasionBonus` with `calculateEvasion(stat, 0, equipmentEvasionBonus, statBonus)` for all three evasion types. Added `calculateEvasion` to the import from `~/utils/damageCalculation`. Mathematically equivalent at stage 0 but semantically consistent with the runtime path.
- **Note:** `initialEvasion()` is still exported and used by `encounter-templates/[id]/load.post.ts` for template loading (different context, no equipment bonuses). Not removed to avoid scope creep.
