The library Pinia store (`app/stores/library.ts`) manages the client-side Pokemon (and human) library. It holds a `pokemon[]` array synced with the backend.

Key actions:
- `loadLibrary()` — fetches all humans and Pokemon in parallel on startup
- `createPokemon(data)` — calls `POST /api/pokemon`
- `updatePokemon(id, data)` — calls `PUT /api/pokemon/:id`
- `deletePokemon(id)` — calls `DELETE /api/pokemon/:id`
- `linkPokemonToTrainer(pokemonId, trainerId)` — calls `POST /api/pokemon/:id/link`
- `unlinkPokemon(pokemonId)` — calls `POST /api/pokemon/:id/unlink`

Key getters: `filteredPokemon` (search, type, origin filters), `getPokemonById`, `getPokemonByOwner`, `groupedPokemonByLocation`.

The [[gm-pokemon-detail-page]] uses this store for saving edits, and the [[gm-character-library-page]] uses it for listing and filtering.


## See also

- [[library-store-loads-humans-and-pokemon-in-parallel]] — the parallel loading and filtering architecture
- [[all-stores-use-pinia-options-api]]