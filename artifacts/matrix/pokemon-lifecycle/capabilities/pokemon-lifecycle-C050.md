---
cap_id: pokemon-lifecycle-C050
name: library.createPokemon
type: store-action
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C050: library.createPokemon
- **cap_id**: pokemon-lifecycle-C050
- **name**: Create Pokemon (Store Action)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `createPokemon()`
- **game_concept**: Client-side Pokemon creation
- **description**: POSTs to /api/pokemon with partial Pokemon data. Pushes returned Pokemon to store's pokemon array. Returns the created Pokemon.
- **inputs**: Partial<Pokemon> data
- **outputs**: Created Pokemon object
- **accessible_from**: gm
