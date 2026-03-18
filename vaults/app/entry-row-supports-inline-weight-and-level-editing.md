`EntryRow.vue` renders a single species entry as a row in the [[habitat-pokemon-entries-table]]. Each row shows: a species sprite, the species name, an editable weight number input, the calculated chance percentage, editable min/max level inputs (with the table's default range as placeholder text), and a remove button.

The component emits three events: `update-weight`, `update-level-range`, and `remove`. Weight changes debounce through a local handler before emitting. Level range inputs use the parent table's defaults as placeholders so the user sees what range applies when no override is set.

The chance percentage is calculated locally as `(entry.weight / totalWeight) * 100`, matching the logic described in [[habitat-weight-determines-encounter-chance]].

## See also

- [[use-table-editor-composable-orchestrates-editing-ui]] — receives the emitted events and routes them to store actions
- [[store-does-optimistic-update-for-entry-weight]] — how weight changes propagate
