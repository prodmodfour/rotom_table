---
review_id: code-review-140
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-002
domain: vtt-grid
commits_reviewed:
  - becb50f
  - 2963483
  - 485d56f
  - 7efef82
  - fadfc0e
  - 71ff4bc
  - 30abc35
  - dd310b1
  - 54f3d71
  - 604547f
  - 79edc01
  - df2e2c8
files_reviewed:
  - app/composables/useIsometricProjection.ts
  - app/composables/useIsometricCamera.ts
  - app/composables/useIsometricRendering.ts
  - app/stores/isometricCamera.ts
  - app/components/vtt/IsometricCanvas.vue
  - app/components/vtt/CameraControls.vue
  - app/types/spatial.ts
  - app/prisma/schema.prisma
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/grid-config.put.ts
  - app/components/vtt/VTTContainer.vue
  - app/components/vtt/GridSettingsPanel.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 4
  medium: 3
reviewed_at: 2026-02-23T09:00:00Z
follows_up: (none)
---

## Review Scope

First review of feature-002 P0: 3D Isometric Grid rendering engine. 12 commits across 6 new files and 6 modified files. Scope covers isometric projection math, camera rotation with animation, rendering composable, Prisma schema additions, feature flag integration, and the new IsometricCanvas component.

Reviewed against: design spec `design-isometric-grid-001.md`, feature ticket `feature-002.md`, project CLAUDE.md standards.

---

## Issues

### CRITICAL

#### C1. `EncounterRecord` interface missing isometric fields -- all `(record as any)` casts hide type errors

**Files:** `app/server/services/encounter.service.ts` (lines 208-210), `app/server/api/encounters/[id]/grid-config.put.ts` (lines 59-61, 71-73)

The Prisma schema correctly adds `gridIsometric`, `gridCameraAngle`, and `gridMaxElevation` columns to the `Encounter` model. However, the hand-written `EncounterRecord` interface in `encounter.service.ts` (lines 12-45) was NOT updated to include these three fields. As a result, every access uses `(record as any).gridIsometric`, `(record as any).gridCameraAngle`, and `(record as any).gridMaxElevation` -- six total `as any` casts across two files.

This is a correctness issue because:
1. **The `as any` casts completely bypass TypeScript's type system.** If a Prisma migration fails or the column names change, there will be zero compile-time warning. The fields will silently resolve to `undefined` and the `?? false` / `?? 0` / `?? 5` fallbacks will mask the bug.
2. **The `EncounterRecord` is the single source of truth** for how the server layer reads encounter data. Every endpoint that calls `buildEncounterResponse` (24 endpoints) flows through this type. A missing field here is not a minor typing inconvenience -- it is a structural gap that will cause silent data loss if the column name ever drifts.
3. **The pattern violates DIP.** The service layer should depend on its own typed abstraction of the DB record, not cast to `any` to reach around it.

**Fix:** Add the three fields to the `EncounterRecord` interface:
```typescript
gridIsometric: boolean
gridCameraAngle: number
gridMaxElevation: number
```
Then remove all six `(record as any)` casts and use `record.gridIsometric`, `record.gridCameraAngle`, `record.gridMaxElevation` directly.

---

### HIGH

#### H1. No server-side validation for `cameraAngle` and `maxElevation` in grid-config PUT endpoint

**File:** `app/server/api/encounters/[id]/grid-config.put.ts`

The endpoint validates `width` (5-100), `height` (5-100), and `cellSize` (20-100) but does NOT validate the new isometric fields:
- `cameraAngle` accepts any number (should be 0-3 only). Sending `cameraAngle: 99` would be stored in the DB and later cast to `CameraAngle` via `as 0 | 1 | 2 | 3`, which is an unsafe cast. The projection math's `switch(angle)` in `rotateCoords` would hit no case and return `undefined`, causing NaN propagation through the entire rendering pipeline.
- `maxElevation` accepts any number (should be 1-10 per the design spec). Negative values or extremely large values would be stored.
- `isometric` is not validated as boolean (though Prisma may coerce it).

**Fix:** Add validation after the existing `cellSize` check:
```typescript
if (body.cameraAngle !== undefined && (body.cameraAngle < 0 || body.cameraAngle > 3 || !Number.isInteger(body.cameraAngle))) {
  throw createError({ statusCode: 400, message: 'Camera angle must be 0, 1, 2, or 3' })
}
if (body.maxElevation !== undefined && (body.maxElevation < 1 || body.maxElevation > 10)) {
  throw createError({ statusCode: 400, message: 'Max elevation must be between 1 and 10' })
}
```

#### H2. Encounter template endpoints do not serialize/deserialize isometric grid fields

**Files:** `app/server/api/encounter-templates/from-encounter.post.ts` (line 80-86), `app/server/api/encounter-templates/[id]/load.post.ts` (lines 130-151, 171-177)

The `from-encounter.post.ts` endpoint saves encounter data as a template but only copies `gridWidth`, `gridHeight`, and `gridCellSize` -- the new `gridIsometric`, `gridCameraAngle`, and `gridMaxElevation` fields are silently dropped. When a template is loaded via `load.post.ts`, the `gridConfig` object in the response (line 171-177) also omits `isometric`, `cameraAngle`, and `maxElevation`.

The Prisma schema for `EncounterTemplate` correctly has `gridIsometric Boolean?`, `gridCameraAngle Int?`, `gridMaxElevation Int?` -- but the API code never reads or writes them.

**Impact:** If a GM saves an isometric encounter as a template and later loads it, the isometric settings are lost. The encounter reverts to 2D flat grid.

**Fix:** Update both endpoints to include the three isometric fields in their Prisma create/read operations and response objects.

#### H3. Context menu event listener in IsometricCanvas.vue is never cleaned up

**File:** `app/components/vtt/IsometricCanvas.vue` (line 246)

```typescript
containerRef.value?.addEventListener('contextmenu', (e) => e.preventDefault())
```

This adds an anonymous function as a `contextmenu` listener in `onMounted` but never removes it in `onUnmounted`. While the listener is on a component-owned DOM element (which gets GC'd on unmount in most cases), this is a fragile pattern:
1. If the container ref is reused or the component is kept alive, the listener accumulates.
2. The existing `window.addEventListener('resize', ...)` and `window.addEventListener('keydown', ...)` are properly cleaned up -- this one is inconsistent.

**Fix:** Store the listener reference and remove it in `onUnmounted`, or use Vue's `@contextmenu.prevent` on the template element (which handles cleanup automatically). The template approach is cleaner:
```html
<div ref="containerRef" class="isometric-canvas-container" @contextmenu.prevent ... >
```

#### H4. `getGridOriginOffset` bounding box under-calculates by exactly one cell width

**File:** `app/composables/useIsometricProjection.ts` (lines 172-195)

The offset calculation uses corners at `(0,0)`, `(gridW-1, 0)`, `(0, gridH-1)`, `(gridW-1, gridH-1)`. But each tile diamond extends from `worldToScreen(x,y)` to `worldToScreen(x+1, y+1)` (via `getTileDiamondPoints`). The actual rendered extent of the grid includes `worldToScreen(gridW, 0)`, `worldToScreen(0, gridH)`, and `worldToScreen(gridW, gridH)`.

At angle 0, the leftmost screen point is `worldToScreen(0, gridH)`, not `worldToScreen(0, gridH-1)`. The difference is exactly `tileHalfW = cellSize`. By coincidence, the padding added on line 190 (`cellSize`) exactly compensates for this off-by-one. However:
1. At angles 1 and 3, where the grid dimensions swap roles, the compensation may not be exact if `gridW != gridH`.
2. The padding is meant to be visual margin, not a correction for a bounding box error. If someone changes the padding value, the grid will clip.

**Fix:** Use the actual grid extent corners:
```typescript
const corners = [
  worldToScreen(0, 0, 0, angle, gridW, gridH, cellSize),
  worldToScreen(gridW, 0, 0, angle, gridW, gridH, cellSize),
  worldToScreen(0, gridH, 0, angle, gridW, gridH, cellSize),
  worldToScreen(gridW, gridH, 0, angle, gridW, gridH, cellSize)
]
```

---

### MEDIUM

#### M1. Rotation animation renders the snap, not the interpolation

**Files:** `app/composables/useIsometricCamera.ts` (lines 39-42), `app/stores/isometricCamera.ts` (lines 33-37), `app/composables/useIsometricRendering.ts`

The rotation animation system updates `rotationProgress` from 0 to 1 over 300ms via `easeInOutCubic`. However, the rendering composable never uses `rotationProgress` to interpolate between the old and new camera angles. The store's `rotateClockwise()` immediately sets `targetAngle` and `isRotating = true`, but `completeRotation()` is what sets `angle = targetAngle`. During the animation, `store.angle` remains at the OLD angle, and the rendering composable reads `cameraAngle` (which equals `store.angle`).

So the visual effect is: the grid sits at the old angle for 300ms while `rotationProgress` ticks, then snaps to the new angle when `completeRotation()` fires. There is no smooth visual rotation.

This is not a regression (the feature is new), but it contradicts the design spec's "smooth 90-degree transition" requirement. The `rotationProgress` ref and `easeInOutCubic` function are dead code paths that suggest interpolation was intended but not wired.

**Fix:** Either (a) implement actual interpolation by computing intermediate projection values using `rotationProgress` between `angle` and `targetAngle`, or (b) remove the animation infrastructure (`rotationProgress`, `easeInOutCubic`, `animateRotation`) and document that P0 uses instant snapping, with smooth rotation deferred to P1/P2.

#### M2. `drawIsometricGrid` allocates and sorts a new array every frame

**File:** `app/composables/useIsometricRendering.ts` (lines 186-193)

Every render frame creates an array of `gridW * gridH` objects and sorts them. For a 40x30 grid, that is 1,200 object allocations and an O(n log n) sort per frame. While this is tolerable for P0 (no tokens, no fog, no terrain -- just grid lines), it will become a performance bottleneck in P1/P2 when additional drawables are added.

The depth sort order only changes when the camera angle changes. Between rotations, the sort order is stable.

**Fix:** Cache the sorted cell array. Recompute it only when `cameraAngle`, `gridW`, or `gridH` changes. This is an easy win -- create a `computed` or `watch` that rebuilds the sorted array on those dependencies, and reference it in `drawIsometricGrid`.

#### M3. `drawDiamondCell` calls `beginPath` twice per cell (fill + stroke)

**File:** `app/composables/useIsometricRendering.ts` (lines 203-248)

Each diamond cell is drawn with two separate `beginPath -> moveTo -> lineTo*3 -> closePath` cycles: one for fill and one for stroke. For 1,200 cells, that is 2,400 canvas path operations. The fill and stroke share the same path geometry.

**Fix:** Construct the path once, then call both `fill()` and `stroke()` on the same path:
```typescript
ctx.beginPath()
ctx.moveTo(diamond.top.x, diamond.top.y)
ctx.lineTo(diamond.right.x, diamond.right.y)
ctx.lineTo(diamond.bottom.x, diamond.bottom.y)
ctx.lineTo(diamond.left.x, diamond.left.y)
ctx.closePath()
ctx.fillStyle = GRID_FILL_COLOR
ctx.fill()
ctx.strokeStyle = GRID_LINE_COLOR
ctx.lineWidth = GRID_LINE_WIDTH
ctx.stroke()
```

---

## What Looks Good

1. **Projection math is correct.** I manually verified `rotateCoords` and `unrotateCoords` are true inverses for all 4 angles on non-square grids. The `worldToScreen` / `screenToWorld` pair correctly handles the 2:1 tile ratio and elevation offset. The `getTileDiamondPoints` correctly uses (x, y), (x+1, y), (x+1, y+1), (x, y+1) to define the diamond corners rather than trying to compute half-widths from center.

2. **Composable architecture follows SRP well.** Projection math (pure, stateless), camera state (Pinia store + composable wrapper), and rendering (canvas operations) are cleanly separated into distinct files. Each composable has a clear single responsibility. The projection composable is truly pure -- no refs, no side effects, no state.

3. **Feature flag isolation is solid.** The `VTTContainer.vue` conditional (`v-if="config.isometric"` / `v-else`) cleanly swaps between GridCanvas and IsometricCanvas. Both components expose the same `defineExpose` interface (`zoomIn`, `zoomOut`, `resetView`, `render`), and the parent uses `activeCanvasRef` to abstract over which is active. Zero changes to the existing GridCanvas code path.

4. **Camera store design is forward-looking.** The `isometricCamera` store separates `angle` from `targetAngle` with an `isRotating` flag, which cleanly supports animation. The `completeRotation()` action pattern ensures the store stays consistent even if animation is interrupted.

5. **File sizes are all well within limits.** Largest file is `IsometricCanvas.vue` at 298 lines (under 300). All composables are under 260 lines. Good granularity.

6. **Prisma schema changes are safe.** All three new columns have `@default()` values (`false`, `0`, `5`), so existing encounters are unaffected. The `EncounterTemplate` model correctly uses nullable types (`Boolean?`, `Int?`) since templates may not specify isometric settings.

7. **Commit granularity is exemplary.** 12 commits for 12 logical steps. Each commit introduces one cohesive change (type definitions, schema, projection math, store, camera composable, rendering, component, wiring, bug fixes, docs). This is the right granularity.

8. **Mouse interaction in IsometricCanvas correctly reverses the camera transform.** The `updateHoveredCell` method properly applies the inverse of pan -> zoom -> grid origin offset before passing to `screenToWorld`. This is a common source of bugs in Canvas-based UIs and it is handled correctly here.

---

## Verdict

**CHANGES_REQUIRED**

The `(record as any)` casts in the encounter service are a CRITICAL type safety gap that must be fixed before this code merges. The missing server-side validation (H1) creates a vector for NaN propagation through the rendering pipeline. The template endpoint gap (H2) means isometric encounters lose their settings on save/load, which is a functional regression for the template system.

---

## Required Changes

| ID | Severity | File(s) | Fix |
|----|----------|---------|-----|
| C1 | CRITICAL | `encounter.service.ts` | Add `gridIsometric`, `gridCameraAngle`, `gridMaxElevation` to `EncounterRecord` interface; remove all 6 `(record as any)` casts |
| H1 | HIGH | `grid-config.put.ts` | Add validation for `cameraAngle` (0-3 integer) and `maxElevation` (1-10) |
| H2 | HIGH | `from-encounter.post.ts`, `load.post.ts` | Serialize/deserialize isometric grid fields in template save/load |
| H3 | HIGH | `IsometricCanvas.vue` | Use `@contextmenu.prevent` on template element or clean up listener in `onUnmounted` |
| H4 | HIGH | `useIsometricProjection.ts` | Fix bounding box to use `(0,0), (gridW,0), (0,gridH), (gridW,gridH)` |
| M1 | MEDIUM | `useIsometricCamera.ts`, `useIsometricRendering.ts` | Either wire rotation interpolation or remove dead animation code and document instant snap as P0 behavior |
| M2 | MEDIUM | `useIsometricRendering.ts` | Cache sorted cell array; recompute only on angle/grid dimension changes |
| M3 | MEDIUM | `useIsometricRendering.ts` | Combine fill and stroke into single canvas path per cell |
