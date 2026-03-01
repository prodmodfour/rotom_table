---
review_id: code-review-245
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-013
domain: vtt-grid
commits_reviewed:
  - 9ae2ca2e
  - fd3f3269
  - 233152c8
  - d78a138d
  - 02d5f8e7
files_reviewed:
  - app/composables/useIsometricRendering.ts
  - app/composables/useGridRendering.ts
  - app/composables/useGridMovement.ts
  - app/utils/sizeCategory.ts
  - .claude/skills/references/app-surface.md
  - artifacts/designs/design-multi-tile-tokens-001/_index.md
  - artifacts/tickets/open/feature/feature-013.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-01T14:15:00Z
follows_up: code-review-242
---

## Review Scope

Re-review of feature-013 P0 fix cycle. Five commits by slave-1 addressing all six findings from code-review-242 (1 CRITICAL, 2 HIGH, 3 MEDIUM). This review verifies each fix individually and then confirms the overall multi-tile token implementation is correct.

Decrees checked: decree-003 (token passability and no-stacking), decree-023 (burst uses PTU diagonal), decree-024 (diagonal cone diamond shape). No decree violations found. Per decree-003, the `isValidMove()` no-stacking check correctly uses `getFootprintCells()` to test ALL destination cells against the occupied set.

## Fix Verification

### CRIT-1: Token depth sorting center consistency — RESOLVED

**Commit:** 9ae2ca2e
**File:** `app/composables/useIsometricRendering.ts` (lines 473-474)

Verified: `drawTokens()` depth sorting now uses `token.size / 2` for both centerX and centerY, matching `drawSingleToken()` (line 500-501) and `drawMovementArrow()` (lines 694-697). All three locations now use the geometric center of the NxN footprint consistently. For a 2x2 token at (3,3), all compute center as (4.0, 4.0).

### HIGH-1: NxN footprint highlight bounds checking — RESOLVED

**Commit:** fd3f3269
**Files:** `app/composables/useGridRendering.ts` (lines 483-485, 607-609), `app/composables/useIsometricRendering.ts` (line 718)

Verified all three NxN highlight loops now have bounds checking:

1. **2D `drawMovementPreview`** (line 485): `cellX >= 0 && cellX < gridWidth && cellY >= 0 && cellY < gridHeight` — `gridWidth`/`gridHeight` correctly destructured from `options.config.value` at line 453.
2. **2D `drawExternalMovementPreview`** (line 609): `cellX >= 0 && cellX < extGridWidth && cellY >= 0 && cellY < extGridHeight` — `extGridWidth`/`extGridHeight` correctly destructured from `options.config.value` at line 604.
3. **Isometric `drawMovementArrow`** (line 718): `cellX >= 0 && cellX < gridW && cellY >= 0 && cellY < gridH` — `gridW`/`gridH` are function parameters from the render pipeline.

No other NxN highlight loops exist in the rendering composables (confirmed via search).

### HIGH-2: sizeCategory.ts wired into useGridMovement — RESOLVED

**Commit:** 233152c8
**File:** `app/composables/useGridMovement.ts`

Verified: `getFootprintCells` and `isFootprintInBounds` are imported (line 13) and used in four locations:
- `getOccupiedCells()` (line 312): replaces inline dx/dy loop
- `getEnemyOccupiedCells()` (line 344): replaces inline dx/dy loop
- `isValidMove()` bounds check (line 490): replaces inline comparison
- `isValidMove()` stacking check (line 496-497): replaces inline dx/dy loop with `destCells.some()`

Mathematical equivalence verified: old `toPos.x + tokenSize - 1 < gridWidth` equals new `x + size <= gridWidth` for integer inputs.

The `sizeToFootprint()` function remains unused — this is acceptable since all current code paths already have the numeric `token.size` and don't need string-to-number conversion. P1 will use it when integrating with Pokemon species data that uses string category names.

### MED-1: app-surface.md updated — RESOLVED

**Commit:** d78a138d
**File:** `.claude/skills/references/app-surface.md` (line 162)

Verified: `sizeCategory.ts` added to the "VTT Grid utilities" section with a description of all exports and usage context.

### MED-2: Per-cell elevation in isometric NxN highlight — RESOLVED

**Commit:** fd3f3269
**File:** `app/composables/useIsometricRendering.ts` (lines 719-721)

Verified: Each cell in the NxN highlight loop now calls `options.getTerrainElevation(cellX, cellY)` individually. The fallback when `getTerrainElevation` is not provided uses `toElev` (anchor cell elevation), which preserves backward compatibility for grids without terrain elevation data.

The movement arrow endpoint (line 703-706) still uses the anchor cell's `toElev` for `worldToScreen` projection. This is acceptable — the arrow points to the footprint center and a single elevation for the line endpoint is a reasonable visual approximation.

### MED-3: Commit message cosmetic observation — N/A

No action was required per the original review. Confirmed no changes were made for this item.

## Issues

### MEDIUM

#### MED-1: useIsometricRendering.ts at 820 lines — exceeds 800-line project limit

**File:** `app/composables/useIsometricRendering.ts`

The file was 783 lines before feature-013 P0. The P0 implementation added 30 lines (to 813) and the fix cycle added 7 more (to 820), pushing it 20 lines past the project's 800-line maximum. The fix cycle alone did not cause the violation — the bounds-checking additions were structurally necessary.

This is not blocking for P0 approval because the file growth was incremental and the fixes are in the correct location. However, P1 (multi-cell pathfinding, movement range) will add more code to this file, likely pushing it to 850+. An extraction should happen before or during P1.

**Recommendation:** File a ticket for P1 prep: extract `drawMovementArrow()` (lines 674-756, 82 lines) and related arrow/highlight drawing into a dedicated `useIsometricMovementPreview.ts` composable. This would bring `useIsometricRendering.ts` back to ~740 lines and create headroom for P1 additions.

## What Looks Good

1. **All six review findings addressed with clean, minimal diffs.** Each fix commit is focused on exactly one finding, with clear commit messages referencing the review ID (code-review-242). Good commit granularity.

2. **`getFootprintCells` / `isFootprintInBounds` integration is well-done.** The refactoring in useGridMovement.ts replaces four separate inline dx/dy loops with utility calls, reducing code duplication. The `destCells.some()` pattern for stacking checks is more readable than the early-exit nested loop it replaces.

3. **Bounds checking pattern is consistent.** All three NxN highlight loops use the same `cellX >= 0 && cellX < width && cellY >= 0 && cellY < height` pattern, extracting `cellX`/`cellY` variables before the check for clarity.

4. **Per-cell elevation fix is thorough.** The fallback to `toElev` when `getTerrainElevation` is absent preserves backward compatibility. The fix correctly scopes the elevation improvement to the cell highlights while leaving the arrow endpoint at the anchor elevation (which is a reasonable visual tradeoff).

5. **Documentation is comprehensive.** The design `_index.md` implementation log has a detailed table mapping each review finding to its fix commit. The ticket resolution log mirrors this. Both will help future developers understand the fix history.

6. **No new dead code introduced.** All changes are either fixing existing code (CRIT-1, HIGH-1, MED-2), wiring up existing code (HIGH-2), or documentation (MED-1, docs commit).

7. **Server/client boundary respected.** The server-side `grid-placement.service.ts` retains its own inline footprint logic (since it cannot import from `~/utils/`), while the client-side `useGridMovement.ts` uses the shared utility. This is the correct separation.

## Verdict

**APPROVED**

All CRITICAL and HIGH findings from code-review-242 are correctly resolved. The depth sorting center is now consistent across all isometric rendering functions. Bounds checking covers all three NxN highlight loops. The sizeCategory utility is integrated into useGridMovement with four usage sites, eliminating the dead code concern. The single MEDIUM issue (file length) is a pre-existing trend that should be addressed in P1 prep, not a blocker for P0 completion.

## Required Changes

None. P0 is approved for merge.

| ID | Severity | Description | Action |
|----|----------|-------------|--------|
| MED-1 | MEDIUM | useIsometricRendering.ts at 820 lines (800 max) | File a ticket for P1 prep extraction — not blocking P0 |
