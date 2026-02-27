---
domain: vtt-grid
type: matrix
total_rules: 42
analyzed_at: 2026-02-28T03:00:00Z
analyzed_by: coverage-analyzer
---

# Coverage Matrix: vtt-grid

## Coverage Score

```
Implemented:             19
Implemented-Unreachable:  0
Partial:                  9
Missing:                  8
Subsystem-Missing:        0
Out of Scope:             6

Total:                   42
Scoreable (Total - OoS): 36

Coverage = (19 + 0.5*9) / 36 * 100 = 65.3%
```

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R001 | Square Grid System | constraint | core | system | Implemented | gm, group | C001 (encounterGrid store), C041 (GridCanvas), C042 (IsometricCanvas) | — | Square grid with both 2D and isometric views |
| R002 | Grid Scale (1 Meter Per Square) | constraint | core | system | Implemented | gm, group | C001 (cellSize config), C035 (ptuDiagonalDistance), C050 (GridSettingsPanel) | — | 1m per cell default. Cell size configurable. |
| R003 | Size Category Footprints | enumeration | core | system | Partial | gm, group | C001 (token positions), C049 (VTTToken) | P1 | **Present:** Tokens rendered. **Missing:** No multi-tile tokens for Large (2x2), Huge (3x3), Gigantic (4x4). All tokens occupy 1x1. |
| R004 | Movement Via Shift Actions | workflow | core | gm | Implemented | gm | C013 (useGridInteraction), C014 (useGridMovement), C023 (useIsometricInteraction) | — | Token drag-and-drop movement with validation |
| R005 | Diagonal Movement Cost (Alternating 1m/2m) | formula | core | system | Implemented | gm | C035 (ptuDiagonalDistance), C030 (usePathfinding) | — | First diagonal 1m, second 2m, alternating. Per decree-009 and decree-023. |
| R006 | Adjacency Definition | condition | core | system | Implemented | gm | C016 (useRangeParser), C035 (ptuDiagonalDistance) | — | 8-directional adjacency including diagonals |
| R007 | No Split Movement | constraint | core | system | Implemented | gm | C014 (useGridMovement — single movement action) | — | Movement is a single drag operation, not splittable |
| R008 | Mixed Movement Capabilities | formula | situational | system | Partial | gm | C036 (combatantCapabilities), C030 (usePathfinding) | P2 | **Present:** Multiple capability types detected. **Missing:** No speed averaging when crossing terrain types requiring different capabilities. Per decree-011 (average speeds at terrain boundaries). |
| R009 | Jump Capability Movement | modifier | situational | system | Missing | — | — | P3 | No jump movement integration. Jump does not consume shift distance. |
| R010 | Custom Size Shapes | constraint | edge-case | system | Out of Scope | — | — | — | Custom token shapes (e.g., 8x2 Steelix) too specialized for VTT. |
| R011 | Small Pokemon Space Sharing | constraint | situational | system | Missing | — | — | P3 | No space sharing for Small Pokemon. All tokens occupy exclusive cells. |
| R012 | Basic Terrain Types | enumeration | core | gm | Implemented | gm | C003 (terrain store — 6 types: normal, rough, water, ice, lava, blocked), C046 (TerrainPainter) | — | 6 terrain types with movement costs. Multi-tag per decree-010. |
| R013 | Movement Capability Types | enumeration | core | system | Partial | gm | C036 (combatantCapabilities — fly/swim/burrow queries), C026 (useElevation — Sky speed), C030 (pathfinding) | P2 | **Present:** Overland, Sky detected. **Missing:** Swim, Burrow, Teleporter, Levitate not integrated into pathfinding. Only Overland and Sky used for movement range. |
| R014 | Slow Terrain | modifier | core | system | Implemented | gm | C003 (terrain cost multiplier), C030 (pathfinding respects terrain costs) | — | Terrain types with cost multiplier > 1 act as slow terrain. Water/ice terrain costs double per decree-008. |
| R015 | Rough Terrain | modifier | core | system | Partial | gm | C003 (rough terrain type exists), C046 (can paint rough) | P2 | **Present:** Rough terrain paintable, costs movement. **Missing:** No -2 accuracy penalty auto-applied when targeting through rough terrain. Per decree-025 (exclude endpoint cells from penalty). |
| R016 | Blocking Terrain | constraint | core | system | Implemented | gm | C003 (blocked terrain type), C030 (pathfinding treats blocked as impassable) | — | Blocked cells excluded from pathfinding |
| R017 | Naturewalk Capability | modifier | situational | system | Partial | gm | C036 (combatantCapabilities utility exists) | P2 | **Present:** Capability query infrastructure. **Missing:** Naturewalk not integrated into pathfinding cost. Pokemon with Naturewalk pay full terrain cost. |
| R018 | Flanking | interaction | core | system | Missing | — | — | P1 | No flanking detection. No -2 evasion penalty when flanked. No adjacency-based flanking logic. |
| R019 | Flanking -- Large Combatant Multi-Square | interaction | situational | system | Missing | — | — | P1 | Depends on R018 + multi-tile tokens (R003). Neither implemented. |
| R020 | Flanking Self-Flank Prevention | constraint | core | system | Missing | — | — | P1 | Depends on R018. |
| R021 | Melee Range (Adjacency) | condition | core | system | Implemented | gm | C016 (useRangeParser — melee range calculation), combat domain (melee move range checks) | — | Melee requires adjacency per R006 |
| R022 | Stuck Condition (No Movement) | condition | core | system | Partial | gm | Combat domain (status conditions include Stuck), C014 (useGridMovement) | P2 | **Present:** Stuck status trackable. **Missing:** Stuck condition not integrated into movement validation — GM can still move stuck tokens. |
| R023 | Ghost Type Stuck/Trapped Immunity | modifier | situational | system | Missing | — | — | P3 | No Ghost type immunity to Stuck/Trapped in movement validation. |
| R024 | Slowed Condition (Half Movement) | condition | core | system | Partial | gm | Combat domain (Slowed status trackable), C014 (useGridMovement) | P2 | **Present:** Slowed status trackable. **Missing:** Movement range not halved when Slowed status active. |
| R025 | Tripped Condition (Stand Up Cost) | condition | core | system | Partial | gm | Combat domain (Tripped status trackable) | P2 | **Present:** Tripped status trackable. **Missing:** No enforced shift-action-to-stand-up before movement. |
| R026 | Speed CS Affect Movement | formula | core | system | Missing | — | — | P1 | No Speed Combat Stage integration into movement range. CS+6 should give +3 movement. |
| R027 | Speed CS Movement Floor | constraint | core | system | Missing | — | — | P1 | No minimum 2 movement floor when Speed CS negative. Depends on R026. |
| R028 | Sprint Maneuver | modifier | core | gm | Implemented | gm | Combat domain (Sprint maneuver in combat maneuvers constant) | — | Sprint exists as combat maneuver. Movement speed +50% is GM-applied. |
| R029 | Push Maneuver | interaction | core | gm | Implemented | gm | Combat domain (Push maneuver with opposed check) | — | Push exists as combat maneuver. Grid position change is manual. |
| R030 | Disengage Maneuver | modifier | core | gm | Implemented | gm | Combat domain (Disengage maneuver) | — | Disengage exists. No AoO tracking to suppress. |
| R031 | Attack of Opportunity (Movement Trigger) | interaction | core | system | Missing | — | — | P2 | No AoO system. No alert when moving away from adjacent enemies. |
| R032 | Throwing Range | formula | core | system | Implemented | gm | C016 (useRangeParser), character-lifecycle R018 (formula) | — | Range calculation exists for ranged targeting |
| R033 | Recall Beam Range | constraint | situational | gm | Out of Scope | — | — | — | 8m recall range is a combat-domain constraint, not VTT-specific. |
| R034 | Reach Capability | modifier | situational | system | Out of Scope | — | — | — | Reach extends melee range. Combat domain handles range calculation. |
| R035 | Blindness Movement Penalty | interaction | situational | system | Out of Scope | — | — | — | Status-movement interaction. Combat domain responsibility. |
| R036 | Total Blindness Movement | interaction | edge-case | system | Out of Scope | — | — | — | Extremely specific status-movement interaction. |
| R037 | Teleporter Movement Constraints | constraint | situational | system | Missing | — | — | P3 | No Teleporter movement mode. No line-of-sight check or Sprint limitation. |
| R038 | Levitate Maximum Height | formula | situational | system | Partial | gm | C026 (useElevation — elevation support exists) | P3 | **Present:** Elevation system exists for isometric grid. **Missing:** No Levitate height cap enforcement (max = half Levitate speed). |
| R039 | Phasing Capability | modifier | situational | system | Out of Scope | — | — | — | Intangibility is a combat status, not VTT-specific. |
| R040 | Falling Damage By Distance and Weight | formula | situational | system | Missing | — | — | P3 | No falling damage calculation. Elevation changes do not trigger damage. |
| R041 | Intercept Melee | workflow | situational | gm | Implemented | gm | Combat domain (Intercept maneuver exists) | — | Intercept maneuver in combat maneuvers. Grid repositioning is manual. |
| R042 | Intercept Ranged | workflow | situational | gm | Implemented | gm | Combat domain (Intercept maneuver exists) | — | Intercept maneuver in combat maneuvers. |

## Actor Accessibility Summary

| Actor | Total Rules | Reachable | Unreachable | Out of Scope |
|-------|------------|-----------|-------------|-------------|
| system | 33 | 22 | 0 | 5 |
| gm | 9 | 8 | 0 | 1 |
| player | 0 | 0 | 0 | 0 |

Note: VTT rules are primarily system-automatic (grid engine) or gm-initiated (movement, terrain painting). The Group View displays the grid read-only (C043 GroupGridCanvas). The Capability Mapper identified MS-1 (no player grid interaction) and MS-4 (no player movement requests) as missing subsystems. These are valid gaps but do not create Implemented-Unreachable classifications since no PTU rules assign VTT-specific actions to players -- players declare movement verbally and the GM executes it.

## Subsystem Gaps

### SG-1: No Multi-Tile Token System
- **Missing subsystem:** Large/Huge/Gigantic token footprints on grid
- **Affected rules:** R003, R019 (2 rules, R019 depends on multi-tile)
- **Priority:** P1
- **Suggested ticket:** "feat: multi-tile token rendering and collision for Large/Huge/Gigantic combatants"

### SG-2: No Flanking Detection
- **Missing subsystem:** Adjacency-based flanking detection with evasion penalty
- **Affected rules:** R018, R019, R020 (3 rules)
- **Priority:** P1
- **Suggested ticket:** "feat: flanking detection with -2 evasion penalty"

### SG-3: No Speed Combat Stage Movement Integration
- **Missing subsystem:** Speed CS effect on movement range with minimum floor
- **Affected rules:** R026, R027 (2 rules)
- **Priority:** P1
- **Suggested ticket:** "feat: integrate Speed Combat Stages into movement range calculation"

### SG-4: No Status-Movement Integration
- **Missing subsystem:** Stuck/Slowed/Tripped conditions affecting movement validation
- **Affected rules:** R022, R024, R025 (3 rules, partial)
- **Priority:** P2
- **Suggested ticket:** "feat: enforce movement restrictions from status conditions (Stuck, Slowed, Tripped)"

### SG-5: No Attack of Opportunity System
- **Missing subsystem:** AoO triggers on adjacent enemy movement
- **Affected rules:** R031 (1 rule)
- **Priority:** P2
- **Suggested ticket:** "feat: attack of opportunity alerts on movement away from adjacent enemies"

## Gap Priorities Summary

| Priority | Count | Rules |
|----------|-------|-------|
| P1 | 6 | R003, R018, R019, R020, R026, R027 |
| P2 | 7 | R008, R013, R015, R017, R022, R024, R025, R031 |
| P3 | 6 | R009, R011, R023, R037, R038, R040 |

## Auditor Queue

### Tier 1: Core Formulas
1. **R005** — Diagonal movement cost (C035) — verify alternating 1m/2m per decree-009 and decree-023
2. **R002** — Grid scale (C001) — verify 1m per cell
3. **R032** — Throwing range (C016) — verify range calculation

### Tier 2: Core Constraints
4. **R001** — Square grid system (C001, C041, C042) — verify grid rendering
5. **R007** — No split movement (C014) — verify single drag
6. **R016** — Blocking terrain (C003, C030) — verify impassable in pathfinding
7. **R014** — Slow terrain (C003, C030) — verify double cost per decree-008

### Tier 3: Core Enumerations
8. **R012** — 6 terrain types (C003, C046) — verify all types and costs per decree-010
9. **R006** — Adjacency definition (C016) — verify 8-directional

### Tier 4: Core Workflows
10. **R004** — Movement via shift (C013, C014, C023) — verify drag-and-drop movement chain
11. **R028** — Sprint maneuver (combat domain) — verify +50% exists
12. **R029** — Push maneuver (combat domain) — verify push mechanic exists
13. **R030** — Disengage maneuver (combat domain) — verify 1m safe shift
14. **R041/R042** — Intercept maneuvers (combat domain) — verify existence

### Tier 5: Partial Items
15. **R003** — Size footprints (C049) — verify current 1x1 rendering
16. **R013** — Movement capabilities (C036) — verify Overland/Sky detection
17. **R015** — Rough terrain (C003) — verify type exists, check -2 penalty absence
18. **R017** — Naturewalk (C036) — verify capability utility
19. **R022/R024/R025** — Status-movement (combat domain) — verify status tracking
20. **R008** — Mixed movement (C036) — verify capability queries
21. **R038** — Levitate height (C026) — verify elevation system
