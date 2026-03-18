The `library` store's `loadLibrary` action fetches humans and pokemon from the API simultaneously using `Promise.all`. Both `/api/characters` and `/api/pokemon` requests fire at the same time, and the store updates only after both resolve.

At runtime, the library holds the full dataset in memory — observed: 9 humans and 183 pokemon loaded on the `/gm/sheets` page. All filtering and sorting (by name, type, character type, pokemon origin, sort order) happens client-side against this in-memory collection.

The store provides grouped views: `groupedNpcsByLocation` and `groupedPokemonByLocation` organize entities by their `location` field for display. `filteredPlayers` extracts only player-type characters.

## See also

- [[pokemon-library-store]] — pokemon-specific aspects of this store
- [[stores-instantiate-lazily-per-page]] — this store only loads on pages that need the library