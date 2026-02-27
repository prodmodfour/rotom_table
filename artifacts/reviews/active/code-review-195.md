---
review_id: code-review-195
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-108+093
domain: vtt-grid
commits_reviewed:
  - 0dd3605
  - 36571e9
  - 308f9ab
  - 95a99e6
files_reviewed:
  - app/composables/useMoveCalculation.ts
  - app/stores/terrain.ts (read-only, no changes)
  - app/tests/unit/composables/useMoveCalculation.test.ts
  - artifacts/tickets/open/ptu-rule/ptu-rule-108.md
  - artifacts/tickets/open/ptu-rule/ptu-rule-093.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-02-27T10:15:00+00:00
follows_up: null
---

## Review Scope

First review of two related PTU rule fixes implemented by slave-4 (plan-20260227-083657):

1. **ptu-rule-108** (P2) -- Static rough terrain painted via TerrainPainter did not apply -2 accuracy penalty. Fixed by adding `terrainStore.isRoughAt()` check to the Bresenham line-of-fire trace.
2. **ptu-rule-093** (P3) -- Rough terrain accuracy penalty not implemented for painted cells. Resolved as part of ptu-rule-108. Enemy-occupied rough terrain was already implemented.

Total: 2 source files changed (1 composable, 1 new test file), 2 ticket files updated, across 4 commits. Net +17 lines in composable, +338 lines in tests.

### Decree Compliance

- **decree-003** (all tokens passable, enemy-occupied = rough terrain): The fix preserves the existing `enemyOccupiedCells` check and correctly treats it as one of two rough terrain sources. The Bresenham trace still checks enemy cells first, then painted cells. Compliant.
- **decree-010** (multi-tag terrain, cells can be both rough and slow): The fix correctly uses `terrainStore.isRoughAt()` which reads the `flags.rough` boolean, not the base terrain type. This means water+rough, normal+rough, or any base type with the rough flag triggers the penalty. Slow-only terrain correctly does NOT trigger it. Compliant.

## Issues

### MEDIUM

#### M1: useMoveCalculation.ts is 808 lines (exceeds 800-line limit)

**File:** `app/composables/useMoveCalculation.ts` (808 lines)

The file was already 801 lines before this fix (pre-existing violation). This change added 7 net lines (17 added, 10 removed). While the developer did not introduce this violation, the file now sits further over the limit at 808 lines.

The rough terrain penalty section (lines 91-234) is a self-contained block of ~143 lines covering `enemyOccupiedCells`, `targetsThroughRoughTerrain`, and `getRoughTerrainPenalty`. This is a natural extraction candidate for a separate composable (e.g., `useRoughTerrainPenalty.ts`) that takes the `actor`, `targets`, `allCombatants`, and `terrainStore` as inputs and exposes `getRoughTerrainPenalty`.

**Action:** File a refactoring ticket to extract the rough terrain penalty subsystem. Not blocking this fix since it is a pre-existing issue.

#### M2: No test coverage for multi-cell token rough terrain penalty

**File:** `app/tests/unit/composables/useMoveCalculation.test.ts`

All 12 tests use `tokenSize: 1`. The Bresenham trace relies on `closestCellPair` to find the optimal trace endpoints for multi-cell tokens (line 173), and the actor/target cell exclusion sets iterate over `size x size` cells (lines 160-168). Neither code path is exercised with tokens larger than 1.

The `closestCellPair` mock (line 69) returns `a.position`/`b.position` directly, which is correct for size-1 but would be incorrect for larger tokens (should return the closest edge cells). This means the mock would hide bugs in multi-cell scenarios.

**Action:** Add at least one test with `tokenSize: 2` or `3` for both actor and target to verify the cell exclusion logic and Bresenham endpoints are correct. This is not blocking since the multi-cell behavior predates this fix and the `closestCellPair` is separately tested in its own composable.

## What Looks Good

### Correctness of the core fix (0dd3605)

The change is minimal and precisely targeted. The `targetsThroughRoughTerrain` function (renamed from `targetsThroughEnemyRoughTerrain`) now checks two sources of rough terrain in each intermediate cell:

1. `enemyOccupiedCells.value.has(key)` -- pre-existing, per decree-003
2. `terrainStore.isRoughAt(x0, y0)` -- new, per decree-010

The ordering is correct: enemy check first (computed set lookup, O(1)), then terrain store check (map lookup, O(1)). Both are efficient and the early-return pattern means the function short-circuits on the first rough cell found, which is correct since the penalty is flat -2 (not cumulative).

The function rename from `targetsThroughEnemyRoughTerrain` to `targetsThroughRoughTerrain` accurately reflects the broader scope. All internal references were updated. No external consumers reference the internal function name -- only `getRoughTerrainPenalty` is exposed in the return object.

### Proper cell exclusion

Actor and target cells are correctly excluded from the intermediate check (line 191). This means standing on rough terrain or targeting someone on rough terrain does not trigger the penalty -- only terrain between them does. This matches the "targeting through" language in PTU p.231.

### Comment quality

The JSDoc comments on `targetsThroughRoughTerrain` (lines 135-146) and `getRoughTerrainPenalty` (lines 218-228) clearly document both rough terrain sources, cite both decrees, and explain that the penalty is flat (not cumulative). The inline comments at lines 192 and 196 distinguish the two check sources. The section header was updated from "Enemy-Occupied Rough Terrain (decree-003)" to "Rough Terrain Accuracy Penalty (PTU p.231)" which is more accurate.

### Test coverage (36571e9 + 308f9ab)

12 tests across 6 describe blocks provide good coverage of the rough terrain penalty:

- **Painted rough terrain** (7 tests): on-path, off-path, actor-cell exclusion, target-cell exclusion, diagonal trace, water+rough combo (decree-010), slow-only negative case
- **Enemy-occupied** (1 test): existing behavior preserved with the renamed function
- **Combined sources** (1 test): both sources on the line, verifies flat penalty (not cumulative)
- **No positions** (2 tests): actor without position, target without position -- both return 0
- **Adjacent combatants** (1 test): no intermediate cells, penalty is 0

The test helper functions `makeCombatant` and `makeMove` are well-structured with sensible defaults and clear override interfaces. The mock setup for Nuxt auto-imports is thorough.

The Vue `ref`/`computed` global stubs (commit 308f9ab) are a correct fix for the Nuxt auto-import gap in the test environment. The stubs are applied before the composable import, ensuring the composable resolves the globals correctly.

### Commit granularity

The 4 commits follow the project's small-commit convention:
1. `0dd3605` -- the fix itself (1 file, 17 added / 10 removed)
2. `36571e9` -- tests (1 new file, 334 lines)
3. `308f9ab` -- test environment fix (4 lines added)
4. `95a99e6` -- ticket housekeeping (2 files updated)

Each commit produces a working state. The fix commit is self-contained. The test commit adds coverage for the fix. The test-fix commit addresses a Vitest/Nuxt environment issue discovered during test execution. The ticket commit documents the fix.

### No immutability violations

The fix does not mutate any reactive state. The Bresenham loop uses local `let` variables (`x0`, `y0`, `err`) for iteration, which is appropriate for algorithmic code. The `terrainStore.isRoughAt()` call is a read-only getter. No Pinia state, ref values, or computed properties are mutated.

### No security concerns

No new endpoints, no user input handling, no external data ingestion. The fix operates entirely within existing in-memory data structures.

## Verdict

**APPROVED**

The fix is correct, minimal, well-tested, and compliant with both applicable decrees. The two medium issues (file size and multi-cell token test gap) are pre-existing concerns that should be tracked separately rather than blocking this targeted bug fix.

## Required Changes

None blocking. Two follow-up actions recommended:

1. **File refactoring ticket** for extracting the rough terrain penalty subsystem from `useMoveCalculation.ts` to reduce the file below 800 lines.
2. **Add multi-cell token test** in a future test-coverage pass to exercise `closestCellPair` integration with the rough terrain penalty.
