# Sub-habitat Modification System

TableModifications overlay a parent encounter table's species pool without altering the parent. A modification can add species not in the parent, remove species from the parent, or override a parent entry's weight.

## Overlay Semantics

Each ModificationEntry specifies one of three operations via its fields:

- **Remove:** `remove=true` excludes the parent species from the resolved pool.
- **Override:** `speciesName` matching a parent entry + `weight` replaces that entry's weight.
- **Add:** `speciesName` not in parent + `weight` introduces a new species to the pool.

## Density Multiplier

A modification carries a `densityMultiplier` that scales the parent table's density tier. This affects spawn count when generating Pokemon from the modified pool.

## Level Range Cascade

Level ranges resolve in priority order: entry-level override > modification-level override > table-level default. This cascade applies both to parent entries and modification entries when computing the [[resolved-entry-pool]].

## See also

- [[encounter-table-data-model]]
- [[resolved-entry-pool]]
- [[encounter-table-api]]
