---
cap_id: pokemon-lifecycle-C064
name: usePokemonSprite.getSpriteWithFallback
type: composable-function
domain: pokemon-lifecycle
---

### pokemon-lifecycle-C064: usePokemonSprite.getSpriteWithFallback
- **cap_id**: pokemon-lifecycle-C064
- **name**: Sprite URL with Fallback Chain
- **type**: composable-function
- **location**: `app/composables/usePokemonSprite.ts` -- `getSpriteWithFallback()`
- **game_concept**: Reliable sprite loading
- **description**: Async function. Tries multiple sprite sources in order: Showdown animated, PokeAPI BW animated, PokeAPI static. HEAD-checks each URL. Returns /images/pokemon-placeholder.svg if all fail.
- **inputs**: species string, shiny boolean
- **outputs**: Promise<URL string>
- **accessible_from**: gm, player, group
