---
cap_id: encounter-tables-C020
name: encounter-tables-C020
type: —
domain: encounter-tables
---

### encounter-tables-C020
- **name:** Encounter Tables Store — table CRUD actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` — loadTables(), loadTable(), createTable(), updateTable(), deleteTable()
- **game_concept:** Encounter table state management
- **description:** Manages local table cache. loadTables fetches all, loadTable fetches/updates single, createTable/updateTable/deleteTable perform API operations and update local state.
- **inputs:** Table CRUD data
- **outputs:** Updated tables state
- **accessible_from:** gm
