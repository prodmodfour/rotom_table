---
ticket_id: refactoring-077
category: EXT-COSMETIC
priority: P4
status: resolved
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

## Resolution Log

- **Commit:** 49d2d15 — `refactor: move terrain cost type aliases to shared types/vtt.ts`
- **Files changed:**
  - `app/types/vtt.ts` (new) — canonical home for TerrainCostGetter, ElevationCostGetter, TerrainElevationGetter
  - `app/types/index.ts` — added re-export of vtt.ts
  - `app/composables/usePathfinding.ts` — imports from ~/types, removed local type definitions
  - `app/composables/useRangeParser.ts` — imports from ~/types, kept backwards-compat re-exports
  - `app/composables/useGridMovement.ts` — imports from ~/types instead of composables
