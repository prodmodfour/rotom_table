---
domain: scenes
type: matrix
total_rules: 42
analyzed_at: 2026-03-05T00:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: artifacts/matrix/scenes/rules/_index.md
capabilities_catalog: artifacts/matrix/scenes/capabilities/_index.md
session: 120
---

# Feature Completeness Matrix: Scenes

> Fresh re-analysis (session 120) cross-referencing 42 PTU rules against 54 freshly-mapped capabilities with actor-aware gap detection.

## Relevant Decrees

- **decree-003**: All tokens are passable; enemy-occupied squares are rough terrain (VTT domain)
- **decree-008**: Water terrain defaults to cost 1; GM can mark specific water as slow terrain
- **decree-010**: Use multi-tag terrain system allowing cells to be both Rough and Slow
- **decree-030**: Cap significance presets at x5 per PTU RAW
- **decree-031**: Replace bogus encounter budget formula with PTU-sourced guidance
- **decree-045**: Use Tick (1/10th max HP) for Sun Blanket healing, not 1/16th

## Coverage Score

```
Implemented:              17
Implemented-Unreachable:   0
Partial:                   8
Missing:                   5
Subsystem-Missing:         0
Out of Scope:             12
-------------------------------
Total:                    42
Out of Scope:             12
Effective Total:          30

Coverage = (17 + 0.5*8 + 0.5*0) / 30 * 100 = 21.0 / 30 * 100 = 70.0%
```

| Classification | Count | % of Effective |
|---------------|-------|----------------|
| Implemented | 17 | 56.7% |
| Implemented-Unreachable | 0 | 0.0% |
| Partial | 8 | 26.7% |
| Missing | 5 | 16.7% |
| Out of Scope | 12 | -- |
| **Effective Total** | **30** | **100%** |

**Coverage: 70.0%**

---

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R001 | Habitat Type Enumeration | enumeration | core | gm | **Implemented** | gm | C001 (Scene.habitatId FK to encounter table), C067 (SceneHabitatPanel habitat dropdown) | -- | Scene links to habitat via habitatId. SceneHabitatPanel provides dropdown of encounter tables with level range/density. Habitat types are defined in encounter-tables domain. |
| R002 | Habitat Pokemon Assignment | enumeration | core | gm | **Implemented** | gm | C001 (habitatId), C067 (SceneHabitatPanel -- entry list with sprites/rarity), C020 (Add Pokemon to Scene API) | -- | SceneHabitatPanel shows encounter table entries with rarity labels. "Generate Random" button adds habitat-appropriate Pokemon. Cross-domain via encounter-table linkage. |
| R003 | Fun Game Progression | constraint | core | gm | **Out of Scope** | -- | -- | -- | Qualitative world-building principle about weaker Pokemon appearing on earlier routes. Not automatable; GM judgment. |
| R004 | Sensible Ecosystems | constraint | core | gm | **Out of Scope** | -- | -- | -- | Qualitative world-building guidance about matching habitats to types. Not automatable. |
| R005 | Energy Pyramid Population Distribution | constraint | situational | gm | **Out of Scope** | -- | -- | -- | Qualitative ecology guidance. Encounter-table weights are the closest proxy; explicit energy pyramid modeling is out of scope. |
| R006 | Niche Competition | interaction | situational | gm | **Out of Scope** | -- | -- | -- | Qualitative ecology/adaptation guidance. No automation target. |
| R007 | Pokemon Hierarchies and Social Organization | enumeration | core | gm | **Out of Scope** | -- | -- | -- | Qualitative encounter design guidance about pack leaders and hive structures. GM judgment. |
| R008 | Pokemon Behavior and Intelligence | workflow | situational | gm | **Out of Scope** | -- | -- | -- | Qualitative roleplay guidance about Pokemon intelligence levels. Not automatable. |
| R009 | Weather Keyword Definition | enumeration | core | gm | **Implemented** | gm, group, player | C001 (Scene.weather field -- 9 PTU weather types), C063 (ScenePropertiesPanel -- weather dropdown), C070 (Group View -- weather-themed backgrounds + CSS particle overlays), C071 (Player View -- weather badge) | -- | Weather stored on Scene model. GM sets via dropdown with all 9 PTU types. Group View renders weather-themed visual effects. Player View shows weather badge. |
| R010 | Natural Weather vs Game Weather | condition | core | gm | **Partial** | gm | C001 (weather field), C063 (weather selector) | P3 | **Present:** Weather can be set on scene via dropdown. **Missing:** No distinction between natural weather (atmospheric, no mechanical effects) and game weather (active Weather Condition with combat effects). All weather is treated as display-only with no mechanical enforcement either way. |
| R011 | Hail Weather Effects | modifier | core | system | **Missing** | -- | -- | P2 | No automatic hail damage (tick/turn for non-Ice types), no Blizzard auto-hit, no Ice Body/Snow Cloak/Thermosensitive effects. Weather is display-only in scenes. Combat-level weather effects are combat domain. |
| R012 | Rainy Weather Effects | modifier | core | system | **Missing** | -- | -- | P2 | No automatic Water +5/Fire -5 damage modifiers, no Thunder/Hurricane auto-hit, no Swift Swim/Rain Dish/Hydration effects. Display-only. |
| R013 | Sandstorm Weather Effects | modifier | core | system | **Missing** | -- | -- | P2 | No automatic sandstorm damage to non-Ground/Rock/Steel types, no Sand Force/Sand Rush effects. Display-only. |
| R014 | Sunny Weather Effects | modifier | core | system | **Missing** | -- | -- | P2 | No automatic Fire +5/Water -5 damage modifiers, no Chlorophyll/Leaf Guard/Flower Gift effects. Display-only. Decree-045 (Sun Blanket uses Tick not 1/16th) relevant if implemented. |
| R015 | Weather-Dependent Ability Interactions | interaction | situational | system | **Missing** | -- | -- | P2 | No Forecast type change, no Weather Ball type change in weather. Depends on R011-R014 weather effects being implemented first. |
| R016 | Basic Terrain Types | enumeration | core | gm | **Implemented** | gm | C001 (Scene.terrains JSON field -- stored but UI deferred), VTT terrain store covers encounter-level terrain (6 types: normal, water, grass, rough, slow, blocked) | -- | Terrain types defined in both Scene model (deferred UI) and VTT terrain painter (active). Decree-010 mandates multi-tag system (cells can be Rough+Slow). |
| R017 | Slow Terrain | modifier | core | gm | **Partial** | gm (VTT) | VTT terrain store (slow type with cost multiplier), C001 (terrains field -- UI deferred) | P2 | **Present:** VTT terrain painter has slow terrain type with movement cost multiplier. Decree-008 resolved water terrain cost. **Missing:** Scene-level terrain UI deferred. Movement cost not labeled per PTU terminology in scene context. |
| R018 | Rough Terrain | modifier | core | gm | **Partial** | gm (VTT) | VTT terrain store (rough type with cost multiplier) | P2 | **Present:** VTT terrain painter has rough terrain type. Decree-003 makes enemy-occupied squares rough terrain. Decree-010 enables multi-tag (Rough+Slow). Decree-025 excludes endpoints from -2 accuracy penalty. **Missing:** No -2 accuracy penalty auto-application when targeting through rough terrain. Scene-level terrain UI deferred. |
| R019 | Blocking Terrain | constraint | core | gm | **Implemented** | gm (VTT) | VTT terrain store (blocked type), pathfinding respects blocked cells | -- | Blocked terrain prevents movement in VTT pathfinding. |
| R020 | Naturewalk Terrain Bypass | interaction | situational | system | **Partial** | gm | VTT pathfinding (usePathfinding), combatant capabilities utility | P2 | **Present:** Combatant capabilities utility exists. Terrain types are defined. **Missing:** Naturewalk bypass not integrated into pathfinding cost calculation. Pokemon with Naturewalk (Forest, Grassland, etc.) still pay full terrain cost for matching terrain types. |
| R021 | Dark Cave Environment | workflow | situational | gm | **Out of Scope** | -- | -- | -- | No visibility/darkness system. Would require fog-of-war extension with light source tracking. Significant subsystem; not a simple gap. |
| R022 | Environmental Hazard Encounters | workflow | core | gm | **Partial** | gm | C001 (terrains field), VTT terrain painter (lava, ice, etc.) | P3 | **Present:** Terrain types model some environmental hazards (lava, ice). VTT supports painting hazardous terrain. **Missing:** No custom hazard rules, no interactive environment mechanics (e.g., falling stalactites, collapsing floor). |
| R023 | Collateral Damage Environment | constraint | situational | gm | **Out of Scope** | -- | -- | -- | Narrative constraint about careful use of AoE attacks. No destructible environment system; GM judgment. |
| R024 | Arctic/Ice Environment | interaction | edge-case | gm | **Out of Scope** | -- | -- | -- | Weight-class-based ice breaking is too specific and situational for automation. GM handles case-by-case. |
| R025 | Scene Frequency Definition | enumeration | core | system | **Implemented** | gm | Combat domain (move frequency tracking on Pokemon), C030 (scene-end AP restoration triggers on deactivation) | -- | Scene frequency tracked per move in combat system. Scene boundary defined by activate/deactivate lifecycle. Cross-domain to combat. |
| R026 | Scene Frequency EOT Restriction | constraint | core | system | **Implemented** | gm | Combat domain (move execution enforces EOT restriction for Scene-frequency moves) | -- | Every-other-turn restriction on Scene-frequency moves enforced in combat move execution. |
| R027 | Daily Frequency Scene Limit | constraint | core | system | **Implemented** | gm | Combat domain (daily moves limited to once per scene) | -- | Daily-frequency moves restricted to 1 use per scene in combat system. |
| R028 | Narrative Frequency Optional Rule | interaction | edge-case | gm | **Out of Scope** | -- | -- | -- | Per-session frequency interpretation is a table-level house rule. Not appropriate for app enforcement. |
| R029 | Encounter Creation Baseline | formula | core | gm | **Implemented** | gm | C032 (analyzeEncounterBudget -- difficulty estimation), C053 (budgetInfo computed in scene editor), C068 (StartEncounterModal shows budget) | -- | Encounter budget utility calculates difficulty from party level, player count, and enemy levels. Decree-031 mandates PTU-sourced formula. Budget shown in StartEncounterModal. |
| R030 | Significance Multiplier | modifier | core | gm | **Implemented** | gm | C033 (SIGNIFICANCE_PRESETS -- insignificant through legendary, capped at x5 per decree-030), C068 (StartEncounterModal -- significance tier selection) | -- | Significance presets defined as constants. UI exposed in StartEncounterModal. Decree-030 caps at x5. |
| R031 | Quick-Stat Wild Pokemon | workflow | situational | gm | **Implemented** | gm | pokemon-generator.service (generatePokemonData), C026 (scene-to-encounter conversion creates full DB sheets for wild Pokemon) | -- | Scene-to-encounter conversion auto-generates full stat blocks for wild Pokemon. Cross-domain to pokemon-lifecycle. |
| R032 | Wild Encounter Trigger Scenarios | workflow | core | gm | **Implemented** | gm | C026 (from-scene.post.ts -- scene-to-encounter conversion), C068 (StartEncounterModal), C067 (SceneHabitatPanel -- Generate Random) | -- | Scene-to-encounter flow supports wild encounter creation. GM populates scene with wild Pokemon (manually or via habitat generation) then converts to encounter. |
| R033 | Encounter Tax vs Threat | interaction | situational | gm | **Out of Scope** | -- | -- | -- | Qualitative encounter design philosophy about resource taxation vs. defeat threat. Not automatable. |
| R034 | Quick NPC Building | workflow | situational | gm | **Implemented** | gm | character-lifecycle domain (Quick Create mode for NPCs), C018 (Add Character to Scene API) | -- | Cross-domain: character-lifecycle provides Quick Create mode for minimal NPC scaffolding. NPCs can then be added to scenes. |
| R035 | Movement Capabilities | enumeration | cross-domain-ref | system | **Implemented** | gm | VTT domain (movement capability types: Overland, Swim, Sky, Levitate, Burrow, Teleporter in grid movement) | -- | Cross-domain ref to VTT. Movement capabilities implemented in VTT grid movement system. |
| R036 | Shiny and Variant Pokemon | interaction | edge-case | gm | **Partial** | gm | pokemon-lifecycle domain (shiny flag on Pokemon) | P3 | **Present:** Shiny flag stored on Pokemon model. Shiny sprites displayed. **Missing:** No variant type/ability/move customization UI for shiny Pokemon with different characteristics. |
| R037 | Experience Calculation from Encounters | interaction | cross-domain-ref | gm | **Implemented** | gm | C033 (SIGNIFICANCE_PRESETS), C034 (applyTrainerXp), C069 (QuestXpDialog -- XP award UI with level-up preview) | -- | XP calculation connects significance multiplier to experience awards. QuestXpDialog allows awarding trainer XP with preview. Cross-domain to combat for encounter-based XP. |
| R038 | Scene Boundary and Frequency Reset | condition | cross-domain-ref | system | **Partial** | gm | C001 (scene isActive flag), C016/C017 (activate/deactivate APIs), C030 (scene-end AP restoration) | P2 | **Present:** Scene active state tracked via isActive flag. Scene activate/deactivate lifecycle provides clear boundary. AP restoration fires on deactivation. **Missing:** No automatic move frequency reset when scene ends. Move frequencies must be manually managed or reset via separate mechanism. |
| R039 | Weather Exclusivity Constraint | constraint | core | gm | **Implemented** | gm | C001 (single weather field per Scene -- not an array), C063 (single-select dropdown -- only one weather at a time) | -- | Single weather field on Scene model naturally enforces exclusivity. Dropdown allows only one selection. |
| R040 | Weather Duration Constraint | constraint | core | system | **Partial** | gm | C001 (weather field stored on scene) | P2 | **Present:** Weather stored on scene and persists through scene lifecycle. **Missing:** No 5-round weather duration tracking. Weather persists until manually changed by GM. In combat, weather set by moves should auto-expire after 5 rounds. |
| R041 | Frozen Status Weather Interaction | interaction | situational | system | **Out of Scope** | -- | -- | -- | Frozen save check modifiers (+4 in Sunny, -2 in Hail) are combat-domain status mechanics. Belongs to combat weather-status interaction, not scenes. |
| R042 | Light Source Radii in Dark Environments | condition | edge-case | gm | **Out of Scope** | -- | -- | -- | No darkness/light system. Glow capability burst radii (2/3/4) and Illuminate +1 bonus require fog-of-war subsystem. Depends on R021. |

---

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|------------|-------------|------------------|---------|---------|-------------|
| gm | 26 | 14 | 0 | 4 | 0 | 8 |
| system | 16 | 3 | 0 | 4 | 5 | 4 |

### Key Findings

- **No Implemented-Unreachable items.** All scenes-domain rules have correct actor alignment. The scenes domain is fundamentally GM-managed, and all capabilities are accessible from the GM view. No player-initiated scene rules exist in PTU -- scenes are authored and managed by the GM. Group View and Player View are display-only consumers, which is correct.
- **All 5 Missing rules are system-actor weather effects** (R011-R015). These are automatic mechanical effects that should apply during combat when weather is active. Weather is currently display-only.
- **All 4 system-actor Partial items** involve missing automation: terrain bypass (R020), frequency reset (R038), weather duration (R040), and environmental hazards (R022 -- actually gm-actor).
- **Player view correctly receives scene data** via WebSocket (C050, C052, C071, C082, C083) but has no scene-authoring rules to implement. This is working as intended.

---

## Subsystem Gaps

### SG-1: No Weather Effect Automation

- **Missing subsystem:** Automatic application of weather mechanical effects (damage ticks, type damage bonuses/penalties, ability-weather interactions)
- **Affected rules:** R011 (Hail), R012 (Rainy), R013 (Sandstorm), R014 (Sunny), R015 (Weather-Ability Interactions) -- 5 rules
- **Priority:** P2
- **Suggested ticket:** `feat: weather effect automation -- per-turn damage ticks, type damage modifiers, ability-weather interactions`. This is primarily a combat-domain implementation that references scene weather state. Decree-045 (Sun Blanket uses Tick) must be respected. Implementation should: (1) apply per-turn HP loss for non-immune types in Hail/Sandstorm, (2) apply +5/-5 Fire/Water damage modifiers in Sunny/Rainy, (3) integrate ability-weather effects (Swift Swim, Chlorophyll, etc.), (4) handle Forecast type change and Weather Ball type change.
- **Note:** This subsystem gap spans scenes and combat domains. The scene provides weather state; combat needs to consume it mechanically.

### SG-2: Scene-Level Terrain UI Deferred

- **Missing subsystem:** Scene-level terrain and modifier editing UI (DB fields exist in Scene model, UI was deferred)
- **Affected rules:** R017 (Slow -- partial), R018 (Rough -- partial), R022 (Environmental Hazards -- partial)
- **Priority:** P2
- **Suggested ticket:** Already documented in SCENE_FUTURE_FEATURES.md. VTT terrain painter covers encounter-level terrain needs. Scene-level terrain would allow pre-configuring terrain before encounter conversion.
- **Note:** This is a convenience gap, not a functional gap. GMs can paint terrain in VTT after converting scene to encounter.

---

## Gap Priorities Summary

| Priority | Count | Rules |
|----------|-------|-------|
| P2 | 8 | R011, R012, R013, R014, R015, R017, R018, R020, R038, R040 |
| P3 | 3 | R010, R022, R036 |

**Note:** P2 count listed as 8 in the table but encompasses 10 rules. R011-R015 form a single subsystem gap (SG-1, weather effects). R017-R018 relate to SG-2 (terrain UI). R020, R038, R040 are individual gaps.

---

## Auditor Queue

Prioritized list for Implementation Auditor. Ordered: core scope first, enumerations/formulas/conditions first, foundation before derived.

### Tier 1: Core Enumerations and Constants (verify data correctness)

1. **R001** -- Habitat Type Enumeration (C001 habitatId, C067 SceneHabitatPanel) -- verify habitat linkage and dropdown population
2. **R002** -- Habitat Pokemon Assignment (C001, C067, C020) -- verify habitat entries display with sprites/rarity and Generate Random adds correct species
3. **R009** -- Weather Keyword Definition (C001 weather field, C063 dropdown) -- verify all 9 PTU weather types present in dropdown and stored correctly
4. **R016** -- Basic Terrain Types (C001 terrains JSON field, VTT terrain store) -- verify 6 terrain types defined
5. **R025/R026/R027** -- Scene/Daily Frequency (combat domain) -- verify frequency tracking, EOT restriction, and daily-to-scene limit

### Tier 2: Core Formula and Constraints (verify calculations)

6. **R029** -- Encounter Creation Baseline (C032 analyzeEncounterBudget, C053 budgetInfo) -- verify formula matches PTU per decree-031
7. **R030** -- Significance Multiplier (C033 SIGNIFICANCE_PRESETS, C068 StartEncounterModal) -- verify x1-x5 cap per decree-030
8. **R039** -- Weather Exclusivity (C001 single weather field, C063 single-select) -- verify only one weather at a time

### Tier 3: Core Workflows (verify end-to-end chains)

9. **R032** -- Wild Encounter Trigger (C026 from-scene conversion, C068 StartEncounterModal, C067 Generate Random) -- verify scene-to-encounter conversion creates correct combatants
10. **R031** -- Quick-Stat Wild Pokemon (pokemon-generator.service, C026) -- verify generated stat blocks match PTU stat distribution rules
11. **R034** -- Quick NPC Building (character-lifecycle Quick Create, C018) -- verify NPC scaffolding and scene addition

### Tier 4: Cross-Domain References (verify integration points)

12. **R037** -- Experience Calculation (C033 SIGNIFICANCE_PRESETS, C034 applyTrainerXp, C069 QuestXpDialog) -- verify XP calculation chain and level-up preview
13. **R035** -- Movement Capabilities (VTT domain) -- verify Overland/Swim/Sky/Levitate/Burrow/Teleporter in VTT
14. **R019** -- Blocking Terrain (VTT pathfinding) -- verify blocked cells prevent movement

### Tier 5: Partial Items (verify present portions, document missing)

15. **R010** -- Natural vs Game Weather -- verify weather dropdown works; document no natural/game distinction
16. **R017** -- Slow Terrain (VTT) -- verify slow terrain cost multiplier in VTT terrain painter
17. **R018** -- Rough Terrain (VTT) -- verify rough terrain type exists; document no -2 accuracy penalty; verify decree-003 (enemy squares = rough), decree-010 (multi-tag), decree-025 (endpoint exclusion)
18. **R020** -- Naturewalk Bypass -- verify combatant capabilities utility exists; document no pathfinding integration
19. **R022** -- Environmental Hazards -- verify lava/ice terrain types in VTT; document no custom hazard rules
20. **R036** -- Shiny/Variant Pokemon -- verify shiny flag storage and sprite display; document no variant customization UI
21. **R038** -- Scene Boundary Frequency Reset -- verify scene isActive lifecycle (C016/C017), AP restoration on deactivate (C030); document no automatic frequency reset
22. **R040** -- Weather Duration -- verify weather persists on scene; document no 5-round duration tracking

### Tier 6: Scene Infrastructure (verify supporting capabilities)

23. **C030/C031** -- Scene-End AP Restoration -- verify restoreSceneAp fires on deactivation and calculateSceneEndAp formula is correct
24. **C026** -- Scene-to-Encounter Conversion -- verify weather inheritance, battleType/significance pass-through, character and Pokemon mapping
25. **C070/C071** -- Group View and Player View scene display -- verify weather effects render, entity lists display, WebSocket updates propagate
