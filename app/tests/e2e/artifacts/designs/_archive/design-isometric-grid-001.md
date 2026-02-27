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

## Rendering Engine Decision

### Comparison Matrix

| Criterion               | Three.js (WebGL)  | PixiJS v8 (WebGL/WebGPU) | Pure Canvas + Projection Math |
|--------------------------|-------------------|--------------------------|-------------------------------|
| **Bundle size (min+gz)** | ~155KB gzipped    | ~120KB gzipped           | 0KB (no dependency)           |
| **Learning curve**       | High (scene graph, materials, cameras, lighting) | Medium (display objects, containers, filters) | Low (existing Canvas API + math formulas) |
| **Isometric camera**     | OrthographicCamera with rotation, built-in | No native isometric; manual projection | Manual projection formulas, well-documented |
| **Sprite billboarding**  | Built-in SpriteMaterial with auto-facing | 2D-native, no billboarding needed | Sprites drawn at projected positions |
| **Depth sorting**        | Automatic via Z-buffer | Manual Z-index on display objects | Manual painter's algorithm |
| **Fog of war**           | Shader-based (complex) | Filter-based overlays | Per-cell opacity overlay (current approach) |
| **Performance (20+ tokens)** | Excellent (GPU-accelerated) | Excellent (batched rendering) | Good (CPU-bound but sufficient for grid sizes up to 60x60) |
| **Existing code reuse**  | 10% (complete rewrite) | 30% (logic reusable, rendering new) | 70% (stores, pathfinding, range parser, terrain logic all survive) |
| **Debuggability**        | Chrome DevTools limited for WebGL | Better than WebGL, worse than Canvas | Full Canvas 2D debugging, step-through drawing |
| **SSR compatibility**    | Requires client-only wrapper | Requires client-only wrapper | Works with existing Nuxt SPA setup |

### Decision: Pure Canvas 2D with Isometric Projection Math

**Rationale:**

1. **Zero new dependencies.** The project already uses a Canvas 2D rendering pipeline. Adding Three.js (660KB) or PixiJS (500KB) for what is fundamentally a 2D tile grid with projection math is over-engineering. The grid never renders true 3D geometry -- it draws flat tiles and flat sprites at projected positions.

2. **Maximum code reuse (70%).** All 5 stores (encounterGrid, fogOfWar, terrain, measurement, selection) survive unchanged. The pathfinding composable (`useRangeParser`) and movement composable (`useGridMovement`) need only Z-axis extensions, not rewrites. Only the rendering and interaction composables are replaced.

3. **Proven approach.** Isometric projection on Canvas 2D is a well-documented technique used by hundreds of indie games. The math is straightforward:
   - World-to-screen: `screenX = (gridX - gridY) * tileHalfWidth`, `screenY = (gridX + gridY) * tileHalfHeight - elevation * elevationPixelHeight`
   - Screen-to-world: inverse of the above matrix
   - Camera rotation: rotate the projection matrix by 90/180/270 degrees (4 cardinal angles) or arbitrary angles

4. **Debuggability.** Canvas 2D operations are fully inspectable in Chrome DevTools. WebGL shaders are not. For a small team, this matters.

5. **Performance is sufficient.** A 60x60 grid has 3,600 cells. Even with depth sorting and per-cell terrain/fog overlay, Canvas 2D can comfortably render this at 60fps on mid-range hardware. The bottleneck would be pathfinding (already CPU-bound), not rendering.

**Risk mitigation:** If Canvas 2D performance proves insufficient for very large grids (100x100+), the projection math composable can be ported to PixiJS with minimal changes since the isometric math is engine-agnostic.

---

## Core Isometric Math

### Projection Formulas

For a standard isometric projection with camera rotation support:

```typescript
// Constants
const TILE_WIDTH_HALF = cellSize  // Half the width of a diamond tile
const TILE_HEIGHT_HALF = cellSize / 2  // Half the height (2:1 ratio)
const ELEVATION_HEIGHT = cellSize / 2  // Pixels per elevation level

// Camera rotation (0 = default, 1 = 90deg CW, 2 = 180deg, 3 = 270deg)
type CameraAngle = 0 | 1 | 2 | 3

// Rotate grid coordinates based on camera angle
function rotateCoords(x: number, y: number, angle: CameraAngle, gridW: number, gridH: number) {
  switch (angle) {
    case 0: return { rx: x, ry: y }
    case 1: return { rx: gridH - 1 - y, ry: x }
    case 2: return { rx: gridW - 1 - x, ry: gridH - 1 - y }
    case 3: return { rx: y, ry: gridW - 1 - x }
  }
}

// World grid (x, y, z) -> screen pixel (px, py)
function worldToScreen(
  gridX: number, gridY: number, elevation: number,
  angle: CameraAngle, gridW: number, gridH: number
): { px: number, py: number } {
  const { rx, ry } = rotateCoords(gridX, gridY, angle, gridW, gridH)
  return {
    px: (rx - ry) * TILE_WIDTH_HALF,
    py: (rx + ry) * TILE_HEIGHT_HALF - elevation * ELEVATION_HEIGHT
  }
}

// Screen pixel -> world grid (inverse projection)
function screenToWorld(
  px: number, py: number,
  angle: CameraAngle, gridW: number, gridH: number,
  elevation: number = 0
): { x: number, y: number } {
  const adjustedPy = py + elevation * ELEVATION_HEIGHT
  const rx = (px / TILE_WIDTH_HALF + adjustedPy / TILE_HEIGHT_HALF) / 2
  const ry = (adjustedPy / TILE_HEIGHT_HALF - px / TILE_WIDTH_HALF) / 2
  // Reverse rotation
  return unrotateCoords(Math.floor(rx), Math.floor(ry), angle, gridW, gridH)
}
```

### Depth Sorting

Objects are drawn using the painter's algorithm (back to front). The sort key for each drawable is:

```
depth = rotatedX + rotatedY + elevation
```

All drawables (grid cells, terrain overlays, tokens, fog cells) are collected into a single array, sorted by depth, and drawn in order. For cells at the same depth, the draw order is: terrain fill, grid lines, token, fog overlay.

---

## Data Model Changes

### `GridPosition` extension (app/types/spatial.ts)

The existing `GridPosition` is XY only. Extend with an optional Z:

```typescript
export interface GridPosition {
  x: number
  y: number
  z?: number  // Elevation level (0 = ground, positive = above, negative = below)
}
```

The `z` field is optional to maintain backward compatibility. All existing code that uses `GridPosition` continues working -- `z` defaults to `0` when undefined.

### `TokenState` extension (app/types/spatial.ts)

Already has an `elevation` field (currently unused):

```typescript
export interface TokenState {
  combatantId: string
  position: GridPosition
  size: number
  visible: boolean
  elevation: number  // Already exists! Will now be actively used
}
```

### `TerrainCell` extension (app/types/spatial.ts)

Already has an `elevation` field (currently stored but not rendered):

```typescript
export interface TerrainCell {
  position: GridPosition
  type: TerrainType
  elevation: number  // Already exists! Will now affect visual height
  note?: string
}
```

### `GridConfig` extension (app/types/spatial.ts)

Add isometric configuration:

```typescript
export interface GridConfig {
  enabled: boolean
  width: number
  height: number
  cellSize: number
  background?: string
  // New isometric fields
  isometric: boolean         // Feature flag: false = flat 2D (current), true = isometric
  cameraAngle: CameraAngle   // 0 | 1 | 2 | 3 (cardinal rotation)
  maxElevation: number        // Max elevation levels (default 5)
}
```

### Prisma Schema Changes (app/prisma/schema.prisma)

Add to the `Encounter` model:

```prisma
// Isometric grid settings
gridIsometric    Boolean @default(false)
gridCameraAngle  Int     @default(0)  // 0-3 cardinal angles
gridMaxElevation Int     @default(5)
```

Add to the `EncounterTemplate` model:

```prisma
gridIsometric    Boolean?
gridCameraAngle  Int?
gridMaxElevation Int?
```

### Combatant JSON Changes

The combatant JSON blob (stored in `Encounter.combatants`) already contains `position: { x, y }` and `tokenSize`. Add `elevation: number` (default `0`):

```json
{
  "id": "...",
  "position": { "x": 5, "y": 3 },
  "tokenSize": 1,
  "elevation": 0
}
```

No migration needed -- existing combatants without `elevation` default to `0`.

---

## Architecture: What Survives, What Changes

### Survives Unchanged (Logic Layer)

| File | Reason |
|------|--------|
| `stores/encounterGrid.ts` | API calls only, no rendering logic |
| `stores/fogOfWar.ts` | Cell state map uses `"x,y"` keys, rendering handled elsewhere |
| `stores/terrain.ts` | Cell data map uses `"x,y"` keys, already stores elevation per cell |
| `stores/selection.ts` | Selection is by combatant ID, not pixel position |
| `stores/measurement.ts` | AoE cell calculation is grid-coordinate math, not rendering |
| `composables/useTerrainPersistence.ts` | API load/save, no rendering |
| `composables/useRangeParser.ts` | Grid math only (parseRange, getAffectedCells, isInRange, calculatePathCost) |
| `components/vtt/GridSettingsPanel.vue` | Form inputs for config, extend with isometric toggles |
| `components/vtt/MapUploader.vue` | File upload, no rendering |
| `components/vtt/TerrainPainter.vue` | Toolbar UI, no rendering |

### Adapted (Minor Extensions)

| File | Changes |
|------|---------|
| `composables/useGridMovement.ts` | Add Z-axis awareness to `isValidMove` and `getSpeed`. Elevation change cost: 1 movement point per level. `calculateMoveDistance` gains optional `dz` parameter. |
| `composables/useRangeParser.ts` | `calculatePathCost` A* gains Z-axis neighbors. `getMovementRangeCells` flood-fill gains Z-axis expansion. Heuristic updated: `h = chebyshev(dx, dy) + |dz|`. |
| `stores/measurement.ts` | AoE calculations add elevation awareness. Burst at elevation affects same-elevation cells only (or configurable). Distance measurement shows 3D distance. |
| `stores/fogOfWar.ts` | Cell keys remain `"x,y"` (fog is per-column, not per-elevation). Fog state is 2D -- if any elevation at that XY column is hidden, the whole column is fogged. This matches how fog works in isometric strategy games (fog applies to map tiles, not individual height levels). |
| `types/spatial.ts` | Add `z?` to `GridPosition`, add `CameraAngle` type, extend `GridConfig` |
| `components/vtt/MeasurementToolbar.vue` | Add 3D distance display |
| `components/vtt/FogOfWarToolbar.vue` | No changes needed (fog is 2D) |
| `components/vtt/CoordinateDisplay.vue` | Show elevation in display |

### Replaced (New Isometric Versions)

| Old File | New File | Reason |
|----------|----------|--------|
| `composables/useCanvasRendering.ts` | `composables/useIsometricRendering.ts` | Grid lines, terrain fill, fog overlay, movement range -- all need isometric projection |
| `composables/useCanvasDrawing.ts` | (merged into `useIsometricRendering.ts`) | Drawing primitives become isometric tile drawing |
| `composables/useGridRendering.ts` | `composables/useIsometricRendering.ts` | Main render loop with depth sorting |
| `composables/useGridInteraction.ts` | `composables/useIsometricInteraction.ts` | screenToGrid becomes screenToWorld with inverse isometric projection |
| `components/vtt/GridCanvas.vue` | `components/vtt/IsometricCanvas.vue` | New component using isometric composables |
| `components/vtt/VTTToken.vue` | (adapted in place) | Token positioning changes from absolute CSS to isometric screen coordinates |

### New Files

| File | Purpose |
|------|---------|
| `composables/useIsometricProjection.ts` | Pure math: worldToScreen, screenToWorld, rotateCoords, depthKey |
| `composables/useIsometricCamera.ts` | Camera state: angle, zoom, pan, rotation animation |
| `composables/useDepthSorting.ts` | Collect all drawables, sort by depth, handle same-depth ordering |
| `composables/useElevation.ts` | Elevation editing tools: raise/lower terrain, set token elevation |
| `stores/isometricCamera.ts` | Camera angle, animation state, shared between GM and Group views |
| `components/vtt/ElevationToolbar.vue` | GM toolbar for setting elevation on terrain cells |
| `components/vtt/CameraControls.vue` | Rotate buttons (Q/E keys), elevation indicators |

---

## Dependency Diagram

```
                     IsometricCanvas.vue
                    /         |          \
                   /          |           \
    useIsometricRendering  useIsometricInteraction  useIsometricCamera
         |       |              |                        |
    useIsometric  useDepth    useIsometric           isometricCamera
    Projection    Sorting     Projection              (store)
         |                      |
         v                      v
    useGridMovement -----> useRangeParser
         |                      |
    terrain (store)       measurement (store)
    fogOfWar (store)      selection (store)
    encounterGrid (store)
```

The key insight: **isometric projection is a lens**. It sits between the game logic layer (stores, pathfinding, range parsing -- all in grid coordinates) and the screen layer (pixel positions, canvas drawing). The game logic layer operates entirely in grid coordinates `(x, y, z)` and never knows about screen pixels. The projection layer converts between them.

---

## Phase Plan

### P0: Rendering Engine + Basic Grid

**Goal:** Render the grid in isometric projection with camera rotation. No interaction, no tokens, no overlays.

**Scope:**
1. `useIsometricProjection.ts` -- pure math composable
   - `worldToScreen(x, y, z, angle, gridW, gridH)` -> `{ px, py }`
   - `screenToWorld(px, py, angle, gridW, gridH, elevation?)` -> `{ x, y }`
   - `rotateCoords(x, y, angle, gridW, gridH)` -> `{ rx, ry }`
   - `unrotateCoords(rx, ry, angle, gridW, gridH)` -> `{ x, y }`
   - `getDepthKey(x, y, z)` -> `number`

2. `useIsometricCamera.ts` -- camera state composable
   - `cameraAngle: Ref<CameraAngle>` (0-3)
   - `rotateClockwise()`, `rotateCounterClockwise()`
   - `zoom: Ref<number>`, `panOffset: Ref<{ x, y }>`
   - Rotation animation (smooth 90-degree transition, 300ms)

3. `stores/isometricCamera.ts` -- shared camera state (for GM/Group sync)
   - Camera angle, zoom level
   - WebSocket sync of camera angle changes

4. `useIsometricRendering.ts` -- main render loop (P0 subset)
   - Clear canvas, apply camera transform
   - Draw diamond-shaped grid cells (isometric tile outlines)
   - Draw grid coordinate labels
   - Draw background image on ground plane (projected as isometric quadrilateral)
   - Handle canvas resize

5. `IsometricCanvas.vue` -- new component (P0 subset)
   - Canvas element with isometric rendering
   - Camera rotation controls (buttons + keyboard Q/E)
   - Zoom and pan (same controls as current grid)

6. `CameraControls.vue` -- rotation buttons
   - Rotate CW/CCW buttons
   - Current angle indicator

7. `GridConfig` extension in `types/spatial.ts`
   - Add `isometric`, `cameraAngle`, `maxElevation` fields

8. Feature flag integration
   - `GridCanvas.vue` renders when `config.isometric === false` (default, current behavior)
   - `IsometricCanvas.vue` renders when `config.isometric === true`
   - `VTTContainer.vue` conditionally renders one or the other

**Acceptance Criteria (P0):**
- Isometric grid renders with diamond-shaped cells
- Grid dimensions match the encounter's gridWidth x gridHeight
- Camera rotates 90 degrees with Q/E keys or buttons
- Background map renders on ground plane
- Zoom and pan work in isometric mode
- Feature flag toggle between 2D and isometric in grid settings
- Performance: 60fps on a 40x30 grid with no tokens

**Files Created (P0):**
- `app/composables/useIsometricProjection.ts`
- `app/composables/useIsometricCamera.ts`
- `app/composables/useIsometricRendering.ts` (partial)
- `app/stores/isometricCamera.ts`
- `app/components/vtt/IsometricCanvas.vue` (partial)
- `app/components/vtt/CameraControls.vue`

**Files Modified (P0):**
- `app/types/spatial.ts` (GridConfig extension, CameraAngle type)
- `app/components/vtt/VTTContainer.vue` (conditional rendering)
- `app/components/vtt/GridSettingsPanel.vue` (isometric toggle)
- `app/prisma/schema.prisma` (new columns)

---

### P1: Token Interaction + Movement

**Goal:** Tokens render as billboarded sprites in isometric space. Click-to-move, drag, hover, and A* pathfinding work correctly through the isometric projection. Elevation support for tokens.

**Scope:**
1. `useIsometricInteraction.ts` -- interaction composable
   - `screenToGrid(screenX, screenY)` using inverse isometric projection
   - Mouse click handling through isometric projection
   - Token hit detection (check projected bounds, accounting for token size and elevation)
   - Hover cell detection (highlight isometric diamond under cursor)
   - Click-to-move mode (same UX as current: click token, click destination)
   - Panning (middle mouse / right click, same as current)
   - Marquee selection adapted for isometric view

2. `useDepthSorting.ts` -- depth sorting composable
   - Collect all drawables: grid cells, terrain cells, tokens, fog overlays
   - Sort by `depth = rotatedX + rotatedY + elevation`
   - Within same depth: terrain < grid lines < tokens < fog
   - Handle multi-cell tokens (size > 1): use back-most cell's depth

3. Token rendering in isometric space
   - Sprite billboarding: sprites are always drawn upright regardless of camera angle
   - Token position: centered on the isometric diamond at `(x, y, elevation)`
   - HP bar drawn below sprite
   - Name label drawn above sprite
   - Size badge for multi-cell tokens
   - Turn glow, selection highlight, multi-select dashed outline

4. `useElevation.ts` -- elevation editing composable
   - GM can set token elevation (0 to maxElevation)
   - UI: elevation slider or +/- buttons on selected token panel
   - Flying Pokemon default elevation based on Sky speed capability
   - Elevation displayed on token (small badge)

5. `ElevationToolbar.vue` -- GM toolbar
   - Current elevation brush level
   - Apply elevation to terrain cells (raise/lower ground)
   - Apply elevation to selected token

6. Movement in isometric space
   - `useGridMovement.ts` extended: `isValidMove` considers elevation
   - Elevation change cost: 1 movement point per level of elevation change (up or down)
   - PTU diagonal rules remain on the XY plane; elevation cost is additive
   - Flying Pokemon (Sky speed > 0) ignore elevation cost within their Sky speed range
   - Movement range overlay rendered as isometric diamonds at each reachable cell's elevation

7. A* pathfinding extension in `useRangeParser.ts`
   - Neighbors expanded to include elevation transitions: for each XY neighbor, consider moving to the elevation of the destination cell's terrain
   - Heuristic: `chebyshev(dx, dy) + Math.abs(dz)`
   - Elevation cost: 1 per level up or down (configurable)
   - Blocking terrain at any elevation still blocks

8. Movement preview arrow in isometric space
   - Arrow drawn from token's isometric position to target cell's isometric position
   - Distance label shows total cost including elevation changes
   - Valid/invalid color coding preserved

9. WebSocket sync for elevation changes
   - `movement_preview` event includes elevation
   - Group view renders tokens at correct elevation

**Acceptance Criteria (P1):**
- Tokens render at correct isometric positions
- Sprites face the camera (upright) at all rotation angles
- Click on a token in isometric view selects it
- Click-to-move works through isometric projection
- Movement range overlay shows reachable cells (including elevation awareness)
- A* pathfinding accounts for elevation cost
- GM can set token elevation
- Elevation changes cost movement points
- Movement preview arrow renders correctly in isometric space
- Multi-cell tokens (2x2, 3x3) render and interact correctly
- Group view shows tokens at correct elevations
- Performance: 60fps with 25 tokens on a 30x20 grid

**Files Created (P1):**
- `app/composables/useIsometricInteraction.ts`
- `app/composables/useDepthSorting.ts`
- `app/composables/useElevation.ts`
- `app/components/vtt/ElevationToolbar.vue`

**Files Modified (P1):**
- `app/composables/useIsometricRendering.ts` (add token rendering, movement preview)
- `app/composables/useGridMovement.ts` (elevation-aware movement)
- `app/composables/useRangeParser.ts` (3D A* pathfinding)
- `app/components/vtt/IsometricCanvas.vue` (token layer, interaction wiring)
- `app/components/vtt/VTTToken.vue` (isometric positioning mode)
- `app/components/vtt/VTTContainer.vue` (elevation toolbar)
- `app/components/vtt/CoordinateDisplay.vue` (show elevation)

---

### P2: Feature Parity (Fog, Terrain, Measurement)

**Goal:** Full feature parity with the 2D grid. Fog of war, terrain painter, measurement tools, and background maps all work in isometric mode.

**Scope:**
1. Fog of war in isometric mode
   - Fog remains 2D (per-column, not per-elevation) -- fog at `(x, y)` covers all elevations at that column
   - Rendering: draw fog overlay as semi-transparent isometric diamonds over hidden/explored cells
   - GM preview: striped pattern on hidden cells, dot on explored cells (same visual language, isometric shape)
   - Fog painting: GM clicks on isometric cells to paint fog (uses screenToGrid inverse projection)
   - Brush size works identically (Chebyshev distance in grid coordinates)

2. Terrain painting in isometric mode
   - Terrain cells render as colored isometric diamonds with patterns
   - Terrain patterns adapted for diamond shape (waves for water, X for blocking, dots for difficult, etc.)
   - Terrain elevation: GM can paint terrain at specific elevation levels (creates raised/lowered ground)
   - Elevated terrain renders as stacked isometric tiles (ground level + raised portion)
   - Terrain type colors and patterns preserved from current implementation

3. Measurement tools in isometric mode
   - Distance measurement: line drawn between two isometric points, distance shown in meters
   - 3D distance: `sqrt(dx^2 + dy^2 + dz^2)` rounded, or simpler `chebyshev(dx, dy) + |dz|` for PTU
   - Burst: isometric diamond overlay centered on origin, using Chebyshev distance
   - Cone: expanding isometric diamond pattern in a direction
   - Line: sequence of isometric cells from origin in a direction
   - Close blast: square of isometric cells adjacent to origin
   - All AoE shapes render as colored isometric diamond overlays
   - Direction cycling (R key) rotates through 8 directions in grid space (camera-independent)

4. Background map in isometric mode
   - Map image projected onto the ground plane as an isometric quadrilateral
   - Image is affine-transformed to match the isometric projection
   - Map scrolls/zooms with the grid

5. GM grid settings for isometric mode
   - Toggle: 2D flat / Isometric (feature flag)
   - Camera angle selector (4 positions)
   - Max elevation slider (1-10)
   - Elevation editing tools in terrain painter

6. Group view isometric rendering
   - `GroupGridCanvas.vue` passes `isometric` config to canvas component
   - Camera angle synced via WebSocket from GM
   - External movement preview renders in isometric space
   - Read-only: no interaction beyond zoom/pan

**Acceptance Criteria (P2):**
- Fog of war 3-state (hidden/revealed/explored) renders correctly in isometric view
- GM fog painting works through isometric projection
- Terrain types render as colored isometric diamonds with distinctive patterns
- Terrain elevation visually raises/lowers the ground
- All 5 measurement modes work in isometric view
- AoE overlays render as isometric diamond shapes
- Background map renders on the ground plane
- Grid settings panel has isometric toggle and camera controls
- Group view renders identical isometric view with synced camera angle
- Full round-trip: enable isometric -> place tokens -> set elevation -> paint terrain -> measure distance -> fog of war -> rotate camera -- all work together
- Performance: 60fps with 30 tokens, terrain on 50% of cells, fog enabled, on a 30x20 grid

**Files Modified (P2):**
- `app/composables/useIsometricRendering.ts` (fog overlay, terrain rendering, measurement overlay, background projection)
- `app/composables/useIsometricInteraction.ts` (fog painting, terrain painting through isometric projection)
- `app/stores/measurement.ts` (3D distance in affectedCells getter)
- `app/components/vtt/IsometricCanvas.vue` (full feature wiring)
- `app/components/vtt/VTTContainer.vue` (isometric settings, elevation toolbar)
- `app/components/vtt/GroupGridCanvas.vue` (isometric rendering mode)
- `app/components/vtt/GridSettingsPanel.vue` (isometric config controls)
- `app/components/vtt/MeasurementToolbar.vue` (3D distance display)
- `app/components/vtt/TerrainPainter.vue` (elevation brush)
- `app/components/vtt/CoordinateDisplay.vue` (elevation in display)

---

## Migration Strategy

### Feature Flag Approach

The isometric grid is behind a feature flag (`GridConfig.isometric`). This enables:

1. **Zero breaking changes.** All existing encounters use `isometric: false` (default). The current 2D grid continues working exactly as before.
2. **Per-encounter toggle.** The GM can enable isometric mode per encounter via grid settings.
3. **Gradual adoption.** Some encounters use flat grid, others use isometric, based on the GM's preference.
4. **Easy rollback.** If an encounter has issues in isometric mode, toggle back to flat grid. Token positions (x, y) are preserved. Elevation data is retained but ignored in flat mode.

### Implementation Order

```
P0 (rendering) ──> P1 (interaction) ──> P2 (features)
      |                    |                    |
   Review Gate         Review Gate         Review Gate
```

Each phase has a code review + manual testing gate before proceeding. The feature flag means incomplete phases never break existing functionality.

### Data Migration

No data migration needed:
- `elevation` field already exists on `TokenState` and `TerrainCell` (defaults to `0`)
- New `GridConfig` fields have defaults (`isometric: false`, `cameraAngle: 0`, `maxElevation: 5`)
- New Prisma columns have `@default()` values
- Combatant JSON blobs without `elevation` field default to `0` at read time

---

## Performance Budget

### Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame rate | 60fps sustained | Chrome DevTools Performance panel |
| Render time | < 8ms per frame | `performance.now()` around render loop |
| Grid size | Up to 60x60 (3,600 cells) | Largest expected encounter |
| Token count | 30+ simultaneously | Large battle scenario |
| Elevation levels | Up to 10 | Multi-story building scenario |
| Camera rotation | < 300ms transition | Smooth 90-degree rotation |

### Optimizations

1. **Viewport culling.** Only draw cells visible in the canvas viewport. For a 60x60 grid at default zoom, typically 20-30% of cells are visible. This alone halves render time.

2. **Dirty rectangle tracking.** Only re-render the area that changed (token moved, fog painted). Full re-render only on zoom/pan/rotate.

3. **Tile caching.** Pre-render common tile types (empty cell, each terrain type) to off-screen canvases. Stamp them onto the main canvas instead of drawing individual lines/fills each frame.

4. **Depth sort caching.** Cache the sorted draw order and invalidate only when tokens move, terrain changes, or camera rotates. Most frames only need token position updates.

5. **RequestAnimationFrame throttling.** Render at most once per animation frame. Multiple state changes between frames are batched.

6. **Web Worker potential.** If pathfinding becomes a bottleneck with elevation, the A* calculation can be offloaded to a Web Worker. The current A* implementation is already a pure function with no DOM dependencies.

---

## Files to Create/Modify: Complete List Per Phase

### P0 Files

**Create:**
| File | Lines (est.) | Purpose |
|------|-------------|---------|
| `app/composables/useIsometricProjection.ts` | ~120 | Pure math: world-to-screen, screen-to-world, rotation |
| `app/composables/useIsometricCamera.ts` | ~80 | Camera state, rotation animation |
| `app/composables/useIsometricRendering.ts` | ~200 | Render loop (grid cells only in P0) |
| `app/stores/isometricCamera.ts` | ~60 | Shared camera state |
| `app/components/vtt/IsometricCanvas.vue` | ~150 | New canvas component (basic in P0) |
| `app/components/vtt/CameraControls.vue` | ~80 | Rotation buttons |

**Modify:**
| File | Change Description |
|------|--------------------|
| `app/types/spatial.ts` | Add `CameraAngle` type, extend `GridConfig` with isometric fields |
| `app/components/vtt/VTTContainer.vue` | Conditional rendering: GridCanvas vs IsometricCanvas |
| `app/components/vtt/GridSettingsPanel.vue` | Add isometric toggle checkbox, camera angle selector |
| `app/prisma/schema.prisma` | Add `gridIsometric`, `gridCameraAngle`, `gridMaxElevation` columns |

### P1 Files

**Create:**
| File | Lines (est.) | Purpose |
|------|-------------|---------|
| `app/composables/useIsometricInteraction.ts` | ~350 | Mouse handling through isometric projection |
| `app/composables/useDepthSorting.ts` | ~100 | Painter's algorithm sorting |
| `app/composables/useElevation.ts` | ~120 | Elevation editing tools |
| `app/components/vtt/ElevationToolbar.vue` | ~100 | Elevation GM controls |

**Modify:**
| File | Change Description |
|------|--------------------|
| `app/composables/useIsometricRendering.ts` | Add token rendering, movement preview, movement range overlay |
| `app/composables/useGridMovement.ts` | Elevation-aware speed, isValidMove with Z cost |
| `app/composables/useRangeParser.ts` | A* neighbors include elevation transitions, 3D heuristic |
| `app/components/vtt/IsometricCanvas.vue` | Wire interaction composable, token layer |
| `app/components/vtt/VTTToken.vue` | Isometric positioning mode (computed style changes) |
| `app/components/vtt/VTTContainer.vue` | Add elevation toolbar |
| `app/components/vtt/CoordinateDisplay.vue` | Show elevation value |

### P2 Files

**Modify:**
| File | Change Description |
|------|--------------------|
| `app/composables/useIsometricRendering.ts` | Fog overlay, terrain rendering, measurement overlay, background projection |
| `app/composables/useIsometricInteraction.ts` | Fog painting, terrain painting through isometric projection |
| `app/stores/measurement.ts` | 3D distance calculation in getters |
| `app/components/vtt/IsometricCanvas.vue` | Full feature wiring (fog, terrain, measurement) |
| `app/components/vtt/VTTContainer.vue` | Isometric grid settings section |
| `app/components/vtt/GroupGridCanvas.vue` | Isometric rendering mode, camera sync |
| `app/components/vtt/GridSettingsPanel.vue` | Max elevation slider, full isometric config |
| `app/components/vtt/MeasurementToolbar.vue` | 3D distance display text |
| `app/components/vtt/TerrainPainter.vue` | Elevation brush option |
| `app/components/vtt/CoordinateDisplay.vue` | Full elevation display |

---

## Open Questions (Deferred to Implementation)

1. **Smooth vs. snapped rotation.** The design specifies 4 cardinal angles (90-degree snaps). Smooth free rotation adds significant complexity to depth sorting and screen-to-world inversion. Recommend starting with 4 angles and evaluating smooth rotation as a post-P2 enhancement.

2. **Elevation and AoE interaction.** Does a Burst 3 at elevation 2 affect targets at elevation 0? PTU has no explicit elevation rules for AoE. Recommended default: AoE affects all elevations at the affected XY coordinates (column-based, same as fog). Can be tightened later if game balance requires it.

3. **Line of sight with elevation.** Higher elevation should grant LoS advantage (can see over blocking terrain of lower elevation). This is a P2+ enhancement -- the initial implementation treats LoS as 2D (same as current).

4. **Token sprite scaling with elevation.** Should tokens at higher elevation appear slightly larger (atmospheric perspective reverse)? Or same size? Recommend same size for clarity -- elevation is shown by vertical offset, not scale.

5. **Touch/mobile interaction.** The current grid has no touch support. Isometric view makes touch interaction harder. Defer to a separate feature ticket.

---

## Implementation Log

| Phase | Commit | Files Changed | Notes |
|-------|--------|---------------|-------|
| P0 | 57fbe6c | app/types/spatial.ts | CameraAngle type, GridConfig isometric fields |
| P0 | f0f096d | schema.prisma, encounter.service.ts, grid-config.put.ts, VTTContainer.vue | Prisma columns, server serialization, localConfig defaults |
| P0 | d11af9c | app/composables/useIsometricProjection.ts | Pure math: worldToScreen, screenToWorld, rotation, depth key |
| P0 | 98fb80e | app/stores/isometricCamera.ts | Shared camera state Pinia store |
| P0 | 2bf4501 | app/composables/useIsometricCamera.ts | Camera composable with 300ms rotation animation |
| P0 | 64232d7 | app/composables/useIsometricRendering.ts | Render loop: diamond grid, depth sort, background projection |
| P0 | 1ceb1f4 | app/components/vtt/CameraControls.vue | Rotate CW/CCW buttons, angle indicator |
| P0 | f3fb768 | app/components/vtt/IsometricCanvas.vue | Canvas component with camera/zoom/pan, Q/E keys |
| P0 | 5398162 | VTTContainer.vue, GridSettingsPanel.vue | Feature flag wiring, isometric toggle checkbox |
| P0 | aa5b15e | useIsometricProjection.ts, useIsometricRendering.ts | Fix diamond geometry, rendering perf |
| P0 | abb8dd4 | IsometricCanvas.vue | Fix projection composable reuse |

---

## Resolution Log

| Date | Action | Details |
|------|--------|---------|
| 2026-02-22 | Design created | Multi-phase design spec for feature-002 |
| 2026-02-23 | P0 implemented | 11 commits, 6 new files, 6 modified files |
