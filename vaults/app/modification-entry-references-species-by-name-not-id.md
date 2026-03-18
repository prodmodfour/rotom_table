`ModificationEntry.speciesName` is a plain string rather than a foreign key to `SpeciesData`. This differs from `EncounterTableEntry`, which uses `speciesId` as a proper FK.

This design allows modifications to reference species that don't exist in the parent table's entries — enabling the "add new species" action in sub-habitats, not just "override weight" or "remove."

The [[store-resolves-entries-by-merging-parent-with-modification]] getter uses this string to match against parent entries by name and to identify truly new additions.

## See also

- [[encounter-table-data-model-has-four-prisma-entities]]
- [[pokemon-stores-species-as-name-string]] — a similar pattern where Pokemon stores species as a name string
- [[habitat-add-modification-entry-modal]] — the UI for adding modification entries
