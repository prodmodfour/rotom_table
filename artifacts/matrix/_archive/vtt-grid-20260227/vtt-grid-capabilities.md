---
domain: vtt-grid
mapped_at: 2026-02-26T12:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 68
files_read: 35
---

# App Capabilities: VTT Grid

> Re-mapped capability catalog for the VTT grid domain.
> Includes new: isometric grid system (P0+P1+P2), elevation, depth sorting, touch interaction extraction, A* pathfinding with elevation, combatant capabilities utility, gridDistance utility.

## Stores

### vtt-grid-C001
- **name:** Encounter Grid Store
- **type:** store-action
- **location:** `app/stores/encounterGrid.ts`
- **game_concept:** VTT grid configuration and token positions
- **description:** Manages grid config (width, height, cellSize, showGrid, backgroundImage, gridMode), token positions keyed by combatant ID, pan/zoom state, selected cell, drag state. Actions for position updates, grid config changes, background image management.
- **inputs:** Grid config, token positions, pan/zoom values
- **outputs:** Reactive grid state for rendering
- **accessible_from:** gm, group (display)

### vtt-grid-C002
- **name:** Fog of War Store
- **type:** store-action
- **location:** `app/stores/fogOfWar.ts`
- **game_concept:** PTU fog of war (3-state: hidden/revealed/explored)
- **description:** 2D grid of fog state per cell. Actions: setFogState (individual cell), revealArea (radius), exploreCells, resetFog. Persists to server via encounter fog endpoints. GM sees all states with visual indicators; group/player sees only revealed cells.
- **inputs:** Cell coordinates, fog state, area parameters
- **outputs:** FogState per cell (hidden/revealed/explored)
- **accessible_from:** gm (edit), group+player (display, hidden cells obscured)

### vtt-grid-C003
- **name:** Terrain Store
- **type:** store-action
- **location:** `app/stores/terrain.ts`
- **game_concept:** PTU terrain types with movement costs
- **description:** 2D grid of terrain types per cell. 6 terrain types: normal, rough, water, ice, lava, blocked. Each type has movement cost multiplier. Actions: setTerrain, clearTerrain, loadFromServer, saveToServer. Terrain elevation stored per-cell for isometric mode.
- **inputs:** Cell coordinates, terrain type, elevation
- **outputs:** TerrainType per cell, movement cost per cell, elevation per cell
- **accessible_from:** gm (edit), group (display)

### vtt-grid-C004
- **name:** Measurement Store
- **type:** store-action
- **location:** `app/stores/measurement.ts`
- **game_concept:** PTU range measurement tools
- **description:** Measurement mode (distance/burst/cone/line/close-blast), measurement origin, radius/range parameters. Client-only store for visual range overlays.
- **inputs:** Mode selection, origin cell, range value
- **outputs:** Measurement configuration for rendering
- **accessible_from:** gm

### vtt-grid-C005
- **name:** Selection Store
- **type:** store-action
- **location:** `app/stores/selection.ts`
- **game_concept:** Grid multi-selection
- **description:** Tracks selected combatant IDs for multi-select operations. Actions: select, deselect, toggle, clear.
- **inputs:** Combatant IDs
- **outputs:** Set of selected combatant IDs
- **accessible_from:** gm

### vtt-grid-C006
- **name:** Isometric Camera Store (NEW)
- **type:** store-action
- **location:** `app/stores/isometricCamera.ts`
- **game_concept:** Isometric camera rotation and zoom state
- **description:** Manages camera angle (0-3, cardinal rotations), zoom level (0.25-3.0), rotation animation state (isRotating, targetAngle). Actions: setAngle, rotateClockwise, rotateCounterClockwise, completeRotation, setZoom. Designed for WebSocket sync between GM and Group views.
- **inputs:** CameraAngle (0-3), zoom level
- **outputs:** Reactive camera state
- **accessible_from:** gm, group

## Composables — 2D Grid (Existing)

### vtt-grid-C010
- **name:** useCanvasRendering composable
- **type:** composable-function
- **location:** `app/composables/useCanvasRendering.ts`
- **game_concept:** Canvas setup and lifecycle
- **description:** Manages canvas element setup, resize handling, DPI scaling, render loop. Provides setupCanvas, getContext, render trigger.
- **inputs:** Canvas element ref, container ref
- **outputs:** Canvas 2D context, render trigger function
- **accessible_from:** gm, group

### vtt-grid-C011
- **name:** useCanvasDrawing composable
- **type:** composable-function
- **location:** `app/composables/useCanvasDrawing.ts`
- **game_concept:** 2D drawing primitives
- **description:** Low-level canvas drawing functions: drawGrid, drawToken, drawMovementRange, drawMeasurement, fillCell, strokeCell. Used by both 2D rendering and isometric helpers.
- **inputs:** Canvas 2D context, grid config, drawing parameters
- **outputs:** Drawing calls on canvas
- **accessible_from:** gm, group

### vtt-grid-C012
- **name:** useGridRendering composable
- **type:** composable-function
- **location:** `app/composables/useGridRendering.ts`
- **game_concept:** 2D grid rendering pipeline
- **description:** Full 2D render pipeline: grid lines, tokens (with sprites, HP bars, side colors, turn indicators), movement range, measurement overlays, fog of war, terrain.
- **inputs:** Grid config, combatants, fog state, terrain state, measurement state
- **outputs:** Full 2D grid render on canvas
- **accessible_from:** gm, group

### vtt-grid-C013
- **name:** useGridInteraction composable
- **type:** composable-function
- **location:** `app/composables/useGridInteraction.ts`
- **game_concept:** 2D grid mouse/touch interaction
- **description:** Handles mouse click, hover, drag for token selection/movement, zoom (wheel), pan (right-click drag). Delegates touch to useTouchInteraction. Converts screen coordinates to grid coordinates.
- **inputs:** Mouse/touch events, grid config
- **outputs:** Cell click, token select, token move, pan/zoom changes
- **accessible_from:** gm

### vtt-grid-C014
- **name:** useGridMovement composable
- **type:** composable-function
- **location:** `app/composables/useGridMovement.ts`
- **game_concept:** PTU terrain-aware movement
- **description:** Movement validation considering terrain costs, speed modifiers (slow/stuck conditions), multi-tile tokens, movement range display. Integrates with terrain store for cost calculations.
- **inputs:** Combatant, target position, terrain state
- **outputs:** Movement validity, movement cost, movement range cells
- **accessible_from:** gm

### vtt-grid-C015
- **name:** useTerrainPersistence composable
- **type:** composable-function
- **location:** `app/composables/useTerrainPersistence.ts`
- **game_concept:** Terrain save/load to server
- **description:** Loads terrain state from encounter terrain API on init, saves terrain changes back. Debounced save to avoid excessive API calls.
- **inputs:** Encounter ID, terrain state
- **outputs:** Server-synced terrain data
- **accessible_from:** gm

### vtt-grid-C016
- **name:** useRangeParser composable
- **type:** composable-function
- **location:** `app/composables/useRangeParser.ts`
- **game_concept:** PTU range/AoE calculation
- **description:** Parses PTU range notation, calculates Line of Sight, computes Area of Effect shapes (burst, cone, line, close-blast). Provides cells-in-range calculations for measurement overlays.
- **inputs:** Range string, origin position, target position
- **outputs:** Affected cell arrays, LoS result, distance calculations
- **accessible_from:** gm

## Composables — Isometric Grid (NEW)

### vtt-grid-C020
- **name:** useIsometricProjection composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useIsometricProjection.ts`
- **game_concept:** Isometric coordinate mathematics
- **description:** Pure math composable for isometric projection. 2:1 tile ratio (width:height). Functions: worldToScreen (grid → pixel with elevation), screenToWorld (pixel → grid inverse), rotateCoords/unrotateCoords (camera angle transform), getDepthKey (painter's algorithm), getTileDiamondPoints (4 corner points of isometric diamond), getGridOriginOffset (canvas centering). All stateless — camera angle and dimensions passed as params.
- **inputs:** Grid coordinates (x, y, z), camera angle, grid dimensions, cell size
- **outputs:** Screen coordinates (px, py), grid coordinates, depth keys, diamond points
- **accessible_from:** gm, group

### vtt-grid-C021
- **name:** useIsometricCamera composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useIsometricCamera.ts`
- **game_concept:** Isometric camera controls
- **description:** Camera composable wrapping isometricCamera store. Manages rotation (instant snap in P0), zoom, and local pan offset (not synced via WS). Provides rotateClockwise/rotateCounterClockwise, setZoom, resetPan. Pan offset is per-view independent.
- **inputs:** User rotation/zoom/pan actions
- **outputs:** cameraAngle, zoom, panOffset, isRotating
- **accessible_from:** gm, group

### vtt-grid-C022
- **name:** useIsometricRendering composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useIsometricRendering.ts`
- **game_concept:** Isometric grid rendering pipeline
- **description:** Full isometric render pipeline: diamond grid lines, tokens (with sprites, HP bars, side colors, turn indicators, elevation badges), movement range, selection highlights, hover highlights, movement previews. Renders in depth-sorted order (painter's algorithm). Uses useIsometricProjection for coordinate transforms and useIsometricOverlays for fog/terrain/measurement overlays.
- **inputs:** Grid config, combatants, camera angle, zoom, pan, fog/terrain/measurement state
- **outputs:** Full isometric grid render on canvas
- **accessible_from:** gm, group

### vtt-grid-C023
- **name:** useIsometricInteraction composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useIsometricInteraction.ts`
- **game_concept:** Isometric grid mouse/touch interaction
- **description:** Handles mouse/touch interaction for isometric grid. Converts screen coordinates to world grid coordinates via screenToWorld. Handles token selection, movement, hover, drag-and-drop. Delegates touch to useTouchInteraction.
- **inputs:** Mouse/touch events, camera angle, grid config
- **outputs:** Cell click, token select, token move
- **accessible_from:** gm

### vtt-grid-C024
- **name:** useIsometricOverlays composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useIsometricOverlays.ts`
- **game_concept:** Isometric fog/terrain/measurement diamond overlays
- **description:** Renders overlays through isometric projection: fog of war (3-state with GM indicators), terrain types (6 types with color fills), measurement shapes (5 modes with colored diamonds), elevation darkening for depth cues. All rendered as isometric diamonds using getTileDiamondPoints.
- **inputs:** Grid config, camera angle, fog/terrain/measurement state, sorted cell array
- **outputs:** Overlay rendering on canvas
- **accessible_from:** gm, group

### vtt-grid-C025
- **name:** useDepthSorting composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useDepthSorting.ts`
- **game_concept:** Painter's algorithm depth ordering
- **description:** Sorts drawable items by depth key for correct isometric rendering order. 4 layers: terrain < grid < token < fog. Items at same depth ordered by layer priority. Uses getDepthKey from isometric projection.
- **inputs:** Array of Drawable items (gridX, gridY, elevation, layer)
- **outputs:** Sorted Drawable array
- **accessible_from:** gm, group

### vtt-grid-C026
- **name:** useElevation composable (NEW)
- **type:** composable-function
- **location:** `app/composables/useElevation.ts`
- **game_concept:** Token and terrain elevation for isometric grid
- **description:** Manages per-token elevation (reactive map), default elevation for flying Pokemon (Sky capability), elevation change helpers (raise/lower token), terrain elevation brush (raise/lower ground cells). Validates elevation bounds (0 to maxElevation). Uses combatantCanFly/getSkySpeed from utilities.
- **inputs:** Token ID, elevation level, combatant capabilities
- **outputs:** Token elevations map, terrain elevations, brush elevation
- **accessible_from:** gm

## Composables — Shared

### vtt-grid-C030
- **name:** usePathfinding composable (NEW)
- **type:** composable-function
- **location:** `app/composables/usePathfinding.ts`
- **game_concept:** A* pathfinding with elevation support
- **description:** Provides A* pathfinding with terrain costs, elevation costs, and PTU diagonal movement rules. getMovementRangeCells: flood-fill algorithm finds all reachable cells within speed budget, accounting for terrain costs (6 types), elevation change costs (1 MP per level), and alternating diagonal costs (1m/2m). Flying Pokemon ignore elevation costs within Sky speed.
- **inputs:** Origin, speed, blocked cells, terrain cost getter, elevation cost getter, terrain elevation getter
- **outputs:** Reachable cell positions, path to target
- **accessible_from:** gm

### vtt-grid-C031
- **name:** useTouchInteraction composable (NEW — extracted)
- **type:** composable-function
- **location:** `app/composables/useTouchInteraction.ts`
- **game_concept:** Touch gesture handling for VTT grids
- **description:** Shared touch interaction extracted for reuse by both 2D and isometric grids. Handles: single-finger pan, pinch-to-zoom (with center-point tracking), tap detection (TOUCH_TAP_THRESHOLD=5px), one-finger-lift-from-pinch transition. Provides touch event handlers that modify pan/zoom refs and call render/onTap callbacks.
- **inputs:** Container ref, zoom/panOffset refs, min/max zoom, render callback, onTap callback
- **outputs:** Touch event handlers (touchstart, touchmove, touchend), isTouchPanning, isPinching
- **accessible_from:** gm, group

### vtt-grid-C032
- **name:** usePlayerGridView composable
- **type:** composable-function
- **location:** `app/composables/usePlayerGridView.ts`
- **game_concept:** Player view of VTT grid
- **description:** Read-only grid view for player devices. Displays served encounter grid without editing capabilities.
- **inputs:** Encounter data
- **outputs:** Grid rendering for player view
- **accessible_from:** player

## Utilities

### vtt-grid-C035
- **name:** ptuDiagonalDistance utility
- **type:** utility
- **location:** `app/utils/gridDistance.ts` — ptuDiagonalDistance()
- **game_concept:** PTU alternating diagonal movement cost
- **description:** Pure function implementing PTU diagonal movement rule: first diagonal costs 1m, second costs 2m, alternating. Formula: diagonals + floor(diagonals/2) + straights.
- **inputs:** dx: number, dy: number
- **outputs:** Movement cost in meters (cells)
- **accessible_from:** gm (via composables)

### vtt-grid-C036
- **name:** combatantCapabilities utility
- **type:** utility
- **location:** `app/utils/combatantCapabilities.ts`
- **game_concept:** Combatant movement capability queries
- **description:** Shared utility functions: combatantCanFly (Sky > 0), getSkySpeed, combatantCanSwim (Swim > 0), combatantCanBurrow (Burrow > 0). Checks Pokemon capabilities; humans default to 0 for all.
- **inputs:** Combatant object
- **outputs:** boolean (can fly/swim/burrow), number (sky speed)
- **accessible_from:** gm (via composables)

## Components

### vtt-grid-C040
- **name:** VTTContainer component
- **type:** component
- **location:** `app/components/vtt/VTTContainer.vue`
- **game_concept:** 2D/isometric mode switch
- **description:** Top-level container that renders either GridCanvas (2D) or IsometricCanvas (isometric) based on grid mode setting. Passes shared props (encounter data, grid config) to the active canvas.
- **inputs:** Grid mode, encounter data
- **outputs:** Renders appropriate canvas component
- **accessible_from:** gm, group

### vtt-grid-C041
- **name:** GridCanvas component
- **type:** component
- **location:** `app/components/vtt/GridCanvas.vue`
- **game_concept:** 2D grid canvas
- **description:** Classic 2D top-down grid canvas. Wires up useCanvasRendering, useGridRendering, useGridInteraction composables. Handles pan/zoom, token drag-and-drop, cell click.
- **inputs:** Encounter data, grid config
- **outputs:** Canvas render, interaction events
- **accessible_from:** gm, group

### vtt-grid-C042
- **name:** IsometricCanvas component (NEW)
- **type:** component
- **location:** `app/components/vtt/IsometricCanvas.vue`
- **game_concept:** Isometric 3D grid canvas
- **description:** Isometric diamond grid canvas. Wires up useIsometricRendering, useIsometricInteraction, useIsometricCamera, useElevation, useDepthSorting, useTouchInteraction composables. Handles camera rotation, elevation display, depth-sorted rendering.
- **inputs:** Encounter data, grid config, camera angle
- **outputs:** Isometric canvas render, interaction events
- **accessible_from:** gm, group

### vtt-grid-C043
- **name:** GroupGridCanvas component
- **type:** component
- **location:** `app/components/vtt/GroupGridCanvas.vue`
- **game_concept:** Group View grid display (2D and isometric)
- **description:** Read-only grid canvas for Group View display. Supports both 2D and isometric modes. Receives grid state via WebSocket, no editing controls. Applies fog of war for player-facing visibility.
- **inputs:** Encounter data, grid config, fog state
- **outputs:** Read-only grid render
- **accessible_from:** group

### vtt-grid-C044
- **name:** CameraControls component (NEW)
- **type:** component
- **location:** `app/components/vtt/CameraControls.vue`
- **game_concept:** Isometric camera rotation buttons
- **description:** Rotation control buttons for the isometric grid. Rotate left/right buttons trigger camera angle changes via useIsometricCamera.
- **inputs:** None (reads from isometric camera store)
- **outputs:** Rotation actions
- **accessible_from:** gm

### vtt-grid-C045
- **name:** ElevationToolbar component (NEW)
- **type:** component
- **location:** `app/components/vtt/ElevationToolbar.vue`
- **game_concept:** Token/terrain elevation editing
- **description:** Toolbar for adjusting token elevation and terrain elevation brush. Shows selected token's current elevation, raise/lower buttons. Terrain elevation brush for painting ground height in isometric mode.
- **inputs:** Selected token, elevation state
- **outputs:** Elevation change events
- **accessible_from:** gm

### vtt-grid-C046
- **name:** TerrainPainter component
- **type:** component
- **location:** `app/components/vtt/TerrainPainter.vue`
- **game_concept:** Terrain type painting tool
- **description:** Terrain type selector (6 types: normal, rough, water, ice, lava, blocked), brush size control, and elevation brush for isometric mode. Paints terrain onto grid cells.
- **inputs:** Current terrain type, brush size
- **outputs:** Terrain paint events
- **accessible_from:** gm

### vtt-grid-C047
- **name:** FogOfWarToolbar component
- **type:** component
- **location:** `app/components/vtt/FogOfWarToolbar.vue`
- **game_concept:** Fog of war editing controls
- **description:** Fog state toggle buttons (hidden/revealed/explored), fog brush size, reveal/hide area tools. GM-only controls for managing visibility.
- **inputs:** Current fog editing mode
- **outputs:** Fog edit events
- **accessible_from:** gm

### vtt-grid-C048
- **name:** MeasurementToolbar component
- **type:** component
- **location:** `app/components/vtt/MeasurementToolbar.vue`
- **game_concept:** PTU range measurement tool
- **description:** Measurement mode selector (distance, burst, cone, line, close-blast), range input. Activates measurement overlay rendering on the grid.
- **inputs:** Current measurement mode and range
- **outputs:** Measurement mode changes
- **accessible_from:** gm

### vtt-grid-C049
- **name:** VTTToken component
- **type:** component
- **location:** `app/components/vtt/VTTToken.vue`
- **game_concept:** Token display
- **description:** Individual token display with sprite, HP bar, status indicators, side color border, turn indicator glow.
- **inputs:** Combatant data, grid config
- **outputs:** Visual token render
- **accessible_from:** gm, group

### vtt-grid-C050
- **name:** ZoomControls / CoordinateDisplay / GridSettingsPanel / MapUploader components
- **type:** component
- **location:** `app/components/vtt/ZoomControls.vue`, `CoordinateDisplay.vue`, `GridSettingsPanel.vue`, `MapUploader.vue`
- **game_concept:** VTT utility controls
- **description:** ZoomControls: zoom +/- buttons. CoordinateDisplay: shows hovered cell coordinates. GridSettingsPanel: grid width, height, cell size, grid mode toggle (2D/isometric). MapUploader: background image upload for grid.
- **inputs:** Grid config, hover state
- **outputs:** Config changes, zoom changes, image uploads
- **accessible_from:** gm

## API Endpoints (Encounter-level, used by VTT)

### vtt-grid-C055
- **name:** Grid Position/Config/Background APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounters/[id]/position.post.ts`, `grid-config.put.ts`, `background.post.ts`, `background.delete.ts`
- **game_concept:** VTT grid persistence
- **description:** Position: update token position on grid. Grid config: update grid dimensions, cell size, grid mode. Background: upload/delete background image.
- **inputs:** Encounter ID, position/config/image data
- **outputs:** Updated encounter data
- **accessible_from:** gm

### vtt-grid-C056
- **name:** Fog of War APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounters/[id]/fog.get.ts`, `fog.put.ts`
- **game_concept:** Fog of war persistence
- **description:** Get/put fog state as 2D array of FogState values. Persisted on the Encounter model.
- **inputs:** Encounter ID, fog state array
- **outputs:** Fog state data
- **accessible_from:** gm

### vtt-grid-C057
- **name:** Terrain APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounters/[id]/terrain.get.ts`, `terrain.put.ts`
- **game_concept:** Terrain persistence
- **description:** Get/put terrain state as 2D array of terrain types and elevations. Persisted on the Encounter model.
- **inputs:** Encounter ID, terrain state data
- **outputs:** Terrain state data
- **accessible_from:** gm

## WebSocket Events

### vtt-grid-C060
- **name:** movement_preview WebSocket event
- **type:** websocket-event
- **location:** `app/server/routes/ws.ts`
- **game_concept:** Real-time token movement preview
- **description:** Broadcasts token movement previews from GM to Group View for real-time position syncing during drag operations.
- **inputs:** Combatant ID, preview position
- **outputs:** WebSocket message to group clients
- **accessible_from:** gm (send), group (receive)

## Capability Chains

### Chain 1: 2D Grid Rendering (GM)
`VTTContainer (C040)` → `GridCanvas (C041)` → `useCanvasRendering (C010)` + `useGridRendering (C012)` + `useCanvasDrawing (C011)` → canvas render
- **Accessibility:** gm, group (via GroupGridCanvas)

### Chain 2: Isometric Grid Rendering (NEW — GM)
`VTTContainer (C040)` → `IsometricCanvas (C042)` → `useIsometricRendering (C022)` + `useIsometricProjection (C020)` + `useIsometricOverlays (C024)` + `useDepthSorting (C025)` + `useElevation (C026)` → isometric canvas render
- **Accessibility:** gm, group (via GroupGridCanvas C043)

### Chain 3: Isometric Camera Control (NEW)
`CameraControls (C044)` → `useIsometricCamera (C021)` → `isometricCamera store (C006)` → triggers re-render
- **Accessibility:** gm

### Chain 4: Grid Interaction (GM, 2D)
`GridCanvas (C041)` → `useGridInteraction (C013)` + `useTouchInteraction (C031)` → token select/move → position API (C055)
- **Accessibility:** gm

### Chain 5: Grid Interaction (GM, Isometric — NEW)
`IsometricCanvas (C042)` → `useIsometricInteraction (C023)` + `useTouchInteraction (C031)` → `useIsometricProjection.screenToWorld (C020)` → token select/move → position API (C055)
- **Accessibility:** gm

### Chain 6: Pathfinding and Movement (NEW)
`useGridMovement (C014)` → `usePathfinding (C030)` → `ptuDiagonalDistance (C035)` + `terrain store (C003)` + `useElevation (C026)` → reachable cells, path
- **Accessibility:** gm

### Chain 7: Terrain Painting (GM)
`TerrainPainter (C046)` → `terrain store (C003)` → `useTerrainPersistence (C015)` → terrain API (C057)
- **Accessibility:** gm

### Chain 8: Fog of War (GM)
`FogOfWarToolbar (C047)` → `fogOfWar store (C002)` → fog API (C056)
- **Accessibility:** gm (edit), group+player (display)

### Chain 9: Measurement (GM)
`MeasurementToolbar (C048)` → `measurement store (C004)` → `useRangeParser (C016)` → overlay render
- **Accessibility:** gm

### Chain 10: Elevation Editing (NEW)
`ElevationToolbar (C045)` → `useElevation (C026)` → token/terrain elevation state → isometric render
- **Accessibility:** gm

### Chain 11: Group View Grid Display
`GroupGridCanvas (C043)` → reads encounter data via WebSocket → renders 2D or isometric grid (read-only)
- **Accessibility:** group

## Accessibility Summary

| Access Level | Capability IDs |
|---|---|
| **gm-only** | C004, C005, C013, C014, C015, C016, C023, C026, C030, C044, C045, C046, C047, C048, C050, C055, C056, C057 |
| **gm+group** | C001, C002, C003, C006, C010, C011, C012, C020, C021, C022, C024, C025, C031, C040, C041, C042, C043, C049, C060 |
| **gm+group+player** | C002 (fog display) |
| **player** | C032 (usePlayerGridView — read-only grid) |

## Missing Subsystems

### MS-1: No player-facing grid interaction
- **subsystem:** Players cannot interact with the VTT grid — no token movement, no measurement tools
- **actor:** player
- **ptu_basis:** PTU combat involves player-initiated movement and positioning. Players should be able to request token moves from their view.
- **impact:** GM must move all tokens on behalf of players. Players cannot plan movement or measure ranges independently.

### MS-2: No grid mode persistence
- **subsystem:** Grid mode (2D vs isometric) is not persisted per encounter — reverts on reload
- **actor:** gm
- **ptu_basis:** N/A (app feature, not PTU rule)
- **impact:** GM must re-select isometric mode each time they load an encounter that was previously in isometric mode.

### MS-3: No elevation persistence
- **subsystem:** Token elevations are client-side only — not saved to DB or synced via WebSocket
- **actor:** gm
- **ptu_basis:** PTU has vertical movement (flying, levitating) that persists across turns
- **impact:** Token elevations reset on page reload. Group view may not see correct elevations.

### MS-4: No player-facing movement request system
- **subsystem:** Players cannot request to move their token to a specific cell from the player view
- **actor:** player
- **ptu_basis:** PTU players declare their movement during their turn. A request system (player proposes, GM approves) would match the tabletop flow.
- **impact:** All movement must be verbally communicated and executed by the GM.
