---
ticket_id: refactoring-093
category: EXT-NAMING
priority: P4
severity: LOW
domain: combat
status: in-progress
source: code-review-207 M2
created_by: slave-collector (plan-20260227-153711)
created_at: 2026-02-27
---

# refactoring-093: Rename evasionCalculation.ts or relocate getEffectivenessClass

## Summary

`app/utils/evasionCalculation.ts` contains `computeTargetEvasions` (evasion-related, good fit) and `getEffectivenessClass` (type effectiveness CSS class mapping, unrelated to evasion). The file name does not reflect the second function's purpose.

## Suggested Fix

Either:
1. Move `getEffectivenessClass` to a dedicated `app/utils/typeEffectiveness.ts` utility
2. Rename the file to something broader like `combatDisplayUtils.ts`

Option 1 is preferred if more type effectiveness utilities are extracted in the future.

## Affected Files

- `app/utils/evasionCalculation.ts`
- `app/composables/useMoveCalculation.ts` (import path update)

## Impact

Low — cosmetic naming issue. No behavioral change.

## Resolution Log

- **Commit:** `28fe875` — refactor: relocate getEffectivenessClass to dedicated typeEffectiveness.ts
- **Files changed:**
  - `app/utils/typeEffectiveness.ts` (new) — contains `getEffectivenessClass` moved from evasionCalculation.ts
  - `app/utils/evasionCalculation.ts` — removed `getEffectivenessClass` (now only contains evasion-related code)
  - `app/composables/useMoveCalculation.ts` — updated import path from `evasionCalculation` to `typeEffectiveness`
