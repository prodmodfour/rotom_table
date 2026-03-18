The encounter table API endpoints follow a nested REST hierarchy under `/api/encounter-tables/`:

- `/` — list and create tables
- `/:id` — get, update, delete a single table
- `/:id/entries` — add entries to a table
- `/:id/entries/:entryId` — update or delete a specific entry
- `/:id/modifications` — list and create modifications (sub-habitats)
- `/:id/modifications/:modId` — get, update, delete a modification
- `/:id/modifications/:modId/entries` — add modification entries
- `/:id/modifications/:modId/entries/:entryId` — delete a modification entry
- `/:id/generate` — generate Pokemon from the table
- `/:id/export` — export table as JSON
- `/import` — import a table from JSON

Every mutation endpoint validates ownership chains — for example, deleting a modification entry verifies that the entry belongs to the modification, which belongs to the table. The [[encounter-table-store-centralizes-state-and-api-calls]] wraps all of these endpoints.

## See also

- [[encounter-table-api-validates-level-range-ordering]]
- [[server-uses-nuxt-file-based-rest-routing]] — the file-based routing convention that enables this nesting
