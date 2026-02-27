---
cap_id: encounter-tables-C021
name: encounter-tables-C021
type: —
domain: encounter-tables
---

### encounter-tables-C021
- **name:** Encounter Tables Store — entry management actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` — addEntry(), updateEntry(), removeEntry()
- **game_concept:** Table entry management via store
- **description:** Add/update/remove species entries from a table. Add and remove reload the full table; update modifies local state directly.
- **inputs:** tableId, entryId, entry data
- **outputs:** Updated table entries
- **accessible_from:** gm
