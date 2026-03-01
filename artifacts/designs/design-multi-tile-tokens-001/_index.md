---
design_id: design-multi-tile-tokens-001
ticket_id: feature-013
category: FEATURE
scope: FULL
domain: vtt-grid
status: p1-implemented
priority: P1
decrees:
  - decree-002
  - decree-003
  - decree-011
matrix_source:
  - vtt-grid-R003
affected_files:
  - app/components/vtt/VTTToken.vue
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/GroupGridCanvas.vue
  - app/components/vtt/IsometricCanvas.vue
  - app/composables/useGridMovement.ts
  - app/composables/useGridInteraction.ts
  - app/composables/useGridRendering.ts
  - app/composables/useCanvasRendering.ts
  - app/composables/useIsometricRendering.ts
  - app/composables/useIsometricInteraction.ts
  - app/composables/usePathfinding.ts
  - app/composables/useRangeParser.ts
  - app/stores/encounterGrid.ts
  - app/stores/fogOfWar.ts
  - app/stores/measurement.ts
  - app/types/encounter.ts
  - app/types/spatial.ts
  - app/types/character.ts
  - app/server/services/grid-placement.service.ts
  - app/server/services/combatant.service.ts
new_files:
  - app/utils/sizeCategory.ts
---

# Design: Multi-Tile Token System

## Summary

Implement PTU Size Category footprints on the VTT grid so that Pokemon and characters render at their correct size: Small/Medium = 1x1, Large = 2x2, Huge = 3x3, Gigantic = 4x4. Currently, all tokens render as 1x1 regardless of entity size. The `tokenSize` field already exists on the `Combatant` type and is populated by `sizeToTokenSize()` in `grid-placement.service.ts`, and VTTToken.vue already uses `token.size` for styling. However, the pathfinding, movement validation, fog of war reveal, terrain cost calculation, AoE hit detection, and measurement tools all operate on single-cell assumptions and must be extended to account for multi-cell footprints.

The system must work in both 2D flat grid and 3D isometric grid modes (feature-002).

## PTU Rules Reference

PTU Core Chapter 7, p.231 (vtt-grid-R003):
> "A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4, but you may choose to use other shapes for Pokemon that have different body shapes such as serpents."

This design implements only square footprints (NxN). Non-square shapes (serpent bodies) are deferred as a future enhancement.

## Related Decrees

- **decree-002**: PTU alternating diagonal for all grid distance. Multi-cell distance uses nearest-edge calculation already implemented in `useRangeParser.ptuDistanceTokens()`.
- **decree-003**: All tokens passable; enemy-occupied squares are rough terrain; no stacking. Multi-cell tokens extend the "occupied cells" set and the no-stacking destination check.
- **decree-011**: Speed averaging when path crosses terrain boundaries. Multi-cell tokens must average terrain cost across ALL occupied cells at each step.

## Current State

| Area | Status | Notes |
|------|--------|-------|
| `Combatant.tokenSize` field | EXISTS | Set by `sizeToTokenSize()` on combatant creation |
| `sizeToTokenSize()` mapping | EXISTS | In `grid-placement.service.ts` |
| `VTTToken.vue` multi-cell sizing | PARTIAL | Uses `token.size` for width/height, shows size badge, but position is origin-only |
| `getOccupiedCells()` multi-cell | EXISTS | In `useGridMovement.ts` and `useRangeParser.ts` |
| `ptuDistanceTokens()` multi-cell distance | EXISTS | In `useRangeParser.ts` |
| `findPlacementPosition()` multi-cell | EXISTS | In `grid-placement.service.ts` |
| A* pathfinding multi-cell | P1-DONE | tokenSize param, NxN footprint passability per step |
| Movement validation multi-cell | P1-DONE | isValidMove() passes tokenSize to A* and terrain getter |
| Movement range flood-fill multi-cell | P1-DONE | tokenSize + gridBounds params, NxN footprint checks |
| Fog of war multi-cell reveal | P1-DONE | revealFootprintArea() with Chebyshev distance to rect |
| Terrain cost multi-cell | P1-DONE | getTerrainCostForFootprint(), footprint-aware getter closure |
| AoE hit detection multi-cell targets | MISSING | Checks single cell per target |
| Measurement from multi-cell tokens | EXISTS | `ptuDistanceTokens()` handles this |
| Isometric multi-cell rendering | P0-DONE | Depth sorting, sprite scaling, movement arrow all use footprint center |
| Client-side size utility | P0-DONE | `sizeCategory.ts` with sizeToFootprint(), getFootprintCells(), isFootprintInBounds() |
| 2D movement preview footprint | P0-DONE | drawMovementPreview highlights full NxN footprint at destination |

## Tier Summary

| Tier | Sections | File | Estimated Effort |
|------|----------|------|------------------|
| P0 | A. Size field propagation, B. Multi-cell token rendering (2D + isometric), C. Cell occupation tracking, D. Placement collision detection, E. No-stacking validation for multi-cell destinations | [spec-p0.md](spec-p0.md) | Medium |
| P1 | F. Multi-cell A* pathfinding, G. Multi-cell movement range (flood-fill), H. Multi-cell terrain cost averaging, I. Fog of war per-cell reveal for large footprints, J. Movement preview for large tokens | [spec-p1.md](spec-p1.md) | High |
| P2 | K. AoE coverage for multi-tile targets, L. Flanking geometry for large tokens, M. Measurement from nearest edge | [spec-p2.md](spec-p2.md) | Medium |

## Implementation Log

### P0 — 2026-03-01 (branch: slave/3-dev-feature-013-p0-20260301)

| Section | Status | Commits |
|---------|--------|---------|
| A. sizeCategory.ts utility | DONE | 188f9174 |
| B. 2D movement preview footprint | DONE | c69d7391 |
| C. Isometric multi-cell rendering | DONE | a9d7f3b6 |
| D. Cell occupation tracking (verify) | DONE | 88536d04 |
| E. Placement collision (verify) | DONE | 88536d04 |

**Files changed:** `app/utils/sizeCategory.ts` (new), `app/composables/useGridRendering.ts`, `app/composables/useIsometricRendering.ts`, `app/composables/useGridMovement.ts`, `app/composables/useGridInteraction.ts`, `app/server/services/grid-placement.service.ts`

**Key decisions:**
- Isometric depth sorting uses center of NxN footprint (not origin or max corner) for balanced draw order
- Token positioning/scaling in drawSingleToken already used token.size correctly; no changes needed
- Existing multi-cell support in D-E sections verified correct; only documentation comments added

### P0 Fix Cycle — 2026-03-01 (branch: slave/1-dev-feature-013-p0-fix-20260301)

Addresses code-review-242 findings (CRIT-1, HIGH-1, HIGH-2, MED-1, MED-2).

| Issue | Severity | Fix | Commits |
|-------|----------|-----|---------|
| CRIT-1: Depth sorting center inconsistency | CRITICAL | Use `token.size / 2` consistently | 9ae2ca2e |
| HIGH-1: No bounds clamping on NxN highlight | HIGH | Add bounds check in 3 locations | fd3f3269 |
| HIGH-2: sizeCategory.ts unused dead code | HIGH | Wire up in useGridMovement | 233152c8 |
| MED-1: app-surface.md missing sizeCategory.ts | MEDIUM | Added to VTT utilities section | d78a138d |
| MED-2: Single-point elevation for NxN cells | MEDIUM | Per-cell elevation lookup | fd3f3269 |

**Files changed:** `app/composables/useIsometricRendering.ts`, `app/composables/useGridRendering.ts`, `app/composables/useGridMovement.ts`, `.claude/skills/references/app-surface.md`

### P1 — 2026-03-01 (branch: slave/3-dev-feature-013-p1-20260301)

| Section | Status | Commits |
|---------|--------|---------|
| F. Multi-cell A* pathfinding | DONE | 00de20d4 |
| G. Multi-cell flood-fill movement range | DONE | b3a4ed5e |
| H. Multi-cell terrain cost | DONE | 905fbb80 |
| I. Fog of war per-cell reveal | DONE | 3001ec03 |
| J. Movement preview for large tokens | DONE | d4685725 |
| Unit tests | DONE | 95ea3490 |

**Files changed:** `app/composables/usePathfinding.ts`, `app/composables/useGridMovement.ts`, `app/composables/useGridRendering.ts`, `app/stores/fogOfWar.ts`
**Files created:** `app/tests/unit/composables/usePathfinding.test.ts`

**Key decisions:**
- A* and flood-fill use tokenSize param (default 1) for backward compatibility — no changes to existing call sites needed
- Terrain cost aggregation: max across footprint (any impassable cell blocks movement)
- Footprint-aware terrain getter is a closure returned by getTerrainCostGetter(combatantId, tokenSize) — pathfinding code stays clean
- Fog reveal uses Chebyshev distance to bounding rectangle of footprint for efficient area calculation
- Ghost footprint outline (dashed 4,4 pattern) shown on hover in movement range for large tokens
- Elevation reads from origin cell of footprint (simplification: terrain elevation is typically region-wide)
- gridBounds param is optional — when omitted, exploration is unbounded (matches pre-P1 behavior)

## Atomized Files

- [_index.md](_index.md)
- [shared-specs.md](shared-specs.md)
- [spec-p0.md](spec-p0.md)
- [spec-p1.md](spec-p1.md)
- [spec-p2.md](spec-p2.md)
- [testing-strategy.md](testing-strategy.md)
