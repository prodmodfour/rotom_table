# Encounter Table API

REST endpoints under `/api/encounter-tables` for encounter table management.

**CRUD:** GET/POST (list, create). GET/PUT/DELETE `/:id` (read, update, delete).

**Import/export:** POST `.../import` (JSON import). GET `/:id/export` (JSON export).

**Generate:** POST `/:id/generate` — generate wild Pokemon from the table's weighted entries.

**Entries:** POST `/:id/entries` (add). PUT/DELETE `/:id/entries/:entryId` (update, remove).

**Sub-habitats:** GET/POST `/:id/modifications` — nested modification tables with their own entries.

## See also

- [[encounter-table-data-model]]
- [[encounter-table-store]]
- [[encounter-generation-service]]
- [[sub-habitat-modification-system]]
- [[api-endpoint-layout]]
