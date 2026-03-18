# Encounter Table Data Model

Four Prisma models form a two-level hierarchy for weighted spawn tables with sub-habitat overlays.

## EncounterTable

Top-level table representing a habitat. Fields: `name`, `description`, `imageUrl`, `levelMin`/`levelMax` (default level range), `density` (population density tier). Has many [[encounter-table-entry|EncounterTableEntry]] records and [[sub-habitat-modification-system|TableModification]] records.

## EncounterTableEntry

Links a species (`speciesId` FK to SpeciesData) to a table with a `weight` (encounter probability) and optional `levelMin`/`levelMax` override. Unique constraint on `(tableId, speciesId)` prevents duplicate species in one table.

## TableModification

A sub-habitat that modifies its parent table's species pool. Has its own `name`, `description`, optional `levelMin`/`levelMax` override, and a `densityMultiplier` that scales the parent's density. Contains nested ModificationEntry records.

## ModificationEntry

Individual override within a modification. Uses `speciesName` (string, not FK) so it can reference species not in the parent table. Can set a `weight` (override or add) or `remove=true` (exclude from pool). Optional `levelMin`/`levelMax` override.

Client-side types for these models live in `types/habitat.ts`, which also includes `RarityPreset` and `DensityTier` runtime constants. See [[type-file-classification]].

## See also

- [[prisma-schema-overview]]
- [[sub-habitat-modification-system]]
- [[encounter-table-api]]
