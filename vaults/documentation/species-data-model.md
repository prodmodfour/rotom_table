# Species Data Model

`SpeciesData` Prisma model stores reference data for each Pokemon species, seeded from the PTU pokedex via the [[seed-data-pipeline]].

## Fields

Base stats, types, abilities ([[json-as-text-columns|JSON]]), learnset (JSON with level+move entries), evolution stage/max, evolution triggers (JSON), movement capabilities, size, weight class, power, jump, skills, egg groups, and numeric basic ability count.

## Usage

- [[pokemon-generator-entry-point]] — looks up species for stat generation, move selection, ability picking
- [[pokemon-experience-chart]] — learnset used by level-up check for new move detection
- [[pokemon-api-endpoints|GET /api/species]] — species search endpoint for UI autocomplete, returns summary fields (name, types, base stats, abilities, evolution stage), default limit 100, max 500

## See also

- [[prisma-schema-overview]] — part of the 14-model schema
- [[seed-data-pipeline]] — seeded from `books/markdown/pokedexes/`
- [[encounter-table-data-model]] — EncounterTableEntry references SpeciesData
