---
cap_id: character-lifecycle-C031
name: character-lifecycle-C031
type: —
domain: character-lifecycle
---

### character-lifecycle-C031
- **name:** CSV Import Service — parseTrainerSheet / createTrainerFromCSV
- **type:** service-function
- **location:** `app/server/services/csv-import.service.ts` — parseTrainerSheet(), createTrainerFromCSV()
- **game_concept:** PTU trainer CSV parsing and DB creation
- **description:** Extracts trainer data from CSV rows (name, stats, skills, features, edges, equipment, background). Creates HumanCharacter DB record with properly computed maxHp and JSON-stringified fields.
- **inputs:** string[][] (parsed CSV rows)
- **outputs:** ParsedTrainer object → Created HumanCharacter record
- **accessible_from:** api-only (via import-csv endpoint)

## Store
