The `usePokemonSprite` composable (`app/composables/usePokemonSprite.ts`) resolves sprite URLs for Pokemon displayed on the [[gm-pokemon-detail-page]], [[gm-character-library-pokemon-card]], and [[player-view-pokemon-card]].

For Gen 1–5 Pokemon (dex numbers 1–649), it uses B2W2 animated GIFs. For Gen 6+, it uses Pokemon Showdown animated GIFs. It handles regional forms (e.g., Alolan, Galarian), special name cases, and shiny variants.

The composable provides a `getSpriteWithFallback` function that tries multiple URL patterns before falling back to a static image. Species name is the input key — the name stored on the Pokemon record (from [[species-data-model-fields]]) drives which sprite is resolved.
