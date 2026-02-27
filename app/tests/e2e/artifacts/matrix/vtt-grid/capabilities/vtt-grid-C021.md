---
cap_id: vtt-grid-C021
name: vtt-grid-C021
type: —
domain: vtt-grid
---

### vtt-grid-C021
- **name:** useIsometricCamera composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useIsometricCamera.ts`
- **game_concept:** Isometric camera controls
- **description:** Camera composable wrapping isometricCamera store. Manages rotation (instant snap in P0), zoom, and local pan offset (not synced via WS). Provides rotateClockwise/rotateCounterClockwise, setZoom, resetPan. Pan offset is per-view independent.
- **inputs:** User rotation/zoom/pan actions
- **outputs:** cameraAngle, zoom, panOffset, isRotating
- **accessible_from:** gm, group
