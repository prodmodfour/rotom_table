---
cap_id: encounter-tables-C017
name: encounter-tables-C017
type: —
domain: encounter-tables
---

### encounter-tables-C017
- **name:** Export/Import Table APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/export.get.ts`, `app/server/api/encounter-tables/import.post.ts`
- **game_concept:** Table JSON export/import
- **description:** Export downloads table as JSON file. Import creates a new table from JSON data, returns the created table and any warnings.
- **inputs:** Export: URL param id. Import: Body: JSON data object
- **outputs:** Export: JSON file download. Import: `{ data: EncounterTable, warnings: string | null }`
- **accessible_from:** gm

## Store
