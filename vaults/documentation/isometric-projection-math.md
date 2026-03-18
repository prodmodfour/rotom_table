# Isometric Projection Math

Pure math composable (`useIsometricProjection`) for the isometric grid mode. Uses a 2:1 tile ratio (width:height). All functions are stateless — camera angle and dimensions passed as parameters.

**Core transforms:**

- `worldToScreen(col, row, z, angle, cellSize)` — Converts grid coordinates to pixel position, incorporating elevation offset.
- `screenToWorld(px, py, angle, cellSize)` — Inverse projection from pixel to grid coordinates for hit-testing mouse/touch input.
- `rotateCoords` / `unrotateCoords` — Applies or reverses the [[isometric-camera-system|camera angle]] transform (0-3 cardinal rotations).
- `getDepthKey(col, row, z)` — Computes sort key for the [[depth-sorting-layers|painter's algorithm]].
- `getTileDiamondPoints(col, row, z, cellSize)` — Returns the 4 corner points of an isometric diamond for rendering.
- `getGridOriginOffset(gridWidth, gridHeight, cellSize)` — Centering offset for the canvas.

The inverse projection (`screenToWorld`) is critical for interaction — without it, clicks on the isometric canvas cannot resolve to grid cells.

## See also

- [[three-coordinate-spaces]] — the three coordinate systems this bridges
- [[vtt-rendering-pipeline]] — how the isometric pipeline uses these transforms
