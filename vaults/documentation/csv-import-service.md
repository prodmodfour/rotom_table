# CSV Import Service

`server/services/csv-import.service.ts` — parses PTU character sheet CSVs into database records. Part of the [[service-inventory]].

## detectSheetType

Analyzes CSV row headers to classify the sheet as `'trainer'`, `'pokemon'`, or `'unknown'`.

## parseTrainerSheet / createTrainerFromCSV

Extracts trainer data from CSV rows: name, stats, skills, features, edges, equipment, background. Creates a HumanCharacter DB record with properly computed maxHp and JSON-stringified fields.

Pokemon sheets route through [[pokemon-generator-entry-point]] instead.

## API

Accessed via [[character-api-endpoints|POST /api/characters/import-csv]], which passes raw CSV content to this service.

## See also

- [[character-api-endpoints]]
- [[service-inventory]]
