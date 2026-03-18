# Isometric Camera System

The isometric camera manages rotation and zoom for the isometric grid view.

**State** (in `isometricCamera` store):

- `cameraAngle` — Integer 0-3 representing four cardinal rotation angles.
- `zoom` — Float 0.25 to 3.0.
- `isRotating` / `targetAngle` — Animation state for rotation transitions.

**Composable** (`useIsometricCamera`) wraps the store with:

- `rotateClockwise` / `rotateCounterClockwise` — Cycle through angles.
- `setZoom` / `resetPan` — Zoom and pan controls.
- Pan offset is per-view and independent (not synced via WebSocket).

**Component** (`CameraControls`) provides rotation buttons in the GM view.

Camera angle is designed for WebSocket sync between GM and Group views — when the GM rotates, the group view follows. Zoom and pan remain local.

## See also

- [[isometric-projection-math]] — `rotateCoords` uses the camera angle for transforms
- [[vtt-rendering-pipeline]] — isometric pipeline wiring
