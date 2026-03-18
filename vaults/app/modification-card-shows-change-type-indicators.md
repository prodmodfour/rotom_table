`ModificationCard.vue` renders a sub-habitat as a card within the [[habitat-sub-habitats]] section. Each modification entry in the card has a visual indicator: `+` for species added to the table, `-` for species removed, and an arrow for weight overrides.

The component uses an `isNewEntry()` helper that checks whether a modification entry's species name exists among the parent table's entries. If not found, the entry is treated as an addition; if found and `remove` is true, it's a removal; otherwise it's an override.

The card also contains an "Add Change" button that opens the [[habitat-add-modification-entry-modal]].

## See also

- [[store-resolves-entries-by-merging-parent-with-modification]] — the same add/override/remove logic in the store getter
