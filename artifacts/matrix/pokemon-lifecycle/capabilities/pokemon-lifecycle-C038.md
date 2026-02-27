---
cap_id: pokemon-lifecycle-C038
name: DELETE /api/pokemon/:id
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C038: DELETE /api/pokemon/:id
- **cap_id**: pokemon-lifecycle-C038
- **name**: Delete Single Pokemon
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id].delete.ts`
- **game_concept**: Permanent Pokemon removal
- **description**: Permanently deletes a Pokemon record by ID. No active encounter guard (that's only on bulk-action).
- **inputs**: Route param: id
- **outputs**: { success: true }
- **accessible_from**: gm
