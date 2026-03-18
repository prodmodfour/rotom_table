# Isometric Camera Rotates Cardinal Directions

The `isometricCamera` Pinia store holds a `CameraAngle` value (0–3) representing four cardinal orientations: North (0), East (1), South (2), West (3). The camera snaps between these angles — there is no free rotation.

`CameraControls.vue` provides CW/CCW rotation buttons and displays the current cardinal direction label. Keyboard shortcuts Q (CCW) and E (CW) also rotate the camera. The rotation is instant (snap), though the store tracks an `isRotating` flag for animation purposes.

The camera angle is synchronized between GM and group views via WebSocket through the [[vtt-websocket-events-sync-state]], so spectators always see the same orientation as the GM.

## See also

- [[isometric-projection-transforms-world-to-screen]] — uses the camera angle for coordinate math
- [[battle-grid-settings-panel]] — camera angle can also be set in grid config
