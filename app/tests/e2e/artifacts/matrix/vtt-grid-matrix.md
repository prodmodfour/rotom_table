---
domain: vtt-grid
analyzed_at: 2026-02-26T14:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: vtt-grid-rules.md
capabilities_catalog: vtt-grid-capabilities.md
---

# Feature Completeness Matrix: VTT Grid

## Coverage Score

```
Implemented:              19
Implemented-Unreachable:   1
Partial:                   6
Missing:                   8
Subsystem-Missing:         0
Out of Scope:              8
---
Total:                    42
Effective Total:          34  (42 - 8 Out of Scope)

Coverage = (19 + 0.5*1 + 0.5*6) / 34 * 100
         = (19 + 0.5 + 3) / 34 * 100
         = 22.5 / 34 * 100
         = 66.2%
```

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|-----------------|-------------|-------|
| R001 | Square Grid System | constraint | core | system | **Implemented** | gm, group | — | C001 (encounterGrid store: grid with configurable width, height, cellSize), C041 (GridCanvas renders square grid), C042 (IsometricCanvas renders diamond grid — same underlying square data model). Both 2D and isometric modes use square grid coordinates. |
| R002 | Grid Scale (1m per square) | constraint | core | system | **Implemented** | gm, group | — | C035 (ptuDiagonalDistance operates in cell units = meters), C050 (GridSettingsPanel configures cell size). Grid cells represent 1m squares per PTU convention. |
| R003 | Size Category Footprints | enumeration | core | system | **Partial** | gm, group | P2 | **Present:** Token rendering exists (C049 VTTToken). **Missing:** No multi-tile token support for Large (2x2), Huge (3x3), or Gigantic (4x4) tokens. All tokens render as 1x1 regardless of size. useGridMovement (C014) mentions multi-tile support but footprint rendering is not implemented. |
| R004 | Movement Via Shift Actions | workflow | core | gm | **Implemented** | gm | — | C014 (useGridMovement: movement validation with terrain costs), C030 (usePathfinding: A* pathfinding), C013 (useGridInteraction: token drag-and-drop), C023 (useIsometricInteraction for isometric mode). Token movement is the core grid interaction. |
| R005 | Diagonal Movement Cost | formula | core | system | **Implemented** | gm | — | C035 (ptuDiagonalDistance: alternating 1m/2m pattern. Formula: diagonals + floor(diagonals/2) + straights). Used by pathfinding and movement range calculations. |
| R006 | Adjacency Definition | condition | core | system | **Implemented** | gm | — | Grid-based adjacency (8 surrounding cells including diagonals) is used throughout the system for measurement, movement range, and combat interactions. |
| R007 | No Split Movement | constraint | core | system | **Implemented** | gm | — | Movement is a single drag-and-drop operation (C013, C023). No mechanism to split a shift action — token moves from A to B in one action. |
| R008 | Mixed Movement Capabilities | formula | situational | system | **Missing** | — | P3 | No movement capability averaging when transitioning between terrain types (e.g., Overland 7 + Swim 5 = 6 for a mixed turn). Movement uses a single speed value. |
| R009 | Jump Capability Movement | modifier | situational | system | **Out of Scope** | — | — | Jump mechanics (consuming shift movement) are too granular for the VTT. Jumping over obstacles would need obstacle/gap tile types. |
| R010 | Custom Size Shapes | constraint | edge-case | system | **Out of Scope** | — | — | Custom shapes (e.g., 8x2 Steelix) are extremely niche. Standard rectangular footprints per R003 would cover 99% of cases. |
| R011 | Small Pokemon Space Sharing | constraint | situational | system | **Missing** | — | P3 | No shared-space mechanic. Small Pokemon cannot share a 1x1 cell with another Small/Medium entity. Each token occupies its own cell exclusively. |
| R012 | Basic Terrain Types | enumeration | core | gm | **Implemented** | gm | — | C003 (terrain store: 6 types — normal, rough, water, ice, lava, blocked), C046 (TerrainPainter with type selector), C057 (terrain persistence APIs). Covers PTU terrain types plus app-specific additions (lava, ice as slow terrain variants). |
| R013 | Movement Capability Types | enumeration | core | system | **Implemented** | gm | — | C036 (combatantCapabilities: canFly/getSkySpeed/canSwim/canBurrow), C026 (useElevation: default elevation for flying Pokemon). Movement capabilities queried for pathfinding and elevation. |
| R014 | Slow Terrain | modifier | core | system | **Implemented** | gm | — | C003 (terrain types with movement cost multipliers), C014 (useGridMovement applies terrain costs), C030 (usePathfinding accounts for terrain costs in A*). Ice and water terrain types function as slow terrain (2x cost). |
| R015 | Rough Terrain | modifier | core | system | **Partial** | gm | P2 | **Present:** Rough terrain type exists in terrain store (C003) with movement cost. **Missing:** No -2 accuracy penalty when targeting through rough terrain. Accuracy modifications are combat-domain. Occupied enemy squares not auto-marked as rough terrain. |
| R016 | Blocking Terrain | constraint | core | system | **Implemented** | gm | — | C003 (blocked terrain type), C030 (usePathfinding treats blocked cells as impassable), C046 (TerrainPainter can paint blocked cells). |
| R017 | Naturewalk Capability | modifier | situational | system | **Missing** | — | P2 | No Naturewalk capability support. Pokemon with Naturewalk should treat specific terrain types as normal terrain, but the movement system doesn't check per-Pokemon Naturewalk capabilities. |
| R018 | Flanking | interaction | core | system | **Missing** | — | P1 | No flanking detection. Flanking (-2 evasion when surrounded by non-adjacent foes) is not calculated. Would need: adjacent foe detection, non-adjacency check between foes, size-based foe count requirements (2 for Small/Medium, 3 for Large, 4 for Huge, 5 for Gigantic). |
| R019 | Flanking — Large Multi-Square | interaction | situational | system | **Missing** | — | P2 | No large combatant flanking contribution. Depends on R003 (multi-tile tokens) and R018 (flanking). Large Pokemon occupying multiple adjacent squares should count as multiple foes for flanking. |
| R020 | Flanking Self-Flank Prevention | constraint | core | system | **Missing** | — | P2 | No flanking system exists (R018), so self-flank prevention is also missing. Would be a constraint on R019. |
| R021 | Melee Range (Adjacency) | condition | core | system | **Implemented** | gm | — | Melee range = adjacent cells. The measurement system (C004, C016 useRangeParser) handles distance calculations. Combat system uses adjacency for melee attacks. |
| R022 | Stuck Condition (No Movement) | condition | core | system | **Partial** | gm | P3 | **Present:** Status conditions tracked on combatant model (including Stuck). **Missing:** Stuck condition does not auto-prevent movement on the grid. GM must manually enforce the no-shift restriction. useGridMovement doesn't check status conditions before allowing movement. |
| R023 | Ghost Type Stuck/Trapped Immunity | modifier | situational | system | **Out of Scope** | — | — | Depends on R022 being enforced. Ghost type immunity to Stuck/Trapped is a combat-domain status condition rule. |
| R024 | Slowed Condition (Half Movement) | condition | core | system | **Partial** | gm | P3 | **Present:** Status conditions tracked on combatant. **Missing:** Slowed condition does not auto-halve movement range on the grid. Movement range display (C014) doesn't read Slowed status to reduce displayed range. |
| R025 | Tripped Condition (Stand Up) | condition | core | system | **Partial** | gm | P3 | **Present:** Status conditions tracked on combatant. **Missing:** Tripped condition doesn't auto-consume shift action. No "stand up" mechanic in grid interaction. |
| R026 | Speed CS Affect Movement | formula | core | system | **Partial** | gm | P2 | **Present:** Combat stage modifiers tracked on combatant. **Missing:** Speed CS not factored into movement range calculation. Movement uses base Overland speed without applying +/- floor(SpeedCS/2) bonus. |
| R027 | Speed CS Movement Floor | constraint | core | system | **Missing** | — | P2 | No Speed CS movement integration (R026), so no floor enforcement (minimum 2). |
| R028 | Sprint Maneuver | modifier | core | gm | **Implemented** | gm | — | Sprint maneuver exists in combat maneuvers system (combatManeuvers constant). +50% movement speed for the turn. Applied via combat action system. |
| R029 | Push Maneuver | interaction | core | gm | **Implemented** | gm | — | Push maneuver exists in combat maneuvers system. Opposed Combat/Athletics check, 1m push. Applied via combat action system. |
| R030 | Disengage Maneuver | modifier | core | system | **Implemented** | gm | — | Disengage maneuver exists in combat maneuvers system. 1m shift without AoO. |
| R031 | Attack of Opportunity (Movement) | interaction | core | system | **Missing** | — | P1 | No AoO detection on movement. When a token moves away from an adjacent enemy, no AoO trigger is shown or logged. This is a critical combat mechanic that players frequently forget. |
| R032 | Throwing Range | formula | core | gm | **Implemented** | gm | — | Measurement tools (C004, C016 useRangeParser) can measure distance for throwing range. Range entered manually but distance calculation supports it. Cross-domain: throwing range formula is character-lifecycle. |
| R033 | Recall Beam Range | constraint | situational | gm | **Missing** | — | P2 | No recall beam range check (8 meters between trainer and Pokemon). GM must manually check distance. Measurement tool can measure but no auto-enforcement. |
| R034 | Reach Capability | modifier | situational | system | **Out of Scope** | — | — | Reach (melee range +1 or +2 based on size) would need per-Pokemon capability lookup and melee range extension. Too granular for current VTT scope. |
| R035 | Blindness Movement Penalty | interaction | situational | system | **Out of Scope** | — | — | Blindness Acrobatics check on rough/slow terrain is a combat-domain status condition interaction. |
| R036 | Total Blindness Movement | interaction | edge-case | system | **Out of Scope** | — | — | Total blindness relative-direction movement is extremely niche. Out of VTT scope. |
| R037 | Teleporter Constraints | constraint | situational | system | **Out of Scope** | — | — | Teleporter (one per round, LoS required, no Sprint boost) would need special movement mode with LoS checks. Too complex for current scope. |
| R038 | Levitate Maximum Height | formula | situational | system | **Partial** | gm | P3 | **Present:** C026 (useElevation manages per-token elevation). **Missing:** No max height enforcement based on Levitate capability (max = half Levitate speed). Elevation is freely adjustable. |
| R039 | Phasing Capability | modifier | situational | system | **Out of Scope** | — | — | Phasing (ignore slow terrain, Intangible standard action) is too niche. Would need per-Pokemon capability checking. |
| R040 | Falling Damage | formula | situational | system | **Out of Scope** | — | — | Falling damage (DB per meter, scaled by weight class) is a combat-domain damage calculation triggered by elevation changes. Beyond VTT grid scope. |
| R041 | Intercept Melee | workflow | situational | gm | **Implemented-Unreachable** | gm | P2 | Intercept Melee exists in combat maneuvers system. The maneuver is defined and can be executed. However, the VTT grid doesn't provide visual assistance: no "ally within movement range" indicator, no automatic shift-to-ally path display. The mechanic works but the grid doesn't help the GM evaluate whether it's valid. |
| R042 | Intercept Ranged | workflow | situational | gm | **Missing** | — | P3 | No Intercept Ranged support. The maneuver would need ranged attack path visualization to determine intercept squares. Too complex for current VTT. |

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|-------------|-------------|-------------------|---------|---------|-------------|
| system | 31 | 12 | 0 | 6 | 5 | 8 |
| gm | 11 | 7 | 1 | 0 | 3 | 0 |

**Actor reachability:**
- **system** rules (grid mechanics, terrain, movement): 12/31 implemented, 6 partial — main gaps are flanking (R018), AoO (R031), status-movement integration (R022-R027), multi-tile tokens (R003)
- **gm** rules (maneuvers, measurement): 7/11 implemented — gaps in recall range enforcement and intercept visualization
- **player** rules: None directly in this domain. Player grid interaction is through MS-1/MS-4 (player view is read-only), tracked in capability mapper missing subsystems.

## Subsystem Gaps

### SG-1: No Flanking System
- **Missing subsystem:** Automatic flanking detection and evasion penalty application
- **Affected rules:** R018, R019, R020 (3 rules)
- **Suggested feature ticket:** "feat: add flanking detection with visual indicators and evasion penalty"
- **Priority:** P1 — flanking is a core combat mechanic used in almost every encounter

### SG-2: No Status-Movement Integration
- **Missing subsystem:** Status conditions (Stuck, Slowed, Tripped) do not affect grid movement
- **Affected rules:** R022, R024, R025 (3 rules, plus R023 out of scope)
- **Suggested feature ticket:** "feat: integrate status conditions with grid movement (Stuck prevents shift, Slowed halves range, Tripped consumes shift)"
- **Priority:** P2 — movement conditions are commonly applied but GM can manually enforce

### SG-3: No Speed CS Movement Integration
- **Missing subsystem:** Speed combat stages do not modify movement range
- **Affected rules:** R026, R027 (2 rules)
- **Suggested feature ticket:** "feat: apply Speed CS to movement range calculation (floor(CS/2) bonus, minimum 2)"
- **Priority:** P2 — Speed CS is commonly modified in combat but movement effect is secondary

### SG-4: No Multi-Tile Token Support
- **Missing subsystem:** Large/Huge/Gigantic combatants rendered as 1x1 instead of proper footprint
- **Affected rules:** R003 (1 rule, cascading to R019)
- **Suggested feature ticket:** "feat: render multi-tile tokens (2x2 Large, 3x3 Huge, 4x4 Gigantic)"
- **Priority:** P2 — affects visual accuracy and flanking calculations

### SG-5: Player Grid Interaction (MS-1, MS-4)
- **Missing subsystem:** Players cannot move tokens or use measurement tools from player view
- **Affected rules:** None directly in this rules catalog (player movement is a UI concern, not a PTU rule)
- **Suggested feature ticket:** "feat: add player movement request system (player proposes, GM approves)"
- **Priority:** P2 — improves game flow but GM can proxy all movement

## Gap Priorities

| Priority | Count | Rules |
|----------|-------|-------|
| P1 | 2 | R018 (flanking), R031 (AoO on movement) |
| P2 | 8 | R003 (partial — multi-tile), R015 (partial — rough accuracy), R017 (Naturewalk), R019 (large flanking), R020 (self-flank prevention), R026 (partial — Speed CS), R027 (Speed CS floor), R033 (recall range), R041 (unreachable — intercept visual) |
| P3 | 7 | R008 (mixed movement), R011 (space sharing), R022 (partial — Stuck), R024 (partial — Slowed), R025 (partial — Tripped), R038 (partial — Levitate height), R042 (Intercept Ranged) |

## Auditor Queue

Priority-ordered list for Implementation Auditor to verify correctness.

### Tier 1: Core Grid Foundation (verify correctness first)
1. **R001** — Square Grid System (C001, C041, C042) — verify grid rendering in both 2D and isometric
2. **R002** — Grid Scale (C035, C050) — verify 1m per cell assumption
3. **R005** — Diagonal Movement Cost (C035) — verify alternating 1m/2m formula: diag + floor(diag/2) + straight
4. **R006** — Adjacency Definition — verify 8-directional adjacency in interaction/measurement code
5. **R007** — No Split Movement — verify single drag-and-drop move action

### Tier 2: Terrain System (verify types and costs)
6. **R012** — Basic Terrain Types (C003) — verify 6 terrain types with correct movement costs
7. **R014** — Slow Terrain (C003, C014, C030) — verify 2x movement cost in pathfinding
8. **R016** — Blocking Terrain (C003, C030) — verify impassable in pathfinding
9. **R013** — Movement Capability Types (C036) — verify canFly/canSwim/canBurrow utilities

### Tier 3: Movement System (verify pathfinding)
10. **R004** — Movement Via Shift (C014, C030) — verify movement validation and pathfinding with terrain
11. **R028** — Sprint (combat maneuvers) — verify +50% movement in maneuver definition
12. **R029** — Push (combat maneuvers) — verify 1m push in maneuver definition
13. **R030** — Disengage (combat maneuvers) — verify 1m no-AoO shift

### Tier 4: Measurement and Range (verify calculation)
14. **R021** — Melee Range — verify adjacency used for melee
15. **R032** — Throwing Range — verify distance measurement tool functionality

### Tier 5: Rendering (verify visual)
16. **R001** — Grid rendering — verify both 2D (C041) and isometric (C042) canvas render correctly

### Tier 6: Partial Items (verify present portion)
17. **R003** — Size Footprints — verify tokens render as 1x1, confirm no multi-tile
18. **R015** — Rough Terrain — verify rough type exists, confirm no accuracy penalty
19. **R022** — Stuck Condition — verify status tracked, confirm no movement prevention
20. **R024** — Slowed Condition — verify status tracked, confirm no range halving
21. **R025** — Tripped Condition — verify status tracked, confirm no stand-up cost
22. **R026** — Speed CS Movement — verify CS tracked, confirm not applied to movement range
23. **R038** — Levitate Height — verify elevation system exists (C026), confirm no max height enforcement

### Tier 7: Implemented-Unreachable (verify logic, flag access)
24. **R041** — Intercept Melee — verify maneuver exists in combat system, confirm no grid visual assistance
