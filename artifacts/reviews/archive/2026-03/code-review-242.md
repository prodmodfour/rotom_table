---
review_id: code-review-240
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-013
domain: vtt-grid
commits_reviewed:
  - 623b9c66
  - 33d111d2
  - 83420817
  - e8e5224b
  - 2dfc531a
files_reviewed:
  - app/utils/sizeCategory.ts
  - app/composables/useGridRendering.ts
  - app/composables/useIsometricRendering.ts
  - app/composables/useGridMovement.ts
  - app/composables/useGridInteraction.ts
  - app/server/services/grid-placement.service.ts
  - app/composables/useIsometricProjection.ts
  - app/components/vtt/VTTToken.vue
  - app/stores/encounterGrid.ts
  - app/types/encounter.ts
  - app/types/spatial.ts
  - artifacts/designs/design-multi-tile-tokens-001/_index.md
  - artifacts/designs/design-multi-tile-tokens-001/spec-p0.md
  - artifacts/tickets/open/feature/feature-013.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 3
reviewed_at: 2026-03-01T12:00:00Z
follows_up: null
---

## Review Scope

First review of feature-013 P0 (Multi-Tile Token System), implementing core multi-cell rendering for the VTT grid. Five commits by slave-3 covering:

1. **sizeCategory.ts** — New client-side utility with `SIZE_FOOTPRINT_MAP`, `sizeToFootprint()`, `getFootprintCells()`, `isFootprintInBounds()`
2. **useGridRendering.ts** — 2D movement preview updated to highlight full NxN destination footprint with centered arrow
3. **useIsometricRendering.ts** — Isometric depth sorting uses footprint center; movement arrow uses footprint center; destination cells highlighted as NxN diamond overlay
4. **Verification comments** — Documentation comments on existing multi-cell code in `useGridMovement.ts`, `useGridInteraction.ts`, `grid-placement.service.ts`
5. **Ticket/design spec updates** — Resolution log and implementation log entries

Decrees checked: decree-003 (tokens passable, no stacking), decree-010 (multi-tag terrain), decree-011 (speed averaging across terrain). No decree violations found. Decree-003 no-stacking rule is correctly enforced in `isValidMove()` for multi-cell destinations.

## Issues

### CRITICAL

#### CRIT-1: Inconsistent center calculation between depth sorting and token rendering in isometric mode

**File:** `app/composables/useIsometricRendering.ts`

The depth sorting in `drawTokens()` (line 473-474) uses `(token.size - 1) / 2` to calculate the footprint center:

```typescript
const centerX = token.position.x + (token.size - 1) / 2
const centerY = token.position.y + (token.size - 1) / 2
```

But `drawSingleToken()` (line 500-501) uses `token.size / 2`:

```typescript
const centerGridX = token.position.x + token.size / 2
const centerGridY = token.position.y + token.size / 2
```

And `drawMovementArrow()` (line 694-697) also uses `token.size / 2`:

```typescript
const fromCenterX = preview.fromPosition.x + tokenSize / 2
const toCenterX = preview.toPosition.x + tokenSize / 2
```

For a 2x2 token at position (3, 3):
- `(size - 1) / 2` = 0.5, so center = (3.5, 3.5) — this is the center of the NxN footprint in grid coordinates where the cell center of (3,3) is at (3.5, 3.5) and cell center of (4,4) is at (4.5, 4.5). The center of the footprint is at (4.0, 4.0).
- `size / 2` = 1.0, so center = (4.0, 4.0) — this is the actual center of the NxN footprint since the footprint spans from (3,3) to (4,4) inclusive, and the rightmost edge is at x=5.

Actually, let me reconsider. In `worldToScreen`, the grid coordinate (x, y) maps to the **top-left corner** of cell (x, y). So:
- A 2x2 token at (3, 3) occupies cells (3,3), (4,3), (3,4), (4,4). The footprint extends from world coordinate (3, 3) to (5, 5) — the edges of the last occupied cells.
- True geometric center = (4.0, 4.0) = `position + size/2` — this is what `drawSingleToken` and `drawMovementArrow` use.
- `position + (size-1)/2` = (3.5, 3.5) — this is the center of the **cell indices**, not the geometric center of the footprint.

The depth sorting value is derived from `rx + ry`, which is a monotonic function. The inconsistency means depth sorting ranks tokens by the center of their cell indices rather than the geometric center. For a 2x2 token, the depth key is calculated from (3.5, 3.5) rather than (4.0, 4.0). This causes a **depth sorting error**: a 2x2 token at (3,3) would sort as if its center is at grid index (3.5, 3.5), but a 1x1 token at (4,4) sorts from (4, 4). The 2x2 token sorts in front of the 1x1 token at (4,4) even though it occupies that cell. The visual rendering places the sprite at (4.0, 4.0) but the depth sort considers it at (3.5, 3.5).

For most cases this is a minor visual glitch, but for adjacent overlapping depth zones it can cause z-fighting where a large token is drawn behind a small token that sits in its footprint area. Given that feature-014 (flanking detection) depends on correct spatial reasoning from this code, this must be fixed.

**Fix:** Use `token.size / 2` consistently for depth sorting, matching `drawSingleToken` and `drawMovementArrow`:

```typescript
const centerX = token.position.x + token.size / 2
const centerY = token.position.y + token.size / 2
```

### HIGH

#### HIGH-1: No bounds clamping on NxN footprint highlight in 2D movement preview

**Files:** `app/composables/useGridRendering.ts` (lines 481-491 in `drawMovementPreview`, lines 600-610 in `drawExternalMovementPreview`)

When the user hovers near the grid edge with a multi-cell token, the NxN footprint loop draws cells outside the grid bounds without any clamping:

```typescript
for (let dx = 0; dx < tokenSize; dx++) {
  for (let dy = 0; dy < tokenSize; dy++) {
    drawCellHighlight(ctx, {
      x: target.x + dx,
      y: target.y + dy,
      // ... no bounds check
    })
  }
}
```

`drawCellHighlight()` in `useCanvasDrawing.ts` does not perform bounds checking — it blindly draws at `x * cellSize, y * cellSize`. For a 4x4 Gigantic token, hovering at the edge of a 20x20 grid means up to 12 cells could be highlighted outside the grid boundary (negative or beyond grid dimensions). While canvas will technically render these without crashing, it creates a confusing visual where highlight squares extend beyond the grid into the dark canvas area.

The same issue exists in the isometric `drawMovementArrow()` (lines 714-723) where the destination footprint is highlighted without bounds checking.

Compare with the `drawMovementRange` function which *does* check bounds for each cell:

```typescript
rangeCells.forEach(cell => {
  if (cell.x >= 0 && cell.x < options.config.value.width &&
      cell.y >= 0 && cell.y < options.config.value.height) {
    // ...draw
  }
})
```

**Fix:** Add bounds checking to all three NxN footprint highlight loops. For 2D mode, check each cell against `(0, 0)` to `(gridWidth-1, gridHeight-1)` before calling `drawCellHighlight`. For isometric mode, check against `isInBounds()`.

#### HIGH-2: `sizeCategory.ts` utility is unused — dead code introduced in P0

**File:** `app/utils/sizeCategory.ts`

The new utility file provides `sizeToFootprint()`, `getFootprintCells()`, and `isFootprintInBounds()`, but a search across the entire `app/` directory confirms none of these functions are imported or used anywhere. The P0 changes in `useGridRendering.ts` and `useIsometricRendering.ts` use inline `token.size` directly rather than calling `sizeToFootprint()`. The existing code in `useGridMovement.ts` and `grid-placement.service.ts` uses inline loops rather than `getFootprintCells()`. The bounds checks in `isValidMove()` use inline logic rather than `isFootprintInBounds()`.

While the design spec says this utility is "for future use by P1/P2," the project coding standards state: no dead code. The utility creates a parallel API to the server-side `sizeToTokenSize()` in `grid-placement.service.ts` without any actual integration point.

**Fix:** Either:
- (a) Wire up the utility now: replace at least one existing inline footprint loop with `getFootprintCells()` and one bounds check with `isFootprintInBounds()`, proving the utility works and establishing the pattern, OR
- (b) Remove the file and re-introduce it when P1 actually needs it. Since P1 will add multi-cell pathfinding and fog, that is the natural integration point.

Option (a) is preferred — it validates the utility and reduces code duplication in `getOccupiedCells()`, `isValidMove()`, and `drawMovementPreview()`.

### MEDIUM

#### MED-1: `app-surface.md` not updated with new `sizeCategory.ts` utility

**File:** `.claude/skills/references/app-surface.md`

The design spec `_index.md` lists `app/utils/sizeCategory.ts` under `new_files`, but a search for "sizeCategory" in `app-surface.md` returns no matches. Per project standards, new utilities should be registered in the app surface reference so future skills and reviewers can discover them.

**Fix:** Add `sizeCategory.ts` to the utils section of `app-surface.md` with a brief description of its exports.

#### MED-2: Isometric destination footprint highlight uses single-point elevation for all NxN cells

**File:** `app/composables/useIsometricRendering.ts` (lines 689-690, 714-723)

The movement arrow destination footprint highlight uses the elevation at `(preview.toPosition.x, preview.toPosition.y)` — the anchor cell — for all NxN cells of the footprint:

```typescript
const toElev = options.getTerrainElevation
  ? options.getTerrainElevation(preview.toPosition.x, preview.toPosition.y)
  : 0

// Then draws all NxN cells using toElev
for (let dx = 0; dx < tokenSize; dx++) {
  for (let dy = 0; dy < tokenSize; dy++) {
    drawCellHighlight(ctx,
      { x: preview.toPosition.x + dx, y: preview.toPosition.y + dy },
      toElev, // Same elevation for all cells
      ...
    )
  }
}
```

If a large token's footprint spans an elevation boundary (e.g., a cliff edge), all highlight diamonds render at the same elevation, creating a visual mismatch with the terrain. Each cell should use its own elevation:

```typescript
for (let dx = 0; dx < tokenSize; dx++) {
  for (let dy = 0; dy < tokenSize; dy++) {
    const cellElev = options.getTerrainElevation
      ? options.getTerrainElevation(preview.toPosition.x + dx, preview.toPosition.y + dy)
      : 0
    drawCellHighlight(ctx,
      { x: preview.toPosition.x + dx, y: preview.toPosition.y + dy },
      cellElev, angle, gridW, gridH, cellSize, bgColor, color
    )
  }
}
```

This is MEDIUM because elevation on VTT grids is not commonly used yet, but it will compound when P1 adds multi-cell terrain integration.

#### MED-3: 2D `drawMovementPreview` arrow source center was already correct before this change, but comments claim it was fixed

**File:** `app/composables/useGridRendering.ts`

The diff for commit 33d111d2 shows the `startX`/`startY` calculation was already using `(token.size * cellSize) / 2` before the change — only the comment changed from "Token center" to "Token center (accounts for multi-cell footprint)". This is fine but the commit message "feat: highlight full NxN footprint in 2D movement preview" implies the arrow source was changed. More importantly, the **destination** center calculation was the actual fix: changing from `cellSize / 2` (single cell center) to `(tokenSize * cellSize) / 2` (NxN footprint center). The commit message should reflect what actually changed rather than implying both source and destination were broken.

This is cosmetic but matters for future archaeology — if someone bisects a rendering bug and lands on this commit, the message should accurately describe the scope.

## What Looks Good

1. **PTU size categories are correct.** Small/Medium = 1, Large = 2, Huge = 3, Gigantic = 4 matches PTU Core Chapter 7 p.231. The `SIZE_FOOTPRINT_MAP` is well-documented with rule references.

2. **`sizeToFootprint()` defensive design.** Gracefully handles `null`, `undefined`, and unknown strings by returning 1. The `as SizeCategory` cast with `?? 1` fallback is clean.

3. **2D movement preview NxN footprint highlight** is a meaningful improvement. The previous behavior only highlighted a single cell for the destination, which was misleading for multi-cell tokens. The fix correctly centers the arrow on the full footprint.

4. **Isometric depth sorting improvement.** Using the footprint center for depth calculation (rather than the origin corner) is the correct approach. Before this change, a 4x4 token at (0,0) would sort as if it were at (0,0) depth, potentially drawing behind 1x1 tokens at (1,1). The center-based sort distributes depth more accurately.

5. **Verification of existing multi-cell code** is thorough. The developer correctly identified that `getOccupiedCells()`, `getTokenAtPosition()`, `canFit()`, and `isValidMove()` already handle multi-cell footprints and added only verification comments rather than unnecessary changes.

6. **VTTToken.vue already works** for multi-cell rendering. The `tokenStyle` computed property correctly uses `cellSize * token.size` for width/height, and CSS styles like HP bar positioning use percentage-based offsets that scale naturally.

7. **Commit granularity is appropriate.** Five commits covering distinct concerns (utility, 2D rendering, isometric rendering, verification, docs) match the project's small-commit guidelines.

8. **Per decree-003**, the no-stacking validation in `isValidMove()` correctly checks ALL cells of the NxN destination footprint against the occupied set. Movement-through is correctly unrestricted.

## Verdict

**CHANGES_REQUIRED**

The inconsistent center calculation (CRIT-1) must be fixed before P1 can build on this foundation — depth sorting errors with multi-cell tokens will cause visual artifacts in flanking geometry (feature-014 depends on feature-013). The missing bounds checking (HIGH-1) must be addressed to prevent out-of-bounds rendering for Huge and Gigantic tokens at grid edges. The unused utility (HIGH-2) should be wired up or deferred.

## Required Changes

| ID | Severity | Fix Description |
|----|----------|-----------------|
| CRIT-1 | CRITICAL | Use `token.size / 2` consistently for depth sorting in `drawTokens()` to match `drawSingleToken()` and `drawMovementArrow()` |
| HIGH-1 | HIGH | Add grid bounds checking to all three NxN footprint highlight loops (2D `drawMovementPreview`, 2D `drawExternalMovementPreview`, isometric `drawMovementArrow`) |
| HIGH-2 | HIGH | Wire up `sizeCategory.ts` utility in at least one existing code path (e.g., `getOccupiedCells()` or `isValidMove()`) to eliminate dead code, or remove and defer to P1 |
| MED-1 | MEDIUM | Add `sizeCategory.ts` to `app-surface.md` utils section |
| MED-2 | MEDIUM | Use per-cell elevation in isometric destination footprint highlight instead of anchor-only elevation |
| MED-3 | MEDIUM | No action required (cosmetic commit message observation) |
