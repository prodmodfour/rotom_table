The encounter table domain is modeled with four Prisma entities: `EncounterTable` (root, with name, description, imageUrl, default level range, density), `EncounterTableEntry` (a species+weight row belonging to a table), `TableModification` (a sub-habitat that modifies its parent table), and `ModificationEntry` (an override/add/remove instruction within a modification).

`EncounterTable` has cascade-delete relations to both `EncounterTableEntry[]` and `TableModification[]`, so deleting a table removes all its entries and modifications. `TableModification` similarly cascade-deletes its `ModificationEntry[]` children.

The [[encounter-table-entry-prevents-duplicate-species]] constraint lives on `EncounterTableEntry`. The [[modification-entry-references-species-by-name-not-id]] design choice lives on `ModificationEntry`.

## See also

- [[species-data-model-fields]] — `EncounterTableEntry.speciesId` is a FK to `SpeciesData`
- [[habitat-detail-page]] — the UI that renders this data model
- [[prisma-schema-has-fourteen-models]] — the full schema this model belongs to
