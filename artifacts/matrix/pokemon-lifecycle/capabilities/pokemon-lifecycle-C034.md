---
cap_id: pokemon-lifecycle-C034
name: GET /api/pokemon
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C034: GET /api/pokemon
- **cap_id**: pokemon-lifecycle-C034
- **name**: List All Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/index.get.ts`
- **game_concept**: Pokemon library listing
- **description**: Returns all Pokemon, sorted by species asc. Filters: origin (string, optional), includeArchived (boolean, default false). When includeArchived is false, only returns Pokemon with isInLibrary=true. Uses serializePokemon() for consistent response shape.
- **inputs**: Query params: origin?, includeArchived?
- **outputs**: { success: true, data: Pokemon[] }
- **accessible_from**: gm, player
