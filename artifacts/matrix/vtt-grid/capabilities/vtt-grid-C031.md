---
cap_id: vtt-grid-C031
name: vtt-grid-C031
type: —
domain: vtt-grid
---

### vtt-grid-C031
- **name:** useTouchInteraction composable (NEW — extracted)
- **type:** composable-function
- **location:** `app/composables/useTouchInteraction.ts`
- **game_concept:** Touch gesture handling for VTT grids
- **description:** Shared touch interaction extracted for reuse by both 2D and isometric grids. Handles: single-finger pan, pinch-to-zoom (with center-point tracking), tap detection (TOUCH_TAP_THRESHOLD=5px), one-finger-lift-from-pinch transition. Provides touch event handlers that modify pan/zoom refs and call render/onTap callbacks.
- **inputs:** Container ref, zoom/panOffset refs, min/max zoom, render callback, onTap callback
- **outputs:** Touch event handlers (touchstart, touchmove, touchend), isTouchPanning, isPinching
- **accessible_from:** gm, group
