---
cap_id: character-lifecycle-C030
name: character-lifecycle-C030
type: —
domain: character-lifecycle
---

### character-lifecycle-C030
- **name:** CSV Import Service — detectSheetType
- **type:** service-function
- **location:** `app/server/services/csv-import.service.ts` — detectSheetType()
- **game_concept:** PTU sheet type detection
- **description:** Analyzes CSV rows to determine if the sheet is a trainer sheet or pokemon sheet based on header patterns. Returns 'trainer', 'pokemon', or 'unknown'.
- **inputs:** string[][] (parsed CSV rows)
- **outputs:** 'trainer' | 'pokemon' | 'unknown'
- **accessible_from:** api-only (via import-csv endpoint)
