The `Pokemon` model (`app/prisma/schema.prisma`) stores `species` as a plain `String` — the species name — with no foreign key to the `SpeciesData` table.

This means a Pokemon record is not structurally linked to its species reference data. Services that need species details (the [[pokemon-generator-service]], [[evolution-service]], [[evolution-check-utility]], capture rate calculation) perform separate queries to `SpeciesData` using the name string.

The [[species-data-model-fields]] table is instead referenced by foreign key from `EncounterTableEntry.speciesId`, which links encounter table entries to species for the habitat/encounter system.

## See also

- [[pokemon-sprite-resolution]] — also resolves by species name string
- [[modification-entry-references-species-by-name-not-id]] — another place where species are referenced by name string rather than FK