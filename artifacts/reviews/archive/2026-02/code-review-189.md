---
review_id: code-review-189
review_type: code
reviewer: senior-reviewer
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
files_reviewed:
  - app/utils/combatSides.ts
  - app/utils/gridDistance.ts
  - app/composables/useGridMovement.ts
  - app/composables/useMoveCalculation.ts
  - app/composables/useRangeParser.ts
  - app/composables/useGridRendering.ts
  - app/composables/useGridInteraction.ts
  - app/components/encounter/MoveTargetModal.vue
  - app/components/encounter/GMActionModal.vue
  - app/components/vtt/GridCanvas.vue
  - app/components/vtt/IsometricCanvas.vue
  - app/stores/measurement.ts
  - app/tests/unit/utils/gridDistance.test.ts
  - app/tests/unit/utils/combatSides.test.ts
  - app/tests/unit/composables/useRangeParser.test.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-02-27T08:30:00Z
follows_up: code-review-183
---

## Review Scope

Re-review of the fix cycle for code-review-183 CHANGES_REQUIRED (1 CRIT, 3 HIGH, 3 MED). The fix cycle comprises 8 commits (0e02963..77da09b) addressing VTT range measurement, token passability, cone/line/burst shapes, and enemy-occupied rough terrain.

Decrees verified: decree-002 (PTU diagonal for range), decree-003 (tokens passable, enemy = rough terrain), decree-007 (fixed 3-wide cone rows), decree-009 (diagonal line shortening), decree-023 (burst uses PTU diagonal), decree-024 (diagonal cone diamond pattern).

## Issue Resolution Verification

### CRIT-1: enemyOccupiedCells iterates targets, not all combatants -- RESOLVED

**Commit:** fe42861

The `useMoveCalculation` composable now accepts an optional `allCombatants` parameter (line 35). A `combatantsOnGrid` computed (line 110-112) uses `allCombatants` when provided, falling back to `targets`. The `enemyOccupiedCells` computed (line 118) iterates `combatantsOnGrid.value` instead of `targets.value`.

In `MoveTargetModal.vue` (line 288), the composable is called with `targetsRef` as both parameters. This is correct because `GMActionModal.vue` (line 164) passes `allCombatants` as the `:targets` prop -- so the `targets` ref already contains all combatants on the grid, not a filtered subset.

The design is future-proof: if a new caller passes a filtered target list, it can separately provide all combatants via the fourth parameter.

Both composables (`useGridMovement.ts` line 338, `useMoveCalculation.ts` line 121) now use the shared `isEnemySide` utility from `combatSides.ts`.

**Verification:** Read `useMoveCalculation.ts` lines 105-133, `MoveTargetModal.vue` line 288, `GMActionModal.vue` lines 164 and 179.

### HIGH-1: Multi-cell no-stacking check -- RESOLVED

**Commit:** 0f6daa8

The `isValidMove` function in `useGridMovement.ts` (lines 469-487) now:
1. Looks up the moving token's size (line 470-471)
2. Builds an `occupiedSet` from all other tokens' cells using string keys (line 479)
3. Iterates all `tokenSize * tokenSize` cells the moving token would occupy at the destination (lines 481-487)
4. Any overlap sets `isOccupied = true`

The bounds check also accounts for token size (line 473-474): `toPos.x + tokenSize - 1 < gridWidth`.

**Verification:** Read `useGridMovement.ts` lines 462-496.

### HIGH-2: Duplicate enemy-determination logic -- RESOLVED

**Commits:** 0e02963 (extract), fe42861 (adopt)

A shared `isEnemySide(sideA, sideB)` utility was extracted to `app/utils/combatSides.ts`. The function correctly handles the three-sided combat model: same side = not enemy, players/allies friendly to each other, enemies hostile to both.

Both `useGridMovement.ts` (line 338) and `useMoveCalculation.ts` (line 121) now import and use `isEnemySide` from `combatSides.ts`. No duplicate enemy-determination logic remains.

Unit tests in `combatSides.test.ts` cover all four cases: same-side, players-allies, enemies-vs-players, enemies-vs-allies.

**Verification:** Grep for `isEnemySide` across the app -- only the utility definition and two call sites remain.

### HIGH-3: Burst shapes use Chebyshev instead of PTU diagonal -- RESOLVED

**Commit:** 8439a74

Both burst implementations now use `ptuDiagonalDistance(dx, dy) <= radius`:
- `measurement.ts` `getBurstCells` (lines 187-196): replaced `Math.max(Math.abs(dx), Math.abs(dy))` with `ptuDiagonalDistance(dx, dy)`. Comment updated to reference decree-002 and decree-023.
- `useRangeParser.ts` `getAffectedCells` burst case (lines 377-387): same replacement.

The misleading "Use Chebyshev distance for PTU" comment is gone. Both locations now read: "Per decree-002 and decree-023: all distance uses PTU alternating diagonal."

Shape correctness verified mathematically:
- Burst 1: 9 cells (ptuDiag(1,1) = 1 <= 1, so first diagonals included -- same as Chebyshev for r=1)
- Burst 2: 21 cells (excludes 4 far corners where ptuDiag(2,2) = 3 > 2)

Test coverage added for both Burst 1 and Burst 2 with specific cell inclusion/exclusion checks.

**Verification:** Read `measurement.ts` lines 184-199, `useRangeParser.ts` lines 376-387, test lines 521-567.

### MED-1: Multi-cell token rough terrain LoS uses anchor instead of closestCellPair -- RESOLVED

**Commit:** 19d20d6

The `targetsThroughEnemyRoughTerrain` function in `useMoveCalculation.ts` (lines 170-175) now calls `closestCellPair()` to get the actual LoS endpoints for multi-cell tokens, instead of using anchor (top-left) positions. The Bresenham trace uses `closestFrom` and `closestTo` as endpoints (lines 176-179).

Actor and target cell exclusion sets are still built from the full footprint (lines 156-168), so intermediate cells are correctly identified.

**Verification:** Read `useMoveCalculation.ts` lines 146-209.

### MED-2: Missing unit tests for cone, line, burst, and combat utilities -- RESOLVED

**Commit:** 77da09b (and a42fca6 for cone tests)

Tests added in three files:

1. **`gridDistance.test.ts`**: 13 test cases covering `ptuDiagonalDistance` (same position, cardinal, alternating diagonal, mixed, negative) and `maxDiagonalCells` (budget 0-8 with known expected values).

2. **`combatSides.test.ts`**: 4 test cases covering `isEnemySide` for same-side, players-allies, enemies-vs-players, enemies-vs-allies.

3. **`useRangeParser.test.ts`**: New describe blocks:
   - `getAffectedCells - cone shapes (decree-007)`: 4 tests (cardinal Cone 2 count + cells, diagonal Cone 2 count per decree-024, Cone 1 single cell, cardinal Cone 4 fixed-width rows)
   - `getAffectedCells - diagonal line shortening (decree-009)`: 4 tests (cardinal not shortened, diagonal Line 4 = 3 cells, diagonal Line 6 = 4 cells, diagonal Line 2 = 1 cell)
   - `getAffectedCells - burst shapes (decree-023)`: 4 tests (Burst 1 = 9, Burst 2 = 21, far corners excluded, near-diagonal cells included)
   - `getOccupiedCells`: 3 tests (1x1, 2x2, 3x3 tokens)
   - `closestCellPair`: 3 tests (1x1 pair, multi-cell pair, adjacent tokens)

Coverage is thorough with both positive and negative discriminator tests.

**Verification:** Read all three test files.

### MED-3: Dead getBlockedCells function and callers -- RESOLVED

**Commit:** 6b86a36

The `getBlockedCells` function has been completely removed from `useGridMovement.ts`. It is no longer in the return object and no longer exists in the file.

All callers updated:
- `useGridRendering.ts`: Creates empty `const blocked: GridPosition[] = []` directly (lines 381, 526)
- `useGridInteraction.ts`: Interface no longer declares `getBlockedCells` (verified interface at lines 17-38)
- `GridCanvas.vue`: No `getBlockedCells` references remain (verified via grep)
- `IsometricCanvas.vue`: Creates empty `const blockedCells: GridPosition[] = []` directly (line 138)

Each call site has a comment explaining why: "Per decree-003: tokens never block movement."

**Verification:** Grep for `getBlockedCells` across the entire app directory returns zero results.

## Issues

### MEDIUM

#### MED-1 (pre-existing): `useMoveCalculation.ts` is 801 lines, exceeding 800-line max

**File:** `app/composables/useMoveCalculation.ts` (801 lines)

The project coding style rule specifies a maximum of 800 lines per file. This file is 1 line over. However, this is a pre-existing condition -- the fix cycle had a net change of +0 lines (29 insertions, 29 deletions). The file was already at 801 lines before this fix cycle began.

The file is well-organized with clear section headers (Range & LoS, Enemy-Occupied Rough Terrain, STAB, Accuracy, Damage, Target Selection, Confirmation) and the logic is cohesive -- it all relates to move calculation during combat. Splitting it further would fragment the move calculation domain.

**Recommendation:** Not blocking for this fix cycle since it's pre-existing. File a ticket to extract one section (e.g., the damage calculation block at lines 494-665 could become a separate composable `useDamageApplication`). This would bring the file well under 800 lines.

## What Looks Good

1. **Clean DRY extraction of `isEnemySide`.** The utility is minimal (31 lines), well-documented, and unit-tested. Both consumers import from the same source. The `CombatSide` type import ensures type safety. The three-sided combat model (players + allies vs enemies) is correctly encoded.

2. **Multi-cell stacking check is thorough.** The implementation builds a Set for O(1) lookup (line 479), checks all `tokenSize * tokenSize` cells (lines 481-487), and short-circuits on first collision (`&& !isOccupied`). The bounds check also accounts for token size. This correctly handles 2x2, 3x3, and 4x4 tokens.

3. **`combatantsOnGrid` computed is a good abstraction.** By providing a fallback from `allCombatants` to `targets`, the composable works correctly in both the current single-caller scenario (where targets = all combatants) and future scenarios where targets might be filtered. The computed is reactive, so changes to either ref propagate correctly.

4. **Burst shape consistency.** Both `measurement.ts` and `useRangeParser.ts` produce identical burst shapes using the same `ptuDiagonalDistance` function. The shared utility ensures they cannot diverge. The test discriminator (Burst 2 = 21 cells, not 25) clearly validates the change from Chebyshev to PTU diagonal.

5. **Diagonal cone diamond pattern (decree-024) is correctly implemented.** The three-push-group approach (horizontal axis, vertical axis, diagonal corner) is identical in both `useRangeParser.ts` and `measurement.ts`. The deduplication filter handles overlapping cells from the three groups. Manual verification confirms: Cone 2 NE from (5,5) = 8 cells, matching the test expectation. Both implementations were updated together, eliminating the prior inconsistency.

6. **Dead code was fully removed, not just deprecated.** The `getBlockedCells` function, its interface declarations, and all callers were removed in a single clean commit (6b86a36). Each former call site was replaced with a local `const blocked: GridPosition[] = []` with a decree-003 reference. No remnant code or TODO comments were left behind.

7. **Test coverage is comprehensive.** The new tests are well-structured with descriptive names that reference decree numbers. Each AoE shape type has both positive (correct cell count/positions) and negative (excluded cells) test cases. The `maxDiagonalCells` tests cover edge cases (budget 0, exact-fit budget, over-budget). The `closestCellPair` tests cover 1x1, multi-cell, and adjacent token scenarios.

8. **Commit granularity is excellent.** Each of the 8 commits addresses exactly one issue from code-review-183. The order is logical: extract utility first (0e02963), then use it in fixes (fe42861), then address remaining issues in dependency order. The test commit (77da09b) is last, consolidating all test additions. Commit messages reference the specific issue being fixed (CRIT-1, HIGH-1, etc.).

9. **No remaining Chebyshev distance in gameplay measurements.** A search for Chebyshev usage confirms only non-gameplay uses remain: terrain brush shape (GM painting tool), fog of war reveal radius (GM tool), and A* heuristic (admissible by design since ptuDiag >= Chebyshev). All gameplay distance measurements now use `ptuDiagonalDistance`.

10. **`closestCellPair` usage is consistent.** Both LoS checking (`isInRange` line 357) and rough terrain tracing (`targetsThroughEnemyRoughTerrain` line 172) now use the same `closestCellPair` function to determine endpoints. This ensures the rough terrain penalty check traces the same path as the LoS check.

## Verdict

**APPROVED**

All 7 issues from code-review-183 have been properly resolved:
- CRIT-1 (enemy cells from targets only): Fixed with `allCombatants` param and `combatantsOnGrid` computed
- HIGH-1 (anchor-only stacking): Fixed with full footprint iteration
- HIGH-2 (duplicate enemy logic): Fixed with shared `isEnemySide` utility
- HIGH-3 (burst Chebyshev): Fixed with `ptuDiagonalDistance`, backed by decree-023
- MED-1 (multi-cell LoS): Fixed with `closestCellPair`
- MED-2 (missing tests): 28 new test cases across 3 files
- MED-3 (dead code): `getBlockedCells` fully removed from codebase

One pre-existing MEDIUM noted (801-line file) -- not introduced by this fix cycle and not blocking.

No new bugs, no decree violations, no regressions identified. The fixes are correct, well-tested, and consistent with all applicable decrees.

## Required Changes

None. The one MEDIUM (pre-existing file size) should be tracked as a separate ticket.
