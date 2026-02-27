---
review_id: rules-review-160
review_type: rules
reviewer: game-logic-reviewer
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
mechanics_verified:
  - alternating-diagonal-distance
  - cone-shapes
  - line-attacks
  - token-passability
  - enemy-occupied-rough-terrain
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md p.231 (Movement and Terrain)
  - core/10-indices-and-reference.md p.343-344 (Range Keywords)
reviewed_at: 2026-02-26T19:30:00Z
follows_up: null
---

## Mechanics Verified

### 1. Alternating Diagonal Distance (decree-002, ptu-rule-096)

- **Rule:** "Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth." (`core/07-combat.md` p.231)
- **Decree:** decree-002 — "use PTU alternating diagonal rule for ranged attack distance, consistent with movement." All grid distance measurements (movement, range, area effects) use PTU's alternating 1-2-1-2 diagonal rule.
- **Implementation:** `gridDistance.ts:ptuDiagonalDistance(dx, dy)` computes `diagonals + floor(diagonals / 2) + straights` where `diagonals = min(|dx|, |dy|)` and `straights = ||dx| - |dy||`. In `useRangeParser.ts`, the old `chebyshevDistanceTokens()` (which used `Math.max(gapX, gapY)`) was renamed to `ptuDistanceTokens()` and now calls `ptuDiagonalDistance(gapX, gapY)`. The `closestCellPair()` comparison also switched from Chebyshev to PTU diagonal.
- **Verification:** Manually verified the formula: 1 diag = 1m, 2 diag = 3m (1+2), 3 diag = 4m (1+2+1), 4 diag = 6m (1+2+1+2), 5 diag = 7m (1+2+1+2+1). All correct per PTU rules. Test at `useRangeParser.test.ts` confirms 4 diagonal cells = 6m (in range for range 6) and 5 diagonal cells = 7m (out of range for range 6). Under old Chebyshev, 5 diagonal would have been 5m (incorrectly in range).
- **Remaining Chebyshev uses:** Burst containment (`measurement.ts:getBurstCells`, `useRangeParser.ts` burst case), fog of war brush radius, and terrain brush radius still use `Math.max(|dx|, |dy|)`. These are correct: they determine "is cell within N-cell radius" for area-of-effect shapes, not point-to-point distance measurement. PTU Burst diagrams (p.343) show a filled square consistent with Chebyshev containment.
- **Status:** CORRECT

### 2. Cone Shapes — Fixed 3m-Wide Rows (decree-007, ptu-rule-100)

- **Rule:** "Cone X - The Move hits all legal targets in the square immediately in front of the user and in 3m wide rows extending from that square up to X meters away." (`core/10-indices-and-reference.md` p.343)
- **Decree:** decree-007 — "cone shapes use fixed 3m-wide rows per the literal PTU text." d=1 is 1 cell, d=2+ is 3 cells wide.
- **Implementation:** Both `useRangeParser.ts:getAffectedCells` (cone case) and `measurement.ts:getConeCells` changed `halfWidth = Math.floor(d / 2)` to `halfWidth = d === 1 ? 0 : 1`. This correctly produces: d=1 = 1 cell (center only), d=2+ = 3 cells wide (center + 1 each side perpendicular to direction).
- **Verification:** For cardinal directions (north/south/east/west), the implementation correctly expands perpendicular to the direction of travel, producing a 1-wide row at d=1 and 3-wide rows at d=2+. Matches the decree specification exactly.
- **Status:** CORRECT

**Note — Diagonal cone inconsistency (MEDIUM):** The two implementations of diagonal cone shapes differ. `useRangeParser.ts` (lines 403-406) pushes 2 cell groups: `(baseX + w, baseY)` and `(baseX, baseY + w)`. `measurement.ts:getConeCells` (lines 243-247) pushes 3 cell groups including `(baseX + w, baseY + w)` (the diagonal corner). For Cone 2 aimed diagonally from (5,5), `useRangeParser` produces 6 cells while `measurement.ts` produces 7 cells. This inconsistency means the measurement tool preview and the actual move targeting may show different affected areas for diagonal cones. Both interpretations are reasonable given the ambiguity of diagonal "3m wide rows," but they should match. See MEDIUM-1 below.

### 3. Diagonal Line Attack Shortening (decree-009, ptu-rule-102)

- **Rule:** "Line X - The Move creates a line X meters long starting from the user and hits all legal targets in that line. When used diagonally, apply the same rules as for diagonal movement." (`core/10-indices-and-reference.md` p.344)
- **Decree:** decree-009 — "diagonal Line attacks are shortened per PTU's alternating diagonal rule." Line X diagonal covers `maxDiagonalCells(X)` cells.
- **Implementation:** New utility `gridDistance.ts:maxDiagonalCells(budget)` iterates alternating 1-2m steps and counts how many cells fit within the budget. Both `useRangeParser.ts:getAffectedCells` (line case) and `measurement.ts:getLineAttackCells` use `maxDiagonalCells(size)` for diagonal directions and `size` for cardinal directions.
- **Verification:** Manually verified: Line 2 diagonal = 1 cell (cost 1m, next would be 3m > 2). Line 4 diagonal = 3 cells (1+2+1=4m). Line 6 diagonal = 4 cells (1+2+1+2=6m). Line 8 diagonal = 5 cells (1+2+1+2+1=7m, next would be 9m > 8). All match the expected PTU alternating diagonal costs. The `measurement.ts` line mode was also correctly switched from the freeform `getLineCells` (Bresenham) to `getLineAttackCells` (direction-based with diagonal shortening), matching cone/close-blast patterns.
- **Status:** CORRECT

### 4. Token Passability (decree-003, ptu-rule-097)

- **Rule:** "Squares occupied by enemies always count as Rough Terrain." (`core/07-combat.md` p.231, line 485)
- **Decree:** decree-003 — "all tokens are passable; enemy-occupied squares count as rough terrain per PTU p.231." Movement can pass through any occupied square. Cannot end movement on an occupied square. Enemy-occupied squares apply -2 accuracy penalty.
- **Implementation:**
  - `useGridMovement.ts:getBlockedCells()` now returns `[]` (empty array) — no tokens block pathfinding.
  - New `getOccupiedCells(excludeId)` returns all occupied cells for no-stacking validation.
  - `isValidMove()` checks destination against `getOccupiedCells` (no stacking) but does not add occupied cells to `blockedCells` for pathfinding.
  - `calculateTerrainAwarePathCost()` passes `blockedCells: []` instead of token-blocked cells.
  - New `getEnemyOccupiedCells(combatantId)` correctly identifies enemy cells using side-based logic ('players'/'allies' are friendly to each other; 'enemies' are hostile to both).
- **Verification:** The no-stacking rule is enforced at destination only (cannot end on occupied cell). Movement through occupied cells is allowed. Pathfinding (A*) no longer treats token cells as impassable. The `blocked` field in the `isValidMove` return value now represents occupancy (`isOccupied`) rather than token blocking.
- **PTU Compliance:** PTU p.231 states "Squares occupied by enemies always count as Rough Terrain" — this implies pass-through is allowed (rough terrain doesn't block, it penalizes). The decree makes all tokens passable (allies too), which is a reasonable extension. The no-stacking rule (can't end on occupied square) is a standard tabletop convention consistent with PTU's physical grid model.
- **Status:** CORRECT

### 5. "Occupied" Feedback (ffbe9d2)

- **Rule:** N/A (UI text only)
- **Implementation:** `useGridRendering.ts` changed the preview message from `'Blocked'` to `'Occupied'` when `moveResult.blocked` is true. This accurately reflects the new semantic: the destination is occupied (no stacking), not blocked by an impassable token.
- **Status:** CORRECT

### 6. Rough Terrain Accuracy Penalty for Enemy-Occupied Squares (decree-003)

- **Rule:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." and "Squares occupied by enemies always count as Rough Terrain." (`core/07-combat.md` p.231, lines 477-485)
- **Decree:** decree-003 — enemy-occupied squares apply the rough terrain accuracy penalty (-2) when targeting through them.
- **Implementation:** `useMoveCalculation.ts` adds:
  - `enemyOccupiedCells` (computed): builds a `Set<string>` of all cells occupied by enemies of the actor, using the same side-based logic as `getEnemyOccupiedCells`.
  - `targetsThroughEnemyRoughTerrain(targetId)`: traces a Bresenham line from attacker to target, excluding both endpoints' occupied cells, and checks if any intermediate cell is enemy-occupied.
  - `getRoughTerrainPenalty(targetId)`: returns 2 if targeting through enemy squares, 0 otherwise.
  - `getAccuracyThreshold(targetId)`: adds `roughPenalty` to the formula: `max(1, AC + evasion - accuracyStage + roughPenalty)`.
- **Verification:**
  - The penalty is flat -2 (applied as +2 to threshold), not cumulative per cell traversed. This matches PTU p.231 which specifies a single "-2 penalty" without mentioning stacking.
  - The Bresenham trace correctly excludes attacker and target cells — only intermediate cells trigger the penalty. This means adjacent attacks (melee) never incur the penalty, which is correct since there are no "intermediate" cells to target through.
  - The penalty is added AFTER evasion and accuracy stage calculations, inside the `Math.max(1, ...)` floor. This means the floor of 1 still applies, which is correct.
  - Enemy determination logic is consistent with `getEnemyOccupiedCells` in `useGridMovement.ts` (same side-based checks in both files).
- **Status:** CORRECT

## Summary

All seven commits correctly implement the PTU mechanics specified by the four decrees (decree-002, decree-003, decree-007, decree-009). The core formulas are verified against the PTU 1.05 rulebook text.

**Strengths:**
- Clean separation of concerns: `gridDistance.ts` for pure math, `useRangeParser.ts` for range/shape logic, `useGridMovement.ts` for movement validation, `useMoveCalculation.ts` for accuracy calculations.
- Consistent application of PTU diagonal rule across all distance-measuring contexts (range, line attacks) while correctly preserving Chebyshev for containment checks (bursts, brush shapes).
- The `maxDiagonalCells` utility elegantly solves the "how many diagonal cells fit in N meters" problem with a simple iterative approach.
- Enemy determination logic (3-way side system: players, allies, enemies) is correct and consistently implemented in both movement and accuracy contexts.

## Issues

### MEDIUM-1: Diagonal cone cell set inconsistency between useRangeParser and measurement store

**Files:** `app/composables/useRangeParser.ts:403-406`, `app/stores/measurement.ts:243-247`

The diagonal cone expansion in `useRangeParser.ts:getAffectedCells` produces a different cell set than `measurement.ts:getConeCells` for diagonal directions. `useRangeParser` expands along both axes separately (2 push groups: horizontal and vertical), producing a cross-like pattern. `measurement.ts` adds a third push group `(baseX + w, baseY + w)` which fills the diagonal corner, producing a wider diamond pattern. For Cone 2 aimed northeast from (5,5):
- `useRangeParser`: 6 cells (cross pattern)
- `measurement.ts`: 7 cells (diamond with corner filled)

This means the measurement tool preview shows a different affected area than what the actual move targeting uses. While both interpretations are defensible for "3m wide rows" applied diagonally (the decree doesn't specify diagonal expansion semantics), the two implementations should agree. This is not a PTU rule correctness issue (the PTU diagram for "Cone 2 - used diagonally" on p.343 is in the original PDF and not captured in text form), but an internal consistency issue.

**Recommendation:** Align both implementations to produce the same diagonal cone shape. A decree-need ticket may be warranted to clarify diagonal cone expansion semantics.

### MEDIUM-2: Static rough terrain accuracy penalty not implemented

**File:** `app/composables/useMoveCalculation.ts:getRoughTerrainPenalty`

PTU p.231 states: "When targeting **through** Rough Terrain, you take a -2 penalty to Accuracy Rolls." This applies to ALL rough terrain, not just enemy-occupied squares. The current `getRoughTerrainPenalty` only checks enemy-occupied cells. If the terrain store has cells marked with the `rough` flag (per decree-010's multi-tag system), targeting through those cells should also apply the -2 penalty. This is outside the scope of the ptu-rule-097 ticket (which specifically addresses enemy-occupied rough terrain per decree-003), but it represents a gap in the overall accuracy penalty implementation.

**Recommendation:** File a separate ticket for static rough terrain accuracy penalty integration with the existing Bresenham line-of-fire check.

## Rulings

1. **ptuDiagonalDistance formula:** CORRECT. `diagonals + floor(diagonals/2) + straights` faithfully implements PTU's alternating 1m/2m diagonal rule. Verified against 5 test cases matching hand calculations.

2. **maxDiagonalCells formula:** CORRECT. The iterative approach correctly computes how many purely diagonal cells fit within a meter budget. Line 4 diagonal = 3 cells (1+2+1=4m), per decree-009.

3. **Cone fixed 3-wide rows:** CORRECT for cardinal directions, per decree-007. The change from `Math.floor(d/2)` to `d === 1 ? 0 : 1` faithfully produces 1 cell at d=1 and 3 cells at d=2+.

4. **Token passability:** CORRECT. `getBlockedCells()` returning empty array + `getOccupiedCells()` for destination validation implements decree-003. Pass-through allowed, no stacking at destination.

5. **Enemy-occupied rough terrain penalty:** CORRECT. Flat -2 penalty (not cumulative) applied when Bresenham line passes through enemy-occupied intermediate cells. Endpoint exclusion is correct (attacker and target cells don't count as "through"). Applied as +2 to accuracy threshold inside `Math.max(1, ...)` floor.

6. **Remaining Chebyshev uses:** CORRECTLY PRESERVED. Burst containment, fog of war brush, and terrain brush use Chebyshev for "within N squares" checks. These are shape containment tests, not distance measurements, and are unaffected by decree-002.

## Verdict

**APPROVED** — All PTU mechanics are correctly implemented per the relevant decrees and PTU 1.05 rulebook text. The two MEDIUM issues are an internal consistency gap (diagonal cone shapes differ between two implementations) and a scope gap (static rough terrain penalty not yet implemented). Neither represents incorrect PTU rule implementation for the targeted tickets.

## Required Changes

None required for approval. The MEDIUM issues are recommendations for follow-up tickets, not blockers.
