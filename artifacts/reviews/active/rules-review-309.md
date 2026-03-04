---
review_id: rules-review-309
review_type: rules
reviewer: game-logic-reviewer
trigger: refactoring
target_report: refactoring-111
domain: vtt-grid
commits_reviewed:
  - aa9f196d
  - 5579a6c9
mechanics_verified:
  - movement-range-display
  - alternating-diagonal-rule
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - 07-combat.md#movement
reviewed_at: 2026-03-04T22:30:00Z
follows_up: null
---

## Mechanics Verified

### Movement Range Display
- **Rule:** PTU uses 1-meter grid squares. Overland speed determines how many squares a Pokemon or Trainer can move per Shift/Standard action. (`07-combat.md`, "Movement")
- **Implementation:** `drawMovementRange` iterates over pre-computed `cells: GridPosition[]` and draws isometric diamond highlights using `MOVEMENT_RANGE_FILL` / `MOVEMENT_RANGE_STROKE`. The cell list itself is computed upstream (in `useGridMovement` / `usePathfinding`), not in this composable. The extracted code is purely rendering -- it does not compute which cells are reachable.
- **Status:** CORRECT -- no movement calculation logic was touched. The rendering faithfully draws whatever cells the movement engine provides.

### Movement Arrow & Distance Label
- **Rule:** Distance is measured in meters on a 1-meter grid. Per decree-002, the alternating diagonal rule (1-2-1) applies to all distance measurements.
- **Implementation:** `drawMovementArrow` reads `preview.distance` (a pre-computed number from the movement system) and displays it as `${preview.distance}m`. The arrow itself is a visual indicator connecting `fromPosition` to `toPosition` using screen-space projection. The distance value is not recalculated here -- it is passed in via `MovementPreview.distance`.
- **Status:** CORRECT -- the rendering layer does not perform distance calculation; it trusts the upstream `distance` field. The alternating diagonal rule (decree-002) is enforced in the movement/pathfinding layer, not here.

### Token Footprint Handling (Multi-Cell Tokens)
- **Rule:** Large Pokemon occupy NxN squares on the grid. Arrow endpoints should target the center of the footprint.
- **Implementation:** `drawMovementArrow` looks up `token.size` (defaulting to 1) and computes center offsets as `position + size / 2` for both origin and destination. Destination footprint cells are highlighted individually with bounds checking (`cellX >= 0 && cellX < gridW && cellY >= 0 && cellY < gridH`).
- **Status:** CORRECT -- multi-cell token rendering is preserved identically from the original.

### Decree Compliance
- **decree-002** (alternating diagonal for distance): Not affected. Distance is computed upstream, not in this rendering composable.
- **decree-003** (tokens passable, enemy = rough terrain): Not affected. Token passability is a pathfinding concern, not a rendering concern.
- **decree-010** (multi-tag terrain): Not affected. Terrain rendering is in `useIsometricOverlays`, not here.
- **decree-011** (average movement speeds across terrain): Not affected. Speed calculation is upstream.
- **decree-023** (alternating diagonal for burst shapes): Not affected. Burst shapes are computed elsewhere.

## Summary

This is a pure refactoring extraction. The diff confirms:

1. **3 functions moved:** `drawCellHighlight`, `drawMovementRange`, `drawMovementArrow` -- copied verbatim from `useIsometricRendering.ts` to `useIsometricMovementPreview.ts` with zero logic changes.
2. **4 constants moved:** `MOVEMENT_RANGE_FILL`, `MOVEMENT_RANGE_STROKE`, `VALID_MOVE_COLOR`, `INVALID_MOVE_COLOR` -- identical values.
3. **Call sites updated:** All 3 call sites in `useIsometricRendering.ts` now delegate to `movementPreviewComposable.<method>(...)` with identical argument lists.
4. **HOVER_FILL / HOVER_STROKE retained:** These constants remain in `useIsometricRendering.ts` because `drawCellHighlight` is called with them as parameters (not as internal constants). This is correct.
5. **File sizes:** Source reduced from 820 to 682 lines (under 800-line limit). New file is 195 lines.
6. **Options interface:** The new composable receives `tokens`, `getTokenElevation`, and `getTerrainElevation` via its options object, matching exactly what `drawMovementArrow` previously accessed via the parent's `options` closure.

No game logic was added, removed, or modified. All PTU mechanics (movement range computation, distance measurement, diagonal rules) remain in their upstream composables and are unaffected by this extraction.

## Rulings

No new rulings needed. No ambiguities discovered. All applicable decrees are respected.

## Verdict

**APPROVED** -- Pure rendering extraction with no behavior changes. Zero game logic impact.

## Required Changes

None.
