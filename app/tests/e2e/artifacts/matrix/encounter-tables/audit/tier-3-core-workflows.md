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
