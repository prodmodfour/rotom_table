---
id: refactoring-082
category: EXT-GOD
priority: P4
status: in-progress
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

## Resolution Log

### Commit 1: 69cb189
- **Created** `app/composables/useTouchInteraction.ts` (193 lines)
- Shared composable handling: single-finger pan, pinch-to-zoom, tap detection (TOUCH_TAP_THRESHOLD=5), one-finger-lift-from-pinch transition
- Accepts containerRef, zoom, panOffset, zoom bounds, render callback, and onTap callback
- onTap receives screen coordinates so each consumer does its own coordinate conversion

### Commit 2: 013015a
- **Refactored** `app/composables/useGridInteraction.ts` (764 -> 631 lines, -133 lines)
- Removed inline touch state, getTouchDistance/getTouchCenter helpers, handleTouchStart/Move/End
- Delegated to useTouchInteraction with grid-specific onTap callback (screenToGrid + getTokenAtPosition)
- Re-exported TOUCH_TAP_THRESHOLD for backward compatibility with GridCanvas.vue import

### Commit 3: efe5a61
- **Refactored** `app/composables/useIsometricInteraction.ts` (831 -> 692 lines, -139 lines)
- Same pattern as grid, but onTap uses getTokenAtScreenPosition (isometric diamond hit-test) instead of grid-based hit-test
- Removed TOUCH_TAP_THRESHOLD import from useGridInteraction (now uses useTouchInteraction directly)

### Files changed
- `app/composables/useTouchInteraction.ts` (new, 193 lines)
- `app/composables/useGridInteraction.ts` (764 -> 631 lines)
- `app/composables/useIsometricInteraction.ts` (831 -> 692 lines)
- `app/components/vtt/GridCanvas.vue` (no changes needed)
- `app/components/vtt/IsometricCanvas.vue` (no changes needed)
