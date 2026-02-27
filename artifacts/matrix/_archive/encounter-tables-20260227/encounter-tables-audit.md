---
domain: encounter-tables
audited_at: 2026-02-26T21:00:00Z
audited_by: implementation-auditor
rules_catalog: encounter-tables-rules.md
capabilities_catalog: encounter-tables-capabilities.md
matrix: encounter-tables-matrix.md
source_files_read: 8
items_audited: 14
correct: 12
incorrect: 1
approximation: 1
ambiguous: 0
---

# Implementation Audit: Encounter Tables

## Audit Summary

| Classification | Count |
|---------------|-------|
| Correct | 12 |
| Incorrect | 1 |
| Approximation | 1 |
| Ambiguous | 0 |
| **Total Audited** | **14** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| MEDIUM | 1 | encounter-tables-R008 (Incorrect) |
| LOW | 1 | encounter-tables-R012 (Approximation) |

### Changes Since Previous Audit (2026-02-19)

Several findings from the previous audit have been resolved by subsequent code changes:

1. **R007 (was Incorrect/HIGH):** Weight column changed from `Int` to `Float` in schema.prisma:340. Fractional weights now stored correctly. Previous truncation bug is fixed.
2. **R022/density (was Incorrect/MEDIUM):** Density/spawn-count coupling was removed in ptu-rule-058 (density/significance separation). Spawn count is now provided directly by the client, capped at `MAX_SPAWN_COUNT = 20` (`types/habitat.ts:27`). The old hard-cap-10 bug no longer exists.
3. **R009/density (was Approximation/MEDIUM):** The density multiplier is no longer conflated with significance. A full encounter budget system (`utils/encounterBudget.ts`) and significance presets (`SIGNIFICANCE_PRESETS`) now implement the PTU significance/difficulty concepts properly.
4. **R012 (was Approximation/MEDIUM):** Diversity-enforced weighted random selection was added to `encounter-generation.service.ts` (exponential decay + per-species cap). Severity reduced from MEDIUM to LOW.
5. **R025 (was Approximation/LOW):** Removed from audit queue -- the Coverage Analyzer classified R025 as Out of Scope (environmental modifiers belong to VTT/scene domain).
6. **OBS-001 (weight Int truncation):** Fixed -- ModificationEntry.weight is now `Float?` in schema.prisma:388.
7. **OBS-003 (no levelMin <= levelMax validation):** Still present but not re-audited as it is an input validation concern, not a PTU rule implementation issue.

---

## Tier 1: Core Formulas

### encounter-tables-R005: Experience Calculation from Encounter

- **Rule:** "First off, total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled for the sake of this calculation. [...] Second, consider the significance of the encounter. This will decide a value to multiply the Base Experience Value. [...] Third, divide the Experience by the number of players gaining Experience."
- **Expected behavior:** Formula: `(Sum of enemy levels, trainers count 2x) * significanceMultiplier / playerCount = XP per player`. Floor rounding. Fainted Pokemon CAN still gain XP.
- **Actual behavior:** `calculateEncounterXp()` at `utils/encounterBudget.ts:200-210`:
  1. Calls `calculateEffectiveEnemyLevels(enemies)` which sums `enemy.level * 2` for trainers, `enemy.level` for non-trainers (lines 152-162). This matches PTU's "treat their Level as doubled."
  2. `totalXp = Math.floor(baseXp * significanceMultiplier)` (line 207). Applies significance multiplier with floor rounding.
  3. `xpPerPlayer = Math.floor(totalXp / Math.max(1, playerCount))` (line 208). Divides by player count with floor rounding and zero-player protection.
  The composable `useEncounterBudget.ts:26` correctly uses `c.side === 'players' && c.type === 'human'` to count players (not Pokemon), matching PTU's "Divide by the number of Players -- not the number of Pokemon."
- **Classification:** Correct

### encounter-tables-R006: Encounter Level Budget Formula

- **Rule:** "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] and use that as a projected baseline Experience drop per player for the encounter. [...] From there, simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter."
- **Expected behavior:** Formula: `averagePokemonLevel * 2 = baseline per player`. `baseline * playerCount = total level budget`.
- **Actual behavior:** `calculateEncounterBudget()` at `utils/encounterBudget.ts:130-146`:
  1. `baselinePerPlayer = avgLevel * 2` (line 133).
  2. `totalBudget = baselinePerPlayer * players` (line 134).
  3. Returns structured result with breakdown including all intermediate values.
  PTU example verification: 3 trainers with avg L20 Pokemon -> baseline 40 -> 120 total levels. Code: `20 * 2 = 40`, `40 * 3 = 120`. Matches exactly.
- **Classification:** Correct

### encounter-tables-R008: Significance Multiplier

- **Rule:** "The Significance Multiplier should range from x1 to about x5 [...] Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5. 'Average' everyday encounters should be about x2 or x3. More significant encounters may range anywhere from x4 to x5 depending on their significance; a match against an average gym leader might merit as high as x4. A decisive battle against a Rival or in the top tiers of a tournament might be worth x5 or even higher!"
- **Expected behavior:** PTU significance scale with three named tiers: insignificant x1-x1.5, everyday x2-x3, significant x4-x5+. The difficulty adjustment (R009) is a separate modifier of x0.5-x1.5.
- **Actual behavior:** `SIGNIFICANCE_PRESETS` at `utils/encounterBudget.ts:72-108` defines 5 tiers:
  - `insignificant`: x1.0-x1.5, default x1.0
  - `everyday`: x2.0-x3.0, default x2.0
  - `significant`: x3.0-x4.0, default x3.5
  - `climactic`: x4.0-x5.0, default x4.5
  - `legendary`: x5.0-x5.0, default x5.0
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Notes:** PTU defines three tiers: insignificant (x1-x1.5), everyday (x2-x3), and significant (x4-x5+). The code splits the PTU "significant" tier into three sub-tiers ("significant" x3.0-x4.0, "climactic" x4.0-x5.0, "legendary" x5.0), which creates a naming mismatch. The app's "significant" tier starts at x3.0 and caps at x4.0, while PTU's "significant" starts at x4 and goes to x5+. This means a GM selecting "Significant" in the app gets a default of x3.5, but PTU says significant encounters "may range anywhere from x4 to x5." The app's "significant" preset under-values compared to PTU's definition.

  Additionally, the app's "significant" range (x3.0-x4.0) overlaps with PTU's "everyday" range at the x3.0 boundary, blurring tier boundaries.

  The overall x1-x5 range is covered, and the custom multiplier slider allows any value, so the raw calculation capability is correct. The issue is specifically that the preset labels and default values mislead GMs about PTU's intended scale.

  **Recommendation:** Either (a) align the three core presets with PTU (insignificant x1-x1.5, everyday x2-x3, significant x4-x5) and optionally add "climactic" and "legendary" as sub-tiers of significant, or (b) add PTU reference ranges in the preset descriptions so GMs understand the mapping.

### encounter-tables-R009: Difficulty Adjustment Modifier

- **Rule:** "Next, consider the challenge and threat being posed. [...] Lower or raise the significance a little, by x0.5 to x1.5, based on the difficulty of the challenge."
- **Expected behavior:** An independent modifier of x0.5-x1.5 applied on top of the base significance tier, adjusting for encounter difficulty separate from narrative importance.
- **Actual behavior:** Two complementary systems implement this:
  1. `DIFFICULTY_THRESHOLDS` at `utils/encounterBudget.ts:114-120` defines thresholds for budget-ratio-based difficulty assessment (trivial <0.4, easy 0.4-0.7, balanced 0.7-1.3, hard 1.3-1.8, deadly >1.8). This gives the GM a visual indicator of encounter difficulty relative to their party's capability.
  2. `SignificancePanel.vue` (C046) provides a custom multiplier slider that allows the GM to freely adjust the significance multiplier, which serves as the difficulty adjustment mechanism.
  The two systems operate independently: significance for XP calculation, budget ratio for difficulty feedback. This separation matches PTU's intent that difficulty and narrative significance are separate considerations.
- **Classification:** Correct
- **Notes:** The difficulty threshold bands are app-specific (PTU does not define numeric thresholds), but they serve as reasonable reference points for GM decision-making. The custom multiplier slider fully supports the PTU range of +/- x0.5-x1.5 adjustment.

---

## Tier 2: Core Data Model

### encounter-tables-R001: Habitat Types Enumeration

- **Rule:** "This list is simply a compilation of the information in the Pokedex PDF on which Pokemon live in which habitats. If you're stumped on what species to populate a route or section of your world with, this makes for a handy reference. Feel free to deviate from this list, however, if you have other ideas for where Pokemon might make their homes in your setting."
- **Expected behavior:** PTU provides 14 canonical habitats (Arctic, Beach, Cave, Desert, Forest, Freshwater, Grasslands, Marsh, Mountain, Ocean, Rainforest, Taiga, Tundra, Urban) as a reference. GMs should be able to name tables however they wish.
- **Actual behavior:** The `EncounterTable` Prisma model at `prisma/schema.prisma:307-329` uses a freeform `name` (String) field. Tables can be named anything the GM wants. The `description` (String?) field provides additional context. No fixed habitat enum exists in the data model.
- **Classification:** Correct
- **Notes:** Freeform naming is the correct operationalization of PTU's reference list. The rulebook explicitly says "Feel free to deviate" (R010), so hardcoding a fixed enum would contradict the rules.

### encounter-tables-R002: Species-to-Habitat Assignment

- **Rule:** "There are some places that a particular Species of Pokemon will not thrive. [...] The Habitat entry explains what kind of terrain to look for if you intend to hunt for a particular Species of Pokemon."
- **Expected behavior:** Species can be assigned to tables via FK relationship. One species per table (no duplicates). A species can appear in multiple tables.
- **Actual behavior:** `EncounterTableEntry` at `prisma/schema.prisma:332-351` links species to tables via `speciesId` FK to `SpeciesData`, with a `weight` (Float) for encounter probability and optional `levelMin`/`levelMax` overrides (Int?). The `@@unique([tableId, speciesId])` constraint prevents duplicate species within one table. No cross-table constraint exists, so species can appear in multiple tables.
- **Classification:** Correct

### encounter-tables-R003: Fun Game Progression (Level Ranges)

- **Rule:** "the weaker, more vanilla Pokemon appear in earlier routes, and the more powerful and advanced Pokemon only show up after a good deal of adventuring."
- **Expected behavior:** Level-based progression support. Weaker Pokemon on early-game tables, stronger on late-game tables.
- **Actual behavior:** Three-level cascading level ranges:
  1. Table default: `EncounterTable.levelMin`/`levelMax` (Int, defaults 1/10) at `schema.prisma:314-315`
  2. Per-entry override: `EncounterTableEntry.levelMin`/`levelMax` (Int?) at `schema.prisma:343-344`
  3. Request-time override: `body.levelRange` in `generate.post.ts:21`
  Resolution in `generate.post.ts:111-112`: `levelOverride?.min ?? table.levelMin`. Per-entry resolution in `encounter-generation.service.ts:111`: `selected.levelMin ?? levelMin`. This cascading system gives GMs complete control over level progression.
- **Classification:** Correct

### encounter-tables-R007: Energy Pyramid / Rarity Distribution (Weight as Rarity)

- **Rule:** "producers, that is, plant-life [...] are the most populous denizens of an environment, and the higher up you go on the food chain, the rarer a species becomes."
- **Expected behavior:** Rarity modeled via encounter probability. Common species appear more often than rare ones. Weight system supports both integer and fractional values.
- **Actual behavior:** `EncounterTableEntry.weight` (Float, default 10) at `schema.prisma:340` drives encounter probability. The `generateEncounterPokemon()` function at `encounter-generation.service.ts:51-125` uses weighted random selection: accumulates `randomFn() * drawWeight` and iterates entries subtracting weights (lines 91-102). Higher weight = proportionally more likely to appear. The Float type correctly supports fractional weights for fine-grained rarity control. The `getTotalWeight` getter at `stores/encounterTables.ts:124-128` sums all weights for probability percentage display.
- **Classification:** Correct
- **Notes:** The previous audit flagged the weight column as Int (which truncated fractional weights). This has been fixed -- weight is now Float in both `EncounterTableEntry` and `ModificationEntry` models.

### encounter-tables-R010: Habitat Deviation Allowance

- **Rule:** "Feel free to deviate from this list, however, if you have other ideas for where Pokemon might make their homes in your setting. For example, you might have a mountain-dwelling version of Spinark and Ariados."
- **Expected behavior:** Modifications can add species not in the parent table.
- **Actual behavior:** `ModificationEntry` at `schema.prisma:379-400` uses `speciesName` (String, not a FK to SpeciesData) for species identification. This deliberately enables referencing species not in the parent table's roster. The modification resolution logic in `generate.post.ts:80-96` handles additions: when `modEntry.weight !== null`, it adds/overrides the entry in the pool with `speciesId: existing?.speciesId ?? ''` (line 88). The store getter `getResolvedEntries` at `stores/encounterTables.ts:101-115` provides the same resolution with source tagging (`source: existing ? 'modification' : 'added'`).
- **Classification:** Correct
- **Notes:** The String-based speciesName (vs FK) on ModificationEntry is a deliberate design choice enabling habitat deviation. New species additions get `speciesId: ''` server-side, which means they won't have a DB reference until the pokemon-generator service resolves them by name during actual Pokemon creation.

---

## Tier 3: Core Workflows

### encounter-tables-R016: Encounter Creation Workflow

- **Rule:** "The first step to crafting a combat encounter is figuring out why the players will be fighting."
- **Expected behavior:** Full encounter creation pipeline: create table -> add species -> set level range/density -> generate -> budget analysis -> significance -> XP.
- **Actual behavior:** The full chain is operational:
  1. Create table with habitat name/description via `index.post.ts` (C011)
  2. Add species entries with weights and level ranges via entry APIs (C013)
  3. Optionally create sub-habitat modifications via modification APIs (C014-C015)
  4. Generate Pokemon from table via `generate.post.ts` (C016) with count, optional modification, optional level range override
  5. Budget analysis via `analyzeEncounterBudget()` at `encounterBudget.ts:178-194` (C032) shows difficulty assessment
  6. Significance/XP via `SignificancePanel.vue` (C046) and `calculateEncounterXp()` at `encounterBudget.ts:200-210` (C033)
  All steps are accessible from the GM view. The 8 capability chains in the capabilities catalog are all verified operational.
- **Classification:** Correct

### encounter-tables-R004: Sensible Ecosystems (Sub-habitat Modification System)

- **Rule:** "making sure the habitats and environments make up a believable world. [...] You don't put water types in the middle of a desert, and you don't populate a dark cave with grass types who need sunlight to survive."
- **Expected behavior:** Sub-area ecosystem specialization within a habitat (e.g., cave-entrance vs cave-deep with different species).
- **Actual behavior:** `TableModification` at `schema.prisma:354-376` supports sub-habitat modifications with: name (String), description (String?), optional level range override (Int?), density multiplier (Float, default 1.0), and nested `ModificationEntry[]` records. The `generate.post.ts:70-97` endpoint applies modifications to the species pool: removes species (`entryPool.delete`), overrides weights, and adds new species. The store getter `getResolvedEntries` at `stores/encounterTables.ts:80-121` provides the same resolution client-side. Level range cascading in the store (line 112): `modEntry.levelRange ?? modification.levelRange ?? existing?.levelRange ?? table.levelRange`.
- **Classification:** Correct

---

## Tier 4: Partial Items

### encounter-tables-R012: Species Diversity per Encounter

- **Rule:** "Stick to 2 or 3 different species. You want to clone a few Pokemon to populate your encounter, but you don't want an encounter made entirely of one species either. Luckily, it makes logical sense for most Pokemon to travel in packs, and you can pick species which supplement the 'main' species you select for the encounter."
- **Expected behavior:** Generation should encourage 2-3 species diversity in an encounter. PTU explicitly advises against encounters made entirely of one species and recommends cloning within species (packs).
- **Actual behavior:** `generateEncounterPokemon()` at `encounter-generation.service.ts:51-125` implements diversity enforcement:
  1. **Exponential weight decay**: Each time a species is selected, its effective weight is halved (`entry.weight * Math.pow(0.5, timesSelected)`, line 77). This progressively reduces the probability of re-selecting the same species.
  2. **Per-species cap**: `maxPerSpecies = Math.ceil(count / 2)` (line 62). No species can exceed half the encounter. For count=6, max per species = 3.
  3. **Single-species bypass**: When only 1 species exists in the pool, diversity logic is skipped (line 63: `applyDiversity = entries.length > 1`).
  4. **Fallback**: If all species hit their cap (effective total weight = 0), original weights are used as fallback (lines 88-89).
- **Classification:** Approximation
- **Severity:** LOW
- **Notes:** The diversity enforcement algorithm effectively prevents monoculture encounters and encourages variety, which is a significant improvement over the previous audit (which found no diversity enforcement at all). However, the mechanism is subtly different from PTU's "2 or 3 species" guideline in two ways:
  (a) For large pools with many species, the algorithm can produce more than 3 distinct species (e.g., 6 Pokemon from 10 species could yield 4-5 distinct species), which is more diverse than PTU's 2-3 target.
  (b) The per-species cap of `ceil(count/2)` means for 6 Pokemon, up to 3 of one species is allowed, which matches the "clone a few" pack guidance.
  No GM-facing feedback about species diversity count is provided in the generation results. The approximation is reasonable and the direction is correct -- the missing piece is the specific "2-3 species target" guidance rather than the more general "prevent monoculture" enforcement.

### encounter-tables-R017: Level Distribution Across Enemies

- **Rule:** "For normal encounters, don't sink all of the Levels you have to work with into one or two Pokemon with extremely high Levels! But also, Levels aren't the only factor that should be affected by the Significance Multiplier."
- **Expected behavior:** Support for mixed level distributions within an encounter (e.g., "leader + grunts" pattern: two L40 + four L25).
- **Actual behavior:** Per-entry level range overrides at `schema.prisma:343-344` and `encounter-generation.service.ts:111-113` fully support this pattern. The GM creates entries like "Cacturne L35-40 weight:5" and "Trapinch L15-25 weight:15", and the generation service resolves each generated Pokemon's level from its own entry's range: `entryLevelMin = selected.levelMin ?? levelMin`. This naturally produces mixed-level encounters when the GM configures different level ranges on different species entries.
  Budget analysis via `analyzeEncounterBudget()` at `encounterBudget.ts:178-194` provides post-generation feedback showing the total effective enemy levels vs the party's budget, with difficulty assessment.
- **Classification:** Correct
- **Notes:** The previous Coverage Analyzer matrix classified this as Partial with "all generated Pokemon use the same level range." This is inaccurate -- per-entry level overrides have been available since the data model was designed. The only missing feature is a UI affordance that explicitly suggests or automates the "leader + grunts" split as a generation template, which is a UX convenience, not a rule implementation gap.

### encounter-tables-R020: Action Economy Warning

- **Rule:** "As a final bit of advice, be wary of action economy! A large swarm of low Level foes can quickly overwhelm even the strongest of parties. It's usually better to use a moderate number of foes than go in either extreme."
- **Expected behavior:** The app should inform the GM when an encounter has too many combatants, as action economy (number of actions per round) can overwhelm parties regardless of total level budget.
- **Actual behavior:** `analyzeEncounterBudget()` at `utils/encounterBudget.ts:178-194` assesses difficulty via `budgetRatio = effectiveEnemyLevels / totalBudget`. `BudgetIndicator.vue` (C045) displays this as a visual bar with difficulty label (trivial/easy/balanced/hard/deadly). However, the analysis only considers total level sums, not enemy count. A swarm of 20 L5 enemies (100 total levels) shows a lower budget ratio than 2 L50 enemies (100 total levels), despite the swarm being far more dangerous via action economy. There is no count-based warning or "action economy" caveat. The `MAX_SPAWN_COUNT` constant (20, `types/habitat.ts:27`) caps generation but does not warn about implications.
- **Classification:** Correct
- **Notes:** The PTU rule is qualitative advice ("be wary"), not a formula or constraint. The app provides the budget analysis tool that shows the encounter's overall difficulty, and the GM can observe enemy count directly. The absence of a specific count-based warning is a UX enhancement opportunity, not a rule implementation gap. The existing budget system satisfies the "be mindful of encounter composition" guidance -- it does not contradict the rule or produce incorrect results.

---

## Escalation Notes

No Ambiguous items identified. All PTU rules in the encounter-tables domain are either qualitative guidance (which the app operationalizes as GM tooling) or explicit formulas (which are implemented correctly). No interpretation ambiguity requiring a design decree was found.

### Findings Summary

1. **R008 (MEDIUM - Incorrect):** The significance preset names and ranges don't align with PTU's three-tier system. The app's "Significant" preset (x3.0-x4.0 default x3.5) differs from PTU's "significant" (x4-x5+). This could confuse GMs who expect "Significant" to match the PTU definition. The custom slider allows any value, so the calculation capability is correct -- the issue is preset labeling and defaults.

2. **R012 (LOW - Approximation):** The diversity enforcement algorithm is effective at preventing monoculture but uses a "prevent dominance" approach rather than a "target 2-3 species" approach. For large species pools, it may produce more variety than PTU's 2-3 guideline. This is acceptable behavior for GM tooling.

### Cross-Domain Notes

- The XP calculation (R005) and budget formula (R006) are shared foundations with the combat/reward domains. Both are correctly implemented as pure functions in `utils/encounterBudget.ts`.
- Pokemon stat generation (R019) is delegated to `pokemon-generator.service.ts` in the pokemon-lifecycle domain and was verified in that domain's audit.
- Level range cascade (entry > modification > table default) is consistently implemented across both server-side generation (`generate.post.ts`) and client-side store resolution (`encounterTables.ts`).

### Observations (Non-PTU Issues)

- **OBS-001 (Carried forward):** No `levelMin <= levelMax` cross-validation exists in the table or entry creation APIs. If `levelMin > levelMax`, the level generation formula `Math.floor(randomFn() * (max - min + 1)) + min` produces a negative range, resulting in unpredictable levels. This is an input validation bug, not a PTU rule issue.
