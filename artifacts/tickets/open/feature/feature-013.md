---
id: feature-013
title: Multi-Tile Token System
priority: P1
severity: HIGH
status: in-progress
domain: vtt-grid
source: matrix-gap (VTT SG-1)
matrix_source: vtt-grid R003
created_by: master-planner
created_at: 2026-02-28
---

# feature-013: Multi-Tile Token System

## Summary

All VTT tokens render as 1x1 regardless of Pokemon size. Large (2x2), Huge (3x3), and Gigantic (4x4) Pokemon should occupy multiple grid cells per PTU size categories. This affects movement, targeting, flanking, and AoE calculations.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R003 | Size Category Footprints | Partial — tokens rendered as 1x1, no multi-tile support |

## PTU Rules

- Chapter 10: Pokemon Size Categories
- Small: 1x1 (can share space)
- Medium: 1x1
- Large: 2x2
- Huge: 3x3
- Gigantic: 4x4
- Size affects: occupied cells, movement blocking, flanking requirements, AoE coverage

## Implementation Scope

FULL-scope feature requiring design spec. Affects core VTT systems: token rendering, movement pathfinding, collision detection, AoE targeting, fog of war.

## Affected Areas

- `app/components/vtt/VTTToken.vue` — multi-cell rendering
- `app/composables/useGridMovement.ts` — multi-cell pathfinding
- `app/composables/useGridInteraction.ts` — multi-cell click targets
- `app/stores/encounterGrid.ts` — cell occupation tracking
- `app/stores/fogOfWar.ts` — multi-cell fog reveal
- `app/types/encounter.ts` — combatant size field

## Resolution Log

### P0: Core Multi-Tile Rendering and Collision (2026-03-01)

**Branch:** `slave/3-dev-feature-013-p0-20260301`

| Commit | Description | Files |
|--------|-------------|-------|
| 188f9174 | feat: add client-side sizeCategory.ts utility | `app/utils/sizeCategory.ts` (NEW) |
| c69d7391 | feat: highlight full NxN footprint in 2D movement preview | `app/composables/useGridRendering.ts` |
| a9d7f3b6 | feat: update isometric rendering for multi-cell token support | `app/composables/useIsometricRendering.ts` |
| 88536d04 | docs: add multi-tile verification comments | `useGridMovement.ts`, `useGridInteraction.ts`, `grid-placement.service.ts` |

**Summary:**
- Section A: Created `sizeCategory.ts` with SizeCategory type, SIZE_FOOTPRINT_MAP, sizeToFootprint(), getFootprintCells(), isFootprintInBounds()
- Section B: Updated 2D movement preview to highlight full NxN destination footprint; arrow targets footprint center
- Section C: Updated isometric depth sorting to use footprint center; movement arrow uses NxN footprint center; destination cells highlighted as NxN diamond overlay
- Sections D-E: Verified getOccupiedCells, getTokenAtPosition, canFit, isValidMove all handle multi-cell NxN footprints correctly (no code changes needed)

### P0 Fix Cycle: code-review-242 (2026-03-01)

**Branch:** `slave/1-dev-feature-013-p0-fix-20260301`

| Commit | Description | Files |
|--------|-------------|-------|
| 9ae2ca2e | fix: use consistent token.size / 2 center for isometric depth sorting | `app/composables/useIsometricRendering.ts` |
| fd3f3269 | fix: add bounds checking to NxN footprint highlight loops + per-cell elevation | `app/composables/useGridRendering.ts`, `app/composables/useIsometricRendering.ts` |
| 233152c8 | refactor: wire up sizeCategory.ts utility in useGridMovement | `app/composables/useGridMovement.ts` |
| d78a138d | docs: add sizeCategory.ts to app-surface.md VTT utilities section | `.claude/skills/references/app-surface.md` |

**Review issues addressed:**
- CRIT-1: Depth sorting center now uses `token.size / 2` consistently with drawSingleToken and drawMovementArrow
- HIGH-1: NxN footprint highlight loops in drawMovementPreview, drawExternalMovementPreview (2D), and drawMovementArrow (isometric) now clamp cells to grid bounds
- HIGH-2: sizeCategory.ts wired into useGridMovement — getOccupiedCells, getEnemyOccupiedCells use getFootprintCells; isValidMove uses isFootprintInBounds
- MED-1: app-surface.md updated with sizeCategory.ts in VTT Grid utilities section
- MED-2: Isometric destination footprint highlight now uses per-cell elevation lookup instead of single-point elevation
