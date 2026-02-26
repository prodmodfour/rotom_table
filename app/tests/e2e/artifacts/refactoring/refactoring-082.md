---
id: refactoring-082
category: EXT-GOD
priority: P4
status: open
source: code-review-166 M2
created_by: slave-collector (plan-20260226-051629)
created_at: 2026-02-26T06:00:00Z
---

# refactoring-082: Extract touch handlers from useGridInteraction into shared composable

## Summary

`useGridInteraction.ts` is now 764 lines after adding touch event handlers (+170 lines). The file handles mouse events, touch events, keyboard shortcuts, zoom controls, fog painting, terrain painting, marquee selection, click-to-move, and token selection — too many responsibilities. The next feature addition will push it over the 800-line limit.

## Affected Files

- `app/composables/useGridInteraction.ts` (764 lines — approaching 800 limit)
- `app/composables/useIsometricInteraction.ts` (needs equivalent touch support per bug-030 C1)

## Suggested Fix

Extract touch handlers (`handleTouchStart`, `handleTouchMove`, `handleTouchEnd`, related state) into a dedicated `useTouchInteraction` composable that:

1. Provides pan/zoom/tap state management
2. Delegates tap callbacks to the parent via options
3. Is reusable by both `useGridInteraction` and `useIsometricInteraction`
4. Resolves code-review-166 C1 (IsometricCanvas refs undefined touch handlers) via shared code rather than duplication

This also reduces `useGridInteraction.ts` by ~170 lines to ~594 lines.

## Impact

- **Extensibility:** Prevents God-composable anti-pattern. Makes touch support reusable across grid types.
- **Correctness:** Resolves the structural cause of bug-030 C1 (IsometricCanvas touch crash).
- **Maintainability:** Single responsibility per composable.
