The CSV import service (`app/server/services/csv-import.service.ts`) parses PTU character sheet CSV files exported from the official spreadsheet and creates database records.

It defines `ParsedTrainer` and `ParsedPokemon` interfaces mapping CSV columns to typed structures. The trainer parser extracts name, stats, skills, features, edges, background, and money. The Pokemon parser extracts species, level, nature, stats, types, moves, abilities, and gender.

Pokemon creation routes through `createPokemonRecord()` in the [[pokemon-generator-service]] to ensure consistent defaults (loyalty, tutor points, stat calculations). The CSV parser utility in `app/server/utils/csv-parser.ts` provides `getCell()` and `parseNumber()` functions following RFC 4180 for correct field extraction.

The import endpoint at `/api/characters/import-csv.post` uses this service and is also used by the [[player-api-provides-rest-fallback-for-actions]] import functionality.

## See also

- [[character-api-covers-crud-and-rest-healing]] — the import-csv endpoint lives alongside character CRUD
- [[services-are-stateless-function-modules]]
