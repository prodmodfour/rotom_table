The `encounterTables` Pinia store manages all client-side state for encounter tables. It holds the `tables` array, `selectedTableId`, loading/error state, and filter settings (search text, sort field, sort order).

All API calls go through this store's actions: `loadTables`, `loadTable`, `createTable`, `updateTable`, `deleteTable`, `addEntry`, `updateEntry`, `removeEntry`, `createModification`, `updateModification`, `deleteModification`, `addModificationEntry`, `removeModificationEntry`, `generateFromTable`, `exportTable`, `importTable`.

The store provides computed getters including `filteredTables` (applies search and sort), `getResolvedEntries` (see [[store-resolves-entries-by-merging-parent-with-modification]]), and `getTotalWeight`.

The [[use-table-editor-composable-orchestrates-editing-ui]] composable sits on top of this store, adding form state and modal management.

## See also

- [[encounter-table-api-is-nested-rest-hierarchy]] — the API endpoints this store wraps
- [[store-does-optimistic-update-for-entry-weight]]


- [[all-stores-use-pinia-options-api]]
- [[no-store-imports-another-store]]