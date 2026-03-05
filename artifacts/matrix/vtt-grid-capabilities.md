# VTT Grid Domain -- Capability Catalog

**Domain**: vtt-grid
**Generated**: 2026-03-05
**Source session**: Re-mapping after sessions 12-26 (isometric grid P0-P2, flanking, pathfinding extraction, isometric overlays)

---

## Prisma Model Fields

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C001 | gridEnabled field | prisma-field | `app/prisma/schema.prisma` Encounter.gridEnabled | Grid toggle | Boolean flag controlling whether the VTT grid is active for an encounter. | Boolean | Boolean (default false) | gm |
| vtt-grid-C002 | gridWidth field | prisma-field | `app/prisma/schema.prisma` Encounter.gridWidth | Grid dimensions | Grid width in cells. | Int | Int (default 20) | gm, group, player |
| vtt-grid-C003 | gridHeight field | prisma-field | `app/prisma/schema.prisma` Encounter.gridHeight | Grid dimensions | Grid height in cells. | Int | Int (default 15) | gm, group, player |
| vtt-grid-C004 | gridCellSize field | prisma-field | `app/prisma/schema.prisma` Encounter.gridCellSize | Grid rendering | Pixel size per cell for rendering. | Int | Int (default 40) | gm, group, player |
| vtt-grid-C005 | gridBackground field | prisma-field | `app/prisma/schema.prisma` Encounter.gridBackground | Map background | Base64-encoded background image URL for the grid. | String? | String? (null = no background) | gm, group, player |
| vtt-grid-C006 | gridIsometric field | prisma-field | `app/prisma/schema.prisma` Encounter.gridIsometric | Isometric mode | Feature flag: false = flat 2D, true = isometric 3D projection. | Boolean | Boolean (default false) | gm, group, player |
| vtt-grid-C007 | gridCameraAngle field | prisma-field | `app/prisma/schema.prisma` Encounter.gridCameraAngle | Camera rotation | Cardinal rotation angle (0-3) for isometric view. | Int | Int (default 0) | gm, group, player |
| vtt-grid-C008 | gridMaxElevation field | prisma-field | `app/prisma/schema.prisma` Encounter.gridMaxElevation | Elevation cap | Maximum elevation levels for isometric mode. | Int | Int (default 5) | gm, group, player |
| vtt-grid-C009 | fogOfWarEnabled field | prisma-field | `app/prisma/schema.prisma` Encounter.fogOfWarEnabled | Fog of war | Whether fog of war is active for the encounter. | Boolean | Boolean (default false) | gm, group, player |
| vtt-grid-C010 | fogOfWarState field | prisma-field | `app/prisma/schema.prisma` Encounter.fogOfWarState | Fog of war | JSON-serialized fog state ({cells, defaultState}). | String (JSON) | String (JSON, default "{}") | gm, group, player |
| vtt-grid-C011 | terrainEnabled field | prisma-field | `app/prisma/schema.prisma` Encounter.terrainEnabled | Terrain system | Whether terrain overlay is active. | Boolean | Boolean (default false) | gm, group, player |
| vtt-grid-C012 | terrainState field | prisma-field | `app/prisma/schema.prisma` Encounter.terrainState | Terrain system | JSON-serialized terrain cells with types, flags, and elevation. | String (JSON) | String (JSON, default "{}") | gm, group, player |
| vtt-grid-C013 | combatant position field | prisma-field | `app/prisma/schema.prisma` Encounter.combatants (JSON) | Token placement | GridPosition {x, y, z?} stored per combatant inside the JSON combatants array. | GridPosition | GridPosition | gm, group, player |
| vtt-grid-C014 | combatant tokenSize field | prisma-field | `app/prisma/schema.prisma` Encounter.combatants (JSON) | Multi-cell tokens | Token footprint size (1=1x1, 2=2x2 for Large, etc.) stored per combatant. | number | number | gm, group, player |

## Type Definitions

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C015 | GridPosition type | constant | `app/types/spatial.ts` GridPosition | Grid coordinates | Cell coordinates with optional Z elevation for isometric mode. | -- | {x, y, z?} | gm, group, player |
| vtt-grid-C016 | GridConfig type | constant | `app/types/spatial.ts` GridConfig | Grid configuration | Full grid configuration including isometric settings. | -- | {enabled, width, height, cellSize, background?, isometric, cameraAngle, maxElevation} | gm, group, player |
| vtt-grid-C017 | TokenState type | constant | `app/types/spatial.ts` TokenState | Token representation | Combatant representation on the grid with position, size, visibility, elevation. | -- | {combatantId, position, size, visible, elevation} | gm, group, player |
| vtt-grid-C018 | TerrainCell type | constant | `app/types/spatial.ts` TerrainCell | Terrain data | Multi-tag terrain cell with base type, flags (rough/slow), elevation, and optional note. Per decree-010. | -- | {position, type, flags, elevation, note?} | gm, group, player |
| vtt-grid-C019 | TerrainType enum | constant | `app/types/spatial.ts` TerrainType | Terrain classification | Base terrain types: normal, difficult (legacy), blocking, water, earth, rough (legacy), hazard, elevated. | -- | string union | gm, group, player |
| vtt-grid-C020 | TerrainFlags type | constant | `app/types/spatial.ts` TerrainFlags | Terrain modifiers | Movement modifier flags: rough (-2 accuracy, decree-010), slow (double cost, decree-010). | -- | {rough, slow} | gm, group, player |
| vtt-grid-C021 | MovementPath type | constant | `app/types/spatial.ts` MovementPath | Movement validation | Path from start to end with cost, validity, and reason. | -- | {start, end, path[], totalCost, valid, reason?} | gm, group, player |
| vtt-grid-C022 | CameraAngle type | constant | `app/types/spatial.ts` CameraAngle | Isometric camera | Camera rotation: 0-3 for N/E/S/W cardinal views. | -- | 0|1|2|3 | gm, group, player |
| vtt-grid-C023 | ParsedRange type | constant | `app/types/spatial.ts` ParsedRange | Move range parsing | Parsed range from PTU move data (type + distance). | -- | {type, distance} | gm, group, player |
| vtt-grid-C024 | RangeType enum | constant | `app/types/spatial.ts` RangeType | PTU range types | All PTU range types: melee, ranged, self, burst, cone, line, close-blast, ranged-blast, cardinally-adjacent, field. | -- | string union | gm, group, player |
| vtt-grid-C025 | MovementPreview type | constant | `app/types/encounter.ts` MovementPreview | Movement broadcast | Preview data for broadcasting movement to group view via WebSocket. | -- | {combatantId, fromPosition, toPosition, distance, isValid} | gm, group |
| vtt-grid-C026 | FlankingStatus type | constant | `app/types/combat.ts` FlankingStatus | Flanking detection | Result of flanking detection for a single combatant. | -- | {isFlanked, flankerIds, effectiveFoeCount, requiredFoes} | gm, group, player |
| vtt-grid-C027 | FlankingMap type | constant | `app/types/combat.ts` FlankingMap | Flanking state | Map of combatant ID to FlankingStatus for the entire encounter. | -- | Record<string, FlankingStatus> | gm, group, player |
| vtt-grid-C028 | VTTWebSocketEvent type | constant | `app/types/spatial.ts` VTTWebSocketEvent | WebSocket protocol | Discriminated union of position_update, grid_config_update, terrain_update, token_size_update. | -- | union type | gm, group |
| vtt-grid-C029 | TerrainCostGetter type | constant | `app/types/vtt.ts` TerrainCostGetter | Pathfinding | Function type: returns movement cost multiplier at grid position. Infinity for impassable. | (x, y) | number | gm, group, player |
| vtt-grid-C030 | ElevationCostGetter type | constant | `app/types/vtt.ts` ElevationCostGetter | Elevation movement | Function type: returns cost for transitioning between two elevation levels. | (fromZ, toZ) | number | gm, group, player |
| vtt-grid-C031 | TerrainElevationGetter type | constant | `app/types/vtt.ts` TerrainElevationGetter | Terrain elevation | Function type: returns ground elevation at a grid position. | (x, y) | number | gm, group, player |
| vtt-grid-C032 | MovementSpeeds type | constant | `app/types/spatial.ts` MovementSpeeds | PTU movement | Movement capabilities from species data: overland, swim, sky, burrow, levitate, teleport. | -- | {overland, swim, sky, burrow, levitate, teleport} | gm, group, player |
| vtt-grid-C033 | EnvironmentPreset type | constant | `app/types/encounter.ts` EnvironmentPreset | Environment modifiers | Named collection of mechanical effects (accuracy penalty, terrain override, status trigger, movement modifier, custom). | -- | {id, name, description, effects[]} | gm |

## API Endpoints

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C034 | Update combatant position | api-endpoint | `app/server/api/encounters/[id]/position.post.ts` | Token movement | Updates a combatant's grid position. Handles linked movement for mounted pairs (feature-004) and Living Weapon pairs (feature-005). Validates position within grid bounds. | {combatantId, position: {x, y}} | {combatantId, position} | gm |
| vtt-grid-C035 | Update grid config | api-endpoint | `app/server/api/encounters/[id]/grid-config.put.ts` | Grid settings | Updates grid configuration (enabled, width, height, cellSize, background, isometric, cameraAngle, maxElevation). Validates dimension ranges. | Partial<GridConfig> | GridConfig | gm |
| vtt-grid-C036 | Get fog state | api-endpoint | `app/server/api/encounters/[id]/fog.get.ts` | Fog of war | Retrieves persisted fog of war state (enabled flag, cell states, default state). | encounterId (path) | {enabled, cells, defaultState} | gm, group, player |
| vtt-grid-C037 | Update fog state | api-endpoint | `app/server/api/encounters/[id]/fog.put.ts` | Fog of war | Persists fog of war state. Merges with existing state if partial update. | {enabled?, cells?, defaultState?} | {enabled, cells, defaultState} | gm |
| vtt-grid-C038 | Get terrain state | api-endpoint | `app/server/api/encounters/[id]/terrain.get.ts` | Terrain system | Retrieves persisted terrain state (enabled flag, terrain cells). | encounterId (path) | {enabled, cells[]} | gm, group, player |
| vtt-grid-C039 | Update terrain state | api-endpoint | `app/server/api/encounters/[id]/terrain.put.ts` | Terrain system | Persists terrain state. Validates cells with Zod schema (position, type, elevation, flags). | {enabled?, cells?[]} | {enabled, cells[]} | gm |
| vtt-grid-C040 | Upload background image | api-endpoint | `app/server/api/encounters/[id]/background.post.ts` | Map background | Accepts multipart form upload (JPEG/PNG/GIF/WebP, max 5MB), stores as base64 data URL. | FormData with file | {background: dataUrl} | gm |
| vtt-grid-C041 | Remove background image | api-endpoint | `app/server/api/encounters/[id]/background.delete.ts` | Map background | Removes the background image from the encounter grid. | encounterId (path) | {background: null} | gm |

## Service Functions

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C042 | sizeToTokenSize | service-function | `app/server/services/grid-placement.service.ts` sizeToTokenSize | Size mapping | Maps PTU size category string to grid token size (Small/Medium=1, Large=2, Huge=3, Gigantic=4). | size: string | number | api-only |
| vtt-grid-C043 | buildOccupiedCellsSet | service-function | `app/server/services/grid-placement.service.ts` buildOccupiedCellsSet | Collision detection | Builds a set of all occupied grid cells from combatant positions and token sizes. | combatants[] | Set<string> | api-only |
| vtt-grid-C044 | findPlacementPosition | service-function | `app/server/services/grid-placement.service.ts` findPlacementPosition | Auto-placement | Finds next available grid position for a token on a given side (players left, enemies right). Tries side-designated columns first, falls back to anywhere. Mutates occupied set. | occupiedCells, side, tokenSize, gridWidth, gridHeight | {x, y} | api-only |

## Utility Functions

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C045 | ptuDiagonalDistance | utility | `app/utils/gridDistance.ts` ptuDiagonalDistance | PTU diagonal rule | Calculates distance using PTU alternating diagonal rule (1-2-1-2). Closed-form: diagonals + floor(diagonals/2) + straights. | dx, dy | number (meters) | gm, group, player |
| vtt-grid-C046 | ptuDistanceTokensBBox | utility | `app/utils/gridDistance.ts` ptuDistanceTokensBBox | Edge-to-edge distance | Calculates minimum PTU distance between two token bounding boxes. Returns 0 when tokens overlap. Per decree-002. | TokenFootprintRect a, b | number (meters) | gm, group, player |
| vtt-grid-C047 | maxDiagonalCells | utility | `app/utils/gridDistance.ts` maxDiagonalCells | Diagonal line AoE | Calculates max diagonal cells reachable within a meter budget using alternating diagonal rule. Used by Line attacks (decree-009). | budget: number | number (cells) | gm, group, player |
| vtt-grid-C048 | areAdjacent | utility | `app/utils/adjacency.ts` areAdjacent | Adjacency detection | Checks if two multi-cell tokens are adjacent (8-directional). For AoO, flanking, intercept. | posA, sizeA, posB, sizeB | boolean | gm, group, player |
| vtt-grid-C049 | getTokenCells | utility | `app/utils/adjacency.ts` getTokenCells | Token footprint | Returns all cells occupied by a token at a given position with a given size. | position, size | GridPosition[] | gm, group, player |
| vtt-grid-C050 | getAdjacentCellsForFootprint | utility | `app/utils/adjacency.ts` getAdjacentCellsForFootprint | Adjacency ring | Returns cells adjacent to a set of occupied cells (8-directional), excluding the occupied cells themselves. | cells[] | GridPosition[] | gm, group, player |
| vtt-grid-C051 | getAdjacentCombatants | utility | `app/utils/adjacency.ts` getAdjacentCombatants | Combat adjacency | Returns all combatants adjacent to a given combatant using grid positions and token sizes. | combatantId, combatants[] | Combatant[] | gm, group, player |
| vtt-grid-C052 | getAdjacentEnemies | utility | `app/utils/adjacency.ts` getAdjacentEnemies | Enemy adjacency | Returns adjacent enemy combatants filtered by side (enemies vs players/allies). | combatantId, combatants[] | Combatant[] | gm, group, player |
| vtt-grid-C053 | wasAdjacentBeforeMove | utility | `app/utils/adjacency.ts` wasAdjacentBeforeMove | AoO trigger detection | Checks if an observer was adjacent before a move and is no longer adjacent after. For shift_away AoO. | moverOldPos, moverNewPos, moverSize, observerPos, observerSize | boolean | gm, group, player |
| vtt-grid-C054 | sizeToFootprint | utility | `app/utils/sizeCategory.ts` sizeToFootprint | Size category mapping | Converts PTU size category to token footprint (Small/Medium=1, Large=2, Huge=3, Gigantic=4). | size: string | number | gm, group, player |
| vtt-grid-C055 | getFootprintCells | utility | `app/utils/sizeCategory.ts` getFootprintCells | Token footprint | Returns all cells occupied by an NxN footprint at a position. | x, y, size | {x, y}[] | gm, group, player |
| vtt-grid-C056 | isFootprintInBounds | utility | `app/utils/sizeCategory.ts` isFootprintInBounds | Bounds check | Checks if all cells of a footprint are within grid bounds. | x, y, size, gridWidth, gridHeight | boolean | gm, group, player |
| vtt-grid-C057 | checkFlankingMultiTile | utility | `app/utils/flankingGeometry.ts` checkFlankingMultiTile | Flanking geometry | Pure geometry function for PTU flanking: checks if sufficient non-adjacent foes surround a target. Handles multi-tile tokens (Large 2x2 needs 3, Huge 3x3 needs 4, Gigantic 4x4 needs 5). Multi-tile attackers count as multiple foes per adjacent cells. | targetPos, targetSize, foes[] | {isFlanked, flankerIds, effectiveFoeCount, requiredFoes} | gm, group, player |
| vtt-grid-C058 | FLANKING_EVASION_PENALTY | constant | `app/utils/flankingGeometry.ts` | Flanking penalty | PTU p.232: -2 to Physical, Special, and Speed evasion when flanked. | -- | 2 | gm, group, player |
| vtt-grid-C059 | FLANKING_FOES_REQUIRED | constant | `app/utils/flankingGeometry.ts` | Flanking thresholds | Map of token size to required non-adjacent foes: 1->2, 2->3, 3->4, 4->5. | -- | Record<number, number> | gm, group, player |
| vtt-grid-C060 | applyMovementModifiers | utility | `app/utils/movementModifiers.ts` applyMovementModifiers | Movement conditions | Applies Stuck (=0), Tripped (=0), Slowed (half), Speed CS bonus/penalty, Sprint (+50%), Thermosensitive Hail halving to base speed. Shared by client and server. | combatant, speed, weather? | number | gm, group, player |
| vtt-grid-C061 | TERRAIN_COSTS | constant | `app/stores/terrain.ts` | Terrain movement costs | Base movement costs per terrain type: normal=1, blocking=Infinity, water=1 (decree-008), earth=Infinity (needs burrow), hazard=1, elevated=1. | -- | Record<TerrainType, number> | gm, group, player |
| vtt-grid-C062 | TERRAIN_COLORS | constant | `app/stores/terrain.ts` | Terrain display | Fill and stroke colors for each terrain type for rendering. | -- | Record<TerrainType, {fill, stroke}> | gm, group, player |
| vtt-grid-C063 | migrateLegacyCell | utility | `app/stores/terrain.ts` migrateLegacyCell | Backward compatibility | Converts legacy single-type terrain cells (difficult, rough) to multi-tag format (normal + flags). | cell | TerrainCell | gm |

## Stores

### encounterGrid Store (API-only, stateless ISP)

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C064 | updateCombatantPosition | store-action | `app/stores/encounterGrid.ts` | Token movement | Calls POST /api/encounters/:id/position to update a combatant's grid position. | encounterId, combatantId, position | GridPosition | gm |
| vtt-grid-C065 | updateGridConfig | store-action | `app/stores/encounterGrid.ts` | Grid settings | Calls PUT /api/encounters/:id/grid-config to update grid configuration. | encounterId, config | Partial<GridConfig> | gm |
| vtt-grid-C066 | setTokenSize | store-action | `app/stores/encounterGrid.ts` | Token sizing | Updates a combatant's token size by PUTting the full encounter. | encounterId, encounter, combatantId, size | number | gm |
| vtt-grid-C067 | uploadBackgroundImage | store-action | `app/stores/encounterGrid.ts` | Map upload | Calls POST /api/encounters/:id/background with FormData to upload a background image. | encounterId, file | string (URL) | gm |
| vtt-grid-C068 | removeBackgroundImage | store-action | `app/stores/encounterGrid.ts` | Map removal | Calls DELETE /api/encounters/:id/background to remove the background image. | encounterId | void | gm |
| vtt-grid-C069 | loadFogState | store-action | `app/stores/encounterGrid.ts` | Fog persistence | Calls GET /api/encounters/:id/fog to load fog of war state from server. | encounterId | {enabled, cells, defaultState} | gm |
| vtt-grid-C070 | saveFogState | store-action | `app/stores/encounterGrid.ts` | Fog persistence | Calls PUT /api/encounters/:id/fog to save fog of war state to server. | encounterId, fogState | void | gm |

### fogOfWar Store

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C071 | isVisible getter | store-getter | `app/stores/fogOfWar.ts` | Fog visibility | Checks if a cell is visible (revealed or explored). | x, y | boolean | gm, group, player |
| vtt-grid-C072 | getCellState getter | store-getter | `app/stores/fogOfWar.ts` | Fog state query | Returns the fog state of a specific cell (hidden/revealed/explored). | x, y | FogState | gm, group, player |
| vtt-grid-C073 | revealedCells getter | store-getter | `app/stores/fogOfWar.ts` | Fog enumeration | Returns all cells in 'revealed' state as an array. | -- | GridPosition[] | gm, group, player |
| vtt-grid-C074 | exploredCells getter | store-getter | `app/stores/fogOfWar.ts` | Fog enumeration | Returns all cells in 'explored' state as an array. | -- | GridPosition[] | gm, group, player |
| vtt-grid-C075 | visibleCount getter | store-getter | `app/stores/fogOfWar.ts` | Fog stats | Count of visible (revealed + explored) cells. | -- | number | gm, group, player |
| vtt-grid-C076 | setEnabled | store-action | `app/stores/fogOfWar.ts` | Fog toggle | Enables or disables fog of war. | enabled: boolean | void | gm |
| vtt-grid-C077 | setToolMode | store-action | `app/stores/fogOfWar.ts` | Fog tool | Sets the current fog tool (reveal/hide/explore). | mode | void | gm |
| vtt-grid-C078 | setBrushSize | store-action | `app/stores/fogOfWar.ts` | Fog brush | Sets brush size (1-10) for fog painting. | size | void | gm |
| vtt-grid-C079 | revealCell / hideCell / exploreCell | store-action | `app/stores/fogOfWar.ts` | Fog cell ops | Sets a single cell to revealed, hidden, or explored state. | x, y | void | gm |
| vtt-grid-C080 | revealArea / hideArea / exploreArea | store-action | `app/stores/fogOfWar.ts` | Fog area ops | Applies fog tool to a circular area using Chebyshev distance (PTU rules). | centerX, centerY, radius | void | gm |
| vtt-grid-C081 | revealFootprintArea | store-action | `app/stores/fogOfWar.ts` | Multi-cell fog reveal | Reveals cells visible from a multi-cell token footprint within Chebyshev radius. Not yet wired to auto-reveal on movement. | originX, originY, size, radius | void | gm |
| vtt-grid-C082 | applyTool | store-action | `app/stores/fogOfWar.ts` | Fog painting | Applies current tool (reveal/hide/explore) at position with current brush size. | x, y | void | gm |
| vtt-grid-C083 | revealRect / hideRect | store-action | `app/stores/fogOfWar.ts` | Fog rectangle ops | Reveals or hides all cells in a rectangular area. | x1, y1, x2, y2 | void | gm |
| vtt-grid-C084 | revealAll / hideAll | store-action | `app/stores/fogOfWar.ts` | Fog bulk ops | Reveals all cells or hides all cells (clears map). | gridWidth?, gridHeight? | void | gm |
| vtt-grid-C085 | importState / exportState | store-action | `app/stores/fogOfWar.ts` | Fog serialization | Imports/exports fog state for persistence (cells array + defaultState). | data | {cells, defaultState} | gm |

### terrain Store

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C086 | getTerrainAt getter | store-getter | `app/stores/terrain.ts` | Terrain query | Returns base terrain type at a position. | x, y | TerrainType | gm, group, player |
| vtt-grid-C087 | getFlagsAt getter | store-getter | `app/stores/terrain.ts` | Terrain flags query | Returns movement flags (rough/slow) at a position. | x, y | TerrainFlags | gm, group, player |
| vtt-grid-C088 | getCellAt getter | store-getter | `app/stores/terrain.ts` | Terrain cell query | Returns full TerrainCell data at a position. | x, y | TerrainCell | null | gm, group, player |
| vtt-grid-C089 | getMovementCost getter | store-getter | `app/stores/terrain.ts` | Terrain movement cost | Aggregates base terrain cost + slow flag doubling. Checks swim/burrow capability. Per decree-010. | x, y, canSwim?, canBurrow? | number | gm, group, player |
| vtt-grid-C090 | isPassable getter | store-getter | `app/stores/terrain.ts` | Terrain passability | Checks if a cell is passable given swim/burrow capability. Blocking always impassable. | x, y, canSwim?, canBurrow? | boolean | gm, group, player |
| vtt-grid-C091 | isRoughAt / isSlowAt getters | store-getter | `app/stores/terrain.ts` | Terrain flag checks | Checks if a cell has the rough or slow flag specifically. | x, y | boolean | gm, group, player |
| vtt-grid-C092 | allCells / getCellsByType getters | store-getter | `app/stores/terrain.ts` | Terrain enumeration | Returns all terrain cells or cells filtered by type. | type? | TerrainCell[] | gm, group, player |
| vtt-grid-C093 | setEnabled | store-action | `app/stores/terrain.ts` | Terrain toggle | Enables or disables terrain editing mode. | enabled: boolean | void | gm |
| vtt-grid-C094 | setPaintMode / setPaintFlags / togglePaintFlag | store-action | `app/stores/terrain.ts` | Terrain brush config | Configures the terrain painting tool (base type, flags). Handles legacy type conversion. | mode/flags | void | gm |
| vtt-grid-C095 | setTerrain | store-action | `app/stores/terrain.ts` | Terrain cell set | Sets terrain at a single cell with type, flags, elevation, note. Runtime legacy type conversion. Removes cell if fully default. | x, y, type, flags?, elevation?, note? | void | gm |
| vtt-grid-C096 | clearTerrain | store-action | `app/stores/terrain.ts` | Terrain cell clear | Resets a single cell to normal terrain. | x, y | void | gm |
| vtt-grid-C097 | applyTool / eraseTool | store-action | `app/stores/terrain.ts` | Terrain painting | Applies or erases terrain at position with current brush size (Chebyshev distance). | x, y, elevation? | void | gm |
| vtt-grid-C098 | fillRect | store-action | `app/stores/terrain.ts` | Terrain fill | Fills a rectangular area with a terrain type and flags. | x1, y1, x2, y2, type, flags? | void | gm |
| vtt-grid-C099 | drawLine | store-action | `app/stores/terrain.ts` | Terrain wall drawing | Draws a line of terrain using Bresenham's algorithm (for walls). | x1, y1, x2, y2, type, flags? | void | gm |
| vtt-grid-C100 | importState / exportState | store-action | `app/stores/terrain.ts` | Terrain serialization | Imports (with legacy migration) / exports terrain state for persistence. | data | {cells[]} | gm |

### measurement Store

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C101 | distance getter | store-getter | `app/stores/measurement.ts` | Distance measurement | Calculates PTU diagonal distance between start/end. Uses edge-to-edge for multi-cell tokens via ptuDistanceTokensBBox. | -- | number | gm, group, player |
| vtt-grid-C102 | affectedCells getter | store-getter | `app/stores/measurement.ts` | AoE calculation | Returns affected cells based on mode: distance (Bresenham line), burst (PTU diagonal radius), cone (fixed 3m width per decree-007), line (diagonal shortened per decree-009), close-blast (adjacent square). | -- | GridPosition[] | gm, group, player |
| vtt-grid-C103 | setMode | store-action | `app/stores/measurement.ts` | Measurement mode | Sets measurement mode (none/distance/burst/cone/line/close-blast). | mode | void | gm, group, player |
| vtt-grid-C104 | startMeasurement / updateMeasurement / endMeasurement / clearMeasurement | store-action | `app/stores/measurement.ts` | Measurement lifecycle | Manages measurement state with multi-cell token metadata for edge-to-edge distance. | position, tokenOrigin?, tokenSize? | void | gm, group, player |
| vtt-grid-C105 | setAoeSize / setAoeDirection / cycleDirection | store-action | `app/stores/measurement.ts` | AoE configuration | Sets AoE size (1-10), direction (8 cardinal/diagonal), or cycles through directions. | size/direction | void | gm, group, player |

### selection Store

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C106 | select / addToSelection / removeFromSelection / toggleSelection | store-action | `app/stores/selection.ts` | Token selection | Single and additive token selection operations via Set<string>. | id: string | void | gm |
| vtt-grid-C107 | selectMultiple / addMultipleToSelection / clearSelection | store-action | `app/stores/selection.ts` | Multi-select | Bulk selection operations. | ids: string[] | void | gm |
| vtt-grid-C108 | startMarquee / updateMarquee / endMarquee / selectInRect | store-action | `app/stores/selection.ts` | Marquee selection | Drag-to-select rectangle operations with multi-cell token overlap detection. | position/rect, tokenPositions | void | gm |

### isometricCamera Store

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C109 | setAngle | store-action | `app/stores/isometricCamera.ts` | Camera angle | Sets camera rotation angle directly (0-3). Used on server load and WebSocket sync. | angle: CameraAngle | void | gm, group |
| vtt-grid-C110 | rotateClockwise / rotateCounterClockwise | store-action | `app/stores/isometricCamera.ts` | Camera rotation | Rotates camera 90 degrees. Sets target angle for animation; composable handles transition. | -- | void | gm |
| vtt-grid-C111 | completeRotation | store-action | `app/stores/isometricCamera.ts` | Camera snap | Snaps to target angle after rotation animation completes. | -- | void | gm |
| vtt-grid-C112 | setZoom | store-action | `app/stores/isometricCamera.ts` | Camera zoom | Sets zoom level (clamped 0.25-3.0). | level: number | void | gm, group |

## Composable Functions

### useGridMovement

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C113 | calculateMoveDistance | composable-function | `app/composables/useGridMovement.ts` | Geometric distance | Calculates PTU diagonal distance between two grid positions (no terrain). | from, to | number | gm, group, player |
| vtt-grid-C114 | getSpeed | composable-function | `app/composables/useGridMovement.ts` | Movement speed | Gets terrain-aware movement speed for a combatant: swim for water, burrow for earth, overland default. Applies movement modifiers (Stuck, Slowed, Sprint, Speed CS). Handles mounted and Living Weapon shared pools. | combatantId | number | gm, group, player |
| vtt-grid-C115 | getMaxPossibleSpeed | composable-function | `app/composables/useGridMovement.ts` | Max speed budget | Gets the maximum possible movement speed across all capabilities (highest of Overland, Swim, Burrow) with modifiers applied. Used as exploration budget for A* and flood-fill. | combatantId | number | gm, group, player |
| vtt-grid-C116 | getAveragedSpeedForPath | composable-function | `app/composables/useGridMovement.ts` | Speed averaging | Computes averaged speed when path crosses terrain boundaries (PTU p.231, decree-011). Iterates full NxN footprint for multi-cell tokens. | combatantId, path[] | number | gm, group, player |
| vtt-grid-C117 | buildSpeedAveragingFn | composable-function | `app/composables/useGridMovement.ts` | Averaging callback | Builds a speed averaging callback for flood-fill pathfinding. Returns function that computes averaged speed given terrain type set. | combatantId | (terrainTypes) => number | gm, group, player |
| vtt-grid-C118 | isValidMove | composable-function | `app/composables/useGridMovement.ts` | Movement validation | Full movement validation: terrain-aware A* pathfinding, elevation cost, speed averaging, no-stacking rule (decree-003), bounds checking. | fromPos, toPos, combatantId, gridWidth, gridHeight | {valid, distance, blocked} | gm, group, player |
| vtt-grid-C119 | calculateTerrainAwarePathCost | composable-function | `app/composables/useGridMovement.ts` | Path cost | Calculates terrain-aware path cost using A* with PTU diagonal rules and elevation. Returns cost and path. | from, to, combatantId | {cost, path[]} | null | gm, group, player |
| vtt-grid-C120 | getTerrainCostForCombatant | composable-function | `app/composables/useGridMovement.ts` | Combatant terrain cost | Gets terrain cost at position factoring in combatant's swim/burrow capabilities and Naturewalk bypass (PTU p.322). | x, y, combatantId | number | gm, group, player |
| vtt-grid-C121 | getOccupiedCells | composable-function | `app/composables/useGridMovement.ts` | Stacking detection | Returns all cells occupied by tokens (excluding a given combatant). Multi-cell tokens iterate full NxN footprint. Per decree-003. | excludeCombatantId? | GridPosition[] | gm, group, player |
| vtt-grid-C122 | getEnemyOccupiedCells | composable-function | `app/composables/useGridMovement.ts` | Enemy rough terrain | Returns cells occupied by enemy combatants (per decree-003: enemy squares count as Rough Terrain for accuracy). | combatantId | GridPosition[] | gm, group, player |
| vtt-grid-C123 | getAoOTriggersForMove | composable-function | `app/composables/useGridMovement.ts` | AoO preview | Client-side preview of which enemies would get AoO if a combatant moves. Checks adjacency shift, respects Disengage, filters by status conditions (AOO_BLOCKING_CONDITIONS). | combatantId, from, to | string[] (enemy IDs) | gm |
| vtt-grid-C124 | calculateElevationCost | composable-function | `app/composables/useGridMovement.ts` calculateElevationCost | Elevation movement | Calculates elevation change cost: 1 MP per level. Flying Pokemon (Sky speed > 0) ignore cost within their Sky range. | fromZ, toZ, combatant? | number | gm, group, player |

### useGridRendering

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C125 | render | composable-function | `app/composables/useGridRendering.ts` | 2D rendering | Main canvas render loop: clears canvas, applies pan/zoom, draws background, terrain, grid lines, movement range overlay, movement preview arrow, external movement preview, measurement overlay, fog of war (player opaque / GM preview). | canvas, config, state | void (draws to canvas) | gm, group, player |
| vtt-grid-C126 | loadBackgroundImage | composable-function | `app/composables/useGridRendering.ts` | Background display | Loads background image from config URL and triggers re-render. | -- | void | gm, group, player |
| vtt-grid-C127 | drawMovementRange | composable-function | `app/composables/useGridRendering.ts` | Movement range overlay | Draws reachable cells for selected token using flood-fill with terrain-type-aware speed averaging. Shows speed badge and ghost footprint for large tokens. | ctx | void | gm, group, player |
| vtt-grid-C128 | drawMovementPreview | composable-function | `app/composables/useGridRendering.ts` | Movement arrow | Draws movement preview arrow with distance label and validity indicator (valid=cyan, invalid=red). Shows "Occupied" or "Out of range" messages. | ctx | void | gm |
| vtt-grid-C129 | drawExternalMovementPreview | composable-function | `app/composables/useGridRendering.ts` | WebSocket movement preview | Draws movement preview received from WebSocket for group view. Includes movement range overlay and arrow. | ctx, preview | void | group |

### useGridInteraction

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C130 | screenToGrid | composable-function | `app/composables/useGridInteraction.ts` | Coordinate conversion | Converts screen pixel coordinates to grid cell coordinates (reverse pan/zoom transform). | screenX, screenY | GridPosition | gm, group, player |
| vtt-grid-C131 | getTokenAtPosition | composable-function | `app/composables/useGridInteraction.ts` | Token hit-test | Finds token at a grid position, checking full NxN footprint for multi-cell tokens. | gridPos | TokenData | undefined | gm, group, player |
| vtt-grid-C132 | handleWheel (zoom) | composable-function | `app/composables/useGridInteraction.ts` | Zoom control | Mouse wheel zoom (0.25-3.0) centered on mouse position. | WheelEvent | void | gm, group, player |
| vtt-grid-C133 | handleMouseDown/Move/Up | composable-function | `app/composables/useGridInteraction.ts` | Mouse interaction | Full mouse interaction pipeline: panning (middle/right click), token selection/move, measurement, fog painting, terrain painting, marquee selection. | MouseEvent | void | gm, group, player |
| vtt-grid-C134 | handleTokenSelect | composable-function | `app/composables/useGridInteraction.ts` | Click-to-move | Token selection enters move mode. Subsequent cell click validates and executes move. Shift/Ctrl for multi-select. | combatantId, event? | void | gm |
| vtt-grid-C135 | handleKeyDown | composable-function | `app/composables/useGridInteraction.ts` | Keyboard shortcuts | GM keyboard shortcuts: Ctrl+A (select all), Escape (clear), M (distance measure), B (burst), C (cone), R (rotate AoE), +/- (AoE size), W (movement range), F (fog toggle), T (terrain toggle), V/H/E (fog tools), [/] (brush size). | KeyboardEvent | void | gm |
| vtt-grid-C136 | touch interaction | composable-function | `app/composables/useGridInteraction.ts` via useTouchInteraction | Touch support | Touch pan, pinch-to-zoom, tap-to-select via delegated useTouchInteraction composable. | TouchEvent | void | gm, group, player |

### usePathfinding

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C137 | getMovementRangeCells | composable-function | `app/composables/usePathfinding.ts` | Movement range flood-fill | Dijkstra-based flood-fill finding all reachable cells within movement budget. Accounts for terrain costs, elevation costs, PTU diagonal rules, multi-cell token footprints, grid bounds. | origin, speed, blockedCells, terrainCost?, elevCost?, terrainElev?, originElev, tokenSize, gridBounds | GridPosition[] | gm, group, player |
| vtt-grid-C138 | getMovementRangeCellsWithAveraging | composable-function | `app/composables/usePathfinding.ts` | Averaging flood-fill | Enhanced flood-fill that tracks terrain types along each path and applies speed averaging when crossing terrain boundaries (PTU p.231, decree-011). | origin, maxSpeed, blocked, terrainCost, terrainTypeGetter, averagingFn, elevCost?, terrainElev?, originElev, tokenSize, gridBounds | GridPosition[] | gm, group, player |
| vtt-grid-C139 | calculatePathCost | composable-function | `app/composables/usePathfinding.ts` | A* pathfinding | A* pathfinding with terrain costs, elevation, PTU diagonal rules, and multi-cell footprints. Returns optimal path and cost. | from, to, blocked, terrainCost?, elevCost?, terrainElev?, fromElev, tokenSize | {cost, path[]} | null | gm, group, player |
| vtt-grid-C140 | calculateMoveCost | composable-function | `app/composables/usePathfinding.ts` | Move cost | Calculates total movement cost for a path including terrain and elevation. | from, to, blocked, terrainCost?, elevCost?, terrainElev?, fromElev | number | gm, group, player |
| vtt-grid-C141 | validateMovement | composable-function | `app/composables/usePathfinding.ts` | Move validation | Validates if a movement is legal within speed budget. | from, to, speed, blocked, terrainCost?, elevCost?, terrainElev?, fromElev | {valid, cost, path} | gm, group, player |

### useRangeParser

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C142 | parseRange | composable-function | `app/composables/useRangeParser.ts` | Range parsing | Parses PTU move range strings (e.g., "Melee", "6, 1 Target", "Burst 2") into structured ParsedRange objects. | rangeString | ParsedRange | gm, group, player |
| vtt-grid-C143 | isInRange | composable-function | `app/composables/useRangeParser.ts` | Range check | Checks if a target is within range of an attacker using PTU distance rules. | attackerPos, attackerSize, targetPos, targetSize, range | boolean | gm, group, player |
| vtt-grid-C144 | getAffectedCells | composable-function | `app/composables/useRangeParser.ts` | AoE computation | Computes cells affected by an AoE move (burst, cone, line, close-blast, ranged-blast). | origin, range, direction? | GridPosition[] | gm, group, player |
| vtt-grid-C145 | isTargetHitByAoE | composable-function | `app/composables/useRangeParser.ts` | AoE hit detection | Checks if any cell of a multi-cell token's footprint is within the affected area. | targetPos, targetSize, affectedCells | boolean | gm, group, player |
| vtt-grid-C146 | ptuDistanceTokens | composable-function | `app/composables/useRangeParser.ts` | Token distance | Calculates PTU distance between two tokens considering footprint size. | posA, sizeA, posB, sizeB | number | gm, group, player |
| vtt-grid-C147 | closestCellPair | composable-function | `app/composables/useRangeParser.ts` | Closest cells | Finds the closest cell pair between two multi-cell tokens for distance calculation. | tokenA, tokenB | {from, to} | gm, group, player |

### useFlankingDetection

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C148 | flankingMap computed | composable-function | `app/composables/useFlankingDetection.ts` | Flanking computation | Reactive computed that recomputes flanking status for all positioned, alive combatants whenever positions change. Uses checkFlankingMultiTile for full multi-tile support. | combatants (Ref) | FlankingMap | gm, group, player |
| vtt-grid-C149 | isTargetFlanked | composable-function | `app/composables/useFlankingDetection.ts` | Flanking query | Checks if a specific combatant is currently flanked. | combatantId | boolean | gm, group, player |
| vtt-grid-C150 | getFlankingPenalty | composable-function | `app/composables/useFlankingDetection.ts` | Flanking evasion | Returns -2 evasion penalty if flanked, 0 otherwise (PTU p.232). | combatantId | number | gm, group, player |
| vtt-grid-C151 | flanking transition watcher | composable-function | `app/composables/useFlankingDetection.ts` | Flanking WebSocket | Watches for flanking state transitions and invokes callback for WebSocket broadcasting and VTT re-rendering. | onFlankingChanged callback | void | gm |

### useElevation

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C152 | getTokenElevation / setTokenElevation | composable-function | `app/composables/useElevation.ts` | Token elevation | Gets/sets per-token elevation (clamped 0 to maxElevation). | combatantId, elevation? | number / void | gm |
| vtt-grid-C153 | raiseToken / lowerToken | composable-function | `app/composables/useElevation.ts` | Token elevation adjust | Raises/lowers a token's elevation by 1 level. | combatantId | void | gm |
| vtt-grid-C154 | getDefaultElevation / applyDefaultElevation | composable-function | `app/composables/useElevation.ts` | Flying default | Calculates default elevation for flying Pokemon (min(sky speed, maxElevation)). Applies on first placement. | combatantId | number / void | gm |
| vtt-grid-C155 | getTerrainElevation / setTerrainElevation | composable-function | `app/composables/useElevation.ts` | Terrain elevation | Gets/sets terrain cell elevation while preserving existing terrain type and flags. | x, y, elevation? | number / void | gm |
| vtt-grid-C156 | raiseTerrainAt / lowerTerrainAt | composable-function | `app/composables/useElevation.ts` | Terrain elevation brush | Raises/lowers terrain elevation by brush amount at a position. | x, y | void | gm |
| vtt-grid-C157 | importElevations / exportElevations | composable-function | `app/composables/useElevation.ts` | Elevation serialization | Import/export token elevation data for persistence. | data | TokenElevation[] | gm |

### useFogPersistence

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C158 | loadFogState | composable-function | `app/composables/useFogPersistence.ts` | Fog load | Loads fog state from server and imports into fogOfWar store. | encounterId | boolean | gm |
| vtt-grid-C159 | saveFogState / debouncedSave / forceSave | composable-function | `app/composables/useFogPersistence.ts` | Fog save | Saves fog state to server. debouncedSave waits 500ms. forceSave is immediate. | encounterId | boolean | gm |

### useTerrainPersistence

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C160 | loadTerrainState | composable-function | `app/composables/useTerrainPersistence.ts` | Terrain load | Loads terrain state from server and imports into terrain store (with legacy migration). | encounterId | boolean | gm |
| vtt-grid-C161 | saveTerrainState / debouncedSave / forceSave | composable-function | `app/composables/useTerrainPersistence.ts` | Terrain save | Saves terrain state to server. debouncedSave waits 500ms. forceSave is immediate. | encounterId | boolean | gm |

### Isometric Composables

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C162 | worldToScreen | composable-function | `app/composables/useIsometricProjection.ts` | Isometric projection | Projects world grid coordinates (x, y, z) to screen pixel coordinates with camera rotation. 2:1 tile ratio. | gridX, gridY, elevation, angle, gridW, gridH, cellSize | {px, py} | gm, group, player |
| vtt-grid-C163 | screenToWorld | composable-function | `app/composables/useIsometricProjection.ts` | Inverse projection | Converts screen pixel coordinates back to world grid coordinates with camera rotation reversal. | px, py, elevation, angle, gridW, gridH, cellSize | {x, y} | gm, group, player |
| vtt-grid-C164 | rotateCoords / unrotateCoords | composable-function | `app/composables/useIsometricProjection.ts` | Camera rotation math | Rotates/unrotates grid coordinates for 4 cardinal camera angles. | x, y, angle, gridW, gridH | {rx, ry} / {x, y} | gm, group, player |
| vtt-grid-C165 | getDepthKey | composable-function | `app/composables/useIsometricProjection.ts` | Depth sorting | Computes depth key for painter's algorithm sorting in isometric view. | x, y, angle, gridW, gridH | number | gm, group, player |
| vtt-grid-C166 | getTileDiamondPoints | composable-function | `app/composables/useIsometricProjection.ts` | Diamond geometry | Returns the 4 corner points of an isometric diamond tile for drawing. | x, y, elevation, angle, gridW, gridH, cellSize | {top, right, bottom, left} | gm, group, player |
| vtt-grid-C167 | getGridOriginOffset | composable-function | `app/composables/useIsometricProjection.ts` | Grid centering | Calculates pixel offset to center the isometric grid in the viewport. | angle, gridW, gridH, cellSize | {ox, oy} | gm, group, player |
| vtt-grid-C168 | isometric render | composable-function | `app/composables/useIsometricRendering.ts` render | Isometric rendering | Full isometric render loop: canvas clear, background, grid diamonds, terrain overlays, tokens with sprites/HP/labels/elevation badges, movement preview, fog of war, measurement overlay. Depth-sorted via painter's algorithm. | canvas, config, state | void (draws to canvas) | gm, group, player |
| vtt-grid-C169 | isometric scheduleRender | composable-function | `app/composables/useIsometricRendering.ts` scheduleRender | Render scheduling | Schedules a render on the next animation frame to batch multiple state changes. | -- | void | gm, group, player |
| vtt-grid-C170 | isometric interaction | composable-function | `app/composables/useIsometricInteraction.ts` | Isometric input | Full isometric input handling: screen-to-grid via inverse projection, token hit detection, hover highlight, click-to-move, panning, marquee selection, zooming, measurement, fog painting, terrain painting. Mirrors useGridInteraction but with isometric coordinate transforms. | options | interaction state + handlers | gm, group, player |
| vtt-grid-C171 | isometric camera | composable-function | `app/composables/useIsometricCamera.ts` | Camera management | Wraps isometricCamera store: rotation (CW/CCW with instant snap), zoom (10% increments), pan (local to each view), reset, angle set. | -- | camera state + methods | gm, group |
| vtt-grid-C172 | isometric overlays | composable-function | `app/composables/useIsometricOverlays.ts` | Overlay rendering | Draws fog of war (player opaque/GM preview), terrain layer with elevation-darkened colors and flag overlays, measurement overlay -- all as isometric diamonds. | options | draw functions | gm, group, player |
| vtt-grid-C173 | isometric movement preview | composable-function | `app/composables/useIsometricMovementPreview.ts` | Movement preview | Draws isometric cell highlights, movement range overlay, and movement arrow with distance label for isometric mode. | options | draw functions | gm, group |
| vtt-grid-C174 | depth sorting | composable-function | `app/composables/useDepthSorting.ts` | Painter's algorithm | Sorts drawable items by depth key and layer order for correct isometric rendering (terrain < grid < token < fog). | drawables | sorted Drawable[] | gm, group, player |
| vtt-grid-C175 | canvas drawing primitives | composable-function | `app/composables/useCanvasDrawing.ts` | 2D drawing helpers | Provides drawArrow, drawDistanceLabel, drawMessageLabel, drawCellHighlight, drawDashedRing, drawSpeedBadge, drawTerrainPattern, drawCrossPattern, drawCenterDot for 2D grid rendering. | ctx, params | void | gm, group, player |
| vtt-grid-C176 | touch interaction | composable-function | `app/composables/useTouchInteraction.ts` | Touch gestures | Shared touch handling: single-finger pan, two-finger pinch-to-zoom, tap detection with threshold. Used by both 2D and isometric interaction composables. | options | touch handlers | gm, group, player |

## WebSocket Events

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C177 | movement_preview event | websocket-event | `app/server/routes/ws.ts` | Movement broadcast | GM previews a move, server broadcasts to group views for real-time movement display. | {combatantId, fromPosition, toPosition, distance, isValid} | broadcast to group | gm, group |
| vtt-grid-C178 | flanking_update event | websocket-event | `app/server/routes/ws.ts` | Flanking broadcast | GM broadcasts flanking state changes to group/player views. | {combatantId, isFlanked, flankerIds} | broadcast to group/player | gm, group, player |
| vtt-grid-C179 | player_move_request event | websocket-event | `app/server/routes/ws.ts` | Player movement | Player requests a token move on the VTT grid, forwarded to GM for approval. | {combatantId, position} | forward to GM | player, gm |

## Components

| cap_id | name | type | location | game_concept | description | inputs | outputs | accessible_from |
|--------|------|------|----------|-------------|-------------|--------|---------|----------------|
| vtt-grid-C180 | VTTContainer | component | `app/components/vtt/VTTContainer.vue` | Grid orchestrator | Root VTT component. Selects between 2D/isometric pipelines. Contains all toolbar components (measurement, fog, terrain, elevation, map upload, settings). Manages fog/terrain persistence. GM-only controls. | config, combatants, tokens, encounter | token events, grid config events | gm |
| vtt-grid-C181 | GridCanvas | component | `app/components/vtt/GridCanvas.vue` | 2D grid rendering | 2D canvas rendering + DOM token overlay. Integrates useGridMovement, useGridRendering, useGridInteraction, useFlankingDetection. Supports player mode (restricted selection, pending moves). | config, tokens, combatants, isGm, playerMode? | token move/select events | gm, group, player |
| vtt-grid-C182 | IsometricCanvas | component | `app/components/vtt/IsometricCanvas.vue` | Isometric grid | Isometric canvas rendering with camera controls, zoom controls, coordinate display. Integrates useIsometricCamera, useIsometricRendering, useIsometricInteraction, useGridMovement, useElevation, useRangeParser. All rendering on canvas (no DOM tokens). | config, tokens, combatants, isGm | token move/select events | gm, group |
| vtt-grid-C183 | GroupGridCanvas | component | `app/components/vtt/GroupGridCanvas.vue` | Group display | Read-only grid wrapper for group/projector view. Delegates to GridCanvas or IsometricCanvas with isGm=false. Receives external movement preview from WebSocket. | config, combatants, currentTurnId, movementPreview | none (read-only) | group |
| vtt-grid-C184 | VTTToken | component | `app/components/vtt/VTTToken.vue` | Token display | DOM-based token element (2D mode only). Shows Pokemon sprite or character avatar, HP bar, name label, size badge, elevation badge, flanking indicator. CSS classes for selected, current turn, fainted, mounted, player-owned, pending move. | token, cellSize, combatant, state flags | select event | gm, group, player |
| vtt-grid-C185 | VTTMountedToken | component | `app/components/vtt/VTTMountedToken.vue` | Mounted pair display | Composite token showing mount at full size with rider at 60% in lower-right quadrant. Shows Easy Intercept badge (PTU p.218). | mountToken, riderToken, combatants | select-mount, select-rider events | gm, group, player |
| vtt-grid-C186 | TerrainPainter | component | `app/components/vtt/TerrainPainter.vue` | Terrain editing UI | Terrain tool panel: base terrain type selector (normal, blocking, water, earth, hazard, elevated), movement flags (rough, slow), brush size, fill/clear actions. Includes terrain legend with costs. | -- | terrain store mutations | gm |
| vtt-grid-C187 | GridSettingsPanel | component | `app/components/vtt/GridSettingsPanel.vue` | Grid config UI | Settings panel for grid dimensions (width, height, cell size), isometric toggle, max elevation, map upload integration. | config | config update events | gm |
| vtt-grid-C188 | MapUploader | component | `app/components/vtt/MapUploader.vue` | Map upload UI | Drag-and-drop or click-to-upload background image component. Preview of current background. File type and size validation. | currentBackground, encounterId | upload/remove events | gm |
| vtt-grid-C189 | MeasurementToolbar | component | `app/components/vtt/MeasurementToolbar.vue` | Measurement UI | Toolbar for measurement modes (distance, burst, cone, line, close-blast), AoE size/direction controls, clear button. Shows 3D distance and elevation delta for isometric. | mode, aoeSize, aoeDirection | mode/size/direction events | gm, group, player |
| vtt-grid-C190 | FogOfWarToolbar | component | `app/components/vtt/FogOfWarToolbar.vue` | Fog tools UI | GM toolbar for fog of war: enable/disable, tool mode (reveal/hide/explore), brush size, reveal all/hide all buttons. | enabled, toolMode, brushSize | toggle/tool events | gm |
| vtt-grid-C191 | ElevationToolbar | component | `app/components/vtt/ElevationToolbar.vue` | Elevation tools UI | Elevation control: token vs terrain mode, level adjustment (+/-), max elevation display. | enabled, mode, currentLevel, maxElevation | toggle/setMode/level events | gm |
| vtt-grid-C192 | CameraControls | component | `app/components/vtt/CameraControls.vue` | Camera rotation UI | Isometric camera rotation buttons (CW/CCW) with angle display (N/E/S/W). | angle, isRotating | rotateCw/rotateCcw events | gm, group |
| vtt-grid-C193 | ZoomControls | component | `app/components/vtt/ZoomControls.vue` | Zoom UI | Zoom in/out/reset buttons for the grid canvas. | zoom | zoomIn/zoomOut/reset events | gm, group, player |
| vtt-grid-C194 | CoordinateDisplay | component | `app/components/vtt/CoordinateDisplay.vue` | Coordinate HUD | Shows hovered cell coordinates (x, y), elevation (Z), measurement mode and distance. | cell, mode?, distance?, elevation?, isIsometric? | none (display only) | gm, group, player |
| vtt-grid-C195 | PlayerGridView | component | `app/components/player/PlayerGridView.vue` | Player VTT | Player-facing grid view using GridCanvas in player mode. Shows pending move status, move confirmation sheet. Limited to own tokens, movement requests sent via WebSocket. | gridConfig, tokens, combatants | player move events | player |

---

## Capability Chains

### Chain 1: Token Position Update (GM)
**Accessible from**: gm, group (view only)

1. **GridCanvas/IsometricCanvas** (C181/C182) -- GM clicks token, enters move mode
2. **useGridInteraction/useIsometricInteraction** (C134/C170) -- handleTokenSelect, click-to-move
3. **useGridMovement.isValidMove** (C118) -- validates with terrain, elevation, no-stacking
4. **usePathfinding.calculatePathCost** (C139) -- A* with terrain costs
5. **useEncounterGridStore.updateCombatantPosition** (C064) -- API call
6. **position.post.ts** (C034) -- server-side validation, linked mount/weapon movement
7. **Prisma Encounter.combatants** (C013) -- position persisted in JSON
8. **ws.ts movement_preview** (C177) -- broadcast to group view
9. **GroupGridCanvas** (C183) -- external movement preview rendered

### Chain 2: Player Move Request
**Accessible from**: player, gm

1. **PlayerGridView** (C195) -- player taps own token on their turn
2. **GridCanvas (player mode)** (C181) -- restricted selection, cell click
3. **WebSocket player_move_request** (C179) -- forwarded to GM
4. **GM approves** -- GM calls position.post.ts (C034)
5. **Encounter update broadcast** -- all views update

### Chain 3: Fog of War Lifecycle
**Accessible from**: gm (edit), group+player (view)

1. **VTTContainer** (C180) -- FogOfWarToolbar renders
2. **FogOfWarToolbar** (C190) -- GM selects tool mode, brush size
3. **useGridInteraction fog painting** (C133) -- mouse down/move applies tool
4. **fogOfWar store** (C082) -- applyTool modifies cell states
5. **useFogPersistence.debouncedSave** (C159) -- auto-saves to server
6. **fog.put.ts** (C037) -- persists to Prisma
7. **useGridRendering.drawFogOfWar** (C125) -- player: opaque fog; GM: preview overlay

### Chain 4: Terrain Painting
**Accessible from**: gm (edit), group+player (view)

1. **VTTContainer** (C180) -- TerrainPainter renders
2. **TerrainPainter** (C186) -- GM selects terrain type, flags, brush
3. **useGridInteraction terrain painting** (C133) -- mouse down/move paints
4. **terrain store** (C097) -- applyTool sets cells with type, flags, elevation
5. **useTerrainPersistence.debouncedSave** (C161) -- auto-saves to server
6. **terrain.put.ts** (C039) -- persists with Zod validation
7. **useGridRendering.drawTerrain** (C125) -- renders terrain colors and flag indicators
8. **useGridMovement.getTerrainCostForCombatant** (C120) -- pathfinding uses terrain data

### Chain 5: Measurement / AoE
**Accessible from**: gm, group, player

1. **MeasurementToolbar** (C189) -- select mode, configure AoE
2. **useGridInteraction** (C133) -- mouse click starts measurement
3. **measurement store** (C104) -- tracks start/end with token metadata
4. **measurement store.affectedCells** (C102) -- computes burst/cone/line/blast cells
5. **useGridRendering.drawMeasurementOverlay** (C125) -- renders affected cells with mode-specific colors

### Chain 6: Grid Configuration
**Accessible from**: gm

1. **VTTContainer** (C180) -- Settings button
2. **GridSettingsPanel** (C187) -- edit width, height, cell size, isometric toggle
3. **useEncounterGridStore.updateGridConfig** (C065) -- API call
4. **grid-config.put.ts** (C035) -- validates and persists
5. **Encounter record updated** -- grid config fields (C001-C008) persisted

### Chain 7: Background Map
**Accessible from**: gm (upload), group+player (view)

1. **MapUploader** (C188) -- drag-and-drop or click upload
2. **useEncounterGridStore.uploadBackgroundImage** (C067) -- multipart form POST
3. **background.post.ts** (C040) -- validates, stores as base64
4. **useGridRendering.loadBackgroundImage** (C126) -- loads and renders

### Chain 8: Flanking Detection
**Accessible from**: gm, group, player (view)

1. **GridCanvas/IsometricCanvas** (C181/C182) -- token positions change
2. **useFlankingDetection.flankingMap** (C148) -- recomputes on position change
3. **checkFlankingMultiTile** (C057) -- pure geometry, multi-tile support
4. **VTTToken isFlanked prop** (C184) -- visual flanking indicator
5. **flanking transition watcher** (C151) -- WebSocket broadcast on transitions
6. **ws.ts flanking_update** (C178) -- broadcast to group/player

### Chain 9: Isometric Mode
**Accessible from**: gm, group

1. **GridSettingsPanel** (C187) -- isometric toggle
2. **VTTContainer** (C180) -- switches from GridCanvas to IsometricCanvas
3. **useIsometricCamera** (C171) -- camera angle, zoom, pan
4. **useIsometricProjection** (C162-C167) -- coordinate transforms
5. **useIsometricRendering** (C168) -- full render with depth sorting
6. **useIsometricOverlays** (C172) -- fog, terrain, measurement as diamonds
7. **useIsometricMovementPreview** (C173) -- movement arrows in iso space
8. **useDepthSorting** (C174) -- painter's algorithm ordering
9. **CameraControls** (C192) -- rotation UI

### Chain 10: Elevation System
**Accessible from**: gm (edit), group (view via isometric render)

1. **ElevationToolbar** (C191) -- token vs terrain mode, level control
2. **useElevation** (C152-C157) -- per-token and terrain elevation management
3. **useGridMovement.calculateElevationCost** (C124) -- movement cost for Z changes
4. **usePathfinding** (C137-C139) -- elevation-aware pathfinding
5. **useIsometricRendering** (C168) -- tokens rendered at elevation height

### Chain 11: Auto-Placement on Spawn
**Accessible from**: api-only (called by combatants.post, wild-spawn.post, from-scene.post)

1. **grid-placement.service.sizeToTokenSize** (C042) -- map PTU size to grid cells
2. **grid-placement.service.buildOccupiedCellsSet** (C043) -- find occupied cells
3. **grid-placement.service.findPlacementPosition** (C044) -- find open position by side

---

## Accessibility Summary

| Access Level | Capabilities |
|-------------|-------------|
| **gm-only** | Grid toggle (C001), grid config (C035, C065, C187), background upload/remove (C040-C041, C067-C068, C188), token position update (C034, C064), token sizing (C066), fog editing (C037, C070, C076-C085, C190), terrain editing (C039, C093-C100, C186), elevation editing (C152-C157, C191), keyboard shortcuts (C135), click-to-move (C134), marquee selection (C106-C108), AoO preview (C123), movement preview broadcast (C128, C177), flanking transition broadcast (C151) |
| **gm + group** | Camera rotation (C109-C112, C171, C192), movement preview rendering (C129, C177), isometric rendering (C168-C174, C182), isometric camera (C171) |
| **gm + group + player** | Grid rendering (C125-C127), fog display (C071-C075), terrain display (C086-C092), measurement (C101-C105, C189), coordinate display (C194), zoom controls (C132, C193), touch interaction (C136, C176), token display (C184-C185), distance calculation (C045-C047, C113), pathfinding (C137-C141), range parsing (C142-C147), flanking display (C148-C150), movement speed (C114-C116), adjacency (C048-C053) |
| **player-specific** | PlayerGridView (C195), player_move_request (C179) -- restricted to own tokens, requires GM approval |
| **api-only** | Grid placement service (C042-C044) -- server-side auto-placement |

---

## Orphan Capabilities

| cap_id | name | notes |
|--------|------|-------|
| vtt-grid-C081 | revealFootprintArea | Exists in fogOfWar store but "NOT yet wired into token movement handlers." Auto-reveal on movement requires fog vision radius configuration that is outside P1 scope. |
| vtt-grid-C028 | VTTWebSocketEvent type | Defined in types but the discriminated union events (position_update, grid_config_update, terrain_update, token_size_update) are not the actual WebSocket event names used. The real WS events use different names (movement_preview, flanking_update, encounter_update). This type definition appears unused. |

---

## Missing Subsystems

### 1. Player Isometric Grid View
- **subsystem**: No player-facing isometric grid interface -- PlayerGridView only uses 2D GridCanvas
- **actor**: player
- **ptu_basis**: Isometric mode is the enhanced grid visualization (elevation, 3D perspective). Players should be able to see the same isometric view the GM and group view see during combat.
- **impact**: When GM enables isometric mode, player view falls back to 2D-only grid, losing elevation context and spatial awareness that the GM and group projector display. Players cannot see terrain elevation or token elevation visually.

### 2. Player Fog-of-War Scoped Vision
- **subsystem**: No per-player fog of war -- all players see the same global fog state
- **actor**: player
- **ptu_basis**: PTU p.231: Different characters have different vision ranges and Darkvision capabilities. Each player should see fog revealed only around their own tokens.
- **impact**: Either the GM reveals fog for everyone (spoiling hidden enemies for other players) or keeps fog hidden for everyone (preventing players from seeing their own surroundings). The revealFootprintArea function (C081) exists but is unwired.

### 3. Player Terrain/Fog Read-Only Overlay
- **subsystem**: No terrain or fog rendering in PlayerGridView -- only token positions are shown
- **actor**: player
- **ptu_basis**: Players need to see terrain (water, blocking, hazard) to make informed movement decisions during their turn. PTU p.231: terrain affects movement costs and capabilities.
- **impact**: Players must ask the GM what terrain is on each cell, slowing gameplay. Group projector shows terrain but individual player views do not.

### 4. Token Elevation Persistence
- **subsystem**: Token elevations are stored in client-side reactive Map only (useElevation), not persisted to server or synced via WebSocket
- **actor**: gm
- **ptu_basis**: Flying Pokemon (PTU movement capabilities) maintain elevation between rounds. Elevation affects movement costs and line of sight.
- **impact**: Page reload loses all token elevation data. Group view and player view cannot see token elevations set by the GM. Only the GM's browser session maintains elevation state.
