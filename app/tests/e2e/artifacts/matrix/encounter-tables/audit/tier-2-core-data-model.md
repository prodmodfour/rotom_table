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
