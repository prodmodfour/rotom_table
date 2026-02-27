---
cap_id: encounter-tables-C012
name: encounter-tables-C012
type: —
domain: encounter-tables
---

### encounter-tables-C012
- **name:** Get/Update/Delete Encounter Table APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id].get.ts`, `[id].put.ts`, `[id].delete.ts`
- **game_concept:** Single table CRUD
- **description:** Get returns table with all entries and modifications. Put updates name, description, imageUrl, level range, density. Delete cascades to all entries and modifications.
- **inputs:** URL param: id. Body (put): partial table fields
- **outputs:** `{ success, data: EncounterTable }` or `{ success: true }`
- **accessible_from:** gm
