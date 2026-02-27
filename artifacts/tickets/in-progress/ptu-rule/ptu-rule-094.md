---
id: ptu-rule-094
title: Natural healing minimum 1 HP contradicts PTU for low-HP entities
priority: P4
severity: LOW
status: in-progress
domain: healing
source: healing-audit.md (R007)
created_by: slave-collector (plan-20260226-175938)
created_at: 2026-02-26
---

# ptu-rule-094: Natural healing minimum 1 HP contradicts PTU for low-HP entities

## Summary

The code uses `Math.max(1, Math.floor(maxHp / 16))`, enforcing a minimum of 1 HP healed per rest period. PTU says "heal 1/16th of their Maximum Hit Points" with floor rounding, which means entities with maxHp < 16 should heal 0 HP per rest.

## Affected Files

- `app/utils/restHealing.ts`

## PTU Rule Reference

"Heal 1/16th of their Maximum Hit Points" — floor rounding, no minimum specified.

## Suggested Fix

Either remove the `Math.max(1, ...)` to follow PTU strictly, or keep it as intentional QoL and add a comment documenting the deviation. May warrant a decree-need if the group wants to decide formally.

## Impact

Affects level-1 Pokemon with low base HP (maxHp < 16). Generous deviation favoring players.

## Resolution Log

- **Commit:** `ac5b40b` — fix: remove minimum 1 HP from natural healing per PTU rules
- **Files changed:**
  - `app/utils/restHealing.ts` — removed `Math.max(1, ...)` from `calculateRestHealing()` (line 65) and `getRestHealingInfo()` (line 173)
  - `app/tests/unit/utils/restHealing.test.ts` — updated test to expect 0 HP for low-HP entities
- **Approach:** Strict PTU compliance. `Math.floor(maxHp / 16)` with no minimum.
