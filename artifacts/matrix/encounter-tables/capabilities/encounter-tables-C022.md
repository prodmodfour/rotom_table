---
cap_id: encounter-tables-C022
name: encounter-tables-C022
type: —
domain: encounter-tables
---

### encounter-tables-C022
- **name:** Encounter Tables Store — modification management actions
- **type:** store-action
- **location:** `app/stores/encounterTables.ts` — createModification(), updateModification(), deleteModification(), addModificationEntry(), removeModificationEntry()
- **game_concept:** Sub-habitat management via store
- **description:** Full CRUD for modifications (sub-habitats) and their entries. Creates/updates/deletes modifications, adds/removes modification entries.
- **inputs:** tableId, modId, entryId, modification/entry data
- **outputs:** Updated modifications in local state
- **accessible_from:** gm
