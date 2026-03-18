# Showdown Sprite Name Mappings

`usePokemonSprite` composable contains a `showdownNames` record with 280+ entries mapping Pokemon names (hyphens, special characters, forms) to Pokemon Showdown sprite URL slugs.

New Pokemon or alternate forms require manual entries in this record. The composable is part of the [[composable-domain-grouping|Pokemon domain]].

## See also

- [[pokemon-sprite-resolution-chain]] — the multi-source fallback chain that uses these mappings
