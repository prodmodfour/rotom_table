# Elevation System

Manages vertical positioning for the isometric grid via `useElevation`.

**Token elevation:** Per-token reactive map. Raise/lower actions. Flying Pokemon (Flier trait > 0, queried via movement trait queries) default to elevated position. Bounds validated from 0 to `maxElevation`.

**Terrain elevation:** Ground height per cell, painted via the terrain elevation brush in `ElevationToolbar`. Changes ground level for the isometric diamond rendering and affects [[pathfinding-algorithm|movement cost]] (1 MP per elevation level change).

Flying Pokemon ignore elevation movement costs within their Flier speed budget.

Elevation affects [[isometric-projection-math|worldToScreen]] by shifting the vertical pixel position and [[depth-sorting-layers|depth key]] for correct layering.

**Current limitation:** Token elevations are client-side only — not persisted to the database or synced via WebSocket. Elevations reset on page reload, and group view may not see correct elevations.

## See also

- [[terrain-type-system]] — terrain elevation stored alongside terrain type
