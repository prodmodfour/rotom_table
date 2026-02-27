---
domain: scenes
analyzed_at: 2026-02-26T14:00:00Z
analyzed_by: coverage-analyzer
rules_catalog: scenes-rules.md
capabilities_catalog: scenes-capabilities.md
---

# Feature Completeness Matrix: Scenes

## Coverage Score

```
Implemented:              14
Implemented-Unreachable:   0
Partial:                   5
Missing:                   4
Subsystem-Missing:         0
Out of Scope:             19
---
Total:                    42
Effective Total:          23  (42 - 19 Out of Scope)

Coverage = (14 + 0.5*5) / 23 * 100
         = 16.5 / 23 * 100
         = 71.7%
```

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|---------------|-----------------|-------------|-------|
| R001 | Habitat Type Enumeration | enumeration | core | gm | **Implemented** | gm | — | C034 (SceneHabitatPanel links scene to encounter table by habitatId). Tables represent habitats. Scene links to a habitat for wild spawn context. |
| R002 | Habitat Pokemon Assignment | enumeration | core | gm | **Implemented** | gm | — | C034 (habitat link) + encounter-tables domain (species entries on table). Cross-domain: scene's habitat determines available wild Pokemon via linked encounter table. |
| R003 | Fun Game Progression | constraint | core | gm | **Out of Scope** | — | — | Qualitative design guidance for world-building. GM controls progression through encounter table level ranges, not through the scene system. |
| R004 | Sensible Ecosystems | constraint | core | gm | **Out of Scope** | — | — | Qualitative design guidance. Scene's habitat link provides context, but ecosystem design is GM responsibility via encounter tables. |
| R005 | Energy Pyramid Population | constraint | situational | gm | **Out of Scope** | — | — | Encounter table domain concern (species weighting). Not a scene-level feature. |
| R006 | Niche Competition | interaction | situational | gm | **Out of Scope** | — | — | Qualitative ecosystem design. Not mechanizable at the scene level. |
| R007 | Pokemon Hierarchies | enumeration | core | gm | **Out of Scope** | — | — | Qualitative encounter design guidance. GM applies when setting up encounters within a scene, not tracked by the scene model. |
| R008 | Pokemon Behavior and Intelligence | workflow | situational | gm | **Out of Scope** | — | — | Qualitative GM guidance for roleplay. Not mechanizable. |
| R009 | Weather Keyword Definition | enumeration | core | system | **Implemented** | gm, group, player | — | C001 (Scene model has weather field), C033 (ScenePropertiesPanel edits weather), C040 (WebSocket broadcasts scene_update including weather). Weather stored as string on scene. |
| R010 | Natural Weather vs Game Weather | condition | core | gm | **Partial** | gm | P3 | **Present:** Weather field on scene allows setting weather conditions. **Missing:** No distinction between narrative weather (sunny day) and mechanical weather (Sunny condition). GM must apply this judgment manually. This is inherently a GM decision, but the UI could offer guidance. |
| R011 | Hail Weather Effects | modifier | core | system | **Missing** | — | P2 | No automatic weather effect application. Hail damage (1 tick/turn for non-Ice), Blizzard accuracy, Ice Body healing, Snow Cloak evasion, Thermosensitive penalty — none automated. Weather is stored but effects are not applied during combat. |
| R012 | Rainy Weather Effects | modifier | core | system | **Missing** | — | P2 | No automatic rain effects. Water +5, Fire -5 damage modifiers, Thunder/Hurricane accuracy, ability triggers (Hydration, Rain Dish, Swift Swim, Desert Weather, Dry Skin) — none automated. |
| R013 | Sandstorm Weather Effects | modifier | core | system | **Missing** | — | P2 | No automatic sandstorm effects. Tick damage for non-Ground/Rock/Steel, Sand Force +5 bonus, Sand Rush speed, Desert Weather immunity — none automated. |
| R014 | Sunny Weather Effects | modifier | core | system | **Missing** | — | P2 | No automatic sun effects. Fire +5, Water -5 damage, Thunder/Hurricane AC 11, ability triggers (Dry Skin damage, Thermosensitive boost, Chlorophyll speed, etc.) — none automated. |
| R015 | Weather-Dependent Ability Interactions | interaction | situational | system | **Out of Scope** | — | — | Depends on weather effects (R011-R014) which are missing. Forecast type changes and Weather Ball type changes would be combat-domain automation. |
| R016 | Basic Terrain Types | enumeration | core | gm | **Implemented** | gm | — | VTT terrain store (vtt-grid-C003) has 6 terrain types including normal, rough, water, blocked. Scene model has terrains JSON field (DB storage exists). VTT terrain painter covers this at the encounter/grid level. |
| R017 | Slow Terrain | modifier | core | system | **Implemented** | gm | — | VTT useGridMovement (vtt-grid-C014) applies terrain cost multipliers. Slow terrain (ice in VTT) costs 2x movement. Applied at VTT grid level during encounters. |
| R018 | Rough Terrain | modifier | core | system | **Implemented** | gm | — | VTT terrain store has rough terrain type with movement cost. Rough terrain flag exists on grid cells. -2 accuracy penalty is a combat-domain concern. |
| R019 | Blocking Terrain | constraint | core | system | **Implemented** | gm | — | VTT terrain store has blocked terrain type. Blocking terrain prevents movement through cells. usePathfinding (vtt-grid-C030) treats blocked cells as impassable. |
| R020 | Naturewalk Terrain Bypass | interaction | situational | system | **Out of Scope** | — | — | Naturewalk capability ignoring terrain penalties is a combat/movement automation feature. Would need per-Pokemon capability checking against terrain type. Not implemented in movement system. |
| R021 | Dark Cave Environment | workflow | situational | gm | **Out of Scope** | — | — | Darkness/visibility mechanics (-2 per unlit meter) are combat-domain features. Scene weather/environment doesn't model light sources or darkness penalties. |
| R022 | Environmental Hazard Encounters | workflow | core | gm | **Partial** | gm | P3 | **Present:** Scene has terrain/modifier DB fields (C001), VTT terrain painter (C046) provides environmental setup at encounter level. **Missing:** Scene-level terrain UI is deferred (MS-2). GM can set up environmental hazards via VTT terrain painter but not pre-define them at the scene level. |
| R023 | Collateral Damage Environment | constraint | situational | gm | **Out of Scope** | — | — | Qualitative encounter design guidance. No destructible environment or collateral damage tracking. |
| R024 | Arctic/Ice Environment | interaction | edge-case | gm | **Out of Scope** | — | — | Specific environmental rules (ice breaking, weight class restriction). Would need custom encounter rules system. |
| R025 | Scene Frequency Definition | enumeration | core | system | **Implemented** | gm | — | Move frequency tracking exists in combat system. Scene-frequency moves tracked per encounter. The concept of "Scene" as a frequency boundary is understood by the combat system. |
| R026 | Scene Frequency EOT Restriction | constraint | core | system | **Implemented** | gm | — | Scene-frequency moves with Scene X > 1 can still only be used EOT (every other turn). Enforced in combat move execution system. |
| R027 | Daily Frequency Scene Limit | constraint | core | system | **Implemented** | gm | — | Daily moves limited to once per scene. Tracked in combat frequency system. |
| R028 | Narrative Frequency Optional Rule | interaction | edge-case | gm | **Out of Scope** | — | — | Optional house rule variant (per-day becomes per-session). Not implemented as a setting. |
| R029 | Encounter Creation Baseline | formula | core | gm | **Implemented** | gm | — | encounter-tables-C030 (calculateEncounterBudget: avgPokemonLevel * 2 * playerCount). Cross-domain but accessible from GM encounter view. |
| R030 | Significance Multiplier | modifier | core | gm | **Implemented** | gm | — | encounter-tables-C034 (SIGNIFICANCE_PRESETS), C046 (SignificancePanel). Accessible on encounter. |
| R031 | Quick-Stat Wild Pokemon | workflow | situational | gm | **Out of Scope** | — | — | Pokemon stat generation is pokemon-lifecycle domain. Cross-domain reference. |
| R032 | Wild Encounter Trigger Scenarios | workflow | core | gm | **Out of Scope** | — | — | Qualitative narrative guidance for why encounters happen. Not mechanizable. |
| R033 | Encounter Tax vs Threat | interaction | situational | gm | **Out of Scope** | — | — | Qualitative encounter design guidance. GM applies when setting significance. |
| R034 | Quick NPC Building | workflow | situational | gm | **Partial** | gm | P2 | **Present:** C080 Quick Create mode creates minimal NPC scaffolding (name, type, level, location, sprite). **Missing:** No guided Quick-Stat NPC workflow (choose classes, major skills, distribute stats per PTU quick-stat rules). Quick Create is minimal scaffolding, not the full PTU quick-stat process. |
| R035 | Movement Capabilities | enumeration | cross-domain-ref | system | **Implemented** | gm | — | Cross-domain: VTT grid handles movement capabilities (Overland, Swim, Sky, Burrow) during encounters. Scene doesn't track movement directly. |
| R036 | Shiny and Variant Pokemon | interaction | edge-case | gm | **Partial** | gm | P3 | **Present:** Pokemon model has shiny flag, generation supports shiny parameter. **Missing:** No "variant" Pokemon support (alternate types, abilities, movesets). Only cosmetic shiny supported. |
| R037 | Experience Calculation | interaction | cross-domain-ref | gm | **Implemented** | gm | — | encounter-tables-C033 (calculateEncounterXp). Cross-domain, accessible from encounter view. |
| R038 | Scene Boundary and Frequency Reset | condition | cross-domain-ref | system | **Partial** | gm | P2 | **Present:** Scene-frequency and daily-frequency moves tracked per encounter. **Missing:** No explicit scene boundary mechanism that triggers frequency resets. Scene transitions don't auto-reset encounter frequencies. GM must start a new encounter (which resets scene-freq). |
| R039 | Weather Exclusivity | constraint | core | system | **Implemented** | gm | — | C001 (weather is a single string field on Scene). Only one weather condition at a time by data model design. |
| R040 | Weather Duration (5 rounds) | constraint | core | system | **Missing** | — | P2 | No weather duration tracking. Weather on scene is persistent until manually changed. In combat, weather moves should create 5-round weather, but no countdown timer exists. Cross-domain with combat. |
| R041 | Frozen Status Weather Interaction | interaction | situational | system | **Out of Scope** | — | — | Depends on weather effects (R011/R014) and status save check automation. Combat-domain feature. |
| R042 | Light Source Radii | condition | edge-case | gm | **Out of Scope** | — | — | Light/darkness mechanics. No light source tracking, no Glow capability radius, no Illuminate ability bonus. Would need fog-of-war integration with per-Pokemon light sources. |

## Actor Accessibility Summary

| Actor | Total Rules | Implemented | Impl-Unreachable | Partial | Missing | Out of Scope |
|-------|-------------|-------------|-------------------|---------|---------|-------------|
| system | 19 | 10 | 0 | 2 | 4 | 3 |
| gm | 23 | 4 | 0 | 3 | 0 | 16 |

**Actor reachability:**
- **system** rules (weather effects, terrain modifiers, frequency constraints): 10/19 implemented — main gaps are weather effect automation (R011-R014) and weather duration (R040)
- **gm** rules: 4/23 implemented, 3 partial — many rules are out of scope (qualitative design guidance). In-scope GM rules are well covered.
- **player** rules: None in this domain. Players observe scenes via WebSocket (C040) but don't interact with scene management.

## Subsystem Gaps

### SG-1: No Weather Effect Automation
- **Missing subsystem:** Automatic application of weather effects (damage, type bonuses, ability triggers)
- **Affected rules:** R011, R012, R013, R014 (4 rules)
- **Suggested feature ticket:** "feat: automate weather effects in combat (damage ticks, type bonuses, ability triggers)"
- **Priority:** P2 — weather effects are commonly used in PTU encounters but can be manually tracked by GM

### SG-2: Scene-Level Terrain UI Deferred (MS-2)
- **Missing subsystem:** Scene terrain/modifier editing UI
- **Affected rules:** R022 (partial)
- **Suggested feature ticket:** Already tracked in docs/SCENE_FUTURE_FEATURES.md
- **Priority:** P3 — VTT terrain painter covers this at encounter level

## Gap Priorities

| Priority | Count | Rules |
|----------|-------|-------|
| P2 | 6 | R011, R012, R013, R014 (weather effects), R034 (partial — quick NPC), R038 (partial — scene boundary), R040 (weather duration) |
| P3 | 3 | R010 (partial — natural vs game weather), R022 (partial — scene terrain UI), R036 (partial — variant Pokemon) |

## Auditor Queue

Priority-ordered list for Implementation Auditor to verify correctness.

### Tier 1: Core Data Model (verify structure)
1. **R009** — Weather Keyword (C001) — verify weather field on Scene model, verify editable via UI
2. **R039** — Weather Exclusivity (C001) — verify single-value weather field
3. **R016** — Basic Terrain Types — verify VTT terrain types map to PTU terrain types
4. **R001** — Habitat Enumeration (C034) — verify habitat link via habitatId FK

### Tier 2: Terrain and Movement (verify VTT integration)
5. **R017** — Slow Terrain — verify 2x movement cost in VTT useGridMovement
6. **R018** — Rough Terrain — verify rough terrain type exists, movement cost applied
7. **R019** — Blocking Terrain — verify blocked terrain prevents movement, pathfinding treats as impassable

### Tier 3: Frequency Constraints (verify combat integration)
8. **R025** — Scene Frequency Definition — verify scene-frequency tracking in combat system
9. **R026** — Scene Frequency EOT Restriction — verify EOT enforcement for Scene X > 1
10. **R027** — Daily Frequency Scene Limit — verify daily moves limited to once per scene

### Tier 4: Encounter Budget (verify cross-domain)
11. **R029** — Encounter Creation Baseline — verify calculateEncounterBudget formula
12. **R030** — Significance Multiplier — verify SIGNIFICANCE_PRESETS match PTU scale
13. **R037** — Experience Calculation — verify calculateEncounterXp

### Tier 5: Scene Workflow (verify chains)
14. **R002** — Habitat Pokemon Assignment — verify scene habitat link enables generation
15. **R035** — Movement Capabilities — verify VTT movement system handles Overland/Swim/Sky/Burrow

### Tier 6: Partial Items (verify present portion)
16. **R010** — Natural vs Game Weather — verify weather field accepts any string (no validation)
17. **R022** — Environmental Hazards — verify terrain DB fields exist, confirm UI deferred
18. **R034** — Quick NPC Building — verify Quick Create mode scope (name, type, level, location, sprite)
19. **R036** — Shiny Pokemon — verify shiny flag on Pokemon model
20. **R038** — Scene Boundary Frequency Reset — verify no auto-reset trigger at scene transition
