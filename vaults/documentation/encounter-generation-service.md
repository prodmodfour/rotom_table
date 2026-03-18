# Encounter Generation Service

`server/services/encounter-generation.service.ts` — weighted random species selection with diversity enforcement for spawn tables. Listed in [[service-inventory]].

## Algorithm

Takes a [[resolved-entry-pool]] (species with weights) and a requested count. Selects species via weighted random sampling, enforcing diversity so the same species is less likely to appear consecutively. Each generated result includes `speciesId`, `speciesName`, `level` (randomized within the entry's level range), `weight`, and `source` tag.

## Invocation

Called by the generate API endpoint (`POST /api/encounter-tables/:id/generate`). The endpoint resolves the species pool (applying an optional [[sub-habitat-modification-system|modification]]), determines the level range, and delegates to this service. Response metadata includes table info, density, spawn count, total pool size, and total weight.

The [[encounter-table-store|generateFromTable]] store action wraps this endpoint for the UI.

## See also

- [[encounter-table-api]]
- [[resolved-entry-pool]]
- [[service-inventory]]
