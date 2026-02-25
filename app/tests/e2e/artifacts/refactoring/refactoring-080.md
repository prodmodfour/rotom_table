---
ticket_id: refactoring-080
priority: P4
category: EXT-DUPLICATE
status: open
domain: vtt-grid
source: code-review-161 M1
created_by: slave-collector (plan-20260225-032831)
created_at: 2026-02-25
---

# refactoring-080: Extract shared ptuDiagonalDistance utility

## Summary

The PTU alternating diagonal distance formula (`diagonals + floor(diagonals / 2) + straights`) is now inlined identically in 5 separate locations. Extract to a shared pure utility function `ptuDiagonalDistance(dx, dy)` in `utils/gridDistance.ts`.

## Affected Files

1. `app/composables/useGridMovement.ts:calculateMoveDistance` (lines 141-148)
2. `app/composables/usePathfinding.ts:calculateMoveCost` (lines 158-166)
3. `app/stores/measurement.ts:distance` getter (lines 42-46)
4. `app/components/player/PlayerGridView.vue:handleCellClick` (lines 128-130)
5. `app/components/vtt/VTTContainer.vue:isometric3dDistance` (lines 313-315)

## Suggested Fix

Create `app/utils/gridDistance.ts`:
```typescript
export function ptuDiagonalDistance(dx: number, dy: number): number {
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  const diagonals = Math.min(absDx, absDy)
  const straights = Math.abs(absDx - absDy)
  return diagonals + Math.floor(diagonals / 2) + straights
}
```

Import in all 5 locations. Locations 4 and 5 (Vue components) may benefit from a direct import rather than a composable wrapper.

## Impact

Low — all 5 instances are currently correct and identical. This is a maintainability improvement to prevent drift if the formula ever needs adjustment.
