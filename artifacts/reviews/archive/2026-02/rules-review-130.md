---
review_id: rules-review-130
review_type: rules
reviewer: game-logic-reviewer
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
mechanics_verified:
  - grid-movement
  - diagonal-cost
  - feature-flag-isolation
  - grid-dimensions
  - pathfinding-integrity
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#diagonal-movement
reviewed_at: 2026-02-23T09:30:00Z
follows_up: (none)
---

## Mechanics Verified

### 1. PTU Diagonal Movement (Alternating 1m/2m)

- **Rule:** "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth." (`core/07-combat.md`, lines 425-428)
- **Implementation:** `useGridMovement.ts` lines 130-138 (`calculateMoveDistance`) and `useRangeParser.ts` lines 587-595 (`calculateMoveCost`) both implement: `diagonalCost = diagonals + Math.floor(diagonals / 2)` plus straights. The flood-fill in `getMovementRangeCells` (lines 538-548) tracks diagonal parity explicitly, alternating cost 1 and 2. The A* pathfinder in `calculatePathCost` (lines 732-740) does the same.
- **Status:** CORRECT -- None of these files were modified by the reviewed commits. `git diff master` for `useGridMovement.ts`, `useRangeParser.ts`, `useGridInteraction.ts`, and `useCanvasRendering.ts` all produce empty output. The diagonal movement logic is completely untouched.

### 2. Grid Dimensions Preserved

- **Rule:** Encounter grid dimensions (`gridWidth` x `gridHeight`) define the tactical map size. All movement, range, AoE, and fog calculations operate on this grid.
- **Implementation:** The `GridConfig` interface (`types/spatial.ts`) retains the original `width`, `height`, and `cellSize` fields. The new isometric fields (`isometric`, `cameraAngle`, `maxElevation`) are additive -- they do not replace or modify the existing dimension fields. In `useIsometricRendering.ts` line 98: `const { cellSize, width: gridW, height: gridH } = config` -- the rendering composable reads the same dimensions. The grid loop in `drawIsometricGrid` (lines 187-188) iterates `for y in [0, gridH)` and `for x in [0, gridW)`, matching the same grid bounds used by the 2D renderer.
- **Status:** CORRECT -- Grid dimensions flow from the same `GridConfig.width`/`GridConfig.height` fields regardless of rendering mode.

### 3. Feature Flag Isolation (2D vs Isometric)

- **Rule:** The isometric rendering is a purely visual layer. When `config.isometric === false` (default), the application must behave identically to the pre-P0 state. No game logic should execute differently based on the isometric flag.
- **Implementation:** `VTTContainer.vue` uses a `v-if`/`v-else` conditional (lines 82-116):
  ```
  <IsometricCanvas v-if="config.isometric" ... />
  <GridCanvas v-else ... />
  ```
  When `isometric` is false, the `IsometricCanvas` component is not instantiated. The `GridCanvas` receives `v-else`, meaning it renders exactly as before. Both components receive identical props (`config`, `tokens`, `combatants`, `currentTurnId`, `isGm`) and emit identical events (`tokenMove`, `tokenSelect`, `cellClick`, `multiSelect`, `movementPreviewChange`). The `activeCanvasRef` computed (line 231-233) correctly dispatches to whichever canvas is active.
- **Status:** CORRECT -- The feature flag cleanly isolates the rendering path. When `isometric === false`, the code path is identical to the pre-P0 state except for the harmless addition of `v-else` on `GridCanvas` (previously unconditional).

### 4. Existing VTT Stores Untouched

- **Rule:** The 5 VTT stores (`encounterGrid`, `fogOfWar`, `terrain`, `measurement`, `selection`) contain game state that drives movement validation, AoE targeting, and fog mechanics. These must not be modified by a visual-only change.
- **Implementation:** `git diff master` against all 5 store files produces empty output. None were modified. The new `isometricCamera` store (64 lines) is purely additive -- it only tracks camera angle, zoom, rotation animation state. It has no interaction with any game logic store.
- **Status:** CORRECT -- All game state stores are untouched.

### 5. Existing Game Logic Composables Untouched

- **Rule:** The composables that implement PTU mechanics (`useGridMovement`, `useRangeParser`, `useGridInteraction`, `useCanvasRendering`, `useCombat`, `useMoveCalculation`, `useEntityStats`, `useCapture`, `useRestHealing`) must not be modified by a visual-only rendering change.
- **Implementation:** `git diff master` against all 9 composables produces empty output. Zero lines changed in any game logic composable. The new isometric composables (`useIsometricProjection`, `useIsometricCamera`, `useIsometricRendering`) are entirely new files that do not import from or modify any existing composable.
- **Status:** CORRECT -- Complete isolation. The new code only imports from `~/types` and `~/stores/isometricCamera`.

### 6. Projection Math Does Not Alter Game Coordinates

- **Rule:** The isometric projection is a visual transformation only. The world-to-screen and screen-to-world functions must not alter the logical (x, y) grid coordinates that game mechanics operate on.
- **Implementation:** `useIsometricProjection.ts` provides `worldToScreen` (line 63-81) and `screenToWorld` (line 95-113). The `worldToScreen` function takes a grid coordinate `(gridX, gridY)` and returns a screen pixel `(px, py)`. The `screenToWorld` function does the inverse. Critically, `screenToWorld` returns `{ x, y }` after calling `unrotateCoords`, which correctly reverses the camera rotation to recover the original grid coordinates. The coordinate label drawn in `drawDiamondCell` (line 246) uses the original `gridX, gridY` values, confirming the rendering knows which grid cell it is drawing.
- **Status:** CORRECT -- Projection math is a pure coordinate transformation that preserves the logical grid identity.

### 7. Prisma Schema Defaults

- **Rule:** New schema columns must default to values that preserve existing behavior (isometric off, angle 0, max elevation 5).
- **Implementation:** `schema.prisma` adds three columns to `Encounter`:
  ```
  gridIsometric    Boolean @default(false)
  gridCameraAngle  Int     @default(0)
  gridMaxElevation Int     @default(5)
  ```
  The `EncounterTemplate` model adds the same as nullable optionals (`Boolean?`, `Int?`, `Int?`). The `buildEncounterResponse` function in `encounter.service.ts` (lines 208-210) uses `?? false`, `?? 0`, `?? 5` fallbacks, matching the defaults. The `grid-config.put.ts` endpoint (lines 59-61) similarly falls back to defaults.
- **Status:** CORRECT -- Existing encounters will default to `isometric: false`, preserving current behavior.

## Summary

The P0 isometric grid implementation is a **clean visual-only addition** that does not touch any PTU game logic. All 12 commits were reviewed. The implementation:

1. Adds 6 new files (3 composables, 1 store, 2 components) that handle isometric projection math, camera control, and rendering.
2. Modifies 6 existing files to add the feature flag toggle, new Prisma columns, and server endpoint support for the new fields.
3. Does NOT modify any of the 9 game logic composables, 5 VTT stores, or 8 existing VTT components that implement PTU mechanics.

The feature flag (`config.isometric`) cleanly branches between the existing 2D `GridCanvas` and the new `IsometricCanvas`. When the flag is `false` (the default for all existing encounters), the application behavior is identical to the pre-P0 state.

PTU diagonal movement rules (alternating 1m/2m), pathfinding (A* with terrain costs), range parsing, measurement tools, fog of war, terrain mechanics, and all combat logic remain completely untouched and will function correctly regardless of the rendering mode.

## Rulings

No PTU rule violations found. The isometric rendering is correctly implemented as a visual-only layer with no game logic side effects.

## Verdict

**APPROVED** -- No game logic issues found. The isometric grid P0 is a clean visual addition with proper feature flag isolation. All PTU mechanics (diagonal movement, pathfinding, range, combat) are preserved unchanged.

## Required Changes

None.
