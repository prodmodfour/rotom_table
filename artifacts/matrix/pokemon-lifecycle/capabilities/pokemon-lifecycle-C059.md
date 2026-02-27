---
cap_id: pokemon-lifecycle-C059
name: library.getPokemonByOwner
type: store-getter
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C059: library.getPokemonByOwner
- **cap_id**: pokemon-lifecycle-C059
- **name**: Get Pokemon by Owner
- **type**: store-getter
- **location**: `app/stores/library.ts` -- `getPokemonByOwner`
- **game_concept**: Trainer's party lookup
- **description**: Returns all Pokemon in store with matching ownerId.
- **inputs**: ownerId string
- **outputs**: Pokemon[]
- **accessible_from**: gm
