---
cap_id: pokemon-lifecycle-C057
name: library.filteredPokemon
type: store-getter
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C057: library.filteredPokemon
- **cap_id**: pokemon-lifecycle-C057
- **name**: Filtered Pokemon List
- **type**: store-getter
- **location**: `app/stores/library.ts` -- `filteredPokemon`
- **game_concept**: Pokemon library filtering and sorting
- **description**: Filters store's pokemon array by search (species, nickname, location), pokemonType, and pokemonOrigin. Sorts by name or level (asc/desc). Returns filtered and sorted Pokemon[].
- **inputs**: LibraryFilters state (search, pokemonType, pokemonOrigin, sortBy, sortOrder)
- **outputs**: Pokemon[]
- **accessible_from**: gm
