A single species record within an EncounterTable. Links a `speciesId` to the table with a `weight` (encounter probability) and optional `levelMin`/`levelMax` override.

The unique constraint on `(tableId, speciesId)` prevents duplicate species entries within the same table. When the encounter generation service rolls on a table, it uses the weights to determine which EncounterTableEntry is selected.

## See also

- [[species-data-model]] — the species referenced by speciesId
