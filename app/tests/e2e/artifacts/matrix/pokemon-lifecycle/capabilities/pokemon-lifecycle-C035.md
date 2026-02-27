---
cap_id: pokemon-lifecycle-C035
name: GET /api/pokemon/:id
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C035: GET /api/pokemon/:id
- **cap_id**: pokemon-lifecycle-C035
- **name**: Get Single Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].get.ts`
- **game_concept**: Pokemon sheet detail view
- **description**: Returns a single Pokemon by ID with all fields serialized. 404 if not found.
- **inputs**: Route param: id
- **outputs**: { success: true, data: Pokemon }
- **accessible_from**: gm, player
