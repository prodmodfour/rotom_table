# Projection-Agnostic Spatial Engine

A destructive restructuring to replace both the standard grid and isometric grid implementations with a unified spatial engine that operates on abstract coordinates with pluggable projection adapters — addressing the [[grid-isometric-interaction-duplication|~85% code duplication across 4,000+ lines of grid composables]].

## The idea

The app maintains two parallel rendering systems: a standard (top-down square) grid and an isometric grid. Each has its own composables for rendering, interaction, and movement:

| Standard Grid | Isometric Grid | Lines |
|---|---|---|
| `useGridRendering.ts` (731) | `useIsometricRendering.ts` (682) | 1,413 |
| `useGridInteraction.ts` (642) | `useIsometricInteraction.ts` (701) | 1,343 |
| `useGridMovement.ts` (721) | — | 721 |
| `usePathfinding.ts` (669) | — | 669 |
| **Total** | | **4,146** |

The rendering and interaction composables duplicate ~85% of their logic — the same click handling, the same token dragging, the same selection state, the same hover highlighting, the same context menus — differing only in the coordinate transformation (screen position → logical cell and vice versa). Pathfinding and movement operate on logical coordinates but are currently coupled to the standard grid's assumptions.

Delete all of it. Build a spatial engine that separates game logic from visual projection.

```
Spatial Engine Architecture
===========================

┌─────────────────────────────────────────────────────┐
│  Spatial Model (abstract)                           │
│  - LogicalPosition { col, row, elevation }          │
│  - Adjacency graph (which cells connect to which)   │
│  - Terrain / obstacle data per cell                 │
│  - Occupancy map (which entity is where)            │
│  - Distance functions (logical, not visual)         │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    ┌────▼────┐  ┌─────▼────┐  ┌────▼────┐
    │ Square  │  │Isometric │  │  Hex    │
    │Projection│  │Projection│  │Projection│
    │ Adapter │  │ Adapter  │  │ Adapter │
    └────┬────┘  └────┬─────┘  └────┬────┘
         │            │             │
    ┌────▼────────────▼─────────────▼────┐
    │  Rendering Layer                    │
    │  - Token placement (screen coords)  │
    │  - Grid line drawing                │
    │  - Highlight overlays               │
    │  - Animation paths                  │
    └────────────────────────────────────┘
```

```typescript
// The projection adapter — the ONLY thing that differs between grid types
interface ProjectionAdapter {
  // Convert between logical game coordinates and screen pixels
  logicalToScreen(pos: LogicalPosition): ScreenPosition
  screenToLogical(screen: ScreenPosition): LogicalPosition

  // Draw the grid background for a viewport
  drawGrid(ctx: CanvasRenderingContext2D, viewport: Viewport): void

  // Cell shape for hit testing and highlighting
  getCellPath(pos: LogicalPosition): Path2D

  // Token visual offset within a cell (centering, multi-tile)
  getTokenAnchor(pos: LogicalPosition, size: TokenSize): ScreenPosition
}

// Implementations
class SquareProjection implements ProjectionAdapter {
  constructor(private cellSize: number) {}
  logicalToScreen({ col, row }) { return { x: col * this.cellSize, y: row * this.cellSize } }
  screenToLogical({ x, y }) { return { col: Math.floor(x / this.cellSize), row: Math.floor(y / this.cellSize) } }
  // ...
}

class IsometricProjection implements ProjectionAdapter {
  constructor(private tileWidth: number, private tileHeight: number) {}
  logicalToScreen({ col, row }) {
    return { x: (col - row) * this.tileWidth / 2, y: (col + row) * this.tileHeight / 2 }
  }
  screenToLogical({ x, y }) {
    return { col: Math.round(x / this.tileWidth + y / this.tileHeight),
             row: Math.round(y / this.tileHeight - x / this.tileWidth) }
  }
  // ...
}

class HexProjection implements ProjectionAdapter { /* future */ }

// Game logic operates on the spatial model — projection-agnostic
class SpatialEngine {
  constructor(private grid: SpatialModel, private projection: ProjectionAdapter) {}

  findPath(from: LogicalPosition, to: LogicalPosition): LogicalPosition[] {
    // A* on the adjacency graph — no projection math involved
    return astar(this.grid.adjacencyGraph, from, to, this.grid.getMoveCost)
  }

  getAdjacentCells(pos: LogicalPosition): LogicalPosition[] {
    return this.grid.adjacencyGraph.neighbors(pos)
  }

  isInRange(from: LogicalPosition, to: LogicalPosition, range: number): boolean {
    return this.grid.logicalDistance(from, to) <= range
  }

  getFlankingBonus(attacker: LogicalPosition, defender: LogicalPosition, allies: LogicalPosition[]): number {
    // Flanking is about adjacency, not visual projection
    return computeFlanking(this.grid.adjacencyGraph, attacker, defender, allies)
  }
}

// One set of composables for ALL projections
function useGridInteraction(engine: SpatialEngine) {
  // Click handling, drag, hover, selection — all projection-agnostic
  // The engine.projection converts screen events to logical coordinates
  const onCellClick = (screenPos: ScreenPosition) => {
    const logical = engine.projection.screenToLogical(screenPos)
    // ... same logic regardless of projection
  }
}
```

## Why this is destructive

- **All 7 grid/isometric composables are deleted** (~4,146 lines). `useGridRendering.ts`, `useGridInteraction.ts`, `useGridMovement.ts`, `useIsometricRendering.ts`, `useIsometricInteraction.ts`, `usePathfinding.ts`, and supporting geometry utils are all replaced.
- **Grid Vue components are rewritten.** `VttGrid.vue`, `IsometricGrid.vue`, and all grid-related sub-components are unified into a single set of projection-agnostic components.
- **The `utils/flankingGeometry.ts`, `utils/bresenhamLine.ts`, and other geometry utils are absorbed** into the spatial model layer.
- **The concept of "grid type" stops being a rendering concern and becomes a configuration.** The spatial model is the same; only the projection adapter differs. Switching between top-down and isometric becomes changing one adapter — not swapping an entire rendering pipeline.
- **Multi-tile tokens, line of sight, area of effect, and terrain rendering** are all reimplemented once against the spatial model, not duplicated per projection.

## Principles improved

- [[single-responsibility-principle]] — game logic (pathfinding, flanking, range, AoE) has one responsibility: operate on the spatial model. Rendering has one responsibility: project spatial state to screen. Currently, both are interleaved in 700+ line composables.
- [[open-closed-principle]] — adding a new projection (hex, 3D perspective) requires implementing one adapter interface. Zero changes to game logic, interaction handling, or token management.
- [[dependency-inversion-principle]] — game logic depends on the `SpatialModel` abstraction. Rendering depends on the `ProjectionAdapter` abstraction. Neither depends on the other's implementation.
- [[liskov-substitution-principle]] — `SquareProjection`, `IsometricProjection`, and `HexProjection` are fully interchangeable through the `ProjectionAdapter` interface.
- [[interface-segregation-principle]] — the projection adapter interface is minimal (5–6 methods). Game logic doesn't see rendering details; rendering doesn't see game logic.
- Eliminates [[grid-isometric-interaction-duplication]] — the duplication is impossible because there is only one set of composables.
- Eliminates the [[duplicate-code-smell]] — ~3,500 lines of duplicated code removed.

## Patterns and techniques

- [[strategy-pattern]] — `ProjectionAdapter` implementations are interchangeable strategies for coordinate transformation
- [[bridge-pattern]] — the spatial model (abstraction) is decoupled from the projection (implementation). Either can vary independently.
- [[adapter-pattern]] — each projection adapter adapts logical coordinates to screen coordinates
- [[template-method-pattern]] — the interaction composable defines the algorithm skeleton (click → convert → resolve → update); the projection adapter supplies the conversion step
- Model-View separation — the spatial model is the model; the projection adapter and rendering layer are the view

## Trade-offs

- **Projection adapter expressiveness.** The interface must be rich enough that `drawGrid` can produce visually appealing results for each projection, including grid lines, elevation shading, terrain textures, fog of war overlays. If the interface is too thin, adapters become bloated workarounds.
- **Performance-sensitive rendering.** The current code likely has projection-specific optimizations (e.g., isometric culling, tile batching). A generic interface may not expose hooks for these optimizations, leading to slower rendering.
- **Multi-tile token complexity.** A 2x2 token in square grid occupies 4 cells. In isometric view, those same 4 cells render as a diamond. In hex, they might be a cluster. The `getTokenAnchor` abstraction must handle this generically, which may be very complex.
- **Elevation rendering.** Isometric grids represent elevation visually (tiles stack vertically). Square grids typically use color/number overlays. The projection adapter must handle elevation rendering differently, which may push too much logic into the adapter.
- **Loss of direct canvas control.** The current composables have fine-grained control over canvas rendering order, z-indexing, and animation. A generic engine may constrain this control, leading to visual regression.
- **Migration scope.** The grid system is deeply integrated with the VTT components, the encounter page, and the movement/placement services. Replacing it requires touching a large portion of the frontend.

## Open questions

- Should the spatial engine live on the client only, or should the server also use it for validation (e.g., server-side pathfinding for movement validation)?
- Is Canvas the right rendering target, or should this use SVG or WebGL for the rendering layer? The projection adapter could be rendering-backend-agnostic.
- How does this interact with [[game-engine-extraction]]? If the engine package includes spatial logic (pathfinding, flanking, range), the client spatial engine calls the same functions the server uses.
- How does this interact with [[domain-module-architecture]]? Does the spatial engine constitute its own module, or is it a shared utility?
- How are projection-specific user interactions handled (e.g., scrolling in isometric has a different feel than scrolling in square)? Does the adapter handle input transformation, or is that a separate layer?
- How is the transition managed? Can both the old grid system and new spatial engine coexist during migration, or is this a hard cutover?

## See also

- [[grid-isometric-interaction-duplication]] — the problem this addresses
- [[grid-interaction-unification]] — the incremental approach (extract shared code) that this supersedes
- [[geometry-utility-extraction]] — absorbed into the spatial model layer
- [[strategy-pattern]] — the adapter selection pattern
- [[bridge-pattern]] — the structural pattern that separates abstraction from implementation
- [[game-engine-extraction]] — spatial game logic would live in the engine
