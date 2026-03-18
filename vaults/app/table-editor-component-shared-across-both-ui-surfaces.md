`TableEditor.vue` is used by both `/gm/encounter-tables/:id` and `/gm/habitats/:id` pages. It accepts `tableId`, `backLink`, and `backLabel` props and exposes a `#header-actions` slot for page-specific buttons (e.g., the habitats page adds a delete button and inline generate button).

The component uses the [[use-table-editor-composable-orchestrates-editing-ui]] composable internally. It renders two main sections: a Pokemon entries list (using `EntryRow` for each entry) and a sub-habitats section (using `ModificationCard` for each modification). It also contains the modals for adding entries, adding/editing modifications, and editing table settings.

This is the core editing UI for encounter tables, regardless of which [[encounter-tables-have-two-parallel-ui-surfaces]] the user arrives from.
