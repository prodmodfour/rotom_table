---
cap_id: encounter-tables-C010
name: encounter-tables-C010
type: —
domain: encounter-tables
---

### encounter-tables-C010
- **name:** List Encounter Tables API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/index.get.ts`
- **game_concept:** Browse encounter tables
- **description:** Returns all encounter tables with their entries and modifications.
- **inputs:** None
- **outputs:** `{ success, data: EncounterTable[] }`
- **accessible_from:** gm
