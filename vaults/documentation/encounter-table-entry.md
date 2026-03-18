A single species record within an [[encounter-table-data-model|EncounterTable]]. Links a `speciesId` to the table with a `weight` (encounter probability) and optional `levelMin`/`levelMax` override.

The unique constraint on `(tableId, speciesId)` prevents duplicate species entries within the same table. When the [[encounter-generation-service]] rolls on a table, it uses the weights to determine which EncounterTableEntry is selected.

## See also

- [[encounter-table-data-model]] — the parent table this entry belongs to
- [[encounter-table-api]] — the API for CRUD operations on entries
- [[species-data-model]] — the species referenced by speciesId
- [[encounter-generation-service]] — consumes entries to generate encounters
