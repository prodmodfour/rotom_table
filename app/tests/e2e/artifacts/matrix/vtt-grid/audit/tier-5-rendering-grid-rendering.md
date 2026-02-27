## Tier 5: Rendering (Grid Rendering)

### R001 (continued) — Grid Rendering in Both Modes

- **Rule:** Square grid system.
- **Expected behavior:** Both 2D and isometric modes render correctly.
- **Actual behavior:** `VTTContainer.vue` (C040) switches between `GridCanvas.vue` (2D) and `IsometricCanvas.vue` (isometric) based on grid mode. 2D mode uses `useGridRendering` for standard top-down rendering. Isometric mode uses `useIsometricRendering` with `useIsometricProjection` for diamond grid, `useDepthSorting` for painter's algorithm, and `useIsometricOverlays` for fog/terrain/measurement in isometric projection. Both modes share the same underlying square grid coordinate system.
- **Classification:** Correct

---
