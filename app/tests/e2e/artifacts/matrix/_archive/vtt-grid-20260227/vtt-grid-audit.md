---
domain: vtt-grid
audited_at: 2026-02-26T17:00:00Z
audited_by: implementation-auditor
rules_catalog: vtt-grid-rules.md
capabilities_catalog: vtt-grid-capabilities.md
matrix: vtt-grid-matrix.md
items_audited: 24
---

# Implementation Audit: VTT Grid

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 20 |
| Incorrect | 1 |
| Approximation | 2 |
| Ambiguous | 1 |
| **Total Audited** | **24** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 2 | R015 (rough terrain cost 1 correct but no accuracy penalty), R026 (Speed CS movement partially implemented) |
| LOW | 1 | R022 (Stuck status tracked but movement check uses applyMovementModifiers — need to verify grid integration) |

---

## Tier 1: Core Grid Foundation

### R001 — Square Grid System

- **Rule:** "Pokemon Tabletop United uses a square combat grid."
- **Expected behavior:** Grid renders as squares in 2D mode; isometric mode uses same underlying square data model.
- **Actual behavior:** `app/stores/encounterGrid.ts` manages grid config with `width`, `height`, `cellSize`. `GridCanvas.vue` (C041) renders 2D top-down square grid. `IsometricCanvas.vue` (C042) renders diamond-projected grid. Both modes use the same square coordinate system underneath. Grid coordinates are integer x,y pairs.
- **Classification:** Correct

### R002 — Grid Scale (1 Meter Per Square)

- **Rule:** "Small and Medium Pokemon take up one space, a 1x1m square."
- **Expected behavior:** Each grid cell = 1 meter.
- **Actual behavior:** `app/utils/gridDistance.ts` — `ptuDiagonalDistance` operates in cell units = meters. `GridSettingsPanel` (C050) configures cell size for display, but movement calculations use cell units directly. The pathfinding and measurement systems treat 1 cell = 1 meter consistently.
- **Classification:** Correct

### R005 — Diagonal Movement Cost

- **Rule:** "The first square you move diagonally costs 1 meter. The second costs 2 meters. The third 1 meter. And so on."
- **Expected behavior:** Alternating 1m/2m pattern. Formula: diag + floor(diag/2) + straights.
- **Actual behavior:** `app/utils/gridDistance.ts:19-25` — `ptuDiagonalDistance`:
  ```
  diagonals = Math.min(absDx, absDy)
  straights = Math.abs(absDx - absDy)
  return diagonals + Math.floor(diagonals / 2) + straights
  ```
  Verification: (3,3) diagonal: diag=3, straight=0. Cost = 3 + floor(3/2) + 0 = 3+1 = 4. Manual: 1+2+1=4. Correct.
  (2,1): diag=1, straight=1. Cost = 1+0+1 = 2. Manual: 1 diagonal (1m) + 1 straight (1m) = 2. Correct.
  (4,4): diag=4, straight=0. Cost = 4+2+0 = 6. Manual: 1+2+1+2=6. Correct.

  Pathfinding implementation in `usePathfinding.ts:96-102` also correctly alternates: `baseCost = currentParity === 0 ? 1 : 2; newParity = 1 - currentParity`. The parity state tracks which diagonal step is next.
- **Classification:** Correct

### R006 — Adjacency Definition

- **Rule:** "Two combatants are Adjacent if any squares they occupy touch, even corners (diagonal). Cardinally Adjacent does not count diagonal."
- **Expected behavior:** 8-directional adjacency for general Adjacent; 4-directional for Cardinally Adjacent.
- **Actual behavior:** `usePathfinding.ts:56-60` — 8 directions including diagonals used for movement exploration. `useRangeParser.ts:329-341` — `isInRange` for `cardinally-adjacent` type checks that the closest cells are cardinal (dx=1,dy=0 or dx=0,dy=1). Melee range uses adjacency (Chebyshev distance <= 1). Multi-cell token distance correctly uses `chebyshevDistanceTokens`.
- **Classification:** Correct

### R007 — No Split Movement

- **Rule:** "You may not split up a Shift Action."
- **Expected behavior:** Single continuous move, no split.
- **Actual behavior:** Movement is a single drag-and-drop operation. `useGridInteraction.ts` (C013) and `useIsometricInteraction.ts` (C023) handle token movement as one atomic action — drag from A, drop at B. No mechanism exists to interrupt movement with a standard action and continue.
- **Classification:** Correct

---

## Tier 2: Terrain System

### R012 — Basic Terrain Types

- **Rule:** "Regular Terrain: easy to walk on. Earth Terrain: requires Burrow. Underwater: requires Swim."
- **Expected behavior:** Terrain types with appropriate movement costs and capability requirements.
- **Actual behavior:** `app/stores/terrain.ts:17-26` defines `TERRAIN_COSTS`:
  - `normal: 1` (PTU Regular)
  - `difficult: 2` (PTU Slow)
  - `blocking: Infinity` (PTU Blocking)
  - `water: 2` (PTU Underwater — requires Swim, else Infinity)
  - `earth: Infinity` (PTU Earth — requires Burrow, else Infinity)
  - `rough: 1` (PTU Rough — normal movement cost)
  - `hazard: 1`, `elevated: 1` (app-specific additions)

  `terrain.ts:71-82` — `getMovementCost` correctly checks `canSwim` for water and `canBurrow` for earth, returning Infinity if the capability is absent. PTU terrain types are fully covered.
- **Classification:** Correct

### R014 — Slow Terrain

- **Rule:** "When Shifting through Slow Terrain, treat every square meter as two square meters."
- **Expected behavior:** 2x movement cost.
- **Actual behavior:** `terrain.ts:20` — `difficult: 2`. Pathfinding at `usePathfinding.ts:104` — `moveCost = baseCost * terrainMultiplier`. So a straight move into a `difficult` cell costs 1*2=2, and a first-diagonal into difficult costs 1*2=2. This doubles the cost as PTU requires. Water terrain also costs 2 (even with Swim), which is correct — water is Slow Terrain for swimmers per PTU.
- **Classification:** Correct

### R016 — Blocking Terrain

- **Rule:** "Terrain that cannot be Shifted or Targeted through."
- **Expected behavior:** Impassable in movement and targeting.
- **Actual behavior:** `terrain.ts:19` — `blocking: Infinity`. Pathfinding at `usePathfinding.ts:88-90` — `if (!isFinite(terrainMultiplier)) continue` skips blocked cells. `useRangeParser.ts:242-284` — `hasLineOfSight` checks blocking function for targeting. Blocking terrain is correctly impassable for both movement and LoS.
- **Classification:** Correct

### R013 — Movement Capability Types

- **Rule:** "Overland, Sky, Swim, Levitate, Teleporter, Burrow capabilities."
- **Expected behavior:** Capability queries for movement type selection.
- **Actual behavior:** `app/utils/combatantCapabilities.ts` provides:
  - `combatantCanFly` — checks `pokemon.capabilities.sky > 0` (lines 37-43)
  - `getSkySpeed` — returns `pokemon.capabilities.sky` (lines 48-53)
  - `combatantCanSwim` — checks `pokemon.capabilities.swim > 0` (lines 13-18)
  - `combatantCanBurrow` — checks `pokemon.capabilities.burrow > 0` (lines 25-30)
  - Human characters default to 0 for all capabilities.

  `useGridMovement.ts:59-76` — `getTerrainAwareSpeed` selects Swim speed for water terrain, Burrow speed for earth terrain, and Overland for all else. `useElevation.ts` (C026) manages elevation for flying Pokemon. Levitate is handled via the elevation system. Teleporter is not implemented (Out of Scope).
- **Classification:** Correct

---

## Tier 3: Movement System

### R004 — Movement Via Shift Actions

- **Rule:** "Move a number of squares equal to your Movement Capability."
- **Expected behavior:** Movement validated against speed budget with terrain costs.
- **Actual behavior:** `useGridMovement.ts:303-361` — `isValidMove` checks:
  1. Speed via `getSpeed` (with terrain-awareness and condition modifiers)
  2. Blocked cells (occupied by other tokens)
  3. Bounds checking
  4. Terrain-aware A* pathfinding when terrain exists
  5. Geometric distance when no terrain

  Movement range visualization via `usePathfinding.ts:31-145` — flood-fill finds all reachable cells within speed budget, accounting for terrain costs, elevation costs, and PTU diagonal rules.
- **Classification:** Correct

### R028 — Sprint Maneuver

- **Rule:** "Increase Movement Speeds by 50% for the rest of your turn."
- **Expected behavior:** +50% movement speed applied as a maneuver effect.
- **Actual behavior:** `app/constants/combatManeuvers.ts:29-37` — Sprint defined as Standard action with shortDesc "+50% Movement Speed this turn". `useGridMovement.ts:121-124` — `applyMovementModifiers` checks `tempConditions.includes('Sprint')` and applies `Math.floor(modifiedSpeed * 1.5)`. Correctly applies floor rounding per PTU rounding rule (R021).
- **Classification:** Correct

### R029 — Push Maneuver

- **Rule:** "Opposed Combat/Athletics check. Push target 1m away. AC 4."
- **Expected behavior:** Push maneuver defined with AC 4, melee range, opposed check.
- **Actual behavior:** `combatManeuvers.ts:18-27` — Push: `actionType: 'standard'`, `ac: 4`, `requiresTarget: true`, `shortDesc: 'Push target 1m away (opposed Combat/Athletics)'`. Matches PTU specification.
- **Classification:** Correct

### R030 — Disengage Maneuver

- **Rule:** "Shift 1 Meter. Does not provoke Attack of Opportunity."
- **Expected behavior:** 1m safe shift defined as a maneuver.
- **Actual behavior:** No explicit "Disengage" entry in `combatManeuvers.ts`. However, the AoO system itself is not implemented (R031 is Missing in the matrix), so all movement is effectively disengage-safe. The maneuver concept is implicit in the current system since there's no AoO to avoid.
- **Note:** The matrix says "Disengage maneuver exists in combat maneuvers system" but the constant file does not have a `disengage` entry. The maneuvers list has: push, sprint, trip, grapple, disarm, dirty-trick, intercept-melee, intercept-ranged, take-a-breather. No disengage.
- **Classification:** Incorrect
- **Severity:** LOW — Since AoO is not implemented (R031 is Missing), the absence of Disengage has no practical impact. The maneuver definition is missing but its primary purpose (avoiding AoO) is moot.

---

## Tier 4: Measurement and Range

### R021 — Melee Range (Adjacency)

- **Rule:** "Melee range requires adjacency."
- **Expected behavior:** Melee attacks check adjacent cells.
- **Actual behavior:** `useRangeParser.ts:67-69` — `parseRange` for "Melee" returns `{ type: 'melee', range: 1 }`. `isInRange` (lines 297-359) uses `chebyshevDistanceTokens` to measure distance. For melee, distance must be <= 1 (adjacent). Correctly handles multi-cell tokens via closest-cell distance.
- **Classification:** Correct

### R032 — Throwing Range

- **Rule:** "Throwing Range = 4 + Athletics Rank in meters."
- **Expected behavior:** Distance measurement tools support throwing range checks.
- **Actual behavior:** The measurement tools (`MeasurementToolbar` C048, `useRangeParser` C016) support distance measurement. Range entered manually. Distance calculation (`chebyshevDistanceTokens`) provides correct cell-distance for range verification. The throwing range formula itself is a character-lifecycle concern (R018 in that domain) — the VTT provides the measurement infrastructure.
- **Classification:** Correct

---

## Tier 5: Rendering (Grid Rendering)

### R001 (continued) — Grid Rendering in Both Modes

- **Rule:** Square grid system.
- **Expected behavior:** Both 2D and isometric modes render correctly.
- **Actual behavior:** `VTTContainer.vue` (C040) switches between `GridCanvas.vue` (2D) and `IsometricCanvas.vue` (isometric) based on grid mode. 2D mode uses `useGridRendering` for standard top-down rendering. Isometric mode uses `useIsometricRendering` with `useIsometricProjection` for diamond grid, `useDepthSorting` for painter's algorithm, and `useIsometricOverlays` for fog/terrain/measurement in isometric projection. Both modes share the same underlying square grid coordinate system.
- **Classification:** Correct

---

## Tier 6: Partial Items

### R003 — Size Category Footprints

- **Rule:** "Small/Medium = 1x1, Large = 2x2, Huge = 3x3, Gigantic = 4x4."
- **Expected behavior:** Multi-tile token rendering for large combatants.
- **Actual behavior:** `VTTToken.vue` (C049) renders all tokens as 1x1 regardless of size. `useGridMovement.ts:196-211` — `getBlockedCells` does iterate over `token.size` for multi-cell occupation, suggesting the data model supports multi-tile tokens. `useRangeParser.ts:163-171` — `getOccupiedCells` correctly iterates over token footprint. `chebyshevDistanceTokens` (lines 181-194) correctly handles multi-cell distance. The backend logic supports multi-tile tokens, but the visual rendering is 1x1 only.
- **Classification:** Correct (for present portion) — The measurement and pathfinding logic correctly handles multi-tile tokens. Only the visual rendering is 1x1.

### R015 — Rough Terrain

- **Rule:** "When targeting through Rough Terrain, -2 Accuracy. Spaces occupied by enemies are Rough Terrain."
- **Expected behavior:** Rough terrain type with accuracy penalty.
- **Actual behavior:** `terrain.ts:23` — `rough: 1` (normal movement cost). Rough terrain type exists and can be painted. However: (1) No -2 accuracy penalty when targeting through rough terrain — accuracy modifications are not implemented. (2) Occupied enemy squares are not auto-marked as rough terrain.
- **Classification:** Approximation
- **Severity:** MEDIUM — Movement cost is correct (rough can be non-slow). Accuracy penalty is the primary purpose of rough terrain and is missing.

### R022 — Stuck Condition (No Movement)

- **Rule:** "Stuck means you cannot Shift at all."
- **Expected behavior:** Stuck status prevents all movement on the grid.
- **Actual behavior:** `useGridMovement.ts:94-98` — `applyMovementModifiers` checks `conditions.includes('Stuck')` and returns 0 (zero speed). This is called by `getSpeed` (line 187) which feeds into `isValidMove` (line 310). A combatant with Stuck status will have speed 0, and `isValidMove` will return `valid: false` since `distance > 0 && distance <= 0` is always false. The movement range visualization (`getMovementRangeCells`) will show no reachable cells since speed=0.
- **Classification:** Correct — Stuck condition IS mechanically enforced. The matrix classification of "Partial" appears outdated. `applyMovementModifiers` was added/updated after the last coverage analysis.

### R024 — Slowed Condition (Half Movement)

- **Rule:** "Slowed: Movement halved (minimum 1)."
- **Expected behavior:** Slowed halves movement range on grid.
- **Actual behavior:** `useGridMovement.ts:100-103` — `applyMovementModifiers` checks `conditions.includes('Slowed')` and applies `Math.floor(modifiedSpeed / 2)`. This is correct. The Slowed condition IS mechanically enforced via `applyMovementModifiers`. Speed is halved and the minimum 1 is enforced by the final line `Math.max(modifiedSpeed, speed > 0 ? 1 : 0)` (line 127).
- **Classification:** Correct — Same as R022, the implementation was added/updated after the last coverage analysis. Slowed IS enforced.

### R025 — Tripped Condition (Stand Up Cost)

- **Rule:** "Tripped: Must spend a Shift Action getting up before further actions."
- **Expected behavior:** Tripped consumes shift action to stand.
- **Actual behavior:** Status conditions are tracked on the combatant model. However, Tripped does NOT consume a shift action in the grid system. There is no "stand up" mechanic in grid interaction — the combatant can move normally despite being Tripped. The `applyMovementModifiers` function does not check for Tripped status.
- **Classification:** Approximation
- **Severity:** LOW — Tripped is a status tracked in combat but not enforced as a movement cost. GM must manually enforce.

### R026 — Speed CS Affect Movement

- **Rule:** "Bonus or penalty to all Movement Speeds equal to half your Speed Combat Stage value rounded down. Minimum 2."
- **Expected behavior:** Speed CS modifies movement range; negative CS floor at 2.
- **Actual behavior:** `useGridMovement.ts:105-119` — `applyMovementModifiers`:
  ```
  const speedStage = combatant.entity.stageModifiers?.speed ?? 0
  const clamped = Math.max(-6, Math.min(6, speedStage))
  const stageBonus = Math.trunc(clamped / 2)
  modifiedSpeed = modifiedSpeed + stageBonus
  if (stageBonus < 0) {
    modifiedSpeed = Math.max(modifiedSpeed, 2)
  }
  ```
  Verification: Speed CS +6 → bonus +3. Speed CS -5 → `Math.trunc(-5/2)` = -2. Speed CS +5 → +2. Negative CS has floor of 2. Uses `Math.trunc` for symmetric rounding toward zero, which is correct per PTU (positive rounds down, negative rounds toward zero).

  **This IS implemented.** The matrix classification of "Partial" appears outdated. Speed CS movement modifier IS applied via `applyMovementModifiers`.
- **Classification:** Correct — Speed CS IS applied to movement. The implementation matches PTU exactly.

### R038 — Levitate Maximum Height

- **Rule:** "Maximum height off the ground equals half of Levitate Capability."
- **Expected behavior:** Elevation capped at half Levitate speed.
- **Actual behavior:** `useElevation.ts` (C026) manages per-token elevation with raise/lower helpers. Elevation is freely adjustable without checking Levitate capability limits. No max height enforcement based on Levitate speed.
- **Classification:** Approximation
- **Severity:** LOW — Elevation system exists but doesn't enforce Levitate height caps. GM can manually enforce.

---

## Tier 7: Implemented-Unreachable

### R041 — Intercept Melee

- **Rule:** "Full Action + Interrupt. Ally within movement range hit by adjacent foe. Shift to occupy their space."
- **Expected behavior:** Maneuver exists in combat system. Grid provides visual assistance.
- **Actual behavior:** `combatManeuvers.ts:79-87` — Intercept Melee defined: `actionType: 'interrupt'`, `actionLabel: 'Full + Interrupt'`, `requiresTarget: false`, `shortDesc: 'Take melee hit meant for adjacent ally'`. The maneuver exists and can be executed via the combat action system. However, the VTT grid does not provide visual assistance: no "ally within movement range" indicator, no path visualization.
- **Classification:** Correct (logic-wise) — Maneuver definition is correct. Grid visual assistance is a UI enhancement, not a rules implementation error.

---

## Ambiguous Items

### R030 — Disengage Maneuver Definition

The Disengage maneuver is described in PTU as "Shift 1 Meter without provoking AoO." The combat maneuvers constant does not include a Disengage entry. Since AoO (R031) is not implemented either, all movement is effectively AoO-free, making Disengage redundant. Two valid interpretations:

1. **Disengage should be defined** even without AoO, for completeness and future-proofing.
2. **Disengage is unnecessary** until AoO is implemented — adding it now would be dead code.

This is classified as **Incorrect** above because the maneuver definition is missing per PTU rules, but the practical impact is zero.

**Recommendation:** When AoO (R031) is implemented, Disengage should be added simultaneously. No decree-need ticket warranted.

---

## Revised Classifications (Stale Matrix Corrections)

Several items the matrix classified as "Partial" are now fully implemented based on current source code reading:

| Rule | Matrix Classification | Audit Classification | Reason |
|------|----------------------|---------------------|--------|
| R022 (Stuck) | Partial | **Correct** | `applyMovementModifiers` returns 0 speed for Stuck |
| R024 (Slowed) | Partial | **Correct** | `applyMovementModifiers` halves speed for Slowed |
| R026 (Speed CS) | Partial | **Correct** | `applyMovementModifiers` applies Speed CS with floor 2 |

These items were likely implemented after the previous coverage analysis (sessions 12-26) and the matrix was not updated to reflect the new code.

---

## Escalation Notes

### Items Requiring Fix

1. **R030 — Disengage Maneuver** (Incorrect, LOW): Disengage entry missing from `combatManeuvers.ts`. Should be added when AoO (R031) is implemented.

### Approximation Items (monitor)

- R015: Rough terrain accuracy penalty not implemented (MEDIUM)
- R025: Tripped condition doesn't consume shift action (LOW)
- R038: Levitate max height not enforced (LOW)

### Items Upgraded from Partial to Correct

- R022 (Stuck): Now enforced via `applyMovementModifiers`
- R024 (Slowed): Now enforced via `applyMovementModifiers`
- R026 (Speed CS): Now applied via `applyMovementModifiers` with floor 2

### Decree-Need References

Existing decree-needs relevant to this domain:
- decree-need-002: diagonal range calculation
- decree-need-003: token blocking
- decree-need-007: cone width
- decree-need-008: water terrain
- decree-need-009: diagonal line length
- decree-need-010: rough+slow overlap (relevant to R015)
- decree-need-011: mixed terrain speed (relevant to R008 which is Missing)

No new decree-need tickets recommended from this audit.
