# Habitat Pokemon Entries Table

A table on the [[habitat-detail-page]] under the heading "Pokemon Entries (N)" with a "+ Add Pokemon" button.

Columns:

- **Pokemon** — sprite image and species name
- **Weight** — editable number input (spinbutton) controlling encounter probability
- **Chance** — calculated percentage derived from the entry's weight divided by the total weight of all entries, color-coded: green for higher chances, pink/red for lower
- **Level Range** — two editable number inputs (min and max) for per-entry level overrides
- **Actions** — a "Remove" button (trash icon)

Entries are [[habitat-entries-sorted-by-weight-descending|sorted by weight descending]], so the most common species appear first.

The [[habitat-weight-determines-encounter-chance]] relationship means adjusting any entry's weight immediately recalculates all Chance percentages.

New entries are added via the [[habitat-add-pokemon-modal]]. Each entry links to a [[species-data-model-fields]] record by foreign key.

## See also

- [[entry-row-supports-inline-weight-and-level-editing]] — the component rendering each row
- [[encounter-table-entry-prevents-duplicate-species]] — a unique constraint prevents adding the same species twice
- [[store-does-optimistic-update-for-entry-weight]] — why weight edits feel instant
