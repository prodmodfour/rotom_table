# Touch Interaction Supports Pan and Pinch

`useTouchInteraction` provides mobile touch handling shared by both [[flat-grid-uses-canvas-plus-dom-tokens]] and [[isometric-canvas-renders-everything-on-canvas]]. Single-finger drag pans the viewport, two-finger pinch zooms, and a tap (within 5px movement threshold) selects a token or cell.

The composable handles the edge case of one finger lifting from a two-finger pinch — it transitions cleanly from zoom to pan without registering a false tap.
