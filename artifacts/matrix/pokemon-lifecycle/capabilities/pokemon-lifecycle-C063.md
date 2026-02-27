---
cap_id: pokemon-lifecycle-C063
name: usePokemonSprite.getStaticSpriteUrl
type: composable-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C063: usePokemonSprite.getStaticSpriteUrl
- **cap_id**: pokemon-lifecycle-C063
- **name**: Static Sprite URL Generator
- **type**: composable-function
- **location**: `app/composables/usePokemonSprite.ts` -- `getStaticSpriteUrl()`
- **game_concept**: Fallback static sprite
- **description**: Returns static PNG sprite URL via PokeAPI dex number or PokemonDB name-based URL as last resort. Handles shiny variants.
- **inputs**: species string, shiny boolean
- **outputs**: URL string
- **accessible_from**: gm, player, group
