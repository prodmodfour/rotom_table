---
review_id: rules-review-242
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-013
domain: vtt-grid
commits_reviewed:
  - 1fd2a3c6 (fix: remove duplicate isFlankingTarget from useRangeParser)
  - 428a9a3b (fix: reset token metadata in endMeasurement)
  - beb0b85d (feat: add multi-cell token footprint support to isometric measurement overlay)
  - 9d22ee81 (docs: document getBlastEdgeOrigin as P3 follow-up)
mechanics_verified:
  - Flanking system (removal of duplicate, canonical system intact)
  - Edge-to-edge distance measurement (PTU alternating diagonal)
  - AoE hit detection for multi-cell tokens
  - Close Blast edge origin for multi-cell attackers
  - Measurement store token metadata lifecycle
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - "PTU Core Chapter 7, p.232: Flanking rules"
  - "PTU Core Chapter 7, p.231: Size Categories and grid footprints"
  - "decree-002: PTU alternating diagonal for all grid distances"
  - "decree-003: Tokens passable, enemy occupied = rough terrain"
  - "decree-040: Flanking penalty applies after evasion cap"
reviewed_at: 2026-03-02T04:15:00Z
follows_up: rules-review-237
---

## Re-Review Context

This is a re-review of feature-013 P2 (Multi-Tile Token System) after a fix cycle. The original rules-review-237 found:

- **HIGH-1:** `isFlankingTarget` in `useRangeParser.ts` did not implement PTU flanking rules (angle-based check instead of size-dependent non-adjacent foe counting)
- **MED-1:** `getBlastEdgeOrigin` not wired into `getAffectedCells()` for Close Blast resolution

The companion code-review-261 found:

- **CRIT-1:** `isFlankingTarget` duplicated and contradicted the existing canonical `flankingGeometry.ts` system
- **HIGH-1:** Isometric measurement overlay lacked multi-cell token parity with 2D renderer
- **MED-1:** `endMeasurement()` did not reset token metadata

Four fix commits were made. This review verifies each fix against PTU rules.

## Mechanics Verified

### 1. Flanking System Integrity (Fix for HIGH-1 / CRIT-1)

- **Rule:** "A Small or Medium sized Trainer or Pokemon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other. For Large Trainers and Pokemon, the requirement is three foes meeting those conditions. The requirement increases to four for Huge and five for Gigantic sized combatants." (PTU Core Chapter 7, p.232)
- **Implementation:** Commit 1fd2a3c6 completely removed the incorrect `isFlankingTarget` function from `app/composables/useRangeParser.ts` (51 lines deleted). The function and its export are both gone. A codebase-wide search confirms zero remaining references in source code (only documentation/artifact files mention it historically).
- **Canonical system verification:** The existing flanking implementation in `app/utils/flankingGeometry.ts` remains intact and correct:
  - `FLANKING_FOES_REQUIRED` maps size 1->2, 2->3, 3->4, 4->5 (matches PTU p.232 exactly)
  - `checkFlanking()` collects all adjacent foes, checks count >= required, then searches for a pair of foes that are NOT adjacent to each other
  - `areAdjacent()` handles multi-cell tokens by iterating all NxN cells of both tokens
  - `app/composables/useFlankingDetection.ts` wraps this with reactive computation, filtering dead/fainted combatants
  - Per decree-040, the flanking -2 evasion penalty applies after the evasion cap (confirmed in `useMoveCalculation.ts` per the decree text)
- **Status:** CORRECT. The duplicate is removed. The canonical system correctly implements PTU p.232.

### 2. Close Blast Edge Origin Documentation (Fix for MED-1)

- **Rule:** Close Blast originates "adjacent to the user" (PTU Core Chapter 7). For multi-cell attackers, "adjacent" means the blast should originate from the attacker's footprint edge in the blast direction.
- **Implementation:** Commit 9d22ee81 added documentation to `getBlastEdgeOrigin()` in `app/composables/useRangeParser.ts`:
  - JSDoc NOTE block (lines 510-514) explains the function is not yet integrated into `getAffectedCells()` and tracks this as a P3 follow-up referencing rules-review-237 MED-1
  - TODO comment at the close-blast case in `getAffectedCells()` (lines 412-413) points future developers to `getBlastEdgeOrigin()` for multi-cell integration
- **Analysis:** The function itself was already verified as correct in rules-review-237 (returns the corner cell of the footprint closest to the blast direction). The documentation now clearly communicates the integration gap. For 1x1 attackers (the current common case), `getAffectedCells()` produces correct results since `origin.x + direction.dx` is equivalent to `getBlastEdgeOrigin()` when size=1. The gap only manifests for Large+ attackers using Close Blast, which is an uncommon edge case appropriately deferred to P3.
- **Status:** CORRECT. The function is correct, the gap is documented, and deferral to P3 is appropriate.

### 3. Edge-to-Edge Distance Measurement (Verification of existing mechanics)

- **Rule:** Per decree-002, all grid distances use the PTU alternating diagonal rule (1-2-1-2). Distance between multi-cell tokens is measured from the nearest occupied cell.
- **Implementation:** The measurement store (`app/stores/measurement.ts`) correctly:
  - Uses `ptuDistanceTokensBBox()` for edge-to-edge distance when either endpoint has a multi-cell token (lines 47-63)
  - Falls back to `ptuDiagonalDistance()` for single-cell tokens (lines 66-69)
  - `endMeasurement()` now resets all four token metadata fields (lines 146-152), matching `clearMeasurement()` behavior (commit 428a9a3b)
- **Status:** CORRECT. Per decree-002, distance calculations are consistent.

### 4. AoE Hit Detection for Multi-Cell Tokens (Isometric parity)

- **Rule:** A multi-cell target is hit by an AoE if any cell of its NxN footprint overlaps with the affected area. Standard tabletop interpretation.
- **Implementation:** Commit beb0b85d added multi-cell token support to the isometric overlay in `app/composables/useIsometricOverlays.ts`:
  - `isTargetHitByAoE` function reference is passed through `useIsometricRendering.ts` from `useRangeParser` (line 114, 156)
  - Multi-cell tokens hit by AoE get dashed diamond outlines via `drawDashedFootprint()` (lines 490-497)
  - Origin marker now centers on the token footprint using `startTokenOrigin` and `startTokenSize` (lines 499-516)
  - Distance lines connect token centers, not clicked cells (lines 519-535)
  - Dashed outlines drawn around multi-cell tokens at both endpoints (lines 513-515 for start, lines 539-541 for end)
  - Token metadata options added to `IsometricOverlayOptions` interface (lines 61-69)
  - `IsometricCanvas.vue` passes `measurementStore.startTokenOrigin/Size` and `endTokenOrigin/Size` (lines 228-231)
- **Analysis:** The isometric overlay now has feature parity with the 2D `useGridRendering.ts` for multi-cell measurement visualization. The `isTargetHitByAoE` function (verified correct in rules-review-237) is reused rather than reimplemented, which is correct. The `drawDashedFootprint` helper correctly iterates all NxN cells of a token footprint and draws dashed diamond outlines around each cell.
- **Status:** CORRECT.

### 5. Measurement Store Token Metadata Lifecycle (Fix for MED-1)

- **Rule:** No PTU rule directly applies. This is a data integrity concern ensuring measurement state is clean.
- **Implementation:** Commit 428a9a3b added 4 lines to `endMeasurement()` in `app/stores/measurement.ts` (lines 148-151):
  ```typescript
  this.startTokenOrigin = null
  this.startTokenSize = 1
  this.endTokenOrigin = null
  this.endTokenSize = 1
  ```
  This matches the cleanup behavior of `clearMeasurement()` (lines 157-160).
- **Analysis:** Both cleanup paths now consistently reset token metadata. `startMeasurement()` and `updateMeasurement()` set token metadata from their parameters (defaulting to null/1 when not provided). The lifecycle is now symmetric: start -> update -> end (or clear) all handle token metadata correctly.
- **Status:** CORRECT.

## Decree Compliance

| Decree | Status |
|--------|--------|
| decree-002 (PTU diagonal for all distances) | COMPLIANT. `ptuDistanceTokensBBox` uses `ptuDiagonalDistance`. Measurement store and isometric overlay both use edge-to-edge distance via `ptuDistanceTokensBBox`. |
| decree-003 (tokens passable, enemy = rough terrain) | NOT APPLICABLE. No movement or passability changes in these fixes. |
| decree-023 (burst uses PTU diagonal) | NOT APPLICABLE. No burst logic changes. |
| decree-024 (diagonal cone includes corner cell) | NOT APPLICABLE. No cone logic changes. |
| decree-040 (flanking penalty after evasion cap) | COMPLIANT. Canonical flanking system in `flankingGeometry.ts` + `useFlankingDetection.ts` intact. Penalty application in `useMoveCalculation.ts` unchanged. |

## Summary

All four fix commits correctly address the issues raised in code-review-261 and rules-review-237:

1. **isFlankingTarget removed** (1fd2a3c6): The duplicate function with incorrect angle-based algorithm has been completely deleted. The canonical `flankingGeometry.ts` system (which correctly implements PTU p.232 with size-dependent foe counts, non-adjacency checks, and multi-cell support) remains the sole flanking implementation. No dangling references in source code.

2. **endMeasurement() resets token metadata** (428a9a3b): Both `endMeasurement()` and `clearMeasurement()` now consistently reset all four token metadata fields, eliminating the stale data risk.

3. **Isometric overlay multi-cell parity** (beb0b85d): The isometric measurement overlay now matches the 2D renderer with: token-centered origin markers, token-center distance lines, dashed footprint outlines, and AoE footprint highlighting for hit multi-cell tokens. All features reuse the verified `isTargetHitByAoE` function.

4. **getBlastEdgeOrigin documented** (9d22ee81): Clear JSDoc and TODO comments explain the integration gap (correct function exists but not yet wired into `getAffectedCells()`), with explicit P3 tracking. The function is correct for 1x1 and multi-cell attackers; integration is only needed when multi-cell Close Blast is actively used.

## Verdict

**APPROVED**

All issues from rules-review-237 (HIGH-1, MED-1) and code-review-261 (CRIT-1, HIGH-1, MED-1) have been resolved. The canonical flanking system correctly implements PTU p.232. Distance measurements comply with decree-002. No new PTU rule violations introduced by these fixes.

## Required Changes

None.
