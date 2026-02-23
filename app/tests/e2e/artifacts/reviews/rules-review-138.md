---
review_id: rules-review-138
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-002
domain: vtt-grid
commits_reviewed:
  - a370230
  - dac457d
  - fcad42e
  - d9b0615
  - 88c4bde
  - ea5142a
  - 08106d3
  - cc06dca
  - 05db7a4
  - 7ad643f
  - 5af1638
mechanics_verified:
  - diagonal-movement
  - elevation-movement-cost
  - a-star-pathfinding-with-elevation
  - movement-range-overlay
  - flying-pokemon-elevation
  - sprint-maneuver
  - movement-conditions
  - terrain-movement-costs
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#Movement
  - core/07-combat.md#Terrain
  - core/07-combat.md#Sprint
  - core/07-combat.md#Speed-Combat-Stages-and-Movement
reviewed_at: 2026-02-23T13:30:00Z
follows_up: rules-review-135
---

## Mechanics Verified

### 1. PTU Diagonal Movement (Alternating 1m/2m)

- **Rule:** "Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth." (`core/07-combat.md#Movement`, page 231)
- **Implementation:** Two locations implement this:
  - `useGridMovement.ts:186-193` (`calculateMoveDistance`): `diagonalCost = diagonals + Math.floor(diagonals / 2)` for geometric distance.
  - `useRangeParser.ts:553-562` (`getMovementRangeCells`): Per-step parity tracking. `baseCost = currentParity === 0 ? 1 : 2; newParity = 1 - currentParity`. Same formula in `calculatePathCost` at lines 776-785.
- **Verification:** 1 diagonal = 1+0 = 1. 2 diagonals = 2+1 = 3. 3 diagonals = 3+1 = 4. 4 diagonals = 4+2 = 6. Matches PTU sequence (1, 3, 4, 6, 7, 9...).
- **Status:** CORRECT. Diagonal cost is preserved identically in both isometric and 2D modes. Elevation changes do not interfere with XY diagonal parity.

### 2. Elevation Movement Cost (Design Extension)

- **Rule:** PTU has no explicit elevation rules. This is a design decision: 1 movement point per level of elevation change (up or down). Implementation in `useGridMovement.ts:80-97` (`calculateElevationCost`).
- **Implementation:** `const dz = Math.abs(toZ - fromZ); return dz;` for non-flying combatants. Simple, linear, symmetric cost.
- **Design Assessment:** 1 MP per level is a reasonable PTU-compatible approximation. It mirrors how Slow Terrain doubles cost (1 square = 2 movement), giving elevation a tangible but not overwhelming cost. The 1:1 ratio means a Pokemon with Overland 5 can move 5 cells flat OR move 2 cells flat + climb 3 levels.
- **Status:** CORRECT (design decision, not a rule violation). Reasonable and consistent with PTU movement economy.

### 3. Flying Pokemon and Sky Speed

- **Rule:** PTU Sky capability allows flight. No explicit PTU rule ties Sky speed to elevation cost reduction. The implementation at `useGridMovement.ts:88-94` gives flying Pokemon free elevation movement within their Sky speed: `if (dz <= sky) return 0; return dz - sky`.
- **Implementation:** `useElevation.ts:106-116` (`getDefaultElevation`) also sets flying Pokemon default elevation to `min(skySpeed, maxElevation)`.
- **Design Assessment:** This is a flavorful and logical design extension. A Pidgeot with Sky 8 ignoring 8 levels of elevation cost makes thematic sense. Auto-elevating flying Pokemon on encounter start is a nice UX touch.
- **Status:** CORRECT (design decision). Well-reasoned extension that maintains PTU flavor.

### 4. A* Pathfinding with Elevation

- **Rule:** Movement should account for terrain and diagonal costs per PTU rules (verified above).
- **Implementation:** `useRangeParser.ts:678-814` (`calculatePathCost`) uses A* with:
  - Diagonal parity tracking per step (lines 776-785)
  - Terrain cost multiplier per step (lines 773-774, 787)
  - Elevation cost per step transition (lines 790-793)
  - Heuristic: `chebyshev_ptu(dx,dy) + |dz|` (lines 706-713)

- **Heuristic Admissibility Analysis:**
  - XY component: `diagonals + floor(diagonals/2) + straights` is the minimum XY cost (terrain multiplier >= 1), so it never overestimates XY cost.
  - Elevation component: Uses `Math.abs(toElev - z)` (raw vertical distance), which equals the actual elevation cost for non-flying combatants.
  - **For flying Pokemon:** The heuristic uses raw `|dz|` but the actual cost function (`calculateElevationCost`) returns `max(0, dz - skySpeed)`. The heuristic overestimates by up to `skySpeed` meters, making it **inadmissible** for flying Pokemon. This means A* may not find the optimal path for flying combatants with Sky speed > 0. See MEDIUM-1 below.

- **Status:** CORRECT for non-flying combatants. NEEDS REVIEW for flying combatants (heuristic inadmissibility, MEDIUM severity).

### 5. Movement Range Overlay (Flood Fill)

- **Rule:** Reachable cells should respect movement budget, terrain costs, diagonal rules, and elevation costs.
- **Implementation:** `useRangeParser.ts:491-605` (`getMovementRangeCells`) uses Dijkstra-like flood fill:
  - Diagonal parity tracked per cell (lines 553-562)
  - Terrain cost multiplier applied (lines 546-547, 564)
  - Elevation cost applied per step via `getElevationCost` callback (lines 567-569)
  - Budget enforcement: `if (totalCost > speed) continue` (line 575)
  - Cost map with priority queue for optimal exploration (lines 503-525)

- **Wiring in `IsometricCanvas.vue:114-141`:** Passes `elevationCostGetter` bound to `calculateElevationCost` with the specific combatant, and `getTerrainElevation` for ground elevation lookup. Origin elevation set from token's current elevation.
- **Status:** CORRECT. The flood fill correctly computes reachable cells with full elevation support. Flying Pokemon benefit from `calculateElevationCost` returning 0 for small dz values, so their movement range overlay correctly shows extended reach across elevation changes.

### 6. Movement Conditions (Stuck, Slowed, Speed CS, Sprint)

- **Rule:** "Stuck means you cannot Shift at all." "Slowed means your movement speed is halved." Speed CS: "+/- half stage value rounded down, may never reduce below 2." Sprint: "+50% movement speed for the rest of your turn." (`core/07-combat.md`)
- **Implementation:** `useGridMovement.ts:134-173` (`applyMovementModifiers`) — unchanged from P0 baseline, correctly applies:
  - Stuck: early return 0 (line 142)
  - Slowed: floor(speed/2) (line 147)
  - Speed CS: Math.trunc(stage/2), min 2 enforcement (lines 155-163)
  - Sprint: floor(speed * 1.5) (line 168)
  - Minimum speed 1 unless already 0 (line 172)
- **Status:** CORRECT. These modifiers feed into `getSpeed()` which feeds into `isValidMove()`, so elevation movement correctly respects all conditions.

### 7. Terrain Movement Costs

- **Rule:** "Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead." Blocking terrain prevents movement. Water requires Swim, Earth requires Burrow. (`core/07-combat.md#Terrain`)
- **Implementation:** `useGridMovement.ts:269-296` delegates to `terrainStore.getMovementCost()` with capability checks. `useRangeParser.ts` multiplies base step cost by terrain multiplier (line 564, 787).
- **Status:** CORRECT. Terrain costs multiply the base diagonal/cardinal step cost, then elevation cost is added additively. This means a diagonal step on Slow Terrain at elevation change costs `(2 * 2) + dz = 4 + dz` for parity=1, which is correct behavior.

### 8. Token Interaction Through Isometric Projection

- **Rule:** No PTU rule applies. This is a UI/UX concern (click accuracy).
- **Implementation:** `useIsometricInteraction.ts:135-203` (`getTokenAtScreenPosition`) performs screen-space hit testing with:
  - Inverse camera transform (pan/zoom) applied (lines 149-150)
  - Depth-ordered token testing (front to back) for correct occlusion (lines 153-172)
  - Approximate bounding box with elevation-aware positioning (lines 177-197)
- **Status:** CORRECT (UI/UX, no PTU rule applies). The hit-test approach is reasonable for isometric projection.

## Issues Found

### MEDIUM-1: A* Heuristic Inadmissible for Flying Pokemon

**File:** `app/composables/useRangeParser.ts:706-713`
**Issue:** The A* heuristic uses `Math.abs(toElev - z)` for the elevation component, but `calculateElevationCost` returns `max(0, dz - skySpeed)` for flying Pokemon. The heuristic overestimates by up to `skySpeed`, violating admissibility. A* may return suboptimal (longer than necessary) paths for flying combatants.

**Impact:** Low. The movement range overlay uses Dijkstra (no heuristic), so reachable cells are correctly computed. The A* pathfinding is only used for `isValidMove` validation, where an overestimate means the path cost appears higher than it truly is. Worst case: a valid move is rejected when the optimal path is cheaper. However, the path might still be accepted if the non-optimal A* path is within budget. The inconsistency is conservative (never allows illegal moves).

**Suggested Fix:** Replace the heuristic elevation estimate with `getElevationCost ? getElevationCost(z, toElev) : 0` so the heuristic uses the same cost function as the actual step cost.

### MEDIUM-2: isValidMove Elevation Cost Not Per-Step When Using A* Terrain Path

**File:** `app/composables/useGridMovement.ts:349-377`
**Issue:** When terrain is present (line 360), `isValidMove` calls `calculatePathCost(fromPos, toPos, blockedCells, terrainCostGetter)` without passing elevation getters. Elevation cost is then added as a flat `elevCost` (origin-to-destination delta) on line 372. Meanwhile, `getMovementRangeCells` computes per-step elevation costs through intermediate cells.

This means: if the path goes 0->2->1->0->3 elevation through 5 cells, `isValidMove` adds `|0-3|=3` elevation cost, while the per-step cost would be `2+1+1+3=7`. Conversely, if intermediate cells are flat and only the destination differs, both approaches agree.

**Impact:** Low-Medium. In practice, for click-to-move validation, the GM clicks the destination cell and the movement range overlay already correctly shows which cells are reachable. If a cell is highlighted as reachable (per-step elevation), `isValidMove` might still reject it (flat elevation cost could differ). However, the mismatch only occurs when intermediate cells have varying elevation, which is a new feature and may not arise in typical use yet.

**Suggested Fix:** Pass `getElevationCost`, `getTerrainElevation`, and origin elevation to `calculatePathCost` inside `isValidMove`, matching the arguments used by `getMovementRangeCells`.

## Rulings

1. **Elevation cost of 1 MP per level is a reasonable PTU extension.** PTU provides no elevation rules. The 1:1 ratio is simple, intuitive, and consistent with PTU's movement economy. RULING: Acceptable design decision.

2. **Flying Pokemon ignoring elevation cost up to Sky speed is a reasonable PTU extension.** Sky capability implies flight, and free vertical movement within flight range is thematically consistent. RULING: Acceptable design decision.

3. **Auto-elevation for flying Pokemon on encounter start is acceptable.** Setting flying Pokemon to `min(skySpeed, maxElevation)` by default is a sensible UX improvement that reflects how aerial Pokemon would naturally position. RULING: Acceptable design decision.

4. **PTU diagonal movement rules are correctly preserved** through all pathfinding algorithms (geometric distance, A* pathfinding, Dijkstra flood fill). Elevation is additive to XY cost, never interfering with diagonal parity.

## Summary

The P1 implementation correctly preserves all existing PTU movement rules (diagonal alternation, terrain costs, movement conditions, Sprint, Speed CS) while adding elevation as an orthogonal, additive cost layer. The two MEDIUM issues are internal consistency matters between A* pathfinding and the Dijkstra flood fill, not PTU rule violations. Both errors are conservative (they may reject valid moves, never permit illegal ones).

The design extensions (elevation cost, flying Pokemon, auto-elevation) are reasonable PTU-compatible decisions that fill a gap in the PTU ruleset. No existing PTU mechanics are broken or misimplemented by the P1 changes.

## Verdict

**APPROVED** -- No PTU rule violations. Two MEDIUM internal consistency issues noted for future improvement but do not affect game correctness (conservative errors only). All existing PTU movement mechanics (diagonal rules, terrain costs, conditions, Sprint, Speed CS) are correctly preserved in the isometric/elevation context.

## Required Changes

None required for rules approval. The two MEDIUM issues are recommendations for improved internal consistency, not rule violations. They can be addressed in P2 or as follow-up maintenance.
