---
design_id: design-isometric-grid-001
ticket_id: feature-002
category: FEATURE
scope: FULL
domain: vtt-grid
status: p0-implemented
affected_files:
  - app/composables/useCanvasRendering.ts
  - app/composables/useCanvasDrawing.ts
  - app/composables/useGridRendering.ts
  - app/composables/useGridInteraction.ts
  - app/composables/useGridMovement.ts
  - app/composables/useRangeParser.ts
  - app/composables/useTerrainPersistence.ts
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/GroupGridCanvas.vue
  - app/components/vtt/VTTToken.vue
  - app/components/vtt/VTTContainer.vue
  - app/components/vtt/CoordinateDisplay.vue
  - app/components/vtt/ZoomControls.vue
  - app/components/vtt/MeasurementToolbar.vue
  - app/components/vtt/FogOfWarToolbar.vue
  - app/components/vtt/TerrainPainter.vue
  - app/stores/encounterGrid.ts
  - app/stores/fogOfWar.ts
  - app/stores/terrain.ts
  - app/stores/measurement.ts
  - app/stores/selection.ts
  - app/types/spatial.ts
  - app/prisma/schema.prisma
new_files:
  - app/composables/useIsometricCamera.ts
  - app/composables/useIsometricProjection.ts
  - app/composables/useIsometricRendering.ts
  - app/composables/useIsometricInteraction.ts
  - app/composables/useDepthSorting.ts
  - app/composables/useElevation.ts
  - app/components/vtt/IsometricCanvas.vue
  - app/components/vtt/ElevationToolbar.vue
  - app/components/vtt/CameraControls.vue
  - app/stores/isometricCamera.ts
---


# Design: 3D Isometric Rotatable Grid for VTT

## Summary

Replace the current 2D flat Canvas grid with a 3D isometric grid supporting Z-axis elevation and camera rotation. The grid continues using the same 2D Pokemon/trainer sprites rendered as billboards in the isometric view. All existing VTT functionality is preserved: fog of war (3-state), terrain painter (7 types), measurement tools (distance/burst/cone/line/blast), A* pathfinding with PTU diagonal movement rules, token interaction, and background maps.

The design uses **pure Canvas 2D with isometric projection math** (no external rendering library). This avoids adding a large dependency (Three.js ~660KB min, PixiJS ~500KB min), keeps the rendering pipeline simple and debuggable, and leverages the existing Canvas composable architecture. The isometric math layer sits between the existing game logic (stores, pathfinding, range parsing) and the canvas drawing code, requiring replacement of only the rendering and interaction composables while preserving all game logic composables and stores.

---


## Atomized Files

- [_index.md](_index.md)
- [spec.md](spec.md)
- [shared-specs.md](shared-specs.md)
- [implementation-log.md](implementation-log.md)
