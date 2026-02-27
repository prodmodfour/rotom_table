---
cap_id: encounter-tables-C014
name: encounter-tables-C014
type: —
domain: encounter-tables
---

### encounter-tables-C014
- **name:** CRUD Modification (Sub-habitat) APIs
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/modifications/` — index.get.ts, index.post.ts, [modId].get.ts, [modId].put.ts, [modId].delete.ts
- **game_concept:** Sub-habitat management
- **description:** List, create, get, update, delete sub-habitat modifications. Each modification can have its own name, description, level range override, and density multiplier.
- **inputs:** URL params: id, modId. Body: { name, description?, levelRange?, densityMultiplier? }
- **outputs:** `{ success, data: TableModification }` or `{ success: true }`
- **accessible_from:** gm
