The encounter table import endpoint (`POST /api/encounter-tables/import`) looks up species by name using case-insensitive matching. Species names in the imported JSON that don't match any known species are skipped and reported as warnings in the response.

Import also handles name collisions with existing tables by appending `(N)` to the imported table's name. The entire table — entries, modifications, and modification entries — is created in a single nested Prisma create operation.

The import format is version 1.0, and the [[encounter-table-export-strips-internal-ids]] endpoint produces files in this format.

## See also

- [[encounter-table-import-modal]] — the UI for uploading JSON files
- [[species-data-model-fields]] — the species records matched against
