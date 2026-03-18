# Schema Sync Strategy

There is no migrations directory. Schema changes use `prisma db push` for destructive sync against the local SQLite file. After schema changes, re-run `prisma db push` + `prisma db seed`.

One-time migration scripts exist in `app/prisma/`:
- `backfill-origin.ts`
- `migrate-capabilities-key.ts`
- `migrate-phantom-conditions.ts`

The database file (`ptu.db`) is gitignored via `*.db` in `.gitignore`. Each developer generates it locally.

## See also

- [[prisma-schema-overview]]
- [[seed-data-pipeline]]
