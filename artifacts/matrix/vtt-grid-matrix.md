---
domain: vtt-grid
type: coverage-matrix
total_rules: 42
total_capabilities: 40
analyzed_at: 2026-03-05T12:00:00Z
analyzed_by: coverage-analyzer
session: 120
previous_session: 59
---

# Feature Completeness Matrix: vtt-grid

## Coverage Score

| Metric | Count |
|--------|-------|
| Total Rules | 42 |
| Out of Scope | 3 |
| Effective Rules (Total - OoS) | 39 |
| Implemented | 30 |
| Implemented-Unreachable | 0 |
| Partial | 5 |
| Missing | 4 |
| Subsystem-Missing | 0 |

**Coverage Score**: `(30 + 0.5*5 + 0.5*0) / 39 * 100` = `(30 + 2.5) / 39 * 100` = **83.3%**

Previous score (session 59): 70.8% -- **+12.5pp improvement**

### Breakdown by Scope

| Scope | Total | Impl | Partial | Missing | OoS |
|-------|-------|------|---------|---------|-----|
| core | 24 | 22 | 1 | 1 | 0 |
| situational | 15 | 7 | 4 | 1 | 3 |
| edge-case | 3 | 1 | 0 | 2 | 0 |

### Changes Since Session 59

| Classification | Session 59 | Session 120 | Delta |
|---------------|-----------|-------------|-------|
| Implemented | 21 | 30 | +9 |
| Partial | 9 | 5 | -4 |
| Missing | 6 | 4 | -2 |
| Out of Scope | 6 | 3 | -3 |

Major reclassifications:
- **R018, R019, R020 (Flanking):** Missing -> Implemented. `flankingGeometry.ts` with `checkFlankingMultiTile`, `useFlankingDetection` composable, evasion penalty applied in `useMoveCalculation.ts`.
- **R031 (AoO):** Missing -> Implemented. `aooTriggers.ts`, `useEncounterOutOfTurn.ts` with detect/resolve, movement-triggered AoO in `useGridMovement.ts`.
- **R022 (Stuck), R024 (Slowed), R025 (Tripped):** Partial -> Implemented. `movementModifiers.ts` enforces all three: Stuck=0, Tripped=0, Slowed=half.
- **R017 (Naturewalk):** Partial -> Implemented. `naturewalkBypassesTerrain()` integrated into `useGridMovement.ts` pathfinding costs.
- **R008 (Mixed Movement):** Partial -> Implemented. `calculateAveragedSpeed`, `buildSpeedAveragingFn` per decree-011.
- **R015 (Rough Terrain):** Partial -> Implemented. `useMoveCalculation.ts` applies -2 accuracy when targeting through rough terrain per decree-025.
- **R033 (Recall Beam Range):** Out of Scope -> Implemented. `switching.service.ts` checks 8m range using `ptuDiagonalDistance`.
- **R034 (Reach):** Out of Scope -> Missing. Reach modifies melee range on the grid; within VTT scope.
- **R035 (Blindness Movement):** Out of Scope -> Out of Scope. Confirmed: combat-domain status interaction.

---

## Full Matrix

### Core Grid System (R001-R007)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R001 | Square Grid System | constraint | core | system | **Implemented** | gm, group | C001, C041, C042 | -- | Square grid in both 2D and isometric modes |
| R002 | Grid Scale (1m Per Square) | constraint | core | system | **Implemented** | gm, group | C001, C035, C050 | -- | 1m per cell. Cell size configurable via GridSettingsPanel. |
| R003 | Size Category Footprints | enumeration | core | system | **Partial** | gm, group | C001, C014, C030, C049 | P1 | **Present:** Multi-cell footprint logic in pathfinding (`usePathfinding` accepts `tokenSize`), movement validation (`useGridMovement` uses `getFootprintCells`), flanking (`checkFlankingMultiTile`), and measurement (`ptuDistanceTokensBBox`). **Missing:** VTT rendering still draws all tokens as 1x1. No visual multi-tile token display for Large (2x2), Huge (3x3), Gigantic (4x4). |
| R004 | Movement Via Shift Actions | workflow | core | gm | **Implemented** | gm | C013, C014, C023, C030 | -- | Token drag-and-drop with A* pathfinding and terrain-aware validation |
| R005 | Diagonal Movement Cost (Alternating 1m/2m) | formula | core | system | **Implemented** | gm | C035, C030 | -- | `ptuDiagonalDistance()` implements alternating rule. Used by pathfinding, range, burst, cone, line per decrees 002, 009, 023. |
| R006 | Adjacency Definition | condition | core | system | **Implemented** | gm | C016, C035 | -- | 8-directional adjacency (cardinal + diagonal). Used by flanking, AoO, melee range. |
| R007 | No Split Movement | constraint | core | system | **Implemented** | gm | C014 | -- | Movement is a single drag operation. Cannot be interrupted by actions. |

### Movement Capabilities (R008-R011)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R008 | Mixed Movement Capabilities | formula | situational | system | **Implemented** | gm | C036, C030, C014 | -- | `calculateAveragedSpeed()` averages Overland/Swim/Burrow when path crosses terrain boundaries. `buildSpeedAveragingFn` wired into flood-fill pathfinding. Per decree-011. |
| R009 | Jump Capability Movement | modifier | situational | system | **Missing** | -- | -- | P3 | No jump movement integration. Jump does not consume shift distance in pathfinding. |
| R010 | Custom Size Shapes | constraint | edge-case | system | **Out of Scope** | -- | -- | -- | Custom token shapes (e.g., 8x2 Steelix) too specialized for VTT. |
| R011 | Small Pokemon Space Sharing | constraint | situational | system | **Missing** | -- | -- | P3 | No space sharing for Small Pokemon. All tokens occupy exclusive cells. |

### Terrain System (R012-R017)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R012 | Basic Terrain Types | enumeration | core | gm | **Implemented** | gm | C003, C046 | -- | 6 base terrain types (normal, rough, water, ice, lava, blocked) + multi-tag flags (rough, slow) per decree-010. TerrainPainter supports all types and flags. |
| R013 | Movement Capability Types | enumeration | core | system | **Partial** | gm | C036, C026, C030, C014 | P2 | **Present:** Overland, Sky, Swim, Burrow detected and integrated into terrain-aware pathfinding (`getSpeedForTerrain` returns appropriate speed per terrain type). Elevation system for Sky. **Missing:** Levitate not integrated into VTT pathfinding (data exists on Pokemon but no VTT movement mode). Teleporter not integrated (no line-of-sight teleport mode, no Sprint limitation). |
| R014 | Slow Terrain | modifier | core | system | **Implemented** | gm | C003, C030 | -- | Slow flag doubles movement cost. Terrain store `getMovementCost` returns 2 for slow cells. Per decree-008, water defaults to cost 1. |
| R015 | Rough Terrain | modifier | core | system | **Implemented** | gm | C003, C046, useMoveCalculation | -- | Multi-tag system: rough flag exists independently of base type (decree-010). -2 accuracy penalty applied in `useMoveCalculation.ts` when targeting through intervening rough terrain. Endpoint cells excluded per decree-025. Enemy-occupied squares treated as rough terrain per decree-003. |
| R016 | Blocking Terrain | constraint | core | system | **Implemented** | gm | C003, C030 | -- | Blocked cells return Infinity cost in pathfinding. Impassable. |
| R017 | Naturewalk Capability | modifier | situational | system | **Implemented** | gm | C036, C014 | -- | `naturewalkBypassesTerrain()` checks Pokemon capabilities against `NATUREWALK_TERRAIN_MAP`. Integrated into `getTerrainCostForCombatant()` -- matching Naturewalk bypasses slow flag (treats as Basic Terrain). Also integrated into `useMoveCalculation.ts` for accuracy penalty bypass. Unit tested. |

### Flanking (R018-R020)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R018 | Flanking | interaction | core | system | **Implemented** | gm | flankingGeometry.ts, useFlankingDetection | -- | `checkFlanking()` detects 2+ non-adjacent foes around target. -2 evasion penalty (`FLANKING_EVASION_PENALTY`). `useFlankingDetection` composable provides reactive `flankingMap`. Integrated into MoveTargetModal accuracy threshold. Size-based thresholds in `FLANKING_FOES_REQUIRED`. |
| R019 | Flanking -- Large Combatant Multi-Square | interaction | situational | system | **Implemented** | gm | flankingGeometry.ts | -- | `checkFlankingMultiTile()` handles multi-tile targets (Large=3 foes, Huge=4, Gigantic=5) and multi-tile attackers (count adjacent squares as contribution). Full P1 implementation. |
| R020 | Flanking Self-Flank Prevention | constraint | core | system | **Implemented** | gm | flankingGeometry.ts | -- | `checkFlanking` requires minimum 2 distinct combatants. Single multi-tile combatant cannot self-flank. Explicit in `FLANKING_FOES_REQUIRED` logic. |

### Range and Melee (R021)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R021 | Melee Range (Adjacency) | condition | core | system | **Implemented** | gm | C016 | -- | Melee range requires adjacency per R006. `useRangeParser` handles melee range checks. |

### Status-Movement Conditions (R022-R025)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R022 | Stuck Condition (No Movement) | condition | core | system | **Implemented** | gm | movementModifiers.ts, C014 | -- | `applyMovementModifiers()` returns 0 when `statusConditions.includes('Stuck')`. Movement range display shows 0 cells. |
| R023 | Ghost Type Stuck/Trapped Immunity | modifier | situational | system | **Partial** | gm | typeStatusImmunity.ts, StatusConditionsModal | P2 | **Present:** `isImmuneToStatus(['Ghost'], 'Stuck')` returns true. StatusConditionsModal prevents applying Stuck/Trapped to Ghost types. Server-side status endpoint also checks immunity. **Missing:** `movementModifiers.ts` does not check Ghost type -- if Stuck status is somehow applied (e.g., direct DB edit), a Ghost Pokemon would still be blocked. Defense-in-depth gap, not a gameplay gap since the status can't be applied through normal UI. |
| R024 | Slowed Condition (Half Movement) | condition | core | system | **Implemented** | gm | movementModifiers.ts, C014 | -- | `applyMovementModifiers()` halves speed when Slowed: `Math.floor(modifiedSpeed / 2)`. Movement range correctly shows halved cells. |
| R025 | Tripped Condition (Stand Up Cost) | condition | core | system | **Implemented** | gm | movementModifiers.ts, C014 | -- | `applyMovementModifiers()` returns 0 when Tripped (must spend Shift Action to stand up). Temp conditions also checked. |

### Speed Modifiers (R026-R028)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R026 | Speed CS Affect Movement | formula | core | system | **Implemented** | gm | movementModifiers.ts, C014 | -- | Speed CS additive bonus: `Math.trunc(stage/2)`. Applied in `applyMovementModifiers`. CS+6 = +3m, CS-6 = -3m. |
| R027 | Speed CS Movement Floor | constraint | core | system | **Implemented** | gm | movementModifiers.ts | -- | `Math.max(modifiedSpeed, 2)` when negative CS applied. Stuck overrides floor (returns 0). |
| R028 | Sprint Maneuver | modifier | core | gm | **Implemented** | gm | movementModifiers.ts, combatManeuvers | -- | Sprint tracked as `tempCondition`. `applyMovementModifiers()` applies `Math.floor(speed * 1.5)`. Sprint in combat maneuvers constant. |

### Combat Maneuvers on Grid (R029-R031)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R029 | Push Maneuver | interaction | core | gm | **Implemented** | gm | combatManeuvers, C014 | -- | Push exists in combat maneuvers with `provokesAoO: 'maneuver_other'`. Position change via token drag. |
| R030 | Disengage Maneuver | modifier | core | gm | **Implemented** | gm | combatManeuvers, C014, aooTriggers | -- | Disengage in combat maneuvers. `disengaged` flag on combatant exempts from shift_away AoO in `getAoOTriggersForMove()`. Movement limited to 1m when disengaged. |
| R031 | Attack of Opportunity (Movement Trigger) | interaction | core | system | **Implemented** | gm | aooTriggers.ts, useEncounterOutOfTurn, C014 | -- | `AOO_TRIGGER_MAP` defines 5 trigger types including `shift_away`. `getAoOTriggersForMove()` in useGridMovement detects adjacent enemy exits. `detectAoO`/`resolveAoO` server-side API. AoO prompts in GM UI. |

### Ranged Rules (R032-R034)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R032 | Throwing Range | formula | core | system | **Implemented** | gm | C016 | -- | Range calculation exists for ranged targeting. `ptuDiagonalDistance` used per decree-002. |
| R033 | Recall Beam Range | constraint | situational | gm | **Implemented** | gm | switching.service.ts | -- | `checkRecallRange()` validates 8m range using `ptuDiagonalDistance`. Integrated into switch endpoint. Blocks switch when Pokemon out of range. |
| R034 | Reach Capability | modifier | situational | system | **Missing** | -- | -- | P2 | Reach extends melee range (Small/Medium=2m, Large+=3m). No VTT integration -- melee range uses standard adjacency (1m) only. `useRangeParser` does not account for Reach capability. |

### Blindness and Special Movement (R035-R040)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R035 | Blindness Movement Penalty | interaction | situational | system | **Out of Scope** | -- | -- | -- | Status-movement interaction. Acrobatics check on rough/slow terrain when blinded is combat-domain behavior. |
| R036 | Total Blindness Movement | interaction | edge-case | system | **Out of Scope** | -- | -- | -- | Extremely specific status-movement interaction requiring direction-relative movement UI. |
| R037 | Teleporter Movement Constraints | constraint | situational | system | **Partial** | gm | C036 | P3 | **Present:** Teleporter speed data exists on Pokemon (`teleport` field in capabilities). **Missing:** No Teleporter movement mode in VTT pathfinding. No line-of-sight check. No Sprint limitation (decree: Teleporter cannot be increased by Sprint). No once-per-round enforcement. |
| R038 | Levitate Maximum Height | formula | situational | system | **Partial** | gm | C026, C036 | P3 | **Present:** Elevation system exists for isometric grid (`useElevation`). Levitate speed data exists on Pokemon. **Missing:** No Levitate height cap enforcement (max = half Levitate speed). No Levitate movement mode distinct from Sky. |
| R039 | Phasing Capability | modifier | situational | system | **Missing** | -- | -- | P3 | No Phasing integration into VTT movement. Phasing bypasses slow terrain and allows intangibility. Not in `useGridMovement` terrain cost calculation. |
| R040 | Falling Damage By Distance and Weight | formula | situational | system | **Missing** | -- | -- | P3 | No falling damage calculation. Elevation changes do not trigger damage. Weight class formula not implemented. |

### Intercept Maneuvers (R041-R042)

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R041 | Intercept Melee | workflow | situational | gm | **Implemented** | gm | combatManeuvers, useEncounterOutOfTurn | -- | Intercept maneuver exists in combat maneuvers. Out-of-turn action system supports interrupt triggers. Grid repositioning via token drag. |
| R042 | Intercept Ranged | workflow | situational | gm | **Implemented** | gm | combatManeuvers, useEncounterOutOfTurn | -- | Same infrastructure as R041. Intercept Ranged uses movement range check. |

---

## Actor Accessibility Summary

| Actor | Total Rules | Reachable | Unreachable | OoS | Partial | Missing |
|-------|------------|-----------|-------------|-----|---------|---------|
| system | 32 | 23 | 0 | 2 | 4 | 3 |
| gm | 10 | 7 | 0 | 1 | 1 | 1 |
| player | 0 | 0 | 0 | 0 | 0 | 0 |

VTT rules are primarily system-automatic (grid engine calculations) or gm-initiated (token movement, terrain painting). The Group View displays the grid read-only via `GroupGridCanvas` (C043). The Capability Mapper identified MS-1 (no player grid interaction) and MS-4 (no player movement requests) as missing subsystems. These are valid product gaps but do not create Implemented-Unreachable classifications because no PTU rules assign VTT-specific grid manipulation actions to players -- players declare movement verbally and the GM executes it on the grid.

No Implemented-Unreachable items exist. All implemented rules are accessible from the correct actor's view (GM for gm-actor rules, system-level for system-actor rules).

---

## Subsystem Gaps

### SG-1: Multi-Tile Token Rendering (Partial)
- **Status:** Backend logic implemented; rendering gap only
- **Missing subsystem:** Visual multi-tile token display on 2D and isometric grids
- **Affected rules:** R003 (1 rule, Partial)
- **Priority:** P1
- **Details:** Pathfinding, movement validation, flanking, and measurement all support `tokenSize` > 1. Only the VTT rendering layer (`VTTToken`, `useGridRendering`, `useIsometricRendering`) still draws all tokens as 1x1 sprites.
- **Suggested ticket:** "feat: render multi-tile tokens (2x2, 3x3, 4x4) on VTT grid"

### ~~SG-2: No Flanking Detection~~ (RESOLVED)
- **Status:** Fully implemented. `flankingGeometry.ts`, `useFlankingDetection`, MoveTargetModal integration.
- **Affected rules:** R018, R019, R020 (3 rules -- all now Implemented)
- **Resolution:** Implemented between sessions 59-120.

### ~~SG-3: No Speed Combat Stage Movement Integration~~ (RESOLVED in session 59)
- **Status:** Already implemented in `applyMovementModifiers`. Confirmed session 59.

### ~~SG-4: No Status-Movement Integration~~ (RESOLVED)
- **Status:** Fully implemented. `movementModifiers.ts` handles Stuck (0), Tripped (0), Slowed (half), Speed CS, Sprint.
- **Affected rules:** R022, R024, R025 (3 rules -- all now Implemented)
- **Resolution:** `movementModifiers.ts` utility extracted and shared between client composables and server services.

### ~~SG-5: No Attack of Opportunity System~~ (RESOLVED)
- **Status:** Fully implemented. `aooTriggers.ts`, `useEncounterOutOfTurn`, server-side detect/resolve API.
- **Affected rules:** R031 (1 rule -- now Implemented)
- **Resolution:** AoO system with 5 trigger types, GM prompts, Disengage integration.

### SG-6: No Levitate/Teleporter VTT Movement Modes
- **Missing subsystem:** VTT pathfinding for Levitate and Teleporter movement capabilities
- **Affected rules:** R013 (contributes to Partial), R037 (Partial), R038 (Partial)
- **Priority:** P3
- **Details:** Levitate and Teleporter speed data exists on Pokemon entities but no VTT pathfinding mode uses them. Levitate has no height cap enforcement. Teleporter has no line-of-sight check, Sprint limitation, or once-per-round enforcement.
- **Suggested ticket:** "feat: add Levitate and Teleporter movement modes to VTT pathfinding"

---

## Gap Priorities Summary

| Priority | Count | Rules |
|----------|-------|-------|
| P1 | 1 | R003 |
| P2 | 2 | R023, R034 |
| P3 | 6 | R009, R011, R037, R038, R039, R040 |

### P1 Gaps (1)
- **R003 (Size Category Footprints):** Backend supports multi-tile; rendering does not. High impact for Large/Huge/Gigantic encounters.

### P2 Gaps (2)
- **R023 (Ghost Type Stuck/Trapped Immunity):** Defense-in-depth gap in movement modifiers. Status application is blocked at UI and API level, but `movementModifiers.ts` does not redundantly check Ghost type.
- **R034 (Reach Capability):** Melee range always uses adjacency (1m). Reach Pokemon (Small/Medium=2m, Large+=3m) not reflected in VTT range calculations.

### P3 Gaps (6)
- **R009 (Jump):** No jump movement. Low impact; GM can manually allow jumps.
- **R011 (Small Space Sharing):** No space sharing. All tokens occupy exclusive cells.
- **R037 (Teleporter Constraints):** No Teleporter movement mode.
- **R038 (Levitate Height Cap):** Elevation exists but no height cap enforcement.
- **R039 (Phasing):** No Phasing movement bypass.
- **R040 (Falling Damage):** No falling damage formula.

---

## Decree Compliance Check

| Decree | Status | Verification |
|--------|--------|-------------|
| decree-002 | Compliant | `ptuDiagonalDistance` used for all grid distances. No Chebyshev anywhere. Range, burst (decree-023), cone, line all use PTU diagonal. |
| decree-003 | Compliant | Tokens passable. Enemy-occupied squares = rough terrain accuracy penalty. No-stacking enforced in pathfinding. |
| decree-007 | Compliant | Cone shapes use fixed 3-wide rows per PTU literal text. |
| decree-008 | Compliant | Water terrain defaults to cost 1 (basic). GM can overlay slow flag for rough currents. |
| decree-009 | Compliant | Diagonal Line attacks shortened per alternating diagonal rule. |
| decree-010 | Compliant | Multi-tag terrain: `TerrainFlags { rough, slow }` per cell. Rough affects accuracy only; slow affects movement cost only. |
| decree-011 | Compliant | Path-based speed averaging via `calculateAveragedSpeed` and `buildSpeedAveragingFn`. |
| decree-023 | Compliant | Burst shapes use PTU alternating diagonal distance, not Chebyshev. |
| decree-024 | Compliant | Diagonal cones include corner cell (7-cell diamond pattern). |
| decree-025 | Compliant | Endpoint cells excluded from rough terrain accuracy penalty check. |

---

## Auditor Queue

Prioritized list for the Implementation Auditor. All Implemented items first (verify correctness), then Partial items (verify present portion). Ordered: core scope first, formulas/conditions first, foundation before derived.

### Tier 1: Core Formulas and Conditions (Foundation)
1. **R005** -- Diagonal movement cost (`ptuDiagonalDistance` in `gridDistance.ts`) -- verify alternating 1m/2m. Decrees: 002, 009, 023.
2. **R002** -- Grid scale (`encounterGrid.ts` cellSize) -- verify 1m per cell default.
3. **R026** -- Speed CS modifier (`movementModifiers.ts`) -- verify `Math.trunc(stage/2)` additive bonus.
4. **R027** -- Speed CS floor (`movementModifiers.ts`) -- verify `Math.max(modifiedSpeed, 2)` for negative CS.
5. **R022** -- Stuck condition (`movementModifiers.ts`) -- verify returns 0.
6. **R024** -- Slowed condition (`movementModifiers.ts`) -- verify `Math.floor(speed / 2)`.
7. **R025** -- Tripped condition (`movementModifiers.ts`) -- verify returns 0.
8. **R006** -- Adjacency definition (`useRangeParser.ts`, `flankingGeometry.ts`) -- verify 8-directional.
9. **R021** -- Melee range (`useRangeParser.ts`) -- verify adjacency check.
10. **R032** -- Throwing range (`useRangeParser.ts`) -- verify uses `ptuDiagonalDistance` per decree-002.

### Tier 2: Core Constraints and Enumerations
11. **R001** -- Square grid system (`VTTContainer`, `GridCanvas`, `IsometricCanvas`) -- verify both modes render square grid.
12. **R007** -- No split movement (`useGridMovement.ts`) -- verify single drag operation.
13. **R016** -- Blocking terrain (`terrain.ts`, `usePathfinding.ts`) -- verify Infinity cost.
14. **R014** -- Slow terrain (`terrain.ts`, `usePathfinding.ts`) -- verify double cost. Decree-008: water cost 1.
15. **R015** -- Rough terrain (`useMoveCalculation.ts`) -- verify -2 accuracy penalty through rough. Decree-025: exclude endpoints. Decree-003: enemy squares = rough.
16. **R012** -- Basic terrain types (`terrain.ts`, `TerrainPainter.vue`) -- verify 6 types + multi-tag flags. Decree-010.

### Tier 3: Core Interactions (Flanking, AoO)
17. **R018** -- Flanking (`flankingGeometry.ts`, `useFlankingDetection.ts`) -- verify non-adjacent foe pair detection, -2 evasion penalty, size thresholds.
18. **R019** -- Flanking multi-tile (`checkFlankingMultiTile`) -- verify multi-tile target thresholds (Large=3, Huge=4, Gigantic=5) and multi-tile attacker contribution counting.
19. **R020** -- Self-flank prevention (`checkFlanking`) -- verify minimum 2 distinct combatants required.
20. **R031** -- AoO movement trigger (`aooTriggers.ts`, `getAoOTriggersForMove`) -- verify shift_away detection for adjacent enemy exits. Verify Disengage exemption (`disengaged` flag).

### Tier 4: Core Workflows and Maneuvers
21. **R004** -- Movement via shift (`useGridInteraction`, `useGridMovement`, `useIsometricInteraction`) -- verify drag-and-drop movement chain with validation.
22. **R028** -- Sprint maneuver (`movementModifiers.ts`) -- verify +50% (`Math.floor(speed * 1.5)`).
23. **R029** -- Push maneuver (combatManeuvers constant) -- verify exists with `provokesAoO`.
24. **R030** -- Disengage maneuver (`useGridMovement.ts`) -- verify 1m clamp when disengaged, AoO exemption.
25. **R033** -- Recall beam range (`switching.service.ts`) -- verify 8m check using `ptuDiagonalDistance`.
26. **R041/R042** -- Intercept maneuvers (combatManeuvers, `useEncounterOutOfTurn`) -- verify existence and interrupt trigger support.

### Tier 5: Situational Implemented Items
27. **R008** -- Mixed movement (`calculateAveragedSpeed`, `buildSpeedAveragingFn`) -- verify terrain boundary detection and speed averaging. Decree-011.
28. **R017** -- Naturewalk (`naturewalkBypassesTerrain`, `useGridMovement.ts`) -- verify slow flag bypass for matching Naturewalk. Verify accuracy penalty bypass in `useMoveCalculation.ts`.

### Tier 6: Partial Items (Verify Present Portion)
29. **R003** -- Size footprints -- verify pathfinding `tokenSize` parameter, `getFootprintCells`, `isFootprintInBounds`. Verify flanking `checkFlankingMultiTile`. Verify measurement `ptuDistanceTokensBBox`. Flag rendering gap.
30. **R013** -- Movement capabilities -- verify Overland/Sky/Swim/Burrow speed selection in `getSpeedForTerrain`. Verify elevation for Sky. Flag Levitate/Teleporter gap.
31. **R023** -- Ghost immunity -- verify `isImmuneToStatus(['Ghost'], 'Stuck')` returns true. Verify StatusConditionsModal blocks application. Flag movementModifiers defense-in-depth gap.
32. **R037** -- Teleporter -- verify `teleport` field exists on Pokemon data. Flag missing VTT pathfinding mode.
33. **R038** -- Levitate height -- verify `useElevation` composable exists with elevation bounds. Flag missing height cap enforcement.
