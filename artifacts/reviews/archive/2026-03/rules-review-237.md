---
review_id: rules-review-237
review_type: rules
reviewer: game-logic-reviewer
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
mechanics_verified:
  - AoE hit detection for multi-cell targets (Section K)
  - Close Blast edge origin for multi-cell attackers (Section K)
  - Flanking geometry for large tokens (Section L)
  - Edge-to-edge distance measurement between tokens (Section M)
  - PTU alternating diagonal distance for bounding boxes (decree-002)
  - Footprint size mapping (PTU Chapter 7 p.231)
verdict: CHANGES_REQUIRED
issues_found:
  critical: 0
  high: 1
  medium: 1
ptu_refs:
  - "PTU Core Chapter 7, p.231: Size Categories and grid footprints"
  - "PTU Core Chapter 7, p.232: Flanking rules"
  - "decree-002: PTU alternating diagonal for all grid distances"
  - "decree-003: Tokens passable, enemy occupied = rough terrain"
  - "decree-007: Cone shapes use fixed 3m-wide rows"
  - "decree-023: Burst shapes use PTU diagonal distance"
  - "decree-024: Diagonal cones include corner cell"
reviewed_at: 2026-03-01T22:10:00Z
follows_up: rules-review-234
---

## Mechanics Verified

### 1. AoE Hit Detection for Multi-Cell Targets (`isTargetHitByAoE`)

- **Rule:** "A combatant's footprint on a grid is determined by their Size. Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4" (PTU Core Chapter 7, p.231). Standard tabletop interpretation: a multi-cell target is hit by an AoE if ANY cell of its footprint overlaps with the affected area.
- **Implementation:** `isTargetHitByAoE()` in `app/composables/useRangeParser.ts` (lines 530-548). Creates a Set of affected cell coordinates, then iterates over the target's NxN footprint checking for membership. Uses the top-left anchor position and size to enumerate all cells `(x+dx, y+dy)` for `dx,dy in [0, size)`.
- **Analysis:**
  - Correctly uses Set for O(1) lookups (efficient for large AoEs).
  - Correctly iterates the full NxN footprint from top-left anchor.
  - Early return on first overlap (correct -- any cell hit = target hit).
  - Handles 1x1 tokens correctly (single cell check).
  - String key format `${x},${y}` is safe for integer grid coordinates.
- **Status:** CORRECT

### 2. Close Blast Edge Origin for Multi-Cell Attackers (`getBlastEdgeOrigin`)

- **Rule:** Close Blast originates "adjacent to the user" (PTU Core Chapter 7). For multi-cell attackers, the blast should originate from the edge of the attacker's footprint in the blast direction, so the blast square is placed adjacent to the correct face.
- **Implementation:** `getBlastEdgeOrigin()` in `app/composables/useRangeParser.ts` (lines 563-576). Returns the corner cell of the footprint closest to the blast direction. For positive direction components, uses `position + size - 1` (far edge); for zero or negative, uses `position` (near edge).
- **Analysis:**
  - **North (dx=0, dy=-1):** Returns `(x, y)` -- top-left corner. Blast starts at `(x, y-1)`. For a 2x2 token at (3,3), blast covers (3,2),(4,2),(3,1),(4,1). Correctly adjacent to the north face.
  - **East (dx=1, dy=0):** Returns `(x+size-1, y)` -- top-right corner. Blast starts at `(x+size, y)`. Correctly adjacent to the east face.
  - **Southwest (dx=-1, dy=-1):** Returns `(x, y)` -- top-left corner. Blast starts at `(x-1, y-1)`. Correctly adjacent to the southwest corner.
  - All 8 directions produce correct edge origins for blast placement.
  - Note: This function is not yet wired into `getAffectedCells()` -- it is provided as infrastructure for when Close Blast is used by multi-cell attackers. The existing blast placement code uses `origin.x + direction.dx` which for a 1x1 token is the same. Integration will be needed when multi-cell attackers actually use Close Blast, but the function itself is correct.
- **Status:** CORRECT

### 3. Flanking Geometry for Large Tokens (`isFlankingTarget`)

- **Rule:** "A Small or Medium sized Trainer or Pokemon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other. For Large Trainers and Pokemon, the requirement is three foes meeting those conditions. The requirement increases to four for Huge and five for Gigantic sized combatants. Foes larger than Medium may occupy multiple squares -- in this case, they count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying. However, a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone." (PTU Core Chapter 7, p.232)
- **Implementation:** `isFlankingTarget()` in `app/composables/useRangeParser.ts` (lines 483-516). Uses an angle-based approach: calculates the angle from the target's center to each attacker's closest cell, and checks if the angle difference is >= 135 degrees (3*PI/4).
- **Analysis:** The implementation diverges significantly from PTU RAW:
  1. **PTU flanking is NOT a 2-attacker opposite-side check.** The PTU rule requires a SIZE-DEPENDENT number of adjacent foes: 2 for Small/Medium, 3 for Large, 4 for Huge, 5 for Gigantic. The function signature takes exactly two attackers and returns a boolean, which cannot express the "3+ foes required for Large" rule.
  2. **The "not adjacent to each other" requirement is missing.** PTU requires that the flanking foes be "adjacent to [the target] but not adjacent to each other." The angle check does not verify this condition.
  3. **Multi-cell attackers count as multiple foes.** A Large attacker adjacent to a target counts as N foes where N = number of squares it occupies adjacent to the target. The function does not compute this.
  4. **Single-combatant flanking prevention is missing.** PTU explicitly states "a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying." This is handled by requiring two different attackers in the signature, but the multi-foe counting logic is absent.
  - The spec itself notes: "Flanking is not currently implemented in the app's combat system (it would be part of a future accuracy modifier feature). This function is provided as the specification for when flanking is implemented." This makes it speculative/forward-looking code. However, when flanking IS implemented using this function, it will produce incorrect results for any target larger than Small/Medium, and will also produce incorrect results for 1x1 targets when flankers are adjacent to each other.
- **Status:** INCORRECT (see HIGH-1)

### 4. PTU Alternating Diagonal Distance for Token Bounding Boxes (`ptuDistanceTokensBBox`)

- **Rule:** Per decree-002, all grid distances use the PTU alternating diagonal rule (1-2-1-2). Range is measured from the nearest occupied cell of one token to the nearest occupied cell of the other.
- **Implementation:** `ptuDistanceTokensBBox()` in `app/utils/gridDistance.ts` (lines 47-60). Computes the axis-aligned gap between two token bounding boxes (max of 0, left-gap, right-gap for each axis), then applies `ptuDiagonalDistance()` to the gap.
- **Analysis:**
  - The gap calculation correctly computes the minimum cell-edge-to-cell-edge distance in each axis.
  - When tokens overlap (gap = 0 on both axes), returns 0. Correct.
  - When tokens are adjacent (gap = 1 on one axis, 0 on other), returns 1. Correct.
  - When tokens are separated diagonally (gap > 0 on both axes), applies the alternating diagonal rule. Correct per decree-002.
  - This is mathematically equivalent to the brute-force `closestCellPair` + `ptuDiagonalDistance` approach used previously in `ptuDistanceTokens`, but O(1) instead of O(n*m). The extraction from `useRangeParser.ts` is a clean refactor that enables sharing with the measurement store.
  - The `ptuDistanceTokens()` function in `useRangeParser.ts` now delegates to this utility. No behavior change.
- **Status:** CORRECT

### 5. Edge-to-Edge Distance in Measurement Store

- **Rule:** Per decree-002 and PTU p.231, distance between multi-cell tokens should be measured from the nearest edge, not from the origin cell. The `ptuDistanceTokensBBox` function computes this correctly.
- **Implementation:** The measurement store (`app/stores/measurement.ts`) now tracks token metadata at both endpoints:
  - `startTokenOrigin` / `startTokenSize`: footprint info at the measurement start
  - `endTokenOrigin` / `endTokenSize`: footprint info at the measurement end
  - The `distance` getter (lines 47-70) checks if either endpoint has a multi-cell token (size > 1 AND origin not null), and if so, uses `ptuDistanceTokensBBox()` for edge-to-edge distance. Falls back to `ptuDiagonalDistance()` for single-cell tokens.
- **Analysis:**
  - Correctly constructs footprints using `startTokenOrigin ?? startPosition` -- when no token is present, the clicked position is used as a size-1 token.
  - The fallback path (`ptuDiagonalDistance`) is only taken when both endpoints are size-1 tokens, which is the existing behavior. No regression.
  - `startMeasurement()` and `updateMeasurement()` properly accept optional token metadata and default to size 1.
  - `clearMeasurement()` resets all token metadata.
  - Token metadata is passed from both `useGridInteraction.ts` (lines 168-173, 314-319) and `useIsometricInteraction.ts` (lines 320-325, 467-473) via `getTokenAtPosition()` / `getTokenAtGridPosition()` lookups on mouse events.
- **Status:** CORRECT

### 6. Multi-Cell Token Footprint Highlighting in AoE Overlay

- **Rule:** When an AoE hits a multi-cell target (any cell overlap), the visual overlay should indicate the full footprint is affected.
- **Implementation:** `drawMeasurementOverlay()` in `app/composables/useGridRendering.ts` (lines 290-307). After drawing AoE-affected cells, filters tokens with `size > 1` using `isTargetHitByAoE()`, then draws a dashed white rectangle around the full NxN footprint of each hit token.
- **Analysis:**
  - Only runs for non-distance measurement modes (burst/cone/line/blast). Correct -- distance measurement doesn't have AoE cells.
  - Uses `isTargetHitByAoE()` for the check (verified correct above).
  - Draws dashed outline at `token.position * cellSize` with `token.size * cellSize` dimensions. Correct for top-left anchor convention.
  - Does not highlight 1x1 tokens (they are already fully covered by the AoE cell highlight). Appropriate optimization.
  - Uses `ctx.setLineDash([])` to reset after drawing. Correct cleanup.
- **Status:** CORRECT

### 7. Multi-Cell Token Visual Indicators in Distance Measurement

- **Rule:** When measuring distance to/from a multi-cell token, the visual line should connect token centers, and dashed outlines should indicate the full footprints.
- **Implementation:** `drawMeasurementOverlay()` in `app/composables/useGridRendering.ts` (lines 309-373). Calculates origin center using `(startTokenOrigin ?? origin).x * cellSize + (startTokenSize * cellSize) / 2`. Draws dashed outlines around multi-cell start/end tokens.
- **Analysis:**
  - Origin center calculation accounts for multi-cell footprint by using `startTokenSize * cellSize / 2` for the center offset. Correct for any NxN footprint.
  - End center calculation mirrors the start center logic. Consistent.
  - Dashed outlines only drawn when `startTokenSize > 1` or `endTokenSize > 1` AND the token origin is present. Correct guard.
  - The distance line connects token centers (not cell centers), which is visually appropriate for showing measurement direction.
- **Status:** CORRECT

## Issues

### HIGH-1: `isFlankingTarget` Does Not Implement PTU Flanking Rules

**File:** `app/composables/useRangeParser.ts`, lines 483-516
**Mechanic:** Flanking (PTU Core Chapter 7, p.232)

The function implements a simplified "two attackers on opposite sides" check using angle-based geometry. PTU RAW defines flanking as:

1. A **size-dependent number** of adjacent foes required (2/Small+Med, 3/Large, 4/Huge, 5/Gigantic)
2. The flanking foes must be **"adjacent to [the target] but not adjacent to each other"**
3. Multi-cell attackers **count as multiple foes** based on how many of their cells are adjacent to the target
4. A **single combatant cannot flank** by itself regardless of size

The current implementation:
- Only checks two attackers (cannot express 3/4/5-foe requirements)
- Does not check the "not adjacent to each other" condition
- Does not count multi-cell attackers as multiple foes
- Uses an angle threshold (135 degrees) that has no basis in PTU RAW

**Impact:** When flanking IS integrated into combat, this function will produce incorrect results. A 2-foe check on a Large target (which requires 3 foes per PTU) would incorrectly report flanking. Two adjacent attackers would incorrectly report flanking (if they happen to be on "opposite" sides). The function signature itself is too narrow to support the real rule.

**Severity:** HIGH. The function is speculative (flanking is not yet used in combat), but its JSDoc comments claim it "Checks if two attackers flank a multi-cell target" per "PTU p.232" -- this is a misleading characterization of the PTU rule. If shipped as-is, future developers may rely on it without reading the actual PTU text.

**Required Change:** Either:
- (a) Redesign the function to accept a list of all adjacent foes and the target's size, implementing the full PTU flanking rule; or
- (b) Add prominent JSDoc warnings that this is a SIMPLIFIED/NON-PTU check for basic "opposite sides" detection only, and rename the function to something like `areOnOppositeSides()` to avoid confusion with PTU flanking rules; or
- (c) Remove the function entirely and defer to when flanking is actually implemented (preferred -- speculative code that misrepresents the rule it claims to implement is worse than no code).

### MED-1: `getBlastEdgeOrigin` Not Integrated into AoE Resolution

**File:** `app/composables/useRangeParser.ts`, lines 563-576
**Mechanic:** Close Blast origin for multi-cell attackers

The function is correct in isolation, but it is not wired into `getAffectedCells()` or any other combat resolution path. The existing Close Blast code in `getAffectedCells()` (lines 409-421) uses `origin.x + direction.dx` directly, which works for 1x1 attackers but would place the blast incorrectly for multi-cell attackers.

The `getBlastEdgeOrigin` function exists as infrastructure, but without integration:
- A GM using Close Blast from a 2x2 attacker will get the blast placed relative to the origin cell (top-left corner), not the nearest edge cell in the blast direction
- The function is exported and available but never called

**Severity:** MEDIUM. Multi-cell attackers using Close Blast is an edge case (most Large+ Pokemon use non-blast moves), and the GM can manually adjust placement. But the gap between "function exists" and "function is used" should be documented or the integration should be completed.

## Decree Compliance

| Decree | Status |
|--------|--------|
| decree-002 (PTU diagonal for all distances) | COMPLIANT. `ptuDistanceTokensBBox` uses `ptuDiagonalDistance`. Measurement store uses `ptuDistanceTokensBBox` for edge-to-edge distance. |
| decree-003 (tokens passable, enemy = rough terrain) | NOT APPLICABLE to these changes. |
| decree-007 (cone 3m-wide rows) | NOT APPLICABLE (no cone changes in P2). |
| decree-023 (burst uses PTU diagonal) | NOT APPLICABLE (no burst changes in P2). |
| decree-024 (diagonal cone includes corner cell) | NOT APPLICABLE (no cone changes in P2). |

## Summary

P2 implements five of six planned features correctly:

1. **AoE hit detection** (`isTargetHitByAoE`): Correctly checks footprint-to-AoE overlap. CORRECT.
2. **Close Blast edge origin** (`getBlastEdgeOrigin`): Correct algorithm but not integrated into combat resolution. MEDIUM concern.
3. **Flanking geometry** (`isFlankingTarget`): Does NOT implement PTU flanking rules. Uses a simplified angle-based approach that diverges from the size-dependent, adjacency-based PTU definition. HIGH concern.
4. **Distance utility extraction** (`ptuDistanceTokensBBox`): Clean O(1) refactor, mathematically equivalent to brute-force approach. CORRECT.
5. **Measurement store edge-to-edge** (measurement.ts + interaction composables): Correctly passes token metadata and computes edge-to-edge distance for multi-cell tokens. CORRECT.
6. **Footprint highlight overlay** (useGridRendering.ts): Correctly highlights multi-cell tokens hit by AoE. CORRECT.

## Verdict

**CHANGES_REQUIRED**

The HIGH-1 issue (`isFlankingTarget` misrepresenting PTU flanking rules) must be addressed before approval. The function's JSDoc claims compliance with PTU p.232, but the implementation is fundamentally different from the actual rule. Recommended resolution: remove the function (option c) and defer to a proper flanking implementation, since the function is speculative and not called anywhere.

MED-1 (unintegrated `getBlastEdgeOrigin`) is acceptable as infrastructure for future use, but should be documented as such.

## Required Changes

1. **[HIGH-1]** Address `isFlankingTarget` -- either remove (preferred), redesign to match PTU RAW, or add disclaimers and rename to avoid PTU misattribution.
2. **[MED-1]** (Optional) Add a TODO comment or JSDoc note on `getBlastEdgeOrigin` indicating it needs to be wired into `getAffectedCells` when multi-cell Close Blast is supported.
