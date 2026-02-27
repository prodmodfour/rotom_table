---
cap_id: pokemon-lifecycle-C039
name: POST /api/pokemon/:id/link
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C039: POST /api/pokemon/:id/link
- **cap_id**: pokemon-lifecycle-C039
- **name**: Link Pokemon to Trainer
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/link.post.ts`
- **game_concept**: Trainer-Pokemon ownership assignment
- **description**: Sets ownerId on a Pokemon record to the specified trainerId. Verifies both Pokemon and trainer exist. Returns full parsed Pokemon data.
- **inputs**: Route param: id, Body: { trainerId }
- **outputs**: { data: Pokemon }
- **accessible_from**: gm
