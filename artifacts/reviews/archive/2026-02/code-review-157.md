---
review_id: code-review-157
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: feature-002-p2-fix
domain: vtt
commits_reviewed:
  - 5fcd6ce
  - 6fcaa06
  - cacda1a
  - 1823f5b
  - a866d87
  - f9e0b1e
  - 8c03d71
  - 9b184d6
files_reviewed:
  - app/components/vtt/VTTContainer.vue
  - app/components/vtt/IsometricCanvas.vue
  - app/components/vtt/TerrainPainter.vue
  - app/stores/terrain.ts
  - app/composables/useIsometricOverlays.ts
  - app/composables/useIsometricInteraction.ts
  - app/composables/useIsometricRendering.ts
  - app/composables/useElevation.ts
  - .claude/skills/references/app-surface.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 0
reviewed_at: 2026-02-24T20:45:00Z
follows_up: code-review-154
---

## Review Scope

Re-review of 8 fix commits addressing the 7 issues from code-review-154 (CHANGES_REQUIRED). The original issues were: C1 (3D distance dead code), H1 (elevation brush not wired), H2 (TerrainPainter not mounted), H3 (side face camera angle), M1 (app-surface not updated), M2 (deep watchers on full store state), M3 (hardcoded side face color). This review verifies each fix individually and checks for regressions against rules-review-144 (APPROVED).

## Issue Resolution Verification

### C1: 3D distance computation — RESOLVED

**Commit:** `5fcd6ce`
**Files:** `VTTContainer.vue`, `IsometricCanvas.vue`

The fix correctly addresses both halves of the original issue:

1. **`getTerrainElevation` exposed from IsometricCanvas.** Line 365 of `IsometricCanvas.vue` now includes `getTerrainElevation: elevation.getTerrainElevation` in `defineExpose`. This connects to `useElevation.getTerrainElevation` which reads `terrainStore.getCellAt(x, y)?.elevation ?? 0` -- correct.

2. **VTTContainer uses terrain elevation for 3D distance.** Lines 296-314 of `VTTContainer.vue` now call `isometricCanvasRef.value.getTerrainElevation(start.x, start.y)` and `getTerrainElevation(end.x, end.y)` to get actual terrain elevations. The formula changed from the broken `flatDist + elevDelta` (always 0) to `Math.sqrt(flatDist^2 + dz^2)` -- a 3D Euclidean approach using Chebyshev for the XY plane. This is a reasonable approximation for visual distance display.

3. **`isometricElevationDelta`** (lines 316-328) now returns the actual signed elevation delta (`endZ - startZ`) instead of hardcoded 0.

4. **Guard clause** (`if (!isometricCanvasRef.value?.getTerrainElevation)`) properly falls back to flat distance when the canvas ref is not yet available.

No issues found.

### H1: Elevation brush wiring — RESOLVED

**Commit:** `6fcaa06`
**Files:** `useIsometricInteraction.ts`, `IsometricCanvas.vue`, `stores/terrain.ts`

The fix correctly threads the elevation value through the terrain painting flow:

1. **`terrainStore.applyTool`** now accepts an `elevation` parameter (default 0) and passes it to `setTerrain`. This is a backwards-compatible signature change.

2. **`useIsometricInteraction`** accepts a new `terrainPaintElevation?: Ref<number>` option and uses it at the initial click site (line 338): `terrainStore.applyTool(gridPos.x, gridPos.y, options.terrainPaintElevation?.value ?? 0)`.

3. **`IsometricCanvas.vue`** passes `elevation.brushElevation` as `terrainPaintElevation` to the interaction composable (line 206).

**However**, see H-NEW below for a regression in the drag painting path.

### H2: TerrainPainter mounted — RESOLVED

**Commit:** `cacda1a`
**Files:** `VTTContainer.vue`

The fix correctly mounts TerrainPainter:

1. **Template:** `<TerrainPainter>` is rendered with `v-if="config.enabled && config.isometric && isGm"`, passing `:is-isometric="true"` and `:max-elevation="config.maxElevation ?? 5"`. Correct conditional -- only shows in isometric mode for GM.

2. **Script:** Imports `TerrainPainter`, adds `terrainPainterRef`, and sets up a watcher (lines 500-507) that syncs `terrainPainterRef.value?.elevationLevel` to `isometricCanvasRef.value.setBrushElevation(newLevel)`. This connects the UI slider to the elevation composable's brush level.

3. **Ref flow:** TerrainPainter's `elevationLevel` ref -> watcher in VTTContainer -> `isometricCanvasRef.setBrushElevation()` -> `elevation.setBrushElevation()` -> updates `brushElevation` ref -> read by `useIsometricInteraction` via `terrainPaintElevation` option. The full chain is verified.

No issues found.

### H3: Side face camera angle — RESOLVED

**Commit:** `1823f5b`
**Files:** `useIsometricOverlays.ts`

The fix adds documentation (lines 249-253) explaining why camera-angle-aware face selection is unnecessary. The rationale is correct:

- `getTileDiamondPoints` calls `worldToScreen` which calls `rotateCoords` internally (line 76 of `useIsometricProjection.ts`).
- The diamond points "top", "right", "bottom", "left" are named after their screen-space positions, not world-space positions. At any camera angle, the "bottom" point always has the highest screen-Y (closest to the viewer in painter's algorithm terms).
- Therefore the right-to-bottom and left-to-bottom faces are always the two faces visible to the camera, regardless of rotation.

This is a valid geometric proof and matches the implementation. The original review (code-review-154) acknowledged this possibility: "If the projection handles this automatically (because the diamond points already rotate), document that rationale in a comment."

No issues found.

### M1: app-surface.md — RESOLVED

**Commit:** `a866d87`
**Files:** `.claude/skills/references/app-surface.md`

Both additions are correct:
1. `useIsometricOverlays.ts` added to composables list with accurate description.
2. `TerrainPainter.vue` added to components list with accurate description.

No issues found.

### M2: Narrow deep watchers — RESOLVED

**Commit:** `f9e0b1e`
**Files:** `IsometricCanvas.vue`

The fix replaces three broad `$state` watchers with targeted ones:

1. **Fog:** Replaced `fogOfWarStore.$state` with two separate watchers: `fogOfWarStore.cellStates` (deep, for cell state changes) and `fogOfWarStore.enabled` (shallow, for toggle). This correctly skips re-renders when `toolMode` or `brushSize` change.

2. **Terrain:** Replaced `terrainStore.$state` with `terrainStore.cells` (deep). This correctly skips re-renders when `paintMode`, `brushSize`, or `enabled` change.

3. **Measurement:** Replaced `measurementStore.$state` with a computed `measurementRenderState` that picks only `mode`, `startPosition`, `endPosition`, `aoeSize`, `aoeDirection`. This correctly skips internal bookkeeping fields like `isActive`.

All rendering-relevant fields are covered. No fields that affect visual output were omitted.

No issues found.

### M3: Side face color derivation — RESOLVED

**Commit:** `8c03d71`
**Files:** `useIsometricOverlays.ts`

The fix replaces the hardcoded `rgba(0, 0, 0, 0.2)` with a `darkenRgba()` utility function that:

1. Parses the terrain type's fill color (e.g., water is `rgba(30, 144, 255, 0.4)`).
2. Blends toward black by the specified amount. Right face gets 30% darkening, left face gets 50% darkening.
3. Bumps the alpha by 0.2 (capped at 1.0) for more opaque side faces.

This means water elevated terrain now has blue side faces, hazard has red-orange side faces, etc. Different terrain types are now visually distinguishable on their side faces. The two-tone shading (right lighter, left darker) gives a convincing lighting effect.

The `drawTerrainSideFaces` signature correctly added the `fillColor` parameter, and the caller (`drawTerrainLayer` line 236) passes `terrainColor.fill` and `terrainColor.stroke`.

The regex `rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)` handles both `rgb()` and `rgba()` formats. For the terrain colors used in this codebase (all `rgba()` with integer RGB components), this is correct.

No issues found.

## Issues

### HIGH

#### H-NEW: Terrain drag painting does not pass elevation to applyTool

**File:** `app/composables/useIsometricInteraction.ts`, line 477
**Introduced by:** Incomplete fix in commit `6fcaa06`

The H1 fix correctly passes the terrain paint elevation on the initial mouse-down click (line 338):
```typescript
terrainStore.applyTool(gridPos.x, gridPos.y, options.terrainPaintElevation?.value ?? 0)
```

But the drag painting handler in `handleMouseMove` (line 477) still calls:
```typescript
terrainStore.applyTool(gridPos.x, gridPos.y)
```

This omits the elevation parameter, which defaults to 0 in the store's `applyTool` method. This means:

- **Click once:** First cell painted at the correct elevation from the slider.
- **Click and drag:** First cell correct, all subsequent cells in the drag stroke are painted at elevation 0.

Since terrain painting is almost always done by click-and-drag (painting a river, a wall, a hill), this effectively makes the elevation brush non-functional for typical usage.

**Fix required:** Line 477 should be:
```typescript
terrainStore.applyTool(gridPos.x, gridPos.y, options.terrainPaintElevation?.value ?? 0)
```

## Rules Regression Check

Verified against rules-review-144 (APPROVED):

1. **Fog of war 3-state system:** No changes to fog rendering or state management in the fix commits. The narrow watcher fix (M2) still watches `cellStates` and `enabled`, which are the only rendering-relevant fog fields. No regression.

2. **Terrain types and movement costs:** The `applyTool` signature change adds an optional `elevation` parameter with default 0. Existing callers that don't pass elevation continue to work identically. `setTerrain` already accepted elevation. No regression.

3. **Terrain elevation rendering:** The side face rendering now uses terrain-derived colors instead of hardcoded black. The face geometry is unchanged. No regression.

4. **Measurement distance calculation:** The 3D distance computation now uses actual terrain elevation instead of hardcoded 0. The XY-plane distance still uses Chebyshev (same as before). The elevation delta is now a real value. This is an improvement, not a regression.

5. **Measurement AoE shapes:** Unchanged by fix commits. No regression.

6. **PTU diagonal movement:** Unchanged by fix commits. No regression.

7. **Camera rotation correctness:** The documented rationale confirms the existing behavior is correct. No code changes to projection or rotation. No regression.

**Rules verdict: No regressions.**

## What Looks Good

1. **C1 fix is thorough.** Both `getTerrainElevation` exposure and the distance computation rewrite were done correctly. The guard clause gracefully degrades to flat distance when the canvas ref is unavailable.

2. **M3 darkenRgba utility is well-implemented.** Clean regex parsing, appropriate darkening amounts, alpha bump for visibility. The two-tone shading (right=30%, left=50%) creates convincing directional lighting.

3. **M2 watcher narrowing is precise.** The computed `measurementRenderState` object correctly captures exactly the fields that affect overlay rendering. The fog watcher split into `cellStates` (deep) + `enabled` (shallow) is correct because `enabled` is a primitive boolean that doesn't need deep watching.

4. **H3 documentation rationale is mathematically sound.** The explanation that `worldToScreen` applies `rotateCoords` internally, making the diamond's "bottom" point always the camera-facing vertex, is correct and verifiable in the projection code.

5. **H2 watcher chain is complete.** The TerrainPainter -> VTTContainer watcher -> IsometricCanvas -> useElevation -> useIsometricInteraction pipeline correctly threads the elevation slider value all the way to the paint action.

6. **Commit granularity is excellent.** 8 commits, one per issue, each focused and correctly attributed. The docs commit for the fix cycle resolution log is a good practice.

7. **No file size regressions.** All files remain under 800 lines (largest: `useIsometricRendering.ts` at 781).

## Verdict

**CHANGES_REQUIRED**

Six of seven original issues are fully resolved. One new HIGH issue was introduced as an incomplete fix: the terrain drag painting path in `handleMouseMove` does not pass the elevation parameter to `applyTool`, making the elevation brush effectively non-functional during drag painting (which is the primary painting workflow). This is a one-line fix.

## Required Changes

| ID | Severity | Description | Files |
|----|----------|-------------|-------|
| H-NEW | HIGH | Pass `terrainPaintElevation` to `terrainStore.applyTool` in the drag painting handler (`handleMouseMove` line 477), matching the initial click handler at line 338 | `app/composables/useIsometricInteraction.ts` |
