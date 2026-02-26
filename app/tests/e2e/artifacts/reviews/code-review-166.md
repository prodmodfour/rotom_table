---
review_id: code-review-166
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: bug-030
domain: player-view
commits_reviewed:
  - 545a6ed
  - 91670a1
  - 8eadf0e
  - cb66ca0
  - 7d2dd53
  - 8d368b2
files_reviewed:
  - app/composables/useGridInteraction.ts
  - app/composables/useIsometricInteraction.ts
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/IsometricCanvas.vue
  - app/tests/e2e/artifacts/tickets/bug/bug-030.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 0
  medium: 2
reviewed_at: 2026-02-26T05:25:00Z
follows_up: null
---

## Review Scope

Bug-030 adds touch event support (pan, pinch-to-zoom, tap detection) to the VTT grid for mobile devices. The fix targets the player view's primary use case (phone-based play) and extends to the isometric canvas for consistency.

**Files changed:** 4 source files + 1 ticket doc across 6 commits.

**Approach:** Touch handlers (handleTouchStart/Move/End) were added to the `useGridInteraction` composable with touch state management, pinch distance math, tap-vs-drag detection (5px threshold), and an `onTouchTap` callback for player mode override. GridCanvas.vue wires the events and provides the player mode callback. IsometricCanvas.vue also wires touch events and adds `touch-action: none` CSS.

## Issues

### CRITICAL

**C1: IsometricCanvas references undefined touch handler methods (runtime crash)**

`IsometricCanvas.vue` (commit `7d2dd53`) binds `@touchstart="interaction.handleTouchStart"`, `@touchmove="interaction.handleTouchMove"`, and `@touchend="interaction.handleTouchEnd"` on the container element. However, `useIsometricInteraction.ts` does NOT define or return any of these methods. The composable has zero touch-related code.

This means any touch interaction on the isometric grid will throw `TypeError: interaction.handleTouchStart is not a function` at runtime. Since mobile is the primary audience for touch events, this is a crash on the exact target platform.

**File:** `app/components/vtt/IsometricCanvas.vue` lines 11-13
**File:** `app/composables/useIsometricInteraction.ts` (no handleTouchStart/Move/End in return object at line 634)

**Fix required:** Either (a) add touch handler methods to `useIsometricInteraction` mirroring the logic in `useGridInteraction` (adapted for isometric coordinate transforms), or (b) remove the touch event bindings from `IsometricCanvas.vue` and add a TODO referencing a follow-up ticket for isometric touch support. Option (a) is strongly preferred since the commit message says "for consistency" -- consistency means the feature actually works.

### MEDIUM

**M1: Duplicate threshold constant across composable and component**

`TOUCH_TAP_THRESHOLD = 5` is defined in `useGridInteraction.ts` (line 62) and `CLICK_THRESHOLD_PX = 5` is defined in `GridCanvas.vue` (line 310). Both represent the same concept (movement threshold to distinguish tap/click from drag/pan) and use the same value. If one is changed without the other, touch and mouse behaviors would diverge.

**Fix required:** Extract a single shared constant (e.g., in the composable) and reference it from both locations, or at minimum add a cross-referencing comment to prevent silent divergence. Since the composable already defines `TOUCH_TAP_THRESHOLD`, the component should import and use it rather than redeclaring.

**M2: `useGridInteraction` file approaching size limit (764 lines)**

The composable is now 764 lines after the touch handler additions (+170 lines). The project standard is 800 lines max. While still within bounds, this file handles mouse events, touch events, keyboard shortcuts, zoom controls, fog painting, terrain painting, marquee selection, click-to-move, and token selection -- too many responsibilities for one file. The next feature addition will likely push it over the limit.

**Recommendation (not blocking, but file a ticket):** Extract touch handlers into a dedicated `useTouchInteraction` composable that provides pan/zoom/tap state and delegates tap callbacks to the parent. This would also make it reusable for `useIsometricInteraction` (addressing C1 via shared code rather than duplication).

## What Looks Good

1. **Touch-to-grid coordinate conversion reuses `screenToGrid`:** The tap handler correctly converts `changedTouches[0].clientX/clientY` through the existing `screenToGrid` function, ensuring touch taps resolve to the same grid cell as mouse clicks at the same screen position. No new coordinate math was introduced for taps.

2. **Pinch-to-zoom math mirrors mouse wheel zoom:** The pinch handler uses `newDistance / lastPinchDistance` as a scale ratio and applies the same zoom-toward-center formula as `handleWheel` (lines 643-654 vs 133-145). The zoom bounds (`MIN_ZOOM`/`MAX_ZOOM`) are shared. This ensures consistent zoom behavior across input modalities.

3. **Clean pinch-to-pan transition:** When one finger lifts during a pinch (lines 673-686), the handler correctly resets to single-finger state by updating `lastTouchPos` and `touchStartPos` from the remaining touch point. This prevents a sudden pan jump when transitioning from two-finger to one-finger gesture.

4. **Player mode tap parity with mouse:** The `onTouchTap` callback in GridCanvas.vue (lines 244-255) produces the same events as `handleTokenSelectWithPlayerMode` and the mouse-based `handleMouseUp` player mode path: own-token tap emits `playerTokenSelect`, empty cell tap emits `playerCellClick`, non-own-token tap is silently ignored. Bounds checking was correctly added in commit `cb66ca0`.

5. **`preventDefault()` + manual tap handling:** Correctly calling `event.preventDefault()` on all three touch handlers to suppress the browser's synthesized click events, then manually resolving taps in `handleTouchEnd`. This avoids the double-fire problem where both touch and synthesized click would trigger actions. The commit `cb66ca0` specifically addresses the fact that VTTToken's `@click` handler won't fire on mobile and moves token tap handling into the composable.

6. **Commit granularity is good.** Six commits with clear single-purpose changes: base handlers, wiring + callback, CSS fix, bounds check fix, isometric consistency, docs. Each commit produces a working state (modulo C1).

## Verdict

**CHANGES_REQUIRED**

C1 is a runtime crash on the exact platform this fix targets. The isometric canvas touch event wiring references methods that do not exist on the composable, meaning any touch on the isometric grid will throw. This must be fixed before the bug can be marked resolved.

## Required Changes

| ID | Severity | Description | Files |
|----|----------|-------------|-------|
| C1 | CRITICAL | Add touch handler methods to `useIsometricInteraction` (or remove bindings from IsometricCanvas.vue if deferring to a follow-up ticket) | `useIsometricInteraction.ts`, `IsometricCanvas.vue` |
| M1 | MEDIUM | Deduplicate tap/click threshold constant between composable and component | `useGridInteraction.ts`, `GridCanvas.vue` |
| M2 | MEDIUM | File a ticket for extracting touch handlers into a shared composable before the file exceeds 800 lines | Ticket system |
