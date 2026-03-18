# Pokemon Sprite Resolution Chain

`usePokemonSprite` composable in `composables/usePokemonSprite.ts` resolves sprite URLs through a multi-source fallback chain.

## Primary URL

`getSpriteUrl()` selects the source by generation:

- **Gen 1–5** (dex ≤ 649): PokeAPI Black 2/White 2 animated GIF
- **Gen 6+**: Pokemon Showdown animated GIF

Both paths handle shiny variants. Special names (regional forms, special characters) are mapped via the [[showdown-sprite-name-mappings]] lookup record.

## Static Fallback

`getStaticSpriteUrl()` returns a static PNG via PokeAPI dex number, with a PokemonDB name-based URL as last resort. Handles shiny variants.

## Full Fallback Chain

`getSpriteWithFallback()` tries multiple sources in order, HEAD-checking each URL:

1. Showdown animated GIF
2. PokeAPI BW animated GIF
3. PokeAPI static PNG
4. `/images/pokemon-placeholder.svg` (final fallback)

## Dex Number Lookup

`getDexNumber()` returns the National Pokedex number from a species name. Complete for Gen 1–5 (649 entries). Returns null for unknown species.

## See also

- [[showdown-sprite-name-mappings]] — the 280+ entry name mapping record
- [[composable-domain-grouping]] — part of the Pokemon composable group
