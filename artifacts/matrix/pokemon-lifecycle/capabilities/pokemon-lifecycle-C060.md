---
cap_id: pokemon-lifecycle-C060
name: library.groupedPokemonByLocation
type: store-getter
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C060: library.groupedPokemonByLocation
- **cap_id**: pokemon-lifecycle-C060
- **name**: Pokemon Grouped by Location
- **type**: store-getter
- **location**: `app/stores/library.ts` -- `groupedPokemonByLocation`
- **game_concept**: Location-based Pokemon organization
- **description**: Groups filteredPokemon by location field. Empty locations sorted last as "No Location". Returns array of { location, pokemon[] }.
- **inputs**: Derived from filteredPokemon
- **outputs**: Array<{ location: string, pokemon: Pokemon[] }>
- **accessible_from**: gm
