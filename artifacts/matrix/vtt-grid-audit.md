---
domain: vtt-grid
type: implementation-audit
session: 121
matrix_session: 120
audited_at: 2026-03-05T14:00:00Z
audited_by: implementation-auditor
total_items: 33
correct: 28
incorrect: 1
approximation: 2
ambiguous: 0
partial_correct: 2
---

# Implementation Audit: vtt-grid (Session 121)

Re-audit of the vtt-grid domain against the session-120 matrix (`artifacts/matrix/vtt-grid-matrix.md`). All 33 queued items audited against PTU rule text, source code, and active decrees.

## Audit Summary

| Classification | Count | Severity Breakdown |
|---------------|-------|--------------------|
| Correct | 28 | -- |
| Incorrect | 1 | MEDIUM: 1 |
| Approximation | 2 | LOW: 2 |
| Ambiguous | 0 | -- |
| Partial-Correct | 2 | (present portion correct, flagged gaps) |
| **Total** | **33** | |

### Severity Summary (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | -- |
| HIGH | 0 | -- |
| MEDIUM | 1 | R027 (Speed CS floor interaction with Stuck) |
| LOW | 2 | R019 (greedy independent set), R030 (disengage 1m + slow terrain) |

---

## Tier 1: Core Formulas and Conditions (Foundation)

### 1. R005 -- Diagonal Movement Cost

- **Rule:** PTU p.231: "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again."
- **Expected behavior:** Diagonal distance = diagonals + floor(diagonals / 2) + straights. Per decrees 002, 009, 023: used for all grid distances (movement, range, burst, line).
- **Actual behavior:** `ptuDiagonalDistance()` at `app/utils/gridDistance.ts:19-25` computes exactly `diagonals + Math.floor(diagonals / 2) + straights`. `maxDiagonalCells()` at lines 78-88 implements the step-by-step alternating cost for line attacks (decree-009). `ptuDistanceTokensBBox()` at lines 47-60 uses gap-based bounding box distance for multi-cell tokens (decree-002). All three functions are used consistently across pathfinding, range parsing, burst shapes (decree-023), and measurement.
- **Classification:** **Correct**

### 2. R002 -- Grid Scale (1m Per Square)

- **Rule:** PTU p.8: "On a grid, both Small and Medium Pokemon would take up one space, or a 1x1m square."
- **Expected behavior:** Each grid cell = 1 meter. `cellSize` is a pixel rendering parameter, not the game-logic scale.
- **Actual behavior:** `GridConfig.cellSize` at `app/types/spatial.ts:24` is documented as "Pixels per cell" (default 40px per `app/types/settings.ts:20`). All game-logic distance functions (`ptuDiagonalDistance`, pathfinding, range checks) operate in cell units where 1 cell = 1 meter. The pixel rendering layer (`GridCanvas.vue` line 157: `scaledCellSize = config.cellSize * zoom`) only converts to pixels for display. No game logic uses cellSize as a distance unit.
- **Classification:** **Correct**

### 3. R026 -- Speed CS Modifier

- **Rule:** PTU p.235: "you gain a bonus or penalty to all Movement Speeds equal to half your current Speed Combat Stage value rounded down"
- **Expected behavior:** Additive bonus of `Math.trunc(stage / 2)`. CS+6 = +3, CS-6 = -3, CS+1 = 0, CS-1 = 0.
- **Actual behavior:** `app/utils/movementModifiers.ts:60-68` clamps stage to [-6, +6], computes `Math.trunc(clamped / 2)`, and adds it to `modifiedSpeed`. `Math.trunc` rounds toward zero, which for negative values is equivalent to "rounded down in magnitude" (CS-5 gives -2, matching floor-toward-zero behavior PTU intends for "rounded down" in absolute terms).
- **Classification:** **Correct**

### 4. R027 -- Speed CS Movement Floor

- **Rule:** PTU p.235: "Being at a negative Combat Stage reduces your movement equally, but may never reduce it below 2."
- **Expected behavior:** When a negative CS is applied, resulting speed is clamped to minimum 2.
- **Actual behavior:** `app/utils/movementModifiers.ts:66-68` applies `Math.max(modifiedSpeed, 2)` only when `stageBonus < 0`. This correctly enforces the floor of 2 for negative CS. However, note the ordering: Stuck returns 0 at line 35 (before CS is computed), and line 77 applies `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` as a global minimum after all modifiers. The interaction is correct: Stuck short-circuits before any CS math. **One concern:** if Slowed halves speed to 2 and then a negative CS applies -1, the floor of 2 correctly prevents dropping to 1. If Slowed halves speed to 1, the CS floor prevents the CS from reducing it further below 2 -- but this would actually RAISE the speed from 1 to 2 after Slowed, which is debatable. PTU says the CS floor prevents CS from reducing below 2, not that it raises Slowed-halved speeds. The floor at line 67 applies after Slowed (line 44-46) and before Sprint (line 72-73), and the condition only checks `stageBonus < 0` -- so if Slowed drops speed to 1 and CS is -2 (bonus = -1), the code would set modifiedSpeed = 1 + (-1) = 0, then max(0, 2) = 2. This RAISES the Slowed speed from 1 to 2, which may not match intent.
- **Classification:** **Incorrect**
- **Severity:** MEDIUM
- **Note:** The floor of 2 is meant to prevent negative CS from reducing speed below 2, but the current ordering applies the floor after Slowed. If a combatant has base speed 3 and Slowed (floor(3/2)=1) with Speed CS -2 (bonus=-1), the code produces max(0, 2) = 2, effectively nullifying the Slowed penalty. PTU likely intends the floor to apply to the CS reduction specifically (speed cannot go below 2 due to CS), not as a global floor that overrides Slowed. A fix would be: apply CS floor relative to pre-CS speed rather than as a global max. However, this edge case requires Speed CS -4 or worse combined with Slowed on a low-speed combatant (rare in practice).

### 5. R022 -- Stuck Condition

- **Rule:** PTU p.231: "Stuck means you cannot Shift at all"
- **Expected behavior:** Stuck condition sets effective speed to 0.
- **Actual behavior:** `app/utils/movementModifiers.ts:34-36` checks `conditions.includes('Stuck')` and returns 0 immediately, before any other modifier. This is the first check in the function, ensuring Stuck overrides all speed modifiers.
- **Classification:** **Correct**

### 6. R024 -- Slowed Condition

- **Rule:** PTU p.248: "A Pokemon that is Slowed has its Movement halved (minimum 1)."
- **Expected behavior:** Speed = floor(speed / 2), minimum 1.
- **Actual behavior:** `app/utils/movementModifiers.ts:44-46` computes `Math.floor(modifiedSpeed / 2)` when Slowed. The minimum of 1 is enforced by line 77: `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` which ensures at least 1 when base speed > 0. The halving uses `Math.floor` which matches PTU "rounded down" convention.
- **Classification:** **Correct**

### 7. R025 -- Tripped Condition

- **Rule:** PTU p.248: "A Pokemon or Trainer has been Tripped needs to spend a Shift Action getting up before they can take further actions."
- **Expected behavior:** Tripped sets effective speed to 0 (must spend Shift Action to stand).
- **Actual behavior:** `app/utils/movementModifiers.ts:39-41` checks both `conditions.includes('Tripped')` and `tempConditions.includes('Tripped')`, returning 0 for either. This models "must spend Shift Action to stand up" as "no movement available" which is the correct VTT abstraction -- the token cannot move until the GM clears the Tripped condition.
- **Classification:** **Correct**

### 8. R006 -- Adjacency Definition

- **Rule:** PTU p.231: "Two combatants are Adjacent to one another if any squares they occupy touch each other, even if only the corners touch, as with diagonal squares."
- **Expected behavior:** 8-directional adjacency (cardinal + diagonal). For multi-cell tokens, any cell of one touching any cell of the other.
- **Actual behavior:** `app/utils/flankingGeometry.ts:17-21` defines `NEIGHBOR_OFFSETS` as all 8 directions. `areAdjacent()` at lines 109-127 checks all cell pairs from both tokens for `dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0)`. The same 8-directional adjacency is used in `app/utils/adjacency.ts` (imported by `useGridMovement.ts`). `useRangeParser.ts` also uses 8-directional adjacency for melee range (distance 1 via `ptuDiagonalDistance` which returns 1 for all 8 neighbors).
- **Classification:** **Correct**

### 9. R021 -- Melee Range

- **Rule:** PTU p.241: "Range: Melee, 1 Target" -- requires adjacency per R006.
- **Expected behavior:** Melee range = distance 1 (adjacent cells, 8-directional).
- **Actual behavior:** `useRangeParser.ts:69-72` parses "Melee" to `{ type: 'melee', range: 1 }`. `isInRange()` at lines 292-354 uses `ptuDistanceTokens()` (PTU diagonal distance) and checks `distance <= parsedRange.range`. For adjacent cells, ptuDiagonalDistance returns 1 for all 8 neighbors, matching adjacency. Multi-cell tokens use nearest-cell distance via `ptuDistanceTokensBBox`.
- **Classification:** **Correct**

### 10. R032 -- Throwing Range

- **Rule:** PTU p.223: "Trainers have a Throwing Range that determines how far they can throw Poke Balls and other small items. This Capability is equal to 4 plus their Athletics Rank in meters."
- **Expected behavior:** Range check uses `ptuDiagonalDistance` per decree-002.
- **Actual behavior:** `useRangeParser.ts` parses ranged attacks (including thrown items) into numeric range values. `isInRange()` at lines 320-321 uses `ptuDistanceTokens()` which delegates to `ptuDistanceTokensBBox()` using `ptuDiagonalDistance` for the distance metric. All range comparisons use PTU diagonal distance per decree-002. The throwing range formula (4 + Athletics) is computed elsewhere (trainer derivation) and passed as the range parameter.
- **Classification:** **Correct**

---

## Tier 2: Core Constraints and Enumerations

### 11. R001 -- Square Grid System

- **Rule:** PTU p.231: "Pokemon Tabletop United uses a square combat grid."
- **Expected behavior:** Grid rendered as squares in both 2D and isometric modes.
- **Actual behavior:** `GridConfig` type (`app/types/spatial.ts:20-30`) defines `width`, `height`, `cellSize` for a rectangular grid of square cells. `GridCanvas.vue` renders square cells (`gridPixelWidth = config.width * config.cellSize`, line 159). The isometric mode projects square grid cells into a diamond/rhombus pattern (standard isometric projection of a square grid). No hexagonal or non-square grid support exists anywhere in the codebase. `IsometricCanvas` transforms square cells into isometric view.
- **Classification:** **Correct**

### 12. R007 -- No Split Movement

- **Rule:** PTU p.231: "You may not split up a Shift Action. That is, you cannot move a few squares, take a Standard Action, and then continue moving."
- **Expected behavior:** Movement is a single atomic operation (one drag).
- **Actual behavior:** `useGridMovement.ts` implements movement as a single `isValidMove()` call that validates an entire from->to path. The UI presents movement as drag-and-drop (single operation). There is no mechanism to "pause" movement mid-path, take an action, and resume. Movement validation checks the full path cost against the combatant's speed in one evaluation.
- **Classification:** **Correct**

### 13. R016 -- Blocking Terrain

- **Rule:** PTU p.231: "Blocking Terrain: Straightforwardly, this is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions."
- **Expected behavior:** Blocking terrain has Infinity cost (impassable) and blocks line of sight.
- **Actual behavior:** `app/stores/terrain.ts:27` sets `TERRAIN_COSTS.blocking = Infinity`. `getMovementCost` getter at line 154 returns `Infinity` for blocking. `useGridMovement.ts:423` returns `Infinity` for blocking in `getTerrainCostForCombatant`. `useMoveCalculation.ts:101-103` uses `isBlockingTerrain()` which checks `terrainStore.getTerrainAt(x, y) === 'blocking'` for line-of-sight blocking. `useRangeParser.ts:260` checks `isBlockingFn` in `hasLineOfSight()`.
- **Classification:** **Correct**

### 14. R014 -- Slow Terrain

- **Rule:** PTU p.231: "When Shifting through Slow Terrain, Trainers and their Pokemon treat every square meter as two square meters instead."
- **Expected behavior:** Slow terrain doubles movement cost (cost 2 per cell). Per decree-008: water defaults to cost 1 (basic terrain).
- **Actual behavior:** `app/stores/terrain.ts:161-162` in `getMovementCost`: `return flags.slow ? baseCost * 2 : baseCost`. For water terrain, `TERRAIN_COSTS.water = 1` (line 27) per decree-008, so water without the slow flag costs 1. The GM can overlay slow on water for rough currents. The slow flag doubles the base cost of any terrain type it's applied to.
- **Classification:** **Correct**

### 15. R015 -- Rough Terrain (-2 Accuracy)

- **Rule:** PTU p.231: "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Squares occupied by enemies always count as Rough Terrain."
- **Expected behavior:** -2 accuracy penalty when targeting through intervening rough terrain. Enemy-occupied squares = rough. Endpoints excluded per decree-025. Naturewalk bypasses painted rough but not enemy-occupied rough per decree-003.
- **Actual behavior:** `app/composables/useMoveCalculation.ts:148-222` implements `targetsThroughRoughTerrain()` using Bresenham's line to trace intermediate cells. At lines 192-196, enemy-occupied cells trigger the penalty (decree-003). At lines 198-205, painted rough terrain triggers the penalty unless the attacker has matching Naturewalk. Lines 191-192 explicitly exclude actor and target cells (decree-025). `getRoughTerrainPenalty()` at lines 235-240 returns 2 or 0. The penalty is applied in `getAccuracyThreshold()` at line 508 as an additive threshold increase.
- **Classification:** **Correct**

### 16. R012 -- Basic Terrain Types

- **Rule:** PTU p.231: Regular Terrain, Earth Terrain, Underwater terrain, plus Slow, Rough, Blocking modifiers.
- **Expected behavior:** 6+ terrain types with multi-tag flags (rough, slow) per decree-010.
- **Actual behavior:** `app/types/spatial.ts:54-62` defines `TerrainType` enum with 8 base types (normal, difficult[legacy], blocking, water, earth, rough[legacy], hazard, elevated). `TerrainFlags` at lines 66-69 provides `rough` and `slow` boolean flags per decree-010. `TerrainCell` at lines 73-79 combines base type + flags. Legacy types `difficult` and `rough` are migrated to `normal + flags` on import (`app/stores/terrain.ts:59-114`). `TerrainPainter` supports painting all types and toggling flags independently.
- **Classification:** **Correct**

---

## Tier 3: Core Interactions (Flanking, AoO)

### 17. R018 -- Flanking

- **Rule:** PTU p.232: "When a combatant is Flanked by foes, they take a -2 penalty to their Evasion. A Small or Medium sized Trainer or Pokemon is considered Flanked when at least two foes are adjacent to them but not adjacent to each other."
- **Expected behavior:** Detect 2+ non-adjacent foe pairs around target. Apply -2 evasion penalty. Size-based thresholds for larger targets.
- **Actual behavior:** `app/utils/flankingGeometry.ts:146-194` (`checkFlanking`) finds all foes adjacent to the target, then checks all pairs for non-adjacency. `FLANKING_FOES_REQUIRED` at lines 27-32 maps size 1->2, 2->3, 3->4, 4->5. `FLANKING_EVASION_PENALTY = 2` at line 38. `app/composables/useFlankingDetection.ts` uses `checkFlankingMultiTile` (which subsumes `checkFlanking`'s logic for all sizes) and exposes `getFlankingPenalty()` returning `FLANKING_EVASION_PENALTY` (2) when flanked. The penalty is integrated into `useMoveCalculation.ts:500-503` as a reduction to the accuracy threshold.
- **Classification:** **Correct**

### 18. R019 -- Flanking Multi-Tile

- **Rule:** PTU p.232: "Foes larger than Medium may occupy multiple squares -- in this case, they count as a number of foes for the purposes of Flanking equal to the number of squares adjacent to the Flanked target that they're occupying."
- **Expected behavior:** Multi-tile targets require more foes (Large=3, Huge=4, Gigantic=5). Multi-tile attackers count adjacent cells as contribution.
- **Actual behavior:** `app/utils/flankingGeometry.ts:318-410` (`checkFlankingMultiTile`) correctly implements: (1) `FLANKING_FOES_REQUIRED` thresholds (lines 27-32), (2) `countAdjacentAttackerCells()` at lines 212-239 counts how many cells of a multi-tile attacker are adjacent to the target, (3) builds adjacency graph among foes (lines 368-382), (4) uses `findIndependentSet()` (greedy min-degree heuristic, lines 258-294) to find non-adjacent foe sets, (5) sums independent set contributions against required threshold (lines 391-402). **Note:** The greedy independent set algorithm is a heuristic, not exact. For the small sizes involved in PTU combat (max ~20 adjacent foes), the min-degree greedy approach is effectively correct, but theoretically could miss a valid independent set in rare graph configurations.
- **Classification:** **Approximation**
- **Severity:** LOW
- **Note:** The greedy independent set finder is an O(n^2) heuristic that works correctly for all practical PTU combat scenarios. A theoretical edge case exists where the greedy picks a suboptimal vertex first and misses a valid independent set, but this would require very specific geometric arrangements of many (6+) foes that are rare in actual gameplay. The approximation is acceptable.

### 19. R020 -- Self-Flank Prevention

- **Rule:** PTU p.232: "a single combatant cannot Flank by itself, no matter how many adjacent squares they're occupying; a minimum of two combatants is required to Flank someone."
- **Expected behavior:** Minimum 2 distinct combatants required. Single multi-tile foe cannot self-flank.
- **Actual behavior:** `app/utils/flankingGeometry.ts:331` in `checkFlankingMultiTile` explicitly checks `if (adjacentFoes.length < 2)` and returns `isFlanked: false`. The `foes` parameter is an array of distinct combatant objects (each with unique `id`), so a single combatant appearing once in the array can never satisfy the < 2 check. The `checkFlanking` function at line 158 also requires `adjacentFoes.length < requiredFoes` (minimum 2 for 1x1 targets) before checking for non-adjacent pairs.
- **Classification:** **Correct**

### 20. R031 -- AoO Movement Trigger

- **Rule:** PTU p.241: "An adjacent foe Shifts out of a Square adjacent to you."
- **Expected behavior:** Detect when a mover exits adjacency of an enemy. Disengage exemption via `disengaged` flag.
- **Actual behavior:** `app/constants/aooTriggers.ts:22-48` defines `AOO_TRIGGER_MAP` with 5 trigger types including `shift_away` (checkOn: 'movement'). `app/composables/useGridMovement.ts:657-700` (`getAoOTriggersForMove`) checks each enemy token: was adjacent at `from` but not at `to` (lines 691-694). Disengaged combatants skip entirely (line 666). Reactor eligibility checks: fainted/dead exclusion (line 683-685), AoO-blocking conditions (line 686), already-used AoO (line 688). Server-side `detectAoO` and `resolveAoO` in `useEncounterOutOfTurn.ts` handle actual resolution.
- **Classification:** **Correct**

---

## Tier 4: Core Workflows and Maneuvers

### 21. R004 -- Movement Via Shift Actions

- **Rule:** PTU p.231: "Movement is done with Shift Actions in combat. You can move a number of squares with a single Shift Action equal to the value of your relevant Movement Capability."
- **Expected behavior:** Drag-and-drop movement with A* pathfinding, terrain-aware validation, speed-limited.
- **Actual behavior:** `app/composables/useGridMovement.ts:564-643` (`isValidMove`) validates the full move: bounds check, no-stacking check (decree-003), terrain-aware A* pathfinding (via `calculatePathCost`), speed averaging for mixed terrain (decree-011), and final cost <= speed check. The UI uses drag-and-drop with validation on drop. Speed is derived from combatant capabilities with all modifiers applied.
- **Classification:** **Correct**

### 22. R028 -- Sprint Maneuver

- **Rule:** PTU p.242: "Increase your Movement Speeds by 50% for the rest of your turn."
- **Expected behavior:** `Math.floor(speed * 1.5)`.
- **Actual behavior:** `app/utils/movementModifiers.ts:72-73` checks `tempConditions.includes('Sprint')` and applies `Math.floor(modifiedSpeed * 1.5)`. Sprint is tracked as a `tempCondition` set when the Sprint maneuver is executed. `app/constants/combatManeuvers.ts:37-44` defines Sprint as a standard action maneuver. `Math.floor` matches PTU rounding convention.
- **Classification:** **Correct**

### 23. R029 -- Push Maneuver

- **Rule:** PTU p.242: "Push. Action: Standard. AC: 4. Range: Melee, 1 Target."
- **Expected behavior:** Push exists in combat maneuvers with `provokesAoO`.
- **Actual behavior:** `app/constants/combatManeuvers.ts:25-34` defines Push with `id: 'push'`, `ac: 4`, `actionType: 'standard'`, `requiresTarget: true`, `provokesAoO: 'maneuver_other'`. The `maneuver_other` trigger type is defined in `aooTriggers.ts:39-42` matching PTU p.241 ("An adjacent foe uses a Push, Grapple, Disarm, Trip, or Dirty Trick Maneuver that does not target you").
- **Classification:** **Correct**

### 24. R030 -- Disengage Maneuver

- **Rule:** PTU p.241: "Disengage. Action: Shift. Effect: You may Shift 1 Meter. Shifting this way does not provoke an Attack of Opportunity."
- **Expected behavior:** 1m movement clamp when disengaged, AoO exemption.
- **Actual behavior:** `app/constants/combatManeuvers.ts:90-98` defines Disengage as `actionType: 'shift'` with no `provokesAoO`. In `useGridMovement.ts:196-199` (`getMaxPossibleSpeed`): `if (combatant.disengaged) return Math.min(modifiedSpeed, 1)`. Same at lines 271-274 (`getSpeed`). In `getAoOTriggersForMove` at line 666: `if (mover.disengaged) return []` (no AoO triggers). **Note:** The 1m clamp applies to the full modified speed. If the combatant is on slow terrain (cost 2 per cell), the 1m budget means they effectively cannot move through slow terrain at all (1m budget, 2m cost per cell). PTU says "Shift 1 Meter" which is absolute, and slow terrain says "treat every square meter as two square meters" -- so a Disengage on slow terrain would cost 2m of budget for 1 cell, but the budget is only 1m. This is technically correct per the rules (Disengage gives exactly 1m of movement budget), though it makes Disengage unusable on slow terrain.
- **Classification:** **Approximation**
- **Severity:** LOW
- **Note:** The interaction between Disengage (1m budget) and slow terrain (2m per cell) is technically correct per PTU rules, but may be unintuitive. A combatant on slow terrain cannot Disengage at all because 1m budget < 2m cell cost. This is a faithful implementation of both rules simultaneously, but the PTU authors may not have intended this interaction. Flagged as LOW because Disengage on slow terrain is a rare edge case and the implementation is technically correct.

### 25. R033 -- Recall Beam Range

- **Rule:** PTU p.229: "A Trainer cannot Switch or Recall their Pokemon if their active Pokemon is out of range of their Poke Ball's recall beam -- 8 meters."
- **Expected behavior:** 8m range check using `ptuDiagonalDistance` per decree-002.
- **Actual behavior:** `app/server/services/switching.service.ts:25` defines `POKEBALL_RECALL_RANGE = 8`. `checkRecallRange()` at lines 42-65 handles: League Battles always in range (line 48-50), missing positions return in range (lines 52-54), otherwise computes `ptuDiagonalDistance(dx, dy)` (line 60) and checks `distance <= POKEBALL_RECALL_RANGE` (line 63). Per decree-002, uses PTU diagonal distance.
- **Classification:** **Correct**

### 26. R041/R042 -- Intercept Maneuvers

- **Rule:** PTU p.242: Intercept Melee and Intercept Ranged are Full Action + Interrupt maneuvers.
- **Expected behavior:** Both maneuvers exist with interrupt trigger support.
- **Actual behavior:** `app/constants/combatManeuvers.ts:99-119` defines both `intercept-melee` and `intercept-ranged` with `actionType: 'interrupt'`, `isInterrupt: true`. `app/composables/useEncounterOutOfTurn.ts` provides the out-of-turn action system that supports interrupt triggers. The system handles interrupt resolution through server-side API endpoints (`/api/encounters/:id/aoo-detect`, etc.). The actual mechanical resolution (Acrobatics/Athletics check, movement calculation) is handled through GM adjudication in the UI, not automated.
- **Classification:** **Correct**

---

## Tier 5: Situational Implemented Items

### 27. R008 -- Mixed Movement

- **Rule:** PTU p.231: "When using multiple different Movement Capabilities in one turn, such as using Overland on a beach and then Swim in the water, average the Capabilities and use that value."
- **Expected behavior:** Path-based speed averaging per decree-011. Detect terrain transitions, average distinct capability speeds.
- **Actual behavior:** `app/utils/combatantCapabilities.ts:158-204` (`calculateAveragedSpeed`) collects distinct movement capabilities used across terrain types (Overland for normal/hazard/elevated, Swim for water, Burrow for earth), deduplicates by capability key (not by speed value), and averages with `Math.floor`. `app/composables/useGridMovement.ts:292-321` (`getAveragedSpeedForPath`) collects terrain types along the full path (including multi-cell footprint at each step), calls `calculateAveragedSpeed`, then applies movement modifiers. `buildSpeedAveragingFn` at lines 331-340 provides the callback for flood-fill pathfinding range display.
- **Classification:** **Correct**

### 28. R017 -- Naturewalk

- **Rule:** PTU p.303: "Pokemon with Naturewalk treat all listed terrains as Basic Terrain."
- **Expected behavior:** Matching Naturewalk bypasses slow flag on terrain (treats as cost 1). Also bypasses rough terrain accuracy penalty for painted terrain (not enemy-occupied).
- **Actual behavior:** `app/utils/combatantCapabilities.ts:315-331` (`naturewalkBypassesTerrain`) checks combatant's Naturewalk terrains against `NATUREWALK_TERRAIN_MAP` for the cell's base terrain type. In `useGridMovement.ts:411-434` (`getTerrainCostForCombatant`), lines 429-431: if `flags.slow && naturewalkBypassesTerrain(combatant, terrain)`, returns base cost without slow doubling. In `useMoveCalculation.ts:199-205`: if painted rough terrain and attacker has matching Naturewalk, the rough cell is bypassed for accuracy penalty. Enemy-occupied rough is explicitly NOT bypassed (lines 193-196, per decree-003). Naturewalk data is extracted from Pokemon `capabilities.naturewalk` and `otherCapabilities` strings, and from human `capabilities` (Survivalist, equipment).
- **Classification:** **Correct**

---

## Tier 6: Partial Items (Verify Present Portion)

### 29. R003 -- Size Footprints (Partial)

- **Rule:** PTU p.231: "Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4."
- **Expected behavior:** Multi-cell footprint logic in pathfinding, movement, flanking, measurement. Visual rendering gap flagged.
- **Actual behavior (present portion):**
  - `app/utils/sizeCategory.ts:16-22` defines `SIZE_FOOTPRINT_MAP`: Small=1, Medium=1, Large=2, Huge=3, Gigantic=4. `getFootprintCells()` (lines 37-49) and `isFootprintInBounds()` (lines 54-64) support multi-cell tokens.
  - Pathfinding: `app/composables/usePathfinding.ts` accepts `tokenSize` parameter (lines 36, 47, 52) and checks full NxN footprint at each pathfinding step.
  - Movement: `useGridMovement.ts:571-582` uses `getFootprintCells` for no-stacking checks and `isFootprintInBounds` for bounds validation. Token size is read from `movingToken.size`.
  - Flanking: `checkFlankingMultiTile` (flankingGeometry.ts:318-410) fully handles multi-tile targets and attackers.
  - Measurement: `ptuDistanceTokensBBox` (gridDistance.ts:47-60) computes bounding-box distance for multi-cell tokens.
  - **Gap:** VTT rendering still draws all tokens as 1x1 sprites. No visual multi-tile display.
- **Classification (present portion):** **Correct**

### 30. R013 -- Movement Capabilities (Partial)

- **Rule:** PTU p.223: Overland, Sky, Swim, Burrow, Levitate, Teleporter movement capabilities.
- **Expected behavior:** Overland/Sky/Swim/Burrow speed selection. Elevation for Sky. Levitate/Teleporter gap flagged.
- **Actual behavior (present portion):**
  - `app/utils/combatantCapabilities.ts:135-143` (`getSpeedForTerrain`) correctly returns Swim speed for water, Burrow speed for earth, Overland for all other terrain.
  - `useGridMovement.ts:72-92` (`getTerrainAwareSpeed`) does the same at the composable level with Pokemon and human trainer handling.
  - Sky: `combatantCanFly` and `getSkySpeed` (combatantCapabilities.ts:68-85) support sky speed. Elevation system in `useElevation.ts` tracks per-token elevation with bounds. `calculateElevationCost` in useGridMovement.ts:45-62 gives flying Pokemon free elevation changes within Sky speed range.
  - **Gap:** Levitate and Teleporter capabilities exist as data fields (`app/types/spatial.ts:47-48` and `app/types/character.ts:37`) but have no VTT pathfinding integration. No Levitate height cap, no Teleporter LoS check, no Sprint limitation, no once-per-round enforcement.
- **Classification (present portion):** **Correct**

### 31. R023 -- Ghost Type Stuck/Trapped Immunity (Partial)

- **Rule:** PTU p.239: "Ghost Types cannot be Stuck or Trapped"
- **Expected behavior:** `isImmuneToStatus(['Ghost'], 'Stuck')` returns true. UI and API block application. Defense-in-depth gap in `movementModifiers.ts` flagged.
- **Actual behavior (present portion):**
  - `app/utils/typeStatusImmunity.ts:22-29`: `TYPE_STATUS_IMMUNITIES.Ghost = ['Stuck', 'Trapped']`. `isImmuneToStatus(['Ghost'], 'Stuck')` returns `true`.
  - `app/components/encounter/StatusConditionsModal.vue:63` imports `findImmuneStatuses` and `isImmuneToStatus`. The modal shows immune warnings and visually marks immune statuses (line 26: `status-checkbox--immune`).
  - `app/server/api/encounters/[id]/status.post.ts:56-74` server-side: calls `findImmuneStatuses()` and rejects immune statuses with 409 error unless `override: true`.
  - **Gap:** `movementModifiers.ts` does not check Ghost type -- if Stuck is somehow applied (e.g., direct DB edit, GM override), a Ghost Pokemon would still be blocked. This is a defense-in-depth gap, not a gameplay gap since normal UI/API paths block the application.
- **Classification (present portion):** **Correct**

### 32. R037 -- Teleporter (Partial)

- **Rule:** PTU p.223: "Only one teleport action can be taken during a round of combat. The Pokemon must have line of sight to the location they wish to teleport to..."
- **Expected behavior:** `teleport` field exists on Pokemon data. Missing VTT pathfinding mode flagged.
- **Actual behavior (present portion):**
  - `app/types/character.ts:37` defines `teleport?: number` on Pokemon capabilities.
  - `app/types/spatial.ts:48` defines `teleport: number` on `MovementSpeeds` interface.
  - **Gap:** No Teleporter movement mode in VTT pathfinding. No LoS check, no Sprint limitation, no once-per-round enforcement.
- **Classification (present portion):** **Correct**

### 33. R038 -- Levitate Maximum Height (Partial)

- **Rule:** PTU p.223: "When using the Levitate Capability, the maximum height off the ground the Pokemon can achieve is equal to half of their Levitate Capability."
- **Expected behavior:** `useElevation` composable exists with elevation bounds. Height cap enforcement gap flagged.
- **Actual behavior (present portion):**
  - `app/composables/useElevation.ts` provides per-token elevation tracking (`tokenElevations` Map), `getTokenElevation()`, and `setTokenElevation()` clamped to `[0, maxElevation]`.
  - `app/types/spatial.ts:29` defines `maxElevation: number` on `GridConfig` (default 5).
  - **Gap:** The `maxElevation` is a global grid setting, not per-Pokemon based on Levitate capability. No enforcement of "max height = half Levitate speed" per individual Pokemon. No Levitate movement mode distinct from Sky.
- **Classification (present portion):** **Correct**

---

## Escalation Notes

### No Ambiguous Items

All 33 audited items were resolvable against PTU rule text plus active decrees. No new `decree-need` tickets required.

### Findings Requiring Attention

1. **R027 (MEDIUM):** Speed CS floor of 2 can interact unexpectedly with Slowed. When Slowed halves speed below 2 and negative CS is then applied, the `Math.max(modifiedSpeed, 2)` floor raises the speed back to 2, effectively nullifying the Slowed penalty. This is a rare edge case (requires low base speed + Slowed + negative Speed CS). A potential fix: apply the CS floor as `Math.max(preCSSpeed + stageBonus, 2)` instead of the current global max, or only apply the floor when the CS penalty alone would cause the drop below 2.

2. **R019 (LOW):** Greedy independent set is an approximation of the exact maximum independent set problem. Acceptable for PTU's small graph sizes but not mathematically exact.

3. **R030 (LOW):** Disengage on slow terrain is technically correct but may be unintuitive -- the 1m movement budget cannot cover the 2m cost of a slow terrain cell, making Disengage impossible on slow terrain.

### Decree Compliance

All 10 relevant decrees verified:

| Decree | Compliance | Verification |
|--------|-----------|-------------|
| decree-002 | Compliant | `ptuDiagonalDistance` used everywhere. No Chebyshev. |
| decree-003 | Compliant | Tokens passable, enemy squares = rough accuracy penalty. No stacking. |
| decree-007 | Compliant | Cone shapes use fixed 3-wide rows (verified in `getAffectedCells`). |
| decree-008 | Compliant | `TERRAIN_COSTS.water = 1`. GM overlays slow for rough currents. |
| decree-009 | Compliant | `maxDiagonalCells()` shortens diagonal lines. |
| decree-010 | Compliant | Multi-tag `TerrainFlags { rough, slow }` per cell. Independent effects. |
| decree-011 | Compliant | `calculateAveragedSpeed` + `buildSpeedAveragingFn` for path-based averaging. |
| decree-023 | Compliant | Burst shapes use `ptuDiagonalDistance` for containment, not Chebyshev. |
| decree-024 | Compliant | Diagonal cones include corner cell (line 403 in useRangeParser.ts). |
| decree-025 | Compliant | Endpoint cells excluded from rough terrain accuracy check. |
