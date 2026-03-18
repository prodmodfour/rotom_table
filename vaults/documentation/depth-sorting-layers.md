# Depth Sorting Layers

The isometric grid uses a painter's algorithm for correct rendering order. Items are sorted by depth key (from [[isometric-projection-math|getDepthKey]]) with a 4-layer priority system:

1. **Terrain** (lowest) — Ground tiles and terrain overlays
2. **Grid** — Grid lines and cell outlines
3. **Token** — Combatant sprites, HP bars, indicators
4. **Fog** (highest) — Fog of war overlay

Items at the same depth are ordered by layer priority. The `useDepthSorting` composable accepts an array of drawable items (each with `gridX`, `gridY`, `elevation`, `layer`) and returns the sorted array for sequential canvas rendering.

## See also

- [[isometric-projection-math]] — depth key computation
- [[vtt-rendering-pipeline]] — isometric pipeline uses depth sorting
