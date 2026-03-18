The `GET /api/species?search=` endpoint (`app/server/api/species/index.get.ts`) uses `mode: 'insensitive'` in its Prisma `contains` filter. SQLite does not support this mode, so any request with a `search` parameter returns a 500 error with an `Invalid prisma.speciesData.findMany() invocation` message.

The base endpoint without a search parameter works. The [[species-autocomplete-loads-all-on-mount]] components work around this by loading all species without search and filtering client-side.

## See also

- [[prisma-uses-sqlite-with-json-columns-pattern]] — the SQLite/Prisma setup that causes this limitation
