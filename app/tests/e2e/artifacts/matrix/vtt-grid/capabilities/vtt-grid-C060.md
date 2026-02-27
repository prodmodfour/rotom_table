---
cap_id: vtt-grid-C060
name: vtt-grid-C060
type: —
domain: vtt-grid
---

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
