---
cap_id: encounter-tables-C026
name: encounter-tables-C026
type: —
domain: encounter-tables
---

### encounter-tables-C026
- **name:** Encounter Tables Store — export/import actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` — exportTable(), importTable()
- **game_concept:** Table JSON export/import via store
- **description:** Export triggers browser download via URL navigation. Import POSTs JSON data and adds result to local state, returns table + warnings.
- **inputs:** tableId (export) or JSON data (import)
- **outputs:** void (export) or { table, warnings } (import)
- **accessible_from:** gm
