---
id: refactoring-072
category: EXT-TYPE-SAFETY
priority: P4
status: open
source: code-review-141 M1
created_by: slave-collector (plan-20260223-085530)
created_at: 2026-02-23
---

# refactoring-072: Replace `tier: string` with `tier: SignificanceTier` in store/composable signatures

## Summary

The `setSignificance`, `createEncounter`, `createFromScene`, and `createWildEncounter` store actions accept `tier: string` and use `as any` casts when assigning to the typed `Encounter` interface. The `SignificanceTier` union type already exists in `encounterBudget.ts` but is not used in these function signatures.

## Affected Files

- `app/stores/encounter.ts` — `setSignificance`, `createEncounter`, `createFromScene` actions
- `app/composables/useEncounterCreation.ts` — `createWildEncounter` parameter type

## Suggested Fix

1. Change `tier: string` to `tier: SignificanceTier` in all 4 function signatures
2. Import `SignificanceTier` from `~/utils/encounterBudget` where needed
3. Remove the `as any` cast in `setSignificance` (line 656)

## Impact

Type papercut — no runtime bug. All callers already pass valid `SignificanceTier` values from `SIGNIFICANCE_PRESETS`. The `as any` sets a bad precedent and defeats TypeScript's purpose.
