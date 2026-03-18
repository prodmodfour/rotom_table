# Encounter Table Store

Pinia store at `stores/encounterTables.ts` managing weighted spawn tables, sub-habitat modifications, and Pokemon generation. Listed in [[pinia-store-classification]] and mapped to the `encounter-tables` API group in [[store-to-domain-mapping]].

## Actions

- **Table CRUD:** `loadTables`, `loadTable`, `createTable`, `updateTable`, `deleteTable` — fetch, create, and manage encounter tables via [[encounter-table-api]].
- **Entry management:** `addEntry`, `updateEntry`, `removeEntry` — manage species entries. Add and remove reload the full table; update modifies local state directly.
- **Modification management:** `createModification`, `updateModification`, `deleteModification`, `addModificationEntry`, `removeModificationEntry` — full CRUD for [[sub-habitat-modification-system|sub-habitats]] and their entries.
- **Generation:** `generateFromTable` — POSTs to the generate endpoint with count, optional modification, and level range. Returns generated Pokemon and metadata.
- **Export/import:** `exportTable` triggers browser download via URL navigation. `importTable` POSTs JSON data and adds the result to local state, returning warnings if any.

## Getters

- `getResolvedEntries` — computes the [[resolved-entry-pool]] by merging parent entries with an optional modification overlay.
- `getTotalWeight` — sums resolved entry weights for probability display.
- `filteredTables` — filters tables by search text (name, description) and sorts by name/createdAt/updatedAt via `setFilters`/`resetFilters` actions.

## See also

- [[encounter-table-api]]
- [[pinia-store-classification]]
- [[encounter-table-components]]
