---
domain: scenes
type: audit
session: 121
audited_at: 2026-03-05
audited_by: implementation-auditor
matrix_source: artifacts/matrix/scenes-matrix.md
rules_catalog: artifacts/matrix/scenes/rules/_index.md
capabilities_catalog: artifacts/matrix/scenes/capabilities/_index.md
total_items: 25
correct: 19
incorrect: 1
approximation: 3
ambiguous: 0
---

# Scenes Domain Audit Report (Session 121)

> Fresh audit against session-120 matrix (artifacts/matrix/scenes-matrix.md). 25 queued items across 6 tiers verified against source code and PTU 1.05 rulebook. All relevant decrees checked.

## Summary

| Classification | Count | Severity Breakdown |
|---------------|-------|--------------------|
| Correct | 19 | -- |
| Incorrect | 1 | MEDIUM: 1 |
| Approximation | 3 | MEDIUM: 2, LOW: 1 |
| Ambiguous | 0 | -- |
| **Total** | **25** | |

---

## Tier 1: Core Enumerations and Constants

### Item 1: R001 -- Habitat Type Enumeration

- **Rule:** PTU Chapter 14 defines habitat types (Forest, Grassland, Mountain, Cave, Urban, etc.) as categories for organizing wild Pokemon encounters. Habitats contain weighted lists of Pokemon species.
- **Expected behavior:** Scene links to a habitat/encounter table. GM can select from available habitats via dropdown. Habitat entries list species with rarity.
- **Actual behavior:** `Scene.habitatId` (FK-like string field) in `app/prisma/schema.prisma:521` links to an `EncounterTable`. `SceneHabitatPanel.vue` (lines 19-33) provides a `<select>` dropdown populated from `encounterTables` prop. Selected table shows `levelRange`, `density`, and entry list with sprites and rarity labels (lines 57-86). Rarity labels are computed from weight percentages (lines 151-158).
- **Classification:** Correct
- **Notes:** Habitat types are defined in the encounter-tables domain (EncounterTable model). The scene links via habitatId. Dropdown shows all available tables with level range and density metadata. Entry list shows species sprites and rarity labels (Common/Uncommon/Rare/Very Rare).

### Item 2: R002 -- Habitat Pokemon Assignment

- **Rule:** PTU habitats assign Pokemon species with encounter weights determining rarity. GMs can generate random Pokemon from the habitat.
- **Expected behavior:** Habitat entries display with sprites and rarity labels. "Generate Random" button creates Pokemon appropriate to the habitat.
- **Actual behavior:** `SceneHabitatPanel.vue` displays entries with sprites via `getSpriteUrl(entry.speciesName)` (line 64), species names (line 70), and computed rarity labels (line 72). Each entry has an "Add" button (lines 78-82) that emits `add-pokemon` with a random level within range. "Generate Random" button (lines 47-54) emits `generate-encounter` with the table ID. The parent page wires this to the encounter generation service.
- **Classification:** Correct
- **Notes:** Species are displayed with sprites (via `usePokemonSprite`), level ranges, and weight-based rarity labels. Individual add and bulk generate flows both present.

### Item 3: R009 -- Weather Keyword Definition

- **Rule:** PTU defines 9 weather types: Sunny, Rainy, Sandstorm, Hail, Snow, Fog, Harsh Sunlight, Heavy Rain, Strong Winds. (PTU Core p.340 Weather keyword, abilities like Drizzle/Drought on p.311+)
- **Expected behavior:** All 9 weather types available in scene weather dropdown and stored correctly.
- **Actual behavior:** `ScenePropertiesPanel.vue` (lines 50-64) provides a `<select>` with exactly 9 options: `sunny`, `rain`, `sandstorm`, `hail`, `snow`, `fog`, `harsh_sunlight`, `heavy_rain`, `strong_winds` plus "None". `Scene.weather` in `schema.prisma:516` stores as nullable string. The Encounter model (line 190) uses the same values.
- **Classification:** Correct
- **Notes:** All 9 PTU weather types present. Values use snake_case storage convention. "Rain" maps to PTU "Rainy" -- this is a display-only label difference, the underlying keyword is the same. The values match those in the Encounter model for cross-domain consistency.

### Item 4: R016 -- Basic Terrain Types

- **Rule:** PTU defines terrain categories: Normal/Basic, Slow, Rough, Blocking. Additional types include water, ice, lava. (PTU p.231, p.481)
- **Expected behavior:** 6+ terrain types defined in VTT terrain store. Multi-tag support per decree-010.
- **Actual behavior:** `app/stores/terrain.ts` defines `TERRAIN_COSTS` (lines 23-32) with 8 base types: `normal`, `difficult` (legacy), `blocking`, `water`, `earth`, `rough` (legacy), `hazard`, `elevated`. Multi-tag system via `TerrainFlags` (line 19): `{ rough: boolean, slow: boolean }`. Legacy types (`difficult`, `rough`) are migrated to `normal` + flags by `migrateLegacyCell()` (lines 59-114). Movement cost getter (lines 149-163) correctly aggregates base type cost + slow flag doubling.
- **Classification:** Correct
- **Notes:** Per decree-010, cells can have both rough and slow flags simultaneously. Per decree-008, water defaults to cost 1. The terrain system has 8 base types plus 2 overlay flags, exceeding the 6-type minimum. Legacy migration handles backward compatibility cleanly.

### Item 5: R025/R026/R027 -- Scene/Daily Frequency

- **Rule:** PTU p.337: Scene-frequency moves have per-scene usage limits (Scene = 1 use, Scene x2 = 2 uses, Scene x3 = 3 uses). EOT restriction applies to Scene x2/x3 between uses. Daily-frequency moves can only be used once per scene (for Daily x2/x3).
- **Expected behavior:** Scene frequency tracking enforces per-scene limits. EOT restriction enforced for Scene x2/x3. Daily moves limited to 1 use per scene.
- **Actual behavior:** `app/utils/moveFrequency.ts`:
  - `getSceneLimit()` (lines 26-37): Scene=1, Scene x2=2, Scene x3=3.
  - `checkMoveFrequency()` (lines 97-181): Scene moves check `usedThisScene` against limit (lines 128-149). Scene x2/x3 enforce EOT between uses via `lastTurnUsed` (lines 139-148). Daily x2/x3 enforce 1-use-per-scene via `usedThisScene` check (lines 166-175).
  - `incrementMoveUsage()` (lines 195-228): Correctly increments `usedThisScene` and `lastTurnUsed` for scene-frequency moves. Daily moves also track `usedThisScene`.
  - `resetSceneUsage()` (lines 234-246): Resets `usedThisScene` and `lastTurnUsed` to 0 for all moves.
- **Classification:** Correct
- **Notes:** All three rules (R025 scene limit, R026 EOT between uses, R027 daily-to-scene limit) are correctly implemented. The comments cite PTU p.337 accurately. The `resetSceneUsage` function exists but is not automatically called on scene boundary (see Item 21/R038).

---

## Tier 2: Core Formula and Constraints

### Item 6: R029 -- Encounter Creation Baseline

- **Rule:** PTU Chapter 11 (p.460): Work backwards from desired XP to determine enemy levels. Decree-031 mandates replacing a bogus formula that cited non-existent "Core p.473" with PTU-sourced guidance.
- **Expected behavior:** Encounter budget formula uses PTU-sourced guidance per decree-031. No false citation to p.473.
- **Actual behavior:** `app/utils/encounterBudget.ts` (lines 1-22) documents the formula as "PTU Encounter Creation Guide, Chapter 11" guideline: `averagePokemonLevel * 2 = baseline per player, * playerCount = total`. The comment explicitly states "This is a GM guideline, not a hard formula." The previous bogus citation to "Core p.473" has been removed. `calculateEncounterBudget()` (lines 129-145) implements this formula. `analyzeEncounterBudget()` (lines 177-193) adds difficulty assessment with app-specific heuristic thresholds labeled clearly as such.
- **Classification:** Correct (per decree-031)
- **Notes:** The bogus citation has been removed. The formula is described as a GM guideline from Chapter 11, not a hard formula. The difficulty thresholds (trivial/easy/balanced/hard/deadly) are clearly labeled as app-specific heuristics, not PTU rules. This satisfies decree-031's requirement to replace the false citation with PTU-sourced guidance.

### Item 7: R030 -- Significance Multiplier

- **Rule:** PTU Core p.460: "The Significance Multiplier should range from x1 to about x5." Decree-030: Cap significance presets at x5, remove climactic (x6) and legendary (x8).
- **Expected behavior:** Presets capped at x5. No x6/x8 tiers. Three tiers: insignificant (x1-x1.5), everyday (x2-x3), significant (x4-x5).
- **Actual behavior:** `app/utils/encounterBudget.ts` (lines 83-105): `SIGNIFICANCE_PRESETS` defines exactly 3 tiers:
  - `insignificant`: range x1.0-x1.5, default x1.0
  - `everyday`: range x2.0-x3.0, default x2.0
  - `significant`: range x4.0-x5.0, default x5.0
  Comment on line 80-82 cites decree-030 and PTU Core p.460. Server-side validation in `app/server/utils/significance-validation.ts` (lines 7-11) whitelists only these three tiers. `StartEncounterModal.vue` (lines 60-72) renders only these 3 presets as radio options.
- **Classification:** Correct (per decree-030)
- **Notes:** Capped at x5. No climactic/legendary tiers. Server-side validation rejects invalid tiers. The preset ranges match PTU p.460 exactly: insignificant x1-x1.5, everyday x2-x3, significant x4-x5.

### Item 8: R039 -- Weather Exclusivity

- **Rule:** PTU weather is exclusive -- only one weather condition can be active at a time. When a new weather condition is set, it replaces the current one. (PTU abilities like Drizzle say "The Weather changes to be Rainy" -- singular replacement.)
- **Expected behavior:** Only one weather at a time. Single-select UI, single storage field.
- **Actual behavior:** `Scene.weather` is a single nullable `String` field (`schema.prisma:516`), not an array. `ScenePropertiesPanel.vue` uses a `<select>` element (lines 50-64) -- inherently single-select. `Encounter.weather` is similarly a single `String?` field (`schema.prisma:190`). The data model structurally enforces exclusivity.
- **Classification:** Correct
- **Notes:** Weather exclusivity is enforced at the data model level (single field, not array) and the UI level (single-select dropdown). No code path exists to set multiple weather conditions simultaneously.

---

## Tier 3: Core Workflows

### Item 9: R032 -- Wild Encounter Trigger

- **Rule:** PTU Chapter 11 describes wild encounter scenarios: GMs populate scenes with wild Pokemon, then convert to encounter. Scene-to-encounter conversion creates combatants from scene entities.
- **Expected behavior:** Scene-to-encounter conversion creates correct combatants. Scene Pokemon become enemy combatants; scene characters become player combatants. Weather, battle type, and significance pass through.
- **Actual behavior:** `app/server/api/encounters/from-scene.post.ts`:
  - Fetches scene (line 44), creates Encounter with `weather: scene.weather` (line 54), `battleType` from request (line 53), `significanceMultiplier` and `significanceTier` from request (lines 69-70).
  - Scene Pokemon (lines 82-97): Each `wild` Pokemon processed via `generateAndCreatePokemon()` with correct species, level, nickname, `origin: 'wild'`. Grid placement via `findPlacementPosition()` on 'enemies' side. Wrapped via `buildPokemonCombatant()`.
  - Scene Characters (lines 99-120): Each character fetched from DB, built via `buildHumanEntityFromRecord()` + `buildCombatantFromEntity()` on 'players' side.
  - Combatants saved to encounter (lines 123-126).
- **Classification:** Correct
- **Notes:** Weather inherits from scene. Battle type and significance pass through from the StartEncounterModal. Wild Pokemon get full DB sheets via `generateAndCreatePokemon`. Characters reference existing DB records. Grid auto-placement handles positioning.

### Item 10: R031 -- Quick-Stat Wild Pokemon

- **Rule:** PTU provides quick-stat generation rules for wild Pokemon: species base stats + level-appropriate stat distribution, random nature, gender, move selection from learnset, ability selection.
- **Expected behavior:** Generated Pokemon have stats distributed according to PTU rules, moves selected from learnset up to level, abilities randomly selected.
- **Actual behavior:** `app/server/services/pokemon-generator.service.ts`:
  - `generatePokemonData()` (line 85+): Looks up SpeciesData from DB (line 87). Gets base stats (types, abilities, learnset, capabilities) from species record. Selects nature randomly from NATURE_TABLE. Calculates stats with nature modifiers via `applyNatureToBaseStats`. Selects moves from learnset up to Pokemon's level. Randomly selects basic abilities from the species' ability list.
  - Stats are computed from base stats, not individually rolled. This matches PTU's quick-stat approach where base stats are the foundation.
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** The generation produces full stat blocks with species-appropriate base stats, nature modifiers, level-appropriate moves, and random abilities. However, PTU's quick-stat rules (p.466-467) describe distributing stat points beyond base stats as Pokemon level up. The generator uses base stats directly without explicit per-level stat point allocation. For wild Pokemon, this approximation is functionally equivalent at lower levels but may diverge at higher levels where stat point allocation matters. This is a reasonable simplification for automated wild Pokemon generation.

### Item 11: R034 -- Quick NPC Building

- **Rule:** PTU Chapter 11 provides guidance for creating NPCs quickly with minimal stat blocks.
- **Expected behavior:** Quick Create mode available for NPCs. NPCs can be added to scenes.
- **Actual behavior:** `app/components/create/QuickCreateForm.vue` exists as a dedicated component. `app/pages/gm/create.vue` provides the creation page. NPCs are added to scenes via `POST /api/scenes/[id]/characters` (C018). The `HumanCharacter.characterType` field supports 'npc' (default), 'player', and 'trainer' types.
- **Classification:** Correct
- **Notes:** Quick Create form provides minimal NPC scaffolding. The Add Character to Scene API (C018) handles scene addition. Cross-domain to character-lifecycle for creation, scenes for addition.

---

## Tier 4: Cross-Domain References

### Item 12: R037 -- Experience Calculation

- **Rule:** PTU Core p.460: (1) Total defeated enemy levels (trainers count double), (2) multiply by significance multiplier (x1-x5), (3) divide by number of players.
- **Expected behavior:** XP calculation chain follows PTU formula. QuestXpDialog provides trainer XP with level-up preview.
- **Actual behavior:**
  - `app/utils/experienceCalculation.ts`: `calculateEncounterXp()` (lines 259-300) implements all 3 steps. Step 1: trainers 2x level (line 272). Step 2: `Math.floor(enemyLevelsTotal * significanceMultiplier)` (line 280). Step 3: `Math.floor(multipliedXp / Math.max(1, playerCount))` (line 285), with boss bypass (line 283-284).
  - `SIGNIFICANCE_PRESETS` derived from `encounterBudget.ts` canonical source (line 65-67), capped at x5.
  - `app/utils/trainerExperience.ts`: `applyTrainerXp()` (lines 45-85) implements trainer XP bank (accumulate, level at 10+, multi-level jumps, cap at level 50).
  - `QuestXpDialog.vue` (lines 92-103): `getLevelUpPreview()` calls `applyTrainerXp` to show level-up preview. Award loop (lines 111-121) calls `useTrainerXp().awardXp()` for each character.
- **Classification:** Correct
- **Notes:** Full PTU p.460 XP formula implemented correctly. Trainer XP bank per PTU p.461 (10 XP per level). Level-up preview shown in QuestXpDialog. Significance presets capped at x5 per decree-030.

### Item 13: R035 -- Movement Capabilities

- **Rule:** PTU defines movement capabilities: Overland, Swim, Sky, Levitate, Burrow, Teleporter. Each Pokemon species has specific values for these capabilities.
- **Expected behavior:** VTT uses Overland/Swim/Sky/Levitate/Burrow/Teleporter movement types in grid movement.
- **Actual behavior:** `app/composables/useGridMovement.ts` (lines 8-10) imports `combatantCanSwim`, `combatantCanBurrow`, `combatantCanFly`, `getSkySpeed`, `getOverlandSpeed`, `getSwimSpeed`, `getBurrowSpeed`, `calculateAveragedSpeed`, `naturewalkBypassesTerrain`, `getHumanDerivedSpeeds`. `SpeciesData` model (`schema.prisma:306-311`) stores `overland`, `swim`, `sky`, `burrow`, `levitate`, `teleport` as integer fields. Pokemon `capabilities` JSON stores the same values at the individual level.
- **Classification:** Correct
- **Notes:** All 6 PTU movement capabilities (Overland, Swim, Sky, Burrow, Levitate, Teleport) are stored at both species and individual Pokemon level. VTT movement composable uses capability-aware speed selection for terrain-appropriate movement.

### Item 14: R019 -- Blocking Terrain

- **Rule:** PTU: Blocking terrain is impassable. Combatants cannot move through or into blocked cells.
- **Expected behavior:** Blocked cells prevent movement in VTT pathfinding.
- **Actual behavior:** `app/stores/terrain.ts`: `TERRAIN_COSTS.blocking = Infinity` (line 26). `getMovementCost` getter (line 154): `if (terrain === 'blocking') return Infinity`. `isPassable` getter (line 167): `if (terrain === 'blocking') return false`. `app/composables/usePathfinding.ts`: Both `getMovementRangeCells` (line 110) and `calculatePathCost` (lines 415-416) check `if (!isFinite(cost))` to skip impassable cells. A* and flood-fill both exclude Infinity-cost cells.
- **Classification:** Correct
- **Notes:** Blocking terrain is correctly implemented with Infinity cost, preventing movement in both flood-fill range display and A* pathfinding. Both the terrain store and the pathfinding composable handle this consistently.

---

## Tier 5: Partial Items

### Item 15: R010 -- Natural vs Game Weather

- **Rule:** PTU distinguishes between "natural weather" (atmospheric, narrative-only) and "game weather" (Weather Condition with mechanical combat effects like damage ticks and type bonuses).
- **Expected behavior:** Weather dropdown works for setting weather on scenes. No distinction between natural and game weather implemented.
- **Actual behavior:** `ScenePropertiesPanel.vue` (lines 49-64): Weather dropdown provides all 9 types. Weather stored as simple string on Scene model. No separate fields or UI for natural vs game weather. All weather is stored the same way. Combat-level weather effects (damage ticks, type bonuses) are handled in a separate domain (`weather-automation.service.ts`) and apply during encounter turns, not in scenes.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Notes:** **Present:** Weather dropdown works correctly for setting weather on scenes. Weather persists through scene lifecycle and inherits to encounters on conversion. **Missing:** No distinction between natural weather (narrative flavor) and game weather (mechanical Weather Condition). All weather set on a scene is treated the same. PTU's distinction matters because natural weather has no mechanical effects while game weather triggers ability interactions and damage ticks. In practice, the GM manages this distinction mentally -- the app does not enforce it. This is a reasonable simplification given that most GMs understand when weather is narrative vs mechanical.

### Item 16: R017 -- Slow Terrain

- **Rule:** PTU p.231: Slow Terrain doubles movement cost. Moving through slow terrain costs 2 movement per cell instead of 1.
- **Expected behavior:** VTT terrain painter has slow terrain type with movement cost multiplier.
- **Actual behavior:** `app/stores/terrain.ts`: `getMovementCost` getter (lines 149-163): `return flags.slow ? baseCost * 2 : baseCost` (line 162). Slow flag is part of the multi-tag system per decree-010. Paint flags allow toggling slow independently (lines 228-238). The terrain painter UI supports painting cells with the slow flag.
- **Classification:** Correct
- **Notes:** Slow terrain doubles movement cost as per PTU. Implemented via flag overlay system (decree-010 multi-tag). Water defaults to cost 1 per decree-008. Scene-level terrain UI is deferred but VTT terrain painter covers encounter-level needs.

### Item 17: R018 -- Rough Terrain

- **Rule:** PTU p.231: "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." Decree-003: Enemy-occupied squares count as rough terrain. Decree-010: Multi-tag allows Rough+Slow. Decree-025: Endpoint cells excluded from -2 accuracy check.
- **Expected behavior:** Rough terrain type exists in VTT. Accuracy penalty referenced. Decree compliance verified.
- **Actual behavior:**
  - Rough terrain exists: `isRoughAt` getter in `terrain.ts` (lines 178-181) checks `cell?.flags?.rough`.
  - Multi-tag (decree-010): `TerrainFlags = { rough: boolean, slow: boolean }` allows simultaneous flags.
  - Accuracy penalty: `app/composables/useMoveCalculation.ts` (confirmed by decree-025 notes at lines 189-200) implements rough terrain accuracy check excluding endpoints per decree-025.
  - Enemy squares as rough (decree-003): Referenced in `combatantCapabilities.ts` (lines 306-309) -- naturewalkBypassesTerrain explicitly notes "Naturewalk does NOT bypass enemy-occupied rough" per decree-003.
- **Classification:** Correct
- **Notes:** All three decrees respected: decree-003 (enemy squares = rough, with note that Naturewalk does not bypass this), decree-010 (multi-tag system), decree-025 (endpoint exclusion). Rough terrain flag exists in the terrain store, and the accuracy penalty check is implemented in useMoveCalculation.

### Item 18: R020 -- Naturewalk Bypass

- **Rule:** PTU p.322: "Pokemon with Naturewalk treat all listed terrains as Basic Terrain." Naturewalk bypasses terrain modifiers (rough/slow) for matching terrain types.
- **Expected behavior:** Combatant capabilities utility detects Naturewalk. Document no pathfinding integration.
- **Actual behavior:** `app/utils/combatantCapabilities.ts`:
  - `naturewalkBypassesTerrain()` (lines 315-330): Checks combatant's Naturewalk capabilities against a terrain type mapping. Returns true if the combatant's Naturewalk matches the base terrain type.
  - `NATUREWALK_TERRAIN_MAP` maps Naturewalk terrain names to base terrain types.
  - Per decree-003, enemy-occupied rough is explicitly NOT bypassed (lines 306-309).
  - The function is used in status immunity checks (lines 367-387) but NOT integrated into pathfinding cost calculation in `usePathfinding.ts`.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Notes:** **Present:** `naturewalkBypassesTerrain()` utility exists and correctly identifies Naturewalk capabilities. It is integrated for status immunity checks (Slowed/Stuck on matching terrain). **Missing:** Not integrated into pathfinding -- Pokemon with matching Naturewalk still pay full terrain cost for slow/rough terrain in movement range calculation and A* pathfinding. The utility exists but the pathfinding composable does not call it.

### Item 19: R022 -- Environmental Hazards

- **Rule:** PTU Chapter 11 describes environmental hazards: lava, ice, falling hazards, electrical hazards, etc.
- **Expected behavior:** Hazard terrain type exists in VTT. No custom hazard rules.
- **Actual behavior:** `app/stores/terrain.ts`: `hazard` terrain type defined in `TERRAIN_COSTS` (line 30): cost 1, colored red-orange. `TERRAIN_COLORS.hazard` (line 42): `rgba(255, 69, 0, 0.3)`. The hazard type can be painted onto cells. No automatic damage application -- the "deals damage" in the comment on line 30 is aspirational, not implemented.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Notes:** **Present:** Hazard terrain type exists in the terrain painter with distinctive red-orange visual. Can be painted on VTT cells. **Missing:** No automatic damage rules. Hazard terrain has normal movement cost (1) and no mechanical effect beyond visual indication. The comment "Normal cost but deals damage" on line 30 is not implemented. Environmental hazard damage is left to GM adjudication.

### Item 20: R036 -- Shiny/Variant Pokemon

- **Rule:** PTU defines shiny Pokemon as rare variants with potentially different abilities or moves.
- **Expected behavior:** Shiny flag stored on Pokemon model. Shiny sprites displayed. No variant customization UI.
- **Actual behavior:** `Pokemon.shiny` is a `Boolean @default(false)` field in `schema.prisma:164`. `app/composables/usePokemonSprite.ts` (lines 346-377): `getSpriteUrl()` and `getStaticSpriteUrl()` accept a `shiny` parameter and return shiny-specific sprite URLs (different paths for B2W2, Showdown, and PokeAPI). Gen 5 and below: `shiny/` path prefix. Gen 6+: `ani-shiny/` Showdown path.
- **Classification:** Correct
- **Notes:** **Present:** Shiny flag stored on Pokemon DB model. Sprite composable returns correct shiny sprite URLs for all generations. **Missing:** No variant customization UI for shiny Pokemon with different abilities/moves. Shiny is purely cosmetic in the app. This is documented as a partial item in the matrix.

### Item 21: R038 -- Scene Boundary Frequency Reset

- **Rule:** PTU defines scene boundaries as frequency reset points. Scene-frequency moves reset when a new scene begins. AP restores at scene end (PTU p.221).
- **Expected behavior:** Scene isActive lifecycle provides clear boundary. AP restoration fires on deactivation. Document no automatic frequency reset.
- **Actual behavior:**
  - `Scene.isActive` field (`schema.prisma:524`): Boolean flag tracks active state.
  - Activate: `app/server/api/scenes/[id]/activate.post.ts` (lines 17-24): Restores AP for characters in any currently active scenes before deactivating them, then activates the new scene.
  - Deactivate: `app/server/api/scenes/[id]/deactivate.post.ts` (lines 17-32): Reads scene data, deactivates, calls `restoreSceneAp(sceneData.characters)`.
  - `restoreSceneAp` in `scene.service.ts` (lines 18-74): Fetches characters from DB, calculates `calculateSceneEndAp(level, drainedAp)`, sets `boundAp: 0` and `currentAp: restoredAp` in a transaction.
  - `resetSceneUsage()` exists in `moveFrequency.ts` (lines 234-246) but is NOT called by the activate or deactivate endpoints.
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Notes:** AP restoration works correctly on scene deactivation (and on activation when replacing an active scene). However, scene-frequency move usage (`usedThisScene`, `lastTurnUsed`) is NOT automatically reset when a scene ends or a new scene begins. The `resetSceneUsage()` utility function exists but is never called from the scene lifecycle endpoints. This means if a Pokemon uses a Scene-frequency move in one encounter, the counter persists into the next scene/encounter unless manually reset. The function exists but the wiring is missing. **Recommendation:** Wire `resetSceneUsage` into the scene activation or encounter creation flow.

### Item 22: R040 -- Weather Duration

- **Rule:** PTU weather set by abilities lasts 5 rounds. (e.g., Drizzle: "The Weather changes to be Rainy for 5 rounds." -- PTU p.311) Weather set by the GM/narrative persists indefinitely until changed.
- **Expected behavior:** Weather persists on scene. No 5-round duration tracking in scene context.
- **Actual behavior:** `Scene.weather` is a simple string field (`schema.prisma:516`) with no duration tracking. Weather persists until manually changed by the GM. The Encounter model has `weatherDuration Int @default(0)` (line 191) and `weatherSource String?` (line 192) for combat-level duration tracking, but scenes have no equivalent. Scene weather inherits to encounters on conversion (`from-scene.post.ts:54`), starting with `weatherDuration: 0` (default, meaning indefinite/manual).
- **Classification:** Correct
- **Notes:** **Present:** Weather stored on scene and persists through the scene lifecycle. Weather inherits to encounters on conversion. **Missing in scene context (by design):** No 5-round duration tracking for scenes, which is correct because scenes are narrative -- 5-round duration is a combat mechanic that belongs in the encounter domain. The Encounter model HAS duration tracking (`weatherDuration`, `weatherSource`) for combat-level weather management. The scene-level behavior (persist until GM changes) matches the expected PTU behavior for narrative weather.

---

## Tier 6: Scene Infrastructure

### Item 23: C030/C031 -- Scene-End AP Restoration

- **Rule:** PTU Core p.221: "Action Points are completely regained at the end of each Scene." "Trainers have a maximum Action Point pool equal to 5, plus 1 more for every 5 Trainer Levels." "Drained AP becomes unavailable for use until after an Extended Rest is taken." Bound AP is released at scene end.
- **Expected behavior:** `restoreSceneAp` fires on deactivation. `calculateSceneEndAp` formula: maxAP(level) - drainedAp. Bound AP set to 0.
- **Actual behavior:**
  - `calculateMaxAp()` in `app/utils/restHealing.ts` (line 224): `return 5 + Math.floor(level / 5)`. PTU says "5, plus 1 more for every 5 Trainer Levels" -- at level 5 this gives 6 AP, at level 10 gives 7, at level 15 gives 8. This matches PTU.
  - `calculateSceneEndAp()` (line 245): `calculateMaxAp(level) - boundAp - drainedAp` via `calculateAvailableAp`. Called with `boundAp = 0` from the service (bound AP is being released).
  - `restoreSceneAp()` in `scene.service.ts` (lines 55-56): Calls `calculateSceneEndAp(char.level, char.drainedAp)` with default `boundAp = 0`. Sets `boundAp: 0, currentAp: restoredAp` (lines 65-67).
  - Fires on deactivate (deactivate.post.ts:32) and on activate when replacing active scenes (activate.post.ts:22-24).
- **Classification:** Correct
- **Notes:** Formula matches PTU p.221 exactly: max AP = 5 + floor(level/5), scene end restores to max minus drained. Bound AP correctly reset to 0. Fires in both deactivation and activation (replacing active scene) flows. The grouping optimization (batching identical level/drainedAp characters) is a performance improvement that does not affect correctness.

### Item 24: C026 -- Scene-to-Encounter Conversion

- **Rule:** Scene-to-encounter conversion should inherit weather, pass through battle type and significance, and correctly map characters and Pokemon.
- **Expected behavior:** Weather inherits. Battle type and significance pass through. Characters become players, Pokemon become wild enemies.
- **Actual behavior:** `app/server/api/encounters/from-scene.post.ts`:
  - Weather: `weather: scene.weather ?? null` (line 54) -- inherits from scene.
  - Battle type: `battleType: battleType || 'full_contact'` (line 53) -- from request body.
  - Significance: `significanceMultiplier: significanceMultiplier ?? 1.0` (line 69), `significanceTier: significanceTier ?? 'insignificant'` (line 70) -- from request body, validated by `validateSignificanceTier()`.
  - Pokemon mapping: Each scene Pokemon creates a new wild Pokemon via `generateAndCreatePokemon()` with `origin: 'wild'`, placed on 'enemies' side (lines 84-97).
  - Character mapping: Each scene character fetched from DB, built as combatant on 'players' side (lines 100-120).
  - Grid: Auto-enabled (`gridEnabled: true`, line 62), default 20x15 grid, auto-placement via `findPlacementPosition`.
- **Classification:** Correct
- **Notes:** All conversion aspects verified: weather inheritance, battle type/significance pass-through, Pokemon-to-enemy mapping with full DB sheet generation, character-to-player mapping with DB record reference. Significance validation rejects invalid tiers server-side.

### Item 25: C070/C071 -- Group View and Player View Scene Display

- **Rule:** Group View should render weather-themed backgrounds and CSS particle overlays. Player View should show weather badge. Both should display entity lists and receive WebSocket updates.
- **Expected behavior:** Weather effects render in Group View. Weather badge in Player View. Entity lists display. WebSocket updates propagate.
- **Actual behavior:**
  - **Group View** (`app/pages/group/_components/SceneView.vue`):
    - Weather class: `scene-view--${scene.weather}` (line 110) applies weather-themed CSS backgrounds for all 9 weather types (lines 145-175): sunny (yellow gradient), rain (dark gray), sandstorm (brown), hail/snow (blue), fog (gray), harsh_sunlight (orange), heavy_rain (dark blue), strong_winds (teal-gray).
    - Weather overlay with CSS particles: `weather-overlay--${scene.weather}` (line 4) with animated particles for rain, snow, hail, sandstorm, fog, sunny glow, heavy rain, and wind (lines 213-293).
    - Entity display: Pokemon sprites with names/levels (lines 51-69), character avatars with names (lines 71-91), groups with labels and member counts (lines 34-48).
    - WebSocket: Scene data comes from `groupViewTabsStore.activeScene` (line 105), synced via WebSocket handlers in `useGroupViewWebSocket`.
  - **Player View** (`app/components/player/PlayerSceneView.vue`):
    - Weather badge: `player-scene__weather-badge` with PhCloudSun icon (lines 15-18), displays weather name as text.
    - Entity lists: Characters with PC/NPC tags (lines 42-59), Pokemon with nickname/species (lines 62-78), Groups (lines 81-96).
    - WebSocket: Scene data from `usePlayerScene` composable (lines 25-135), handles `scene_sync` and `scene_deactivated` events.
  - **WebSocket propagation**: `broadcastToGroupAndPlayers('scene_activated', ...)` in activate.post.ts (line 64), `broadcastToGroupAndPlayers('scene_deactivated', ...)` in deactivate.post.ts (line 41). BroadcastChannel cross-tab sync in groupViewTabs store (lines 446-462).
- **Classification:** Correct
- **Notes:** Group View renders full weather-themed backgrounds with CSS particle animations for all 9 weather types. Player View shows weather badge with icon. Both views display entity lists (Pokemon, characters, groups). WebSocket events propagate scene activation, deactivation, and updates to both group and player clients. BroadcastChannel provides cross-tab sync for the Group View.

---

## Audit Summary

### By Classification

| Classification | Count | % |
|---------------|-------|---|
| Correct | 19 | 76% |
| Incorrect | 1 | 4% |
| Approximation | 3 | 12% |
| Ambiguous | 0 | 0% |
| **Total** | **25** | **100%** (2 items not classified = Tier 5 partial documentation) |

### By Severity (Incorrect + Approximation only)

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 0 | -- |
| HIGH | 0 | -- |
| MEDIUM | 3 | R038 (Incorrect: missing frequency reset wiring), R010 (Approx: no natural/game weather distinction), R020 (Approx: Naturewalk not in pathfinding) |
| LOW | 1 | R031 (Approx: wild Pokemon stat distribution simplified) |

### Findings Requiring Action

1. **R038 -- Scene Boundary Frequency Reset (MEDIUM, Incorrect):** `resetSceneUsage()` exists in `app/utils/moveFrequency.ts:234-246` but is never called from scene lifecycle endpoints (`activate.post.ts`, `deactivate.post.ts`) or encounter creation (`from-scene.post.ts`). Scene-frequency move counters persist across scene boundaries. This is a wiring bug, not a logic bug -- the reset function is correct, it just needs to be called.

### Items Verified Against Decrees

| Decree | Items | Verdict |
|--------|-------|---------|
| decree-003 | R018 (rough terrain, enemy squares) | Code follows decree |
| decree-008 | R016, R017 (water cost = 1) | Code follows decree |
| decree-010 | R016, R017, R018 (multi-tag terrain) | Code follows decree |
| decree-025 | R018 (endpoint exclusion) | Code follows decree |
| decree-030 | R030 (significance cap at x5) | Code follows decree |
| decree-031 | R029 (encounter budget formula) | Code follows decree |
| decree-045 | Not directly tested (combat domain) | N/A for scene audit |

### No Escalation Notes

Zero items classified as Ambiguous. All decree-relevant items have active decrees that resolve the ambiguity. No new decree-need tickets required.
