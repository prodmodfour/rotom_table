---
review_id: code-review-266
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-013
domain: vtt-grid
commits_reviewed:
  - 1fd2a3c6 (fix: remove duplicate isFlankingTarget from useRangeParser)
  - 428a9a3b (fix: reset token metadata in endMeasurement to match clearMeasurement)
  - beb0b85d (feat: add multi-cell token footprint support to isometric measurement overlay)
  - 9d22ee81 (docs: document getBlastEdgeOrigin as P3 follow-up for multi-cell Close Blast)
files_reviewed:
  - app/composables/useRangeParser.ts
  - app/stores/measurement.ts
  - app/composables/useIsometricOverlays.ts
  - app/composables/useIsometricRendering.ts
  - app/components/vtt/IsometricCanvas.vue
  - app/utils/flankingGeometry.ts
  - app/utils/gridDistance.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-02T00:15:00Z
follows_up: code-review-261
---

## Review Scope

Re-review of feature-013 P2 (Multi-Tile Token System) fix cycle. Four commits addressing all issues from code-review-261 (CRIT-1, HIGH-1, MED-1) and rules-review-237 (HIGH-1, MED-1). This is a verification review -- confirming all required changes have been made correctly with no regressions.

## Decree Compliance

- **decree-002** (PTU alternating diagonal): No changes to distance calculations in this fix cycle. All existing uses of `ptuDiagonalDistance` and `ptuDistanceTokensBBox` remain intact.
- **decree-003** (tokens passable, enemy = rough terrain): Not affected by these changes.
- **decree-023** (burst uses PTU diagonal): Not affected by these changes.
- **decree-024** (diagonal cones include corner cell): Not affected by these changes.
- **decree-040** (flanking penalty after evasion cap): Not affected. The flanking detection removal does not touch `useMoveCalculation.ts` or the penalty application logic.

## Issue Resolution Verification

### CRIT-1 (code-review-261) + HIGH-1 (rules-review-237): isFlankingTarget Removal

**Status: RESOLVED**

Commit `1fd2a3c6` cleanly removes the 51-line `isFlankingTarget` function and its export from `useRangeParser.ts`. Verified:

1. **Function body removed** (lines 468-518 of the pre-fix file): The entire function including JSDoc, signature, and implementation is deleted.
2. **Export removed**: `isFlankingTarget` removed from the return object.
3. **No dangling references in source code**: Searched the entire `app/` directory for `isFlankingTarget` -- zero code references remain.
4. **Canonical system intact**: `app/utils/flankingGeometry.ts` (194 lines) retains `checkFlanking()`, `areAdjacent()`, `FLANKING_FOES_REQUIRED`, and `getAdjacentCells()` unchanged. `app/composables/useFlankingDetection.ts` continues to wrap the geometry functions for Vue integration.
5. **Documentation updated**: `feature-013.md` ticket logs the removal with strikethrough on Section L. Design spec `_index.md` marks the function as REMOVED with explanation.

The commit message correctly attributes the fix to both review findings and explains why the removal was necessary (duplication with wrong algorithm).

### HIGH-1 (code-review-261): Isometric Measurement Overlay Multi-Cell Parity

**Status: RESOLVED**

Commit `beb0b85d` adds comprehensive multi-cell token support to the isometric measurement overlay, achieving visual parity with the 2D `useGridRendering.ts` implementation. Changes span three files:

**`app/composables/useIsometricOverlays.ts`** (now 570 lines):
- New `drawDashedFootprint()` helper draws dashed diamond outlines for NxN footprints by iterating each cell's diamond shape. Correctly uses `ctx.save()`/`ctx.restore()` and resets line dash after drawing.
- `drawMeasurementOverlay()` now reads token metadata from options (`measurementStartTokenOrigin`, `measurementStartTokenSize`, `measurementEndTokenOrigin`, `measurementEndTokenSize`).
- Origin marker centered on token footprint via `worldToScreen(originAnchor.x + startTokenSize / 2, ...)` instead of the clicked cell center. Correctly falls back to `origin` when no token metadata is present.
- Distance line endpoints use token centers for both start and end. End center calculation mirrors the start center logic.
- Dashed outlines drawn around multi-cell tokens at both measurement endpoints (start in white, end in blue matching distance mode color).
- AoE footprint highlighting: filters tokens with `size > 1` using `isTargetHitByAoE()`, draws white dashed outlines. Only runs for non-distance modes.

**`app/composables/useIsometricRendering.ts`** (now 834 lines):
- Imports `useRangeParser` to access `isTargetHitByAoE`.
- Options interface extended with four token metadata refs matching `useIsometricOverlays`.
- Wires all six new options to the overlay composable: four metadata refs, `tokens`, and `isTargetHitByAoE`.

**`app/components/vtt/IsometricCanvas.vue`** (440 lines):
- Passes `measurementStore.startTokenOrigin`, `startTokenSize`, `endTokenOrigin`, `endTokenSize` as computed refs to the rendering composable.

**Parity verification against 2D (`useGridRendering.ts`):**

| Feature | 2D (useGridRendering) | Isometric (useIsometricOverlays) |
|---------|----------------------|----------------------------------|
| Origin centered on footprint | `startTokenOrigin ?? origin` + `startTokenSize * cellSize / 2` | `startTokenOrigin ?? origin` + `startTokenSize / 2` (world coords) |
| Distance line between token centers | fromCenter/toCenter calculations | fromScreen/toScreen via `worldToScreen` |
| Start token dashed outline | `ctx.setLineDash([5, 5])` rectangle | `drawDashedFootprint()` per-cell diamond |
| End token dashed outline | Same pattern | Same pattern |
| AoE footprint highlight | `isTargetHitByAoE` filter + dashed rectangle | `isTargetHitByAoE` filter + `drawDashedFootprint` |

All five visual features are present in both renderers. The isometric implementation correctly adapts the 2D rectangular operations to isometric diamond-based drawing.

**Note on file size:** `useIsometricRendering.ts` is at 834 lines, exceeding the 800-line project limit. However, this was already at 820 lines before the fix cycle (a pre-existing condition already tracked by `refactoring-111`). The fix cycle added only 14 lines (1 import + 1 function destructure + 6 option interface lines + 6 wiring lines), which is the minimum necessary to resolve HIGH-1. Requiring a refactoring extraction as part of this fix cycle would be disproportionate to the change and is better addressed by the existing refactoring ticket.

### MED-1 (code-review-261): endMeasurement() Token Metadata Reset

**Status: RESOLVED**

Commit `428a9a3b` adds four lines to `endMeasurement()` in `app/stores/measurement.ts`:

```typescript
endMeasurement() {
  this.isActive = false
  this.startTokenOrigin = null
  this.startTokenSize = 1
  this.endTokenOrigin = null
  this.endTokenSize = 1
}
```

This now matches `clearMeasurement()` exactly (minus the `startPosition`/`endPosition` null assignments, which `endMeasurement` intentionally preserves so the last measurement result remains readable after deactivation). The asymmetry between the two cleanup paths is resolved.

### MED-1 (rules-review-237): getBlastEdgeOrigin P3 Documentation

**Status: RESOLVED**

Commit `9d22ee81` adds documentation at two locations:

1. **TODO in `getAffectedCells()`** (lines 412-413): `// TODO (P3): For multi-cell attackers, use getBlastEdgeOrigin() instead // of raw origin to place close-blast adjacent to the correct footprint edge.` -- This is placed directly above the close-blast case where the integration would occur.

2. **Extended JSDoc on `getBlastEdgeOrigin()`** (lines 510-514): A prominent `NOTE:` block explaining the function is not yet integrated, what the current behavior is for multi-cell attackers, and that integration is tracked as a P3 follow-up citing rules-review-237 MED-1.

This is the correct approach per rules-review-237's recommendation: "document as such" since multi-cell Close Blast is an edge case not yet actively used in combat.

## What Looks Good

**Minimal, targeted fixes.** Each commit addresses exactly one review issue with no extraneous changes. The four commits total +104/-51 lines across the fix cycle -- appropriately scoped.

**Correct fallback behavior.** The isometric overlay gracefully handles the case where token metadata is absent (defaults to clicked cell position and size 1), preserving backward compatibility with existing 1x1 token measurements.

**Immutability preserved.** No reactive object mutations introduced. The isometric overlay receives data via computed refs and reads values within the draw function, following the established pattern.

**Consistent commit messages.** Each commit cites the specific review issue it addresses and explains the rationale, making the fix cycle auditable.

**Documentation updated.** The feature-013 ticket has a complete P2 Fix Cycle section logging all four commits with the review issues they address. Section L is struck through with explanation. The design spec `_index.md` is updated.

## Verdict

**APPROVED**

All five issues from code-review-261 and rules-review-237 have been correctly resolved:

| Issue | Source | Severity | Fix Commit | Status |
|-------|--------|----------|------------|--------|
| isFlankingTarget duplicates flankingGeometry.ts | code-review-261 C1 | CRITICAL | 1fd2a3c6 | RESOLVED |
| isFlankingTarget wrong PTU rules | rules-review-237 H1 | HIGH | 1fd2a3c6 | RESOLVED |
| Isometric overlay lacks multi-cell parity | code-review-261 H1 | HIGH | beb0b85d | RESOLVED |
| endMeasurement() cleanup asymmetry | code-review-261 M1 | MEDIUM | 428a9a3b | RESOLVED |
| getBlastEdgeOrigin not documented as P3 | rules-review-237 M1 | MEDIUM | 9d22ee81 | RESOLVED |

No new issues introduced. The `useIsometricRendering.ts` file size (834 lines) is a pre-existing condition tracked by `refactoring-111` and not attributable to this fix cycle.

## Required Changes

None.
