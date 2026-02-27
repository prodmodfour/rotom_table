---
cap_id: pokemon-lifecycle-C058
name: library.getPokemonById
type: store-getter
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C058: library.getPokemonById
- **cap_id**: pokemon-lifecycle-C058
- **name**: Get Pokemon by ID
- **type**: store-getter
- **location**: `app/stores/library.ts` -- `getPokemonById`
- **game_concept**: Single Pokemon lookup from store
- **description**: Returns the first Pokemon in store matching the given ID, or undefined.
- **inputs**: id string
- **outputs**: Pokemon | undefined
- **accessible_from**: gm
