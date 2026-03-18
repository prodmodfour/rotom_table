# Three Coordinate Spaces

The [[vtt-rendering-pipeline|VTT]] uses three coordinate systems:

1. **Grid coords** (col, row) — Game logic, pathfinding, terrain lookups. Origin top-left.
2. **Pixel coords** (x, y) — Canvas drawing positions. Grid coords multiplied by cellSize, adjusted by pan/zoom.
3. **Screen coords** — Mouse/touch event positions. In 2D: pixel coords with CSS transform. In isometric: projected via [[isometric-camera-system|camera angle]] + [[elevation-system|elevation]], requiring [[isometric-projection-math|inverse projection]] for hit-testing.

The DOM token-layer in 2D mode must match the canvas pan/zoom transform exactly (`tokenLayerStyle` computed). Mismatch causes token drift.
