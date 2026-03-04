---
review_id: code-review-154
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-002-p2
domain: vtt-grid
commits_reviewed:
  - 9faf0cb
  - 18e0548
  - 5a95152
  - 7600cd1
  - 12ddac5
  - 3d7429c
  - ce2d526
  - e5569c1
  - f889906
files_reviewed:
  - app/composables/useIsometricOverlays.ts
  - app/composables/useIsometricRendering.ts
  - app/composables/useIsometricInteraction.ts
  - app/components/vtt/IsometricCanvas.vue
  - app/components/vtt/GroupGridCanvas.vue
  - app/components/vtt/CoordinateDisplay.vue
  - app/components/vtt/MeasurementToolbar.vue
  - app/components/vtt/GridSettingsPanel.vue
  - app/components/vtt/TerrainPainter.vue
  - app/components/vtt/VTTContainer.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 3
reviewed_at: 2026-02-24T18:30:00Z
follows_up: null
---

## Review Scope

P2 of feature-002 (3D Isometric Rotatable Grid). This phase adds isometric-mode feature parity for fog of war, terrain painting with elevation, all 5 measurement modes, background map in group view, camera angle configuration, and 3D distance display. 9 commits, 750 net lines added across 11 files (1 new composable, 10 modified files).

## Issues

### CRITICAL

#### C1: 3D distance computation in VTTContainer is dead code that always returns flat distance

**File:** `app/components/vtt/VTTContainer.vue`, lines 286-303

The `isometric3dDistance` computed property is supposed to calculate 3D distance including elevation deltas between measurement start and end points. However, the actual implementation always produces `startZ = 0` and `endZ = 0`, making the elevation delta always 0. The result is always identical to the flat distance. This means the "3D distance" shown in the MeasurementToolbar is a lie -- it claims to show 3D distance but never accounts for elevation.

The code attempts to call `isometricCanvasRef.value.getTokenElevation?.('')` with an empty string, which will always return 0 (no combatant has an empty string ID). What the code should be doing is looking up terrain elevation at the start and end positions via `getTerrainElevation` (which IS exposed on the IsometricCanvas). The computation should be:

```typescript
const startZ = isometricCanvasRef.value.getTerrainElevation?.(start.x, start.y) ?? 0
const endZ = isometricCanvasRef.value.getTerrainElevation?.(end.x, end.y) ?? 0
```

However, `getTerrainElevation` is NOT currently in the `defineExpose` of `IsometricCanvas.vue`. The elevation composable's `getTerrainElevation` function IS available in the canvas but not exposed. So both the lookup call and the expose need to be fixed.

Similarly, `isometricElevationDelta` always returns 0 with a comment saying "will be enhanced later." Since the MeasurementToolbar already renders this value with a `(+Nz)` suffix, users will see `(+0z)` or nothing. The feature was promised in the ticket; it needs to work or be removed from the display.

**Impact:** Users see a "3D distance" label in the toolbar that is identical to 2D distance. Misleading UI, broken feature claim.

**Fix required:** (1) Add `getTerrainElevation` to IsometricCanvas's `defineExpose`. (2) Use terrain elevation lookup for start/end positions. (3) Compute actual elevation delta. If this cannot be done quickly, remove the distance3d/elevationDelta props from the MeasurementToolbar until they work.

### HIGH

#### H1: TerrainPainter elevation brush is exposed but never consumed by any parent

**File:** `app/components/vtt/TerrainPainter.vue`, lines 96-108 and 248-251

The TerrainPainter now has an `elevationLevel` ref (line 164) exposed via `defineExpose` and a slider UI. However, this value is never read by any parent component. The TerrainPainter itself does not use `elevationLevel` when calling `terrainStore.applyTool()` -- the store's `applyTool` method calls `setTerrain(x, y, paintMode)` with elevation defaulting to 0.

This means the elevation slider is fully non-functional. Users can move the slider, see the value change in the UI, but painting terrain never sets any elevation. The elevation brush was a P2 deliverable.

**Fix required:** Either:
- (a) Wire `elevationLevel` into the terrain painting flow. The `terrainStore.setTerrain()` already accepts an `elevation` parameter. The `applyTool()` action should accept an optional elevation and pass it through, OR
- (b) Have the parent component (VTTContainer or the encounter page) read `elevationLevel` from the exposed ref and call `terrainStore.setTerrain` with that elevation during the paint operation.

#### H2: TerrainPainter is not mounted anywhere -- `isIsometric` and `maxElevation` props never passed

**File:** `app/components/vtt/TerrainPainter.vue`

Searching the entire `app/` directory for any Vue file that references `TerrainPainter` (PascalCase or kebab-case) finds zero results outside of the component itself and test artifacts. The component accepts `isIsometric` and `maxElevation` props but is never instantiated. The VTTContainer.vue does not render a `<TerrainPainter>` element.

This means:
1. The entire elevation brush UI is unreachable by users.
2. The `isIsometric` conditional rendering never triggers because the component is never mounted.

If TerrainPainter is intended to be included in VTTContainer (or the encounter page sidebar), it must be added. If it is meant as an opt-in future component, the ticket should not claim this feature as delivered.

**Note:** The terrain painting itself works fine through the keyboard shortcut (`T`) and direct interaction because `useIsometricInteraction` calls `terrainStore.applyTool()` directly on mouse events. The issue is specifically that the elevation brush UI and the TerrainPainter toolbar are not mounted.

#### H3: Side face rendering ignores camera angle for face visibility

**File:** `app/composables/useIsometricOverlays.ts`, lines 231-266

The `drawTerrainSideFaces` function always draws the "right" face (top.right -> bottom.right -> bottom.bottom -> top.bottom) and "left" face (top.left -> bottom.left -> bottom.bottom -> top.bottom). This is correct for camera angle 0 (north) where those two faces face the viewer. But when the camera rotates to angle 1 (east), 2 (south), or 3 (west), the visible side faces change.

At angle 2 (south, 180 degrees), the "back" faces of the box should be drawn instead of the front faces. The current code always draws the same two faces regardless of angle, which means at camera angles 1/2/3, the side faces will visually overlap with the top face or appear on the wrong sides.

Because `getTileDiamondPoints` internally rotates coordinates, the "right" and "left" named points DO shift with camera angle. So this may partially work. However, the correct visual sides to draw change with camera rotation:
- Angle 0: right face + left face (bottom vertex)
- Angle 1: top face + left face (bottom vertex shifts)
- Angle 2: the two faces that were previously hidden become visible
- Angle 3: similar rotation

The implementation needs to be verified visually at all 4 camera angles. If the projection handles this automatically (because the diamond points already rotate), document that rationale in a comment. Otherwise, select which faces to draw based on the camera angle.

### MEDIUM

#### M1: app-surface.md not updated with new composable

**File:** `.claude/skills/references/app-surface.md`

The new `useIsometricOverlays` composable (478 lines) was not added to the app surface manifest. Per the review checklist: "If new endpoints/components/routes/stores: was app-surface.md updated?"

**Fix required:** Add `useIsometricOverlays` to the composables section of app-surface.md.

#### M2: Deep watchers on entire Pinia store `$state` for re-render scheduling

**File:** `app/components/vtt/IsometricCanvas.vue`, lines 330-340

Three watchers on `fogOfWarStore.$state`, `terrainStore.$state`, and `measurementStore.$state` with `{ deep: true }` trigger re-renders on ANY store state change, including internal bookkeeping fields (`enabled`, `brushSize`, `toolMode`, etc.) that don't affect rendering.

For fog and terrain, the rendering only depends on cell states. For measurement, it depends on mode, affectedCells, and positions. Watching specific getters or state slices would avoid unnecessary re-renders when, for example, the user changes brush size without painting.

This is not a correctness issue because `scheduleRender()` debounces via `requestAnimationFrame`, but it creates unnecessary computed property evaluations on every brush-size change, tool-mode toggle, etc.

**Fix recommended:** Watch the specific rendering-relevant state: `fogOfWarStore.cellStates`, `terrainStore.cells`, and a computed that returns `{ mode: measurementStore.mode, cells: measurementStore.affectedCells }`.

#### M3: Hardcoded side-face fill color

**File:** `app/composables/useIsometricOverlays.ts`, line 243

The side face darkening color `'rgba(0, 0, 0, 0.2)'` is hardcoded inline rather than being derived from the terrain color. This means all terrain types have the same side-face appearance regardless of their base color. Water elevated terrain looks the same as hazard elevated terrain on the sides.

**Fix recommended:** Derive the side face fill from the terrain color. For example, reduce the terrain fill opacity or blend it with a darker shade, similar to how many isometric renderers do `terrainColor.fill` with reduced alpha + a dark overlay.

## What Looks Good

1. **SRP extraction of overlays composable.** Pulling fog, terrain, and measurement rendering into `useIsometricOverlays.ts` (478 lines) keeps `useIsometricRendering.ts` (781 lines) under the 800-line limit. Clean interface with `IsometricOverlayOptions` -- well-structured dependency injection.

2. **Depth-sorted rendering pipeline.** The `sortedCells` computed is shared between the main renderer and the overlay composable via `ComputedRef`, avoiding duplicate sort calculations. Correct painter's algorithm ordering: background -> terrain -> grid -> movement range -> measurement -> hover -> tokens -> movement arrow -> fog.

3. **Fog of war layering.** Fog draws AFTER tokens, so hidden cells properly obscure combatants from group/player view. GM gets a preview with stripes/dots instead of full occlusion. Per-column (2D) fog that covers all elevations at XY is correct for the current data model.

4. **GroupGridCanvas isometric integration.** Clean v-if/v-else switch between IsometricCanvas and GridCanvas based on `config.isometric`. The `activeCanvasRef` computed pattern is correct. Props are passed read-only (isGm=false).

5. **CoordinateDisplay enhancement.** The `isIsometric` prop to always show Z0 elevation is a good UX decision -- isometric mode should always communicate the spatial dimension even at ground level.

6. **Camera angle selector in GridSettingsPanel.** Clean select element with human-readable labels. Emits via the existing `update` event pattern, maintaining consistency with width/height/cellSize.

7. **R key direction cycling.** Clean addition to `handleKeyDown` in `useIsometricInteraction.ts`. Mirrors the 2D grid's keyboard shortcuts. Calls `measurementStore.cycleDirection()` which is already implemented.

8. **Commit granularity.** 9 commits, each focused on a single feature addition. Commit messages are descriptive and follow conventions.

9. **Terrain pattern rendering.** The `drawIsometricTerrainPattern` function handles all 8 terrain types with appropriate visual patterns (X for blocking, waves for water, triangle with ! for hazard, etc.) clipped to the isometric diamond shape.

10. **Measurement overlay with all 5 modes.** Color-coded by mode, with bounds checking (`cell.x >= 0 && cell.x < gridW`), diamond stroke borders, origin dot marker, and dashed distance line with midpoint label for distance mode.

## Verdict

**CHANGES_REQUIRED**

The 3D distance computation (C1) is broken -- it always returns the flat distance while claiming to show 3D distance. The elevation brush UI (H1, H2) is non-functional because (a) the TerrainPainter component is not mounted in any parent, and (b) even if it were, the elevation value is not passed through to the terrain store's paint action. The side face camera-angle handling (H3) needs verification at all 4 angles.

## Required Changes

| ID | Severity | Description | Files |
|----|----------|-------------|-------|
| C1 | CRITICAL | Fix 3D distance computation to use terrain elevation at start/end positions, expose getTerrainElevation from IsometricCanvas | VTTContainer.vue, IsometricCanvas.vue |
| H1 | HIGH | Wire TerrainPainter elevation brush value into terrain store applyTool | TerrainPainter.vue, stores/terrain.ts |
| H2 | HIGH | Mount TerrainPainter in VTTContainer (or parent page) with isIsometric and maxElevation props | VTTContainer.vue |
| H3 | HIGH | Verify side face rendering at all 4 camera angles; add camera-angle-aware face selection or document why current approach works | useIsometricOverlays.ts |
| M1 | MEDIUM | Update app-surface.md with useIsometricOverlays composable | app-surface.md |
| M2 | MEDIUM | Narrow deep watchers to rendering-relevant state slices | IsometricCanvas.vue |
| M3 | MEDIUM | Derive side face color from terrain color instead of hardcoded rgba(0,0,0,0.2) | useIsometricOverlays.ts |
