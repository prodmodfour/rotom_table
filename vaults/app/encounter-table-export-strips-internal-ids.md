The encounter table export endpoint (`GET /api/encounter-tables/:id/export`) produces a JSON file with `Content-Disposition` header for browser download. The export uses a version 1.0 format that strips all internal database IDs — entries are identified by species name, and modifications reference species by name.

This makes exported files portable — they can be imported into a different instance without ID conflicts. The [[encounter-table-import-resolves-species-case-insensitive]] endpoint reconstructs the ID relationships on import.

## See also

- [[encounter-table-api-is-nested-rest-hierarchy]]
