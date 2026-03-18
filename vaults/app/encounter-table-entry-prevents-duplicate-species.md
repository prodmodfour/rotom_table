The `EncounterTableEntry` model has a unique constraint on `(tableId, speciesId)`. This prevents adding the same species twice to the same encounter table.

The API enforces this at the server level — `POST /api/encounter-tables/:id/entries` returns a 409 Conflict if the species already exists in the table. The same constraint applies to `ModificationEntry` via a unique on `(modificationId, speciesName)`.

## See also

- [[encounter-table-data-model-has-four-prisma-entities]]
- [[habitat-add-pokemon-modal]] — the UI through which entries are added
