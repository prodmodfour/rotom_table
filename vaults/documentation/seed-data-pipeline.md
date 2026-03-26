# Seed Data Pipeline

`seed.ts` runs three seed functions in order:

1. **seedMoves** — Parses `app/data/moves.csv` (PTR move database). Upserts into MoveData.
2. **seedSpecies** — Reads all `books/markdown/pokedexes/gen*/` markdown files via `parsePokedexContent()`. Upserts into SpeciesData with stats, evolution triggers, [[movement-trait-types|movement traits]].
3. **seedTypeEffectiveness** — No-op. The type chart lives in a client-side composable, not the database.

AbilityData is seeded separately or populated on demand. No encounter tables or sample characters are seeded — those are created at runtime by the GM.

Additional seed files exist for specific data: `seed-encounter-tables.ts` (habitats), `seed-hassan-chompy.ts` and `seed-ilaria-iris.ts` (sample player characters).

## See also

- [[prisma-schema-overview]]
- [[schema-sync-strategy]]
- [[species-data-model]] — the SpeciesData model populated by seedSpecies
