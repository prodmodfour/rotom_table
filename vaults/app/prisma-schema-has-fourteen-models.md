The Prisma schema at `app/prisma/schema.prisma` defines fourteen models:

**Entities**: `HumanCharacter` (players, NPCs, trainers with stats/inventory/equipment/AP/XP), `Pokemon` (full stat block, moves, abilities, capabilities as JSON; optional owner FK to HumanCharacter)

**Combat**: `Encounter` (active/completed combat; combatants stored as single JSON blob with all turn state, grid config, fog, terrain, weather, declarations)

**Reference data**: `MoveData`, `AbilityData`, `SpeciesData` (base stats, types, abilities, learnset, evolution triggers, capabilities, skills)

**Encounter tables**: `EncounterTable`, `EncounterTableEntry`, `TableModification`, `ModificationEntry` (see [[encounter-table-data-model-has-four-prisma-entities]])

**Templates**: `EncounterTemplate` (see [[encounter-template-prisma-model]])

**Scenes**: `Scene` (narrative scene with characters, Pokemon, groups, weather stored as JSON)

**Singletons**: `GroupViewState` (active tab and scene ID, single row with id `'singleton'`), `AppSettings` (damage mode, grid defaults, tunnel URL)

`HumanCharacter` → `Pokemon` is the only significant relational FK. Most complex data uses the [[prisma-uses-sqlite-with-json-columns-pattern]].

## See also

- [[encounter-service-is-the-combat-engine-core]] — loads and manages the Encounter model
- [[group-view-state-persisted-as-singleton-row]] — the GroupViewState singleton model
- [[seed-files-populate-reference-and-campaign-data]] — how reference data models are populated
- [[entity-builder-maps-prisma-records-to-typed-entities]] — transforms raw records into typed objects
