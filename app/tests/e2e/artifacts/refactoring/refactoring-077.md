---
ticket_id: refactoring-077
category: EXT-COSMETIC
priority: P4
status: open
source: code-review-151 M2 note
created_by: slave-collector (plan-20260224-162105)
created_at: 2026-02-24T17:00:00Z
---

# refactoring-077: Move TerrainCostGetter type to shared types file

## Summary

`usePathfinding.ts` imports `type TerrainCostGetter` from `useRangeParser.ts`, while `useRangeParser.ts` imports functions from `usePathfinding.ts`. This creates a circular dependency that is compile-time only (type imports are erased) but is a code smell. The type should live in a shared location.

## Affected Files

- `app/composables/usePathfinding.ts` (import from shared types instead of useRangeParser)
- `app/composables/useRangeParser.ts` (export type from shared location)
- `app/types/vtt.ts` or similar (new home for TerrainCostGetter, ElevationCostGetter, TerrainElevationGetter)

## Suggested Fix

Move `TerrainCostGetter`, `ElevationCostGetter`, and `TerrainElevationGetter` type aliases to `app/types/vtt.ts`. Update imports in both `usePathfinding.ts` and `useRangeParser.ts`.

## Impact

- **Code health:** Cosmetic — eliminates circular import, no runtime effect
- **Testability:** No changes
- **Extensibility:** Cleaner dependency graph for future VTT composables
