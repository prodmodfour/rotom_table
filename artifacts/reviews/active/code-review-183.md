---
review_id: code-review-183
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-096+100+102+097
domain: vtt-grid
commits_reviewed:
  - 1b3b1a3
  - d68871e
  - 6d058c4
  - 81e997f
  - ffbe9d2
  - 1a15ae8
  - 7339bf9
files_reviewed:
  - app/composables/useRangeParser.ts
  - app/composables/useGridMovement.ts
  - app/composables/useGridRendering.ts
  - app/composables/useMoveCalculation.ts
  - app/stores/measurement.ts
  - app/utils/gridDistance.ts
  - app/tests/unit/composables/useRangeParser.test.ts
  - app/tests/e2e/artifacts/tickets/ptu-rule/ptu-rule-097.md
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 3
  medium: 3
reviewed_at: 2026-02-26T19:30:00Z
follows_up: null
---

## Review Scope

Dual review covering two implementation targets from session 42 slave work:

**Target A (3 commits):** VTT range measurement overhaul -- switch all range measurement from Chebyshev to PTU alternating diagonal (decree-002), fix cone shapes to fixed 3m-wide rows (decree-007), shorten diagonal Line attacks (decree-009).

**Target B (4 commits):** Token passability -- make all tokens passable per decree-003, add occupied/enemy cell tracking, show 'Occupied' feedback instead of 'Blocked', add rough terrain accuracy penalty (-2) for enemy-occupied squares.

Files: `useRangeParser.ts`, `measurement.ts`, `gridDistance.ts`, `useGridMovement.ts`, `useGridRendering.ts`, `useMoveCalculation.ts`, `useRangeParser.test.ts`.

Decrees verified: decree-002, decree-003, decree-007, decree-009, decree-010.

## Issues

### CRITICAL

#### CRIT-1: `enemyOccupiedCells` in `useMoveCalculation.ts` iterates `targets` (potential combatants), not ALL combatants

**File:** `app/composables/useMoveCalculation.ts`, lines 102-136

The `enemyOccupiedCells` computed property iterates over `targets.value` to find enemy-occupied cells. However, `targets` is the combatant list passed as a prop to `MoveTargetModal.vue` -- this is the list of **potential targets for the current move**, not necessarily all combatants on the grid.

If the GM is using a move that can only target enemies (which filters the `targets` prop to enemies only), then `enemyOccupiedCells` will never find ally combatants. This is fine for the enemy check since allies aren't enemies. BUT if `targets` is filtered to only enemies (excluding allies), then an ally standing between the actor and an enemy would NOT be checked for rough terrain occupancy. Wait -- allies aren't enemies, so their squares don't count as rough terrain. The rule is "squares occupied by **enemies**" count as rough terrain.

Actually, re-reading the implementation: the code iterates `targets.value` and checks `isEnemy`. If `targets` only contains the combatants that can be targeted by this specific move (e.g., only enemies for a single-target attack), then `enemyOccupiedCells` will only contain the squares of those specific targets, missing other enemies that are on the grid but not targetable by this move (e.g., fainted enemies, enemies behind blocking terrain, etc.).

Per decree-003 (PTU p.231), "Squares occupied by enemies always count as Rough Terrain." This is a property of the grid, not of the targeting list. An enemy standing between attacker and target causes rough terrain penalty regardless of whether that intermediate enemy is a valid target for the current move.

**The `targets` ref may not include all combatants on the grid.** If it only includes valid targets for the current move, any enemy that is NOT a valid target (out of range, behind terrain, fainted) but still occupies a square on the line of fire would be missed. This is a correctness bug -- the penalty should be based on ALL enemy positions on the grid, not just the targetable subset.

**Fix:** The composable needs access to ALL combatants in the encounter (e.g., via a separate `allCombatants` ref or by importing the encounter store directly) to correctly enumerate enemy-occupied cells.

---

### HIGH

#### HIGH-1: No-stacking check in `isValidMove` only validates a single cell (top-left anchor), not the full footprint of multi-cell tokens

**File:** `app/composables/useGridMovement.ts`, lines 389-391

```typescript
const occupiedCells = getOccupiedCells(combatantId)
const isOccupied = occupiedCells.some(c => c.x === toPos.x && c.y === toPos.y)
```

`toPos` is the destination position (top-left anchor of the moving token). For a 1x1 token, this correctly checks if the destination cell is occupied. But for a 2x2 or larger token, the token would occupy `(toPos.x, toPos.y)` through `(toPos.x+size-1, toPos.y+size-1)`. The current check only validates the anchor cell, not the entire destination footprint.

A 2x2 token could "stack" with another token if the overlap occurs at a non-anchor cell. For example, token A moving to (3,3) as a 2x2 token occupies (3,3), (4,3), (3,4), (4,4). If token B occupies (4,4), only cell (4,4) overlaps -- but the current code only checks (3,3) against occupied cells.

**Fix:** The no-stacking check needs to test ALL cells the moving token would occupy at the destination, not just the anchor cell. Get the moving token's size and check all `size*size` cells.

#### HIGH-2: Duplicate enemy-determination logic between `useGridMovement.ts` and `useMoveCalculation.ts`

**File:** `app/composables/useGridMovement.ts` lines 248-261, `app/composables/useMoveCalculation.ts` lines 113-123

The "is this combatant an enemy?" logic is implemented identically in two places:

1. `getEnemyOccupiedCells()` in `useGridMovement.ts` (lines 248-261)
2. `enemyOccupiedCells` computed in `useMoveCalculation.ts` (lines 113-123)

Both use the same pattern: same side = not enemy, players/allies are friendly to each other. This violates DRY and creates a maintenance risk -- if enemy determination rules change (e.g., adding a "neutral" side), both locations need updating independently.

**Fix:** Extract a shared `isEnemySide(sideA, sideB): boolean` utility function (e.g., in `utils/` or as a pure export from `useGridMovement`) and call it from both locations.

#### HIGH-3: `Burst` measurement in `measurement.ts` still uses Chebyshev distance, not PTU diagonal

**File:** `app/stores/measurement.ts`, lines 184-198

```typescript
function getBurstCells(center: GridPosition, radius: number): GridPosition[] {
  // ...
  // Use Chebyshev distance for PTU
  if (Math.max(Math.abs(dx), Math.abs(dy)) <= radius) {
```

Per decree-002: "All grid distance measurements (movement, range, area effects) use PTU's alternating diagonal rule." The comment even says "Use Chebyshev distance for PTU" which directly contradicts the decree.

However, there is a nuance: PTU Burst shapes are described as squares centered on a point. A Burst 2 affects all cells within 2 meters, and on a square grid, the "within X meters" definition using PTU alternating diagonal would produce a different shape than Chebyshev. With Chebyshev, a Burst 2 produces a 5x5 square. With PTU diagonal, cells at (2,2) distance would cost 3m (2 diag + floor(2/2) = 3), so corner cells at distance-2-diag would be OUT of a Burst 2.

This is a pre-existing issue (not introduced by this PR), but the PR's scope explicitly addresses "all range measurement" per decree-002. The cone and line shapes were fixed for PTU diagonal, but burst was left with Chebyshev. Similarly, the `getAffectedCells` burst case in `useRangeParser.ts` line 379 also uses `Math.max(Math.abs(dx), Math.abs(dy)) <= size` (Chebyshev).

The burst measurement comment literally says "Use Chebyshev distance for PTU" -- this is a decree-002 violation, but I acknowledge burst shape is debatable (PTU p.343 describes bursts as "squares" which is Chebyshev). However, since decree-002 says "All grid distance measurements" and the precedent section says "No Chebyshev distance in the app", this needs a ruling.

**Fix:** Either (a) update burst to use `ptuDiagonalDistance(dx, dy) <= radius` for consistency with decree-002, or (b) file a decree-need ticket to clarify whether burst shapes are exempt from the alternating diagonal rule (since PTU explicitly calls them "squares"). Do NOT leave the contradictory "Use Chebyshev distance for PTU" comment in place regardless.

---

### MEDIUM

#### MED-1: `targetsThroughEnemyRoughTerrain` uses top-left anchor for multi-cell tokens instead of closest cell pair

**File:** `app/composables/useMoveCalculation.ts`, lines 173-178

```typescript
// Bresenham's line from actor center-ish to target center-ish
// For multi-cell tokens, use anchor position (top-left)
let x0 = actorPos.x
let y0 = actorPos.y
const x1 = target.position.x
const y1 = target.position.y
```

The comment says "center-ish" but then uses the top-left anchor. For single-cell tokens, anchor = center, so this is fine. For multi-cell tokens (2x2, 3x3), the Bresenham line traces from the top-left of the attacker to the top-left of the target. This could trace through different intermediate cells than the actual line-of-sight path between closest cells.

The `useRangeParser.ts` already has a `closestCellPair` function that finds the pair of cells (one from each token) with minimum distance. The rough terrain check should use the same cell pair as LoS to be consistent.

**Fix:** Use `closestCellPair` from `useRangeParser` to get the actual endpoints for the Bresenham trace, matching the LoS determination logic.

#### MED-2: Missing unit tests for cone, line, and passability changes

The test file `useRangeParser.test.ts` received one new test case for the PTU diagonal range check (decree-002). However, no tests were added for:

1. **Cone shape** (decree-007): No test verifying that a cone produces d=1: 1 cell, d=2+: 3 cells wide. This is a behavioral change to an existing function.
2. **Diagonal line shortening** (decree-009): No test verifying that a diagonal Line 4 produces 3 cells. Another behavioral change.
3. **`maxDiagonalCells` utility**: No unit tests in `gridDistance.ts` test file (if one exists) or inline.
4. **`getOccupiedCells` / `getEnemyOccupiedCells`**: New functions in `useGridMovement.ts` with no unit tests.

Per Senior Reviewer L1: "Verify test coverage for behavioral changes." These are functional formula changes, not cosmetic renames. Each should have at least one positive and one negative test case.

**Fix:** Add test cases for cone shape, diagonal line shortening, and `maxDiagonalCells`. Movement composable tests for occupied/enemy cell tracking should also be added.

#### MED-3: `getBlockedCells` is now a no-op but still called in rendering and interaction code

**File:** `app/composables/useGridMovement.ts` line 205, called from `useGridRendering.ts` lines 375, 491 and `IsometricCanvas.vue` line 137

`getBlockedCells` now always returns `[]`. However, it's still part of the public API and is called in three places:

1. `useGridRendering.ts` line 375: `const blocked = options.getBlockedCells(token.combatantId)` -- passed to `getMovementRangeCells`
2. `useGridRendering.ts` line 491: same pattern for external preview
3. `IsometricCanvas.vue` line 137: `movement.getBlockedCells(selectedId)` -- passed to `getMovementRangeCells`

These calls allocate an empty array that's immediately consumed by pathfinding. While functionally harmless, the dead code creates confusion: future developers will wonder why `getBlockedCells` exists if it always returns empty. The underscore prefix on `_excludeCombatantId` signals it's intentionally unused, but the callers don't know that.

**Fix:** Either deprecate `getBlockedCells` with a comment explaining that tokens no longer block (per decree-003), or refactor the call sites to not pass blocked cells (removing the dead parameter flow). The interface types in `useGridRendering.ts` line 29 and `useGridInteraction.ts` line 29 still declare `getBlockedCells` as required -- consider removing from the interface if truly dead.

## What Looks Good

1. **`gridDistance.ts` utility is well-designed.** The `ptuDiagonalDistance` closed-form formula is mathematically correct (verified against manual calculations). The `maxDiagonalCells` iterative budget function handles the inverse problem cleanly. Good doc comments with examples -- all examples verified correct.

2. **Cone shape fix is clean and consistent.** Both `useRangeParser.ts` and `measurement.ts` cone implementations were updated identically: `const halfWidth = d === 1 ? 0 : 1`. The decree-007 citation is clear. The diagonal cone branch correctly handles the 2D perpendicular expansion.

3. **Line shortening implementation is correct.** The `maxDiagonalCells(size)` approach for diagonal lines properly implements decree-009. The measurement store got a new `getLineAttackCells` function with direction-based line generation, replacing the old Bresenham-based `getLineCells` for the 'line' measurement mode. Good separation -- the old `getLineCells` is retained for distance measurement where Bresenham is still appropriate.

4. **Range measurement switch is thorough.** All three call sites for the old Chebyshev distance were updated: `ptuDistanceTokens`, `closestCellPair`, and both callers of `chebyshevDistanceTokens`. The function rename from `chebyshevDistanceTokens` to `ptuDistanceTokens` makes the semantic change visible. The test case (lines 107-117) has a good discriminator: 5 diagonal cells = 5 under Chebyshev but 7 under PTU diagonal.

5. **Token passability architecture is sound.** The separation of concerns is good: `getBlockedCells` returns empty (nothing blocks), `getOccupiedCells` tracks all occupied cells for the stacking check, `getEnemyOccupiedCells` tracks enemy cells for accuracy. The `isValidMove` function correctly checks occupancy at destination and passes empty blocked list to pathfinding.

6. **Enemy determination logic is correct.** The three-sided combat model (players + allies vs enemies) is handled correctly with the friendly-to-each-other check for players/allies. Per PTU, allies and players are on the same side.

7. **Accuracy penalty integration is clean.** The `getRoughTerrainPenalty` returns 2 (not -2), and it's added to the accuracy threshold in `getAccuracyThreshold` as `+ roughPenalty`. This correctly makes the target harder to hit. The penalty is flat (not cumulative per cell), which matches PTU rules.

8. **Commit granularity is appropriate.** Each commit addresses one logical change, commit messages reference decree numbers, and the 7 commits map cleanly to the ticket requirements.

## Verdict

**CHANGES_REQUIRED**

One CRITICAL issue (enemy-occupied cells computed from `targets` list which may not include all combatants), three HIGH issues (multi-cell stacking check, duplicate enemy logic, burst Chebyshev inconsistency), and three MEDIUM issues (multi-cell LoS for rough terrain trace, missing tests, dead code).

The CRITICAL must be fixed before merge -- the rough terrain accuracy penalty will silently miss enemies that are on the grid but not in the `targets` prop when the move is aimed at a specific combatant. The HIGH-1 multi-cell stacking bug is a correctness issue for Large/Huge tokens. HIGH-3 (burst Chebyshev) can be resolved with a decree-need ticket if the team believes bursts should remain squares.

## Required Changes

1. **CRIT-1:** `enemyOccupiedCells` in `useMoveCalculation.ts` must enumerate ALL combatants on the grid, not just the `targets` prop. Either accept a separate `allCombatants` ref parameter or access the encounter store directly.

2. **HIGH-1:** Multi-cell no-stacking check in `isValidMove` must test ALL cells the moving token would occupy at the destination, not just the anchor cell.

3. **HIGH-2:** Extract shared `isEnemySide(sideA, sideB)` utility to eliminate the duplicate enemy-determination logic.

4. **HIGH-3:** Either update `getBurstCells` to use `ptuDiagonalDistance` or file a `decree-need` ticket clarifying burst shape exemption. Remove the misleading "Use Chebyshev distance for PTU" comment regardless.

5. **MED-1:** Use `closestCellPair` for the Bresenham trace in `targetsThroughEnemyRoughTerrain` to be consistent with LoS.

6. **MED-2:** Add unit tests for cone shape (decree-007), diagonal line shortening (decree-009), and `maxDiagonalCells` utility.

7. **MED-3:** Add deprecation comment to `getBlockedCells` or refactor callers to remove dead parameter flow.
