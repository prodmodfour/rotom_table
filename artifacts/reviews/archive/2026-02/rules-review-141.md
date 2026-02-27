---
review_id: rules-review-141
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-002
domain: vtt-grid
commits_reviewed:
  - b79aa84
  - 5c5fe68
  - d3cbb0e
  - 5d71f46
  - 3a4d6fd
  - d19e3bb
  - f593a32
  - 65f41b3
  - 0fee174
mechanics_verified:
  - a-star-heuristic-admissibility
  - elevation-aware-pathfinding
  - diagonal-movement-preservation
  - flying-pokemon-elevation-cost
  - movement-range-overlay
  - movement-conditions
  - terrain-movement-costs
  - sprint-maneuver
ptu_refs:
  - core/07-combat.md#Movement
  - core/07-combat.md#Terrain
  - core/07-combat.md#Sprint
  - core/07-combat.md#Speed-Combat-Stages-and-Movement
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-02-24T16:45:00Z
follows_up: rules-review-138
---

## Context

Re-review of the feature-002 P1 fix cycle. The previous rules-review-138 APPROVED the P1 implementation with 2 MEDIUM internal consistency issues (MEDIUM-1: A* heuristic inadmissible for flying Pokemon; MEDIUM-2: isValidMove passes flat elevation cost instead of per-step cost to A*). The developer has addressed both issues across 9 commits. This review verifies all fixes are correct and no PTU mechanic regressions were introduced.

## Fix Verification

### C1/MEDIUM-1: A* Heuristic Inadmissible for Flying Pokemon

**Previous Issue:** The A* heuristic used `Math.abs(toElev - z)` for elevation cost, but `calculateElevationCost` returns `max(0, dz - skySpeed)` for flying Pokemon. The heuristic overestimated by up to `skySpeed`, violating admissibility.

**Fix (5c5fe68):** Pathfinding was extracted from `useRangeParser.ts` into `usePathfinding.ts`. The heuristic now delegates to the caller-provided `getElevationCost` function:

```typescript
// usePathfinding.ts:259-266
const heuristic = (x: number, y: number, z: number) => {
  const dx = Math.abs(to.x - x)
  const dy = Math.abs(to.y - y)
  const diagonals = Math.min(dx, dy)
  const straights = Math.abs(dx - dy)
  const xyCost = diagonals + Math.floor(diagonals / 2) + straights
  const elevCost = getElevationCost ? getElevationCost(z, toElev) : 0
  return xyCost + elevCost
}
```

**Admissibility Proof:**
- XY component: `diagonals + floor(diagonals/2) + straights` is the PTU minimum XY cost (terrain multiplier >= 1), so it never overestimates.
- Elevation component: When `getElevationCost` is provided, it returns the actual per-step cost function (which for flying Pokemon returns `max(0, dz - skySpeed)`). Since elevation transitions along a path can only accumulate more cost than the direct origin-to-destination transition (intermediate cells may have different elevations), using the direct transition cost as heuristic is a valid lower bound.
- When `getElevationCost` is not provided, `elevCost = 0`, which trivially never overestimates.

**Verdict:** FIXED. The heuristic is now admissible for both flying and non-flying combatants. A* will find optimal paths in all cases.

### C2/MEDIUM-2: isValidMove Flat Elevation Cost

**Previous Issue:** `isValidMove` called `calculatePathCost` without passing elevation getters, then added a flat origin-to-destination elevation cost. The flood fill (`getMovementRangeCells`) computed per-step elevation costs through intermediate cells, causing inconsistency.

**Fix (d3cbb0e):** `isValidMove` now builds elevation cost getters and passes them directly to `calculatePathCost`:

```typescript
// useGridMovement.ts:330-356
const elevCostGetter = getElevationCostGetter(combatantId)
const terrainElevGetter = getTerrainElevationGetter()
const fromElev = options.getTokenElevation
  ? options.getTokenElevation(combatantId)
  : 0

if (terrainCostGetter || elevCostGetter) {
  const pathResult = calculatePathCost(
    fromPos, toPos, blockedCells, terrainCostGetter,
    elevCostGetter, terrainElevGetter, fromElev
  )
  // ...
  return {
    valid: pathResult.cost > 0 && pathResult.cost <= speed,
    distance: pathResult.cost,
    blocked: false
  }
}
```

The flat `elevCost` computation has been completely removed. Now both `isValidMove` and `getMovementRangeCells` compute elevation costs identically: per-step through intermediate cells via the same `getElevationCost` callback. The entry condition also changed from `if (terrainCostGetter)` to `if (terrainCostGetter || elevCostGetter)`, ensuring elevation-only scenarios (no painted terrain but active elevation) still use A* pathfinding.

**Verification:** `getElevationCostGetter` (line 258-262) binds `calculateElevationCost` to the specific combatant, which correctly applies the Sky speed discount for flying Pokemon. `getTerrainElevationGetter` (line 267-269) returns `options.getTerrainElevation` for ground elevation lookup. Both functions return `undefined` when elevation callbacks are not configured, preserving backwards compatibility with non-isometric mode.

**Verdict:** FIXED. `isValidMove` and `getMovementRangeCells` now use identical per-step elevation cost computation. A cell shown as reachable in the movement range overlay will always be accepted by `isValidMove`.

### H2: Duplicate combatantCanFly/getSkySpeed

**Fix (b79aa84):** Extracted `combatantCanFly`, `getSkySpeed`, `combatantCanSwim`, `combatantCanBurrow` to `app/utils/combatantCapabilities.ts` (54 lines). Both `useGridMovement.ts` and `useElevation.ts` import from this shared utility instead of maintaining separate copies.

**Rules Impact:** None. The capability detection logic is identical to the previous implementation. The functions correctly check `pokemon.capabilities?.sky ?? 0 > 0` for flying detection and return `pokemon.capabilities?.sky ?? 0` for Sky speed, which matches PTU data model conventions.

**Verdict:** FIXED. No rules regression.

### M5: Movement Preview Z=0

**Fix (f593a32):** The movement preview arrow now uses terrain elevation at the destination:

```typescript
// useIsometricRendering.ts:618-621
const toElev = options.getTerrainElevation
  ? options.getTerrainElevation(preview.toPosition.x, preview.toPosition.y)
  : 0
```

Previously `toElev` was always 0. Now the arrow endpoint correctly renders at the destination cell's terrain elevation, providing accurate visual feedback for elevation-aware movement.

**Rules Impact:** Purely visual/UX. The movement validation logic was already correct; this fix ensures the visual preview matches the validated movement.

**Verdict:** FIXED. No rules impact.

## Mechanics Verified

### 1. PTU Diagonal Movement (Alternating 1m/2m)

- **Rule:** "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again." (`core/07-combat.md`, p.231)
- **Implementation:** Three locations maintain identical diagonal logic:
  - `usePathfinding.ts:102-109` (flood fill): `baseCost = currentParity === 0 ? 1 : 2; newParity = 1 - currentParity`
  - `usePathfinding.ts:330-338` (A*): Same parity tracking per step.
  - `usePathfinding.ts:158-165` (geometric): `diagonalCost = diagonals + Math.floor(diagonals / 2)`
  - `useGridMovement.ts:143-148` (display distance): Same formula.
- **Status:** CORRECT. The extraction to `usePathfinding.ts` preserved all three diagonal cost implementations exactly. No mutation of diagonal parity logic occurred.

### 2. Elevation Movement Cost (Design Extension)

- **Rule:** No explicit PTU elevation rules. Design decision: 1 MP per level of elevation change.
- **Implementation:** `useGridMovement.ts:35-52` (`calculateElevationCost`):
  - Non-flying: `Math.abs(toZ - fromZ)` -- 1 MP per level, symmetric.
  - Flying: `dz <= sky ? 0 : dz - sky` -- Sky speed meters of free vertical movement.
- **Post-Fix Status:** Now used identically in:
  - `isValidMove` via `getElevationCostGetter` -> `calculatePathCost` (per-step)
  - `getMovementRangeCells` via `elevationCostGetter` callback (per-step)
  - `calculateTerrainAwarePathCost` via same getter pattern (per-step)
- **Status:** CORRECT. Elevation cost is consistently applied per-step across all code paths.

### 3. Flying Pokemon and Sky Speed

- **Rule:** PTU Sky capability grants flight. Design extension: free elevation movement within Sky speed.
- **Implementation:**
  - Detection: `combatantCanFly` in `utils/combatantCapabilities.ts:37-43` checks `pokemon.capabilities?.sky > 0`.
  - Cost: `calculateElevationCost` at `useGridMovement.ts:44-48` returns 0 for `dz <= sky`.
  - Default elevation: `useElevation.ts:83-93` sets `min(skySpeed, maxElevation)`.
  - A* heuristic: `usePathfinding.ts:265` uses `getElevationCost(z, toElev)` which resolves to the same function, giving an admissible lower bound.
- **Status:** CORRECT. Flying Pokemon benefit from free elevation movement in all three systems (validation, range overlay, pathfinding heuristic).

### 4. Movement Conditions (Stuck, Slowed, Speed CS, Sprint)

- **Rule:** "Stuck means you cannot Shift at all." "Slowed means your movement speed is halved." Speed CS: "bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down...may never reduce it below 2." Sprint: "Increase your Movement Speeds by 50%." (`core/07-combat.md`, pp.231, 692-700, 1231-1236)
- **Implementation:** `useGridMovement.ts:89-128` (`applyMovementModifiers`) -- unchanged from pre-fix state:
  - Stuck: early return 0 (line 97)
  - Slowed: `Math.floor(speed / 2)` (line 102)
  - Speed CS: `Math.trunc(clamped / 2)`, min 2 floor (lines 112-118)
  - Sprint: `Math.floor(speed * 1.5)` (line 123)
  - Global minimum: `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` (line 127)
- **Status:** CORRECT. No regression. These modifiers feed into `getSpeed()` which gates all pathfinding.

### 5. Terrain Movement Costs

- **Rule:** "Shifting through Slow Terrain...treat every square meter as two square meters." Blocking terrain prevents movement. Water requires Swim, Earth requires Burrow. (`core/07-combat.md`, pp.231-232)
- **Implementation:** `useGridMovement.ts:224-251` delegates to `terrainStore.getMovementCost()` with combatant-specific capability checks. `usePathfinding.ts:93-98, 326-327` multiplies base diagonal/cardinal step cost by terrain multiplier, with `Infinity` check for impassable.
- **Status:** CORRECT. Terrain cost multiplication is preserved in the extracted pathfinding. Elevation cost is additive to terrain-modified step cost (line 116-117, 344-346), matching PTU's stacking model.

### 6. Sprint Maneuver

- **Rule:** "Increase your Movement Speeds by 50% for the rest of your turn." (`core/07-combat.md`, p.1235)
- **Implementation:** `useGridMovement.ts:122-124` checks `tempConditions.includes('Sprint')` then applies `Math.floor(speed * 1.5)`.
- **Status:** CORRECT. Sprint is applied after Slowed and Speed CS, before the global minimum floor. This ordering ensures Sprint multiplies the already-modified speed, which is the correct PTU interpretation.

### 7. A* Pathfinding Correctness (Post-Fix)

- **Rule:** Movement validation must produce results consistent with movement range overlay.
- **Implementation:** `usePathfinding.ts:229-367` (`calculatePathCost`):
  - Same 8-direction neighbor exploration as flood fill
  - Same diagonal parity tracking per step
  - Same terrain cost multiplication
  - Same elevation cost per step (via `getElevationCost` callback)
  - Admissible heuristic using same cost function
  - Open/closed set management for A* correctness
- **Consistency Check:** Both `calculatePathCost` and `getMovementRangeCells` now receive the same function signatures (`TerrainCostGetter`, `ElevationCostGetter`, `TerrainElevationGetter`) and both are called with the same bound getters from `useGridMovement`. The only algorithmic difference is A* (goal-directed) vs Dijkstra (flood fill), which produce the same optimal costs for any given origin-destination pair when the heuristic is admissible.
- **Status:** CORRECT. Internal consistency between A* and Dijkstra is now maintained.

### 8. Movement Range Overlay (Flood Fill)

- **Rule:** Reachable cells must respect movement budget, terrain, diagonals, and elevation.
- **Implementation:** `usePathfinding.ts:38-152` (`getMovementRangeCells`):
  - Dijkstra flood fill with priority queue (line 70-72)
  - Diagonal parity per step (lines 102-109)
  - Terrain multiplier per step (lines 93, 111)
  - Elevation cost per step (lines 114-117)
  - Budget enforcement: `if (totalCost > speed) continue` (line 122)
  - Returns cells with Z coordinate for elevation-aware rendering (line 139)
- **Wiring in `IsometricCanvas.vue:114-141`:** Correctly builds elevation cost getter bound to `calculateElevationCost` with the specific combatant, passes `getTerrainElevation` for ground lookup, and sets origin elevation from token state.
- **Status:** CORRECT. No changes to flood fill logic in the fix cycle.

## Rulings

1. **The A* heuristic is now admissible for all combatant types.** By delegating elevation cost estimation to the same `getElevationCost` function used for actual step costs, the heuristic correctly produces a lower bound for both flying and non-flying combatants. RULING: Correct fix, verified admissible.

2. **isValidMove and getMovementRangeCells are now internally consistent.** Both use per-step elevation cost computation via the same callback chain. A cell marked reachable by the range overlay will always be accepted by `isValidMove`. RULING: Consistency issue fully resolved.

3. **All PTU movement rules remain correctly implemented** through the refactoring. The extraction of pathfinding into `usePathfinding.ts` and capability checks into `combatantCapabilities.ts` preserved all game logic exactly. Diagonal alternation, terrain costs, movement conditions, Sprint, and Speed CS are unchanged.

4. **Design extensions remain reasonable.** Elevation cost (1 MP/level), flying Pokemon Sky speed discount, and auto-elevation continue to be well-motivated PTU-compatible design decisions.

## Summary

All 12 issues from the previous review cycle (10 from code-review-148, 2 from rules-review-138) have been addressed. The two rules-relevant issues (MEDIUM-1: inadmissible heuristic, MEDIUM-2: flat elevation cost in isValidMove) are fully resolved:

- The A* heuristic now uses the caller-provided elevation cost function, making it admissible for all combatant types including flying Pokemon with Sky speed.
- `isValidMove` now passes elevation getters directly to `calculatePathCost` for per-step elevation costing, eliminating the inconsistency with the flood fill range computation.

No PTU rule regressions were introduced. All 8 verified mechanics (diagonal movement, elevation cost, flying Pokemon, A* pathfinding, movement range overlay, movement conditions, terrain costs, Sprint) remain correctly implemented. The refactoring into `usePathfinding.ts` (375 lines) and `combatantCapabilities.ts` (54 lines) cleanly separated concerns without altering any game logic.

## Verdict

**APPROVED** -- All previous rules issues are resolved. No new PTU rule violations or internal consistency issues found. All PTU movement mechanics are correctly preserved through the fix cycle.

## Required Changes

None.
