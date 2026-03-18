# VTT Grid Composables

Composables powering the VTT grid system, organized by rendering mode.

**2D composables:**

- `useRangeParser.ts` — range parsing, line-of-sight, area-of-effect shapes.
- `usePathfinding.ts` — [[pathfinding-algorithm|A* pathfinding]] with elevation, movement range flood-fill, movement validation.
- `useGridMovement.ts` — terrain-aware movement, speed modifiers, status-movement integration via [[movement-modifiers-utility]].
- `useGridInteraction.ts` — 2D grid click/hover/drag interaction.
- `useGridRendering.ts` — 2D grid rendering to canvas.
- `useCanvasRendering.ts` — canvas setup and lifecycle.
- `useCanvasDrawing.ts` — 2D drawing primitives.
- `useTerrainPersistence.ts` — terrain save/load.
- `useTouchInteraction.ts` — [[touch-gesture-handling|shared touch gesture handling]] (single-finger pan, pinch-to-zoom, tap detection for 2D and isometric).

**Isometric composables:**

- `useIsometricProjection.ts` — [[isometric-projection-math|isometric math]] (grid-to-screen, screen-to-grid).
- `useIsometricCamera.ts` — [[isometric-camera-system|camera rotation and zoom]].
- `useIsometricRendering.ts` — isometric grid and token rendering.
- `useIsometricInteraction.ts` — isometric click/hover/drag.
- `useIsometricOverlays.ts` — fog of war, terrain, measurement diamond overlay.
- `useDepthSorting.ts` — [[depth-sorting-layers|painter's algorithm]] depth ordering.
- `useElevation.ts` — [[elevation-system|token/terrain elevation state]], flying defaults.

## See also

- [[vtt-component-composable-map]]
- [[composable-domain-grouping]]
- [[encounter-grid-state]] — the stores these composables consume
- [[fog-of-war-system]] — fog overlay composables
- [[terrain-type-system]] — terrain overlay composables
