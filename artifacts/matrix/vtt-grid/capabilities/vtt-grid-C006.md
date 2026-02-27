---
cap_id: vtt-grid-C006
name: vtt-grid-C006
type: —
domain: vtt-grid
---

### vtt-grid-C006
- **name:** Isometric Camera Store (NEW)
- **type:** store-action
- **location:** `app/stores/isometricCamera.ts`
- **game_concept:** Isometric camera rotation and zoom state
- **description:** Manages camera angle (0-3, cardinal rotations), zoom level (0.25-3.0), rotation animation state (isRotating, targetAngle). Actions: setAngle, rotateClockwise, rotateCounterClockwise, completeRotation, setZoom. Designed for WebSocket sync between GM and Group views.
- **inputs:** CameraAngle (0-3), zoom level
- **outputs:** Reactive camera state
- **accessible_from:** gm, group

## Composables — 2D Grid (Existing)
