---
cap_id: pokemon-lifecycle-C065
name: usePokemonSprite.getDexNumber
type: composable-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C065: usePokemonSprite.getDexNumber
- **cap_id**: pokemon-lifecycle-C065
- **name**: Species Dex Number Lookup
- **type**: composable-function
- **location**: `app/composables/usePokemonSprite.ts` -- `getDexNumber()`
- **game_concept**: National Pokedex number resolution
- **description**: Returns dex number from species name (Gen 1-5 complete: 649 entries). Returns null for unknown species.
- **inputs**: species string
- **outputs**: number | null
- **accessible_from**: gm, player, group
