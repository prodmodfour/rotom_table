---
review_id: code-review-261
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-013
domain: vtt-grid
commits_reviewed:
  - 6377282a (feat: add isTargetHitByAoE and getBlastEdgeOrigin to useRangeParser)
  - fd5c56b8 (feat: add isFlankingTarget for multi-cell flanking geometry)
  - 5ee0c5d9 (refactor: extract ptuDistanceTokensBBox to gridDistance utility)
  - b342b341 (feat: add token-aware edge-to-edge distance to measurement store)
  - 67569a0c (feat: pass token metadata to measurement for edge-to-edge distance)
  - 32e0aea5 (feat: highlight multi-cell token footprints in measurement overlay)
  - e8e5224b (docs: add multi-tile verification comments)
  - a955904d (docs: update feature-013 ticket and design spec with P2 implementation log)
files_reviewed:
  - app/composables/useRangeParser.ts
  - app/utils/gridDistance.ts
  - app/stores/measurement.ts
  - app/composables/useGridInteraction.ts
  - app/composables/useIsometricInteraction.ts
  - app/composables/useGridRendering.ts
  - app/composables/useIsometricOverlays.ts
  - app/composables/useIsometricRendering.ts
  - app/composables/useGridMovement.ts
  - app/composables/usePathfinding.ts
  - app/utils/sizeCategory.ts
  - app/utils/flankingGeometry.ts
  - app/composables/useFlankingDetection.ts
  - app/components/vtt/IsometricCanvas.vue
  - artifacts/designs/design-multi-tile-tokens-001/spec-p2.md
  - artifacts/designs/design-multi-tile-tokens-001/shared-specs.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 1
  medium: 1
reviewed_at: 2026-03-01T22:02:00Z
follows_up: code-review-258
---

## Review Scope

P2 of feature-013 (Multi-Tile Token System) -- combat integration layer. This review covers 8 commits implementing Sections K (AoE Coverage), L (Flanking Geometry), and M (Edge-to-Edge Measurement) from `spec-p2.md`. P0 was approved by code-review-245 and P1 by code-review-258.

The P2 changes are additive: 3 new functions in `useRangeParser.ts`, 1 extracted utility in `gridDistance.ts`, expanded measurement store state, token metadata passing in both 2D and isometric interaction composables, and footprint highlight rendering in `useGridRendering.ts`.

## Decree Compliance

- **decree-002** (PTU alternating diagonal): Correctly applied. `ptuDistanceTokensBBox` uses `ptuDiagonalDistance` for bounding-box gap calculation. `isFlankingTarget` uses `ptuDistanceTokens` (which delegates to `ptuDistanceTokensBBox`) for adjacency check. Measurement store uses `ptuDistanceTokensBBox` for edge-to-edge distance. All distance calculations consistent.
- **decree-003** (tokens passable, enemy = rough terrain): Not directly affected by P2 changes. AoE hit detection does not involve movement.
- **decree-007** (cone 3m-wide rows): Not modified by P2. Existing cone logic unchanged.
- **decree-009** (diagonal line shortened): Not modified by P2. Existing line logic unchanged.
- **decree-023** (burst uses PTU diagonal): Not modified by P2. Existing burst logic unchanged.
- **decree-024** (diagonal cones diamond pattern): Not modified by P2. Existing logic unchanged.

## Issues

### CRITICAL

#### C1: `isFlankingTarget` duplicates and contradicts existing flanking system

**File:** `app/composables/useRangeParser.ts` lines 483-516

The codebase already has a complete flanking implementation in `app/utils/flankingGeometry.ts` (`checkFlanking`, `areAdjacent`, `FLANKING_FOES_REQUIRED`) and `app/composables/useFlankingDetection.ts` (`isTargetFlanked`, `getFlankingPenalty`). This existing system:

1. Uses the PTU p.232 rule that flanking requires **N non-adjacent foes** (N scales by target size: 2 for 1x1, 3 for 2x2, 4 for 3x3, 5 for 4x4).
2. Checks pair-wise non-adjacency among surrounding foes.
3. Already handles multi-cell tokens via `areAdjacent()` which iterates all NxN cells.
4. Is actively used in production (`GridCanvas.vue` line 210, `VTTToken.vue` `isFlanked` prop).

The new `isFlankingTarget` uses a fundamentally **different algorithm** (angle-based, >= 135 degrees between exactly two attackers) that:
- Does not use the `FLANKING_FOES_REQUIRED` scaling for larger targets (always checks exactly 2 attackers).
- Does not check non-adjacency between attackers (the PTU requirement).
- Uses a geometric angle threshold that has no basis in PTU rules.
- Will produce different flanking results than the existing system for the same board state.

The spec-p2.md notes this is "provided as the specification for when flanking is implemented" but flanking IS already implemented and actively used. Having two conflicting flanking algorithms is a correctness risk. Any future code that imports `isFlankingTarget` from `useRangeParser` will get wrong results compared to the production `checkFlanking`.

**Required fix:** Remove `isFlankingTarget` from `useRangeParser.ts`. The existing `flankingGeometry.ts` system is the canonical implementation. If multi-cell flanking behavior needs adjustment, those changes should be made to `flankingGeometry.ts` and `useFlankingDetection.ts`, not by adding a parallel system.

### HIGH

#### H1: Isometric measurement overlay lacks multi-cell token parity

**Files:** `app/composables/useIsometricOverlays.ts` lines 416-483, `app/components/vtt/IsometricCanvas.vue` lines 225-226

The 2D `useGridRendering.ts` was comprehensively updated for P2 with:
- Multi-cell token footprint highlighting when hit by AoE (dashed outline around NxN footprint)
- Origin marker centered on multi-cell token footprint (using `startTokenOrigin` and `startTokenSize`)
- Distance line drawn between token centers (not origin cells)
- Dashed outline around multi-cell tokens at both endpoints of distance measurement

The isometric `useIsometricOverlays.ts` has none of these updates. `IsometricCanvas.vue` passes `measurementStore.startPosition` (the clicked cell) rather than `measurementStore.startTokenOrigin` (the token origin). The isometric overlay:
- Does not highlight multi-cell token footprints hit by AoE
- Places the origin marker at the clicked cell, not the token center
- Draws the distance line between clicked cells, not token centers
- Does not draw dashed outlines around multi-cell tokens

Note: The `measurementStore.distance` getter correctly uses `ptuDistanceTokensBBox` regardless of rendering mode, so the **distance value** displayed is accurate. The issue is purely visual parity between 2D and isometric views.

**Required fix:** Update `useIsometricOverlays.ts` and `IsometricCanvas.vue` to pass and consume the token metadata (`startTokenOrigin`, `startTokenSize`, `endTokenOrigin`, `endTokenSize`) for consistent visual behavior across both rendering modes. At minimum: center the origin marker on the token footprint and draw distance lines between token centers.

### MEDIUM

#### M1: `clearMeasurement` resets token metadata but `endMeasurement` does not

**File:** `app/stores/measurement.ts` lines 147-159

`clearMeasurement()` correctly resets all four token metadata fields (`startTokenOrigin`, `startTokenSize`, `endTokenOrigin`, `endTokenSize`) to their defaults. However, `endMeasurement()` (line 147) only sets `isActive = false` without touching token metadata. This means after `endMeasurement()`, stale token metadata persists in the store. If the store is later re-read (e.g., the rendering loop checks token metadata without checking `isActive`), stale data could cause incorrect behavior.

Currently the rendering code in `useGridRendering.ts` only reads the measurement overlay when `measurementStore.mode !== 'none' && measurementStore.affectedCells.length > 0`, so this is not an active bug. But the asymmetry between the two cleanup paths is fragile and will cause bugs when future code accesses the store differently.

**Required fix:** Either reset token metadata in `endMeasurement()` or document why it is intentionally preserved. The safer option is to reset it:

```typescript
endMeasurement() {
  this.isActive = false
  this.startTokenOrigin = null
  this.startTokenSize = 1
  this.endTokenOrigin = null
  this.endTokenSize = 1
}
```

## What Looks Good

**Section K (AoE Coverage):** `isTargetHitByAoE` is clean and correct. The Set-based lookup (`affectedSet`) is efficient for large AoE areas. Early return on first hit is optimal. The function correctly handles 1x1 tokens as a degenerate case (single iteration). `getBlastEdgeOrigin` correctly returns the corner cell farthest in the blast direction using simple conditional logic.

**Section M (Measurement):** The refactoring of `ptuDistanceTokensBBox` from `useRangeParser.ts` into `gridDistance.ts` was well executed. The shared utility maintains identical logic, the `TokenFootprintRect` interface is minimal and avoids coupling to the composable's `TokenFootprint` type, and `useRangeParser.ptuDistanceTokens` correctly delegates to the utility. The measurement store's `distance` getter correctly uses the bounding-box approach with proper fallback to `ptuDiagonalDistance` for single-cell tokens.

**Interaction Layer:** Both `useGridInteraction.ts` and `useIsometricInteraction.ts` correctly detect tokens at the clicked/hovered position and pass the token origin and size to the measurement store. The pattern is consistent across both files. The `getTokenAtPosition` / `getTokenAtGridPosition` functions were already multi-cell aware from P0, so reuse is clean.

**Rendering Layer (2D):** The footprint highlighting in `useGridRendering.ts` is well-implemented. Dashed outlines around multi-cell tokens hit by AoE provide clear visual feedback. The origin/endpoint center calculations correctly account for `startTokenOrigin` vs `startPosition` fallback. Distance lines between token centers rather than clicked cells is the correct behavior.

**Immutability:** All state mutations in the measurement store use spread operators (`{ ...position }`) for GridPosition values, preventing reference sharing. No reactive object mutations detected.

**File sizes:** All modified files remain under the 800-line limit. `useRangeParser.ts` at 596 lines, `measurement.ts` at 377 lines, `useGridRendering.ts` at 731 lines.

**Commit granularity:** Good separation. Each commit addresses a distinct concern: AoE functions, flanking, utility extraction, store changes, interaction wiring, rendering overlay, and documentation. The 7 functional commits + 1 docs commit matches the spec's three sections well.

**Decree compliance:** Per decree-002, all distance calculations use `ptuDiagonalDistance` consistently. No Chebyshev distance usage detected.

## Verdict

**CHANGES_REQUIRED**

C1 (duplicate flanking system) is the primary blocker. The new `isFlankingTarget` contradicts the existing production flanking system and creates a correctness hazard. This must be removed. The existing `flankingGeometry.ts` + `useFlankingDetection.ts` system already handles multi-cell tokens correctly via `areAdjacent()`.

H1 (isometric parity gap) must be addressed to prevent the two rendering modes from diverging in multi-cell measurement behavior. The spec calls for measurement from nearest edge (Section M) and does not scope this to 2D-only.

M1 (cleanup asymmetry) is a straightforward fix that prevents future bugs.

## Required Changes

1. **Remove `isFlankingTarget` from `useRangeParser.ts`** -- delete the function and its export. The existing `flankingGeometry.ts` system is canonical. (Severity: CRITICAL)

2. **Add multi-cell token metadata to isometric measurement overlay** -- update `useIsometricOverlays.ts` options to accept token metadata, update `IsometricCanvas.vue` to pass `measurementStore.startTokenOrigin`/`startTokenSize`/`endTokenOrigin`/`endTokenSize`, and render the origin marker and distance line endpoints at token centers. Add AoE footprint highlighting for multi-cell tokens hit. (Severity: HIGH)

3. **Reset token metadata in `endMeasurement()`** in `app/stores/measurement.ts` to match `clearMeasurement()` cleanup behavior. (Severity: MEDIUM)
