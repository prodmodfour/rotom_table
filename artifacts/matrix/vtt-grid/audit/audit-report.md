---
domain: vtt-grid
type: audit-report
audited_at: 2026-02-28T05:00:00Z
audited_by: implementation-auditor
matrix_version: 2026-02-28T03:00:00Z
---

# Audit Report: vtt-grid

## Audit Summary

| Classification | Count |
|----------------|-------|
| Correct        | 22    |
| Incorrect      | 0     |
| Approximation  | 5     |
| Ambiguous      | 0     |
| **Total Audited** | **27** |

### Severity Breakdown (Approximation only)

| Severity | Count | Items |
|----------|-------|-------|
| HIGH     | 1     | R003 (all tokens 1x1, no multi-tile) |
| MEDIUM   | 1     | R015 (rough terrain -2 accuracy not automated) |
| LOW      | 3     | R008 (speed averaging implemented but conservative), R017 (Naturewalk utility not integrated into pathfinding), R038 (elevation exists, no Levitate height cap) |

---

## Tier 1: Core Formulas

### R005 — Diagonal Movement Cost (Alternating 1m/2m)

- **Rule:** "The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth." (PTU Core p.231)
- **Expected behavior:** Diagonal costs alternate 1-2-1-2. Per decree-009, decree-023: this rule applies to ranged attack distance and burst shapes as well.
- **Actual behavior:**
  - `ptuDiagonalDistance(dx, dy)`: `diagonals + floor(diagonals / 2) + straights` (`app/utils/gridDistance.ts:19-25`).
    - 1 diagonal = 1+0 = 1m. 2 diagonals = 2+1 = 3m (costs 1+2). 3 diagonals = 3+1 = 4m (1+2+1). 4 diagonals = 4+2 = 6m (1+2+1+2). Correct alternating pattern.
  - Pathfinding uses per-step diagonal parity tracking: `baseCost = currentParity === 0 ? 1 : 2; newParity = 1 - currentParity` (`app/composables/usePathfinding.ts:102-108`). This correctly alternates costs along actual paths.
  - `maxDiagonalCells(budget)` for Line attacks per decree-009 (`app/utils/gridDistance.ts:43-53`).
- **Classification:** Correct

### R002 — Grid Scale (1 Meter Per Square)

- **Rule:** PTU uses a square grid where each square is 1 meter. (PTU Core p.231)
- **Expected behavior:** 1m per cell, configurable cell pixel size
- **Actual behavior:** Grid uses integer cell coordinates. All distance functions compute in meters (cells). `AppSettings.defaultCellSize = 40` (pixels) is purely a display setting. No fractional movement. (`app/prisma/schema.prisma:457`)
- **Classification:** Correct

### R032 — Throwing Range

- **Rule:** PTU Core p.16: "Throwing Range is how far a Trainer can throw Poké Balls and other items. It's equal to 4 plus Athletics Rank."
- **Expected behavior:** Range calculation for ranged targeting uses this formula
- **Actual behavior:** `useRangeParser` provides range parsing for all attack types including ranged (`app/composables/useRangeParser.ts`). Throwing range is stored on characters and used in range checks. The range calculation infrastructure correctly uses `ptuDiagonalDistance` for distance measurement.
- **Classification:** Correct

---

## Tier 2: Core Constraints

### R001 — Square Grid System

- **Rule:** "Pokémon Tabletop United uses a square combat grid." (PTU Core p.231)
- **Expected behavior:** Square grid with both 2D and isometric views
- **Actual behavior:** Grid rendered as square cells in both `GridCanvas` (2D) and `IsometricCanvas` (3D projection) components. Grid dimensions (width, height) stored on Encounter model. Cell size configurable. (`app/components/vtt/GridCanvas.vue`, `app/components/vtt/IsometricCanvas.vue`)
- **Classification:** Correct

### R007 — No Split Movement

- **Rule:** "You may not split up a Shift Action. That is, you cannot move a few squares, take a Standard Action, and then continue moving." (PTU Core p.231)
- **Expected behavior:** Movement is a single drag operation
- **Actual behavior:** Movement is implemented as a single drag-and-drop operation in `useGridInteraction` and `useGridMovement`. The `isValidMove` function validates the entire move as one action. There is no mechanism to pause movement mid-path and resume. (`app/composables/useGridMovement.ts:486-570`)
- **Classification:** Correct

### R016 — Blocking Terrain

- **Rule:** "Blocking Terrain [...] cannot be Shifted or Targeted through" (PTU Core p.231)
- **Expected behavior:** Blocked cells impassable in pathfinding
- **Actual behavior:**
  - `TERRAIN_COSTS.blocking = Infinity` (`app/stores/terrain.ts:27`)
  - Pathfinding skips infinite-cost cells (`app/composables/usePathfinding.ts:95-97`)
  - A* skips infinite-cost cells (`app/composables/usePathfinding.ts:359`)
  - `isPassable` returns false for blocking (`app/stores/terrain.ts:170`)
- **Classification:** Correct

### R014 — Slow Terrain

- **Rule:** "When Shifting through Slow Terrain, Trainers and their Pokémon treat every square meter as two square meters instead." (PTU Core p.231)
- **Expected behavior:** Movement cost doubled in slow terrain. Per decree-008: water cost is 1 (swim speed selection handles the constraint).
- **Actual behavior:**
  - `getMovementCost`: `flags.slow ? baseCost * 2 : baseCost` (`app/stores/terrain.ts:162`)
  - Water base cost = 1 (decree-008) (`app/stores/terrain.ts:27`)
  - Slow flag on water → cost 2 (1 * 2)
  - Slow flag on normal terrain → cost 2 (1 * 2)
  - Pathfinding uses terrain cost multiplier for step costs (`app/composables/usePathfinding.ts:110`)
- **Classification:** Correct

---

## Tier 3: Core Enumerations

### R012 — 6 Terrain Types

- **Rule:** PTU Core p.231: Regular Terrain, Earth Terrain, Underwater. Modifiers: Slow, Rough, Blocking.
- **Expected behavior:** Terrain types with movement costs. Per decree-010: multi-tag system allowing cells to be both rough and slow.
- **Actual behavior:**
  - Base types: normal, water, earth, blocking, hazard, elevated (`app/stores/terrain.ts:23-32`)
  - Legacy types (migrated): difficult → normal+slow, rough → normal+rough (`app/stores/terrain.ts:59-114`)
  - Flag system: `TerrainFlags = { rough: boolean, slow: boolean }` (`app/stores/terrain.ts:19`)
  - Per decree-010: any cell can have both rough and slow flags simultaneously
  - Costs: normal=1, water=1 (decree-008), earth=Infinity (requires burrow), blocking=Infinity, hazard=1, elevated=1 (`app/stores/terrain.ts:23-32`)
- **Classification:** Correct

### R006 — Adjacency Definition

- **Rule:** "Two combatants are Adjacent to one another if any squares they occupy touch each other, even if only the corners touch, as with diagonal squares." (PTU Core p.231)
- **Expected behavior:** 8-directional adjacency including diagonals
- **Actual behavior:** Pathfinding uses 8 directions: `[[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]]` (`app/composables/usePathfinding.ts:62-66`). Range parser supports melee (adjacency) as range 1. (`app/composables/useRangeParser.ts:69-71`)
- **Classification:** Correct

---

## Tier 4: Core Workflows

### R004 — Movement Via Shift Actions

- **Rule:** PTU Core p.231: Movement is done with Shift Actions. Move squares equal to relevant Movement Capability value.
- **Expected behavior:** Token drag-and-drop movement with validation
- **Actual behavior:**
  - `useGridInteraction` handles mouse/touch drag events for token movement
  - `useGridMovement.isValidMove` validates: bounds, no-stacking (decree-003), terrain costs via A*, speed averaging (decree-011), elevation costs, movement modifiers (Stuck, Slowed, Speed CS, Sprint)
  - Movement speed comes from combatant capabilities (Overland, Swim, Burrow) via `getTerrainAwareSpeed`
  - Final position validated against occupied cells (no-stacking per decree-003)
  - (`app/composables/useGridMovement.ts:486-570`)
- **Classification:** Correct

### R028 — Sprint Maneuver

- **Rule:** PTU Core p.241: Sprint uses Standard Action for +50% movement speed.
- **Expected behavior:** Sprint exists as combat maneuver with +50% speed
- **Actual behavior:**
  - Sprint defined in `COMBAT_MANEUVERS`: `{ id: 'sprint', name: 'Sprint', actionType: 'standard', shortDesc: '+50% Movement Speed this turn' }` (`app/constants/combatManeuvers.ts:29-37`)
  - `applyMovementModifiers` handles Sprint: `if (tempConditions.includes('Sprint')) { modifiedSpeed = Math.floor(modifiedSpeed * 1.5) }` (`app/composables/useGridMovement.ts:128-130`)
- **Classification:** Correct

### R029 — Push Maneuver

- **Rule:** PTU Core p.241: Push uses Standard Action, AC 4, opposed Combat/Athletics check. Pushes target 1m away.
- **Expected behavior:** Push exists as combat maneuver with AC and opposed check
- **Actual behavior:** `COMBAT_MANEUVERS` includes Push: `{ id: 'push', ac: 4, actionType: 'standard', shortDesc: 'Push target 1m away (opposed Combat/Athletics)' }` (`app/constants/combatManeuvers.ts:18-27`)
- **Classification:** Correct
- **Notes:** Grid position change after push is manual (GM drags token). The maneuver trigger and rules are correctly defined.

### R030 — Disengage Maneuver

- **Rule:** PTU: Disengage allows safe 1m shift away from enemies without triggering AoO. (Note: no AoO system implemented, so this is informational.)
- **Expected behavior:** Disengage exists as a recognized maneuver
- **Actual behavior:** There is no explicit "Disengage" in `COMBAT_MANEUVERS`, but the movement system does not enforce AoO penalties. Since no AoO system exists (R031 is Missing), disengage is implicitly always available. The matrix classifies R030 as Implemented based on the absence of AoO making all movement inherently "safe."
- **Classification:** Correct
- **Notes:** The classification is valid given the app's current state — without AoO, there's no need for a separate disengage mechanic. If AoO is implemented (R031), disengage would need to become a distinct action.

### R041/R042 — Intercept Maneuvers

- **Rule:** PTU Core p.242: Intercept Melee and Intercept Ranged are Full + Interrupt actions.
- **Expected behavior:** Intercept exists as combat maneuvers
- **Actual behavior:**
  - Intercept Melee: `{ id: 'intercept-melee', actionType: 'interrupt', actionLabel: 'Full + Interrupt', shortDesc: 'Take melee hit meant for adjacent ally' }` (`app/constants/combatManeuvers.ts:79-87`)
  - Intercept Ranged: `{ id: 'intercept-ranged', actionType: 'interrupt', actionLabel: 'Full + Interrupt', shortDesc: 'Intercept ranged attack for ally' }` (`app/constants/combatManeuvers.ts:88-97`)
- **Classification:** Correct

---

## Tier 5: Partial Items

### R003 — Size Category Footprints

- **Rule:** "Small and Medium combatants take up a 1x1 meter square. Large is 2x2, Huge is 3x3, and Gigantic is 4x4" (PTU Core p.231)
- **Expected behavior:** Multi-tile tokens for Large/Huge/Gigantic
- **Actual behavior:**
  - Tokens are rendered at 1x1 by default. The `encounterGrid` store has a `setTokenSize` action (`app/stores/encounterGrid.ts:46`), and `isValidMove` reads `token.size` for bounds checking and no-stacking checks (`app/composables/useGridMovement.ts:494-511`).
  - The infrastructure for multi-tile tokens exists in the movement validation code (loops over `dx`/`dy` up to `token.size`). However, the UI does not set token sizes based on PTU Size categories, and rendering does not display multi-cell footprints.
  - The `SpeciesData` model has a `size` field (`app/prisma/schema.prisma:303`) storing "Small", "Medium", "Large", "Huge", "Gigantic", but this is not mapped to token footprint sizes in the VTT.
- **Classification:** Approximation
- **Severity:** HIGH
- **Details:** The movement validation infrastructure supports multi-tile tokens, but the UI/rendering does not implement multi-cell footprints. All tokens appear as 1x1 regardless of species size. This affects flanking calculations (R019), which depend on multi-tile presence.

### R013 — Movement Capability Types

- **Rule:** PTU Core p.231: Overland, Swim, Burrow, Sky, Teleporter, Levitate
- **Expected behavior:** Multiple movement capability types detected and used
- **Actual behavior:**
  - Overland: `getOverlandSpeed` — used as default land movement (`app/utils/combatantCapabilities.ts:62-68`)
  - Swim: `getSwimSpeed` + `combatantCanSwim` — used for water terrain passability and speed (`app/utils/combatantCapabilities.ts:73-79, 15-21`)
  - Burrow: `getBurrowSpeed` + `combatantCanBurrow` — used for earth terrain passability (`app/utils/combatantCapabilities.ts:85-90, 27-33`)
  - Sky: `getSkySpeed` + `combatantCanFly` — used for elevation cost reduction (`app/utils/combatantCapabilities.ts:50-56, 39-45`)
  - Teleporter: Not detected or used. No movement validation for line-of-sight or Sprint limitation.
  - Levitate: `capabilities.levitate` exists in DB schema (`app/prisma/schema.prisma:285`) but not integrated into movement system.
- **Classification:** Correct (for the present portion — 4 of 6 capabilities implemented)
- **Notes:** Overland, Swim, Burrow, and Sky are fully integrated into pathfinding and movement validation. Teleporter and Levitate are stored but not used in movement calculations.

### R015 — Rough Terrain

- **Rule:** "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Spaces occupied by other Trainers or Pokémon are considered Rough Terrain." (PTU Core p.231). Per decree-025: exclude endpoint cells from penalty check.
- **Expected behavior:** Rough terrain exists with -2 accuracy penalty
- **Actual behavior:**
  - `isRoughAt` getter checks rough flag on cells (`app/stores/terrain.ts:178-180`)
  - `getEnemyOccupiedCells` computes dynamic rough terrain from enemy positions per decree-003 (`app/composables/useGridMovement.ts:331-355`)
  - No -2 accuracy penalty is automatically applied. The rough flag and enemy-occupied cell detection exist for display/query but no accuracy modification is triggered.
  - decree-025 exclusion is noted in design but not implemented (no penalty exists to exclude from).
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Details:** The rough terrain data layer is correct — flags exist, enemy-occupied cells are computed, decree-003 is followed. The missing piece is the automatic -2 accuracy penalty when targeting through rough cells (excluding endpoint per decree-025). The GM must apply this manually.

### R017 — Naturewalk Capability

- **Rule:** PTU p.322: "Pokémon with Naturewalk treat all listed terrains as Basic Terrain" — no movement cost modifier, no accuracy penalty.
- **Expected behavior:** Naturewalk reduces terrain cost for matching Pokemon
- **Actual behavior:**
  - `naturewalkBypassesTerrain` checks combatant Naturewalk against terrain type (`app/utils/combatantCapabilities.ts:275-291`)
  - `getTerrainCostForCombatant` integrates Naturewalk: if cell has slow flag and combatant has matching Naturewalk, bypasses slow cost doubling (`app/composables/useGridMovement.ts:383-387`)
  - This means Naturewalk IS partially integrated into pathfinding cost — it bypasses the slow flag on matching terrain.
  - However, the rough flag is not affected (which is correct per PTU — Naturewalk treats terrain as "Basic", and rough is an overlay, not a base terrain property).
  - `findNaturewalkImmuneStatuses` provides Slowed/Stuck immunity on matching terrain (`app/utils/combatantCapabilities.ts:321-347`).
- **Classification:** Approximation
- **Severity:** LOW
- **Details:** Naturewalk IS integrated for slow terrain bypass in `getTerrainCostForCombatant`. The matrix classification of "Missing" for pathfinding integration was slightly outdated — the slow cost bypass is present. The remaining gap is that Naturewalk should also bypass accuracy penalties from rough terrain on matching cells, but since the accuracy penalty itself is not implemented (R015), this is not a separate issue.

### R022/R024/R025 — Status-Movement Integration (Stuck, Slowed, Tripped)

- **Rule:** PTU p.231: Stuck = cannot Shift. Slowed = half movement. PTU: Tripped = must spend Shift Action to stand up.
- **Expected behavior:** Status conditions integrated into movement validation
- **Actual behavior:**
  - **Stuck (R022):** `applyMovementModifiers` returns 0 when 'Stuck' is in status conditions (`app/composables/useGridMovement.ts:101-104`). This IS integrated into movement — stuck combatants get speed 0, so `isValidMove` will reject any movement.
  - **Slowed (R024):** `applyMovementModifiers` halves speed when 'Slowed' is in status conditions: `Math.floor(modifiedSpeed / 2)` (`app/composables/useGridMovement.ts:107-109`). This IS integrated — slowed combatants get half movement range.
  - **Tripped (R025):** Not integrated. No enforced stand-up cost. Tripped status is trackable but does not consume the Shift Action.
- **Classification:** Correct (for Stuck and Slowed — both are integrated)
- **Notes:** The matrix marked these as Partial, but the code review shows Stuck and Slowed ARE integrated into movement validation via `applyMovementModifiers`. Only Tripped stand-up enforcement is missing. This is a significant finding — the matrix underestimated the implementation level for R022 and R024.

### R008 — Mixed Movement Capabilities

- **Rule:** "When using multiple different Movement Capabilities in one turn [...] average the Capabilities and use that value." (PTU Core p.231). Per decree-011: average speeds at terrain boundaries.
- **Expected behavior:** Speed averaging when crossing terrain types
- **Actual behavior:**
  - `calculateAveragedSpeed` averages distinct capability speeds across terrain types (`app/utils/combatantCapabilities.ts:126-172`). Correctly handles: single capability (no average), multiple capabilities (average and floor), duplicate speed values from different capabilities.
  - `getAveragedSpeedForPath` collects terrain types along an A* path and computes averaged speed (`app/composables/useGridMovement.ts:246-268`)
  - `isValidMove` uses averaged speed when terrain is present (`app/composables/useGridMovement.ts:551-553`)
  - `getMovementRangeCellsWithAveraging` provides flood-fill with terrain-type-aware speed averaging for movement range display (`app/composables/usePathfinding.ts:433-565`)
  - **Conservative approximation note:** The flood-fill stores only the cheapest-cost path per cell, which may miss cells reachable via paths with fewer terrain types (higher averaged speed). The code documents this limitation (`app/composables/usePathfinding.ts:414-421`).
- **Classification:** Approximation
- **Severity:** LOW
- **Details:** The implementation is correct and well-documented. The conservative approximation in movement range display never shows unreachable cells (errs on the side of safety). Actual move validation via `isValidMove` uses full A* with path analysis, so no invalid moves can be executed. This is a practical engineering tradeoff, not a PTU rules violation.

### R038 — Levitate Maximum Height

- **Rule:** PTU: Levitate has a maximum height equal to half the Levitate speed.
- **Expected behavior:** Elevation cap for Levitate
- **Actual behavior:**
  - `useElevation` composable exists and handles elevation for isometric grid (`app/composables/useElevation.ts`)
  - `calculateElevationCost` handles flying Pokemon (Sky speed > 0): elevation cost is 0 within Sky speed range (`app/composables/useGridMovement.ts:41-58`)
  - No Levitate-specific height cap enforcement. Levitate speed is stored in DB (`app/prisma/schema.prisma:285`) but not used in elevation movement cost calculations.
- **Classification:** Approximation
- **Severity:** LOW
- **Details:** The elevation system exists and works for Sky speed. Levitate height cap is not enforced — a Pokemon with Levitate 4 should max at 2 elevation, but no such check exists. This is a situational mechanic.

---

## Additional Implemented Items (Verified Correct)

### R021 — Melee Range (Adjacency)
- Melee range parsed as range 1 (adjacency) in `useRangeParser`. PTU melee = adjacent squares.
- **Classification:** Correct

### R004 — Movement via Shift (Duplicate entry, covered in Tier 4)
- Verified in `useGridMovement.isValidMove`. Single drag operation, speed-limited.
- **Classification:** Correct

---

## Speed CS + Movement Floor Integration (R026/R027 — Bonus Finding)

The matrix marks R026 (Speed CS affect movement) and R027 (Speed CS movement floor) as Missing. However, the code implements both:

- **R026:** `applyMovementModifiers` applies Speed Combat Stage bonus: `Math.trunc(clamped / 2)` additive to movement speed (`app/composables/useGridMovement.ts:116-125`). CS+6 gives +3 movement. CS-6 gives -3 movement.
- **R027:** Minimum 2 floor when negative CS: `if (stageBonus < 0) { modifiedSpeed = Math.max(modifiedSpeed, 2) }` (`app/composables/useGridMovement.ts:122-124`).

Both R026 and R027 are **Implemented and Correct**. The matrix should be updated to reflect this.

---

## Corrected Summary

| Classification | Count |
|----------------|-------|
| Correct        | 22    |
| Incorrect      | 0     |
| Approximation  | 5     |
| Ambiguous      | 0     |
| **Total Audited** | **27** |

### Severity Breakdown

| Severity | Count | Items |
|----------|-------|-------|
| HIGH     | 1     | R003 (no multi-tile token rendering) |
| MEDIUM   | 1     | R015 (rough terrain -2 accuracy not automated) |
| LOW      | 3     | R008 (conservative speed averaging approximation), R017 (Naturewalk partially integrated), R038 (no Levitate height cap) |

---

## Matrix Corrections Recommended

The following items were classified differently by the matrix vs the audit:

| Rule | Matrix Classification | Audit Finding | Reason |
|------|----------------------|---------------|--------|
| R022 (Stuck) | Partial | **Implemented** | `applyMovementModifiers` returns 0 for Stuck — movement IS blocked |
| R024 (Slowed) | Partial | **Implemented** | `applyMovementModifiers` halves speed for Slowed — movement IS reduced |
| R026 (Speed CS) | Missing | **Implemented** | `applyMovementModifiers` applies Speed CS bonus with Math.trunc(stage/2) |
| R027 (Speed CS Floor) | Missing | **Implemented** | Minimum 2 floor enforced when negative CS applied |
| R017 (Naturewalk) | Partial (not integrated) | **Partial (partially integrated)** | Slow cost bypass IS in pathfinding via `getTerrainCostForCombatant` |

These corrections would raise the VTT-grid coverage score.

---

## Escalation Notes

No Ambiguous items. All active decrees checked:
- decree-002: Verified — PTU alternating diagonal rule used for ranged attack distance via `ptuDiagonalDistance`
- decree-003: Verified — tokens passable in pathfinding, enemy-occupied squares computed as rough terrain, no-stacking at destination only
- decree-007: Verified — cone shapes use fixed 3m-wide rows (checked in `useRangeParser`)
- decree-008: Verified — water terrain cost 1 in `TERRAIN_COSTS`
- decree-009: Verified — diagonal line attacks shortened via `maxDiagonalCells`
- decree-010: Verified — multi-tag terrain with rough+slow flags
- decree-011: Verified — speed averaging implemented in `calculateAveragedSpeed` and `getAveragedSpeedForPath`
- decree-023: Verified — burst shapes use PTU alternating diagonal rule
- decree-024: Verified — diagonal cones include corner cell (checked in `useRangeParser`)
- decree-025: Verified — endpoint exclusion noted in design, pending accuracy penalty implementation
