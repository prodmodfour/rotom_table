---
id: docs-001
title: "Add CLAUDE.md for app/components/vtt/"
priority: P0
severity: HIGH
status: open
domain: vtt-grid
source: plan-descendant-claude-md-rollout
created_by: user
created_at: 2026-03-02
phase: 1
affected_files:
  - app/components/vtt/CLAUDE.md (new)
---

# docs-001: Add CLAUDE.md for app/components/vtt/

## Summary

Create a descendant CLAUDE.md in `app/components/vtt/` to provide domain-specific context for the most complex subsystem in the project. The VTT has 14 components, 18 composables, 5 stores, 3 coordinate spaces, and 13+ embedded PTU rules via decrees. Agents working on VTT code consistently waste exploration rounds rediscovering the rendering pipeline, coordinate conversions, and PTU-specific movement rules.

## Target File

`app/components/vtt/CLAUDE.md` (~75 lines)

## Required Content

### Rendering Pipeline
- VTTContainer.vue is the root orchestrator — mode switch via `v-if` between GridCanvas (2D) and IsometricCanvas (iso)
- GroupGridCanvas.vue is the read-only Group view variant (no interaction handlers, no toolbars)
- 2D pipeline: useGridInteraction → useGridMovement → useGridRendering → useFlankingDetection
- Isometric pipeline: useIsometricCamera → useIsometricInteraction → useIsometricRendering → useElevation → useGridMovement (shared)

### Three Coordinate Spaces
| Space | Type | Used By |
|-------|------|---------|
| Grid | GridPosition {x, y, z?} integers | All game logic, pathfinding, DB storage |
| Pixel | grid × cellSize | Canvas rendering (2D mode) |
| Screen | pixel × zoom + panOffset | Mouse events, isometric projection |

Conversion: grid→pixel in useCanvasRendering, grid→screen in useIsometricProjection. Reverse (screen→grid) in useGridInteraction.

### Component→Composable Map
Table mapping each of the 14 .vue files to the composables and stores they consume. Key files to read:
- `VTTContainer.vue` (644 lines) — toolbar orchestrator, uses selection/measurement/fogOfWar/terrain stores
- `GridCanvas.vue` (466 lines) — uses useGridMovement, useGridRendering, useGridInteraction, useFlankingDetection
- `IsometricCanvas.vue` (441 lines) — uses useIsometricCamera, useIsometricRendering, useIsometricInteraction, useGridMovement, useElevation
- `VTTToken.vue` (405 lines) — token DOM element with sprite, HP bar, flanking/elevation badges
- `TerrainPainter.vue` (596 lines) — 6 base types + 2 flags, paint/erase/line/fill modes

### PTU Rules Embedded in VTT Code
- **Diagonal movement**: alternating 1m/2m cost via `ptuDiagonalDistance()` in `utils/gridDistance.ts` (decree-002)
- **Token blocking**: pass-through allowed, cannot end on occupied cell, enemy = rough terrain (decree-003)
- **Burst AoE**: diamond shape using PTU diagonal distance (decree-023)
- **Cone**: fixed 3m width (decree-007)
- **Diagonal lines**: shortened via `maxDiagonalCells()` (decree-009)
- **Terrain costs**: water=1 (decree-008), slow flag=2x cost (decree-010), speed averaging across boundaries (decree-011)
- **Edge-to-edge distance**: `ptuDistanceTokensBBox()` for multi-cell tokens (decree-002)
- **Movement modifiers**: Stuck=0, Tripped=0, Slowed=half, Sprint=+50%, Disengaged=max 1m
- **AoO detection**: shift-away trigger check in useGridMovement (lines 639-682)

### Gotchas
- **2D tokens are DOM elements** (`VTTToken.vue` in `.token-layer` div overlay), **isometric tokens are canvas-drawn** — different rendering paths
- **Fog brush uses Chebyshev distance** (square shape), **Burst AoE uses PTU diagonal** (diamond shape) — intentionally different
- **Token layer CSS transform must match canvas `ctx.setTransform()`** — if out of sync, tokens misalign with grid
- **`activeCanvasRef` pattern**: VTTContainer and GroupGridCanvas use `computed(() => config.isometric ? isoRef : gridRef)` for unified access
- **Fog/terrain persistence is debounced** — rapid painting won't hammer the server
- **Player mode in GridCanvas**: no drag-to-move, click-to-select own tokens only, enemy HP rounded to display tiers
- **Multi-cell tokens (2x2, 3x3)**: footprint checked for terrain cost (max cost), stacking (all cells), bounds, flanking adjacency

## Verification

- File is 30-80 lines
- No duplication with parent `app/CLAUDE.md` VTT Grid section (that section will be slimmed in docs-014)
- Content verified against actual component files, composable signatures, and decree references
- Architecture claims match actual import chains in the code
