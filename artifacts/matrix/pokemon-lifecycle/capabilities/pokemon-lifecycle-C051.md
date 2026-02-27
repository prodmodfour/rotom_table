---
cap_id: pokemon-lifecycle-C051
name: library.updatePokemon
type: store-action
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C051: library.updatePokemon
- **cap_id**: pokemon-lifecycle-C051
- **name**: Update Pokemon (Store Action)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `updatePokemon()`
- **game_concept**: Client-side Pokemon update
- **description**: PUTs to /api/pokemon/:id with partial Pokemon data. Updates the matching entry in store's pokemon array by index. Returns updated Pokemon.
- **inputs**: id string, Partial<Pokemon> data
- **outputs**: Updated Pokemon object
- **accessible_from**: gm
