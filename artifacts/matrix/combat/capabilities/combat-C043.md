---
cap_id: combat-C043
name: Get/Set Terrain
type: api-endpoint
domain: combat
---

### combat-C043: Get/Set Terrain
- **cap_id**: combat-C043
- **name**: Terrain State
- **type**: api-endpoint
- **location**: `app/server/api/encounters/[id]/terrain.get.ts`, `terrain.put.ts`
- **game_concept**: Terrain types with movement costs
- **description**: Get or update terrain grid state (normal, rough, blocking, water, tall_grass, hazard).
- **inputs**: Terrain state (PUT)
- **outputs**: Terrain state
- **accessible_from**: gm
