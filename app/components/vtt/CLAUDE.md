# VTT Components CLAUDE.md

## Rendering Pipeline

VTTContainer (644 lines) is the root orchestrator. It selects between two rendering pipelines based on `config.isometric`:

- **2D Pipeline**: GridCanvas draws grid/fog/terrain/measurement on `<canvas>`, then overlays DOM-based VTTToken elements in a `token-layer` div. Supports marquee selection overlay.
- **Isometric Pipeline**: IsometricCanvas renders everything (grid, tokens, sprites) on a single `<canvas>` — no VTTToken DOM elements. Uses CameraControls for rotation.
- **Group View**: GroupGridCanvas wraps either pipeline in read-only mode (`is-gm="false"`, no event handlers).

## Three Coordinate Spaces

1. **Grid coords** (col, row) — game logic, pathfinding, terrain lookups. Origin top-left.
2. **Pixel coords** (x, y) — canvas drawing positions. Grid coords multiplied by cellSize, adjusted by pan/zoom.
3. **Screen coords** — mouse/touch event positions. In 2D: pixel coords with CSS transform. In isometric: projected via camera angle + elevation, requiring inverse projection for hit-testing.

## Component-to-Composable Map (15 .vue files)

| Component (lines) | Composables | Stores |
|---|---|---|
| VTTContainer (644) | useFogPersistence, useTerrainPersistence, useCombatantDisplay | selection, measurement, fogOfWar, terrain |
| GridCanvas (465) | useGridMovement, useGridRendering, useGridInteraction, useFlankingDetection | selection, measurement |
| IsometricCanvas (440) | useIsometricCamera, useIsometricRendering, useIsometricInteraction, useGridMovement, useElevation, useRangeParser | fogOfWar, terrain, measurement |
| VTTToken (404) | usePokemonSprite, useTrainerSprite | (none) |
| TerrainPainter (595) | (none) | terrain |
| GridSettingsPanel (293) | (none) | (none) |
| MapUploader (348) | (none) | (none) |
| MeasurementToolbar (274) | (none) | (none) |
| FogOfWarToolbar (268) | (none) | (none) |
| ElevationToolbar (250) | (none) | (none) |
| GroupGridCanvas (140) | (none) | (none) |
| CameraControls (105) | (none) | (none) |
| ZoomControls (85) | (none) | (none) |
| VTTMountedToken (277) | (none) | encounter |
| CoordinateDisplay (60) | (none) | (none) |

## PTU Rules in VTT Code

Decrees binding on this code (see `decrees/` at project root):

- **Diagonal movement** (decree-002): alternating 1m/2m cost pattern
- **Token blocking** (decree-003): occupied cells block pathing for large tokens
- **Cone width** (decree-007): PTU cone shape geometry
- **Water terrain cost** (decree-008): specific movement cost for water cells
- **Multi-tag terrain** (decree-010): cells with multiple terrain types
- **Mixed-terrain averaging** (decree-011): cost averaging across multi-terrain cells
- **Diagonal lines** (decree-009): shortened via `maxDiagonalCells()` — line AoE diagonal limit
- **Burst AoE diagonal** (decree-023): burst area calculation with diagonals
- **Diagonal cone corner** (decree-024): corner-cell inclusion for cone shapes
- **Edge-to-edge distance** (decree-002): `ptuDistanceTokensBBox()` for multi-cell token distance
- **Movement modifiers**: Stuck=0, Tripped=0, Slowed=half, Sprint=+50%, Disengaged=max 1m
- **AoO detection**: shift-away trigger check in `useGridMovement` (lines 639-682)
- **Rough terrain endpoint exclusion** (decree-025): accuracy penalty scope
- **Flanking after evasion cap** (decree-040): flanking penalty application

## Gotchas

- **DOM vs canvas tokens**: 2D GridCanvas renders VTTToken as DOM elements over the canvas; IsometricCanvas draws tokens directly on canvas. Different click/hit-test paths.
- **Fog brush vs burst AoE**: Fog uses brush-size (circle of cells); measurement burst uses PTU distance. Different radius calculations despite similar UI.
- **activeCanvasRef pattern**: VTTContainer uses a computed ref switching between gridCanvasRef/isometricCanvasRef to call `.render()` and `.resetView()` generically.
- **Debounced fog/terrain persistence**: Both use `debouncedSave` with cleanup on unmount. Losing the component mid-save can drop state.
- **Player mode restrictions**: `playerMode` prop on GridCanvas hides enemy HP, restricts token selection to own tokens, and limits movement to current-turn token only.
- **Multi-cell footprint**: Tokens with `size > 1` occupy NxN grid cells. Pathfinding iterates the full footprint at each step. Blocking checks must account for all occupied cells.
- **CSS/canvas transform sync**: The DOM token-layer in 2D mode must match the canvas pan/zoom transform exactly (`tokenLayerStyle` computed). Mismatch causes token drift.
