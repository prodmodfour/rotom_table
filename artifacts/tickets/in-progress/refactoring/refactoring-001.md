---
ticket_id: refactoring-001
ticket_type: refactoring
priority: P1
status: in-progress
domain: vtt
source: decree-010
affected_files:
  - app/stores/terrain.ts
  - app/composables/useGridMovement.ts
  - app/composables/useTerrainPersistence.ts
created_at: 2026-02-26
---

# refactoring-001: Multi-tag terrain system

## Problem

Terrain is currently a single enum per cell (mutually exclusive types). Per decree-010, cells should support multiple terrain flags simultaneously (e.g., Rough + Slow).

## Required Changes

1. **Data model**: Change terrain cell representation from a single type to a set of flags. Each cell can have: `rough` (accuracy penalty), `slow` (double movement cost), terrain type (water, earth, ice, etc.).
2. **terrain.ts store**: Update terrain data structure and cost calculation to aggregate flags.
3. **Movement cost**: If cell has `slow` flag, double movement cost. `rough` flag only affects accuracy, not movement.
4. **Accuracy check**: If targeting through a cell with `rough` flag, apply -2 penalty.
5. **Terrain painter UI**: Allow selecting multiple terrain properties per cell.
6. **Persistence**: Update terrain serialization/deserialization for the new data model.
7. **Enemy-occupied squares**: Per decree-003, enemy-occupied squares are automatically tagged as `rough`.

## PTU Reference

- p.231: Rough Terrain (accuracy -2), Slow Terrain (double movement cost), "Most Rough Terrain is also Slow Terrain, but not always"

## Acceptance Criteria

- Cells can have both `rough` and `slow` flags simultaneously
- Movement cost correctly aggregates terrain flags
- Accuracy penalty checks for `rough` flag independently
- Terrain painter allows multi-flag selection
- Backward-compatible with existing terrain data

## Resolution Log

- **Branch:** `slave/4-dev-terrain-multitag-20260226-154130`
- **Commits:**
  - `74ca90a` — refactor: add TerrainFlags interface for multi-tag terrain system
  - `8b78c19` — refactor: update terrain store for multi-tag flag system
  - `1da186b` — refactor: update terrain persistence for multi-tag format
  - `a51d43a` — refactor: accept terrain flags in PUT endpoint
  - `63e7f39` — refactor: render terrain flag overlays in 2D grid
  - `493c9ed` — refactor: render terrain flag overlays in isometric mode
  - `920aa96` — refactor: update TerrainPainter UI for multi-tag system
  - `8e63832` — docs: update movement validation comments for multi-tag terrain
  - `bd2998e` — fix: preserve terrain flags when setting elevation
- **Files changed:**
  - `app/types/spatial.ts` — Added `TerrainFlags` interface, marked `difficult`/`rough` as legacy
  - `app/stores/terrain.ts` — Multi-tag store with flag-aware cost calculation, `migrateLegacyCell()`
  - `app/composables/useTerrainPersistence.ts` — Backward-compatible serialization with optional flags
  - `app/composables/useGridMovement.ts` — Updated comments for flag-based system
  - `app/composables/useGridRendering.ts` — Flag overlay rendering in 2D mode
  - `app/composables/useIsometricOverlays.ts` — Flag overlay rendering in isometric mode
  - `app/composables/useIsometricRendering.ts` — Plumbed getTerrainFlags through to overlays
  - `app/composables/useElevation.ts` — Fixed setTerrain call for new signature
  - `app/components/vtt/IsometricCanvas.vue` — Pass getTerrainFlags to renderer
  - `app/components/vtt/TerrainPainter.vue` — Base terrain + flag toggle UI
  - `app/server/api/encounters/[id]/terrain.put.ts` — Accept flags in body
- **Acceptance criteria status:**
  - [x] Cells can have both `rough` and `slow` flags simultaneously
  - [x] Movement cost correctly aggregates terrain flags (slow = 2x)
  - [x] Accuracy penalty getter `isRoughAt()` exposed for rough flag
  - [x] Terrain painter allows multi-flag selection (toggle buttons)
  - [x] Backward-compatible with existing terrain data (migrateLegacyCell)
- **Note:** Item 4 (accuracy penalty application) and item 7 (dynamic enemy-occupied rough) are separate concerns handled by other tickets/slaves
