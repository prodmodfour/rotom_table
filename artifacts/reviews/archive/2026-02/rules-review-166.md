---
review_id: rules-review-166
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-096+097+100+102+113
domain: vtt-grid
commits_reviewed:
  - 0e02963
  - fe42861
  - 0f6daa8
  - 8439a74
  - 19d20d6
  - 6b86a36
  - a42fca6
  - 77da09b
mechanics_verified:
  - ptu-diagonal-distance
  - range-measurement
  - token-passability
  - enemy-rough-terrain
  - cone-shape
  - diagonal-line-shortening
  - burst-shape
  - combat-side-determination
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Diagonal-Movement (p.425-428)
  - core/07-combat.md#Rough-Terrain (p.476-485)
  - core/10-indices-and-reference.md#Range-Keywords (p.343-344)
reviewed_at: 2026-02-27T14:00:00Z
follows_up: rules-review-160
---

## Mechanics Verified

### 1. PTU Alternating Diagonal Distance (decree-002, ptu-rule-096)

- **Rule:** "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again." (`core/07-combat.md`, p.425-428)
- **Implementation:** `ptuDiagonalDistance(dx, dy)` in `app/utils/gridDistance.ts` uses closed-form formula: `diagonals + floor(diagonals/2) + straights` where `diagonals = min(|dx|, |dy|)` and `straights = ||dx| - |dy||`.
- **Verification:** Manual trace confirms correctness:
  - (1,1) = 1+0+0 = 1 (first diagonal costs 1m)
  - (2,2) = 2+1+0 = 3 (1+2=3m)
  - (3,3) = 3+1+0 = 4 (1+2+1=4m)
  - (5,5) = 5+2+0 = 7 (1+2+1+2+1=7m)
  - (3,1) = 1+0+2 = 3 (1 diag + 2 straight)
- **Used in:** `useRangeParser.ts` (range checking via `ptuDistanceTokens`), `measurement.ts` (distance getter), `useGridMovement.ts` (movement distance), `useRangeParser.ts` (burst containment).
- **Status:** CORRECT

### 2. Range Measurement with PTU Diagonal (decree-002, ptu-rule-096)

- **Rule:** Per decree-002: "All grid distance measurements (movement, range, area effects) use PTU's alternating diagonal rule. No Chebyshev distance in the app."
- **Implementation:** `ptuDistanceTokens()` calculates the gap between two token bounding boxes, then applies `ptuDiagonalDistance()`. All three call sites in `useRangeParser.ts` (`ptuDistanceTokens`, `closestCellPair`, `isInRange`) use this function. The measurement store's distance getter uses `ptuDiagonalDistance` directly.
- **Verification:** No Chebyshev distance (`Math.max(|dx|, |dy|)`) remains anywhere in the range or measurement code. Confirmed via grep.
- **Status:** CORRECT

### 3. Token Passability and No-Stacking (decree-003, ptu-rule-097)

- **Rule:** Per decree-003 (PTU p.231): "All tokens are passable; enemy-occupied squares count as rough terrain. Movement can pass through any occupied square. Cannot end movement on an occupied square."
- **Implementation:**
  - `getBlockedCells()` has been fully removed from `useGridMovement.ts` and all callers (6b86a36). No token blocks movement.
  - `getOccupiedCells(excludeCombatantId)` returns all cells occupied by other tokens, used in the no-stacking destination check.
  - `isValidMove()` checks ALL cells the moving token would occupy at the destination against occupied cells, using a Set for O(1) lookup (fix for HIGH-1).
  - Multi-cell tokens (2x2, 3x3) have their full footprint checked: iterates `dx` from 0 to `tokenSize-1`, `dy` from 0 to `tokenSize-1`.
  - Bounds check also accounts for token size: `toPos.x + tokenSize - 1 < gridWidth`.
  - Callers in `useGridRendering.ts`, `IsometricCanvas.vue`, and `calculateTerrainAwarePathCost` all pass empty `blockedCells` arrays with decree-003 reference comments.
- **Status:** CORRECT

### 4. Enemy-Occupied Rough Terrain Accuracy Penalty (decree-003, ptu-rule-097)

- **Rule:** PTU p.476-485: "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Squares occupied by enemies always count as Rough Terrain."
- **Implementation:**
  - `enemyOccupiedCells` in `useMoveCalculation.ts` iterates `combatantsOnGrid` (all combatants, not just targets) to find enemy cells. Uses `isEnemySide()` from shared utility.
  - CRIT-1 fix verified: `combatantsOnGrid` computed uses `allCombatants?.value ?? targets.value`. In `MoveTargetModal.vue`, the `allCombatants` parameter receives `targetsRef`, which is `props.targets`, which receives `allCombatants` from `GMActionModal.vue` (line 164), which passes `encounter.combatants` (the full combatant list, confirmed from `pages/gm/index.vue` line 128).
  - Multi-cell enemy tokens have all occupied cells added to the set (loops through `dx`/`dy` for `tokenSize`).
  - `targetsThroughEnemyRoughTerrain()` uses Bresenham line from closest cell pair (MED-1 fix) to trace LoS between attacker and target, checking intermediate cells against `enemyOccupiedCells`. Actor's own cells and target's own cells are excluded from the check.
  - `getRoughTerrainPenalty()` returns 2 (flat, not cumulative per cell). Added to accuracy threshold in `getAccuracyThreshold()` as `+ roughPenalty`, making the target harder to hit. This correctly implements "-2 penalty to Accuracy Rolls."
- **Status:** CORRECT

### 5. Cone Shape - Fixed 3m-Wide Rows (decree-007, ptu-rule-100)

- **Rule:** PTU p.343: "Cone X -- The Move hits all legal targets in the square immediately in front of the user and in 3m wide rows extending from that square up to X meters away." Per decree-007: "d=1 is 1 cell (center only), d=2+ is 3 cells wide."
- **Implementation:** Both `useRangeParser.ts` (`getAffectedCells` cone case) and `measurement.ts` (`getConeCells`) use `halfWidth = d === 1 ? 0 : 1` to produce 1 cell at d=1 and 3 cells at d=2+.
  - Cardinal cones: perpendicular expansion along the non-moving axis.
  - Diagonal cones: three push groups (horizontal, vertical, diagonal corner) per decree-024.
- **Verification (cardinal Cone 2, direction north from (5,5)):**
  - d=1: (5,4) -- 1 cell
  - d=2: (4,3), (5,3), (6,3) -- 3 cells
  - Total: 4 cells. Matches test assertion and PTU description.
- **Verification (diagonal Cone 2, direction northeast from (5,5)):**
  - d=1: (6,4) -- 1 cell (tip)
  - d=2: base = (7,3), halfWidth=1. Three push groups produce 7 unique cells. With tip: 8 total.
  - Per decree-024, the diagonal corner cell is included (diamond pattern).
- **Both `useRangeParser.ts` and `measurement.ts` produce identical cell sets** for all directions. Verified by reading both implementations -- they use the same algorithm.
- **Status:** CORRECT

### 6. Diagonal Line Shortening (decree-009, ptu-rule-102)

- **Rule:** PTU p.343-344: "Line X -- The Move creates a line X meters long starting from the user and hits all legal targets in that line. When used diagonally, apply the same rules as for diagonal movement." Per decree-009: diagonal lines cover fewer cells because each diagonal step costs alternating 1-2m.
- **Implementation:** `maxDiagonalCells(budget)` in `gridDistance.ts` iteratively steps through the alternating 1-2 cost sequence until the budget is exhausted. Both `useRangeParser.ts` (line case) and `measurement.ts` (`getLineAttackCells`) use `isDiagonal ? maxDiagonalCells(size) : size`.
- **Verification:**
  - Line 2 diagonal: maxDiagonalCells(2) = 1 cell (step 1=1m, step 2 would cost 2m totaling 3m > 2m)
  - Line 4 diagonal: maxDiagonalCells(4) = 3 cells (1+2+1=4m)
  - Line 6 diagonal: maxDiagonalCells(6) = 4 cells (1+2+1+2=6m)
  - Cardinal lines: always `size` cells (1m per cell)
  - All values confirmed correct against manual calculation.
- **Status:** CORRECT

### 7. Burst Shape with PTU Diagonal (decree-023, ptu-rule-113)

- **Rule:** Per decree-023: "Burst shapes use PTU alternating diagonal distance, consistent with decree-002. Burst N includes all cells whose PTU alternating diagonal distance from the center is <= N."
- **Implementation:** Both `useRangeParser.ts` (burst case in `getAffectedCells`) and `measurement.ts` (`getBurstCells`) now use `ptuDiagonalDistance(dx, dy) <= size` instead of the old Chebyshev `Math.max(|dx|, |dy|) <= size`.
- **Verification:**
  - Burst 1: ptuDiag(1,1) = 1 <= 1, so all 8 neighbors included. Total: 9 cells (same as Chebyshev for radius 1).
  - Burst 2: ptuDiag(2,2) = 3 > 2, so the 4 far-diagonal corners are excluded. ptuDiag(2,1) = 2 <= 2, included. Total: 25 - 4 = 21 cells.
  - Old Chebyshev comment ("Use Chebyshev distance for PTU") has been removed and replaced with decree-002/decree-023 citations.
- **Status:** CORRECT

### 8. Combat Side Determination (shared utility)

- **Rule:** PTU three-sided combat: players and allies are friendly to each other; enemies oppose both.
- **Implementation:** `isEnemySide(sideA, sideB)` in `app/utils/combatSides.ts`. Returns false for same-side and players/allies pairs; true for any other combination (enemies vs players, enemies vs allies).
- **Verification:** All 6 pair combinations tested in `combatSides.test.ts`: same-side (false), players-allies (false, bidirectional), enemies-players (true, bidirectional), enemies-allies (true, bidirectional).
- **Used by:** `useGridMovement.ts` (`getEnemyOccupiedCells`), `useMoveCalculation.ts` (`enemyOccupiedCells`). Both previously had duplicated inline logic (HIGH-2). Now use the shared utility.
- **Status:** CORRECT

## Prior Review Issue Resolution

All 7 issues from code-review-183 (CHANGES_REQUIRED) have been addressed:

| Issue | Severity | Resolution | Commit | Verified |
|-------|----------|------------|--------|----------|
| CRIT-1: enemyOccupiedCells targets-only | CRITICAL | Added `allCombatants` param, `combatantsOnGrid` computed. Parent passes full combatant list. | fe42861 | YES |
| HIGH-1: Anchor-only no-stacking check | HIGH | Full footprint check: iterates tokenSize*tokenSize cells at destination. | 0f6daa8 | YES |
| HIGH-2: Duplicate enemy logic | HIGH | Extracted `isEnemySide()` to `utils/combatSides.ts`, both callers updated. | 0e02963, fe42861 | YES |
| HIGH-3: Burst uses Chebyshev | HIGH | Replaced with `ptuDiagonalDistance()` per decree-023. Old comment removed. | 8439a74 | YES |
| MED-1: Anchor-based rough terrain LoS | MEDIUM | Uses `closestCellPair()` for multi-cell token Bresenham endpoints. | 19d20d6 | YES |
| MED-2: Missing tests | MEDIUM | Added tests for cone, line, burst shapes, `isEnemySide`, `getOccupiedCells`, `closestCellPair`, `ptuDiagonalDistance`, `maxDiagonalCells`. | 77da09b | YES |
| MED-3: Dead getBlockedCells | MEDIUM | Function and all callers removed entirely. Interface types cleaned. | 6b86a36 | YES |

## Decree Compliance

| Decree | Status | Notes |
|--------|--------|-------|
| decree-002 | COMPLIANT | All range/distance uses `ptuDiagonalDistance`. No Chebyshev remains. |
| decree-003 | COMPLIANT | Tokens passable. Enemy cells = rough terrain (-2 accuracy). No stacking. |
| decree-007 | COMPLIANT | Cone shapes: d=1 = 1 cell, d=2+ = 3 cells wide. |
| decree-009 | COMPLIANT | Diagonal lines shortened via `maxDiagonalCells()`. |
| decree-023 | COMPLIANT | Burst shapes use PTU diagonal distance, not Chebyshev. |
| decree-024 | COMPLIANT | Diagonal cones include corner cell (diamond pattern). |

## Test Coverage Assessment

The fix cycle added comprehensive unit tests in commit 77da09b:

- **`gridDistance.test.ts`** (73 lines): `ptuDiagonalDistance` (5 scenarios: zero, cardinal, diagonal, mixed, negative) and `maxDiagonalCells` (8 budget values covering edge cases).
- **`combatSides.test.ts`** (25 lines): All 6 side-pair combinations for `isEnemySide`.
- **`useRangeParser.test.ts`** (177 new lines): Cone shapes (cardinal/diagonal, Cone 1/2/4), diagonal line shortening (4 directions x 3 sizes), burst shapes (radius 1/2, corner exclusion, edge inclusion), `getOccupiedCells` (1x1, 2x2, 3x3), `closestCellPair` (1x1 pair, multi-cell, adjacent).

All tests verify the exact cell counts and positions that matter for PTU correctness. The burst test correctly verifies the Chebyshev/PTU discriminator (21 vs 25 cells for Burst 2). The cone test verifies the decree-007/024 shapes. The line test verifies decree-009 shortening values.

## Observations (Non-Blocking)

1. **Indentation inconsistency** in `useGridRendering.ts` line 526: `const blocked: GridPosition[] = []` is at 4-space indent inside a block that uses 6-space indent. Purely cosmetic; does not affect game logic. (Code quality -- outside this review's scope.)

2. **`combatantsOnGrid` fallback:** When `allCombatants` is not provided, the composable falls back to `targets.value`. Since `MoveTargetModal` is the only caller and always passes the full combatant list (via `GMActionModal`'s `allCombatants` prop which receives `encounter.combatants`), the fallback is never exercised. The defensive fallback is acceptable but future callers should be aware they need to pass all combatants for correct rough terrain behavior.

## Summary

All 8 commits in the fix cycle correctly implement PTU 1.05 rules as interpreted by the active decrees. The 7 issues from code-review-183 are fully resolved. No new PTU rule violations were introduced. The `ptuDiagonalDistance` formula is mathematically verified. Cone shapes, line shortening, burst shapes, token passability, and rough terrain accuracy penalties all match the rulebook text and decree rulings.

## Verdict

**APPROVED**

No required changes. All mechanics are correctly implemented per PTU 1.05 rules and active decrees. Test coverage is sufficient for the behavioral changes.
