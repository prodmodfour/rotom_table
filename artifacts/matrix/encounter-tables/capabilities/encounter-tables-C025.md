---
cap_id: encounter-tables-C025
name: encounter-tables-C025
type: —
domain: encounter-tables
---

### encounter-tables-C025
- **name:** Encounter Tables Store — generateFromTable action
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` — generateFromTable()
- **game_concept:** Wild Pokemon generation via store
- **description:** POSTs to generate endpoint with count, modificationId, levelRange options. Returns generated Pokemon list and metadata.
- **inputs:** tableId, { count, modificationId?, levelRange? }
- **outputs:** { generated: Array<{speciesId, speciesName, level, weight, source}>, meta: {...} }
- **accessible_from:** gm
