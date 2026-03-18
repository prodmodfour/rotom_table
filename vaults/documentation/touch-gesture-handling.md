# Touch Gesture Handling

Shared touch interaction composable (`useTouchInteraction`) extracted for reuse by both 2D and isometric grids.

**Gestures:**

- **Single-finger pan** — Drag to scroll the grid viewport.
- **Pinch-to-zoom** — Two-finger gesture with center-point tracking for zoom anchoring.
- **Tap detection** — Distinguished from pan by a 5px movement threshold (`TOUCH_TAP_THRESHOLD`).
- **One-finger-lift-from-pinch** — Transition handling when one finger lifts during a pinch, preventing accidental pan jumps.

**Interface:** Accepts container ref, zoom/panOffset refs, min/max zoom bounds, a render callback, and an `onTap` callback. Returns touch event handlers (`touchstart`, `touchmove`, `touchend`) plus `isTouchPanning` and `isPinching` state flags.

Both `useGridInteraction` (2D) and `useIsometricInteraction` (isometric) delegate touch events to this shared composable.

## See also

- [[haptic-feedback-patterns]] — vibration feedback for player touch interactions
- [[vtt-grid-composables]] — listed under 2D composables (shared across both modes)
