---
cap_id: pokemon-lifecycle-C062
name: usePokemonSprite.getSpriteUrl
type: composable-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C062: usePokemonSprite.getSpriteUrl
- **cap_id**: pokemon-lifecycle-C062
- **name**: Primary Sprite URL Generator
- **type**: composable-function
- **location**: `app/composables/usePokemonSprite.ts` -- `getSpriteUrl()`
- **game_concept**: Pokemon sprite display (B2W2 for Gen 1-5, Showdown for Gen 6+)
- **description**: Returns animated sprite URL. Gen 1-5 (dex <= 649): PokeAPI B2W2 animated GIF. Gen 6+: Pokemon Showdown animated GIF. Handles shiny variants. Maps special names via showdownNames lookup (regional forms, special characters).
- **inputs**: species string, shiny boolean
- **outputs**: URL string
- **accessible_from**: gm, player, group
