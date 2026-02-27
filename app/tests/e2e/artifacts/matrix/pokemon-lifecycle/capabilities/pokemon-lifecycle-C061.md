---
cap_id: pokemon-lifecycle-C061
name: library.setFilters
type: store-getter
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C061: library.setFilters
- **cap_id**: pokemon-lifecycle-C061
- **name**: Set Library Filters
- **type**: store-getter
- **location**: `app/stores/library.ts` -- `setFilters()`
- **game_concept**: Filter control for library UI
- **description**: Merges partial filter updates into current filters state (search, type, characterType, pokemonType, pokemonOrigin, sortBy, sortOrder). Immutable merge via spread.
- **inputs**: Partial<LibraryFilters>
- **outputs**: void (updates state)
- **accessible_from**: gm

---

## Composable Functions
