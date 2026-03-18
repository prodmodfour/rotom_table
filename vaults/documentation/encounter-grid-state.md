# Encounter Grid State

The VTT grid is backed by several Pinia stores that hold reactive state:

**`encounterGrid` store** — Central grid state: config (width, height, cellSize, showGrid, backgroundImage, gridMode), token positions keyed by combatant ID, pan/zoom state, selected cell, drag state. Actions for position updates, grid config changes, background image management.

**`fogOfWar` store** — 2D grid of [[fog-of-war-system|fog state]] per cell. Uses `Map<string, FogState>` (see [[map-reactivity-gotcha]]).

**`terrain` store** — 2D grid of [[terrain-type-system|terrain type]] and elevation per cell. Uses `Map<string, TerrainCell>`.

**`measurement` store** — Client-only store for [[measurement-aoe-modes|measurement mode]] and parameters. GM-only.

**`selection` store** — Tracks selected combatant IDs for multi-select operations (select, deselect, toggle, clear). GM-only.

**`isometricCamera` store** — [[isometric-camera-system|Camera rotation and zoom]] state for isometric mode. Synced via WebSocket between GM and group views.

## See also

- [[pinia-store-classification]] — store categorization across the app
- [[vtt-grid-persistence-apis]] — how these stores persist to the server
