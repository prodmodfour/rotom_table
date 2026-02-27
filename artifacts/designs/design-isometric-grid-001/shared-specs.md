# Shared Specifications

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

