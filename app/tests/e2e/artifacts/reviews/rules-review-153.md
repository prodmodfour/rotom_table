---
review_id: rules-review-153
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-030
domain: player-view
commits_reviewed:
  - 545a6ed
  - 91670a1
  - 8eadf0e
  - cb66ca0
  - 7d2dd53
  - 8d368b2
files_reviewed:
  - app/composables/useGridInteraction.ts
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/IsometricCanvas.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-26T05:25:00Z
follows_up: null
---

## Review Scope

Verify that touch gesture implementation does not alter PTU movement or distance calculations. Touch events should only affect viewport panning/zooming, not game-mechanical movement. Confirm that tap-based cell/token selection produces the same result as mouse click.

## Analysis

### Touch Pan and Zoom: Viewport-Only Operations

The three touch handlers (`handleTouchStart`, `handleTouchMove`, `handleTouchEnd`) in `useGridInteraction.ts` modify exactly two pieces of state:

1. **`options.panOffset.value`** -- the viewport translation offset (lines 625-628 for single-finger pan, lines 651-652 for pinch zoom-and-pan adjustment)
2. **`options.zoom.value`** -- the viewport zoom level (line 657 for pinch-to-zoom)

These are the same two values modified by mouse wheel zoom (`handleWheel`, line 148) and mouse-button panning (`handleMouseMove`, lines 351-354). Neither `panOffset` nor `zoom` participate in any game-mechanical calculation:

- **Movement distance** is calculated by `useGridMovement.calculateMoveDistance()`, which uses grid positions (integer cell coordinates), not screen coordinates or zoom levels.
- **Movement validation** (`isValidMove`) uses grid positions, combatant speed, terrain costs, and blocked cells -- all zoom/pan-independent.
- **PTU diagonal movement** (alternating 1m/2m cost) is calculated in `useGridMovement` using the A* pathfinder, which operates entirely in grid space.
- **Measurement tools** (distance, burst, cone, line, blast) operate on grid positions set by `measurementStore.startMeasurement(gridPos)` and `measurementStore.updateMeasurement(gridPos)`. Touch handlers do not invoke any measurement store methods.

**Conclusion:** Touch pan and pinch-to-zoom are purely viewport transforms. No PTU mechanical state is affected.

### Tap Detection: Same Grid Cell as Mouse Click

The tap handler in `handleTouchEnd` (lines 690-709) uses `screenToGrid(changedTouch.clientX, changedTouch.clientY)` to convert the tap position to a grid cell. This is the exact same `screenToGrid` function used by `handleMouseDown` (line 167) for mouse clicks.

The `screenToGrid` function (lines 98-111) applies:
```
gridX = floor((canvasX - panOffset.x) / scaledCellSize)
gridY = floor((canvasY - panOffset.y) / scaledCellSize)
```

This means a tap at the same screen position as a mouse click will resolve to the same grid cell. The coordinate conversion is identical.

### Tap Actions: Same Emissions as Mouse Click

For tap-on-token (non-player mode): calls `handleTokenSelect(clickedToken.combatantId)` -- the same function called by mouse-click token selection. This enters move mode, which is a GM-only feature gated by `options.isGm.value` checks inside the handler.

For tap-on-empty-cell (non-player mode): calls `options.onCellClick(gridPos)` -- the same emission as mouse-click empty cell (line 266).

For player mode taps: the `onTouchTap` callback in GridCanvas.vue (lines 244-255) emits `playerTokenSelect` for own tokens and `playerCellClick` for empty cells, matching the mouse-based `handleTokenSelectWithPlayerMode` and `handleMouseUp` player mode paths exactly.

### Token Hit Detection: Same Function

`getTokenAtPosition(gridPos)` (lines 116-123) is used by both the touch tap handler (line 695) and the mouse click handler (line 201). The function checks if the grid position falls within any token's bounding box. The hit detection logic is shared and produces identical results.

### No Touch-Triggered Movement Execution

Touch handlers never call `options.onTokenMove()`. Token movement requires:
1. GM mode (`options.isGm.value`)
2. A token in move mode (`movingTokenId.value`)
3. A second click/tap on a valid destination cell

The tap handler calls `handleTokenSelect` (which enters move mode) or `onCellClick` (which the parent component handles). The actual movement execution path in `handleMouseDown` (lines 209-237) is only reachable via mouse events, not touch events. This is acceptable because player mode (the primary touch target) does not support direct grid movement -- players request moves via `playerCellClick` which the GM approves.

### PTU Movement Costs Unaffected

The following PTU mechanical calculations are completely untouched by this change:

- **Speed stat usage** (`getSpeed()`)
- **Terrain cost multipliers** (grass 2x, sand 2x, water 3x, ice 1x, rough 3x, lava 4x)
- **Diagonal movement** (alternating 1m/2m per PTU rules)
- **Blocked cell detection** (occupied cells)
- **Movement range display** (A* pathfinder cells)
- **Combat maneuver distances** (Push, Sprint, etc.)
- **Measurement tool calculations** (burst radius, cone, line, blast)

## Verdict

**APPROVED**

Touch gesture implementation is strictly a viewport interaction layer. It modifies only `panOffset` and `zoom` (viewport transforms), uses the same `screenToGrid` coordinate conversion as mouse input, and produces identical grid positions and event emissions. No PTU mechanical calculations (movement distance, terrain costs, diagonal movement, accuracy, capture rate) are affected. Tap-based cell/token selection is functionally identical to mouse click.
