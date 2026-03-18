The `SpeciesData` model (`app/prisma/schema.prisma`) stores the canonical reference data for each Pokemon species. Fields:

- **Identity:** `id` (UUID), `name` (unique string)
- **Types:** `type1`, `type2` (optional)
- **Base stats:** `baseHp`, `baseAttack`, `baseDefense`, `baseSpAtk`, `baseSpDef`, `baseSpeed`
- **Abilities:** `abilities` (JSON string array), `numBasicAbilities` (count used by [[species-abilities-categorized-by-positional-index]] and [[pokemon-generator-service]])
- **Evolution:** `evolutionStage`, `maxEvolutionStage`, `evolutionTriggers` (JSON array of [[species-evolution-trigger-structure]], used by [[evolution-check-utility]])
- **Movement:** `overland`, `swim`, `sky`, `burrow`, `levitate`, `teleport`
- **Other PTU stats:** `power`, `jumpHigh`, `jumpLong`, `weightClass`
- **Learnset:** JSON array of `{ level, move }` entries (see [[species-learnset-stored-as-json]])
- **Skills:** JSON object mapping skill names to dice formulas
- **Capabilities:** JSON array of string descriptors
- **Size:** Small, Medium, Large, Huge, or Gigantic (mapped to grid footprint by [[token-size-maps-to-grid-footprint]])

A foreign key from `EncounterTableEntry.speciesId` links species to [[habitat-pokemon-entries-table]] entries. The [[pokemon-stores-species-as-name-string]] by contrast — no FK exists between the `Pokemon` table and `SpeciesData`.

## See also

- [[encounter-table-data-model-has-four-prisma-entities]] — the full encounter table data model that references this species data
- [[modification-entry-references-species-by-name-not-id]] — modification entries use a name string instead of this FK
