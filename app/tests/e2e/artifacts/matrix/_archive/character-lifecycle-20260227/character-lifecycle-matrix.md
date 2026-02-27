---
domain: character-lifecycle
analyzed_at: 2026-02-26T14:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: character-lifecycle-rules.md
capabilities_catalog: character-lifecycle-capabilities.md
---

# Feature Completeness Matrix: Character Lifecycle

## Coverage Score

```
Implemented:              36
Implemented-Unreachable:   2
Partial:                  10
Missing:                  12
Subsystem-Missing:         0
Out of Scope:              8
---
Total:                    68
Effective Total:          60  (68 - 8 Out of Scope)

Coverage = (36 + 0.5*2 + 0.5*10) / 60 * 100
         = (36 + 1 + 5) / 60 * 100
         = 42 / 60 * 100
         = 70.0%
```

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|-----------------|-------------|-------|
| R001 | Trainer Combat Stats Definition | enumeration | core | system | **Implemented** | gm, player | — | C001 (Prisma model has hp, attack, defense, spAttack, spDefense, speed), C063 (trainerStats constants) |
| R002 | Starting Stat Baseline | constraint | core | gm | **Implemented** | gm | — | C063 (BASE_HP=10, BASE_OTHER=5, TOTAL_STAT_POINTS=10, MAX_POINTS_PER_STAT=5), C070 (validateStatAllocation checks per-stat cap at level 1) |
| R003 | Skill Categories | enumeration | core | system | **Implemented** | gm, player | — | C062 (PTU_SKILL_CATEGORIES: Body 6, Mind 7, Spirit 4 = 17 total) |
| R004 | Skill Ranks and Dice | enumeration | core | system | **Implemented** | gm | — | C062 (SKILL_RANKS array with rank/value/dice for Pathetic through Master) |
| R005 | Skill Rank Level Prerequisites | constraint | core | gm | **Implemented** | gm | — | C062 (SKILL_RANK_LEVEL_REQS), C063 (getMaxSkillRankForLevel, isSkillRankAboveCap), C071 (validateSkillBackground checks rank cap) |
| R006 | Skills Default Rank | constraint | core | system | **Implemented** | gm | — | C062 (getDefaultSkills returns all Untrained) |
| R007 | Background Skill Modification | workflow | core | gm | **Implemented** | gm | — | C050 (applyBackground, clearBackground, enableCustomBackground), C064 (11 SAMPLE_BACKGROUNDS + custom), C071 (validateSkillBackground validates 1 Adept, 1 Novice, 3 Pathetic) |
| R008 | Trainer HP Formula | formula | core | system | **Implemented** | gm | — | C011 (Create API computes maxHp = Level*2 + HP*3 + 10), C050 (composable computes maxHp in real-time) |
| R009 | Physical Evasion Formula | formula | core | system | **Implemented** | gm | — | C050 (useCharacterCreation computes evasions), floor(Defense/5) capped at +6 |
| R010 | Special Evasion Formula | formula | core | system | **Implemented** | gm | — | C050 (useCharacterCreation computes evasions), floor(SpDef/5) capped at +6 |
| R011 | Speed Evasion Formula | formula | core | system | **Implemented** | gm | — | C050 (useCharacterCreation computes evasions), floor(Speed/5) capped at +6 |
| R012 | Evasion General Formula | formula | core | system | **Implemented** | gm | — | C050 (floor division with +6 cap per PTU) |
| R013 | Power Capability | formula | core | system | **Missing** | — | P2 | No power capability calculation. C050 does not compute Power (4 + Athletics Novice+ bonus + Combat Adept+ bonus). Not stored on model, not displayed. |
| R014 | High Jump Capability | formula | core | system | **Missing** | — | P2 | No high jump capability calculation. Not stored on model, not computed, not displayed. |
| R015 | Long Jump Capability | formula | core | system | **Missing** | — | P2 | No long jump capability calculation (half Acrobatics rank). Not stored on model, not computed. |
| R016 | Overland Movement Speed | formula | core | system | **Missing** | — | P2 | No overland speed calculation for trainers (3 + [(Athl+Acro)/2]). Not stored, not computed. |
| R017 | Swimming Speed | formula | core | system | **Missing** | — | P2 | No swimming speed calculation (half overland). Depends on R016. |
| R018 | Throwing Range | formula | core | system | **Missing** | — | P2 | No throwing range calculation (4 + Athletics rank). Not stored, not computed. |
| R019 | Trainer Size | enumeration | core | system | **Implemented** | gm | — | C001 (model has implicit Medium default; trainers treated as Medium throughout combat system) |
| R020 | Weight Class | enumeration | core | system | **Partial** | gm | P3 | **Present:** Weight field on character model. **Missing:** No automatic weight class derivation from weight (WC3: 55-110 lbs, WC4: 111-220, WC5: 220+). GM must manually track. |
| R021 | Rounding Rule | constraint | core | system | **Implemented** | gm | — | Math.floor used consistently in evasion calculations (C050), HP formula, and stat computations |
| R022 | Starting Edges | constraint | core | gm | **Implemented** | gm | — | C063 (getExpectedEdgesForLevel returns base=4 at level 1), C072 (validateEdgesAndFeatures checks edge count vs expected) |
| R023 | Starting Skill Cap | constraint | core | gm | **Implemented** | gm | — | C063 (getMaxSkillRankForLevel returns Novice at level 1), C071 (validates rank cap), C050 (warns on skill rank above cap) |
| R024 | Pathetic Skills Cannot Be Raised At Creation | constraint | core | gm | **Partial** | gm | P2 | **Present:** C071 validates skill allocation. **Missing:** No hard enforcement preventing Pathetic skills from being raised; validation is soft warnings only. GM can still save with violations. |
| R025 | Skill Edge Definitions | enumeration | core | gm | **Implemented** | gm | — | C062 (SKILL_RANKS with level prereqs), C050 (addSkillEdge bumps rank, revert on remove), C006 (edges stored as "Skill Edge: [name]") |
| R026 | Edges Per Level | constraint | core | gm | **Implemented** | gm | — | C063 (getExpectedEdgesForLevel computes base + bonus skill edges by level), C072 (validates edge count against expectations with milestone guidance) |
| R027 | Skill Check Mechanic | workflow | core | gm | **Out of Scope** | — | — | Skill checks are resolved at the table, not through the app. App is a session helper, not a dice resolution engine for skill checks. |
| R028 | Opposed Check Mechanic | workflow | situational | gm | **Out of Scope** | — | — | Table-resolved mechanic. |
| R029 | Extended Skill Check | workflow | situational | gm | **Out of Scope** | — | — | Table-resolved mechanic. |
| R030 | Starting Features | constraint | core | gm | **Implemented** | gm | — | C063 (getExpectedFeaturesForLevel returns 4+1 training feature at level 1), C072 (validates feature count) |
| R031 | Free Training Feature | modifier | core | gm | **Implemented** | gm | — | C050 (setTrainingFeature separate from regular features, no prereqs), C080 (ClassFeatureSection has training feature slot) |
| R032 | Max Class Features | constraint | core | gm | **Implemented** | gm | — | C060 (MAX_TRAINER_CLASSES = 4), C050 (addClass respects cap), C072 (validates class count <= 4) |
| R033 | Stat Tag Effect | modifier | core | system | **Partial** | gm | P2 | **Present:** Features stored as name strings. **Missing:** No automatic stat bonus from [+Stat] tagged features. GM must manually adjust stats when features provide stat bonuses. |
| R034 | Ranked Feature Tag | constraint | situational | gm | **Partial** | gm | P3 | **Present:** Features stored as strings, can add multiples manually. **Missing:** No ranked feature tracking (Rank 1, Rank 2, etc). No validation preventing excess ranks. |
| R035 | Branch Feature Tag | constraint | situational | gm | **Partial** | gm | P3 | **Present:** Class features stored, branching classes flagged (C060 isBranching). **Missing:** No validation of branch specialization tracking or class slot consumption for branches. |
| R036 | Features Per Level | constraint | core | gm | **Implemented** | gm | — | C063 (getExpectedFeaturesForLevel: 4 base + 1 per odd level), C072 (validates feature count vs level expectation) |
| R037 | No Duplicate Features | constraint | core | gm | **Partial** | gm | P2 | **Present:** Validation warns on feature count. **Missing:** No explicit duplicate detection. Features stored as simple string array — duplicates possible if GM enters same name twice. |
| R038 | Stat Points Per Level | modifier | core | gm | **Implemented** | gm | — | C063 (getStatPointsForLevel: 10 base + 1 per level), C070 (validateStatAllocation checks total against budget) |
| R039 | Edges Per Level (Advancement) | modifier | core | gm | **Implemented** | gm | — | C063 (getExpectedEdgesForLevel includes +1 per even level), C072 (validates edge count) |
| R040 | Max Trainer Level | constraint | core | gm | **Partial** | gm | P3 | **Present:** Level field exists on model. **Missing:** No validation preventing level > 50. GM can set any level value. |
| R041 | Action Points Pool | formula | core | system | **Implemented** | gm | — | C013 (Update API imports calculateMaxAp from restHealing: 5 + floor(level/5)), C019-C023 (healing APIs manage AP correctly) |
| R042 | AP Refresh Per Scene | condition | core | system | **Partial** | gm | P2 | **Present:** AP tracked on model. Extended rest restores AP (C020). **Missing:** No automatic AP refresh at scene end. No scene-boundary AP reset trigger. GM must manually adjust. |
| R043 | AP Bind and Drain | interaction | core | gm | **Implemented** | gm | — | C001 (model has drainedAp, boundAp, currentAp fields), C020 (extended rest clears bound + drained), C022 (heal-injury drain_ap method drains 2 AP), C023 (new day resets all) |
| R044 | Level 2 Milestone — Adept Skills | workflow | core | gm | **Partial** | gm | P1 | **Present:** C063 getMaxSkillRankForLevel returns Adept at level 2+. Skill rank cap enforced in validation. **Missing:** No guided level-up workflow. No bonus Skill Edge prompt at level 2. No milestone notification. (MS-4 gap) |
| R045 | Level 5 Milestone — Amateur Trainer | workflow | core | gm | **Missing** | — | P1 | No level 5 milestone bonus choice (offensive stat points vs general feature). (MS-4 gap) |
| R046 | Level 6 Milestone — Expert Skills | workflow | core | gm | **Partial** | gm | P1 | **Present:** Skill rank cap unlocks Expert at level 6. **Missing:** No bonus Skill Edge prompt. No guided workflow. (MS-4 gap) |
| R047 | Level 10 Milestone — Capable Trainer | workflow | core | gm | **Missing** | — | P1 | No level 10 milestone bonus choice. (MS-4 gap) |
| R048 | Level 12 Milestone — Master Skills | workflow | core | gm | **Partial** | gm | P1 | **Present:** Skill rank cap unlocks Master at level 12. **Missing:** No bonus Skill Edge prompt. (MS-4 gap) |
| R049 | Level 20 Milestone — Veteran Trainer | workflow | situational | gm | **Missing** | — | P2 | No level 20 milestone bonus choice. (MS-4 gap) |
| R050 | Level 30/40 Milestones — Elite/Champion | workflow | situational | gm | **Missing** | — | P3 | No level 30/40 milestone choices. Very high level, rarely reached. (MS-4 gap) |
| R051 | Character Creation Workflow | workflow | core | gm | **Implemented** | gm | — | C080 (Full Create mode: Basic Info, Background & Skills, Edges, Classes & Features, Combat Stats, Biography, Notes with section progress), C050 (useCharacterCreation composable manages full flow) |
| R052 | Steps 3 and 4 Interleaving | constraint | situational | gm | **Implemented** | gm | — | C080 (Full Create has separate sections for Edges and Classes/Features that can be filled in any order; no forced sequence) |
| R053 | Leveling Triggers | workflow | core | gm | **Missing** | — | P1 | No milestone or XP-based leveling mechanism. Level is a plain number field edited manually. (MS-5 gap) |
| R054 | Experience Bank | workflow | core | gm | **Missing** | — | P1 | No experience bank tracking. No auto-level on reaching 10 XP. (MS-5 gap) |
| R055 | Retraining Costs | enumeration | core | gm | **Missing** | — | P2 | No retraining workflow (2 XP for feature, 1 XP for edge, 1 XP for stat point). |
| R056 | Retraining Prerequisite Lock | constraint | core | gm | **Missing** | — | P2 | No prerequisite dependency tracking for retraining restrictions. |
| R057 | Retraining Permanent Effect Lock | constraint | situational | gm | **Out of Scope** | — | — | Requires feature effect tracking ("used Move Tutor") which is beyond app's current scope. |
| R058 | Retraining Experience Requirement | constraint | core | gm | **Out of Scope** | — | — | Depends on XP system (R054) which is missing. Would be in scope if XP tracking existed. |
| R059 | Retraining Timing | constraint | situational | gm | **Out of Scope** | — | — | Narrative timing constraint — table-resolved. |
| R060 | Experience From Pokemon | modifier | core | gm | **Missing** | — | P2 | No auto-XP on catch/hatch/evolve new species. Depends on XP system (R054). |
| R061 | Cooperative Skill Check — Team | interaction | situational | gm | **Out of Scope** | — | — | Table-resolved mechanic. App does not handle skill check resolution. |
| R062 | Cooperative Skill Check — Assisted | interaction | situational | gm | **Out of Scope** | — | — | Table-resolved mechanic. |
| R063 | AP Spend for Roll Bonus | interaction | situational | player | **Implemented-Unreachable** | gm | P2 | AP tracking exists (C001, currentAp/drainedAp/boundAp). GM can manually decrement AP. But player cannot spend their own AP from the player view — player view is read-only (MS-1). |
| R064 | Skill Stunt Edge | modifier | situational | gm | **Partial** | gm | P3 | **Present:** Edge can be stored as string (e.g., "Skill Stunt: Perception"). **Missing:** No mechanical effect — the +6/-1d6 swap is not computed. Table-resolved for dice. |
| R065 | Skill Enhancement Edge | modifier | situational | gm | **Partial** | gm | P3 | **Present:** Edge stored as string. **Missing:** +2 bonus to chosen skills not auto-applied. |
| R066 | Categoric Inclination Edge | modifier | situational | gm | **Partial** | gm | P3 | **Present:** Edge stored as string. **Missing:** +1 bonus to skill category not auto-applied. |
| R067 | Virtuoso Edge | modifier | edge-case | gm | **Out of Scope** | — | — | Requires Master rank + level 20. Mechanical effect (rank 8 treatment) is too niche for app tracking. |
| R068 | Percentages Are Additive | constraint | core | system | **Implemented** | gm | — | Additive percentage pattern used in capture rate calculations and equipment bonus aggregation (C073). |

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|-------------|-------------|-------------------|---------|---------|-------------|
| system | 20 | 16 | 0 | 1 | 3 | 0 |
| gm | 47 | 20 | 0 | 9 | 10 | 8 |
| player | 1 | 0 | 1 | 0 | 0 | 0 |

**Actor reachability:**
- **system** rules (formulas, enumerations): 16/20 implemented — gaps are derived stat formulas (Power, Jump, Movement Speed)
- **gm** rules: 20/47 fully implemented, 9 partial — most gaps in level-up workflow and retraining
- **player** rules: 1 rule (R063 AP spend) is unreachable from player view — player view is read-only

## Subsystem Gaps

### SG-1: No Level-Up Workflow (MS-4)
- **Missing subsystem:** Guided level-up process with milestone bonuses
- **Affected rules:** R044, R045, R046, R047, R048, R049, R050 (7 rules)
- **Suggested feature ticket:** "feat: add guided level-up workflow with milestone bonus prompts"
- **Priority:** P1 — important for game progression, commonly used every session

### SG-2: No Character Advancement Tracking (MS-5)
- **Missing subsystem:** XP bank, milestone tracking, auto-leveling
- **Affected rules:** R053, R054, R060 (3 rules)
- **Suggested feature ticket:** "feat: add trainer XP/milestone tracking with auto-level trigger"
- **Priority:** P1 — core progression mechanic

### SG-3: No Derived Physical Capabilities
- **Missing subsystem:** Trainer-derived stats (Power, High Jump, Long Jump, Overland, Swimming, Throwing Range)
- **Affected rules:** R013, R014, R015, R016, R017, R018 (6 rules)
- **Suggested feature ticket:** "feat: compute and display trainer derived capabilities (Power, Jump, Movement, Throwing)"
- **Priority:** P2 — important for VTT grid movement and combat maneuvers but can be manually tracked

### SG-4: No Retraining System
- **Missing subsystem:** Retraining workflow with XP cost, prerequisite locks
- **Affected rules:** R055, R056 (2 rules, R057-R059 out of scope)
- **Suggested feature ticket:** "feat: add retraining workflow for features, edges, and stat points"
- **Priority:** P2 — situational between-session activity

### SG-5: Player View Write Access (MS-1, MS-2, MS-3)
- **Missing subsystem:** Player-facing character editing, healing triggers, equipment management
- **Affected rules:** R063 (1 directly unreachable, but the entire player edit flow affects many rules)
- **Suggested feature ticket:** "feat: add player view character sheet editing capabilities"
- **Priority:** P1 — bottleneck during gameplay when players need to update their sheets

## Gap Priorities

| Priority | Count | Rules |
|----------|-------|-------|
| P1 | 7 | R044 (partial), R045, R046 (partial), R047, R048 (partial), R053, R054 |
| P2 | 13 | R013, R014, R015, R016, R017, R018, R024 (partial), R033 (partial), R037 (partial), R042 (partial), R049, R055, R056, R060, R063 (unreachable) |
| P3 | 8 | R020 (partial), R034 (partial), R035 (partial), R040 (partial), R050, R064 (partial), R065 (partial), R066 (partial) |

## Auditor Queue

Priority-ordered list for Implementation Auditor to verify correctness.

### Tier 1: Core Formulas and Enumerations (verify correctness first)
1. **R001** — Trainer Combat Stats Definition (C001, C063) — verify 6 stats on model
2. **R003** — Skill Categories (C062) — verify 17 skills in 3 categories
3. **R004** — Skill Ranks and Dice (C062) — verify rank/dice mapping
4. **R008** — Trainer HP Formula (C011, C050) — verify Level*2 + HP*3 + 10
5. **R009** — Physical Evasion Formula (C050) — verify floor(Defense/5), cap +6
6. **R010** — Special Evasion Formula (C050) — verify floor(SpDef/5), cap +6
7. **R011** — Speed Evasion Formula (C050) — verify floor(Speed/5), cap +6
8. **R012** — Evasion General Formula (C050) — verify floor division, cap
9. **R041** — Action Points Pool (calculateMaxAp) — verify 5 + floor(level/5)
10. **R068** — Percentages Are Additive — verify additive pattern in calculations

### Tier 2: Core Constraints (verify enforcement)
11. **R002** — Starting Stat Baseline (C063, C070) — verify base values and validation
12. **R005** — Skill Rank Level Prerequisites (C062, C063, C071) — verify Adept@2, Expert@6, Master@12
13. **R006** — Skills Default Rank (C062) — verify getDefaultSkills returns Untrained
14. **R021** — Rounding Rule — verify Math.floor usage in formulas
15. **R022** — Starting Edges (C063, C072) — verify 4 edges at level 1
16. **R023** — Starting Skill Cap (C063, C071) — verify Novice cap at level 1
17. **R026** — Edges Per Level (C063, C072) — verify level-based edge budget
18. **R030** — Starting Features (C063, C072) — verify 4 + 1 training feature
19. **R032** — Max Class Features (C060, C050) — verify max 4 cap
20. **R036** — Features Per Level (C063, C072) — verify odd-level feature gain
21. **R038** — Stat Points Per Level (C063, C070) — verify 10 + level budget
22. **R039** — Edges Per Level Advancement (C063) — verify even-level edge gain
23. **R040** — Max Trainer Level — verify if any validation exists for level <= 50

### Tier 3: Core Workflows (verify flow correctness)
24. **R007** — Background Skill Modification (C050, C064, C071) — verify 11 presets + custom, 1 Adept + 1 Novice + 3 Pathetic
25. **R051** — Character Creation Workflow (C080, C050) — verify full flow and section coverage
26. **R052** — Steps 3/4 Interleaving (C080) — verify no forced ordering
27. **R025** — Skill Edge Definitions (C050, C062) — verify addSkillEdge rank bump

### Tier 4: Partial Items (verify present portion)
28. **R024** — Pathetic Skills Raised at Creation — verify soft warning exists
29. **R033** — Stat Tag Effect — verify features stored, no auto-bonus
30. **R034** — Ranked Feature Tag — verify string storage, no rank tracking
31. **R035** — Branch Feature Tag — verify isBranching flag on classes
32. **R037** — No Duplicate Features — verify array storage, no dedup
33. **R042** — AP Refresh Per Scene — verify AP tracked, no scene-trigger
34. **R044** — Level 2 Milestone — verify skill rank cap unlocks, no bonus edge prompt
35. **R046** — Level 6 Milestone — verify Expert rank unlock, no bonus edge prompt
36. **R048** — Level 12 Milestone — verify Master rank unlock, no bonus edge prompt

### Tier 5: Implemented-Unreachable (verify logic, flag access gap)
37. **R063** — AP Spend for Roll Bonus — verify AP fields exist, confirm player view is read-only

### Tier 6: Modifier Items (verify passive correctness)
38. **R031** — Free Training Feature (C050) — verify setTrainingFeature is separate from features
39. **R043** — AP Bind and Drain (C001, C020, C022) — verify drainedAp/boundAp fields and healing flow
40. **R019** — Trainer Size — verify Medium default treatment
41. **R020** — Weight Class — verify weight field exists, no WC derivation
42. **R064-R066** — Skill edge modifiers — verify storage as strings, no auto-bonus
