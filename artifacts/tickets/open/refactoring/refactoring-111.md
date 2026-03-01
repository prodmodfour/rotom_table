---
ticket_id: refactoring-111
category: EXT-FILE-SIZE
priority: P3
severity: MEDIUM
domain: vtt-grid
source: code-review-245 MED-1
created_by: slave-collector (plan-20260301-135300)
created_at: 2026-03-01
---

# refactoring-111: Extract drawMovementArrow from useIsometricRendering.ts

## Summary

`app/composables/useIsometricRendering.ts` is at 820 lines, exceeding the project's 800-line maximum. The file was 783 lines before feature-013 P0 and grew incrementally through the implementation and fix cycle. P1 (multi-cell pathfinding, movement range) will add more code to this file, likely pushing it past 850.

## Affected Files

- `app/composables/useIsometricRendering.ts` (820 lines)

## Suggested Fix

Extract `drawMovementArrow()` (lines 674-756, ~82 lines) and related arrow/highlight drawing into a dedicated `useIsometricMovementPreview.ts` composable. This would bring `useIsometricRendering.ts` back to ~740 lines and create headroom for P1 additions.

## Impact

- Prevents file from growing past maintainability limits during P1
- Cleaner separation of concerns between token rendering and movement preview rendering
- Should be done before or during feature-013 P1 implementation
