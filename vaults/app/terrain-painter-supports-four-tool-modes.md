# Terrain Painter Supports Four Tool Modes

`TerrainPainter.vue` provides a terrain editing panel with four tool modes: paint, erase, line (Bresenham's algorithm for drawing walls), and fill (flood-fill). The painter exposes a base terrain type selector (normal, blocking, water, earth, hazard, elevated) and movement flag toggles (rough, slow) per [[terrain-cells-combine-base-type-and-movement-flags]].

In isometric mode, the painter also includes an elevation brush for raising/lowering terrain elevation. Brush size is adjustable. A legend explains the color-coding for each terrain type.

The terrain painter is only available to the GM in isometric mode. Terrain painting in 2D mode uses keyboard shortcut `T` via `useGridInteraction` with a simpler inline flow.

## See also

- [[battle-grid-fog-of-war-controls]] — the fog painter follows a similar brush-based pattern
- [[encounter-keyboard-shortcuts-dialog]] — documents the `T` shortcut for terrain painting
