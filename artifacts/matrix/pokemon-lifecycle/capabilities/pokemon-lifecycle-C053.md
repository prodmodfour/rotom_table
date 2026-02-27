---
cap_id: pokemon-lifecycle-C053
name: library.linkPokemonToTrainer
type: store-action
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C053: library.linkPokemonToTrainer
- **cap_id**: pokemon-lifecycle-C053
- **name**: Link Pokemon to Trainer (Store Action)
- **type**: store-action
- **location**: `app/stores/library.ts` -- `linkPokemonToTrainer()`
- **game_concept**: Assign Pokemon to trainer party
- **description**: POSTs to /api/pokemon/:id/link with { trainerId }. Updates matching Pokemon in store array with returned data.
- **inputs**: pokemonId string, trainerId string
- **outputs**: void (updates store state)
- **accessible_from**: gm
