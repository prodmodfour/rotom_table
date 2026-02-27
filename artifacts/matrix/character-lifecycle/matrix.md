---
domain: character-lifecycle
type: matrix
total_rules: 68
analyzed_at: 2026-02-28T03:00:00Z
analyzed_by: coverage-analyzer
---

# Coverage Matrix: character-lifecycle

## Coverage Score

```
Implemented:             38
Implemented-Unreachable:  0
Partial:                 12
Missing:                 10
Subsystem-Missing:        0
Out of Scope:             8

Total:                   68
Scoreable (Total - OoS): 60

Coverage = (38 + 0.5*12 + 0.5*0) / 60 * 100 = 73.3%
```

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R001 | Trainer Combat Stats Definition | enumeration | core | system | Implemented | gm, player | C001, C063 | — | 6 stats stored and used correctly |
| R002 | Starting Stat Baseline | constraint | core | gm | Implemented | gm | C050, C063, C070 | — | Full validation with budget tracking |
| R003 | Skill Categories | enumeration | core | system | Implemented | gm | C062 | — | Body 6, Mind 7, Spirit 4 |
| R004 | Skill Ranks and Dice | enumeration | core | system | Implemented | gm | C062 | — | Pathetic through Master with dice counts |
| R005 | Skill Rank Level Prerequisites | constraint | core | system | Implemented | gm | C062, C063 | — | Level 2/6/12 gates enforced |
| R006 | Skills Default Rank | constraint | core | system | Implemented | gm | C062 | — | getDefaultSkills returns all Untrained |
| R007 | Background Skill Modification | workflow | core | gm | Implemented | gm | C050, C064, C071 | — | 11 presets + custom mode |
| R008 | Trainer HP Formula | formula | core | system | Implemented | gm | C011, C050 | — | Level*2 + HP*3 + 10 |
| R009 | Physical Evasion Formula | formula | core | system | Implemented | gm | C050 | — | floor(def/5) capped at +6 |
| R010 | Special Evasion Formula | formula | core | system | Implemented | gm | C050 | — | floor(spdef/5) capped at +6 |
| R011 | Speed Evasion Formula | formula | core | system | Implemented | gm | C050 | — | floor(speed/5) capped at +6 |
| R012 | Evasion General Formula | formula | core | system | Implemented | gm | C050 | — | Floor division with cap at +6 |
| R013 | Power Capability | formula | core | system | Missing | — | — | P2 | No Power calculation. Base 4 + Athletics/Combat modifiers not computed. |
| R014 | High Jump Capability | formula | core | system | Missing | — | — | P2 | No High Jump calculation from Acrobatics. |
| R015 | Long Jump Capability | formula | core | system | Missing | — | — | P2 | No Long Jump calculation (half Acrobatics rank). |
| R016 | Overland Movement Speed | formula | core | system | Partial | gm | C001 | P2 | **Present:** Raw stats stored. **Missing:** Auto-calculation 3 + (Athletics+Acrobatics)/2 not implemented. |
| R017 | Swimming Speed | formula | core | system | Partial | gm | C001 | P2 | **Present:** Can store manually. **Missing:** Auto-calculation (half Overland). |
| R018 | Throwing Range | formula | core | system | Partial | gm | C001 | P2 | **Present:** Can store manually. **Missing:** Auto-calculation (4 + Athletics rank). |
| R019 | Trainer Size | enumeration | core | system | Implemented | gm | C001 | — | Medium default |
| R020 | Weight Class | enumeration | core | system | Implemented | gm | C001 | — | Weight stored, WC derivable |
| R021 | Rounding Rule | constraint | core | system | Implemented | gm | C050, C035 | — | Math.floor used throughout |
| R022 | Starting Edges | constraint | core | gm | Implemented | gm | C050, C072, C063 | — | 4 starting edges tracked |
| R023 | Starting Skill Cap | constraint | core | gm | Implemented | gm | C062, C071 | — | Novice cap at L1 enforced via warnings |
| R024 | Pathetic Skills Cannot Be Raised At Creation | constraint | core | gm | Implemented | gm | C050 | — | decree-027: Skill Edges blocked from raising Pathetic |
| R025 | Skill Edge Definitions | enumeration | core | system | Implemented | gm | C050, C062, C063 | — | Basic/Adept/Expert/Master Skill Edges |
| R026 | Edges Per Level | constraint | core | system | Implemented | gm | C063, C072 | — | 4 base + even levels + milestone edges |
| R027 | Skill Check Mechanic | workflow | core | gm | Out of Scope | — | — | — | Dice rolling is table-level play |
| R028 | Opposed Check Mechanic | workflow | situational | gm | Out of Scope | — | — | — | Table-level play |
| R029 | Extended Skill Check | workflow | situational | gm | Out of Scope | — | — | — | Table-level play |
| R030 | Starting Features | constraint | core | gm | Implemented | gm | C050, C072, C063 | — | 4 + 1 training feature |
| R031 | Free Training Feature | modifier | core | gm | Implemented | gm | C050 | — | Separate training feature slot |
| R032 | Max Class Features | constraint | core | gm | Implemented | gm | C060, C050 | — | Max 4 enforced |
| R033 | Stat Tag Effect | modifier | core | system | Partial | gm | C005 | P2 | **Present:** Features stored. **Missing:** No auto stat bonus from [+Stat] features. |
| R034 | Ranked Feature Tag | constraint | situational | gm | Partial | gm | C005 | P3 | **Present:** Features stored. **Missing:** No rank tracking per feature. |
| R035 | Branch Feature Tag | constraint | situational | gm | Partial | gm | C060, C050 | P3 | **Present:** isBranching flag exists (decree-022). **Missing:** No branch prerequisite enforcement. |
| R036 | Features Per Level | constraint | core | system | Implemented | gm | C063, C072 | — | Odd-level feature gain tracked |
| R037 | No Duplicate Features | constraint | core | gm | Partial | gm | C050 | P2 | **Present:** Features stored. **Missing:** No duplicate detection. |
| R038 | Stat Points Per Level | modifier | core | system | Implemented | gm | C063, C070 | — | 1 stat point per level tracked |
| R039 | Edges Per Level (Advancement) | modifier | core | system | Implemented | gm | C063, C072 | — | Even-level edge gain tracked |
| R040 | Max Trainer Level | constraint | core | system | Implemented | gm | C001, C080 | — | Level field exists; max 50 settable |
| R041 | Action Points Pool | formula | core | system | Implemented | gm | C001, C013 | — | 5 + floor(level/5) formula |
| R042 | AP Refresh Per Scene | condition | core | system | Partial | gm | C001 | P2 | **Present:** AP fields stored. **Missing:** No auto-refresh on scene end. |
| R043 | AP Bind and Drain | interaction | core | gm | Implemented | gm | C001, C013, C020, C023 | — | Bind/drain tracked, cleared by rest/new-day |
| R044 | Level 2 Milestone | workflow | core | gm | Missing | — | — | P1 | No guided level-up. No milestone prompts. |
| R045 | Level 5 Milestone | workflow | core | gm | Missing | — | — | P1 | No milestone choice UI. |
| R046 | Level 6 Milestone | workflow | core | gm | Missing | — | — | P1 | No milestone prompts. |
| R047 | Level 10 Milestone | workflow | core | gm | Missing | — | — | P1 | No milestone choice UI. |
| R048 | Level 12 Milestone | workflow | core | gm | Missing | — | — | P1 | No milestone prompts. |
| R049 | Level 20 Milestone | workflow | situational | gm | Missing | — | — | P2 | No milestone choice UI. |
| R050 | Level 30/40 Milestones | workflow | situational | gm | Missing | — | — | P3 | No milestone choice UI. Rarely reached. |
| R051 | Character Creation Workflow | workflow | core | gm | Implemented | gm | C050, C080, C070-C072, C060-C065 | — | Full multi-section UI with progress tracking |
| R052 | Steps 3 and 4 Interleaving | constraint | situational | gm | Implemented | gm | C050 | — | Sections independent, any order |
| R053 | Leveling Triggers | workflow | core | gm | Partial | gm | C013 | P1 | **Present:** Level editable. **Missing:** No XP/milestone tracking. |
| R054 | Experience Bank | workflow | core | gm | Missing | — | — | P1 | No trainer XP tracking. No auto-level at 10 XP. |
| R055 | Retraining Costs | enumeration | core | gm | Out of Scope | — | — | — | Between-session table activity |
| R056 | Retraining Prerequisite Lock | constraint | core | gm | Out of Scope | — | — | — | Table-level |
| R057 | Retraining Permanent Effect Lock | constraint | situational | gm | Out of Scope | — | — | — | Table-level |
| R058 | Retraining Experience Requirement | constraint | core | gm | Out of Scope | — | — | — | No XP system; table-level |
| R059 | Retraining Timing | constraint | situational | gm | Out of Scope | — | — | — | Narrative timing; table-level |
| R060 | Experience From Pokemon | modifier | core | system | Partial | gm | C001 | P1 | **Present:** Pokemon ownership tracked. **Missing:** No +1 XP on new species. |
| R061 | Cooperative Skill Check -- Team | interaction | situational | gm | Out of Scope | — | — | — | Dice resolution; table-level |
| R062 | Cooperative Skill Check -- Assisted | interaction | situational | gm | Out of Scope | — | — | — | Dice resolution; table-level |
| R063 | AP Spend for Roll Bonus | interaction | situational | gm | Partial | gm | C001, C013 | P3 | **Present:** AP can be decremented. **Missing:** No explicit "spend for +1" action. |
| R064 | Skill Stunt Edge | modifier | situational | gm | Partial | gm | C006 | P3 | **Present:** Edge stored. **Missing:** No structured Skill Stunt data. |
| R065 | Skill Enhancement Edge | modifier | situational | gm | Partial | gm | C006 | P3 | **Present:** Edge stored. **Missing:** No auto +2 bonus application. |
| R066 | Categoric Inclination Edge | modifier | situational | gm | Partial | gm | C006 | P3 | **Present:** Edge stored. **Missing:** No auto +1 category bonus. |
| R067 | Virtuoso Edge | modifier | edge-case | gm | Partial | gm | C006 | P3 | **Present:** Edge stored. **Missing:** No "Rank 8" effective calculation. |
| R068 | Percentages Are Additive | constraint | core | system | Implemented | gm | System-wide | — | Additive percentage logic in formulas |

## Actor Accessibility Summary

| Actor | Total Rules | Reachable | Unreachable | Out of Scope |
|-------|------------|-----------|-------------|-------------|
| system | 26 | 22 | 0 | 0 |
| gm | 42 | 30 | 0 | 8 |

Note: All character-lifecycle rules have actor=gm or actor=system. No rules are player-initiated in PTU for this domain. The Capability Mapper identified MS-1 through MS-5 as missing player-facing subsystems, but since PTU rules here do not specify player-initiated digital actions, no Implemented-Unreachable classifications apply.

## Subsystem Gaps

### SG-1: No Level-Up Workflow
- **Missing subsystem:** Guided level-up process with milestone bonuses
- **Affected rules:** R044, R045, R046, R047, R048, R049, R050 (7 rules)
- **Priority:** P1
- **Suggested ticket:** "feat: guided level-up workflow with milestone bonus prompts"

### SG-2: No Trainer XP/Advancement Tracking
- **Missing subsystem:** Experience bank, auto-level, XP from Pokemon
- **Affected rules:** R053, R054, R060 (3 rules)
- **Priority:** P1
- **Suggested ticket:** "feat: trainer experience tracking with auto-level and Pokemon XP"

### SG-3: No Derived Capability Calculations
- **Missing subsystem:** Auto-computation of Power, High Jump, Long Jump, Overland, Swimming, Throwing Range
- **Affected rules:** R013, R014, R015, R016, R017, R018 (6 rules)
- **Priority:** P2
- **Suggested ticket:** "feat: auto-calculate derived movement and physical capabilities"

## Gap Priorities Summary

| Priority | Count | Rules |
|----------|-------|-------|
| P1 | 9 | R044, R045, R046, R047, R048, R053, R054, R060, R042 |
| P2 | 10 | R013, R014, R015, R016, R017, R018, R033, R037, R042, R049 |
| P3 | 7 | R034, R035, R050, R063, R064, R065, R066, R067 |

## Auditor Queue

### Tier 1: Core Formulas
1. **R008** — Trainer HP Formula (C011, C050) — verify Level*2 + HP*3 + 10
2. **R009/R010/R011/R012** — Evasion Formulas (C050) — verify floor(stat/5), cap +6
3. **R041** — AP Pool Formula (C013) — verify 5 + floor(level/5)
4. **R068** — Additive Percentages — verify no multiplicative stacking

### Tier 2: Core Constraints
5. **R002** — Starting Stat Baseline (C050, C063, C070) — verify 10HP/5other, 10 points, max 5
6. **R005** — Skill Rank Level Prerequisites (C062) — verify L2/L6/L12
7. **R024** — Pathetic Skills Block (C050) — verify decree-027
8. **R032** — Max 4 Class Features (C060, C050) — verify cap
9. **R036/R038/R039** — Per-Level Advancement (C063, C072)
10. **R040** — Max Level 50 (C001) — verify enforcement

### Tier 3: Core Enumerations
11. **R001** — 6 Combat Stats (C001)
12. **R003** — 17 Skills in 3 Categories (C062)
13. **R004** — Skill Ranks and Dice (C062)
14. **R025** — Skill Edge Definitions (C050)

### Tier 4: Workflows
15. **R051** — Character Creation (C080 -> C050 -> C070-C072 -> C041 -> C011 -> C001)
16. **R007** — Background Skill Modification (C050, C064)
17. **R043** — AP Bind/Drain lifecycle (C001, C020, C023)

### Tier 5: Partial Items (verify present portion)
18. **R016/R017/R018** — Movement/Swimming/Throwing manual storage
19. **R033** — Stat Tag feature storage
20. **R053** — Level field editability
21. **R063** — AP decrement
22. **R064-R067** — Edge string storage
