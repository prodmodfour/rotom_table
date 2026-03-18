The `app/prisma/` directory contains seed and migration files that initialize and evolve the database.

`seed.ts` is the main seed file. It parses CSV files to populate the `MoveData`, `AbilityData`, and `SpeciesData` reference tables. The [[move-seed-parses-csv-into-database]] and [[species-data-table-seeded-from-pokedex-markdown]] describe these processes in detail.

Campaign-specific seed files create test data for development: `seed-ilaria-iris.ts` and `seed-hassan-chompy.ts` create specific trainer and Pokemon records, while `seed-encounter-tables.ts` populates encounter table data.

Three manual migration scripts handle schema evolution outside of Prisma Migrate: `backfill-origin.ts` sets the `origin` field on existing Pokemon, `migrate-capabilities-key.ts` restructures capability data, and `migrate-phantom-conditions.ts` cleans up phantom status conditions. These are run manually via `npx tsx` when needed, reflecting the absence of a formal migration system — schema changes use `prisma db push` instead.

## See also

- [[prisma-uses-sqlite-with-json-columns-pattern]] — the database these files populate
- [[prisma-schema-has-fourteen-models]] — the schema definition these seeds target
