---
cap_id: encounter-tables-C011
name: encounter-tables-C011
type: —
domain: encounter-tables
---

### encounter-tables-C011
- **name:** Create Encounter Table API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/index.post.ts`
- **game_concept:** Create new encounter table
- **description:** Creates a new encounter table with name, description, imageUrl, level range, and density tier.
- **inputs:** Body: { name, description?, imageUrl?, levelRange?, density? }
- **outputs:** `{ success, data: EncounterTable }`
- **accessible_from:** gm
