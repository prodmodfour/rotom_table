---
cap_id: pokemon-lifecycle-C040
name: POST /api/pokemon/:id/unlink
type: api-endpoint
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C040: POST /api/pokemon/:id/unlink
- **cap_id**: pokemon-lifecycle-C040
- **name**: Unlink Pokemon from Trainer
- **type**: api-endpoint
- **location**: `app/server/api/pokemon/[id]/unlink.post.ts`
- **game_concept**: Release Pokemon from trainer ownership
- **description**: Sets ownerId to null on a Pokemon record. Returns full parsed Pokemon data.
- **inputs**: Route param: id
- **outputs**: { data: Pokemon }
- **accessible_from**: gm
