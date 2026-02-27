---
id: refactoring-086
title: Extract damage application section from useMoveCalculation composable
priority: P4
severity: LOW
status: in-progress
domain: combat
category: EXT-GOD
source: code-review-189 MED-1, code-review-191 M1
created_by: slave-collector (plan-20260227-161023)
created_at: 2026-02-27
---

## Summary

`app/composables/useMoveCalculation.ts` is 801 lines, exceeding the 800-line project maximum. The file is well-organized but should be split to stay within limits.

## Suggested Fix

Extract the damage application block (lines ~494-665, ~170 lines) into a separate composable `useDamageApplication.ts`. Alternatively, extract `computeTargetEvasions` helper (lines ~341-410, ~70 lines) into a utility function. Either extraction brings the file well under 800 lines.

## Affected Files

- `app/composables/useMoveCalculation.ts` (801 lines)

## Impact

Code health only. No functional change. Prevents file bloat as more combat features are added.

## Resolution Log

- **ecac8e7** — `refactor: extract computeTargetEvasions and getEffectivenessClass into utility`
  - Created `app/utils/evasionCalculation.ts` (92 lines): `computeTargetEvasions()` with `EvasionDependencies` interface, `getEffectivenessClass()` pure utility
  - Updated `app/composables/useMoveCalculation.ts`: removed inline implementations, imports from new utility, passes deps via interface
  - Result: 820 lines -> 764 lines (56 lines under the 800-line limit)
