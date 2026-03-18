# Resolved Entry Pool

The `getResolvedEntries` getter in the [[encounter-table-store]] computes the final species pool by merging a parent table's entries with an optional [[sub-habitat-modification-system|modification]] overlay.

## Algorithm

1. Start with all parent EncounterTableEntry records.
2. If a modification is specified, apply its entries: remove flagged species, override weights for matched species, add new species.
3. Tag each resolved entry with its `source`: `'parent'`, `'modification'` (overridden), or `'added'` (new from modification).
4. Apply the [[sub-habitat-modification-system|level range cascade]]: entry override > modification override > table default.

The companion `getTotalWeight` getter sums all resolved entry weights for the pool, used to display encounter probability percentages.

## Usage

The resolved pool drives both the [[encounter-table-components|TableEditor]] display and the [[encounter-generation-service]] when generating Pokemon from a table with a modification applied.

## See also

- [[encounter-table-store]]
- [[sub-habitat-modification-system]]
