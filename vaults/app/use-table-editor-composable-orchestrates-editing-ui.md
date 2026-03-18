The `useTableEditor` composable takes a reactive `tableId` ref and provides everything the [[table-editor-component-shared-across-both-ui-surfaces]] needs: the loaded table, modal visibility flags (`showAddEntryModal`, `showAddModModal`, `showSettingsModal`, `showEditModModal`), form objects for each modal, and methods for all editing operations.

Editing methods: `addEntry` (resolves rarity preset to weight via `RARITY_WEIGHTS`), `removeEntry` (with `window.confirm()`), `updateEntryWeight`, `updateEntryLevelRange`, `addModification`, `editModification`, `saveModification`, `deleteModification`, `saveSettings`.

It auto-loads the table on mount and sets the page title. The composable sorts entries by weight descending via a `sortedEntries` computed.

Each mutation method calls the [[encounter-table-store-centralizes-state-and-api-calls]] and then reloads the full table from the API to stay in sync.

## See also

- [[habitat-add-pokemon-modal]] — driven by `newEntry` form state in this composable
- [[habitat-settings-modal]] — driven by `editSettings` form state in this composable
