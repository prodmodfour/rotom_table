The `getResolvedEntries(tableId, modificationId?)` getter in the encounter tables store merges a parent table's entries with a modification's overrides to produce a `ResolvedTableEntry[]`.

When no modification is selected, it returns the parent entries as-is with `source: 'parent'`. When a modification is selected, it:

1. Starts with all parent entries
2. Removes entries that the modification marks with `remove: true`
3. Overrides weights for entries the modification references by species name
4. Adds new entries that exist only in the modification (with `source: 'added'`)

Each resolved entry carries a `source` field: `'parent'`, `'modification'` (overridden), or `'added'` (new from modification).

This resolution logic is used by the [[generate-wild-encounter-modal]] to show the encounter pool preview and by the server-side generation endpoint to build the weighted selection pool.

## See also

- [[modification-entry-references-species-by-name-not-id]] — why matching is by name
- [[habitat-weight-determines-encounter-chance]] — the weight→chance calculation applied to resolved entries
- [[habitat-sub-habitats]] — the UI that presents modifications
