---
cap_id: pokemon-lifecycle-C054
name: library.unlinkPokemon
type: store-action
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C054: library.unlinkPokemon
- **cap_id**: pokemon-lifecycle-C054
- **name**: Unlink Pokemon from Trainer (Store Action)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `unlinkPokemon()`
- **game_concept**: Release Pokemon from trainer
- **description**: POSTs to /api/pokemon/:id/unlink. Updates matching Pokemon in store array with returned data (ownerId now null).
- **inputs**: pokemonId string
- **outputs**: void (updates store state)
- **accessible_from**: gm
