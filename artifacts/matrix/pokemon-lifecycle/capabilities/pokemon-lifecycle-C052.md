---
cap_id: pokemon-lifecycle-C052
name: library.deletePokemon
type: store-action
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C052: library.deletePokemon
- **cap_id**: pokemon-lifecycle-C052
- **name**: Delete Pokemon (Store Action)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `deletePokemon()`
- **game_concept**: Client-side Pokemon deletion
- **description**: DELETEs /api/pokemon/:id. Filters Pokemon out of store's pokemon array.
- **inputs**: id string
- **outputs**: void (updates store state)
- **accessible_from**: gm
