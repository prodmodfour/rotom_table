---
cap_id: encounter-tables-C016
name: encounter-tables-C016
type: —
domain: encounter-tables
---

### encounter-tables-C016
- **name:** Generate Pokemon from Table API
- **type:** api-endpoint
- **location:** `app/server/api/encounter-tables/[id]/generate.post.ts`
- **game_concept:** Wild Pokemon encounter generation
- **description:** Generates Pokemon from table using diversity-enforced weighted random selection. Resolves species pool with optional modification applied, determines level range (override or table default). Uses encounter-generation.service for the actual selection. Returns generated list and metadata (table info, density, spawn count, pool size).
- **inputs:** URL param: id. Body: { count, modificationId?, levelRange? }
- **outputs:** `{ success, data: { generated: [...], meta: { tableId, tableName, density, spawnCount, totalPoolSize, totalWeight } } }`
- **accessible_from:** gm
