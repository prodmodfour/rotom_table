---
domain: encounter-tables
type: audit
session: 121
audited_at: 2026-03-05T12:00:00Z
audited_by: implementation-auditor
matrix_source: artifacts/matrix/encounter-tables-matrix.md (session 120)
supersedes: artifacts/matrix/encounter-tables/audit/ (session 59)
relevant_decrees:
  - decree-030
  - decree-031
  - decree-048
total_items: 19
correct: 14
incorrect: 1
approximation: 2
ambiguous: 0
---

# Implementation Audit: encounter-tables (Session 121)

> Full re-audit against the session-120 matrix (artifacts/matrix/encounter-tables-matrix.md).
> Previous audit (session 59, artifacts/matrix/encounter-tables/audit/) is superseded.
> All 19 auditor queue items evaluated against source code and PTU 1.05 rulebook.

## Audit Summary

| Classification | Count | Items |
|---------------|-------|-------|
| Correct | 14 | R005, R006, R009, R008, R007, R016, R012, R003, R001, R010, R020, R002, R004, C027 |
| Incorrect | 1 | C017 |
| Approximation | 2 | R019, R018 |
| Ambiguous | 0 | -- |

### Severity Breakdown (Incorrect/Approximation only)

| Severity | Count | Items |
|----------|-------|-------|
| MEDIUM | 1 | C017 (export/import round-trip) |
| LOW | 2 | R019 (quick-stat approximation), R018 (significance-scaling movesets) |

### Decree Compliance

| Decree | Status | Notes |
|--------|--------|-------|
| decree-030 | COMPLIANT | SIGNIFICANCE_PRESETS caps at x5. Three tiers: insignificant (x1), everyday (x2), significant (x5). No preset exceeds x5. Custom manual input still available. |
| decree-031 | COMPLIANT | Bogus "p. 473" citation fully removed. Code now cites "PTU Encounter Creation Guide, Chapter 11" and "PTU Core p.460" appropriately. Formula itself is correct. |
| decree-048 | NOT IN SCOPE | Cross-domain (combat/VTT). R025 is Out of Scope for encounter-tables. |

---

## Tier 1: Core Formulas

### 1. R005 -- XP Calculation

- **Rule:** "First off, total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled [...] Second, consider the significance of the encounter. This will decide a value to multiply the Base Experience Value. [...] Third, divide the Experience by the number of players gaining Experience." (PTU Core p.460)
- **Expected behavior:** `(sum of enemy levels, trainers 2x) * significance_multiplier / player_count`, floored.
- **Actual behavior:**
  - `app/utils/encounterBudget.ts:199-209` (`calculateEncounterXp`): Calls `calculateEffectiveEnemyLevels` which doubles trainer levels (line 158), multiplies by significance (line 206: `Math.floor(baseXp * significanceMultiplier)`), divides by playerCount (line 207: `Math.floor(totalXp / Math.max(1, playerCount))`).
  - `app/utils/experienceCalculation.ts:259-300` (`calculateEncounterXp`): Full implementation with identical formula. Trainer levels doubled (line 272: `enemy.isTrainer ? enemy.level * 2 : enemy.level`). Significance applied (line 280: `Math.floor(enemyLevelsTotal * significanceMultiplier)`). Divided by players unless boss (lines 283-285). Floor applied at each step.
  - `app/components/encounter/SignificancePanel.vue:110-129`: Displays full XP breakdown showing enemy levels, significance multiplier, player division.
- **Classification:** Correct
- **Notes:** Two implementations exist (encounterBudget.ts for pre-combat budget analysis, experienceCalculation.ts for post-combat XP distribution). Both use identical formulas. The experienceCalculation.ts version adds boss encounter support (PTU Core p.489) where XP is not divided. Both floor intermediate results as expected.

### 2. R006 -- Level Budget Formula

- **Rule:** "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] and use that as a projected baseline Experience drop per player for the encounter. [...] From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter." (PTU Core Chapter 11, "Basic Encounter Creation Guidelines")
- **Expected behavior:** `avgPokemonLevel * 2 * playerCount = total level budget`. This is explicitly a guideline, not a hard formula.
- **Actual behavior:**
  - `app/utils/encounterBudget.ts:129-145` (`calculateEncounterBudget`): `baselinePerPlayer = avgLevel * 2` (line 132), `totalBudget = baselinePerPlayer * players` (line 133). Clamped at 0 minimum.
  - `app/utils/encounterBudget.ts:1-14`: Header comment correctly states "PTU Encounter Creation Guide, Chapter 11" and "This is a GM guideline, not a hard formula."
  - `app/components/habitat/BudgetGuide.vue:38`: UI displays `Lv.X x 2 x Y players = Z levels (PTU guideline)`.
- **Classification:** Correct
- **Decree-031 check:** No "p. 473" or "p.473" references found anywhere in `.ts` files. The code now correctly cites Chapter 11 and labels the formula as a guideline. COMPLIANT.

### 3. R009 -- Difficulty Thresholds

- **Rule:** "Lower or raise the significance a little, by x0.5 to x1.5, based on the difficulty of the challenge." (PTU Core p.460, Significance Multiplier section)
- **Expected behavior:** Difficulty adjustment independent of significance tier, range -1.5 to +1.5.
- **Actual behavior:**
  - `app/utils/encounterBudget.ts:111-117` (`DIFFICULTY_THRESHOLDS`): `trivial: 0.4, easy: 0.7, balanced: 1.3, hard: 1.8`. Ratio < 0.4 = trivial, 0.4-0.7 = easy, 0.7-1.3 = balanced, 1.3-1.8 = hard, > 1.8 = deadly.
  - `app/utils/encounterBudget.ts:166-172` (`assessDifficulty`): Uses these thresholds correctly to classify budget ratio.
  - `app/components/encounter/SignificancePanel.vue:49-71`: Difficulty adjustment slider with range -1.5 to +1.5, step 0.5. Added to base significance for final multiplier.
- **Classification:** Correct
- **Notes:** The DIFFICULTY_THRESHOLDS are app-specific heuristics (no PTU source for these exact breakpoints), which the code acknowledges in its comments. The difficulty adjustment slider directly implements the PTU-specified x0.5 to x1.5 range. The heuristic thresholds are a reasonable GM tool that does not contradict any PTU rule.

---

## Tier 2: Core Enumerations

### 4. R008 -- Significance Presets

- **Rule:** "The Significance Multiplier should range from x1 to about x5 [...] Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5. 'Average' everyday encounters should be about x2 or x3. More significant encounters may range anywhere from x4 to x5" (PTU Core p.460)
- **Expected behavior:** 3 named tiers within x1-x5 range. No preset exceeds x5. Custom manual entry available for house-ruling.
- **Actual behavior:**
  - `app/utils/encounterBudget.ts:83-105` (`SIGNIFICANCE_PRESETS`): 3 tiers -- insignificant (x1.0, range 1.0-1.5), everyday (x2.0, range 2.0-3.0), significant (x5.0, range 4.0-5.0). Comment on line 80-82 explicitly cites decree-030.
  - `app/components/encounter/SignificancePanel.vue:27-35`: Preset selector dropdown with all 3 tiers plus "Custom" option. Custom input (line 36-45) allows manual entry from 0.5 to 10, step 0.5.
  - `app/components/habitat/GenerateEncounterModal.vue:113-124`: Significance compact selector shows all 3 preset tiers with radio buttons.
- **Classification:** Correct (per decree-030)
- **Notes:** Previous climactic (x6) and legendary (x8) tiers have been removed. The "significant" tier caps at x5 defaultMultiplier with a range of 4.0-5.0, matching PTU "x4 to x5." Custom manual input allows GMs to exceed x5 for house-ruling, which decree-030 explicitly permits.

### 5. R007 -- Weighted Entries

- **Rule:** "producers [...] are the most populous denizens of an environment, and the higher up you go on the food chain, the rarer a species becomes" (PTU Core Chapter 11, Sensible Ecosystems)
- **Expected behavior:** Weight system modeling relative encounter probability. Higher weight = more common. Pool resolution with modification overlay correctly applying weight overrides and removals.
- **Actual behavior:**
  - `app/types/habitat.ts:37-42` (`EncounterTableEntry`): `weight: number` field per entry.
  - `app/types/habitat.ts:6-12` (`RARITY_WEIGHTS`): Preset weights -- common: 10, uncommon: 5, rare: 3, very-rare: 1, legendary: 0.1.
  - `app/stores/encounterTables.ts:80-121` (`getResolvedEntries`): Starts with parent entries, applies modification (delete for `remove`, override/add for weight changes). Correctly handles weight overrides from modifications.
  - `app/stores/encounterTables.ts:124-128` (`getTotalWeight`): Sums weights from resolved entries for probability display.
  - `app/components/encounter-table/EntryRow.vue:80-83`: Displays chance as `(weight / totalWeight * 100)%`.
  - `app/server/api/encounter-tables/[id]/generate.post.ts:56-97`: Server-side pool resolution mirrors store logic: parent entries -> modification overlay (delete/override).
- **Classification:** Correct
- **Notes:** The weight system provides the structural mechanism for modeling ecological rarity. The actual assignment of weights to match food chain position is left to GM judgment, which matches PTU's qualitative guidance.

---

## Tier 3: Core Workflows

### 6. R016 -- Encounter Creation Workflow

- **Rule:** PTU workflow: determine purpose -> calculate budget -> select species -> distribute levels -> customize based on significance (PTU Core Chapter 11, Setting Up the Encounter)
- **Expected behavior:** Complete chain: create table -> add entries -> set level ranges -> set density -> generate encounter -> assess budget -> set significance.
- **Actual behavior:**
  - **Create table:** `app/pages/gm/encounter-tables.vue:233-249` (create modal) -> `app/stores/encounterTables.ts:165-183` (`createTable`) -> `app/server/api/encounter-tables/index.post.ts` (POST). Freeform name, description, level range, density.
  - **Add entries:** `app/components/encounter-table/TableEditor.vue` -> `app/composables/useTableEditor.ts:141-158` (`addEntry`) -> `app/stores/encounterTables.ts:224-241` -> `app/server/api/encounter-tables/[id]/entries/index.post.ts`. Species selected by ID, weight configurable, per-entry level range optional.
  - **Edit settings:** `app/composables/useTableEditor.ts:244-262` (`saveSettings`) -- name, description, level range, density.
  - **Generate:** `app/components/habitat/GenerateEncounterModal.vue:381-412` (`generate`) -> `app/stores/encounterTables.ts:407-464` (`generateFromTable`) -> `app/server/api/encounter-tables/[id]/generate.post.ts` -> `app/server/services/encounter-generation.service.ts` (`generateEncounterPokemon`).
  - **Budget analysis:** `app/components/habitat/BudgetGuide.vue:85-92` uses `analyzeEncounterBudget` from `app/utils/encounterBudget.ts`.
  - **Significance:** `app/components/habitat/GenerateEncounterModal.vue:113-124` preset selector. Significance passed through to encounter creation.
  - **Create encounter:** `app/composables/useEncounterCreation.ts:15-40` (`createWildEncounter`) chains `createEncounter` -> `addWildPokemon` -> `serveEncounter`.
  - All steps are GM-accessible via `/gm/encounter-tables` and `/gm/encounter-tables/[id]` pages.
- **Classification:** Correct
- **Notes:** Complete end-to-end workflow. Every link in the chain is GM-accessible. The budget analysis is informational (not gating), matching PTU's guideline nature.

### 7. R012 -- Species Diversity

- **Rule:** "Stick to 2 or 3 different species. You want to clone a few Pokemon to populate your encounter, but you don't want an encounter made entirely of one species either." (PTU Core Chapter 11, Quick-Statting Pokemon)
- **Expected behavior:** Generation enforces species diversity: no mono-species output, encourages 2-3 species per encounter.
- **Actual behavior:**
  - `app/server/services/encounter-generation.service.ts:51-125` (`generateEncounterPokemon`):
    - Exponential weight decay: each selection of a species halves its effective weight (line 77: `entry.weight * Math.pow(0.5, timesSelected)`).
    - Per-species cap: `Math.ceil(count / 2)` (line 62) prevents any species from exceeding half the encounter.
    - Only species pools with >1 species apply diversity (line 63: `entries.length > 1`).
    - Fallback: if all species hit the cap, original weights used (lines 87-89).
  - For a typical 4-Pokemon encounter with 3 species: max per species = `ceil(4/2) = 2`. Each selection halves subsequent probability. This strongly favors 2-3 species outcomes.
- **Classification:** Correct
- **Notes:** The diversity enforcement is more sophisticated than "pick 2-3 species" -- it uses statistical weight decay plus hard caps. The result naturally produces 2-3 species encounters for typical pool sizes and counts, matching PTU guidance. Single-species pools correctly skip diversity logic.

### 8. R019 -- Quick-Stat Workflow

- **Rule:** "Pick 3-4 Stats to focus on per Pokemon [...] simply evenly divide Stat Points for the Pokemon among their highest 3 or 4 stats" (PTU Core Chapter 11, Quick-Statting Pokemon)
- **Expected behavior:** Generated wild Pokemon receive stat distributions that approximate the quick-stat method.
- **Actual behavior:**
  - `app/server/services/encounter-generation.service.ts`: Returns `GeneratedPokemon` with species ID, name, level, weight, source. Does NOT generate stat blocks -- it only selects species and levels.
  - `app/composables/useEncounterCreation.ts:29-31`: Creates encounter then calls `addWildPokemon` which delegates to server-side Pokemon generation.
  - The actual stat generation happens via `pokemon-generator.service.ts` (the canonical Pokemon creation entry point per CLAUDE.md). This service handles stat distribution for wild Pokemon.
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** The encounter-generation service does not directly implement quick-stat. It delegates to the pokemon-generator service which uses its own stat distribution algorithm. Whether that algorithm matches PTU's quick-stat method (focus on top 3-4 stats) would need to be verified in a pokemon-lifecycle domain audit. The encounter-tables domain correctly chains generation -> stat creation via the established service pipeline. The approximation is that the pipeline exists but the stat distribution method is opaque from this domain's perspective.

---

## Tier 4: Constraints and Supporting Capabilities

### 9. R003 -- Level Ranges

- **Rule:** "the weaker, more vanilla Pokemon appear in earlier routes, and the more powerful and advanced Pokemon only show up after a good deal of adventuring." (PTU Core Chapter 11, Fun Game Progression)
- **Expected behavior:** Table-level levelMin/levelMax, per-entry overrides, cascade order: entry > modification > table default.
- **Actual behavior:**
  - **Table-level:** `app/prisma/schema.prisma:351-352`: `levelMin Int @default(1)`, `levelMax Int @default(10)`.
  - **Per-entry override:** `app/prisma/schema.prisma:381-382`: `levelMin Int?`, `levelMax Int?` (nullable = use table default).
  - **Modification override:** `app/prisma/schema.prisma:402-403`: `levelMin Int?`, `levelMax Int?` on TableModification.
  - **Cascade in generation:** `app/server/api/encounter-tables/[id]/generate.post.ts:111-112`: `levelMin = levelOverride?.min ?? table.levelMin`, `levelMax = levelOverride?.max ?? table.levelMax`. Entry-level overrides in `encounter-generation.service.ts:111-113`: `entryLevelMin = selected.levelMin ?? levelMin`, `entryLevelMax = selected.levelMax ?? levelMax`.
  - **Cascade in store:** `app/stores/encounterTables.ts:92`: `levelRange: entry.levelRange ?? table.levelRange`. Modification overlay (line 112): `levelRange: modEntry.levelRange ?? modification.levelRange ?? existing?.levelRange ?? table.levelRange`.
  - **UI:** `app/components/encounter-table/EntryRow.vue:25-43`: Per-entry level inputs with table default as placeholder.
- **Classification:** Correct
- **Notes:** Three-tier cascade is correctly implemented: entry-specific > modification > table default. The generation service respects this cascade when calculating random levels within range.

### 10. R001 -- Habitat Tables

- **Rule:** "Feel free to deviate from this list, however, if you have other ideas for where Pokemon might make their homes in your setting." (PTU Core Chapter 11, Pokemon Habitat List)
- **Expected behavior:** Freeform table naming (not constrained to 14 canonical habitat types). Model supports name, description, level range, density, entries, modifications.
- **Actual behavior:**
  - `app/prisma/schema.prisma:345-367` (EncounterTable): `name String` (freeform), `description String?`, `levelMin Int`, `levelMax Int`, `density String`.
  - `app/server/api/encounter-tables/index.post.ts:7`: Only validates `body.name` is truthy. No enum constraint.
  - `app/pages/gm/encounter-tables.vue:80-87`: Name input with placeholder "e.g., Glowlace Forest" (freeform).
  - `app/components/encounter-table/TableEditor.vue`: Full editing UI for all table properties.
- **Classification:** Correct
- **Notes:** The 14 canonical PTU habitats (Arctic, Beach, Cave, etc.) are not enforced as a fixed enum. GMs can name tables anything they want. This is consistent with PTU's "feel free to deviate" guidance.

### 11. R010 -- Habitat Deviation

- **Rule:** "Feel free to deviate from this list, however, if you have other ideas for where Pokemon might make their homes in your setting." (PTU Core Chapter 11)
- **Expected behavior:** Modification entries accept arbitrary species names (not constrained to species in parent table).
- **Actual behavior:**
  - `app/prisma/schema.prisma:421`: `speciesName String` on ModificationEntry (not a FK to SpeciesData).
  - `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts:22-27`: Validates `body.speciesName` as a string. No FK lookup to SpeciesData. Any string is accepted.
  - `app/components/encounter-table/ModificationCard.vue:82-86`: Uses `PokemonSearchInput` for species name entry, but the API accepts any string.
  - `app/stores/encounterTables.ts:106-115`: Modification overlay adds species by name string, can add species not in parent (line 113: `source: existing ? 'modification' : 'added'`).
- **Classification:** Correct
- **Notes:** ModificationEntry uses `speciesName: String` (not a foreign key), explicitly allowing arbitrary species names. The Prisma schema comment even states: "Species name (not foreign key - allows adding species not in parent)". This directly supports habitat deviation.

### 12. R020 -- Action Economy Warning

- **Rule:** "be wary of action economy! A large swarm of low Level foes can quickly overwhelm even the strongest of parties." (PTU Core Chapter 11, Basic Encounter Creation Guidelines)
- **Expected behavior:** Visual warning when encounter has too many enemies relative to budget (high ratio = deadly).
- **Actual behavior:**
  - `app/utils/encounterBudget.ts:115-117`: DIFFICULTY_THRESHOLDS `hard: 1.8` -- ratio > 1.8 = deadly.
  - `app/utils/encounterBudget.ts:171`: `assessDifficulty` returns `'deadly'` for ratio > 1.8.
  - `app/components/habitat/BudgetGuide.vue:41-44`: Renders `BudgetIndicator` component with analysis data (which includes difficulty assessment).
  - Many low-level enemies create high total levels relative to budget, triggering the deadly classification. This serves as the action economy warning.
- **Classification:** Correct
- **Notes:** The "deadly" threshold at >1.8 budget ratio functions as the action economy warning. When a GM adds many enemies, the total enemy levels quickly exceed the budget, triggering the visual indicator. This operationalizes the PTU warning without requiring a separate action-economy calculation.

---

## Tier 5: Partial Items

### 13. R011 -- Pseudo-Legendary Placement

- **Rule:** "Save the pseudo-legendaries like Dratini and Beldum for the out of the way, difficult to reach places." (PTU Core Chapter 11, Fun Game Progression)
- **Expected behavior (present portion):** Weight system can be used to restrict rare species. Low weights + high level ranges model rare powerful Pokemon.
- **Expected behavior (missing portion):** No pseudo-legendary flag, no BST-based warnings, no automated guardrails.
- **Actual behavior:**
  - `app/types/habitat.ts:6-12`: RARITY_WEIGHTS includes `very-rare: 1` and `legendary: 0.1` presets suitable for pseudo-legendaries.
  - Per-entry level range overrides (Prisma schema line 381-382) allow placing pseudo-legendaries at higher level ranges.
  - No SpeciesData field flags a Pokemon as pseudo-legendary. No BST-based validation exists.
  - The GM must manually assign low weights and high level ranges to pseudo-legendary species.
- **Classification:** Correct (present portion)
- **Notes:** The weight system is fully functional for restricting rare species encounters. The RARITY_WEIGHTS presets (very-rare at weight 1, legendary at weight 0.1) provide appropriate probability reduction. Combined with per-entry level range overrides, a GM can effectively implement pseudo-legendary placement restrictions. The absence of automated BST-based warnings is documented as a Partial classification in the matrix (P3 priority), not an implementation error.

### 14. R017 -- Level Distribution

- **Rule:** "For normal encounters, don't sink all of the Levels you have to work with into one or two Pokemon with extremely high Levels!" (PTU Core Chapter 11, Basic Encounter Creation Guidelines)
- **Expected behavior (present portion):** Per-entry level range overrides allow GM to set different level bands per species. Budget analysis shows distribution impact.
- **Expected behavior (missing portion):** No automatic level budget distribution tool. No "distribute X levels across Y Pokemon" assistant.
- **Actual behavior:**
  - Per-entry level range overrides: `app/prisma/schema.prisma:381-382` (nullable levelMin/levelMax on EncounterTableEntry).
  - `app/components/encounter-table/EntryRow.vue:24-43`: Per-entry level range inputs in the UI.
  - `app/server/services/encounter-generation.service.ts:111-113`: Respects per-entry level overrides during generation.
  - `app/components/habitat/BudgetGuide.vue:85-92`: Post-generation budget analysis shows how generated Pokemon compare to budget.
  - No budget-aware generation exists -- generation is count-based (generate N Pokemon) not budget-based (generate Pokemon totaling X levels).
- **Classification:** Correct (present portion)
- **Notes:** Per-entry level range overrides are fully functional and integrated into both the UI and generation pipeline. The missing budget-distribution automation is documented as the Partial classification in the matrix (P2, SG-2). This is a tooling gap, not a rule violation.

### 15. R018 -- Significance-Scaling Movesets

- **Rule:** "for the more important encounter, he uses Level 40 Cacturne and gives them Thunder Punch and Poison Jab to help cover their Flying and Fairy weaknesses, respectively." (PTU Core Chapter 11, Basic Encounter Creation Guidelines)
- **Expected behavior (present portion):** Significance presets exist with descriptions hinting at moveset complexity.
- **Expected behavior (missing portion):** No automatic moveset complexity scaling based on significance tier.
- **Actual behavior:**
  - `app/utils/encounterBudget.ts:83-105`: SIGNIFICANCE_PRESETS have descriptive labels: insignificant ("Random wild encounters, trivial roadside battles"), everyday ("Standard trainer battles, strong wild Pokemon"), significant ("Gym leaders, rival encounters, legendary battles, arc finales").
  - `app/components/encounter/SignificancePanel.vue`: Full UI with preset selector and descriptions.
  - `app/components/habitat/GenerateEncounterModal.vue:107-125`: Significance selector for new encounters.
  - Generated Pokemon receive standard level-up movesets from `pokemon-generator.service.ts` regardless of significance tier. No Egg/TM/Tutor move injection for high-significance encounters.
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** The significance system exists and is exposed in the UI, but it only affects XP rewards, not the quality of generated Pokemon movesets. PTU suggests high-significance encounters should feature Egg/TM/Tutor moves and strategic ability selection. This is a tooling gap where the GM must manually customize movesets after generation. The approximation is that significance influences XP but not moveset complexity.

---

## Tier 6: Data and UI Components

### 16. R002 -- Species-to-Habitat Assignment

- **Rule:** "There are some places that a particular Species of Pokemon will not thrive. [...] The Habitat entry explains what kind of terrain to look for" (Pokedex, How to Read)
- **Expected behavior:** Species assigned to tables via weighted entries with species ID, weight, and optional level range override.
- **Actual behavior:**
  - `app/prisma/schema.prisma:370-389` (EncounterTableEntry): `speciesId String` (FK to SpeciesData), `weight Float`, `levelMin Int?`, `levelMax Int?`. Unique constraint `@@unique([tableId, speciesId])`.
  - `app/server/api/encounter-tables/[id]/entries/index.post.ts`: Validates species exists via Prisma lookup (line 35-43), prevents duplicate entries (line 65-79), creates with weight and level range.
  - `app/stores/encounterTables.ts:224-241` (`addEntry`): Store action for adding entries.
  - `app/components/encounter-table/EntryRow.vue`: Displays species name with sprite, editable weight, editable level range, remove button.
  - `app/components/encounter-table/TableEditor.vue`: Lists all entries in sortable table format.
- **Classification:** Correct

### 17. R004 -- Ecosystems (Modifications)

- **Rule:** "making sure the habitats and environments make up a believable world" (PTU Core Chapter 11, Sensible Ecosystems)
- **Expected behavior:** Sub-habitat modification system: create modifications that overlay parent table entries with species additions, removals, and weight overrides.
- **Actual behavior:**
  - `app/prisma/schema.prisma:392-414` (TableModification): `parentTableId String` (FK to EncounterTable), `name String`, `description String?`, `levelMin Int?`, `levelMax Int?`. Has child ModificationEntry records.
  - `app/prisma/schema.prisma:417-437` (ModificationEntry): `speciesName String`, `weight Float?`, `remove Boolean`, `levelMin Int?`, `levelMax Int?`.
  - `app/server/api/encounter-tables/[id]/modifications/index.post.ts`: Create modification with name, description, optional level range.
  - `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts`: Add modification entries (override weight or remove species).
  - `app/components/encounter-table/ModificationCard.vue`: Full UI showing modification details, color-coded changes (green add, red remove, yellow override), inline add-change modal.
  - `app/stores/encounterTables.ts:80-121` (`getResolvedEntries`): Correctly applies modification overlay.
- **Classification:** Correct

### 18. C017 -- Export/Import Round-Trip

- **Rule:** N/A (app capability, not PTU rule)
- **Expected behavior:** Export a table to JSON, import it back, produce an identical table (modulo IDs and timestamps).
- **Actual behavior:**
  - **Export:** `app/server/api/encounter-tables/[id]/export.get.ts`: Exports table with name, description, imageUrl, levelRange, entries (speciesName + weight + levelRange), modifications (name + description + levelRange + entries).
  - **Import:** `app/server/api/encounter-tables/import.post.ts`: Validates structure, looks up species by name (case-insensitive), creates table with entries and modifications. Deduplicates names by appending counter.
  - **Round-trip issue:** Export uses `entry.species.name` (lines 53-54) for entry speciesName. Import looks up species by `speciesMap.get(entry.speciesName.toLowerCase())` (line 162). Species with names not in the database are silently dropped (line 161-162: `.filter(...)`). The import returns a `warnings` field listing unmatched species (lines 210-258), but the data is lost.
  - **Export omits density:** The export format (lines 42-76) does NOT include `table.density`. Import uses `@default("moderate")` from Prisma. A table exported with density "abundant" will import as "moderate".
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Notes:** Two issues:
  1. **Density lost on round-trip:** Export does not serialize the `density` field. Import creates with Prisma default "moderate". A table with density "sparse", "dense", or "abundant" will lose this metadata on round-trip.
  2. **Species not in DB silently dropped:** If the importing instance doesn't have a species in its database (e.g., custom species), entries are silently dropped. The warnings field reports this but data is not recoverable.

  Issue #1 is a clear data loss bug. Issue #2 is a known limitation with appropriate warning.

### 19. C027 -- Filter/Search

- **Rule:** N/A (app capability, not PTU rule)
- **Expected behavior:** Table list supports filtering by name/description and sorting by name/created/updated.
- **Actual behavior:**
  - `app/stores/encounterTables.ts:38-68` (`filteredTables` getter): Filters by search string matching against `name` and `description` (case-insensitive). Sorts by `name`, `createdAt`, or `updatedAt` in ascending or descending order.
  - `app/pages/gm/encounter-tables.vue:18-45`: Filter UI with search input, sort-by dropdown (Name/Created/Updated), sort-order dropdown (Ascending/Descending), reset button.
  - `app/stores/encounterTables.ts:472-483`: `setFilters` and `resetFilters` actions.
- **Classification:** Correct

---

## Escalation Notes

No items classified as Ambiguous. All previously ambiguous items have been resolved by decrees (decree-030 for significance cap, decree-031 for budget citation).

## Cross-Domain References

- **R019 (Quick-Stat):** Stat distribution quality should be verified in a pokemon-lifecycle domain audit of `pokemon-generator.service.ts`.
- **R018 (Significance-Scaling Movesets):** Moveset customization based on significance could be added as a feature in the pokemon-lifecycle domain.
- **decree-048 (Dark Cave):** Confirmed out of scope for encounter-tables domain. Should be audited in combat or VTT-grid domain.

## Files Examined

| File | Purpose |
|------|---------|
| `app/utils/encounterBudget.ts` | Budget calculation, XP calculation, significance presets, difficulty thresholds |
| `app/utils/experienceCalculation.ts` | Post-combat XP calculation with full breakdown |
| `app/server/services/encounter-generation.service.ts` | Weighted random species selection with diversity enforcement |
| `app/stores/encounterTables.ts` | Pinia store: table CRUD, resolved entries, filters, generation |
| `app/composables/useEncounterBudget.ts` | Reactive wrapper for budget analysis |
| `app/composables/useTableEditor.ts` | Table editing form state and actions |
| `app/composables/useEncounterCreation.ts` | Encounter/scene creation workflow |
| `app/types/habitat.ts` | Type definitions, rarity weights, density suggestions |
| `app/prisma/schema.prisma` | EncounterTable, EncounterTableEntry, TableModification, ModificationEntry models |
| `app/server/api/encounter-tables/index.post.ts` | Create table API |
| `app/server/api/encounter-tables/[id]/entries/index.post.ts` | Add entry API |
| `app/server/api/encounter-tables/[id]/generate.post.ts` | Generate encounter API |
| `app/server/api/encounter-tables/[id]/modifications/index.post.ts` | Create modification API |
| `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts` | Add modification entry API |
| `app/server/api/encounter-tables/[id]/export.get.ts` | Export table API |
| `app/server/api/encounter-tables/import.post.ts` | Import table API |
| `app/pages/gm/encounter-tables.vue` | Table list page with create/import |
| `app/pages/gm/encounter-tables/[id].vue` | Table editor page |
| `app/components/encounter-table/TableEditor.vue` | Table editor component |
| `app/components/encounter-table/EntryRow.vue` | Species entry row with weight/level editing |
| `app/components/encounter-table/ModificationCard.vue` | Sub-habitat modification card |
| `app/components/encounter-table/TableCard.vue` | Table preview card for list |
| `app/components/habitat/BudgetGuide.vue` | Budget analysis display |
| `app/components/habitat/GenerateEncounterModal.vue` | Generation UI with significance selector |
| `app/components/encounter/SignificancePanel.vue` | Post-combat significance/XP panel |
| `books/markdown/core/11-running-the-game.md` | PTU source text for all rules |
