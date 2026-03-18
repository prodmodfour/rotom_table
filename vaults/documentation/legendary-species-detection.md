# Legendary Species Detection

`constants/legendarySpecies.ts` defines `LEGENDARY_SPECIES`, a `ReadonlySet` of ~70 legendary and mythical Pokemon names from Gen 1–8 plus Hisui (Enamorus). Names in Title Case matching `SpeciesData.name`. Includes Ultra Beasts (Nihilego, Buzzwole, etc.).

`isLegendarySpecies(speciesName)` performs a direct set lookup, falling back to case-insensitive comparison. Used by both [[capture-api-endpoints|capture API endpoints]] to auto-apply the −30 [[capture-rate-formula|capture rate]] penalty. The GM can override via `isLegendary` in the request body.

## See also

- [[capture-rate-formula]]
- [[capture-api-endpoints]]
